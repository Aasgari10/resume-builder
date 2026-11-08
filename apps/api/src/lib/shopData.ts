// Changes a shop makes to its own content when orders come in (stock, discount-code use), and the
// sign-in of a shop's customers. A shop's products live inside the site content, which is stored
// twice: the published copy (what visitors see) and the owner's working copy (what the editor shows).
// Both are changed together so a later publish does not bring old stock numbers back.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { ResumeData } from "@rb/schema";
import { createSessionToken, verifySessionToken } from "./session";

export type StockItem = { id: string; size?: string | null; qty: number };

type Json = Prisma.JsonValue;

/**
 * Moves stock by `sign * qty` for each item (sign -1 sells, +1 gives back) and the use count of a
 * discount code by `couponDelta`. Returns the changed content and, when selling, the first product
 * that does not have enough left.
 */
export function adjustShop(content: Json | null, items: StockItem[], sign: -1 | 1, coupon?: string | null, couponDelta = 0): { data: Json | null; short?: string } {
  if (!content || typeof content !== "object") return { data: content };
  const data = structuredClone(content) as unknown as ResumeData;
  const shop = data.site?.shop;
  if (!shop) return { data: content };
  let short: string | undefined;
  for (const it of items) {
    const p = shop.products.find((x) => x.id === it.id);
    if (!p) continue;
    const v = it.size ? p.variants?.find((x) => x.key === it.size) : undefined;
    const holder: { stock?: number } | undefined = v && v.stock !== undefined ? v : p.stock !== undefined ? p : undefined;
    if (!holder) continue; // stock not tracked
    const next = holder.stock! + sign * it.qty;
    if (next < 0) short ??= it.size ? `${p.name} (${it.size})` : p.name;
    holder.stock = Math.max(0, next);
  }
  if (coupon && couponDelta) {
    const c = shop.coupons?.find((x) => x.code.trim().toUpperCase() === coupon.trim().toUpperCase());
    if (c) c.used = Math.max(0, (c.used ?? 0) + couponDelta);
  }
  return { data: data as unknown as Json, short };
}

/* ───────────── Customer passwords and sign-in ───────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function checkPassword(password: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64url");
  const got = scryptSync(password, Buffer.from(salt, "base64url"), want.length);
  return timingSafeEqual(want, got);
}

export const CUSTOMER_COOKIE = "rb_customer";

// Customer tokens are signed with a key of their own, so they can never pass as owner sessions.
const customerKey = (secret: string, siteId: string) => `${secret}:shop-customer:${siteId}`;
export const customerToken = (customerId: string, siteId: string, secret: string) => createSessionToken(customerId, customerKey(secret, siteId));
export const customerFromToken = (token: string, siteId: string, secret: string) => verifySessionToken(token, customerKey(secret, siteId));
