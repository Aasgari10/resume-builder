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
  variantKey,
  variantOf,
  slotKey,
  todayTehran,
  type CartLine,
  type Visitor,
} from "@rb/schema";
import { Prisma } from "@prisma/client";
import { getTemplate } from "@rb/templates";
import { prisma } from "../db";
import { env } from "../env";
import { asyncHandler } from "../lib/http";
import { readCookie } from "../lib/session";
import { CUSTOMER_COOKIE, adjustShop, checkPassword, customerFromToken, customerToken, hashPassword } from "../lib/shopData";
import { subdomainFromHost, validateSubdomain } from "../lib/subdomain";

export const shopRouter = Router();
const form = express.urlencoded({ extended: false, limit: "20kb", parameterLimit: 30 });

const COOKIE = "rb_shop";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/* ───────────── Visitor cookie ───────────── */

type Stored = { c: [string, number, string?][]; w: string[]; k?: string };

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
    if (typeof stored.k === "string" && stored.k) visitor.coupon = stored.k.slice(0, 30);
  } catch {
    /* a broken cookie is simply ignored */
  }
  return visitor;
}

function writeVisitor(res: Response, base: string, cart: CartLine[], wishlist: string[], coupon?: string) {
  const stored: Stored = { c: cart.map((l) => [l.id, l.qty, ...(l.size ? [l.size] : [])] as [string, number, string?]), w: wishlist, ...(coupon ? { k: coupon } : {}) };
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
  if (!data.success || !theme.success) return null;
  const template = getTemplate(theme.data.templateId);
  if (!template.shop) return null;
  return { site, shop: data.data.site?.shop, menuSite: Boolean(template.menu || template.services) };
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
  // A menu site (cafe) or a salon sells only the categories marked "sold online"; the rest of its menu is for reading.
  const sold = (p: { categoryId?: string }) => !found.menuSite || Boolean(found.shop?.categories.some((c) => c.id === p.categoryId && c.sell));
  const product = found.shop?.products.find((p) => p.id === id && !p.hidden && !p.trashed && sold(p));
  const visitor = readVisitor(req);
  let { cart, wishlist, coupon } = visitor;
  // Set when something went into the cart: the page shown next says so (?added=<product id>).
  let added: string | undefined;
  if (body.op === "coupon") {
    // Applying (or clearing) a discount code; it is checked again when the order is placed.
    coupon = String(body.code ?? "").trim().slice(0, 30) || undefined;
  } else if (product) {
    const qty = Math.max(0, Math.min(CART_LIMITS.qty, Math.floor(Number(body.qty ?? 1)) || 0));
    // Choices come as opt0/opt1 from the product page, or as the stored key from the cart.
    const picked = body.opt0 ? variantKey([body.opt0, body.opt1].map((x) => x?.trim().slice(0, 30))) : body.size?.trim().slice(0, 70);
    const size = picked || undefined;
    if (body.op === "add" && variantOf(product, size).stock !== 0) {
      cart = changeCart(cart, "add", id, Math.max(1, qty), size);
      added = id;
    }
    else if (body.op === "set") cart = changeCart(cart, "set", id, qty, size);
    else if (body.op === "remove") cart = changeCart(cart, "remove", id, 0, size);
    else if (body.op === "wish") wishlist = toggleWishlist(wishlist, id);
  }
  writeVisitor(res, base, cart, wishlist, coupon);
  res.redirect(303, to(base, back) + (added && back !== "/cart" ? `?added=${encodeURIComponent(added)}` : ""));
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
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return void fail(parsed.error.issues[0]?.message ?? "اطلاعات فرم کامل نیست.");
  if (tooMany(req.ip ?? "unknown")) return void fail("تعداد سفارش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.");
  const customerId = await signedInCustomer(req, found.site.id);

  // One order at a time per shop: the site row is locked while stock is checked and taken.
  let result: { code: string } | { error: string };
  try {
    result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Site" WHERE id = ${found.site.id} FOR UPDATE`;
      const site = await tx.site.findUniqueOrThrow({ where: { id: found.site.id }, include: { resume: { select: { id: true, data: true } } } });
      const live = resumeDataSchema.safeParse(site.publishedData);
      if (!live.success) return { error: "فروشگاه در دسترس نیست." };
      const priced = priceCart(live.data.site?.shop, visitor.cart, visitor.coupon);
      if (priced.lines.length === 0) return { error: "سبد خرید خالی است." };
      if (priced.couponError) return { error: priced.couponError };
      const items = priced.lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty }));
      const published = adjustShop(site.publishedData, items, -1, priced.coupon, 1);
      if (published.short) return { error: `موجودی «${published.short}» کافی نیست؛ تعداد را کم کنید.` };
      const draft = adjustShop(site.resume.data, items, -1, priced.coupon, 1);
      await tx.site.update({ where: { id: site.id }, data: { publishedData: published.data as Prisma.InputJsonValue } });
      await tx.resume.update({ where: { id: site.resume.id }, data: { data: draft.data as Prisma.InputJsonValue } });
      const order = await tx.shopOrder.create({
        data: {
          siteId: site.id,
          code: await newCode(),
          customerName: parsed.data.name,
          phone: parsed.data.phone,
          city: parsed.data.city || null,
          address: parsed.data.address,
          postalCode: parsed.data.postalCode || null,
          note: parsed.data.note || null,
          items: priced.lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size ?? null, qty: l.qty, unit: l.unit, total: l.total })),
          subtotal: priced.subtotal,
          discount: priced.discount,
          couponCode: priced.coupon ?? null,
          shipping: priced.shipping,
          total: priced.total,
          customerId,
        },
      });
      return { code: order.code };
    });
  } catch (err) {
    console.error("Order failed", err);
    result = { error: "ثبت سفارش انجام نشد؛ دوباره امتحان کنید." };
  }
  if ("error" in result) return void fail(result.error);
  writeVisitor(res, base, [], visitor.wishlist);
  res.redirect(303, `${to(base, "/thanks")}?code=${result.code}`);
}

/* ───────────── Customer accounts ───────────── */

const account = (base: string, msg: string, error = false, page = "/account") => `${to(base, page)}?${error ? "error" : "msg"}=${encodeURIComponent(msg)}`;
/** Pages an account form may come back to (the support page sends its own forms there). */
const BACK_PAGES = ["/account", "/support/tickets"];
const mobile = (v: string | undefined) => (v ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[\s-]/g, "").replace(/^\+98/, "0");

/** The signed-in customer's id for this shop, if the cookie is valid. */
async function signedInCustomer(req: Request, siteId: string): Promise<string | null> {
  const token = readCookie(req.headers.cookie, CUSTOMER_COOKIE);
  return token ? customerFromToken(token, siteId, env.sessionSecret) : null;
}

function setCustomer(res: Response, base: string, token: string | null) {
  if (!token) return void res.clearCookie(CUSTOMER_COOKIE, { path: base || "/" });
  res.cookie(CUSTOMER_COOKIE, token, { path: base || "/", maxAge: MAX_AGE, httpOnly: true, sameSite: "lax", secure: env.isProd });
}

async function accountAction(req: Request, res: Response, subdomain: string, base: string) {
  const found = await findShop(subdomain);
  if (!found) return void res.status(404).end();
  const siteId = found.site.id;
  const body = req.body as Record<string, string | undefined>;
  const op = body.op;
  const go = (path: string) => res.redirect(303, path);
  const text = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
  const home = BACK_PAGES.includes(body.back ?? "") ? body.back! : "/account";

  if (op === "register" || op === "login") {
    if (tooMany(`acct:${req.ip}`)) return go(account(base, "تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.", true, home));
    const phone = mobile(body.phone);
    if (!/^09\d{9}$/.test(phone)) return go(account(base, "شماره‌ی موبایل درست نیست.", true, home));
    const password = body.password ?? "";
    if (op === "register") {
      const name = text(body.name, 80);
      if (name.length < 2) return go(account(base, "نام را وارد کنید.", true, home));
      if (password.length < 6) return go(account(base, "رمز باید دست‌کم ۶ نویسه باشد.", true, home));
      const exists = await prisma.shopCustomer.findUnique({ where: { siteId_phone: { siteId, phone } } });
      if (exists) return go(account(base, exists.deletedAt ? "این حساب غیرفعال شده است؛ با فروشگاه تماس بگیرید." : "با این شماره قبلاً ثبت‌نام شده است؛ وارد شوید.", true, home));
      const c = await prisma.shopCustomer.create({ data: { siteId, name, phone, passwordHash: hashPassword(password) } });
      setCustomer(res, base, customerToken(c.id, siteId, env.sessionSecret));
      return go(account(base, "ثبت‌نام انجام شد؛ خوش آمدید!", false, home));
    }
    const c = await prisma.shopCustomer.findUnique({ where: { siteId_phone: { siteId, phone } } });
    // A customer in the shop's trash cannot sign in (the same answer as a wrong password).
    if (!c || c.deletedAt || !checkPassword(password, c.passwordHash)) return go(account(base, "شماره یا رمز درست نیست.", true, home));
    setCustomer(res, base, customerToken(c.id, siteId, env.sessionSecret));
    return go(to(base, home));
  }

  const customerId = await signedInCustomer(req, siteId);
  if (!customerId) return go(account(base, "اول وارد حساب خود شوید.", true, home));
  if (op === "logout") {
    setCustomer(res, base, null);
    return go(to(base, "/"));
  }
  const customer = await prisma.shopCustomer.findFirst({ where: { id: customerId, siteId, deletedAt: null } });
  if (!customer) {
    setCustomer(res, base, null);
    return go(to(base, "/account"));
  }

  if (op === "address-add" || op === "address-remove") {
    const list = (Array.isArray(customer.addresses) ? customer.addresses : []) as { id: string }[];
    const next =
      op === "address-remove"
        ? list.filter((a) => a.id !== body.id)
        : [...list, { id: randomInt(1e9).toString(36), title: text(body.title, 40), city: text(body.city, 60), address: text(body.address, 400), postalCode: text(body.postalCode, 20) }].slice(-10);
    if (op === "address-add" && !text(body.address, 400)) return go(account(base, "نشانی را وارد کنید.", true, home));
    await prisma.shopCustomer.update({ where: { id: customer.id }, data: { addresses: next as Prisma.InputJsonValue } });
    return go(account(base, op === "address-add" ? "نشانی ذخیره شد." : "نشانی حذف شد.", false, home));
  }

  if (op === "review") {
    const productId = text(body.productId, 40);
    const back = `${to(base, `/product/${encodeURIComponent(productId)}`)}`;
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 0)));
    const comment = text(body.text, 1000);
    if (!found.shop?.products.some((p) => p.id === productId) || comment.length < 3) return go(`${back}?error=${encodeURIComponent("متن نظر را بنویسید.")}`);
    const recent = await prisma.shopReview.count({ where: { siteId, customerId: customer.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
    if (recent >= 5) return go(`${back}?error=${encodeURIComponent("نظرهای زیادی ثبت کرده‌اید؛ کمی بعد دوباره امتحان کنید.")}`);
    const auto = Boolean(found.shop?.reviewsAutoApprove);
    await prisma.shopReview.create({ data: { siteId, productId, customerId: customer.id, rating, text: comment, approved: auto } });
    return go(`${back}?msg=${encodeURIComponent(auto ? "نظر شما ثبت شد. ممنون!" : "نظر شما ثبت شد و پس از تأیید فروشگاه نمایش داده می‌شود.")}`);
  }

  if (op === "ticket-close") {
    const ticket = await prisma.shopTicket.findFirst({ where: { id: text(body.ticketId, 40), siteId, customerId: customer.id, deletedAt: null } });
    if (ticket && ticket.status !== "CLOSED") await prisma.shopTicket.update({ where: { id: ticket.id }, data: { status: "CLOSED" } });
    return go(account(base, "تیکت بسته شد.", false, home));
  }
  if (op === "ticket-new" || op === "ticket-reply") {
    const message = text(body.text, 2000);
    if (message.length < 2) return go(account(base, "متن پیام را بنویسید.", true, home));
    const entry = { from: "customer", text: message, at: new Date().toISOString() };
    if (op === "ticket-new") {
      const open = await prisma.shopTicket.count({ where: { siteId, customerId: customer.id, deletedAt: null, status: { not: "CLOSED" } } });
      if (open >= 10) return go(account(base, "تیکت‌های باز زیادی دارید.", true, home));
      await prisma.shopTicket.create({ data: { siteId, customerId: customer.id, subject: text(body.subject, 120) || "بدون عنوان", messages: [entry] } });
      return go(account(base, "تیکت شما ثبت شد.", false, home));
    }
    const ticket = await prisma.shopTicket.findFirst({ where: { id: text(body.ticketId, 40), siteId, customerId: customer.id, deletedAt: null } });
    if (!ticket || ticket.status === "CLOSED") return go(account(base, "این تیکت بسته شده است.", true, home));
    const messages = [...((ticket.messages as unknown[]) ?? []), entry].slice(-100);
    await prisma.shopTicket.update({ where: { id: ticket.id }, data: { messages: messages as Prisma.InputJsonValue, status: "OPEN" } });
    return go(account(base, "پیام شما ارسال شد.", false, home));
  }
  return go(to(base, "/account"));
}

/* ───────────── What a page needs to know about the visitor ───────────── */

/**
 * Cart and wishlist (cookie) plus, for shop pages, the signed-in customer with their orders,
 * addresses and tickets, product ratings, and the approved comments of the product on screen.
 */
/**
 * Places already taken from today on, by "yyyy-mm-dd hh:mm" (canceled bookings free theirs): one per
 * booking, or its number of guests when the capacity is in seats (a restaurant).
 */
export async function takenSlots(siteId: string, seats = false): Promise<Record<string, number>> {
  const rows = await prisma.siteMessage.findMany({
    where: { siteId, kind: "BOOKING", deletedAt: null, status: { not: "CANCELED" }, date: { gte: todayTehran() }, time: { not: null } },
    select: { date: true, time: true, guests: true },
    take: 20000,
  });
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = slotKey(r.date!, r.time!);
    out[key] = (out[key] ?? 0) + (seats ? Math.max(1, r.guests ?? 1) : 1);
  }
  return out;
}

export async function loadVisitor(req: Request, siteId: string, page: string, schedule?: { seats?: boolean }): Promise<Visitor> {
  const visitor = readVisitor(req);
  if (schedule) visitor.taken = await takenSlots(siteId, Boolean(schedule.seats));
  const reviews = await prisma.shopReview.findMany({ where: { siteId, approved: true, deletedAt: null }, select: { productId: true, rating: true } });
  const ratings: Record<string, { avg: number; count: number }> = {};
  for (const r of reviews) {
    const x = (ratings[r.productId] ??= { avg: 0, count: 0 });
    x.avg = (x.avg * x.count + r.rating) / (x.count + 1);
    x.count += 1;
  }
  visitor.ratings = ratings;
  const productId = page.startsWith("/product/") ? decodeURIComponent(page.slice(9)) : null;
  if (productId) {
    const list = await prisma.shopReview.findMany({ where: { siteId, productId, approved: true, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 30, include: { customer: { select: { name: true } } } });
    visitor.reviews = list.map((r) => ({ id: r.id, name: r.customer.name, rating: r.rating, text: r.text, reply: r.reply ?? undefined, at: r.createdAt.toISOString() }));
  }
  const customerId = await signedInCustomer(req, siteId);
  if (customerId) {
    const c = await prisma.shopCustomer.findFirst({ where: { id: customerId, siteId, deletedAt: null } });
    if (c) {
      visitor.customer = { id: c.id, name: c.name, phone: c.phone };
      if (page === "/account" || page === "/checkout" || page === "/support/tickets") {
        const [orders, tickets] = await Promise.all([
          prisma.shopOrder.findMany({ where: { siteId, customerId: c.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 50 }),
          prisma.shopTicket.findMany({ where: { siteId, customerId: c.id, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 30 }),
        ]);
        visitor.account = {
          addresses: (Array.isArray(c.addresses) ? c.addresses : []) as NonNullable<Visitor["account"]>["addresses"],
          orders: orders.map((o) => ({ code: o.code, status: o.status, total: o.total, at: o.createdAt.toISOString(), items: (o.items as { name: string; size?: string | null; qty: number }[]).map((i) => ({ name: i.name, size: i.size ?? undefined, qty: i.qty })) })),
          tickets: tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, messages: t.messages as NonNullable<Visitor["account"]>["tickets"][number]["messages"] })),
        };
      }
    }
  }
  return visitor;
}

/* ───────────── Routes ───────────── */

const handlers = { _cart: cartAction, _order: placeOrder, _account: accountAction } as const;

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
