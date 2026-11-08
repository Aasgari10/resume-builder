// Fills a shop site with demo data so the shop manager has something to show: all products and
// categories of the HomeMart example, plus customers, a year of orders, support tickets and comments.
// Demo people all have phone numbers starting with 0990000, so running it again replaces them and
// `--clear` removes them without touching real customers or orders.
//
// Usage:
//   npm run shop:demo -w @rb/api                  (the newest HomeMart site)
//   npm run shop:demo -w @rb/api -- myshop        (the site at myshop.<domain>)
//   npm run shop:demo -w @rb/api -- myshop --clear
//
// Demo customers can sign in on the site with their number (09900000001, 09900000002, …) and 123456.

import "../src/env";
import { randomUUID } from "node:crypto";
import type { Prisma, ShopOrderStatus, ShopTicketStatus } from "@prisma/client";
import { allVariantKeys, priceCart, resumeDataSchema, type CartLine, type ResumeData, type Shop } from "@rb/schema";
import { TEMPLATES } from "@rb/templates";
import { prisma } from "../src/db";
import { hashPassword } from "../src/lib/shopData";

const DEMO_PREFIX = "0990000";
const TEMPLATE = "homemart-shop";

/* ───────────── A repeatable random source ───────────── */

let seed = 1402;
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
  { subject: "کد تخفیف کار نمی‌کند", talk: ["سلام، کد HOME10 را می‌زنم ولی خطا می‌دهد.", "سلام، این کد برای سبدهای بالای حداقل مبلغ است. اگر باز مشکل بود خبر بدهید.", "درست شد، ممنون."] },
  { subject: "فاکتور رسمی", talk: ["سلام، برای سفارش {code} فاکتور رسمی با کد اقتصادی لازم دارم.", "سلام، لطفاً نام شرکت و شناسه‌ی ملی را بفرستید تا فاکتور صادر شود."] },
  { subject: "نصب دستگاه", talk: ["سلام، برای نصب {product} نصاب می‌فرستید؟", "سلام، بله در تهران و کرج نصب رایگان است. هماهنگی با شما تماس می‌گیرد.", "عالیه، ممنون."] },
  { subject: "لغو سفارش", talk: ["سلام، لطفاً سفارش {code} را لغو کنید، اشتباهی ثبت شد.", "سلام، سفارش لغو شد."] },
  { subject: "ارسال به شهرستان", talk: ["سلام، به {city} هم ارسال دارید؟ چند روز طول می‌کشد؟", "سلام، بله به همه‌ی شهرها ارسال داریم؛ معمولاً ۲ تا ۴ روز کاری."] },
  { subject: "پرداخت در محل", talk: ["سلام، امکان پرداخت در محل دارید؟"] },
  { subject: "خرید عمده", talk: ["سلام، برای خرید ۲۰ عدد {product} برای دفتر شرکت تخفیف دارید؟"] },
];

/* ───────────── Main ───────────── */

async function main() {
  const args = process.argv.slice(2);
  const clear = args.includes("--clear");
  const wanted = args.find((a) => !a.startsWith("--"))?.toLowerCase();

  const site = wanted
    ? await prisma.site.findUnique({ where: { subdomain: wanted }, include: { resume: true } })
    : (await prisma.site.findMany({ include: { resume: true }, orderBy: { updatedAt: "desc" } })).find((s) => s.templateId === TEMPLATE || (s.resume.portfolioTheme as { templateId?: string } | null)?.templateId === TEMPLATE);
  if (!site) {
    console.error(
      wanted
        ? `No site at the address "${wanted}".`
        : "No HomeMart site found. In the editor choose the HomeMart template and set the site address (site settings) once, then run this again, or pass the address: npm run shop:demo -w @rb/api -- myshop",
    );
    process.exitCode = 1;
    return;
  }

  // Old demo rows go first; reviews and tickets go with their customers.
  const removed = await prisma.$transaction([
    prisma.shopOrder.deleteMany({ where: { siteId: site.id, phone: { startsWith: DEMO_PREFIX } } }),
    prisma.shopCustomer.deleteMany({ where: { siteId: site.id, phone: { startsWith: DEMO_PREFIX } } }),
  ]);
  if (clear) {
    console.log(`✅ Removed ${removed[0].count} demo orders and ${removed[1].count} demo customers from ${site.subdomain}.`);
    return;
  }

  /* Products: everything from the HomeMart example that the shop does not have yet. */
  const sample = TEMPLATES[TEMPLATE]!.sample!(site.resume.locale);
  const sampleShop = sample.site!.shop!;
  const fill = (content: unknown): ResumeData | null => {
    if (!content || typeof content !== "object") return null;
    const data = structuredClone(content) as ResumeData;
    const shop: Shop = data.site?.shop?.products.length ? data.site.shop : { ...sampleShop, products: [], categories: [], coupons: [] };
    const has = (list: { id: string }[] | undefined, id: string) => Boolean(list?.some((x) => x.id === id));
    shop.categories = [...shop.categories, ...sampleShop.categories.filter((c) => !has(shop.categories, c.id))];
    shop.products = [...shop.products, ...sampleShop.products.filter((p) => !has(shop.products, p.id))];
    shop.coupons = [...(shop.coupons ?? []), ...(sampleShop.coupons ?? []).filter((c) => !has(shop.coupons, c.id))];
    data.site = { gallery: [], ...data.site, shop };
    return data;
  };
  const draft = fill(site.resume.data)!;
  const published = site.publishedData ? fill(site.publishedData) : null;
  const shop = (published ?? draft).site!.shop!;
  const products = shop.products.filter((p) => !p.hidden && !p.trashed);
  if (!resumeDataSchema.safeParse(draft).success) console.warn("⚠ The shop content did not pass validation; check it in the editor.");

  /* Customers */
  const passwordHash = hashPassword("123456");
  const now = Date.now();
  const DAY = 86400000;
  type Customer = { id: string; name: string; phone: string; places: Place[]; joined: number };
  const customers: Customer[] = Array.from({ length: 120 }, (_, k) => {
    const places = [place(), ...(chance(0.25) ? [place()] : [])];
    return { id: randomUUID(), name: `${pick(FIRST)} ${pick(LAST)}`, phone: `${DEMO_PREFIX}${String(k + 1).padStart(4, "0")}`, places, joined: now - Math.floor(rand() ** 0.8 * 360 * DAY) };
  });
  await prisma.shopCustomer.createMany({
    data: customers.map((c) => ({
      id: c.id,
      siteId: site.id,
      name: c.name,
      phone: c.phone,
      passwordHash,
      addresses: c.places.map((p, i) => ({ id: randomUUID().slice(0, 8), title: i ? "محل کار" : "خانه", ...p })) as Prisma.InputJsonValue,
      createdAt: new Date(c.joined),
    })),
  });

  /* Orders: a year of sales, growing over time, busier before Nowruz and on Thursdays and Fridays. */
  const popularity = (p: (typeof products)[number]) => 3 / Math.log10(Math.max(100000, p.salePrice ?? p.price)) ** 2 + (p.featured ? 0.02 : 0);
  const dayWeight = (daysAgo: number) => {
    const d = new Date(now - daysAgo * DAY);
    const nowruz = (d.getMonth() === 1 && d.getDate() >= 19) || (d.getMonth() === 2 && d.getDate() < 20) ? 2.2 : 1; // Esfand, before Nowruz
    const weekend = d.getDay() === 4 || d.getDay() === 5 ? 1.5 : 1;
    return (1.6 - daysAgo / 365) * nowruz * weekend;
  };
  const days = Array.from({ length: 365 }, (_, i) => i);
  const usedCodes = new Set((await prisma.shopOrder.findMany({ select: { code: true } })).map((o) => o.code));
  const newCode = () => {
    let code = "";
    do code = `${int(100, 999)}${int(1000, 9999)}`;
    while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  };
  const couponUse = new Map<string, number>();
  type OrderRow = Prisma.ShopOrderCreateManyInput & { customerId: string | null };
  const orders: OrderRow[] = [];
  while (orders.length < 420) {
    const daysAgo = weighted(days, dayWeight);
    const at = now - daysAgo * DAY - int(0, 14) * 3600000 - int(0, 59) * 60000;
    const member = chance(0.6) ? pick(customers.filter((c) => c.joined <= at)) : undefined;
    const cart: CartLine[] = [];
    for (let n = weighted([1, 2, 3], (x) => [6, 3, 1][x - 1]!); n > 0; n--) {
      const p = weighted(products, popularity);
      const keys = allVariantKeys(p).filter((k) => p.variants?.find((v) => v.key === k)?.stock !== 0);
      if (cart.some((l) => l.id === p.id) || (p.stock === 0 && !keys.length)) continue;
      cart.push({ id: p.id, qty: p.price < 3000000 && chance(0.3) ? int(2, 3) : 1, size: keys.length ? pick(keys) : undefined });
    }
    let coupon: string | undefined;
    if (cart.some((l) => l.id === "h1") && !couponUse.get("LAPTOP") && chance(0.3)) coupon = "LAPTOP";
    else if (chance(0.14)) coupon = "HOME10";
    let priced = priceCart(shop, cart, coupon);
    if (priced.couponError) priced = priceCart(shop, cart);
    if (!priced.lines.length) continue;
    if (priced.coupon) couponUse.set(priced.coupon, (couponUse.get(priced.coupon) ?? 0) + 1);

    const age = (now - at) / DAY;
    const status: ShopOrderStatus =
      age < 1.5 ? weighted(["NEW", "CONFIRMED"] as const, (s) => (s === "NEW" ? 3 : 1))
      : age < 4 ? weighted(["NEW", "CONFIRMED", "SENT", "CANCELED"] as const, (s) => ({ NEW: 1, CONFIRMED: 3, SENT: 3, CANCELED: 0.4 })[s])
      : age < 12 ? weighted(["SENT", "DONE", "CANCELED"] as const, (s) => ({ SENT: 3, DONE: 4, CANCELED: 0.5 })[s])
      : weighted(["DONE", "CANCELED"] as const, (s) => (s === "DONE" ? 11 : 1));
    const where = member ? pick(member.places) : place();
    orders.push({
      id: randomUUID(),
      siteId: site.id,
      code: newCode(),
      status,
      customerName: member?.name ?? `${pick(FIRST)} ${pick(LAST)}`,
      phone: member?.phone ?? `${DEMO_PREFIX}${int(5000, 9999)}`,
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
      createdAt: new Date(at),
      updatedAt: new Date(Math.min(now, at + int(1, 72) * 3600000)),
    });
  }
  await prisma.shopOrder.createMany({ data: orders });

  /* Comments: mostly from buyers, a few still waiting for approval. */
  const reviews: Prisma.ShopReviewCreateManyInput[] = [];
  for (const o of orders) {
    if (!o.customerId || o.status !== "DONE" || !chance(0.45)) continue;
    for (const it of o.items as { id: string }[]) {
      if (!chance(0.7) || reviews.some((r) => r.customerId === o.customerId && r.productId === it.id)) continue;
      const rating = weighted([5, 4, 3, 2, 1], (r) => ({ 5: 9, 4: 6, 3: 2, 2: 1, 1: 0.6 })[r]!);
      const at = Math.min(now - 3600000, (o.createdAt as Date).getTime() + int(4, 20) * DAY);
      const fresh = now - at < 6 * DAY;
      const approved = !fresh || chance(0.3);
      reviews.push({
        id: randomUUID(),
        siteId: site.id,
        productId: it.id,
        customerId: o.customerId,
        rating,
        text: rating >= 4 ? pick(PRAISE) : rating === 3 ? pick(OKAY) : pick(BAD),
        approved,
        reply: approved && (rating <= 2 || chance(0.3)) ? pick(rating <= 2 ? REPLIES_BAD : REPLIES_GOOD) : null,
        createdAt: new Date(at),
      });
    }
  }
  await prisma.shopReview.createMany({ data: reviews });

  /* Support tickets */
  const tickets: Prisma.ShopTicketCreateManyInput[] = [];
  const memberOrders = orders.filter((o) => o.customerId);
  for (let k = 0; k < 64; k++) {
    const o = k < 50 ? pick(memberOrders) : undefined;
    const c = o ? customers.find((x) => x.id === o.customerId)! : pick(customers);
    const script = pick(TICKETS);
    const firstItem = (o?.items as { name: string }[] | undefined)?.[0]?.name ?? pick(products).name;
    const fillText = (t: string) => t.replace("{code}", o?.code ?? "").replace("{product}", firstItem).replace("{city}", c.places[0]!.city).replace("{address}", place().address);
    if (!o && script.subject.includes("{code}")) continue;
    const start = o ? (o.createdAt as Date).getTime() + int(1, 5) * DAY : now - int(1, 200) * DAY;
    const startAt = Math.min(now - int(1, 30) * 3600000, start);
    // Recent tickets may still be waiting for the shop's answer.
    const recent = now - startAt < 3 * DAY;
    const length = recent && chance(0.6) ? 1 : script.talk.length;
    let at = startAt;
    const messages = script.talk.slice(0, length).map((text, i) => {
      if (i) at = Math.min(now - 60000, at + int(1, 20) * 3600000);
      return { from: i % 2 ? "shop" : "customer", text: fillText(text), at: new Date(at).toISOString() };
    });
    const lastFromShop = messages[messages.length - 1]!.from === "shop";
    const status: ShopTicketStatus = !lastFromShop ? (messages.length > 2 && !recent ? "CLOSED" : "OPEN") : now - at > 10 * DAY && chance(0.7) ? "CLOSED" : "ANSWERED";
    tickets.push({ id: randomUUID(), siteId: site.id, customerId: c.id, subject: fillText(script.subject), status, messages: messages as Prisma.InputJsonValue, createdAt: new Date(startAt), updatedAt: new Date(at) });
  }
  await prisma.shopTicket.createMany({ data: tickets });

  /* Discount-code use counts, in both copies of the content. */
  for (const data of [draft, published]) {
    for (const c of data?.site?.shop?.coupons ?? []) {
      const n = couponUse.get(c.code);
      if (n) c.used = n;
    }
  }
  await prisma.$transaction([
    prisma.resume.update({ where: { id: site.resume.id }, data: { data: draft as unknown as Prisma.InputJsonValue } }),
    ...(published ? [prisma.site.update({ where: { id: site.id }, data: { publishedData: published as unknown as Prisma.InputJsonValue } })] : []),
  ]);

  const revenue = orders.filter((o) => o.status !== "CANCELED").reduce((s, o) => s + o.total, 0);
  console.log(`✅ ${site.subdomain}: ${shop.products.length} products in ${shop.categories.length} categories`);
  console.log(`   ${customers.length} customers, ${orders.length} orders (${revenue.toLocaleString("en")} toman sold), ${reviews.length} comments, ${tickets.length} tickets`);
  console.log(`   Demo sign-in on the site: ${customers[0]!.phone} / 123456`);
  if (!published) console.log("   The site is not published yet; publish it to see the products and accounts on the live site.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
