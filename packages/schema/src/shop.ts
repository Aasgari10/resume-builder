// Shared shop rules: what a cart holds, how an order's total is worked out, and what a customer
// sends at checkout. Used by the shop templates (to show the cart), the API (to take orders) and
// the editor (to preview the cart), so all three always agree on prices.

import { z } from "zod";
import type { Product, Shop } from "./resume.schema";

/** One cart line: a product, how many, and the chosen size if the product has sizes. */
export type CartLine = { id: string; qty: number; size?: string };

/** What the visitor of a shop has chosen. Kept in a cookie on published sites, in memory in the editor. */
export type Visitor = {
  cart: CartLine[];
  wishlist: string[];
  /** Query string of the page (search words, order code). */
  query: Record<string, string>;
};

export const emptyVisitor = (): Visitor => ({ cart: [], wishlist: [], query: {} });

export const CART_LIMITS = { lines: 30, qty: 20, wishlist: 100 } as const;

/** The price a product sells for now. */
export const unitPrice = (p: Pick<Product, "price" | "salePrice">) =>
  p.salePrice !== undefined && p.salePrice < p.price ? p.salePrice : p.price;

export type PricedLine = CartLine & { product: Product; unit: number; total: number };

/**
 * Cart lines matched with the shop's products, with prices from the shop itself (never from the
 * visitor). Lines whose product was removed, hidden or sold out are dropped.
 */
export function priceCart(shop: Pick<Shop, "products" | "shippingFee" | "freeShippingFrom"> | undefined, cart: CartLine[]) {
  const products = new Map((shop?.products ?? []).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const line of cart.slice(0, CART_LIMITS.lines)) {
    const product = products.get(line.id);
    if (!product || product.hidden || product.stock === 0) continue;
    const qty = Math.max(1, Math.min(CART_LIMITS.qty, Math.floor(line.qty), product.stock ?? Infinity));
    const size = product.sizes?.length ? (line.size && product.sizes.includes(line.size) ? line.size : product.sizes[0]) : undefined;
    const unit = unitPrice(product);
    lines.push({ id: product.id, qty, size, product, unit, total: unit * qty });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const free = !shop?.shippingFee || (shop.freeShippingFrom !== undefined && shop.freeShippingFrom > 0 && subtotal >= shop.freeShippingFrom);
  const shipping = lines.length === 0 || free ? 0 : (shop?.shippingFee ?? 0);
  return { lines, subtotal, shipping, total: subtotal + shipping, count: lines.reduce((n, l) => n + l.qty, 0) };
}

/** Adds, changes or removes a cart line (same product and size count as one line). */
export function changeCart(cart: CartLine[], op: "add" | "set" | "remove", id: string, qty = 1, size?: string): CartLine[] {
  const same = (l: CartLine) => l.id === id && (l.size ?? "") === (size ?? "");
  if (op === "remove") return cart.filter((l) => !same(l));
  const found = cart.find(same);
  if (found) {
    const next = op === "add" ? found.qty + qty : qty;
    return next <= 0 ? cart.filter((l) => !same(l)) : cart.map((l) => (same(l) ? { ...l, qty: Math.min(CART_LIMITS.qty, next) } : l));
  }
  if (qty <= 0) return cart;
  return [...cart, { id, qty: Math.min(CART_LIMITS.qty, qty), ...(size ? { size } : {}) }].slice(-CART_LIMITS.lines);
}

export const toggleWishlist = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(-CART_LIMITS.wishlist);

/** What a customer fills in at checkout. */
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "نام را وارد کنید").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+98|0)?9\d{9}$/, "شماره‌ی موبایل درست نیست")),
  city: z.string().trim().max(60).optional(),
  address: z.string().trim().min(5, "نشانی را کامل بنویسید").max(400),
  postalCode: z.string().trim().max(20).optional(),
  note: z.string().trim().max(400).optional(),
});
export type Checkout = z.infer<typeof checkoutSchema>;

export const SHOP_ORDER_STATUSES = ["NEW", "CONFIRMED", "SENT", "DONE", "CANCELED"] as const;
export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];
export const SHOP_ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  NEW: "سفارش تازه",
  CONFIRMED: "تأیید شد",
  SENT: "ارسال شد",
  DONE: "تحویل شد",
  CANCELED: "لغو شد",
};

/** Whole tomans with digit grouping, in the page's language. */
export const formatToman = (n: number, locale: "fa" | "en" = "fa") =>
  `${new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n)} ${locale === "fa" ? "تومان" : "Toman"}`;
