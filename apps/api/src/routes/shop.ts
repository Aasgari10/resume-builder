// Cart, wishlist and orders on published shop sites. The pages have no scripts, so every button
// is a small form: the server updates the visitor's cookie (or saves the order) and sends the
// browser back to a page. Prices always come from the published products, never from the visitor.

import { randomInt } from "node:crypto";
import express, { Router, type Request, type Response } from "express";
import {
  CART_LIMITS,
  changeCart,
  checkoutSchema,
  emptyVisitor,
  priceCart,
  resumeDataSchema,
  themeSchema,
  toggleWishlist,
  type CartLine,
  type Visitor,
} from "@rb/schema";
import { getTemplate } from "@rb/templates";
import { prisma } from "../db";
import { env } from "../env";
import { asyncHandler } from "../lib/http";
import { readCookie } from "../lib/session";
import { subdomainFromHost, validateSubdomain } from "../lib/subdomain";

export const shopRouter = Router();
const form = express.urlencoded({ extended: false, limit: "20kb", parameterLimit: 30 });

const COOKIE = "rb_shop";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/* ───────────── Visitor cookie ───────────── */

type Stored = { c: [string, number, string?][]; w: string[] };

/** Reads the cart and wishlist from the cookie; anything malformed counts as empty. */
export function readVisitor(req: Request): Visitor {
  const visitor = emptyVisitor();
  for (const [k, v] of Object.entries(req.query)) if (typeof v === "string" && v.length <= 200) visitor.query[k] = v;
  const raw = readCookie(req.headers.cookie, COOKIE);
  if (!raw) return visitor;
  try {
    const stored = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Stored;
    if (Array.isArray(stored.c))
      visitor.cart = stored.c
        .slice(0, CART_LIMITS.lines)
        .filter((l) => Array.isArray(l) && typeof l[0] === "string" && Number.isFinite(l[1]))
        .map(([id, qty, size]) => ({ id: id.slice(0, 40), qty: Math.max(1, Math.min(CART_LIMITS.qty, Math.floor(qty))), ...(typeof size === "string" && size ? { size: size.slice(0, 20) } : {}) }));
    if (Array.isArray(stored.w)) visitor.wishlist = stored.w.filter((x) => typeof x === "string").slice(0, CART_LIMITS.wishlist).map((x) => x.slice(0, 40));
  } catch {
    /* a broken cookie is simply ignored */
  }
  return visitor;
}

function writeVisitor(res: Response, base: string, cart: CartLine[], wishlist: string[]) {
  const stored: Stored = { c: cart.map((l) => [l.id, l.qty, ...(l.size ? [l.size] : [])] as [string, number, string?]), w: wishlist };
  res.cookie(COOKIE, Buffer.from(JSON.stringify(stored)).toString("base64url"), {
    path: base || "/",
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd, // HTTPS only in production
  });
}

/* ───────────── Site lookup ───────────── */

/** The published shop behind this request, or null (not found, not published, or not a shop). */
async function findShop(rawSubdomain: string) {
  const check = validateSubdomain(rawSubdomain);
  if (!check.ok) return null;
  const site = await prisma.site.findUnique({ where: { subdomain: check.value } });
  if (!site?.isPublished) return null;
  const data = resumeDataSchema.safeParse(site.publishedData);
  const theme = themeSchema.safeParse(site.publishedTheme);
  if (!data.success || !theme.success || !getTemplate(theme.data.templateId).shop) return null;
  return { site, shop: data.data.site?.shop };
}

/** A page path inside the site to come back to; anything odd falls back to the home page. */
function backPath(raw: unknown): string {
  const path = typeof raw === "string" ? raw : "/";
  return /^\/[\w\-/%]*$/.test(path) && !path.startsWith("//") && path.length < 200 ? path : "/";
}
const to = (base: string, path: string) => (path === "/" ? base || "/" : base + path);

/* ───────────── Cart and wishlist ───────────── */

async function cartAction(req: Request, res: Response, subdomain: string, base: string) {
  const found = await findShop(subdomain);
  if (!found) return void res.status(404).end();
  const body = req.body as Record<string, string | undefined>;
  const back = backPath(body.back);
  const id = String(body.id ?? "").slice(0, 40);
  const product = found.shop?.products.find((p) => p.id === id && !p.hidden);
  const visitor = readVisitor(req);
  let { cart, wishlist } = visitor;
  if (product) {
    const qty = Math.max(0, Math.min(CART_LIMITS.qty, Math.floor(Number(body.qty ?? 1)) || 0));
    const size = body.size?.trim() ? body.size.trim().slice(0, 20) : undefined;
    if (body.op === "add" && product.stock !== 0) cart = changeCart(cart, "add", id, Math.max(1, qty), size ?? product.sizes?.[0]);
    else if (body.op === "set") cart = changeCart(cart, "set", id, qty, size);
    else if (body.op === "remove") cart = changeCart(cart, "remove", id, 0, size);
    else if (body.op === "wish") wishlist = toggleWishlist(wishlist, id);
  }
  writeVisitor(res, base, cart, wishlist);
  res.redirect(303, to(base, back));
}

/* ───────────── Orders ───────────── */

// A simple guard against floods: at most 8 orders per visitor address per hour.
const recent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (list.length >= 8) return true;
  list.push(now);
  recent.set(ip, list);
  if (recent.size > 5000) recent.clear();
  return false;
}

async function newCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = `${randomInt(100, 999)}${randomInt(1000, 9999)}`;
    if (!(await prisma.shopOrder.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
  return `${Date.now()}`.slice(-9);
}

async function placeOrder(req: Request, res: Response, subdomain: string, base: string) {
  const found = await findShop(subdomain);
  if (!found) return void res.status(404).end();
  const fail = (message: string) => res.redirect(303, `${to(base, "/checkout")}?error=${encodeURIComponent(message)}`);
  const body = req.body as Record<string, string | undefined>;
  if (body.website) return void res.redirect(303, to(base, "/thanks")); // spam robot: pretend it worked
  const visitor = readVisitor(req);
  const priced = priceCart(found.shop, visitor.cart);
  if (priced.lines.length === 0) return void fail("سبد خرید خالی است.");
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return void fail(parsed.error.issues[0]?.message ?? "اطلاعات فرم کامل نیست.");
  if (tooMany(req.ip ?? "unknown")) return void fail("تعداد سفارش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.");

  const order = await prisma.shopOrder.create({
    data: {
      siteId: found.site.id,
      code: await newCode(),
      customerName: parsed.data.name,
      phone: parsed.data.phone,
      city: parsed.data.city || null,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode || null,
      note: parsed.data.note || null,
      items: priced.lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size ?? null, qty: l.qty, unit: l.unit, total: l.total })),
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    },
  });
  writeVisitor(res, base, [], visitor.wishlist);
  res.redirect(303, `${to(base, "/thanks")}?code=${order.code}`);
}

/* ───────────── Routes ───────────── */

const handlers = { _cart: cartAction, _order: placeOrder } as const;

for (const [name, handler] of Object.entries(handlers)) {
  // Path-based access: /s/<subdomain>/_cart
  shopRouter.post(
    `/s/:subdomain/${name}`,
    form,
    asyncHandler(async (req, res) => {
      const subdomain = req.params.subdomain!;
      await handler(req, res, subdomain, `/s/${encodeURIComponent(subdomain)}`);
    }),
  );
  // Host-based access: <subdomain>.<ROOT_DOMAIN>/_cart
  shopRouter.post(
    `/${name}`,
    form,
    asyncHandler(async (req, res, next) => {
      const subdomain = subdomainFromHost(req.headers.host, env.rootDomain);
      if (!subdomain) return next();
      await handler(req, res, subdomain, "");
    }),
  );
}
