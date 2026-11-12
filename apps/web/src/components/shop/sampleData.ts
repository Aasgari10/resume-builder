// Sample shop activity: customers, a year of orders, comments and support tickets, made up in the
// browser from the shop's own products. A new shop shows these in its manager until its first real
// customer or order arrives, and the editor's preview uses the same sample for the customer's side
// (signing in, ordering, tickets, comments), so the owner can try the shop from both sides.
// Nothing here is sent to the server: the sample lives in this browser only (no other user sees
// it), survives a page reload, and starts fresh after 30 minutes away or with "start again".

import { allVariantKeys, priceCart, type CartLine, type Product, type Shop, type ShopOrderStatus, type Visitor } from "@rb/schema";
import type { ShopCustomer, ShopCustomerDetail, ShopOrder, ShopOrderQuery, ShopProductStat, ShopReview, ShopSummary, ShopTicket, ShopTrash, ShopTrashKind } from "../../api";

/* ───────────── A repeatable random source ───────────── */

let seed = 1402;
const reseed = () => {
  seed = 1402;
};
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
const chance = (p: number) => rand() < p;
function weighted<T>(list: readonly T[], weight: (x: T) => number): T {
  const total = list.reduce((s, x) => s + weight(x), 0);
  let r = rand() * total;
  for (const x of list) if ((r -= weight(x)) <= 0) return x;
  return list[list.length - 1]!;
}

/* ───────────── People and places ───────────── */

const FIRST = ["علی", "محمد", "حسین", "رضا", "مهدی", "امیر", "سعید", "حمید", "مجید", "کاوه", "آرش", "پویا", "سینا", "بهزاد", "فرهاد", "مریم", "زهرا", "فاطمه", "سارا", "نرگس", "الهام", "مینا", "نازنین", "شیرین", "لیلا", "پریسا", "هانیه", "مهسا", "یاسمن", "سمیرا", "نیلوفر", "ترانه", "رویا", "بهاره", "کیانا"];
const LAST = ["محمدی", "حسینی", "احمدی", "رضایی", "کریمی", "موسوی", "جعفری", "صادقی", "رحیمی", "نوری", "قاسمی", "اکبری", "طاهری", "عباسی", "فرهادی", "کاظمی", "شریفی", "سلیمانی", "مرادی", "یزدانی", "نجفی", "بهرامی", "توکلی", "زمانی", "قربانی", "افشار", "رستمی", "پناهی", "میرزایی", "ابراهیمی"];
const PLACES: [string, number, string[]][] = [
  ["تهران", 30, ["خیابان ولیعصر، کوچه‌ی بهار", "سعادت‌آباد، خیابان سرو", "نارمک، خیابان گلبرگ", "پونک، بلوار عدل", "جنت‌آباد، خیابان لاله", "تهرانپارس، خیابان جشنواره"]],
  ["مشهد", 9, ["بلوار سجاد، خیابان بهار", "احمدآباد، خیابان رازی", "بلوار وکیل‌آباد"]],
  ["اصفهان", 8, ["خیابان چهارباغ بالا", "خیابان شیخ صدوق", "مرداویج، خیابان ارغوان"]],
  ["شیراز", 7, ["خیابان قصردشت", "معالی‌آباد، کوچه‌ی ۱۲", "خیابان زند"]],
  ["تبریز", 6, ["خیابان ولیعصر، کوچه‌ی نسترن", "خیابان آزادی"]],
  ["کرج", 7, ["گوهردشت، خیابان ۹۰", "عظیمیه، میدان مهران", "مهرشهر، بلوار ارم"]],
  ["کرمانشاه", 4, ["بلوار شهید بهشتی", "خیابان مدرس"]],
  ["رشت", 4, ["خیابان معلم", "گلسار، بلوار سمیه"]],
  ["اهواز", 4, ["کیانپارس، خیابان ۷", "خیابان نادری"]],
  ["قم", 3, ["خیابان صفاییه", "بلوار امین"]],
  ["یزد", 3, ["بلوار جمهوری", "خیابان کاشانی"]],
  ["همدان", 3, ["خیابان بوعلی", "بلوار مدنی"]],
];
type Place = { city: string; address: string; postalCode: string };
const place = (): Place => {
  const [city, , streets] = weighted(PLACES, (p) => p[1]);
  return { city, address: `${pick(streets)}، پلاک ${int(2, 140)}${chance(0.6) ? `، واحد ${int(1, 24)}` : ""}`, postalCode: String(int(1000000000, 9999999999)) };
};
const NOTES = ["لطفاً قبل از ارسال تماس بگیرید.", "بعد از ساعت ۵ عصر تحویل بگیرم.", "زنگ واحد خراب است، تماس بگیرید.", "بسته‌بندی کادویی باشد لطفاً.", "اگر امکانش هست سریع‌تر ارسال شود."];

/* ───────────── Comments and tickets ───────────── */

const PRAISE = ["کیفیتش واقعاً عالیه، دقیقاً مثل عکس بود.", "خیلی سریع رسید و بسته‌بندی‌اش هم عالی بود.", "از خریدم خیلی راضی‌ام، به دوستانم هم پیشنهاد کردم.", "نسبت به قیمتش ارزش خرید بالایی داره.", "اصل بود و گارانتی هم داشت. ممنون از فروشگاه.", "چند هفته است استفاده می‌کنم، هیچ مشکلی نداشته.", "طراحی‌اش خیلی شیکه و تو خونه قشنگ نشسته.", "پشتیبانی هم خیلی خوب جواب داد. ممنونم."];
const OKAY = ["در کل خوبه ولی ارسالش کمی طول کشید.", "رنگش کمی با عکس فرق داشت ولی بد نیست.", "برای این قیمت قابل قبوله.", "کیفیت متوسط، انتظار بیشتری داشتم.", "خوبه ولی دفترچه‌ی راهنمای فارسی نداشت."];
const BAD = ["جعبه‌اش آسیب دیده بود، هرچند خود کالا سالم بود.", "با توضیحات سایت فرق داشت، راضی نبودم.", "دیر رسید و چند بار پیگیری کردم."];
const REPLIES_GOOD = ["ممنون از انتخاب و نظر خوبتان 🌷", "خوشحالیم که راضی بودید. خرید خوبی داشته باشید!", "سپاس از اعتمادتان؛ منتظر خریدهای بعدی‌تان هستیم."];
const REPLIES_BAD = ["از تجربه‌ی شما عذرخواهیم. همکاران ما برای پیگیری با شما تماس می‌گیرند.", "بابت تأخیر پیش‌آمده پوزش می‌خواهیم؛ مشکل ارسال را پیگیری کردیم.", "ممنون از نظر صادقانه‌تان؛ حتماً بررسی می‌کنیم."];

type Script = { subject: string; talk: string[] };
const TICKETS: Script[] = [
  { subject: "پیگیری سفارش {code}", talk: ["سلام، سفارش {code} را چند روز پیش ثبت کردم. کی ارسال می‌شود؟", "سلام، وقت‌تان بخیر. سفارش شما بسته‌بندی شده و فردا تحویل پست می‌شود.", "ممنون، منتظرم."] },
  { subject: "تغییر نشانی تحویل", talk: ["سلام، می‌خواستم نشانی سفارش {code} را عوض کنم. امکانش هست؟", "سلام، بله. لطفاً نشانی جدید را همین‌جا بنویسید تا اصلاح کنیم.", "{address}", "نشانی اصلاح شد. ممنون از اطلاع‌تان."] },
  { subject: "کالای آسیب‌دیده", talk: ["سلام، {product} که رسید گوشه‌اش ضربه خورده است. عکسش را هم دارم.", "سلام، خیلی متأسفیم. کالا را با هزینه‌ی ما برگردانید تا نو ارسال کنیم. کد مرجوعی برایتان پیامک شد."] },
  { subject: "درخواست مرجوعی", talk: ["سلام، {product} اندازه‌ی جای مورد نظرم نشد. می‌خواهم مرجوع کنم.", "سلام، تا ۷ روز امکان مرجوعی هست. لطفاً کالا را در جعبه‌ی اصلی بفرستید.", "فرستادم، کد رهگیری پست را هم اینجا می‌گذارم.", "دریافت شد، مبلغ تا ۲ روز کاری به حسابتان برمی‌گردد."] },
  { subject: "سؤال درباره‌ی گارانتی", talk: ["سلام، {product} گارانتی دارد؟ چند ماه؟", "سلام، بله ۱۸ ماه گارانتی شرکتی دارد و کارت گارانتی داخل جعبه است."] },
  { subject: "زمان موجود شدن کالا", talk: ["سلام، {product} کی دوباره موجود می‌شود؟", "سلام، تا هفته‌ی آینده موجود می‌شود. می‌توانید آن را به علاقه‌مندی‌ها اضافه کنید."] },
  { subject: "کد تخفیف کار نمی‌کند", talk: ["سلام، کد تخفیف را می‌زنم ولی خطا می‌دهد.", "سلام، این کد برای سبدهای بالای حداقل مبلغ است. اگر باز مشکل بود خبر بدهید.", "درست شد، ممنون."] },
  { subject: "فاکتور رسمی", talk: ["سلام، برای سفارش {code} فاکتور رسمی با کد اقتصادی لازم دارم.", "سلام، لطفاً نام شرکت و شناسه‌ی ملی را بفرستید تا فاکتور صادر شود."] },
  { subject: "بسته‌بندی هدیه", talk: ["سلام، می‌شود {product} را کادوپیچ بفرستید؟", "سلام، بله؛ در توضیح سفارش بنویسید تا بسته‌بندی هدیه شود.", "عالیه، ممنون."] },
  { subject: "لغو سفارش", talk: ["سلام، لطفاً سفارش {code} را لغو کنید، اشتباهی ثبت شد.", "سلام، سفارش لغو شد."] },
  { subject: "ارسال به شهرستان", talk: ["سلام، به {city} هم ارسال دارید؟ چند روز طول می‌کشد؟", "سلام، بله به همه‌ی شهرها ارسال داریم؛ معمولاً ۲ تا ۴ روز کاری."] },
  { subject: "پرداخت در محل", talk: ["سلام، امکان پرداخت در محل دارید؟"] },
  { subject: "خرید عمده", talk: ["سلام، برای خرید ۲۰ عدد {product} برای دفتر شرکت تخفیف دارید؟"] },
];

/* ───────────── Making the sample ───────────── */

const DAY = 86400000;
type Customer = { id: string; name: string; phone: string; places: Place[]; joined: number };
type SampleCustomer = Customer & { createdAt: string; addresses?: Address[] };
type Address = NonNullable<Visitor["account"]>["addresses"][number];
type Store = {
  orders: ShopOrder[];
  customers: SampleCustomer[];
  reviews: (ShopReview & { customerId?: string })[];
  tickets: (ShopTicket & { customerId?: string })[];
  /** The sample customer signed in on the preview, if any. */
  me?: string;
  /** Deleted rows, as in the server's trash (each with the time it was deleted). */
  trash?: {
    orders: (ShopOrder & { deletedAt: string })[];
    customers: (SampleCustomer & { deletedAt: string })[];
    reviews: (Store["reviews"][number] & { deletedAt: string })[];
    tickets: (Store["tickets"][number] & { deletedAt: string })[];
  };
};

function makeStore(shop: Shop): Store {
  reseed();
  const now = Date.now();
  const products = shop.products.filter((p) => !p.hidden && !p.trashed);
  let n = 0;
  const id = (prefix: string) => `${prefix}-${(++n).toString(36)}`;

  const customers = Array.from({ length: 120 }, (_, k) => {
    const places = [place(), ...(chance(0.25) ? [place()] : [])];
    const joined = now - Math.floor(rand() ** 0.8 * 360 * DAY);
    return { id: id("c"), name: `${pick(FIRST)} ${pick(LAST)}`, phone: `09900000${String(k + 1).padStart(3, "0")}`, places, joined, createdAt: new Date(joined).toISOString() };
  });

  const popularity = (p: Product) => 3 / Math.log10(Math.max(100000, p.salePrice ?? p.price)) ** 2 + (p.featured ? 0.02 : 0);
  const dayWeight = (daysAgo: number) => {
    const d = new Date(now - daysAgo * DAY);
    const nowruz = (d.getMonth() === 1 && d.getDate() >= 19) || (d.getMonth() === 2 && d.getDate() < 20) ? 2.2 : 1;
    const weekend = d.getDay() === 4 || d.getDay() === 5 ? 1.5 : 1;
    return (1.6 - daysAgo / 365) * nowruz * weekend;
  };
  const days = Array.from({ length: 365 }, (_, i) => i);
  const coupons = (shop.coupons ?? []).filter((c) => c.active !== false && !c.productIds?.length && !c.categoryIds?.length).map((c) => c.code);
  // The sample ignores code limits and dates: it shows what codes look like in the reports.
  const pricing = { ...shop, coupons: shop.coupons?.map((c) => ({ ...c, usageLimit: undefined, used: 0, startsAt: undefined, endsAt: undefined, minTotal: undefined })) };

  const orders: ShopOrder[] = [];
  for (let tries = 0; orders.length < 420 && products.length && tries < 2000; tries++) {
    const daysAgo = weighted(days, dayWeight);
    const at = now - daysAgo * DAY - int(0, 14) * 3600000 - int(0, 59) * 60000;
    const joinedBefore = customers.filter((c) => c.joined <= at);
    const member = chance(0.6) && joinedBefore.length ? pick(joinedBefore) : undefined;
    const cart: CartLine[] = [];
    for (let count = weighted([1, 2, 3], (x) => [6, 3, 1][x - 1]!); count > 0; count--) {
      const p = weighted(products, popularity);
      const keys = allVariantKeys(p).filter((k) => p.variants?.find((v) => v.key === k)?.stock !== 0);
      if (cart.some((l) => l.id === p.id)) continue;
      cart.push({ id: p.id, qty: p.price < 3000000 && chance(0.3) ? int(2, 3) : 1, size: keys.length ? pick(keys) : undefined });
    }
    // Sold-out products still sold in the past, so the sample counts them as in stock.
    const priced = priceCart({ ...pricing, products: products.map((p) => ({ ...p, stock: undefined, variants: p.variants?.map((v) => ({ ...v, stock: undefined })) })) }, cart, coupons.length && chance(0.14) ? pick(coupons) : undefined);
    if (!priced.lines.length) continue;
    const age = (now - at) / DAY;
    const status: ShopOrderStatus =
      age < 1.5 ? weighted(["NEW", "CONFIRMED"] as const, (s) => (s === "NEW" ? 3 : 1))
      : age < 4 ? weighted(["NEW", "CONFIRMED", "SENT", "CANCELED"] as const, (s) => ({ NEW: 1, CONFIRMED: 3, SENT: 3, CANCELED: 0.4 })[s])
      : age < 12 ? weighted(["SENT", "DONE", "CANCELED"] as const, (s) => ({ SENT: 3, DONE: 4, CANCELED: 0.5 })[s])
      : weighted(["DONE", "CANCELED"] as const, (s) => (s === "DONE" ? 11 : 1));
    const where = member ? pick(member.places) : place();
    orders.push({
      id: id("o"),
      code: `${int(100, 999)}${int(1000, 9999)}`,
      status,
      customerName: member?.name ?? `${pick(FIRST)} ${pick(LAST)}`,
      phone: member?.phone ?? `0990000${int(5000, 9999)}`,
      city: where.city,
      address: where.address,
      postalCode: chance(0.8) ? where.postalCode : null,
      note: chance(0.15) ? pick(NOTES) : null,
      items: priced.lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size ?? null, qty: l.qty, unit: l.unit, total: l.total })),
      subtotal: priced.subtotal,
      discount: priced.discount,
      couponCode: priced.coupon ?? null,
      shipping: priced.shipping,
      total: priced.total,
      customerId: member?.id ?? null,
      createdAt: new Date(at).toISOString(),
    } as ShopOrder);
  }
  orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const byId = new Map(customers.map((c) => [c.id, c]));
  const reviews: Store["reviews"] = [];
  for (const o of orders) {
    if (!o.customerId || o.status !== "DONE" || !chance(0.45)) continue;
    for (const it of o.items) {
      if (!chance(0.7) || reviews.some((r) => r.customer.phone === o.phone && r.productId === it.id)) continue;
      const rating = weighted([5, 4, 3, 2, 1], (r) => ({ 5: 9, 4: 6, 3: 2, 2: 1, 1: 0.6 })[r]!);
      const at = Math.min(now - 3600000, Date.parse(o.createdAt) + int(4, 20) * DAY);
      const approved = now - at >= 6 * DAY || chance(0.3);
      const c = byId.get(o.customerId)!;
      reviews.push({
        id: id("r"),
        productId: it.id,
        rating,
        text: rating >= 4 ? pick(PRAISE) : rating === 3 ? pick(OKAY) : pick(BAD),
        approved,
        reply: approved && (rating <= 2 || chance(0.3)) ? pick(rating <= 2 ? REPLIES_BAD : REPLIES_GOOD) : null,
        createdAt: new Date(at).toISOString(),
        customer: { name: c.name, phone: c.phone },
        customerId: c.id,
      });
    }
  }
  reviews.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const tickets: Store["tickets"] = [];
  const memberOrders = orders.filter((o) => o.customerId);
  for (let k = 0; k < 64 && memberOrders.length; k++) {
    const o = k < 50 ? pick(memberOrders) : undefined;
    const c = o ? byId.get(o.customerId!)! : pick(customers);
    const script = pick(TICKETS);
    if (!o && script.subject.includes("{code}")) continue;
    const product = o?.items[0]?.name ?? pick(products).name;
    const fill = (t: string) => t.replace("{code}", o?.code ?? "").replace("{product}", product).replace("{city}", c.places[0]!.city).replace("{address}", place().address);
    const startAt = Math.min(now - int(1, 30) * 3600000, o ? Date.parse(o.createdAt) + int(1, 5) * DAY : now - int(1, 200) * DAY);
    const recent = now - startAt < 3 * DAY;
    let at = startAt;
    const messages = script.talk.slice(0, recent && chance(0.6) ? 1 : script.talk.length).map((text, i) => {
      if (i) at = Math.min(now - 60000, at + int(1, 20) * 3600000);
      return { from: (i % 2 ? "shop" : "customer") as "shop" | "customer", text: fill(text), at: new Date(at).toISOString() };
    });
    const lastFromShop = messages[messages.length - 1]!.from === "shop";
    const status: ShopTicket["status"] = !lastFromShop ? (messages.length > 2 && !recent ? "CLOSED" : "OPEN") : now - at > 10 * DAY && chance(0.7) ? "CLOSED" : "ANSWERED";
    tickets.push({ id: id("t"), subject: fill(script.subject), status, messages, createdAt: new Date(startAt).toISOString(), updatedAt: new Date(at).toISOString(), customer: { name: c.name, phone: c.phone }, customerId: c.id });
  }
  tickets.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return { orders, customers, reviews, tickets };
}

/* ───────────── Keeping the sample in this browser ───────────── */

const AWAY = 30 * 60000; // after this long with no page of the editor open, the sample starts fresh
const STORE_KEY = "rb-shop-sample";

type Saved = { key: string; seen: number; store: Store };
let cached: { key: string; store: Store } | null = null;
const listeners = new Set<() => void>();

/** A short fingerprint of the products the sample is made of. */
const fingerprint = (shop: Shop) => {
  let h = 5381;
  for (const ch of shop.products.map((p) => p.id).join(",")) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return `${shop.products.length}:${(h >>> 0).toString(36)}`;
};

function readSaved(key: string): Store | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as Saved | null;
    if (saved?.key === key && Date.now() - saved.seen < AWAY && Array.isArray(saved.store?.orders)) return saved.store;
  } catch {
    // Storage blocked or broken: start from a fresh sample.
  }
  return null;
}
function save() {
  if (!cached) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ key: cached.key, seen: Date.now(), store: cached.store } satisfies Saved));
  } catch {
    // Full or blocked storage: the sample still works until the page is reloaded.
  }
}
/** Something changed: keep it and tell the open views. */
function changed() {
  save();
  for (const f of listeners) f();
}

function storeFor(shop: Shop): Store {
  const key = fingerprint(shop);
  if (!cached || cached.key !== key) cached = { key, store: readSaved(key) ?? makeStore(shop) };
  return cached.store;
}

/** Marks the sample as in use (call while a page that shows it is open), so it is not renewed. */
export const touchSample = () => save();

/** Throws away every change and makes the sample again. */
export function resetSample(shop: Shop) {
  cached = { key: fingerprint(shop), store: makeStore(shop) };
  changed();
}

/** Calls `f` after any change to the sample (from the preview or the manager); returns the unsubscribe. */
export function onSampleChange(f: () => void) {
  listeners.add(f);
  return () => void listeners.delete(f);
}

/** The products the sample sells: the shop's own, or the template's sample products while it has none. */
export function sampleShopFor(own: Shop | undefined, templateSample: Shop | undefined): Shop {
  const mine = own?.products.some((p) => !p.trashed && !p.hidden);
  return (mine ? own : (templateSample ?? own)) ?? { categories: [], products: [] };
}

/* ───────────── The manager's side, answering like the server ───────────── */

/** The same calls as the real shop-manager api, answered from the sample. */
export type ShopApi = {
  shopSummary: (resumeId: string) => Promise<{ summary: ShopSummary | null }>;
  shopProductStats: (resumeId: string) => Promise<{ stats: Record<string, ShopProductStat> }>;
  shopOrders: (resumeId: string, query?: ShopOrderQuery) => Promise<{ orders: ShopOrder[]; total: number }>;
  setShopOrderStatus: (resumeId: string, orderId: string, status: ShopOrderStatus) => Promise<{ order: ShopOrder }>;
  batchShopOrders: (resumeId: string, ids: string[], status: ShopOrderStatus | "DELETE") => Promise<{ done: number; failed: string[] }>;
  deleteShopOrder: (resumeId: string, orderId: string) => Promise<{ ok: true }>;
  shopCustomers: (resumeId: string) => Promise<{ customers: ShopCustomer[] }>;
  shopCustomer: (resumeId: string, id: string) => Promise<{ customer: ShopCustomerDetail }>;
  deleteShopCustomer: (resumeId: string, id: string) => Promise<{ ok: true }>;
  shopReviews: (resumeId: string) => Promise<{ reviews: ShopReview[] }>;
  updateShopReview: (resumeId: string, id: string, patch: { approved?: boolean; reply?: string | null; text?: string; rating?: number }) => Promise<{ review: ShopReview }>;
  deleteShopReview: (resumeId: string, id: string) => Promise<{ ok: true }>;
  batchShopReviews: (resumeId: string, ids: string[], action: "approve" | "hide" | "delete") => Promise<{ done: number }>;
  shopTickets: (resumeId: string) => Promise<{ tickets: ShopTicket[] }>;
  updateShopTicket: (resumeId: string, id: string, patch: { text?: string; status?: ShopTicket["status"] }) => Promise<{ ticket: ShopTicket }>;
  deleteShopTicket: (resumeId: string, id: string) => Promise<{ ok: true }>;
  batchShopTickets: (resumeId: string, ids: string[], action: "close" | "delete") => Promise<{ done: number }>;
  shopTrash: (resumeId: string) => Promise<ShopTrash>;
  restoreShopTrash: (resumeId: string, kind: ShopTrashKind, ids: string[]) => Promise<{ done: number; failed: string[] }>;
  purgeShopTrash: (resumeId: string, kind: ShopTrashKind, ids: string[]) => Promise<{ done: number }>;
};

const TRASH_DAYS = 30;
const trashOf = (s: Store) => (s.trash ??= { orders: [], customers: [], reviews: [], tickets: [] });
/** Moves the rows with these ids from a list of the store to its trash; returns the rest of the list. */
function toTrash<T extends { id: string }>(list: T[], bin: (T & { deletedAt: string })[], pick: (x: T) => boolean, at = new Date().toISOString()): T[] {
  for (const x of list) if (pick(x)) bin.unshift({ ...x, deletedAt: at });
  return list.filter((x) => !pick(x));
}
/** Takes rows back out of a trash list; returns them without the time stamp. */
function fromTrash<T extends { id: string; deletedAt: string }>(bin: T[], pick: (x: T) => boolean): Omit<T, "deletedAt">[] {
  const back = bin.filter(pick).map(({ deletedAt: _, ...x }) => x);
  const keep = bin.filter((x) => !pick(x));
  bin.splice(0, bin.length, ...keep);
  return back;
}

const copy = <T,>(x: T): T => structuredClone(x);
/** A list without the fields that only the sample keeps. */
const bare = <T extends { customerId?: string }>(list: T[]) => list.map(({ customerId: _, ...x }) => x as Omit<T, "customerId">);

export function sampleShopApi(shop: Shop): ShopApi {
  storeFor(shop);
  // Always the current store: "start again" replaces it.
  const st = () => storeFor(shop);
  const found = <T extends { id: string }>(list: T[], id: string) => {
    const x = list.find((y) => y.id === id);
    if (!x) throw new Error("not found");
    return x;
  };
  const sold = () => st().orders.filter((o) => o.status !== "CANCELED");
  const done = <T,>(x: T) => {
    changed();
    return x;
  };

  return {
    shopSummary: async () => {
      const s = st();
      const since = Date.now() - 30 * DAY;
      const month = sold().filter((o) => Date.parse(o.createdAt) >= since);
      return {
        summary: {
          customers: s.customers.length,
          orders: s.orders.length,
          newOrders: s.orders.filter((o) => o.status === "NEW").length,
          openTickets: s.tickets.filter((t) => t.status === "OPEN").length,
          waitingReviews: s.reviews.filter((r) => !r.approved).length,
          sales: sold().reduce((n, o) => n + o.total, 0),
          monthSales: month.reduce((n, o) => n + o.total, 0),
          monthOrders: month.length,
          recent: copy(s.orders.slice(0, 8)),
        },
      };
    },
    shopProductStats: async () => {
      const stats: Record<string, ShopProductStat> = {};
      for (const o of sold())
        for (const it of o.items) {
          const x = (stats[it.id] ??= { sold: 0, revenue: 0 });
          x.sold += it.qty;
          x.revenue += it.total;
        }
      for (const r of st().reviews.filter((x) => x.approved)) {
        const x = (stats[r.productId] ??= { sold: 0, revenue: 0 });
        x.rating = ((x.rating ?? 0) * (x.reviews ?? 0) + r.rating) / ((x.reviews ?? 0) + 1);
        x.reviews = (x.reviews ?? 0) + 1;
      }
      for (const x of Object.values(stats)) if (x.rating) x.rating = Math.round(x.rating * 10) / 10;
      return { stats };
    },
    shopOrders: async (_r, q = {}) => {
      const text = q.q?.trim();
      const list = st().orders.filter(
        (o) =>
          (!q.status || o.status === q.status) &&
          (!q.from || o.createdAt >= q.from) &&
          (!q.to || o.createdAt <= q.to) &&
          (!text || o.code.includes(text) || o.customerName.includes(text) || o.phone.includes(text) || (o.city ?? "").includes(text)),
      );
      const skip = q.skip ?? 0;
      return { orders: copy(list.slice(skip, skip + (q.take ?? 300))), total: list.length };
    },
    setShopOrderStatus: async (_r, orderId, status) => {
      const o = found(st().orders, orderId);
      o.status = status;
      return done({ order: copy(o) });
    },
    batchShopOrders: async (_r, ids, status) => {
      const s = st();
      if (status === "DELETE") s.orders = toTrash(s.orders, trashOf(s).orders, (o) => ids.includes(o.id));
      else for (const o of s.orders) if (ids.includes(o.id)) o.status = status;
      return done({ done: ids.length, failed: [] });
    },
    deleteShopOrder: async (_r, orderId) => {
      const s = st();
      s.orders = toTrash(s.orders, trashOf(s).orders, (o) => o.id === orderId);
      return done({ ok: true as const });
    },
    shopCustomers: async () => ({
      customers: st().customers.map((c) => {
        const mine = st().orders.filter((o) => o.customerId === c.id);
        const live = mine.filter((o) => o.status !== "CANCELED");
        return { id: c.id, name: c.name, phone: c.phone, createdAt: c.createdAt, orders: mine.length, spent: live.reduce((n, o) => n + o.total, 0), lastOrderAt: live[0]?.createdAt ?? null };
      }),
    }),
    shopCustomer: async (_r, cid) => {
      const s = st();
      const c = found(s.customers, cid);
      return {
        customer: copy({
          id: c.id,
          name: c.name,
          phone: c.phone,
          createdAt: c.createdAt,
          addresses: addressesOf(c),
          orders: s.orders.filter((o) => o.customerId === c.id),
          reviews: bare(s.reviews.filter((r) => r.customerId === c.id)).map(({ customer: _, ...r }) => r),
          tickets: s.tickets.filter((t) => t.customerId === c.id).map((t) => ({ id: t.id, subject: t.subject, status: t.status, updatedAt: t.updatedAt })),
        }),
      };
    },
    deleteShopCustomer: async (_r, cid) => {
      const s = st();
      // The account goes to the trash with its comments and tickets (same time stamp); its orders stay.
      const at = new Date().toISOString();
      const bin = trashOf(s);
      s.customers = toTrash(s.customers, bin.customers, (x) => x.id === cid, at);
      s.reviews = toTrash(s.reviews, bin.reviews, (r) => r.customerId === cid, at);
      s.tickets = toTrash(s.tickets, bin.tickets, (t) => t.customerId === cid, at);
      if (s.me === cid) s.me = undefined;
      return done({ ok: true as const });
    },
    shopReviews: async () => ({ reviews: copy(bare(st().reviews)) }),
    updateShopReview: async (_r, rid, patch) => {
      const r = found(st().reviews, rid);
      if (patch.approved !== undefined) r.approved = patch.approved;
      if (patch.text !== undefined) r.text = patch.text;
      if (patch.rating !== undefined) r.rating = patch.rating;
      if (patch.reply !== undefined) r.reply = patch.reply || null;
      return done({ review: copy(bare([r])[0]!) });
    },
    deleteShopReview: async (_r, rid) => {
      const s = st();
      s.reviews = toTrash(s.reviews, trashOf(s).reviews, (r) => r.id === rid);
      return done({ ok: true as const });
    },
    batchShopReviews: async (_r, ids, action) => {
      const s = st();
      if (action === "delete") s.reviews = toTrash(s.reviews, trashOf(s).reviews, (r) => ids.includes(r.id));
      else for (const r of s.reviews) if (ids.includes(r.id)) r.approved = action === "approve";
      return done({ done: ids.length });
    },
    shopTickets: async () => ({ tickets: copy(bare(st().tickets)) }),
    updateShopTicket: async (_r, tid, patch) => {
      const t = found(st().tickets, tid);
      if (patch.text) t.messages = [...t.messages, { from: "shop", text: patch.text, at: new Date().toISOString() }];
      t.status = patch.status ?? (patch.text ? "ANSWERED" : t.status);
      t.updatedAt = new Date().toISOString();
      return done({ ticket: copy(bare([t])[0]!) });
    },
    deleteShopTicket: async (_r, tid) => {
      const s = st();
      s.tickets = toTrash(s.tickets, trashOf(s).tickets, (t) => t.id === tid);
      return done({ ok: true as const });
    },
    batchShopTickets: async (_r, ids, action) => {
      const s = st();
      if (action === "delete") s.tickets = toTrash(s.tickets, trashOf(s).tickets, (t) => ids.includes(t.id));
      else for (const t of s.tickets) if (ids.includes(t.id)) t.status = "CLOSED";
      return done({ done: ids.length });
    },
    shopTrash: async () => {
      const bin = trashOf(st());
      const gone = new Set(bin.customers.map((c) => c.id));
      const own = <T extends { customerId?: string }>(x: T) => !x.customerId || !gone.has(x.customerId);
      return copy({
        orders: bin.orders,
        customers: bin.customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone, createdAt: c.createdAt, deletedAt: c.deletedAt, reviews: bin.reviews.filter((r) => r.customerId === c.id).length, tickets: bin.tickets.filter((t) => t.customerId === c.id).length })),
        reviews: bare(bin.reviews.filter(own)),
        tickets: bare(bin.tickets.filter(own)),
        days: TRASH_DAYS,
      });
    },
    restoreShopTrash: async (_r, kind, ids) => {
      const s = st();
      const bin = trashOf(s);
      const gone = new Set(bin.customers.map((c) => c.id));
      const pick = (x: { id: string; customerId?: string }) => ids.includes(x.id) && (!x.customerId || !gone.has(x.customerId));
      let n = 0;
      const sortDesc = <T extends { createdAt?: string; updatedAt?: string }>(list: T[]) => list.sort((a, b) => (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? ""));
      if (kind === "orders") {
        const back = fromTrash(bin.orders, (o) => ids.includes(o.id));
        s.orders = sortDesc([...s.orders, ...back]);
        n = back.length;
      } else if (kind === "customers") {
        for (const c of bin.customers.filter((x) => ids.includes(x.id))) {
          const same = (x: { customerId?: string; deletedAt: string }) => x.customerId === c.id && x.deletedAt === c.deletedAt;
          s.reviews = sortDesc([...s.reviews, ...fromTrash(bin.reviews, same)]);
          s.tickets = sortDesc([...s.tickets, ...fromTrash(bin.tickets, same)]);
        }
        const back = fromTrash(bin.customers, (c) => ids.includes(c.id));
        s.customers = sortDesc([...s.customers, ...back]);
        n = back.length;
      } else if (kind === "reviews") {
        const back = fromTrash(bin.reviews, pick);
        s.reviews = sortDesc([...s.reviews, ...back]);
        n = back.length;
      } else {
        const back = fromTrash(bin.tickets, pick);
        s.tickets = sortDesc([...s.tickets, ...back]);
        n = back.length;
      }
      return done({ done: n, failed: [] });
    },
    purgeShopTrash: async (_r, kind, ids) => {
      const bin = trashOf(st());
      const before = bin[kind].length;
      if (kind === "customers") {
        bin.reviews = bin.reviews.filter((r) => !r.customerId || !ids.includes(r.customerId));
        bin.tickets = bin.tickets.filter((t) => !t.customerId || !ids.includes(t.customerId));
      }
      (bin[kind] as { id: string }[]) = (bin[kind] as { id: string }[]).filter((x) => !ids.includes(x.id));
      return done({ done: before - bin[kind].length });
    },
  };
}

const addressesOf = (c: SampleCustomer): Address[] => c.addresses ?? c.places.map((p, i) => ({ id: `${c.id}-${i}`, title: i ? "محل کار" : "خانه", ...p }));

/* ───────────── The customer's side, for the preview ───────────── */

type Result = { msg?: string; error?: string; page?: string; code?: string };

/** What a visitor of the preview sees from the sample: who is signed in, their records, comments. */
export function sampleVisitor(shop: Shop, page: string): Pick<Visitor, "customer" | "account" | "ratings" | "reviews"> {
  const s = storeFor(shop);
  const ratings: NonNullable<Visitor["ratings"]> = {};
  for (const r of s.reviews.filter((x) => x.approved)) {
    const x = (ratings[r.productId] ??= { avg: 0, count: 0 });
    x.avg = (x.avg * x.count + r.rating) / (x.count + 1);
    x.count += 1;
  }
  const productId = page.startsWith("/product/") ? decodeURIComponent(page.slice(9)) : null;
  const reviews = productId
    ? s.reviews
        .filter((r) => r.productId === productId && r.approved)
        .slice(0, 30)
        .map((r) => ({ id: r.id, name: r.customer.name, rating: r.rating, text: r.text, reply: r.reply ?? undefined, at: r.createdAt }))
    : undefined;
  const me = s.customers.find((c) => c.id === s.me);
  if (!me) return { ratings, reviews };
  return {
    ratings,
    reviews,
    customer: { id: me.id, name: me.name, phone: me.phone },
    account: {
      addresses: addressesOf(me),
      orders: s.orders
        .filter((o) => o.customerId === me.id)
        .slice(0, 50)
        .map((o) => ({ code: o.code, status: o.status, total: o.total, at: o.createdAt, items: o.items.map((i) => ({ name: i.name, size: i.size ?? undefined, qty: i.qty })) })),
      tickets: s.tickets
        .filter((t) => t.customerId === me.id)
        .slice(0, 30)
        .map((t) => ({ id: t.id, subject: t.subject, status: t.status, messages: t.messages })),
    },
  };
}

/** Signs a sample customer in on the preview: the one with this number, or the first sample customer. */
export function sampleSignIn(shop: Shop, phone?: string): Result {
  const s = storeFor(shop);
  const c = s.customers.find((x) => x.phone === phone) ?? s.customers.find((x) => s.orders.some((o) => o.customerId === x.id) && s.tickets.some((t) => t.customerId === x.id)) ?? s.customers[0];
  if (!c) return { error: "مشتری نمونه‌ای نیست." };
  s.me = c.id;
  changed();
  return { page: "/account" };
}

export function sampleSignOut(shop: Shop) {
  storeFor(shop).me = undefined;
  changed();
}

/** Who is signed in on the preview (name), if anyone. */
export const sampleMe = (shop: Shop) => {
  const s = storeFor(shop);
  return s.customers.find((c) => c.id === s.me)?.name;
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const mobile = (v: unknown) => text(v, 20).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");

/** A form sent to /_account on the preview, answered like the server does (messages included). */
export function sampleAccountAction(shop: Shop, fields: Record<string, string>, autoApprove: boolean): Result {
  const s = storeFor(shop);
  const op = fields.op;
  // Forms of the support page come back to it, as on the published site.
  const home = fields.back === "/support/tickets" ? "/support/tickets" : "/account";
  const r = sampleAccountStep(s, shop, op, fields, autoApprove);
  return r.page === "/account" ? { ...r, page: home } : r;
}

function sampleAccountStep(s: Store, shop: Shop, op: string | undefined, fields: Record<string, string>, autoApprove: boolean): Result {
  if (op === "login" || op === "register") {
    const phone = mobile(fields.phone);
    if (!/^09\d{9}$/.test(phone)) return { error: "شماره‌ی موبایل درست نیست.", page: "/account" };
    if (op === "login") {
      // The preview takes any password: a known sample number signs that customer in, any other the first one.
      sampleSignIn(shop, phone);
      return { page: "/account" };
    }
    const name = text(fields.name, 80);
    if (name.length < 2) return { error: "نام را وارد کنید.", page: "/account" };
    if ((fields.password ?? "").length < 6) return { error: "رمز باید دست‌کم ۶ نویسه باشد.", page: "/account" };
    if (s.customers.some((c) => c.phone === phone)) return { error: "با این شماره قبلاً ثبت‌نام شده است؛ وارد شوید.", page: "/account" };
    const c: SampleCustomer = { id: `c-${Date.now().toString(36)}`, name, phone, places: [], addresses: [], joined: Date.now(), createdAt: new Date().toISOString() };
    s.customers.unshift(c);
    s.me = c.id;
    changed();
    return { msg: "ثبت‌نام انجام شد؛ خوش آمدید!", page: "/account" };
  }
  const me = s.customers.find((c) => c.id === s.me);
  if (!me) return { error: "اول وارد حساب خود شوید.", page: "/account" };
  if (op === "logout") {
    s.me = undefined;
    changed();
    return { page: "/" };
  }
  if (op === "address-add" || op === "address-remove") {
    const list = addressesOf(me);
    if (op === "address-add" && !text(fields.address, 400)) return { error: "نشانی را وارد کنید.", page: "/account" };
    me.addresses =
      op === "address-remove"
        ? list.filter((a) => a.id !== fields.id)
        : [...list, { id: Date.now().toString(36), title: text(fields.title, 40), city: text(fields.city, 60), address: text(fields.address, 400), postalCode: text(fields.postalCode, 20) }].slice(-10);
    changed();
    return { msg: op === "address-add" ? "نشانی ذخیره شد." : "نشانی حذف شد.", page: "/account" };
  }
  if (op === "review") {
    const productId = text(fields.productId, 40);
    const back = `/product/${productId}`;
    const comment = text(fields.text, 1000);
    if (comment.length < 3) return { error: "متن نظر را بنویسید.", page: back };
    s.reviews.unshift({
      id: `r-${Date.now().toString(36)}`,
      productId,
      rating: Math.max(1, Math.min(5, Math.round(Number(fields.rating) || 5))),
      text: comment,
      approved: autoApprove,
      reply: null,
      createdAt: new Date().toISOString(),
      customer: { name: me.name, phone: me.phone },
      customerId: me.id,
    });
    changed();
    return { msg: autoApprove ? "نظر شما ثبت شد. ممنون!" : "نظر شما ثبت شد و پس از تأیید فروشگاه نمایش داده می‌شود. (در پنل مدیریت، بخش «نظرات»، تأییدش کنید.)", page: back };
  }
  if (op === "ticket-close") {
    const t = s.tickets.find((x) => x.id === fields.ticketId && x.customerId === me.id);
    if (t) t.status = "CLOSED";
    changed();
    return { msg: "تیکت بسته شد.", page: "/account" };
  }
  if (op === "ticket-new" || op === "ticket-reply") {
    const message = text(fields.text, 2000);
    if (message.length < 2) return { error: "متن پیام را بنویسید.", page: "/account" };
    const entry = { from: "customer" as const, text: message, at: new Date().toISOString() };
    if (op === "ticket-new") {
      s.tickets.unshift({ id: `t-${Date.now().toString(36)}`, subject: text(fields.subject, 120) || "بدون عنوان", status: "OPEN", messages: [entry], createdAt: entry.at, updatedAt: entry.at, customer: { name: me.name, phone: me.phone }, customerId: me.id });
      changed();
      return { msg: "تیکت شما ثبت شد. (در پنل مدیریت، بخش «تیکت‌ها»، جوابش را بدهید.)", page: "/account" };
    }
    const t = s.tickets.find((x) => x.id === fields.ticketId && x.customerId === me.id);
    if (!t || t.status === "CLOSED") return { error: "این تیکت بسته شده است.", page: "/account" };
    t.messages = [...t.messages, entry];
    t.status = "OPEN";
    t.updatedAt = entry.at;
    changed();
    return { msg: "پیام شما ارسال شد.", page: "/account" };
  }
  return { page: "/account" };
}

/** An order placed on the preview: it joins the sample, so the manager shows it as a new order. */
export function sampleOrder(shop: Shop, cart: CartLine[], coupon: string | undefined, fields: Record<string, string>): Result {
  const s = storeFor(shop);
  const priced = priceCart(shop, cart, coupon);
  if (!priced.lines.length) return { error: "سبد خرید خالی است.", page: "/cart" };
  if (priced.couponError) return { error: priced.couponError, page: "/checkout" };
  const me = s.customers.find((c) => c.id === s.me);
  const code = String(Math.floor(1000000 + Math.random() * 8999999));
  s.orders.unshift({
    id: `o-${Date.now().toString(36)}`,
    code,
    status: "NEW",
    customerName: text(fields.name, 80) || me?.name || "مشتری",
    phone: mobile(fields.phone) || me?.phone || "",
    city: text(fields.city, 60) || null,
    address: text(fields.address, 400),
    postalCode: text(fields.postalCode, 20) || null,
    note: text(fields.note, 500) || null,
    items: priced.lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size ?? null, qty: l.qty, unit: l.unit, total: l.total })),
    subtotal: priced.subtotal,
    discount: priced.discount,
    couponCode: priced.coupon ?? null,
    shipping: priced.shipping,
    total: priced.total,
    customerId: me?.id ?? null,
    createdAt: new Date().toISOString(),
  } as ShopOrder);
  changed();
  return { code, page: "/thanks" };
}
