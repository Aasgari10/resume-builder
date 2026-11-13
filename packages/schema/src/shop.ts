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
  /** Discount code typed in the cart (checked again when the order is placed). */
  coupon?: string;
  /** The signed-in customer of this shop, if any. */
  customer?: { id: string; name: string; phone: string };
  /** The signed-in customer's own records (account and checkout pages). */
  account?: {
    addresses: { id: string; title?: string; city?: string; address: string; postalCode?: string }[];
    orders: { code: string; status: ShopOrderStatus; total: number; at: string; items: { name: string; size?: string; qty: number }[] }[];
    tickets: { id: string; subject: string; status: "OPEN" | "ANSWERED" | "CLOSED"; messages: { from: "customer" | "shop"; text: string; at: string }[] }[];
  };
  /** Average rating and number of approved comments per product. */
  ratings?: Record<string, { avg: number; count: number }>;
  /** Approved comments of the product on screen. */
  reviews?: { id: string; name: string; rating: number; text: string; reply?: string; at: string }[];
  /** Booking templates: appointments already taken in the booking window, by "yyyy-mm-dd hh:mm". */
  taken?: Record<string, number>;
  /** The signed-in customer's bookings (newest first). */
  bookings?: BookingView[];
  /** The booking looked up on the tracking page by its code and phone (null: not found). */
  tracked?: BookingView | null;
};

/** A booking as its visitor sees it (account and tracking pages). */
export type BookingView = { code: string; date?: string; time?: string; service?: string; guests?: number; status: "NEW" | "SEEN" | "CONFIRMED" | "DONE" | "CANCELED"; at: string };

export const emptyVisitor = (): Visitor => ({ cart: [], wishlist: [], query: {} });

export const CART_LIMITS = { lines: 30, qty: 20, wishlist: 100 } as const;

/** Whether a timed sale has already ended (a sale without an end date never ends). */
export const saleEnded = (p: Pick<Product, "saleEndsAt">, now = Date.now()) => {
  const end = p.saleEndsAt ? Date.parse(p.saleEndsAt) : NaN;
  return Number.isFinite(end) && end <= now;
};

/** The price a customer pays now: the sale price while the sale lasts, otherwise the regular price. */
export const unitPrice = (p: Pick<Product, "price" | "salePrice" | "saleEndsAt">) =>
  p.salePrice !== undefined && p.salePrice < p.price && !saleEnded(p) ? p.salePrice : p.price;

type Option = NonNullable<Product["options"]>[number];
type Coupon = NonNullable<Shop["coupons"]>[number];

/** A product's choices: its own options, or the older single list of sizes. */
export function productOptions(p: Pick<Product, "options" | "sizes" | "optionLabel">): Option[] {
  if (p.options?.length) return p.options.filter((o) => o.values.length);
  return p.sizes?.length ? [{ name: p.optionLabel || "سایز", values: p.sizes.map((label) => ({ label })) }] : [];
}

/** The key of one combination, e.g. "مشکی / 16GB". */
export const variantKey = (labels: (string | undefined)[]) => labels.filter(Boolean).join(" / ");

/** Every combination of the product's options (empty when it has none). */
export function allVariantKeys(p: Pick<Product, "options" | "sizes" | "optionLabel">): string[] {
  const opts = productOptions(p);
  if (!opts.length) return [];
  return opts.reduce<string[][]>((acc, o) => acc.flatMap((a) => o.values.map((v) => [...a, v.label])), [[]]).map(variantKey);
}

/** Price and stock of one combination (falling back to the product's own). */
export function variantOf(p: Product, key: string | undefined) {
  const v = key ? p.variants?.find((x) => x.key === key) : undefined;
  const regular = v?.price ?? p.price;
  // A sale on the product takes the same share off every combination.
  const onSale = p.salePrice !== undefined && p.salePrice < p.price && !saleEnded(p);
  const unit = onSale ? Math.round((regular * p.salePrice!) / p.price) : regular;
  return { regular, unit, stock: v?.stock ?? p.stock };
}

export type PricedLine = CartLine & { product: Product; unit: number; total: number };

/** Why a discount code does not apply (or null when it does). */
/** Whether a discount code covers a product (codes without a product or category list cover all). */
export const couponCovers = (c: Pick<Coupon, "productIds" | "categoryIds">, p: Pick<Product, "id" | "categoryId">) =>
  (!c.productIds?.length && !c.categoryIds?.length) || Boolean(c.productIds?.includes(p.id)) || Boolean(p.categoryId && c.categoryIds?.includes(p.categoryId));

/** Why a code can not be used on a cart whose covered goods come to `subtotal`, or null. */
export function couponProblem(c: Coupon | undefined, subtotal: number, now = Date.now()): string | null {
  if (!c || c.active === false) return "کد تخفیف معتبر نیست.";
  if (c.startsAt && Date.parse(c.startsAt) > now) return "این کد تخفیف هنوز فعال نشده است.";
  if (c.endsAt && Date.parse(c.endsAt) <= now) return "مهلت این کد تخفیف تمام شده است.";
  if (c.usageLimit !== undefined && (c.used ?? 0) >= c.usageLimit) return "ظرفیت استفاده از این کد تمام شده است.";
  if (c.minTotal && subtotal < c.minTotal) return `این کد برای خریدهای بالای ${formatToman(c.minTotal)} است.`;
  return null;
}

export const findCoupon = (shop: Pick<Shop, "coupons"> | undefined, code: string | undefined) => {
  const want = (code ?? "").trim().toUpperCase();
  return want ? shop?.coupons?.find((c) => c.code.trim().toUpperCase() === want) : undefined;
};

/**
 * Cart lines matched with the shop's products, with prices from the shop itself (never from the
 * visitor). Lines whose product was removed, hidden or sold out are dropped. A discount code, if
 * given and valid, is taken off the goods (not the shipping).
 */
export function priceCart(shop: Pick<Shop, "products" | "shippingFee" | "freeShippingFrom" | "coupons"> | undefined, cart: CartLine[], couponCode?: string) {
  const products = new Map((shop?.products ?? []).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const line of cart.slice(0, CART_LIMITS.lines)) {
    const product = products.get(line.id);
    if (!product || product.hidden || product.trashed) continue;
    const keys = allVariantKeys(product);
    const size = keys.length ? (line.size && keys.includes(line.size) ? line.size : keys[0]) : undefined;
    const v = variantOf(product, size);
    if (v.stock === 0) continue;
    const qty = Math.max(1, Math.min(CART_LIMITS.qty, Math.floor(line.qty), v.stock ?? Infinity));
    lines.push({ id: product.id, qty, size, product, unit: v.unit, total: v.unit * qty });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const coupon = findCoupon(shop, couponCode);
  // A code limited to some products or categories counts only those goods.
  const covered = coupon ? lines.filter((l) => couponCovers(coupon, l.product)).reduce((sum, l) => sum + l.total, 0) : 0;
  const couponError = !couponCode?.trim() ? null : coupon && lines.length && !covered ? "این کد تخفیف برای کالاهای سبد شما نیست." : couponProblem(coupon, covered);
  let discount = 0;
  if (coupon && !couponError) {
    discount = coupon.percent ? Math.floor((covered * coupon.percent) / 100) : (coupon.amount ?? 0);
    if (coupon.percent && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, covered);
  }
  const goods = subtotal - discount;
  const free = !shop?.shippingFee || (shop.freeShippingFrom !== undefined && shop.freeShippingFrom > 0 && goods >= shop.freeShippingFrom);
  const shipping = lines.length === 0 || free ? 0 : (shop?.shippingFee ?? 0);
  return {
    lines,
    subtotal,
    discount,
    coupon: discount > 0 ? coupon!.code : undefined,
    couponError,
    shipping,
    total: goods + shipping,
    count: lines.reduce((n, l) => n + l.qty, 0),
  };
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
