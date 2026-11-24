/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Papo": a pet shop with services: a purple header with a wavy edge, an
// orange hero with a dog, coloured sale cards, products in tabs per animal, a brown band of perks, a
// blue newsletter band and a green wavy footer. Goods carry the animals they are for in their
// "مناسب برای" spec (the shop filters by it); services (grooming, hotel, walking, training) are the
// products of the services category and are booked by day and time; price packages are the plans
// category. Phones get everything a computer gets: search, wishlist, cart and sign in stay in the
// header, the sale cards and the best sellers swipe. Works without scripts.

import type { CSSProperties, ReactNode } from "react";
import { defaultSchedule, emptyVisitor, formatToman, priceCart, takenFor, unitPrice, type Product, type ResumeData, type Schedule, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SORTS, SpecsTable, Stars, timeLeft, filterProducts, PriceFilterBox } from "./shopkit";
import { mapEmbed } from "./golsara";
import { BookingPicker, TrackBooking, bookingCss } from "./booking";

export const PAPO_BLOCKS = [
  { key: "sales", label: "کارت‌های حراج رنگی" },
  { key: "new", label: "محصولات جدید (تب حیوان‌ها)" },
  { key: "promo", label: "بنر دورنگ پیشنهاد ویژه" },
  { key: "best", label: "پرفروش‌ها" },
  { key: "services", label: "خدمات (آرایش، هتل…)" },
  { key: "quotes", label: "نظر مشتری‌ها" },
  { key: "newsletter", label: "خبرنامه" },
  { key: "perks", label: "نوار قهوه‌ای ویژگی‌ها" },
  { key: "blog", label: "آخرین مطالب بلاگ" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const PAPO_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/pricing", label: "صفحه‌ی تعرفه‌ها" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

/** A pet shop's booking hours: Saturday to Thursday, 9 to 20, an hour each, two at a time. */
const petSchedule = (): Schedule => ({ ...defaultSchedule(), days: [6, 0, 1, 2, 3, 4], start: "09:00", end: "20:00", slot: 60, capacity: 2, ahead: 21 });

/** Goods of the shop: every product but the services and the plans. */
const visible = (shop: Shop | undefined) => {
  const not = new Set([shop?.showcaseCategoryId, shop?.plansCategoryId].filter(Boolean));
  return (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim() && !(p.categoryId && not.has(p.categoryId)));
};
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

/** Every page of the site: the shop pages, one per service, category, product and post. */
export function papoPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const goods = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => goods.some((p) => p.categoryId === c.id));
  const own = PAPO_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p));
  const posts = pageOn(data, "/blog") ? livePosts(shop).map((p) => `/blog/${p.id}`) : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  const services = servicesOf(shop);
  return [
    "/",
    ...own,
    "/shop",
    ...(services.length ? ["/services", "/booking", ...services.map((p) => `/service/${p.id}`)] : []),
    "/contact",
    ...cats.map((c) => `/category/${c.id}`),
    ...[...goods, ...plansOf(shop)].map((p) => `/product/${p.id}`),
    ...posts,
    "/cart",
    "/wishlist",
    "/search",
    "/checkout",
    "/thanks",
    "/account",
    "/track",
    ...info,
  ];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function PapoShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = papoPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "services") body = <ServicesPage {...view} />;
  else if (kind === "service") body = <ServicePage {...view} id={id!} />;
  else if (kind === "booking") body = <BookingPage {...view} />;
  else if (kind === "pricing") body = <PricingPage {...view} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else if (kind === "about") body = <About {...view} />;
  else if (kind === "blog") body = id ? <Post {...view} id={id} /> : <Blog {...view} />;
  else if (kind === "track") body = <Track {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else
    body = (
      <>
        <PageTop view={view} title="اطلاعات" />
        <div className="pp-wrap pp-sec">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`pp${page === "/" ? " pp-home" : ""}`} css={partsCss + shopkitCss + bookingCss + css}>
      <Header {...view} />
      <main className="pp-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      {!view.visitor.customer && <LoginPopup view={view} />}
      <MiniCart view={view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  bag: "M5.5 8h13l-1 12.5h-11z M9 10.5V7a3 3 0 0 1 6 0v3.5",
  search: "M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6z M15.8 15.8 20.5 20.5",
  heart: "M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  user: "M12 4a3.8 3.8 0 1 0 0 7.6A3.8 3.8 0 0 0 12 4z M4.5 20.5a7.5 7.5 0 0 1 15 0",
  home: "M4 11 12 4l8 7 M6 9.5V20h12V9.5",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M3 6h18M3 12h18M3 18h18",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  down: "M6 9l6 6 6-6",
  up: "M6 15l6-6 6 6",
  right: "M9 5l7 7-7 7",
  left: "M15 5l-7 7 7 7",
  store: "M4 10 5.5 5h13L20 10 M4 10h16v10H4z M9.5 20v-5h5v5 M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0",
  phone: "M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  pin: "M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  card: "M3 6h18v12H3z M3 10h18 M7 15h4",
  undo: "M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
  smile: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M8.5 14a4.5 4.5 0 0 0 7 0 M9 9.5v.5 M15 9.5v.5",
  rocket: "M14 4c3-1 5.5-.5 6 0 .5.5 1 3-0 6l-6 6-6-6z M8 10l-3 1-2 3 4 0 M14 16l-1 3-3 2 0-4 M15 8.5a1 1 0 1 0 0 .1",
  gem: "M6 4h12l3 5-9 11L3 9z M3 9h18 M9 4l3 5 3-5 M12 9v11",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  expand: "M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5",
  question: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6 M12 17v.01",
  gift: "M4 10h16v10H4z M3 7h18v3H3z M12 7v13 M12 7c-1-3-5-3.5-5-1.5S10 7 12 7c2 0 5-1 5-1.5S13 4 12 7",
  list: "M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01",
  grid2: "M4 4h7v16H4z M13 4h7v16h-7z",
  grid3: "M3 4h5v16H3z M9.5 4h5v16h-5z M16 4h5v16h-5z",
  grid4: "M3 4h3.5v16H3z M8 4h3.5v16H8z M12.5 4H16v16h-3.5z M17.5 4H21v16h-3.5z",
  headset: "M4 14v-2a8 8 0 0 1 16 0v2 M4 14h3v6H5a1 1 0 0 1-1-1z M20 14h-3v6h2a1 1 0 0 0 1-1z",
  quote: "M5 17c0-4 1.5-7 5-9 M5 17h4v-4H5 M14 17c0-4 1.5-7 5-9 M14 17h4v-4h-4",
  fire: "M12 21c-3.9 0-6.5-2.7-6.5-6.3 0-3.4 2.4-5.6 3.7-8.7.4 1.8 1.3 3 2.6 3.7.2-2.9 1.6-5.4 3.7-6.7-.3 2.7.9 4.6 2 6.2 1.1 1.6 1.9 3.2 1.9 5.5 0 3.6-2.6 6.3-6.4 6.3z",
  scale: "M5 9h14l-1.5 11h-11z M9 9a3 3 0 0 1 6 0 M12 13v3",
  cake: "M4 20h16 M5 20v-6h14v6 M5 14c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 5 0 M12 10v4 M12 5.5c.9.9.9 2 0 2.5-.9-.5-.9-1.6 0-2.5z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  dumbbell: "M3 10v4 M6 7.5v9 M18 7.5v9 M21 10v4 M6 12h12",
  muscle: "M5 18c-1.5-4 0-9 3-11l2 2-1.5 2c1.5 1 3 .5 4-1 2 0 5 2 5.5 5 .5 3-2 5-5 5H8c-1.5 0-2.5-.7-3-2z",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6z",
  bike: "M5.5 17a3 3 0 1 0 0-.1 M18.5 17a3 3 0 1 0 0-.1 M5.5 17l4-8h6l3 8 M9.5 9 12 17h-6.5 M14 6h3",
  lotus: "M12 19c-4 0-8-2-9-6 3-.5 6 .5 9 3 3-2.5 6-3.5 9-3-1 4-5 6-9 6z M12 16c-2-2.5-2-6.5 0-10 2 3.5 2 7.5 0 10z",
  play: "M8 5v14l11-7z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M7 17 17 7 M8 7h9v9",
  apple: "M12 7.5c-1.5-1-5-1.5-6.5 1.5S5 17 7.5 19.5c1.5 1.5 3 1 4.5.5 1.5.5 3 1 4.5-.5C19 17 20 12 18.5 9S13.5 6.5 12 7.5z M12 7.5c0-2 1-3.5 3-4",
  shirt: "M8 4 4 6.5l2 4 2-1V20h8V9.5l2 1 2-4L16 4c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z",
  users: "M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 3.5 6",
  mail: "M4 6h16v12H4z M4 7l8 6 8-6",
  paw: "M12 13c-3 0-6 3.5-6 6 0 1.5 1.5 2 3 1.5 1-.3 2-.8 3-.8s2 .5 3 .8c1.5.5 3 0 3-1.5 0-2.5-3-6-6-6z M5 8.5a2 2.5 0 1 0 0 .1 M9.5 5a2 2.5 0 1 0 0 .1 M14.5 5a2 2.5 0 1 0 0 .1 M19 8.5a2 2.5 0 1 0 0 .1",
  thumb: "M7 11v9H4v-9z M7 11l4-7c1.5 0 2.5 1 2.2 2.5L12.5 10H19c1.2 0 2 1 1.8 2.2l-1.3 6.3c-.2 1-1 1.5-2 1.5H7",
};
const PERK_ICONS = ["truck", "shield", "card", "undo", "gem", "gift"];

function Svg({ name, className = "pp-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const faDec = (n: number) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(n);
const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const faDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran", ...opts });
};
const pic = (p: Product, k = 0) => safeUrl(p.images[k]);
const productPath = (p: Product) => `/product/${p.id}`;
const telHref = (v: string) => `tel:${v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g, "")}`;
const Para = ({ text }: { text?: string }) => (
  <>
    {(text ?? "")
      .split(/\n\s*\n|\n/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x, k) => (
        <p key={k}>{x}</p>
      ))}
  </>
);

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label, back }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string; back?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="pp-act">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back ?? view.page} />
      {qty !== undefined && <input type="hidden" name="qty" value={qty} />}
      {size !== undefined && <input type="hidden" name="size" value={size} />}
      <button type="submit" className={className} aria-label={label} title={label}>
        {children}
      </button>
    </form>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="pp-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function Badge({ p }: { p: Product }) {
  const soldOut = p.stock === 0;
  if (soldOut) return <span className="pp-badge out">ناموجود</span>;
  return (
    <span className="pp-badges">
      {onSale(p) && <span className="pp-badge off">{fa(percentOff(p))}٪ تخفیف</span>}
      {p.badge && <span className="pp-badge hot">{p.badge}</span>}
    </span>
  );
}

function ProductCard({ view, p, i = 0, row }: { view: View; p: Product; i?: number; row?: boolean }) {
  const img = pic(p);
  const hover = pic(p, 1);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  const cat = view.shop.categories?.find((c) => c.id === p.categoryId)?.name;
  return (
    <article className={`pp-card${row ? " pp-row" : ""}`} style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="pp-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="pp-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
            {hover && <img src={hover} alt="" loading="lazy" className="pp-img-2" />}
          </span>
        </PageLink>
        <Badge p={p} />
        <div className="pp-card-acts">
          <Act view={view} op="wish" id={p.id} className={`pp-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="pp-round" label="دیدن محصول">
            <Svg name="eye" />
          </PageLink>
          {!soldOut && !hasChoices(p) && (
            <Act view={view} op="add" id={p.id} className="pp-round" label="افزودن به سبد خرید">
              <Svg name="bag" />
            </Act>
          )}
        </div>
      </div>
      <div className="pp-card-text">
        {cat && <small className="pp-card-cat">{cat}</small>}
        <PageLink to={productPath(p)} link={view.link} className="pp-card-name">
          <span>{p.name}</span>
        </PageLink>
                <Price view={view} p={p} />
        {row && (
          <>
            {p.description && <p className="pp-card-desc">{p.description.slice(0, 160)}</p>}
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="pp-btn small ghost">
                  انتخاب گزینه‌ها
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="pp-btn small ghost" label="افزودن به سبد خرید">
                  افزودن به سبد
                </Act>
              ))}
          </>
        )}
      </div>
    </article>
  );
}

/** A picture the owner can change by clicking it in the editor. */
function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`pp-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A centred heading with an optional line of text under it. */
function Head({ view, title, titlePath, text, textPath, fallback }: { view: View; title?: string; titlePath?: string; text?: string; textPath?: string; fallback?: string }) {
  // A heading without a path is fixed text (nothing to edit on the page).
  const edit = titlePath ? ed(titlePath, "text", "تیتر") : undefined;
  return (
    <div className="pp-head-c">
      <Opt value={title || fallback} editing={view.editing} edit={edit}>
        <h2 {...edit}>{title || fallback}</h2>
      </Opt>
      {textPath && (
        <Opt value={text} editing={view.editing} edit={ed(textPath, "text", "متن زیر تیتر")}>
          <p {...ed(textPath, "text", "متن زیر تیتر")}>{text}</p>
        </Opt>
      )}
    </div>
  );
}

function Empty({ view, text }: { view: View; text: string }) {
  return (
    <div className="pp-wrap pp-empty">
      <p className="pp-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="pp-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Pet shop data: animals, services, plans, team ───────────── */

/** The animals a product is for, read from its "مناسب برای" spec ("سگ، گربه"). */
const PETS: [string, string][] = [
  ["dog", "سگ"],
  ["cat", "گربه"],
  ["bird", "پرنده"],
  ["rodent", "جوندگان"],
  ["fish", "ماهی"],
];
const FOR = "مناسب برای";
const allLive = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const specOf = (p: Product, label: string) => p.specs?.find((s) => s.label.trim() === label)?.value;
const isFor = (p: Product, pet: string) => {
  const label = PETS.find(([k]) => k === pet)?.[1];
  return Boolean(label && (specOf(p, FOR) ?? "").includes(label));
};
/** Animals that have products in the shop (the menu and the filter show only these). */
const petsOf = (shop: Shop) => PETS.filter(([k]) => visible(shop).some((p) => isFor(p, k)));
/** The services (grooming, hotel…): products of the services category, booked by day and time. */
const servicesOf = (shop: Shop | undefined) => allLive(shop).filter((p) => shop?.showcaseCategoryId && p.categoryId === shop.showcaseCategoryId);
const plansOf = (shop: Shop | undefined) => allLive(shop).filter((p) => shop?.plansCategoryId && p.categoryId === shop.plansCategoryId);
const teamOf = (data: ResumeData) => (data.site?.gallery ?? []).filter((g) => g.title.trim());
const SERVICE_COLORS = ["#3EAEFF", "#439900", "#F36C42", "#A5B1F2", "#FFB400", "#8E1CE6"];

/** Text with *starred words* in the accent colour. */
function Accent({ text }: { text?: string }) {
  return (
    <>
      {(text ?? "").split(/(\*[^*]+\*)/).map((x, k) =>
        x.startsWith("*") && x.endsWith("*") && x.length > 2 ? (
          <em key={k} className="pp-acc">
            {x.slice(1, -1)}
          </em>
        ) : (
          x
        ),
      )}
    </>
  );
}

/** The squiggle under section titles. */
const Squiggle = () => (
  <svg viewBox="0 0 120 18" className="pp-squiggle" aria-hidden="true">
    <path d="M2 12c14 0 16-9 26-9 7 0 7 10 0 10s-5-10 6-10c10 0 12 10 22 10s10-10 18-10 7 10 0 10-5-10 6-10c10 0 14 9 38 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/* ───────────── Frame: header, newsletter, footer ───────────── */

type MenuItem = { to: string; label: string; sub?: { to: string; label: string }[] };
function menu(view: View): MenuItem[] {
  const data = view.ctx.data;
  const shop = view.shop;
  const cats = shopCats(shop);
  const shopSub = [
    ...petsOf(shop).map(([k, label]) => ({ to: `/shop?pet=${k}`, label: `برای ${label}` })),
    ...cats.map((c) => ({ to: `/category/${c.id}`, label: c.name })),
    ...(visible(shop).some(onSale) ? [{ to: "/shop?sale=1", label: "حراج" }] : []),
  ];
  const services = servicesOf(shop);
  const svcSub = [
    ...services.map((p) => ({ to: `/service/${p.id}`, label: p.name })),
    { to: "/booking", label: "نوبت‌دهی آنلاین" },
    { to: "/track", label: "پیگیری نوبت" },
  ];
  const pages = [
    pageOn(data, "/about") && { to: "/about", label: "درباره‌ی ما" },
    pageOn(data, "/pricing") && plansOf(shop).length > 0 && { to: "/pricing", label: "تعرفه‌ها" },
    { to: "/account", label: "حساب کاربری" },
    ...(shop.pages ?? []).filter((p) => !p.hidden).map((p) => ({ to: `/page/${p.slug}`, label: p.title })),
  ].filter(Boolean) as { to: string; label: string }[];
  return [
    { to: "/", label: "خانه" },
    { to: "/shop", label: "فروشگاه", sub: shopSub.length ? shopSub : undefined },
    ...(services.length ? [{ to: "/services", label: "خدمات", sub: svcSub }] : []),
    { to: pages[0]?.to ?? "/account", label: "صفحات", sub: pages },
    ...(pageOn(data, "/blog") && livePosts(shop).length > 0 ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
}

const isHere = (view: View, m: MenuItem) => {
  const p = view.page;
  if (m.to === "/") return p === "/";
  if (m.label === "فروشگاه") return p === "/shop" || /^\/(category|product)\//.test(p);
  if (m.label === "خدمات") return ["/services", "/booking", "/track"].includes(p) || p.startsWith("/service/");
  if (m.label === "صفحات") return ["/about", "/pricing", "/account"].includes(p) || p.startsWith("/page/");
  return p === m.to || p.startsWith(`${m.to}/`);
};

function Logo({ view, className = "pp-logo" }: { view: View; className?: string }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className={className}>
      {logo && <img src={logo} alt="" {...ed("basics.avatarUrl", "image", "لوگو")} />}
      <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>
    </PageLink>
  );
}

const shopCats = (shop: Shop) => (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id));

function Nav({ view, className }: { view: View; className: string }) {
  return (
    <nav className={className}>
      {menu(view).map((m) => (
        <span key={m.label} className={`pp-nav-item${m.sub ? " has-sub" : ""}`}>
          <PageLink to={m.to} link={view.link} current={isHere(view, m)}>
            {m.label}
            {m.sub && <Svg name="down" className="pp-ico pp-caret" />}
          </PageLink>
          {m.sub && (
            <span className="pp-sub">
              {m.sub.map((x) => (
                <PageLink key={x.to} to={x.to} link={view.link}>
                  {x.label}
                </PageLink>
              ))}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Search, wishlist, cart and sign in: the same on phones as on a computer. */
function Icons({ view }: { view: View }) {
  const { link, visitor, shop } = view;
  const count = priceCart(shop, visitor.cart).count;
  return (
    <div className="pp-icons">
      <label htmlFor="pp-find" className="pp-icon" title="جست‌وجو">
        <Svg name="search" />
        <span className="sr-only">جست‌وجو</span>
      </label>
      <PageLink to="/wishlist" link={link} className="pp-icon">
        <Svg name="heart" />
        {visitor.wishlist.length > 0 && <i>{fa(visitor.wishlist.length)}</i>}
        <span className="sr-only">علاقه‌مندی‌ها</span>
      </PageLink>
      <PageLink to="/cart" link={link} className="pp-icon">
        <Svg name="bag" />
        <i>{fa(count)}</i>
        <span className="sr-only">سبد خرید</span>
      </PageLink>
      {visitor.customer ? (
        <PageLink to="/account" link={link} className="pp-sign">
          <Svg name="user" />
          <span>{visitor.customer.name.split(" ")[0]}</span>
        </PageLink>
      ) : (
        <label htmlFor="pp-login" className="pp-sign">
          <Svg name="user" />
          <span>ورود</span>
        </label>
      )}
    </div>
  );
}

/** The search box that drops under the header (a hidden checkbox opens it; no script). */
function FindBar({ view }: { view: View }) {
  return (
    <>
      <input type="checkbox" id="pp-find" className="pp-find-tog" aria-label="جست‌وجو" />
      <form method="get" action={view.link("/search")} className="pp-find">
        <input name="q" type="search" placeholder="دنبال چه می‌گردید؟ غذای گربه، قلاده…" aria-label="جست‌وجو" defaultValue={view.visitor.query.q} />
        <button type="submit" className="pp-btn small">
          جست‌وجو
        </button>
        <label htmlFor="pp-find" className="pp-find-x" aria-label="بستن">
          <Svg name="close" />
        </label>
      </form>
    </>
  );
}

/** The phone menu: logo and round close on top, a search box, items that fold open, contact at the end. */
function Drawer({ view }: { view: View }) {
  const { link, ctx } = view;
  const b = ctx.data.basics;
  return (
    <details className="pp-menu">
      <summary className="pp-icon pp-burger" aria-label="منو">
        <Svg name="menu" className="pp-ico pp-burger-ico" />
      </summary>
      <div className="pp-drawer">
        <div className="pp-drawer-head">
          <Logo view={view} />
          <span className="pp-x" aria-hidden="true">
            <Svg name="close" />
          </span>
        </div>
        <form method="get" action={link("/search")} className="pp-drawer-find">
          <input name="q" type="search" placeholder="جست‌وجوی محصول" aria-label="جست‌وجو" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        <nav className="pp-drawer-nav">
          {menu(view).map((m) =>
            m.sub ? (
              <details key={m.label} className="pp-fold" open={isHere(view, m)}>
                <summary>
                  {m.label}
                  <Svg name="down" className="pp-ico pp-caret" />
                </summary>
                <div>
                  <PageLink to={m.to} link={link}>
                    همه‌ی {m.label}
                  </PageLink>
                  {m.sub.map((x) => (
                    <PageLink key={x.to} to={x.to} link={link} current={view.page === x.to}>
                      {x.label}
                    </PageLink>
                  ))}
                </div>
              </details>
            ) : (
              <PageLink key={m.label} to={m.to} link={link} current={isHere(view, m)} className="pp-fold-link">
                {m.label}
              </PageLink>
            ),
          )}
          <PageLink to="/wishlist" link={link} className="pp-fold-link">
            علاقه‌مندی‌ها ({fa(view.visitor.wishlist.length)})
          </PageLink>
        </nav>
        <PageLink to="/account" link={link} className="pp-btn wide">
          {view.visitor.customer ? "حساب من" : "ورود / ثبت‌نام"}
        </PageLink>
        {servicesOf(view.shop).length > 0 && (
          <PageLink to="/booking" link={link} className="pp-btn wide ghost">
            نوبت‌دهی آنلاین
          </PageLink>
        )}
        <div className="pp-drawer-info">
          {b.phone && (
            <a href={telHref(b.phone)}>
              <Svg name="phone" /> <span dir="ltr">{b.phone}</span>
            </a>
          )}
          {ctx.data.site?.contactNote && (
            <span>
              <Svg name="clock" /> {ctx.data.site.contactNote}
            </span>
          )}
        </div>
        <Socials ctx={ctx} editing={false} className="pp-socials pp-drawer-socials" />
      </div>
    </details>
  );
}

function Header(view: View) {
  return (
    <header className={`pp-head${view.page === "/" ? " is-home" : ""}`}>
      <div className="pp-wrap pp-head-row">
        <Drawer view={view} />
        <Logo view={view} />
        <Nav view={view} className="pp-nav" />
        <Icons view={view} />
      </div>
      <FindBar view={view} />
    </header>
  );
}

/** The blue newsletter band with a photo at its side. */
function Newsletter({ view }: { view: View }) {
  const { shop, editing } = view;
  const img = safeUrl(shop.lookImage);
  return (
    <section className="pp-news">
      <div className="pp-wrap pp-news-in">
        <div className="pp-news-text">
          <h2 {...ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>
            <Accent text={shop.newsletterTitle} />
          </h2>
          <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن خبرنامه")}>
            <p {...ed("site.shop.newsletterText", "text", "متن خبرنامه")}>{shop.newsletterText}</p>
          </Opt>
          <form method="post" action={view.link("/_form")} className="pp-news-form">
            <FormMeta kind="newsletter" back={view.page} />
            <input name="email" type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
            <button type="submit">عضویت</button>
          </form>
        </div>
        <span className="pp-news-pic" {...ed("site.shop.lookImage", "image", "عکس کنار خبرنامه")}>
          {img && <img src={img} alt="" loading="lazy" />}
        </span>
      </div>
    </section>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  return (
    <footer className="pp-foot">
      <div className="pp-wrap pp-foot-cols">
        <div className="pp-foot-brand">
          <Logo view={view} />
          <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه")}>
            <p {...ed("basics.summary", "multiline", "معرفی کوتاه")}>{b.summary}</p>
          </Opt>
          <Socials ctx={ctx} editing={editing} className="pp-socials" />
        </div>
        <div>
          <h3>فروشگاه</h3>
          {petsOf(shop).map(([k, label]) => (
            <PageLink key={k} to={`/shop?pet=${k}`} link={link}>
              برای {label}
            </PageLink>
          ))}
          <PageLink to="/shop?sale=1" link={link}>
            حراج
          </PageLink>
        </div>
        <div>
          <h3>راهنما</h3>
          {servicesOf(shop).length > 0 && (
            <PageLink to="/booking" link={link}>
              نوبت‌دهی آنلاین
            </PageLink>
          )}
          <PageLink to="/track" link={link}>
            پیگیری نوبت
          </PageLink>
          <PageLink to="/account" link={link}>
            حساب کاربری
          </PageLink>
          {pageOn(ctx.data, "/about") && (
            <PageLink to="/about" link={link}>
              درباره‌ی ما
            </PageLink>
          )}
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </div>
        <div className="pp-foot-contact">
          <h3>تماس با ما</h3>
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</p>
          </Opt>
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr">
              {b.email}
            </a>
          )}
          {b.phone && (
            <a href={telHref(b.phone)} dir="ltr">
              {b.phone}
            </a>
          )}
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <p {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</p>
          </Opt>
        </div>
      </div>
      <div className="pp-wrap pp-foot-bottom">
        <small>© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
      </div>
      <span className="pp-foot-pet" aria-hidden="true" />
    </footer>
  );
}

/**
 * Sign in or sign up over the page (no script): the person icon is a label of a hidden checkbox, and
 * two radio buttons switch between the forms. Signing in goes on to the account page.
 */
function LoginPopup({ view }: { view: View }) {
  const { link } = view;
  return (
    <>
      <input type="checkbox" id="pp-login" className="pp-pop-in" aria-hidden="true" tabIndex={-1} />
      <div className="pp-pop" role="dialog" aria-label="ورود یا ثبت‌نام">
        <label htmlFor="pp-login" className="pp-pop-shade" aria-label="بستن" />
        <div className="pp-pop-box">
          <label htmlFor="pp-login" className="pp-pop-x" aria-label="بستن">
            <Svg name="close" />
          </label>
          <input type="radio" name="pp-lt" id="pp-lt-1" className="pp-lt" defaultChecked />
          <input type="radio" name="pp-lt" id="pp-lt-2" className="pp-lt" />
          <div className="pp-lt-tabs">
            <label htmlFor="pp-lt-1">ورود</label>
            <label htmlFor="pp-lt-2">ثبت‌نام</label>
          </div>
          <form method="post" action={link("/_account")} className="pp-pop-form">
            <input type="hidden" name="op" value="login" />
            <label>
              <span>
                شماره‌ی موبایل <i>*</i>
              </span>
              <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09xx xxx xxxx" />
            </label>
            <label>
              <span>
                رمز عبور <i>*</i>
              </span>
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button type="submit" className="pp-btn wide">
              ورود
            </button>
            <small>
              رمز را فراموش کرده‌اید؟{" "}
              <PageLink to="/contact" link={link}>
                با ما تماس بگیرید
              </PageLink>
            </small>
          </form>
          <form method="post" action={link("/_account")} className="pp-pop-form">
            <input type="hidden" name="op" value="register" />
            <label>
              <span>
                نام و نام خانوادگی <i>*</i>
              </span>
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
            <label>
              <span>
                شماره‌ی موبایل <i>*</i>
              </span>
              <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09xx xxx xxxx" />
            </label>
            <label>
              <span>
                رمز عبور (دست‌کم ۶ نویسه) <i>*</i>
              </span>
              <input name="password" type="password" required minLength={6} autoComplete="new-password" />
            </label>
            <button type="submit" className="pp-btn wide">
              ساخت حساب
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/** The cart from the side, opened by the page shown after "add to cart" (?added=<id>); closes with a click. */
function MiniCart({ view }: { view: View }) {
  const { shop, visitor, link } = view;
  const added = visitor.query.added;
  if (!added || !allLive(shop).some((p) => p.id === added)) return null;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <>
      <input type="checkbox" id="pp-mc" className="pp-pop-in pp-mc-in" defaultChecked aria-hidden="true" tabIndex={-1} />
      <div className="pp-mc" role="dialog" aria-label="سبد خرید">
        <label htmlFor="pp-mc" className="pp-pop-shade" aria-label="بستن" />
        <aside className="pp-mc-box">
          <header>
            <h2>سبد خرید شما ({fa(cart.count)})</h2>
            <label htmlFor="pp-mc">بستن</label>
          </header>
          <div className="pp-mc-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="pp-mc-line">
                <PageLink to={productPath(l.product)} link={link} className="pp-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div>
                  <PageLink to={productPath(l.product)} link={link}>
                    {l.product.name}
                  </PageLink>
                  {l.size && <small>{l.size}</small>}
                  <div className="pp-stepper">
                    <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                      −
                    </Act>
                    <span>{fa(l.qty)}</span>
                    <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                      +
                    </Act>
                  </div>
                  <small>
                    {fa(l.qty)} × {money(view, l.unit)}
                  </small>
                </div>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pp-remove" label="حذف از سبد">
                  <Svg name="close" />
                </Act>
              </div>
            ))}
          </div>
          <footer>
            <p>
              <span>جمع کالاها:</span>
              <b>{money(view, cart.subtotal)}</b>
            </p>
            <PageLink to="/cart" link={link} className="pp-btn ghost wide">
              دیدن سبد خرید
            </PageLink>
            <PageLink to="/checkout" link={link} className="pp-btn wide">
              ادامه و پرداخت
            </PageLink>
          </footer>
        </aside>
      </div>
    </>
  );
}

/** Time left of a sale, as "۲ روز و ۵ ساعت تا پایان حراج". */
function SaleClock({ p }: { p: Product }) {
  if (!p.saleEndsAt || !onSale(p)) return null;
  const { d, h, m } = timeLeft(p.saleEndsAt);
  const text = d ? `${fa(d)} روز${h ? ` و ${fa(h)} ساعت` : ""}` : h ? `${fa(h)} ساعت${m ? ` و ${fa(m)} دقیقه` : ""}` : `${fa(Math.max(1, m))} دقیقه`;
  return (
    <span className="pp-clock">
      <Svg name="clock" /> {text} تا پایان حراج
    </span>
  );
}

/* ───────────── All products / a category ───────────── */

const PER_PAGE = 12;
const VIEWS: [string, string, string][] = [
  ["list", "list", "نمایش فهرستی"],
  ["2", "grid2", "دو ستونه"],
  ["3", "grid3", "سه ستونه"],
  ["4", "grid4", "چهار ستونه"],
];
const sizesOf = (p: Product) => (p.options ?? []).find((o) => /وزن|سایز|اندازه|طول/.test(o.name))?.values.map((v) => v.label) ?? p.sizes ?? [];

/** Hidden fields that keep the other filters when one of them changes. */
function Keep({ query, skip }: { query: Record<string, string>; skip: string[] }) {
  return (
    <>
      {Object.entries(query)
        .filter(([k, v]) => v && !skip.includes(k))
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
    </>
  );
}

const qsOf = (q: Record<string, string>, change: Record<string, string | undefined>) => {
  const all = { ...q, ...change };
  const s = Object.entries(all)
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join("&");
  return s ? `?${s}` : "";
};

function Listing(view: View & { categoryId?: string }) {
  const { shop, link, categoryId, visitor } = view;
  const q = visitor.query;
  const all = visible(shop);
  const base = filterProducts(all, shop.categories ?? [], q, categoryId);
  const list = base.list.filter((p) => (!q.size || sizesOf(p).includes(q.size)) && (!q.pet || isFor(p, q.pet)));
  const { cats, cat } = base;
  const pet = PETS.find(([k]) => k === q.pet)?.[1];
  const title = cat?.name ?? (q.sale ? "حراج ویژه" : pet ? `محصولات ${pet}` : "فروشگاه");
  const here = categoryId ? `/category/${categoryId}` : "/shop";
  const mode = VIEWS.some(([k]) => k === q.view) ? q.view! : "3";
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const at = Math.min(pages, Math.max(1, Number(q.p) || 1));
  const shown = list.slice((at - 1) * PER_PAGE, at * PER_PAGE);
  const from = list.length ? (at - 1) * PER_PAGE + 1 : 0;
  return (
    <>
      <Banner view={view} title={title} items={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : [{ label: title }]} />
      <section className="pp-wrap pp-plp">
        <div className="pp-plp-main">
          <div className="pp-plp-bar">
            <label htmlFor="pp-ftog" className="pp-ftog-btn">
              <Svg name="list" /> فیلترها
            </label>
            <small>
              {fa(from)}–{fa(from ? from + shown.length - 1 : 0)} از {fa(list.length)} محصول
            </small>
            <SortMenu view={view} here={here} />
            <div className="pp-views">
              {VIEWS.map(([k, icon, label]) => (
                <a key={k} href={`${link(here)}${qsOf(q, { view: k === "3" ? undefined : k, p: undefined })}`} aria-current={mode === k || undefined} title={label} aria-label={label}>
                  <Svg name={icon} />
                </a>
              ))}
            </div>
          </div>
          {shown.length ? (
            <div className={`pp-grid pp-cols-${mode}`}>
              {shown.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} row={mode === "list"} />
              ))}
            </div>
          ) : (
            <p className="pp-notice">{base.active || list.length !== base.list.length ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
          {pages > 1 && (
            <nav className="pp-pager" aria-label="صفحه‌ها">
              {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
                <a key={n} href={`${link(here)}${qsOf(q, { p: n === 1 ? undefined : String(n) })}`} aria-current={n === at || undefined}>
                  {fa(n)}
                </a>
              ))}
              {at < pages && (
                <a href={`${link(here)}${qsOf(q, { p: String(at + 1) })}`} aria-label="صفحه‌ی بعد">
                  <Svg name="left" />
                </a>
              )}
            </nav>
          )}
        </div>
        <input type="checkbox" id="pp-ftog" className="pp-ftog" aria-label="نمایش فیلترها" />
        <Sidebar view={view} here={here} cats={cats} cat={cat} />
      </section>
    </>
  );
}

function SideBox({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="pp-side-box" open={open}>
      <summary>
        {title}
        <Svg name="up" className="pp-ico pp-caret" />
      </summary>
      <div>{children}</div>
    </details>
  );
}

function Sidebar({ view, here, cats, cat }: { view: View; here: string; cats: Shop["categories"]; cat?: Shop["categories"][number] }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const all = visible(shop);
  const inCat = cat ? all.filter((p) => p.categoryId === cat.id) : all;
  const sizes = [...new Set(inCat.flatMap(sizesOf))];
  return (
    <aside className="pp-side">
      <SideBox title="دسته‌ها">
        <nav className="pp-side-cats">
          <PageLink to="/shop" link={link} current={!cat}>
            همه‌ی محصولات <small>{fa(all.length)}</small>
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
              {c.name} <small>{fa(all.filter((p) => p.categoryId === c.id).length)}</small>
            </PageLink>
          ))}
        </nav>
      </SideBox>
      <PriceFilter view={view} here={here} />
      <form method="get" action={link(here)} className="pp-facets">
        <Keep query={q} skip={["size", "sale", "stock", "p", "pet"]} />
        {petsOf(shop).length > 0 && (
          <SideBox title="برای چه حیوانی؟">
            <div className="pp-sizes pp-pets">
              <label>
                <input type="radio" name="pet" value="" defaultChecked={!q.pet} />
                <span>همه</span>
              </label>
              {petsOf(shop).map(([k, label]) => (
                <label key={k}>
                  <input type="radio" name="pet" value={k} defaultChecked={q.pet === k} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </SideBox>
        )}
        {sizes.length > 0 && (
          <SideBox title="وزن و اندازه">
            <div className="pp-sizes">
              {sizes.map((s) => (
                <label key={s}>
                  <input type="radio" name="size" value={s} defaultChecked={q.size === s} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </SideBox>
        )}
        <SideBox title="فقط">
          <label className="pp-check">
            <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} />
            <span>تخفیف‌دارها</span>
          </label>
          <label className="pp-check">
            <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} />
            <span>کالاهای موجود</span>
          </label>
        </SideBox>
        <div className="pp-facets-foot">
          <button type="submit" className="pp-btn small">
            اعمال فیلترها
          </button>
          <a href={link(here)} className="pp-under">
            حذف فیلترها
          </a>
        </div>
      </form>
    </aside>
  );
}

/** "Sort: newest ▾": a short list; each choice is a tiny form, so no script is needed. */
function SortMenu({ view, here }: { view: View; here: string }) {
  const q = view.visitor.query;
  const now = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  return (
    <details className="pp-sort">
      <summary>
        مرتب‌سازی: <b>{now[1]}</b>
        <Svg name="down" className="pp-ico pp-caret" />
      </summary>
      <div className="pp-sort-list">
        {SORTS.map(([k, label]) => (
          <form key={k} method="get" action={view.link(here)}>
            <Keep query={q} skip={["sort", "p"]} />
            <input type="hidden" name="sort" value={k} />
            <button type="submit" aria-current={k === now[0] || undefined}>
              {label}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}

/** Price filter: two handles on one line (plain range inputs) and a filter button. */
function PriceFilter({ view, here }: { view: View; here: string }) {
  const prices = visible(view.shop).map(unitPrice);
  if (!prices.length) return null;
  return (
    <SideBox title="قیمت">
      <PriceFilterBox link={view.link} here={here} query={view.visitor.query} prices={prices} buttonClass="pp-btn tiny" />
    </SideBox>
  );
}

/* ───────────── Product ───────────── */

/** "Arrives between ۲۸ آبان and ۲ آذر": three to seven days from today, in the Persian calendar. */
function deliveryWindow() {
  const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
  return `از فردا، ${faDate(day(1), { weekday: "long", day: "numeric", month: "long" })}`;
}

function ProductPage(view: View & { id: string }) {
  const { shop, link, visitor, ctx } = view;
  const all = visible(shop);
  // A plan (or a class without sessions) has a product page too, outside the goods' order.
  const p = allLive(shop).find((x) => x.id === view.id);
  if (!p) return <Empty view={view} text="این محصول پیدا نشد." />;
  const k = all.indexOf(p);
  const prev = k > 0 ? all[k - 1] : undefined;
  const next = k >= 0 ? all[k + 1] : undefined;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = all.filter((x) => x.id !== p.id && (!cat || x.categoryId === cat.id)).slice(0, 4);
  const more = related.length < 4 ? all.filter((x) => x.id !== p.id && !related.includes(x)).slice(0, 4 - related.length) : [];
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const rating = visitor.ratings?.[p.id];
  const perks = (shop.perks ?? []).slice(0, 4);
  const hasReturns = (shop.pages ?? []).find((x) => !x.hidden && /return|shipping|send|ersal/.test(x.slug));
  const tabs = [
    { id: "desc", label: "توضیحات" },
    { id: "specs", label: "مشخصات" },
    { id: "reviews", label: `نظرها${rating?.count ? ` (${fa(rating.count)})` : ""}` },
  ];
  return (
    <>
      <Trail view={view} items={[{ label: "فروشگاه", to: "/shop" }, ...(cat ? [{ label: cat.name, to: `/category/${cat.id}` }] : []), { label: p.name }]}>
        <span className="pp-prevnext">
          {prev && (
            <PageLink to={productPath(prev)} link={link} label={`قبلی: ${prev.name}`}>
              <Svg name="right" />
            </PageLink>
          )}
          {next && (
            <PageLink to={productPath(next)} link={link} label={`بعدی: ${next.name}`}>
              <Svg name="left" />
            </PageLink>
          )}
        </span>
      </Trail>
      <section className="pp-wrap pp-product" data-product={p.id}>
        <div className={`pp-gallery pp-n${Math.min(imgs.length, 6)}`}>
          {imgs.length > 1 && imgs.slice(0, 6).map((_, i) => <input key={i} type="radio" name="pp-g" id={`pp-g-${i}`} className="pp-g" defaultChecked={i === 0} aria-label={`عکس ${fa(i + 1)}`} />)}
          <div className="pp-thumbs">
            {imgs.length > 1 &&
              imgs.slice(0, 6).map((src, i) => (
                <label key={i} htmlFor={`pp-g-${i}`}>
                  <img src={src} alt="" loading="lazy" />
                </label>
              ))}
          </div>
          <div className="pp-mainpic">
            {(imgs.length ? imgs.slice(0, 6) : [undefined]).map((src, i) =>
              src ? (
                <ZoomOpen key={i} id={`${p.id}-${i}`} className="pp-big">
                  <img src={src} alt={p.name} />
                  <span className="pp-zoom-ico">
                    <Svg name="expand" />
                  </span>
                </ZoomOpen>
              ) : (
                <span key={i} className="pp-big" />
              ),
            )}
            <Badge p={p} />
          </div>
        </div>
        <div className="pp-info">
          <h1>{p.name}</h1>
          {rating?.count ? (
            <a href="#pp-tab-reviews" className="pp-rating">
              <Stars value={rating.avg} /> <small>({fa(rating.count)} نظر)</small>
            </a>
          ) : null}
          <div className="pp-info-price">
            <Price view={view} p={p} />
            {onSale(p) && !soldOut && <span className="pp-save">{fa(percentOff(p))}٪ تخفیف</span>}
          </div>
          <SaleClock p={p} />
          {p.description && <p className="pp-desc">{p.description.split("\n")[0]}</p>}
          <p className="pp-avail">
            وضعیت: {soldOut ? <b className="out">ناموجود</b> : <b className="in">{p.stock !== undefined && p.stock <= 3 ? `فقط ${fa(p.stock)} عدد موجود است` : "موجود"}</b>}
          </p>
          {soldOut ? (
            <p className="pp-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="pp-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <OptionPicker p={p} />
              <div className="pp-buy-row">
                <label className="pp-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" name="back" value={view.page} className="pp-btn">
                  افزودن به سبد خرید
                </button>
              </div>
              <button type="submit" name="back" value="/checkout" className="pp-btn grey wide">
                خرید فوری
              </button>
            </form>
          )}
          <div className="pp-links">
            <Act view={view} op="wish" id={p.id} className="pp-linkbtn" label="علاقه‌مندی">
              <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            </Act>
            {hasReturns && (
              <PageLink to={`/page/${hasReturns.slug}`} link={link} className="pp-linkbtn">
                <Svg name="undo" /> {hasReturns.title}
              </PageLink>
            )}
            <PageLink to="/contact" link={link} className="pp-linkbtn">
              <Svg name="question" /> سؤال درباره‌ی این محصول
            </PageLink>
          </div>
          <p className="pp-eta">
            <Svg name="truck" /> زودترین زمان تحویل: <b>{deliveryWindow()}</b>
          </p>
          {perks.length > 0 && (
            <ul className="pp-perks">
              {perks.map((x, i) => (
                <li key={x.id}>
                  {safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={PERK_ICONS[i % PERK_ICONS.length]!} />}
                  <span>{x.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="pp-meta">
            {cat && (
              <>
                دسته:{" "}
                <PageLink to={`/category/${cat.id}`} link={link}>
                  {cat.name}
                </PageLink>
              </>
            )}
          </p>
          <ShareRow view={view} p={p} />
        </div>
      </section>
      <section className="pp-wrap pp-tabs">
        {tabs.map((t, i) => (
          <input key={t.id} type="radio" name="pp-tab" id={`pp-tab-${t.id}`} className="pp-tab-in" defaultChecked={i === 0} />
        ))}
        <div className="pp-tab-labels" role="tablist">
          {tabs.map((t) => (
            <label key={t.id} htmlFor={`pp-tab-${t.id}`} role="tab">
              {t.label}
            </label>
          ))}
        </div>
        <div className="pp-tab-panels">
          <div className="pp-tab-panel">
            <div className="pp-tab-desc">
              <div className="pp-text">
                <Para text={p.description} />
              </div>
              {imgs[1] && <img src={imgs[1]} alt="" loading="lazy" />}
            </div>
          </div>
          <div className="pp-tab-panel">
            <SpecsTable p={p} className="pp-specs" />
            {!(p.specs ?? []).length && <p className="pp-muted">مشخصاتی برای این محصول ثبت نشده است.</p>}
          </div>
          <div className="pp-tab-panel">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length + more.length > 0 && (
        <section className="pp-wrap pp-sec">
          <Head view={view} title="محصولات مرتبط" />
          <div className="pp-slide-row">
            {[...related, ...more].map((x, i) => (
              <ProductCard key={x.id} view={view} p={x} i={i} />
            ))}
          </div>
        </section>
      )}
      <span hidden>{ctx.data.basics.fullName}</span>
    </>
  );
}

/** Share links (Telegram and WhatsApp), with the page address the site is published at. */
function ShareRow({ view, p }: { view: View; p: Product }) {
  const own = view.ctx.data.basics.links;
  const has = (t: string) => own.some((l) => l.type === t);
  if (!has("telegram") && !has("whatsapp")) return null;
  return (
    <p className="pp-meta pp-share">
      اشتراک‌گذاری:
      <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
        <Icon name="telegram" className="pp-ico" />
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
        <Icon name="whatsapp" className="pp-ico" />
      </a>
    </p>
  );
}

/* ───────────── About, blog, contact ───────────── */

function BlogSide({ view }: { view: View }) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  return (
    <aside className="pp-side pp-blog-side">
      <form method="get" action={link("/search")} className="pp-side-search">
        <input name="q" placeholder="جست‌وجو..." aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <SideBox title="تازه‌ترین مطالب">
        {posts.slice(0, 3).map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={link} className="pp-mini">
            <span>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <span>
              <b>{p.title}</b>
              {p.date && <small>{faDate(p.date)}</small>}
            </span>
          </PageLink>
        ))}
      </SideBox>
      {cats.length > 0 && (
        <SideBox title="برچسب‌ها">
          <div className="pp-tags">
            {cats.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </SideBox>
      )}
    </aside>
  );
}

function Blog(view: View) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  return (
    <>
      <Trail view={view} items={[{ label: "بلاگ" }]} />
      <section className="pp-wrap">
        <h1 className="pp-page-title">بلاگ</h1>
      </section>
      <section className="pp-wrap pp-blog">
        <div className="pp-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="pp-post-card">
                <PageLink to={`/blog/${p.id}`} link={link} className="pp-post-pic">
                  {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
                  {p.category && <span className="pp-badge dark">{p.category}</span>}
                </PageLink>
                <small className="pp-post-meta">
                  {p.author && `${p.author} · `}
                  {p.date && faDate(p.date)}
                </small>
                <h2>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <span {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</span>
                  </PageLink>
                </h2>
                <p>{p.excerpt || p.text.slice(0, 200)}</p>
                <PageLink to={`/blog/${p.id}`} link={link} className="pp-btn tiny ghost">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
          {!posts.length && <p className="pp-notice">هنوز مطلبی نوشته نشده است.</p>}
        </div>
        <BlogSide view={view} />
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  const p = posts.find((x) => x.id === view.id);
  if (!p) return <Blog {...view} />;
  const at = item("site.shop.posts", p.id);
  const k = posts.indexOf(p);
  const prev = posts[k + 1];
  const next = posts[k - 1];
  const related = posts.filter((x) => x.id !== p.id).slice(0, 2);
  return (
    <>
      <Trail view={view} items={[{ label: "بلاگ", to: "/blog" }, { label: p.title }]} />
      <section className="pp-wrap pp-blog">
        <article className="pp-article">
          {p.category && <span className="pp-badge dark">{p.category}</span>}
          <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
          <small className="pp-post-meta">
            {p.author && `${p.author} · `}
            {p.date && faDate(p.date)}
          </small>
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" className="pp-article-pic" {...ed(`${at}.image`, "image", "عکس")} />}
          <div className="pp-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          <nav className="pp-post-nav">
            {prev ? (
              <PageLink to={`/blog/${prev.id}`} link={link}>
                <small>مطلب قبلی</small>
                <b>{prev.title}</b>
              </PageLink>
            ) : (
              <span />
            )}
            {next && (
              <PageLink to={`/blog/${next.id}`} link={link}>
                <small>مطلب بعدی</small>
                <b>{next.title}</b>
              </PageLink>
            )}
          </nav>
          {related.length > 0 && (
            <div className="pp-related">
              <h2>شاید این‌ها را هم دوست داشته باشید</h2>
              <div>
                {related.map((r) => (
                  <PageLink key={r.id} to={`/blog/${r.id}`} link={link} className="pp-rel">
                    <span>
                      {safeUrl(r.image) && <img src={safeUrl(r.image)} alt="" loading="lazy" />}
                      {r.category && <i className="pp-badge dark">{r.category}</i>}
                    </span>
                    <b>{r.title}</b>
                  </PageLink>
                ))}
              </div>
            </div>
          )}
        </article>
        <BlogSide view={view} />
      </section>
    </>
  );
}

function Contact(view: View) {
  const { ctx, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const rows: { icon: string; label: string; value?: string; path: string; href?: string }[] = [
    { icon: "phone", label: "تلفن", value: b.phone, path: "basics.phone", href: b.phone ? telHref(b.phone) : undefined },
    { icon: "clock", label: "ساعت کاری", value: site?.contactNote, path: "site.contactNote" },
    { icon: "pin", label: "نشانی", value: site?.address || b.location, path: "site.address" },
  ];
  return (
    <>
      <Trail view={view} items={[{ label: "تماس با ما" }]} />
      <section className="pp-wrap pp-about-top">
        <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر")}>
          <h1 {...ed("site.contactTitle", "text", "تیتر")}>{site?.contactTitle}</h1>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
          <p {...ed("site.contactText", "multiline", "متن")}>{site?.contactText}</p>
        </Opt>
      </section>
      <section className="pp-wrap pp-contact">
        <div className="pp-contact-info">
          {rows.map((r) => (
            <Opt key={r.path} value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
              <div className="pp-contact-item">
                <Svg name={r.icon} />
                <span>
                  <small>{r.label}</small>
                  {r.href ? (
                    <a href={r.href} dir="auto" {...ed(r.path, "text", r.label)}>
                      {r.value}
                    </a>
                  ) : (
                    <b {...ed(r.path, "text", r.label)}>{r.value}</b>
                  )}
                </span>
              </div>
            </Opt>
          ))}
          <Socials ctx={ctx} editing={editing} className="pp-socials" />
        </div>
        <form method="post" action={view.link("/_form")} className="pp-message">
          <FormMeta kind="contact" back={view.page} />
          <h2>برای ما پیام بگذارید</h2>
          <input name="name" placeholder="نام شما" aria-label="نام شما" />
          <input name="phone" placeholder="شماره‌ی تماس" aria-label="شماره‌ی تماس" dir="ltr" inputMode="tel" />
          {view.visitor.query.subject && <input name="subject" defaultValue={view.visitor.query.subject.slice(0, 160)} aria-label="موضوع" />}
          <textarea name="body" required rows={5} placeholder="پیام شما" aria-label="پیام شما" />
          <button type="submit" className="pp-btn">
            ارسال پیام
          </button>
        </form>
      </section>
      <section className="pp-wrap pp-sec pp-sec-tight">
        {embed ? (
          <div className="pp-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
            <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
            <a href={map} {...outside(map)} className="pp-btn small">
              مسیریابی
            </a>
          </div>
        ) : (
          <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
            <a href={map ?? "#"} {...outside(map)} className="pp-map-link" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
              <Svg name="pin" /> مسیریابی روی نقشه
            </a>
          </Opt>
        )}
      </section>
    </>
  );
}

/* ───────────── Cart, wishlist, search, checkout ───────────── */

function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <>
      <Trail view={view} items={[{ label: "سبد خرید" }]} />
      <h1 className="pp-wrap pp-page-title">سبد خرید</h1>
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="pp-wrap pp-cart">
          <div className="pp-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="pp-line">
                <PageLink to={productPath(l.product)} link={link} className="pp-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="pp-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                                    {l.size && <small>{l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="pp-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="pp-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pp-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="pp-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="pp-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="pp-btn wide">
              ادامه و ثبت سفارش
            </PageLink>
          </aside>
        </section>
      )}
    </>
  );
}

function Wishlist(view: View) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <>
      <Trail view={view} items={[{ label: "علاقه‌مندی‌ها" }]} />
      <h1 className="pp-wrap pp-page-title">علاقه‌مندی‌ها</h1>
      {items.length === 0 ? (
        <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <section className="pp-wrap pp-sec pp-sec-tight">
          <div className="pp-grid pp-cols-4">
            {items.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Search(view: View) {
  const q = (view.visitor.query.q ?? "").trim();
  const { list: found, active } = filterProducts(visible(view.shop), view.shop.categories ?? [], view.visitor.query);
  return (
    <>
      <Trail view={view} items={[{ label: "جست‌وجو" }]} />
      <section className="pp-wrap pp-search">
        <form method="get" action={view.link("/search")} className="pp-search-box">
          <input name="q" defaultValue={q} placeholder="انگشتر، گردنبند، دستبند..." aria-label="جست‌وجو" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        {active &&
          (found.length ? (
            <>
              <p className="pp-muted">{fa(found.length)} محصول پیدا شد.</p>
              <div className="pp-grid pp-cols-4">
                {found.map((p, k) => (
                  <ProductCard key={p.id} view={view} p={p} i={k} />
                ))}
              </div>
            </>
          ) : (
            <p className="pp-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
          ))}
      </section>
    </>
  );
}

function Checkout(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const error = visitor.query.error;
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  if (cart.lines.length === 0)
    return (
      <>
        <Trail view={view} items={[{ label: "ثبت سفارش" }]} />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </>
    );
  return (
    <>
      <Trail view={view} items={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <h1 className="pp-wrap pp-page-title">ثبت سفارش</h1>
      <section className="pp-wrap pp-cart">
        <form method="post" action={link("/_order")} className="pp-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="pp-error">{error}</p>}
          <label>
            نام و نام خانوادگی *
            <input name="name" required maxLength={80} autoComplete="name" defaultValue={me?.name} />
          </label>
          <label>
            شماره‌ی موبایل *
            <input name="phone" required inputMode="tel" dir="ltr" maxLength={14} autoComplete="tel" placeholder="09xx xxx xxxx" defaultValue={me?.phone} />
          </label>
          <label>
            شهر
            <input name="city" maxLength={60} autoComplete="address-level2" defaultValue={addr?.city} />
          </label>
          <label>
            کد پستی
            <input name="postalCode" maxLength={20} inputMode="numeric" dir="ltr" autoComplete="postal-code" defaultValue={addr?.postalCode} />
          </label>
          <label className="full">
            نشانی کامل *
            <textarea name="address" required maxLength={400} rows={3} autoComplete="street-address" defaultValue={addr?.address} />
          </label>
          <label className="full">
            توضیحات سفارش
            <textarea name="note" maxLength={400} rows={2} placeholder="ساعت دلخواه تحویل، سایز لباس و..." />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" className="pp-trap" aria-hidden="true" />
          <button type="submit" className="pp-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="pp-sum">
          <h2>سفارش شما</h2>
          <ul className="pp-sum-lines">
            {cart.lines.map((l) => (
              <li key={l.id + (l.size ?? "")}>
                <span>
                  {l.product.name}
                  {l.size && ` (${l.size})`} × {fa(l.qty)}
                </span>
                <b>{money(view, l.total)}</b>
              </li>
            ))}
          </ul>
          <dl>
            {cart.discount > 0 && (
              <>
                <dt>کد تخفیف «{cart.coupon}»</dt>
                <dd className="pp-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="pp-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
              {shop.paymentNote}
            </p>
          )}
        </aside>
      </section>
    </>
  );
}

function Account(view: View) {
  return (
    <>
      <Trail view={view} items={[{ label: view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام" }]} />
      <section className="pp-wrap pp-sec pp-sec-tight">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="pp-wrap pp-thanks">
      <span className="pp-done" aria-hidden="true">
        ✓
      </span>
      <h1>ممنون از خرید شما!</h1>
      {code && (
        <p>
          کد پیگیری سفارش: <b dir="ltr">{code}</b>
        </p>
      )}
      {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
      {shop.paymentNote && <p className="pp-pay">{shop.paymentNote}</p>}
      <PageLink to="/shop" link={view.link} className="pp-btn">
        بازگشت به فروشگاه
      </PageLink>
    </section>
  );
}


/* ───────────── Delivery days, custom cakes, gallery, tracking ───────────── */

/* ───────────── Home ───────────── */

/** A centred title with the squiggle under it. */
function Title({ view, title, titlePath, text, textPath }: { view: View; title?: string; titlePath?: string; text?: string; textPath?: string }) {
  return (
    <div className="pp-title">
      <h2 {...(titlePath ? ed(titlePath, "text", "تیتر (کلمه‌ی رنگی بین دو ستاره)") : {})}>
        <Accent text={title} />
      </h2>
      <Squiggle />
      {textPath && (
        <Opt value={text} editing={view.editing} edit={ed(textPath, "text", "متن زیر تیتر")}>
          <p {...ed(textPath, "text", "متن زیر تیتر")}>{text}</p>
        </Opt>
      )}
    </div>
  );
}

function Hero({ view }: { view: View }) {
  const { shop, editing, link } = view;
  const img = safeUrl(shop.heroImage);
  return (
    <section className="pp-hero">
      <div className="pp-hero-art" {...ed("site.shop.heroImage", "image", "عکس بزرگ بالای صفحه")}>
        {img && <img src={img} alt="" />}
        <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "متن حباب زرد")}>
          <b className="pp-hero-bubble" {...ed("site.shop.heroKicker", "text", "متن حباب زرد")}>
            {shop.heroKicker}
          </b>
        </Opt>
      </div>
      <div className="pp-wrap pp-hero-in">
        <div className="pp-hero-text">
          <h1 {...ed("site.shop.heroTitle", "multiline", "تیتر")}>{shop.heroTitle}</h1>
          <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "text", "خط زرد زیر تیتر")}>
            <p {...ed("site.shop.heroText", "text", "خط زرد زیر تیتر")}>{shop.heroText}</p>
          </Opt>
          <div className="pp-hero-btns">
            <PageLink to="/shop" link={link} className="pp-btn white">
              خرید کنید
            </PageLink>
            {servicesOf(shop).length > 0 && (
              <PageLink to="/booking" link={link} className="pp-btn ghost light">
                نوبت آرایش و هتل
              </PageLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The coloured sale cards: a photo, "حراج", a big number, a line and a button; they swipe on phones. */
function SaleCards({ view }: { view: View }) {
  const list = (view.shop.banners ?? []).filter((b) => !b.hidden).slice(0, 6);
  if (!list.length && !view.editing) return null;
  return (
    <section className="pp-wrap pp-sales">
      <div className="pp-sale-row">
        {list.map((b) => {
          const at = item("site.shop.banners", b.id);
          const url = safeUrl(b.link);
          const inner = (
            <>
              {safeUrl(b.image) && <img src={safeUrl(b.image)} alt="" loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />}
              <span className="pp-sale-text">
                {b.kicker && <small {...ed(`${at}.kicker`, "text", "خط بالا")}>{b.kicker}</small>}
                <b {...ed(`${at}.title`, "text", "عدد یا تیتر")}>{b.title}</b>
                {b.text && <em {...ed(`${at}.text`, "text", "خط زیر")}>{b.text}</em>}
                <i>خرید کنید</i>
              </span>
            </>
          );
          return url ? (
            <a key={b.id} href={url} {...outside(url)} className="pp-sale">
              {inner}
            </a>
          ) : (
            <PageLink key={b.id} to="/shop?sale=1" link={view.link} className="pp-sale">
              {inner}
            </PageLink>
          );
        })}
        {view.editing && list.length < 6 && (
          <span className="pp-add" {...ed("site.shop.banners", "newimage", "افزودن کارت حراج")}>
            + کارت حراج
          </span>
        )}
      </div>
    </section>
  );
}

/** New products with tabs per animal (radio buttons, no script); each tab ends with a link to all of them. */
function NewArrivals({ view }: { view: View }) {
  const { shop, link } = view;
  const goods = [...visible(shop)].reverse();
  const tabs: [string, string, Product[]][] = [["all", "همه", goods], ...petsOf(shop).map(([k, label]) => [k, label, goods.filter((p) => isFor(p, k))] as [string, string, Product[]])];
  return (
    <section className="pp-wrap pp-sec">
      <Title view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" text={shop.showcaseText} textPath="site.shop.showcaseText" />
      <div className="pp-tabs">
        {tabs.map(([k], i) => (
          <input key={k} type="radio" name="pp-pt" id={`pp-t-${k}`} className={`pp-pt-in t-${k}`} defaultChecked={i === 0} />
        ))}
        <div className="pp-pt-labels">
          {tabs.map(([k, label]) => (
            <label key={k} htmlFor={`pp-t-${k}`} className={`t-${k}`}>
              {label}
            </label>
          ))}
        </div>
        {tabs.map(([k, label, list]) => (
          <div key={k} className={`pp-pt-panel t-${k}`}>
            <div className="pp-grid pp-cols-4">
              {list.slice(0, 8).map((p, i) => (
                <ProductCard key={p.id} view={view} p={p} i={i} />
              ))}
            </div>
            <PageLink to={k === "all" ? "/shop" : `/shop?pet=${k}`} link={link} className="pp-btn ghost pp-more">
              {k === "all" ? "همه‌ی محصولات" : `همه‌ی محصولات ${label}`}
            </PageLink>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The split banner: an orange side with an illustration, a brown side with the offer and a clock. */
function Promo({ view }: { view: View }) {
  const { shop, editing, link } = view;
  const ending = visible(shop)
    .filter((p) => onSale(p) && p.saleEndsAt)
    .sort((a, b) => a.saleEndsAt!.localeCompare(b.saleEndsAt!))[0];
  const img = safeUrl(shop.newImage);
  return (
    <section className="pp-wrap pp-promo">
      <span className="pp-promo-art" {...ed("site.shop.newImage", "image", "تصویر بنر")}>
        {img && <img src={img} alt="" loading="lazy" />}
      </span>
      <div className="pp-promo-text">
        <h2 {...ed("site.shop.promoTitle", "text", "تیتر بنر")}>
          <Accent text={shop.promoTitle} />
        </h2>
        <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "متن بنر")}>
          <p {...ed("site.shop.promoText", "text", "متن بنر")}>{shop.promoText}</p>
        </Opt>
        {ending && <SaleClock p={ending} />}
        <PageLink to="/shop?sale=1" link={link} className="pp-btn yellow">
          دیدن حراج
        </PageLink>
      </div>
    </section>
  );
}

/** A service card: its colour, its illustration, name, a line and a booking button. */
function ServiceCard({ view, p, k }: { view: View; p: Product; k: number }) {
  const art = pic(p);
  const color = specOf(p, "رنگ کارت") ?? SERVICE_COLORS[k % SERVICE_COLORS.length];
  return (
    <article className={`pp-svc s${(k % 4) + 1}`} style={{ "--c": color } as CSSProperties}>
      <PageLink to={`/service/${p.id}`} link={view.link} className="pp-svc-art">
        {art && <img src={art} alt="" loading="lazy" />}
      </PageLink>
      <div className="pp-svc-text">
        <h3>
          <PageLink to={`/service/${p.id}`} link={view.link}>
            {p.name}
          </PageLink>
        </h3>
        <p>{(p.description ?? "").split("\n")[0]?.slice(0, 90)}</p>
        <PageLink to={`/booking?service=${encodeURIComponent(p.name)}`} link={view.link} className="pp-btn white small">
          رزرو نوبت
        </PageLink>
      </div>
    </article>
  );
}

function ServiceCards({ view, list }: { view: View; list: Product[] }) {
  return (
    <div className="pp-svcs">
      {list.map((p, k) => (
        <ServiceCard key={p.id} view={view} p={p} k={k} />
      ))}
    </div>
  );
}

/** What customers say: white cards, the middle one raised; stars and a thumb. */
function Quotes({ view }: { view: View }) {
  const list = (view.ctx.data.site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim()).slice(0, 6);
  if (!list.length) return null;
  return (
    <section className="pp-wrap pp-sec">
      <Title view={view} title="مشتری‌ها *چه می‌گویند*؟" />
      <div className="pp-quotes">
        {list.map((t) => (
          <figure key={t.id} className="pp-quote">
            <figcaption>
              <span className="pp-avatar">{safeUrl(t.image) ? <img src={safeUrl(t.image)} alt="" loading="lazy" /> : t.name.charAt(0)}</span>
              <span>
                <b>{t.name}</b>
                {t.role && <small>{t.role}</small>}
              </span>
              <span className="pp-stars" aria-label={`${fa(t.rating ?? 5)} ستاره`}>
                {"★".repeat(Math.max(1, Math.min(5, t.rating ?? 5)))}
              </span>
            </figcaption>
            <blockquote>{t.text}</blockquote>
            <Svg name="thumb" className="pp-ico pp-thumb" />
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The brown band with three perks in round badges. */
function Perks({ view }: { view: View }) {
  const list = (view.shop.perks ?? []).slice(0, 3);
  if (!list.length) return null;
  return (
    <section className="pp-band">
      <div className="pp-wrap pp-band-in">
        {list.map((x, k) => {
          const at = item("site.shop.perks", x.id);
          return (
            <div key={x.id} className="pp-perk">
              <span className={`pp-perk-ico c${k + 1}`}>
                <Svg name={["truck", "clock", "gift"][k]!} />
              </span>
              <b {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</b>
              {x.text && <small {...ed(`${at}.text`, "text", "متن")}>{x.text}</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Blog cards: the picture grows on hover. */
function PostCards({ view, list }: { view: View; list: NonNullable<Shop["posts"]> }) {
  return (
    <div className="pp-pcards">
      {list.map((p) => (
        <article key={p.id} className="pp-pcard">
          <PageLink to={`/blog/${p.id}`} link={view.link} className="pp-pcard-pic">
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
          </PageLink>
          {p.category && <small className="pp-pcard-cat">{p.category}</small>}
          <h3>
            <PageLink to={`/blog/${p.id}`} link={view.link}>
              {p.title}
            </PageLink>
          </h3>
          {(p.excerpt || p.text) && <p>{(p.excerpt || p.text || "").slice(0, 110)}…</p>}
        </article>
      ))}
    </div>
  );
}

function Home(view: View) {
  const { shop, ctx } = view;
  const on = (k: string) => blockOn(ctx.data, k);
  const best = visible(shop).filter((p) => p.featured || p.badge).slice(0, 8);
  const services = servicesOf(shop);
  const posts = pageOn(ctx.data, "/blog") ? livePosts(shop).slice(0, 3) : [];
  return (
    <>
      <Hero view={view} />
      {on("sales") && <SaleCards view={view} />}
      {on("new") && visible(shop).length > 0 && <NewArrivals view={view} />}
      {on("promo") && <Promo view={view} />}
      {on("best") && best.length > 0 && (
        <section className="pp-wrap pp-sec">
          <Title view={view} title={shop.bestTitle} titlePath="site.shop.bestTitle" text={shop.bestText} textPath="site.shop.bestText" />
          <div className="pp-slide-row">
            {best.map((p, i) => (
              <ProductCard key={p.id} view={view} p={p} i={i} />
            ))}
          </div>
        </section>
      )}
      {on("services") && services.length > 0 && (
        <section className="pp-soft pp-wavy">
          <div className="pp-wrap pp-sec">
            <Title view={view} title={shop.discoverTitle} titlePath="site.shop.discoverTitle" />
            <ServiceCards view={view} list={services.slice(0, 4)} />
          </div>
        </section>
      )}
      {on("quotes") && <Quotes view={view} />}
      {on("newsletter") && <Newsletter view={view} />}
      {on("perks") && <Perks view={view} />}
      {on("blog") && posts.length > 0 && (
        <section className="pp-wrap pp-sec">
          <Title view={view} title="از *بلاگ* ما" />
          <PostCards view={view} list={posts} />
        </section>
      )}
    </>
  );
}

/* ───────────── Inner pages ───────────── */

/** The orange band under the header of inner pages: the title, the path and two cartoon cats. */
function PageTop({ view, title, items }: { view: View; title: string; items?: { label: string; to?: string }[] }) {
  return (
    <section className="pp-pagetop">
      <div className="pp-wrap pp-pagetop-in">
        <div>
          <h1>{title}</h1>
          <nav className="pp-trail" aria-label="مسیر صفحه">
            <PageLink to="/" link={view.link}>
              خانه
            </PageLink>
            {(items ?? [{ label: title }]).map((t, k) => (
              <span key={k}>
                <Svg name="left" className="pp-ico pp-sep" />
                {t.to ? (
                  <PageLink to={t.to} link={view.link}>
                    {t.label}
                  </PageLink>
                ) : (
                  <b aria-current="page">{t.label}</b>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

function Trail({ view, items, children }: { view: View; items: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <>
      <PageTop view={view} title={items[items.length - 1]?.label ?? ""} items={items} />
      {children && <div className="pp-wrap pp-trail-row">{children}</div>}
    </>
  );
}

function Banner({ view, title, items }: { view: View; title: string; items: { label: string; to?: string }[] }) {
  return <PageTop view={view} title={title} items={items} />;
}

/** Team photos in soft blob frames. */
function Team({ view }: { view: View }) {
  const list = teamOf(view.ctx.data);
  if (!list.length && !view.editing) return null;
  return (
    <section className="pp-soft pp-wavy">
      <div className="pp-wrap pp-sec">
        <Title view={view} title="با *تیم ما* آشنا شوید" />
        <div className="pp-team">
          {list.map((g, k) => {
            const at = item("site.gallery", g.id);
            return (
              <figure key={g.id} className={`pp-member b${(k % 3) + 1}`}>
                <span className="pp-blob">
                  <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />
                </span>
                <figcaption>
                  <b {...ed(`${at}.title`, "text", "نام")}>{g.title}</b>
                  <small {...ed(`${at}.description`, "text", "سمت")}>{g.description}</small>
                </figcaption>
              </figure>
            );
          })}
          {view.editing && (
            <span className="pp-add" {...ed("site.gallery", "newimage", "افزودن عضو تیم")}>
              + عضو تیم
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** "Why choose us": a blob photo, the text and progress bars (the numbers of the shop). */
function Why({ view }: { view: View }) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const bars = (shop.stats ?? []).filter((s) => /[\d۰-۹]/.test(s.value));
  return (
    <section className="pp-soft pp-wavy">
      <div className="pp-wrap pp-sec pp-why">
        <span className="pp-why-pic" {...ed("site.aboutImage", "image", "عکس")}>
          {safeUrl(site?.aboutImage) && <img src={safeUrl(site?.aboutImage)} alt="" loading="lazy" />}
        </span>
        <div>
          <h2 {...ed("site.aboutCaption", "text", "تیتر")}>
            <Accent text={site?.aboutCaption} />
          </h2>
          <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "multiline", "متن")}>
            <p {...ed("site.shop.lookText", "multiline", "متن")}>{shop.lookText}</p>
          </Opt>
          {bars.map((s) => {
            const at = item("site.shop.stats", s.id);
            const n = Math.max(0, Math.min(100, Number(s.value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d.]/g, "")) || 0));
            return (
              <div key={s.id} className="pp-bar">
                <span>
                  <b {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</b>
                  <small {...ed(`${at}.value`, "text", "درصد")}>{s.value}</small>
                </span>
                <i style={{ "--n": `${n}%` } as CSSProperties} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function About(view: View) {
  const { ctx, shop } = view;
  const site = ctx.data.site;
  const services = servicesOf(shop);
  return (
    <>
      <section className="pp-about-hero" {...ed("site.heroImage", "image", "عکس بالای صفحه")}>
        {safeUrl(site?.heroImage) && <img src={safeUrl(site?.heroImage)} alt="" />}
        <div className="pp-wrap pp-about-in">
          <h1 {...ed("site.aboutTitle", "text", "تیتر")}>{site?.aboutTitle}</h1>
          <div className="pp-text" {...ed("site.aboutText", "multiline", "متن")}>
            <Para text={site?.aboutText} />
          </div>
        </div>
      </section>
      {services.length > 0 && (
        <section className="pp-wrap pp-sec">
          <Title view={view} title={shop.discoverTitle} titlePath="site.shop.discoverTitle" />
          <ServiceCards view={view} list={services} />
        </section>
      )}
      <Team view={view} />
      <Quotes view={view} />
      <Why view={view} />
    </>
  );
}

function ServicesPage(view: View) {
  return (
    <>
      <PageTop view={view} title="خدمات ما" />
      <section className="pp-wrap pp-sec">
        <ServiceCards view={view} list={servicesOf(view.shop)} />
      </section>
      <Why view={view} />
    </>
  );
}

/** Booking form fields shared by the service page and the booking page. */
function BookFields({ view, service }: { view: View; service?: string }) {
  const q = view.visitor.query;
  return (
    <>
      {service && <input type="hidden" name="service" value={service} />}
      <label className="half">
        نام و نام خانوادگی *
        <input name="name" required autoComplete="name" maxLength={80} defaultValue={q.name ?? view.visitor.customer?.name} />
      </label>
      <label className="half">
        شماره‌ی موبایل *
        <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" maxLength={20} defaultValue={q.phone ?? view.visitor.customer?.phone} />
      </label>
      <label>
        نام و نژاد حیوان، سن و توضیحات
        <textarea name="body" rows={2} maxLength={1000} placeholder="مثلاً: پاپی، سگ پامرانین، ۲ ساله؛ واکسن‌ها کامل" />
      </label>
    </>
  );
}

/** The calendar and free times (shared with the salon): the chosen service rides along. */
function Picker({ view, path, service }: { view: View; path: string; service: string }) {
  const s = view.shop.schedule ?? petSchedule();
  return (
    <BookingPicker link={view.link} path={path} schedule={s} taken={takenFor(s, view.visitor.taken ?? {}, service)} query={view.visitor.query} keep={path === "/booking" ? { service } : {}} button="ثبت نوبت">
      <BookFields view={view} service={service} />
    </BookingPicker>
  );
}

function ServicePage(view: View & { id: string }) {
  const { shop, link } = view;
  const list = servicesOf(shop);
  const k = list.findIndex((x) => x.id === view.id);
  const p = list[k];
  if (!p) return <Empty view={view} text="این خدمت پیدا نشد." />;
  const facts = (p.specs ?? []).filter((x) => x.value.trim() && x.label !== "رنگ کارت");
  const color = specOf(p, "رنگ کارت") ?? SERVICE_COLORS[k % SERVICE_COLORS.length];
  return (
    <>
      <PageTop view={view} title={p.name} items={[{ label: "خدمات", to: "/services" }, { label: p.name }]} />
      <section className="pp-wrap pp-sec pp-service">
        <ZoomOpen id={p.id} className="pp-service-art">
          <span style={{ "--c": color } as CSSProperties}>{pic(p) && <img src={pic(p)} alt={p.name} />}</span>
        </ZoomOpen>
        <div className="pp-service-info">
          <h2>{p.name}</h2>
          <p className="pp-service-price">
            {p.price > 0 ? (
              <>
                از <b>{money(view, unitPrice(p))}</b>
              </>
            ) : (
              "قیمت پس از بررسی اعلام می‌شود"
            )}
          </p>
          <div className="pp-text">
            <Para text={p.description} />
          </div>
          {facts.length > 0 && (
            <ul className="pp-facts">
              {facts.map((f) => (
                <li key={f.label}>
                  <Svg name="check" /> {f.label}: <b>{f.value}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="pp-wrap pp-book" id="book">
        <Title view={view} title="رزرو *نوبت*" />
        <Picker view={view} path={`/service/${p.id}`} service={p.name} />
        <p className="pp-mine">
          <PageLink to="/track" link={link}>
            پیگیری نوبت با کد
          </PageLink>
        </p>
      </section>
    </>
  );
}

/** Online booking: pick a service (links), then a day and a time. */
function BookingPage(view: View) {
  const { shop, link, visitor } = view;
  const list = servicesOf(shop);
  const chosen = list.find((p) => p.name === visitor.query.service) ?? (list.length === 1 ? list[0] : undefined);
  return (
    <>
      <PageTop view={view} title="نوبت‌دهی آنلاین" />
      <section className="pp-wrap pp-sec pp-booking">
        <ol className="pp-steps">
          <li className={chosen ? "done" : "now"}>
            <i>۱</i> خدمت
          </li>
          <li className={chosen && visitor.query.day ? "done" : chosen ? "now" : ""}>
            <i>۲</i> روز و ساعت
          </li>
          <li className={chosen && visitor.query.day ? "now" : ""}>
            <i>۳</i> مشخصات
          </li>
        </ol>
        <nav className="pp-svc-pick" aria-label="خدمت">
          {list.map((p, k) => (
            <PageLink key={p.id} to={`/booking?service=${encodeURIComponent(p.name)}`} link={link} current={chosen?.id === p.id} className="pp-svc-chip">
              <span style={{ "--c": specOf(p, "رنگ کارت") ?? SERVICE_COLORS[k % SERVICE_COLORS.length] } as CSSProperties}>{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
              <b>{p.name}</b>
              {p.price > 0 && <small>از {money(view, unitPrice(p))}</small>}
            </PageLink>
          ))}
        </nav>
        {chosen ? <Picker view={view} path="/booking" service={chosen.name} /> : <p className="pp-notice">اول خدمتی را که می‌خواهید انتخاب کنید.</p>}
        <p className="pp-mine">
          <PageLink to="/account" link={link}>
            {visitor.customer ? "نوبت‌های من" : "ورود یا ثبت‌نام"}
          </PageLink>
          <span>·</span>
          <PageLink to="/track" link={link}>
            پیگیری نوبت با کد
          </PageLink>
        </p>
      </section>
    </>
  );
}

/** A plan as a price table: an icon, the price per period, the features (the ones it lacks are faded). */
function PlanCard({ view, p, k }: { view: View; p: Product; k: number }) {
  const price = unitPrice(p);
  return (
    <article className={`pp-plan c${(k % 3) + 1}`}>
      <h3>{p.name}</h3>
      <Svg name={["paw", "heart", "gift"][k % 3]!} className="pp-ico pp-plan-ico" />
      <b className="pp-plan-price">
        {money(view, price)}
        {p.badge && <small> / {p.badge}</small>}
      </b>
      {price < p.price && <s>{money(view, p.price)}</s>}
      <ul>
        {(p.specs ?? []).map((s) => {
          const off = /^(ندارد|—|-|خیر)$/.test(s.value.trim());
          return (
            <li key={s.label} className={off ? "off" : undefined}>
              <Svg name="check" /> {s.label}
            </li>
          );
        })}
      </ul>
      <Act view={view} op="add" id={p.id} className="pp-plan-btn" label={`انتخاب ${p.name}`}>
        انتخاب
      </Act>
    </article>
  );
}

function PricingPage(view: View) {
  const { shop } = view;
  return (
    <>
      <PageTop view={view} title="تعرفه‌ها" />
      <section className="pp-wrap pp-sec">
        <Title view={view} title={shop.discountTitle} titlePath="site.shop.discountTitle" />
        <div className="pp-plans">
          {plansOf(shop).map((p, k) => (
            <PlanCard key={p.id} view={view} p={p} k={k} />
          ))}
        </div>
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری نوبت" />
      <section className="pp-wrap pp-sec">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

export function papoSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`pa-${n}`);
  const png = (n: string) => sampleImage(`pa-${n}`, "png");
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const soon = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
  const cats = [
    { id: "f1", name: "غذای خشک" },
    { id: "f2", name: "غذای مرطوب و تشویقی" },
    { id: "f3", name: "اسباب‌بازی" },
    { id: "f4", name: "لباس و قلاده" },
    { id: "f5", name: "جای خواب و ظرف" },
    { id: "s1", name: "خدمات" },
    { id: "s2", name: "پکیج‌ها" },
  ];
  const good = (id: string, name: string, cat: string, pic: string, price: number, forPets: string, text: string, extra: Partial<Product> = {}): Product => ({
    id,
    name,
    categoryId: cat,
    price,
    images: [img(`p-${pic}`)],
    description: text,
    ...extra,
    specs: [{ label: "مناسب برای", value: forPets }, ...(extra.specs ?? [])],
  });
  const sizes = { options: [{ name: "سایز", values: ["S", "M", "L"].map((label) => ({ label })) }] };
  const goods: Product[] = [
    good("p1", "غذای خشک سگ بالغ ۲ کیلویی", "f1", "food-lily", 1_350_000, "سگ", "غذای کامل با گوشت مرغ و برنج برای سگ‌های بالغ همه‌ی نژادها؛ بدون رنگ و طعم‌دهنده‌ی مصنوعی.", { badge: "پرفروش", featured: true, specs: [{ label: "وزن", value: "۲ کیلوگرم" }, { label: "سن", value: "بالغ" }] }),
    good("p2", "غذای خشک سگ با طعم گوشت", "f1", "food-bakers", 1_150_000, "سگ", "غذای خشک مقوی با گوشت گاو و سبزیجات برای انرژی روزانه.", { salePrice: 980_000, saleEndsAt: soon(4), specs: [{ label: "وزن", value: "۲٫۷ کیلوگرم" }] }),
    good("p3", "غذای خشک سگ نژاد کوچک", "f1", "food-burns", 890_000, "سگ", "دانه‌های کوچک‌تر برای سگ‌های نژاد کوچک؛ با اردک و سیب‌زمینی.", { specs: [{ label: "وزن", value: "۱ کیلوگرم" }] }),
    good("p4", "اسباب‌بازی لاکپشت جویدنی", "f3", "toy-turtle", 290_000, "سگ، گربه", "اسباب‌بازی نرم و مقاوم برای جویدن و بازی؛ قابل شستشو.", { featured: true }),
    good("p5", "طناب بازی گره‌دار", "f3", "toy-rope", 240_000, "سگ", "طناب کتانی محکم برای کشیدن و بازی، کمک به تمیزی دندان.", { salePrice: 190_000, saleEndsAt: soon(6) }),
    good("p6", "توپ دندانی با طناب", "f3", "toy-ball", 210_000, "سگ، گربه", "توپ لاستیکی با طناب برای بازی پرتابی و ماساژ لثه."),
    good("p7", "هودی قرمز سگ", "f4", "hoodie-red", 650_000, "سگ", "هودی گرم و نرم برای روزهای سرد.", { ...sizes, badge: "جدید" }),
    good("p8", "هودی طوسی سگ", "f4", "hoodie-grey", 650_000, "سگ", "هودی نخی راحت با چاپ بامزه.", sizes),
    good("p9", "تی‌شرت سگ (۳ عدد)", "f4", "tshirts", 820_000, "سگ", "سه تی‌شرت نخی خنک برای تابستان.", sizes),
    good("p10", "ظرف غذای دوقلو", "f5", "bowl-green", 320_000, "سگ، گربه، جوندگان", "ظرف غذا و آب در یک پایه، ضدلغزش و قابل شستشو.", { featured: true }),
    good("p11", "جای خواب غاری", "f5", "bed-cave", 1_450_000, "گربه، سگ", "جای خواب سرپوشیده و گرم برای گربه و سگ کوچک.", { featured: true }),
    good("p12", "تشک گرد پشمی", "f5", "bed-round", 990_000, "گربه، سگ", "تشک گرد نرم با لبه‌ی بلند برای خواب راحت.", { salePrice: 850_000, saleEndsAt: soon(3) }),
    good("p13", "تشک ابری صورتی", "f5", "bed-pink", 1_100_000, "گربه", "تشک پرزدار و نرم که گربه‌ها عاشقش هستند.", { badge: "پرفروش" }),
    good("p14", "غذای خشک گربه", "f1", "food-burns", 1_050_000, "گربه", "غذای کامل گربه با ماهی سالمون؛ برای پوست و موی سالم.", { specs: [{ label: "وزن", value: "۱٫۵ کیلوگرم" }] }),
    good("p15", "دانه‌ی مخلوط پرندگان", "f1", "food-lily", 260_000, "پرنده", "مخلوط دانه‌های مغذی برای مرغ عشق، قناری و کاسکو.", { specs: [{ label: "وزن", value: "۵۰۰ گرم" }] }),
    good("p16", "غذای همستر و خرگوش", "f1", "food-bakers", 310_000, "جوندگان", "مخلوط غلات و سبزیجات خشک برای همستر، خرگوش و خوکچه."),
  ];
  const svc = (id: string, name: string, pic: string, price: number, text: string, specs: { label: string; value: string }[]): Product => ({ id, name, categoryId: "s1", price, images: [pic], description: text, specs });
  const services: Product[] = [
    svc("v1", "آرایش و شستشو", png("svc-groom"), 650_000, "شستشو با شامپوی مخصوص، کوتاه کردن مو و ناخن، تمیز کردن گوش؛ با حوصله و بدون استرس.\nقیمت بر اساس نژاد و اندازه‌ی حیوان است.", [{ label: "مدت", value: "۶۰ تا ۹۰ دقیقه" }, { label: "مناسب برای", value: "سگ و گربه" }]),
    svc("v2", "آموزش و تربیت", img("svc-train"), 900_000, "آموزش فرمان‌های پایه، اجتماعی کردن و اصلاح رفتار با روش تشویقی.", [{ label: "مدت", value: "۴۵ دقیقه" }, { label: "رنگ کارت", value: "#439900" }]),
    svc("v3", "هتل حیوانات", img("svc-hotel"), 450_000, "نگهداری شبانه‌روزی در اتاق‌های تمیز و گرم، با غذا و پیاده‌روی روزانه؛ هر روز عکس و خبر برایتان می‌فرستیم.\nروز تحویل را رزرو کنید و تعداد شب‌ها را در توضیحات بنویسید.", [{ label: "قیمت", value: "هر شب" }, { label: "رنگ کارت", value: "#F36C42" }]),
    svc("v4", "پیاده‌روی و گردش", png("svc-walk"), 250_000, "پیاده‌روی روزانه با سگ شما در پارک، در ساعتی که می‌خواهید.", [{ label: "مدت", value: "۴۵ دقیقه" }, { label: "رنگ کارت", value: "#A5B1F2" }]),
  ];
  const yes = "دارد";
  const no = "ندارد";
  const feats = (...on: boolean[]) => ["شستشو و خشک کردن", "کوتاه کردن ناخن", "اصلاح مو", "تمیز کردن گوش و دندان", "ویزیت دامپزشک"].map((label, k) => ({ label, value: on[k] ? yes : no }));
  const plans: Product[] = [
    { id: "m1", name: "پایه", categoryId: "s2", price: 590_000, badge: "ماهانه", images: [], specs: feats(true, true, false, false, false) },
    { id: "m2", name: "پیشرفته", categoryId: "s2", price: 1_190_000, badge: "ماهانه", images: [], specs: feats(true, true, true, true, false) },
    { id: "m3", name: "ویژه", categoryId: "s2", price: 1_790_000, badge: "ماهانه", images: [], specs: feats(true, true, true, true, true) },
  ];
  const post = (t: string) =>
    `${t}\n\nحیوان خانگی شما هم مثل ما به برنامه‌ی منظم غذا، بازی و خواب نیاز دارد. غذا را در ساعت‌های ثابت بدهید و آب تازه همیشه در دسترسش باشد.\n\nواکسن‌ها و ضدانگل را سر وقت بزنید و هر شش ماه یک بار او را برای معاینه پیش دامپزشک ببرید.`;
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "پاپو",
      jobTitle: "پت‌شاپ و خدمات حیوانات خانگی",
      // A placeholder logo, for now (the designer's comes later).
      avatarUrl: sampleImage("pa-logo-temp", "svg"),
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان شریعتی، پلاک ۱۰۰",
      summary: "پاپو؛ غذا، اسباب‌بازی و لوازم سگ، گربه، پرنده و جوندگان، به‌همراه آرایش، هتل و آموزش حیوانات خانگی.",
      links: [
        { id: "pa1", type: "instagram", url: "https://instagram.com/example" },
        { id: "pa2", type: "telegram", url: "https://t.me/example" },
        { id: "pa3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "pa4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "pa5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      address: "تهران، خیابان شریعتی، پلاک ۱۰۰",
      contactNote: "هر روز ۹ صبح تا ۱۰ شب",
      contactTitle: "سؤالی دارید؟ بپرسید",
      contactText: "برای سفارش، نوبت آرایش یا هتل و هر سؤالی پیام بگذارید یا زنگ بزنید.",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.77420&mlon=51.44480#map=16/35.77420/51.44480",
      heroImage: img("about-hero"),
      aboutTitle: "عاشق حیوان‌ها هستیم",
      aboutText: "پاپو را آدم‌هایی ساخته‌اند که خودشان سگ و گربه دارند. هر محصولی که می‌فروشیم را اول خودمان امتحان کرده‌ایم و در آرایشگاه و هتل، با حیوان شما مثل عضوی از خانواده‌ی خودمان رفتار می‌کنیم.",
      aboutImage: img("why"),
      aboutCaption: "چرا *پاپو*؟",
      gallery: [
        { id: "t1", title: "دکتر سارا محمدی", image: img("team1"), description: "دامپزشک و مدیر" },
        { id: "t2", title: "مریم رضایی", image: img("team2"), description: "آرایشگر حیوانات" },
        { id: "t3", title: "نگار احمدی", image: img("team3"), description: "مسئول هتل و نگهداری" },
      ],
      testimonials: [
        { id: "q1", name: "مینا کریمی", role: "صاحب پاپی", text: "سفارشم یک روزه رسید و هاپوی ما عاشق غذای جدیدش شده؛ بسته‌بندی هم خیلی تمیز بود.", rating: 5 },
        { id: "q2", name: "علی حسینی", role: "صاحب گربه", text: "گربه‌ام را برای آرایش بردم؛ خیلی با حوصله بودند و عکس قبل و بعد هم برایم فرستادند.", rating: 5 },
        { id: "q3", name: "نیلوفر صادقی", role: "مشتری هتل", text: "یک هفته سفر بودیم و سگمان در هتل پاپو ماند؛ هر روز عکس و فیلم می‌فرستادند. خیالمان راحت بود.", rating: 5 },
      ],
      shop: {
        categories: cats,
        products: [...goods, ...services, ...plans],
        showcaseCategoryId: "s1",
        plansCategoryId: "s2",
        heroImage: img("hero"),
        heroKicker: "۳۰٪ تخفیف",
        heroTitle: "غذا و لوازم\nحیوانات خانگی",
        heroText: "هر چیزی که دوست کوچکتان لازم دارد",
        banners: [
          { id: "b1", image: img("sale1"), kicker: "حراج", title: "۳۰٪", text: "لوازم حیوانات" },
          { id: "b2", image: img("sale2"), kicker: "حراج", title: "۲۰٪", text: "غذا و تشویقی" },
          { id: "b3", image: img("sale3"), kicker: "حراج", title: "۵۰٪", text: "سلامت و بهداشت" },
        ],
        showcaseTitle: "تازه‌ها",
        showcaseText: "جدیدترین محصولات برای سگ، گربه، پرنده و جوندگان",
        promoTitle: "تخفیف ویژه‌ی *این هفته*",
        promoText: "تا ۳۰٪ تخفیف روی غذا، جای خواب و اسباب‌بازی؛ فقط تا پایان هفته.",
        newImage: png("pets-box"),
        bestTitle: "پرفروش‌ها",
        bestText: "محصولاتی که مشتری‌ها بیشتر از همه دوستشان دارند",
        discoverTitle: "چه *خدماتی* داریم؟",
        lookText: "از سال ۱۳۹۵ کنار صاحبان حیوانات خانگی هستیم؛ با دامپزشک، آرایشگر و مراقب‌های باتجربه و محصولات اصل.",
        lookImage: img("news"),
        newsletterTitle: "از *تخفیف‌ها* باخبر شوید",
        newsletterText: "ایمیلتان را بنویسید تا تخفیف‌ها و محصولات تازه را زودتر از همه بدانید.",
        discountTitle: "پکیج‌های *آرایش و مراقبت*",
        perks: [
          { id: "k1", title: "ارسال رایگان", text: "برای خریدهای بالای ۱ میلیون تومان" },
          { id: "k2", title: "ساعت کاری", text: "هر روز ۹ صبح تا ۱۰ شب" },
          { id: "k3", title: "کارت هدیه", text: "برای دوستانی که حیوان دارند" },
        ],
        stats: [
          { id: "st1", value: "۹۸٪", label: "رضایت از آرایش و نگهداری" },
          { id: "st2", value: "۹۵٪", label: "ارسال به‌موقع سفارش‌ها" },
          { id: "st3", value: "۹۰٪", label: "مشتری‌هایی که دوباره خرید کرده‌اند" },
        ],
        coupons: [{ id: "c1", code: "PAPO10", percent: 10, maxDiscount: 300_000, active: true }],
        schedule: { ...petSchedule(), closed: [] },
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "fq1", q: "سفارش کی می‌رسد؟", a: "در تهران همان روز یا فردا؛ شهرهای دیگر ۲ تا ۴ روز کاری." },
          { id: "fq2", q: "برای آرایش باید واکسن‌ها کامل باشد؟", a: "بله؛ لطفاً دفترچه‌ی واکسن را همراه بیاورید." },
        ],
        pages: [{ id: "pg1", slug: "rules", title: "شرایط هتل", text: "حیوان باید واکسن‌های به‌روز داشته باشد.\n\nغذای همیشگی حیوان را می‌توانید همراه بیاورید." }],
        posts: [
          { id: "w1", title: "چه چیزی زندگی سگ شما را نجات می‌دهد؟", image: img("post1"), date: ago(4), author: "دکتر سارا محمدی", category: "سگ و گربه", excerpt: "چند عادت ساده که سلامت سگ را سال‌ها حفظ می‌کند.", text: post("چند عادت ساده که سلامت سگ را سال‌ها حفظ می‌کند.") },
          { id: "w2", title: "گربه‌ها چرا این‌قدر می‌خوابند؟", image: img("post2"), date: ago(11), author: "نگار احمدی", category: "گربه", text: post("گربه‌ها روزی ۱۲ تا ۱۶ ساعت می‌خوابند و این کاملاً طبیعی است.") },
          { id: "w3", title: "سگ‌ها چرا بازی می‌کنند؟", image: img("post3"), date: ago(19), author: "مریم رضایی", category: "تربیت", text: post("بازی برای سگ فقط سرگرمی نیست؛ راه یادگیری و تخلیه‌ی انرژی است.") },
        ],
        shippingFee: 70_000,
        freeShippingFrom: 1_000_000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش برای تأیید و اعلام شماره‌ی کارت با شما تماس می‌گیریم.",
        orderNote: "سفارش ثبت شد؛ به‌زودی برای هماهنگی ارسال تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.pp { --pp-ink: var(--color-text); --pp-muted: var(--color-muted); --pp-line: #E9E9E9; --pp-soft: #F5F5F5; --pp-pink: #F8EBEF; --pp-lilac: #F6E8F4; --pp-blue: #D8EDF5; --pp-sand: #F5ECE9;
  --pp-hot: #E5484D; --pp-off: #F0883E; --pp-acc: var(--color-primary);
  --pp-wrap: min(1370px, 100% - 2 * clamp(14px, 3cqi, 40px));
  --sk-accent: #111; --sk-card: var(--color-bg); --sk-line: var(--pp-line); --sk-soft: var(--pp-soft); --sk-muted: var(--pp-muted); --sk-card-radius: 0; --sk-radius: 0;
  background: var(--color-bg); color: var(--pp-ink); min-height: 100%; font-size: 14px; font-weight: 300; line-height: 1.8; }
.pp a { color: inherit; text-decoration: none; }
.pp button { font: inherit; color: inherit; }
.pp .sk-btn { border-radius: 0; background: #111; color: #fff; }
.pp .sk-btn:hover { background: var(--pp-acc); }
.pp .sk-form input, .pp .sk-form textarea, .pp .sk-coupon input, .pp .sk-card { border-radius: 0; }
.pp b, .pp strong, .pp h3 { font-weight: 600; }
.pp h1, .pp h2 { font-weight: 400; letter-spacing: 0; line-height: 1.5; }
.pp .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.pp-wrap { width: var(--pp-wrap); margin-inline: auto; }
.pp-ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.pp-act { display: contents; }
.pp-sec { padding-block: clamp(40px, 5.5cqi, 80px); }
.pp-sec-tight { padding-top: 10px; }
.pp-sec-line { border-top: 1px solid var(--pp-line); }
.pp-muted { color: var(--pp-muted); }
.pp-notice { padding: 18px 24px; border-inline-start: 3px solid var(--pp-ink); background: var(--pp-soft); }
.pp-error { padding: 12px 16px; background: #FDECEC; color: #C62A2F; }
.pp-text { display: grid; gap: 14px; color: var(--pp-muted); line-height: 2.1; }
.pp-pic { position: relative; display: block; overflow: hidden; background: var(--pp-soft); }
.pp-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-add { display: grid; place-items: center; min-height: 80px; border: 1px dashed var(--pp-line); color: var(--pp-muted); cursor: pointer; }
.pp-main > * { animation: pp-in .6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes pp-in { from { opacity: 0; transform: translateY(14px); } }

/* Buttons: black, a framed light one, a grey wide one; small sizes */
.pp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 28px; border: 1px solid #111; background: #111; color: #fff !important; font-size: .86em; font-weight: 500; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.pp-btn:hover { background: var(--pp-acc); border-color: var(--pp-acc); }
.pp-btn.ghost { background: transparent; color: #111 !important; }
.pp-btn.ghost:hover { background: #111; color: #fff !important; border-color: #111; }
.pp-btn.grey { background: var(--pp-soft); border-color: var(--pp-soft); color: #111 !important; }
.pp-btn.grey:hover { background: #111; border-color: #111; color: #fff !important; }
.pp-btn.small { min-height: 36px; padding: 0 18px; font-size: .8em; }
.pp-btn.tiny { min-height: 30px; padding: 0 14px; font-size: .76em; }
.pp-btn.wide, .pp-btn.full { width: 100%; }
.pp-under { display: inline-block; padding-bottom: 2px; border: 0; border-bottom: 1px solid currentColor; background: none; font-size: .8em; font-weight: 500; cursor: pointer; }
.pp-under:hover { color: var(--pp-acc); }
.pp-more { display: inline-flex; align-items: center; gap: 4px; font-size: .86em; }
.pp-more .pp-ico { width: 16px; height: 16px; }

/* Headings of sections */
.pp-head-c { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(22px, 3cqi, 36px); text-align: center; }
.pp-head-c h2 { font-size: clamp(1.5em, 2.2cqi, 2.05em); }
.pp-head-c p, .pp-head-c a { color: var(--pp-muted); font-size: .92em; }

/* Header */
.pp-head { position: sticky; top: 0; z-index: 30; background: var(--color-bg); }
.pp-head-home { border-bottom: 1px solid transparent; }
.pp-head-in { display: flex; align-items: center; gap: 28px; min-height: 76px; }
.pp-logo { display: inline-flex; align-items: center; flex: none; }
.pp-logo img { display: block; width: auto; height: 22px; }
.pp-logo b { font-size: 1.7em; font-weight: 400; letter-spacing: .02em; }
.pp-nav { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); margin-inline: auto; font-size: .86em; font-weight: 500; }
.pp-nav-item { position: relative; }
.pp-nav-item > a { display: inline-flex; align-items: center; gap: 3px; padding: 26px 0; transition: color .2s; }
.pp-nav-item > a::after { content: ""; position: absolute; inset-inline: 0; bottom: 20px; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.pp-nav-item > a:hover::after, .pp-nav-item > a[aria-current="page"]::after { transform: scaleX(1); }
.pp-caret { width: 12px; height: 12px; stroke-width: 1.6; }
.pp-sub { position: absolute; top: 100%; inset-inline-start: -18px; z-index: 5; display: grid; min-width: 200px; padding: 12px 0; background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.pp-nav-item:hover .pp-sub, .pp-nav-item:focus-within .pp-sub { opacity: 1; visibility: visible; transform: none; }
.pp-sub a { padding: 7px 20px; font-weight: 400; }
.pp-sub a:hover { color: var(--pp-acc); }
.pp-icons { display: flex; align-items: center; gap: 18px; }
.pp-icon { position: relative; display: inline-flex; align-items: center; transition: color .2s; }
.pp-icon:hover { color: var(--pp-acc); }
.pp-icon > i { position: absolute; top: -7px; inset-inline-end: -9px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px; background: #111; color: #fff; font-size: 10px; font-style: normal; font-weight: 500; line-height: 16px; text-align: center; }
.pp-head-inner .pp-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 80px; }
.pp-head-inner .pp-icons { justify-self: end; }
.pp-head-search { display: flex; width: min(340px, 100%); border: 1px solid var(--pp-line); }
.pp-head-search input, .pp-side-search input, .pp-drawer-search input { flex: 1; min-width: 0; padding: 9px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: .9em; }
.pp-head-search input:focus, .pp-side-search input:focus, .pp-drawer-search input:focus { outline: none; }
.pp-head-search button, .pp-side-search button, .pp-drawer-search button { display: grid; place-items: center; padding-inline: 12px; border: 0; background: none; cursor: pointer; }
.pp-head-search .pp-ico { width: 17px; height: 17px; }
.pp-head-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--pp-line); }
.pp-head-row2 .pp-nav { margin: 0; }
.pp-head-row2 .pp-nav-item > a { padding: 14px 0; }
.pp-head-row2 .pp-nav-item > a::after { bottom: 9px; }
.pp-browse { position: relative; font-size: .84em; font-weight: 600; }
.pp-browse > summary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 0; cursor: pointer; list-style: none; }
.pp-browse > summary::-webkit-details-marker { display: none; }
.pp-browse > div { position: absolute; top: 100%; inset-inline-start: 0; z-index: 6; display: grid; min-width: 230px; padding: 8px 0; border: 1px solid var(--pp-line); background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); }
.pp-browse > div a { padding: 8px 18px; font-weight: 400; }
.pp-browse > div a:hover { background: var(--pp-soft); }
.pp-head-contact { display: flex; justify-content: flex-end; gap: 22px; font-size: .84em; }
.pp-head-contact a { display: inline-flex; align-items: center; gap: 6px; }
.pp-head-contact .pp-ico { width: 17px; height: 17px; }
.pp-menu { display: none; }
.pp-menu > summary { list-style: none; cursor: pointer; }
.pp-menu > summary::-webkit-details-marker { display: none; }
.pp-burger .pp-x { display: none; }
.pp-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; background: rgb(0 0 0 / .4); }
.pp-menu[open] .pp-burger-ico { display: none; }
.pp-menu[open] .pp-x { position: absolute; top: 16px; inset-inline-end: 16px; display: block; width: 40px; height: 40px; padding: 9px; border-radius: 50%; background: #fff; color: #111; }
.pp-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 4px; width: min(340px, 86%); height: 100vh; padding: 18px 22px 90px; overflow-y: auto; background: var(--color-bg); box-shadow: 0 0 40px rgb(0 0 0 / .2); animation: pp-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes pp-drawer { from { transform: translateX(100%); } }
/* The open phone menu sits above everything of the page (the header is its own layer, under the bar of shortcuts otherwise). */
.pp-head:has(.pp-menu[open]) { z-index: 200; }
.pp:has(.pp-menu[open]) .pp-phonebar { visibility: hidden; }
.pp .pp-drawer .pp-nav-item > a { color: var(--pp-brown); padding: 12px 0; }
.pp .pp-drawer .pp-nav-item > a[aria-current="page"] { color: var(--pp-red); }
.pp .pp-drawer { color: var(--pp-brown); }
.pp .pp-menu[open] .pp-x { width: 42px; height: 42px; padding: 10px; color: #111; stroke-width: 2; }
.pp-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pp .pp-drawer-head { margin: -18px -22px 10px; padding: 14px 22px; background: var(--pp-choc); }
.pp-drawer-search { display: flex; margin-bottom: 8px; border: 1px solid var(--pp-line); }
.pp-drawer-nav { display: grid; }
.pp-drawer-nav .pp-nav-item > a { width: 100%; padding: 11px 0; border-bottom: 1px solid var(--pp-line); }
.pp-drawer-nav .pp-nav-item > a::after, .pp-drawer-nav .pp-caret { display: none; }
.pp-drawer-nav .pp-sub { position: static; display: grid; min-width: 0; padding: 0 14px 6px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
.pp-drawer-nav .pp-sub a { padding: 6px 0; font-size: .92em; color: var(--pp-muted); }
.pp-drawer > a { padding: 10px 0; }
.pp-drawer hr { width: 100%; margin: 8px 0; border: 0; border-top: 1px solid var(--pp-line); }
.pp-drawer .pp-rate { margin-top: 12px; font-size: .82em; }

/* Home: categories, product row, sale head, store strip */
.pp-cats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; }
.pp-cat { display: grid; justify-items: center; gap: 14px; text-align: center; }
.pp-cat-pic { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: var(--pp-soft); }
.pp-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.pp-cat:hover .pp-cat-pic img { transform: scale(1.08); }
.pp-cat b { font-size: .82em; font-weight: 500; }
.pp-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 20px) / 4); gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: thin; }
.pp-slide-row > * { scroll-snap-align: start; }
.pp-sale-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-bottom: 22px; }
.pp-sale-head h2 { font-size: clamp(1.4em, 2cqi, 1.9em); }
.pp-sale-head .pp-more { margin-inline-start: auto; }
.pp-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--pp-hot); font-size: .82em; font-weight: 500; }
.pp-clock .pp-ico { width: 15px; height: 15px; }
.pp-store { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px 18px; min-height: 64px; padding: 10px 16px; background: var(--pp-lilac); font-size: 1.05em; }
.pp-store > .pp-ico { width: 22px; height: 22px; }

/* Product cards: a square picture on pale grey (the second picture on hover), badges, side buttons */
.pp-card { display: grid; gap: 4px; align-content: start; text-align: center; animation: pp-in .6s calc(var(--i) * 50ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.pp-card-pic { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--pp-soft); }
.pp-img, .pp-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pp-img img { object-fit: cover; mix-blend-mode: multiply; transition: opacity .5s, transform .9s cubic-bezier(.2, 1, .3, 1); }
.pp-img .pp-img-2 { opacity: 0; }
.pp-card:hover .pp-img .pp-img-2 { opacity: 1; }
.pp-card:hover .pp-img img { transform: scale(1.04); }
.pp-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 2.6em; color: var(--pp-muted); }
.pp-badges { position: absolute; top: 12px; inset-inline-start: 12px; display: grid; justify-items: start; gap: 5px; pointer-events: none; }
.pp-badge { display: inline-block; padding: 1px 8px; background: var(--pp-hot); color: #fff; font-size: .7em; font-weight: 500; line-height: 1.9; }
.pp-badge.off { background: var(--pp-off); }
.pp-badge.out { position: absolute; top: 12px; inset-inline-start: 12px; background: #8A8A8A; }
.pp-badge.dark { background: #111; }
.pp-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2; display: grid; gap: 6px; opacity: 0; transform: translateX(-10px); transition: opacity .3s, transform .3s; }
.pp-card:hover .pp-card-acts, .pp-card-acts:focus-within { opacity: 1; transform: none; }
.pp-round { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 4px 14px -6px rgb(0 0 0 / .3); cursor: pointer; transition: background .2s, color .2s; }
.pp-round:hover, .pp-round.on { background: #111; color: #fff !important; }
.pp-round .pp-ico { width: 17px; height: 17px; }
.pp-card-text { display: grid; justify-items: center; gap: 2px; padding-top: 10px; }
.pp-card-cat { color: #999; font-size: .72em; }
.pp-card-name { font-size: .92em; font-weight: 400; }
.pp-card-name:hover { color: var(--pp-acc); }
.pp-goldline { color: var(--pp-muted); font-size: .76em; }
.pp-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; font-size: .9em; }
.pp-price b { font-weight: 500; }
.pp-price s { color: #A0A0A0; font-size: .86em; }
.pp-card-desc { color: var(--pp-muted); font-size: .86em; line-height: 1.9; }

/* Shop: picture band, bar, grid modes, side column, pages */
.pp-banner { position: relative; display: grid; place-items: center; min-height: clamp(150px, 15cqi, 230px); overflow: hidden; background: #D6D6D6; text-align: center; }
.pp-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-banner > div { position: relative; display: grid; justify-items: center; gap: 2px; padding: 20px; }
.pp-banner h1 { font-size: clamp(1.8em, 3cqi, 2.6em); }
.pp-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--pp-muted); font-size: .8em; }
.pp-trail a:hover { color: var(--pp-ink); }
.pp-trail i { margin-inline: 6px; font-style: normal; opacity: .6; }
.pp-trail b { color: var(--pp-ink); font-weight: 400; }
.pp-sep { width: 12px; height: 12px; margin-inline: 4px; opacity: .6; }
.pp-trail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 16px; }
.pp-prevnext { display: flex; gap: 6px; }
.pp-prevnext .pp-ico { width: 18px; height: 18px; }
.pp-plp { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: clamp(24px, 3cqi, 40px); align-items: start; padding-block: 26px clamp(40px, 5cqi, 70px); }
.pp-plp-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; font-size: .86em; }
.pp-plp-bar > small { margin-inline-end: auto; color: var(--pp-muted); font-size: 1em; }
.pp-views { display: flex; gap: 6px; }
.pp-views a { display: grid; place-items: center; width: 30px; height: 30px; color: #B5B5B5; }
.pp-views a[aria-current], .pp-views a:hover { color: #111; }
.pp-views .pp-ico { width: 18px; height: 18px; }
.pp-sort { position: relative; }
.pp-sort > summary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: var(--pp-muted); cursor: pointer; list-style: none; }
.pp-sort > summary::-webkit-details-marker { display: none; }
.pp-sort > summary b { color: var(--pp-ink); font-weight: 400; }
.pp-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 170px; border: 1px solid var(--pp-line); background: var(--color-bg); box-shadow: 0 12px 24px -16px rgb(0 0 0 / .3); }
.pp-sort-list button { width: 100%; padding: 8px 14px; border: 0; background: none; text-align: start; cursor: pointer; }
.pp-sort-list button:hover, .pp-sort-list button[aria-current] { background: var(--pp-soft); }
.pp-grid { display: grid; gap: 34px 20px; }
.pp-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pp-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pp-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.pp-cols-list { grid-template-columns: 1fr; gap: 24px; }
.pp-row { grid-template-columns: 180px minmax(0, 1fr); gap: 24px; text-align: start; }
.pp-row .pp-card-text { justify-items: start; align-content: center; padding: 0; gap: 4px; }
.pp-row .pp-price { justify-content: flex-start; }
.pp-row .pp-btn { margin-top: 10px; }
.pp-pager { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.pp-pager a { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid transparent; font-size: .9em; }
.pp-pager a[aria-current] { border-color: #111; }
.pp-pager .pp-ico { width: 16px; height: 16px; }
.pp-side { display: grid; gap: 0; align-content: start; }
.pp-plp > .pp-side { order: -1; }
.pp-side-box { padding-block: 16px; border-bottom: 1px solid var(--pp-line); }
.pp-side-box > summary { display: flex; align-items: center; justify-content: space-between; font-size: 1.05em; font-weight: 400; cursor: pointer; list-style: none; }
.pp-side-box > summary::-webkit-details-marker { display: none; }
.pp-side-box:not([open]) .pp-caret { transform: rotate(180deg); }
.pp-side-box > div { display: grid; gap: 8px; padding-top: 14px; }
.pp-side-cats { display: grid; gap: 6px; font-size: .9em; }
.pp-side-cats a { display: flex; justify-content: space-between; color: #555; }
.pp-side-cats a:hover, .pp-side-cats a[aria-current] { color: var(--pp-ink); font-weight: 500; }
.pp-side-cats small, .pp-check small { color: #AAA; }
.pp-check { display: flex; align-items: center; gap: 10px; font-size: .9em; color: #555; cursor: pointer; }
.pp-check span { flex: 1; }
.pp-check input { width: 15px; height: 15px; margin: 0; accent-color: #111; }
.pp-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.pp-sizes label { cursor: pointer; }
.pp-sizes input { position: absolute; opacity: 0; }
.pp-sizes span { display: grid; place-items: center; min-width: 38px; height: 34px; padding: 0 8px; border: 1px solid var(--pp-line); font-size: .86em; }
.pp-sizes input:checked + span { border-color: #111; background: #111; color: #fff; }
.pp-facets-foot { display: flex; align-items: center; gap: 16px; padding-top: 18px; }
.pp-range { position: relative; height: 18px; }
.pp-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: #111; }
.pp-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.pp-range input::-webkit-slider-thumb { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.pp-range input::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; }
.pp-range input::-webkit-slider-runnable-track { background: none; }
.pp-range input::-moz-range-track { background: none; }
.pp-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.pp-range-foot small { font-size: .8em; color: #555; }
.pp-side-search { display: flex; border: 1px solid var(--pp-line); margin-bottom: 4px; }

/* Product page */
.pp-product { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(26px, 4cqi, 60px); padding-bottom: clamp(30px, 4cqi, 56px); }
.pp-gallery { position: relative; display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.pp-gallery.pp-n0, .pp-gallery.pp-n1 { grid-template-columns: 1fr; }
.pp-g { position: absolute; opacity: 0; pointer-events: none; }
.pp-thumbs { display: grid; gap: 10px; }
.pp-thumbs label { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border: 1px solid transparent; background: var(--pp-soft); cursor: pointer; transition: border-color .2s; }
.pp-thumbs img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pp-mainpic { position: relative; display: grid; background: var(--pp-soft); }
.pp-big { grid-area: 1 / 1; position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.pp-big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pp-gallery:not(.pp-n0):not(.pp-n1) .pp-big { visibility: hidden; opacity: 0; transition: opacity .4s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.pp-g:nth-of-type(${n}):checked ~ .pp-mainpic > .pp-big:nth-child(${n})`).join(", ")} { visibility: visible !important; opacity: 1 !important; }
${[1, 2, 3, 4, 5, 6].map((n) => `.pp-g:nth-of-type(${n}):checked ~ .pp-thumbs > label:nth-child(${n})`).join(", ")} { border-color: #111; }
.pp-zoom-ico { position: absolute; top: 14px; inset-inline-end: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.pp-zoom-ico .pp-ico { width: 16px; height: 16px; }
.pp-mainpic .pp-badges, .pp-mainpic .pp-badge.out { z-index: 1; }
.pp-info { display: grid; gap: 12px; align-content: start; }
.pp-info h1 { font-size: clamp(1.5em, 2.1cqi, 2em); line-height: 1.5; }
.pp-rating { display: inline-flex; align-items: center; gap: 6px; font-size: .86em; color: var(--pp-muted); }
.pp-info-price { display: flex; align-items: center; gap: 12px; }
.pp-info-price .pp-price { font-size: 1.35em; }
.pp-save { padding: 1px 8px; background: var(--pp-off); color: #fff; font-size: .78em; }
.pp-desc { color: var(--pp-muted); line-height: 2; }
.pp-avail { font-size: .9em; }
.pp-avail .in { color: #16A34A; font-weight: 500; }
.pp-avail .out { color: var(--pp-hot); font-weight: 500; }
.pp-goldbox { display: grid; gap: 8px; padding: 16px 18px; border: 1px solid var(--pp-line); background: #FCFAF6; }
.pp-goldbox h3 { font-size: .95em; }
.pp-goldbox dl { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 10px; row-gap: 0; margin: 0; font-size: .88em; }
.pp-goldbox dt { grid-row: 1; color: var(--pp-muted); }
.pp-goldbox dd { grid-row: 2; margin: 0 0 0 24px; font-weight: 500; }
.pp-goldbox .pp-under { justify-self: start; }
.pp-buy { display: grid; gap: 10px; }
.pp-buy-row { display: flex; gap: 10px; }
.pp-buy-row .pp-btn { flex: 1; }
.pp-qty input { width: 90px; height: 44px; padding: 0 10px; border: 1px solid var(--pp-line); background: var(--color-bg); color: inherit; font: inherit; text-align: center; }
.pp-links { display: flex; flex-wrap: wrap; gap: 8px 22px; padding-top: 6px; }
.pp-linkbtn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; font-size: .86em; cursor: pointer; }
.pp-linkbtn:hover { color: var(--pp-acc); }
.pp-linkbtn .pp-ico, .pp-eta .pp-ico { width: 17px; height: 17px; }
.pp-eta { display: flex; align-items: center; gap: 8px; font-size: .86em; color: #555; }
.pp-eta b { font-weight: 500; color: var(--pp-ink); }
.pp-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 6px 0 0; padding: 16px 10px; list-style: none; border: 1px solid var(--pp-line); text-align: center; }
.pp-perks li { display: grid; justify-items: center; gap: 6px; font-size: .78em; color: #555; }
.pp-perks .pp-ico, .pp-perks img { width: 26px; height: 26px; stroke-width: 1.2; object-fit: contain; }
.pp-meta { display: flex; align-items: center; gap: 6px; color: var(--pp-muted); font-size: .86em; }
.pp-meta a:hover { color: var(--pp-ink); }
.pp-share .pp-ico { width: 17px; height: 17px; }
.pp-tabs { display: grid; padding-block: 10px clamp(30px, 4cqi, 60px); border-top: 1px solid var(--pp-line); }
.pp-tab-in { position: absolute; opacity: 0; pointer-events: none; }
.pp-tab-labels { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px clamp(18px, 3cqi, 44px); margin-bottom: 26px; }
.pp-tab-labels label { position: relative; padding: 14px 0 8px; color: var(--pp-muted); font-size: 1.02em; cursor: pointer; }
.pp-tab-labels label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: #111; transform: scaleX(0); transition: transform .3s; }
.pp-tab-panel { display: none; }
${[1, 2, 3, 4].map((n) => `.pp-tab-in:nth-of-type(${n}):checked ~ .pp-tab-panels > .pp-tab-panel:nth-child(${n})`).join(", ")} { display: block; animation: pp-in .4s ease both; }
${[1, 2, 3, 4].map((n) => `.pp-tab-in:nth-of-type(${n}):checked ~ .pp-tab-labels > label:nth-child(${n})`).join(", ")} { color: var(--pp-ink); }
${[1, 2, 3, 4].map((n) => `.pp-tab-in:nth-of-type(${n}):checked ~ .pp-tab-labels > label:nth-child(${n})::after`).join(", ")} { transform: scaleX(1); }
.pp-tab-desc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.pp-tab-desc img { width: 100%; max-height: 460px; aspect-ratio: 4 / 3; object-fit: cover; background: var(--pp-soft); }
.pp-specs { width: min(720px, 100%); margin-inline: auto; }
.pp-breakup { display: grid; gap: 12px; width: min(620px, 100%); margin-inline: auto; }
.pp-breakup table { width: 100%; border-collapse: collapse; font-size: .92em; }
.pp-breakup th, .pp-breakup td { padding: 11px 14px; border-bottom: 1px solid var(--pp-line); text-align: start; font-weight: 400; }
.pp-breakup td { text-align: end; white-space: nowrap; }
.pp-breakup tr:nth-child(odd) { background: #FAFAFA; }
.pp-breakup .total th, .pp-breakup .total td { border-bottom: 0; background: #111; color: #fff; font-weight: 500; }
.pp-breakup p { font-size: .84em; }
.pp-tab-panels .sk-reviews { width: min(860px, 100%); margin-inline: auto; }

/* About */
.pp-about-top { display: grid; justify-items: center; gap: 4px; padding-block: 0 clamp(18px, 2.4cqi, 32px); text-align: center; }
.pp-about-top h1, .pp-page-title { font-size: clamp(1.8em, 2.8cqi, 2.5em); }
.pp-page-title { padding-block: 6px 18px; }
.pp-about-top p { max-width: 40em; color: var(--pp-muted); }
.pp-about-pics { display: grid; grid-template-columns: 1fr 1fr; }
.pp-about-pics > .pp-pic { aspect-ratio: 960 / 687; }
.pp-story { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 2fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.pp-story h2 { display: flex; align-items: center; gap: 16px; font-size: clamp(1.5em, 2.3cqi, 2.1em); }
.pp-story h2 i { width: 70px; height: 1px; background: currentColor; }
.pp-story > div { display: grid; gap: 16px; }
.pp-story-lead { font-size: 1.15em; font-weight: 500; line-height: 1.9; white-space: pre-line; }
.pp-mission { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; width: var(--pp-wrap); margin-inline: auto; }
.pp-mission-pic { aspect-ratio: 960 / 540; }
.pp-mission-text { display: grid; align-content: center; gap: 30px; padding: clamp(24px, 4cqi, 60px); background: var(--pp-soft); }
.pp-mission-text h3 { margin-bottom: 8px; font-size: 1.25em; font-weight: 400; }
.pp-mission-text p { color: var(--pp-muted); font-size: .9em; line-height: 2; }
.pp-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 26px; text-align: center; }
.pp-values > div { display: grid; justify-items: center; gap: 8px; }
.pp-values .pp-ico, .pp-values img { width: 34px; height: 34px; stroke-width: 1.2; object-fit: contain; }
.pp-values h3 { font-size: 1.05em; font-weight: 500; }
.pp-values p { max-width: 24em; color: var(--pp-muted); font-size: .86em; line-height: 1.9; }
.pp-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.pp-team figure { display: grid; gap: 10px; margin: 0; }
.pp-team-pic { position: relative; display: block; aspect-ratio: 435 / 488; overflow: hidden; background: var(--pp-soft); }
.pp-team-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.pp-team figure:hover img { transform: scale(1.05); }
.pp-team figcaption { display: grid; }
.pp-team b { font-weight: 500; }
.pp-team small { color: var(--pp-muted); }
.pp-quotes { position: relative; background: var(--pp-pink); }
.pp-q-in { position: absolute; opacity: 0; pointer-events: none; }
.pp-q-list { display: grid; padding-block: clamp(30px, 4cqi, 60px); }
.pp-q-item { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) 240px; align-items: center; gap: clamp(20px, 4cqi, 60px); margin: 0; }
.pp-q2 .pp-q-item, .pp-q3 .pp-q-item, .pp-q4 .pp-q-item, .pp-q5 .pp-q-item { visibility: hidden; opacity: 0; transition: opacity .5s; }
${[1, 2, 3, 4, 5].map((n) => `.pp-q-in:nth-of-type(${n}):checked ~ .pp-q-list > .pp-q-item:nth-child(${n})`).join(", ")} { visibility: visible; opacity: 1; }
.pp-q-item > div { display: grid; justify-items: start; gap: 10px; }
.pp-q-item small { font-size: .8em; color: #555; }
.pp-stars { color: #F2994A; letter-spacing: 2px; }
.pp-q-item blockquote { margin: 0; font-size: clamp(1.1em, 1.6cqi, 1.45em); line-height: 1.8; }
.pp-q-item figcaption { font-size: .86em; font-weight: 500; }
.pp-q-arrows { display: flex; gap: 14px; margin-top: 10px; }
.pp-q-arrows label { cursor: pointer; }
.pp-q-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.pp-q-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Blog */
.pp-blog { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: clamp(24px, 4cqi, 56px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.pp-posts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.pp-post-card { display: grid; gap: 8px; align-content: start; justify-items: start; }
.pp-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--pp-soft); }
.pp-post-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.pp-post-card:hover .pp-post-pic img { transform: scale(1.05); }
.pp-post-pic .pp-badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.pp-post-meta { color: #999; font-size: .76em; }
.pp-post-card h2 { font-size: 1.2em; line-height: 1.6; }
.pp-post-card h2 a:hover { color: var(--pp-acc); }
.pp-post-card p { color: var(--pp-muted); font-size: .9em; line-height: 1.9; }
.pp-mini { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: center; }
.pp-mini > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--pp-soft); }
.pp-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-mini > span:last-child { display: grid; gap: 2px; font-size: .86em; }
.pp-mini b { font-weight: 500; }
.pp-mini small { color: #999; }
.pp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pp-tags span { padding: 3px 10px; border: 1px solid var(--pp-line); font-size: .8em; }
.pp-article { display: grid; gap: 14px; align-content: start; justify-items: start; }
.pp-article h1 { font-size: clamp(1.6em, 2.6cqi, 2.3em); }
.pp-article-pic { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.pp-article .pp-text { color: #555; }
.pp-post-nav { display: flex; justify-content: space-between; gap: 20px; width: 100%; padding-block: 18px; border-block: 1px solid var(--pp-line); }
.pp-post-nav a { display: grid; gap: 2px; max-width: 46%; }
.pp-post-nav a:last-child { text-align: end; }
.pp-post-nav small { color: #999; font-size: .78em; }
.pp-post-nav b { font-weight: 400; }
.pp-related { display: grid; gap: 14px; width: 100%; }
.pp-related h2 { font-size: 1.2em; }
.pp-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.pp-rel { display: grid; gap: 8px; }
.pp-rel > span { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--pp-soft); }
.pp-rel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-rel .pp-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-style: normal; }
.pp-rel b { font-weight: 400; }

/* Contact */
.pp-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.pp-contact-info { display: grid; gap: 20px; }
.pp-contact-item { display: flex; align-items: flex-start; gap: 14px; }
.pp-contact-item > .pp-ico { width: 24px; height: 24px; margin-top: 4px; }
.pp-contact-item span { display: grid; }
.pp-contact-item small { color: var(--pp-muted); }
.pp-contact-item b, .pp-contact-item a { font-weight: 500; }
.pp-message { display: grid; gap: 12px; padding: clamp(20px, 3cqi, 36px); background: var(--pp-soft); }
.pp-message h2 { font-size: 1.4em; }
.pp-message input, .pp-message textarea, .pp-checkout input, .pp-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--pp-line); background: var(--color-bg); color: inherit; font: inherit; }
.pp-message input:focus, .pp-message textarea:focus, .pp-checkout input:focus, .pp-checkout textarea:focus { outline: none; border-color: #111; }
.pp-message .pp-btn { justify-self: start; }
.pp-map { position: relative; aspect-ratio: 3 / 1; border: 1px solid var(--pp-line); background: var(--pp-soft); }
.pp-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.pp-map .pp-btn { position: absolute; bottom: 14px; inset-inline-start: 14px; }
.pp-map-link { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 20px; border: 1px dashed var(--pp-line); }

/* Cart, checkout, search, thanks */
.pp-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.pp-lines { display: grid; border-top: 1px solid var(--pp-line); }
.pp-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--pp-line); }
.pp-line-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--pp-soft); }
.pp-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pp-line-info { display: grid; gap: 2px; }
.pp-line-info b { font-weight: 500; }
.pp-line-info small { color: var(--pp-muted); }
.pp-stepper { display: flex; align-items: center; border: 1px solid var(--pp-line); }
.pp-stepper button { width: 34px; height: 34px; border: 0; background: none; font-size: 1.1em; cursor: pointer; }
.pp-stepper span { min-width: 24px; text-align: center; }
.pp-line-total { min-width: 8em; text-align: end; font-weight: 500; }
.pp-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--pp-muted) !important; cursor: pointer; }
.pp-remove:hover { color: var(--pp-hot) !important; }
.pp-sum { position: sticky; top: 140px; display: grid; gap: 14px; padding: 24px; background: var(--pp-soft); }
.pp-sum h2 { font-size: 1.25em; }
.pp-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; }
.pp-sum dd { margin: 0; text-align: end; }
.pp-sum .total { padding-top: 12px; border-top: 1px solid #DDD; font-weight: 600; }
.pp-sum small { color: var(--pp-muted); }
.pp-off { color: #15803D; }
.pp-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: .9em; }
.pp-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.pp-pay { padding: 12px 14px; border: 1px dashed #CCC; background: var(--color-bg); font-size: .86em; line-height: 1.9; }
.pp-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.pp-checkout h2, .pp-checkout .full, .pp-checkout .pp-error { grid-column: 1 / -1; }
.pp-checkout h2 { font-size: 1.25em; }
.pp-checkout label { display: grid; gap: 6px; font-size: .9em; font-weight: 500; }
.pp-trap { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.pp-empty { display: grid; justify-items: start; gap: 24px; padding-bottom: clamp(40px, 5cqi, 70px); }
.pp-empty .pp-notice { justify-self: stretch; }
.pp-search { display: grid; gap: 26px; padding-bottom: clamp(40px, 5cqi, 70px); }
.pp-search-box { display: flex; width: min(560px, 100%); margin-inline: auto; border: 1px solid #111; }
.pp-search-box input { flex: 1; min-width: 0; padding: 16px 20px; border: 0; background: none; color: inherit; font: inherit; }
.pp-search-box input:focus { outline: none; }
.pp-search-box button { width: 60px; border: 0; background: none; cursor: pointer; }
.pp-search .pp-muted { text-align: center; }
.pp-thanks { display: grid; justify-items: center; gap: 14px; padding-block: clamp(40px, 6cqi, 90px); text-align: center; }
.pp-thanks p { max-width: 36em; line-height: 2; }
.pp-done { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #E8F6EC; color: #16A34A; font-size: 2em; }

/* Newsletter and footer */
.pp-news { padding-block: clamp(36px, 5cqi, 64px); background: var(--pp-soft); text-align: center; }
.pp-news.is-home { background: var(--color-bg); }
.pp-news .pp-wrap { display: grid; justify-items: center; gap: 6px; }
.pp-news h2 { font-size: clamp(1.4em, 2.1cqi, 1.9em); }
.pp-news p { color: var(--pp-muted); font-size: .88em; }
.pp-news-form { display: flex; gap: 8px; width: min(480px, 100%); margin-top: 14px; }
.pp-news-form input { flex: 1; min-width: 0; padding: 10px 14px; border: 1px solid #111; background: var(--color-bg); color: inherit; font: inherit; font-size: .9em; }
.pp-news-form button { padding: 0 24px; border: 1px solid #111; background: #111; color: #fff; font-size: .82em; cursor: pointer; transition: background .2s; }
.pp-news-form button:hover { background: var(--pp-acc); border-color: var(--pp-acc); }
.pp-foot { padding-top: clamp(40px, 5cqi, 64px); border-top: 1px solid var(--pp-line); background: #FAFAFA; font-size: .88em; }
.pp-foot-cols { display: grid; grid-template-columns: 1.3fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-bottom: 36px; }
.pp-foot-cols > div { display: grid; align-content: start; gap: 8px; }
.pp-foot-cols h3 { margin-bottom: 6px; font-size: 1.05em; font-weight: 500; }
.pp-foot-cols a { color: #666; }
.pp-foot-cols a:hover { color: #111; }
.pp-foot-brand small { color: var(--pp-muted); }
.pp-foot-brand .pp-logo img { height: 24px; }
.pp-foot-phone { display: flex; align-items: center; gap: 10px; color: #111 !important; }
.pp-foot-phone .pp-ico { width: 34px; height: 34px; padding: 7px; border-radius: 50%; background: #E9E9E9; }
.pp-foot-phone span { display: grid; line-height: 1.5; }
.pp-foot-phone small { color: var(--pp-muted); }
.pp-foot-phone b { font-size: 1.15em; font-weight: 500; }
.pp-foot-store p { color: #666; }
.pp-foot-store p b { color: #111; }
.pp-socials { gap: 4px; }
.pp-socials a { width: 32px; height: 32px; border: 0; color: #111; }
.pp-socials a:hover { background: #111; color: #fff; }
.pp-foot-bottom { display: grid; justify-items: center; gap: 10px; padding-block: 18px 24px; border-top: 1px solid var(--pp-line); color: var(--pp-muted); text-align: center; }
.pp-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.pp-trust img { height: 44px; width: auto; }
.pp-phonebar { display: none; }
.pp-ftog, .pp-ftog-btn { display: none; }


/* Big menu under "shop" */
.pp-nav-item.has-mega { position: static; }
.pp-mega { position: absolute; inset-inline: 0; top: 100%; z-index: 6; border-top: 1px solid var(--pp-line); background: var(--color-bg); box-shadow: 0 20px 30px -24px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.pp-nav-item.has-mega:hover .pp-mega, .pp-nav-item.has-mega:focus-within .pp-mega { opacity: 1; visibility: visible; transform: none; }
.pp-mega-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 280px; gap: 30px; padding-block: 30px; }
.pp-mega-in > div { display: grid; align-content: start; gap: 10px; }
.pp-mega h4 { margin: 0 0 4px; font-size: 1em; font-weight: 600; }
.pp-mega h4.pp-mega-h2 { margin-top: 18px; }
.pp-mega-in > div a { color: #666; font-weight: 300; }
.pp-mega-in > div a:hover { color: #111; }
.pp-mega-card { position: relative; display: block; aspect-ratio: 305 / 400; overflow: hidden; background: var(--pp-soft); }
.pp-mega-pic, .pp-mega-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pp-mega-pic img { object-fit: cover; }
.pp-mega-note { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; justify-items: center; gap: 2px; padding: 14px 10px; background: #fff; text-align: center; }
.pp-mega-note b { font-size: 1.2em; font-weight: 400; }
.pp-mega-note small { color: #555; }
.pp-browse > summary { min-width: 270px; padding: 13px 18px; background: #111; color: #fff; justify-content: space-between; }
.pp-browse > div { min-width: 270px; padding: 0; border-top: 0; }
.pp-browse > div a { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid var(--pp-line); color: #555; }
.pp-browse > div a.strong { color: #111; font-weight: 500; }
.pp-browse > div a .pp-caret { opacity: .5; }
.pp-head-row2 { min-height: 46px; }

/* Phone menu: two tabs, menu and categories */
.pp-dtab { position: absolute; opacity: 0; pointer-events: none; }
.pp-dtabs { display: flex; gap: 22px; margin: 6px 0 8px; border-bottom: 1px solid var(--pp-line); }
.pp-dtabs label { padding: 8px 0; color: var(--pp-muted); cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; }
#pp-dtab-1:checked ~ .pp-dtabs label:first-child, #pp-dtab-2:checked ~ .pp-dtabs label:last-child { color: #111; border-color: #111; }
.pp-dpanel { display: none; }
#pp-dtab-1:checked ~ .pp-dpanel-1, #pp-dtab-2:checked ~ .pp-dpanel-2 { display: grid; }
.pp-dpanel > a { padding: 10px 0; border-bottom: 1px solid var(--pp-line); }
.pp-drawer-socials { margin-top: 14px; }

/* Sign-in window and side cart (hidden checkboxes open them) */
.pp-pop-in { position: fixed; opacity: 0; pointer-events: none; }
.pp-pop, .pp-mc { position: fixed; inset: 0; z-index: 120; display: none; }
#pp-login:checked + .pp-pop, .pp-mc-in:checked + .pp-mc { display: grid; }
.pp-pop { place-items: center; padding: 16px; }
.pp-pop-shade { position: absolute; inset: 0; background: rgb(0 0 0 / .45); cursor: pointer; }
.pp-pop-box { position: relative; display: grid; gap: 14px; width: min(440px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; padding: 30px 28px; background: var(--color-bg); animation: pp-in .35s ease both; }
.pp-pop-x { position: absolute; top: 14px; inset-inline-end: 14px; cursor: pointer; }
.pp-lt { position: absolute; opacity: 0; pointer-events: none; }
.pp-lt-tabs { display: flex; justify-content: center; gap: 30px; }
.pp-lt-tabs label { font-size: 1.6em; font-weight: 300; color: #BBB; cursor: pointer; }
#pp-lt-1:checked ~ .pp-lt-tabs label:first-child, #pp-lt-2:checked ~ .pp-lt-tabs label:last-child { color: #111; }
.pp-pop-form { display: none; gap: 14px; }
#pp-lt-1:checked ~ .pp-pop-form:nth-of-type(1), #pp-lt-2:checked ~ .pp-pop-form:nth-of-type(2) { display: grid; }
.pp-pop-form label { display: grid; gap: 6px; font-size: .92em; font-weight: 500; }
.pp-pop-form label i { color: var(--pp-hot); font-style: normal; }
.pp-pop-form input { width: 100%; padding: 12px 14px; border: 1px solid var(--pp-line); background: var(--color-bg); color: inherit; font: inherit; }
.pp-pop-form input:focus { outline: none; border-color: #111; }
.pp-pop-form small { color: var(--pp-muted); text-align: center; }
.pp-pop-form small a { color: #111; text-decoration: underline; }
.pp-icon-user { cursor: pointer; }
.pp-mc-box { position: absolute; inset-block: 0; inset-inline-end: 0; display: grid; grid-template-rows: auto 1fr auto; width: min(400px, 92%); background: var(--color-bg); animation: pp-mc .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes pp-mc { from { transform: translateX(-100%); } }
.pp-mc-box header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--pp-line); }
.pp-mc-box header h2 { font-size: 1.3em; }
.pp-mc-box header label { cursor: pointer; }
.pp-mc-lines { display: grid; align-content: start; gap: 4px; padding: 6px 22px; overflow-y: auto; }
.pp-mc-line { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--pp-line); }
.pp-mc-line > div { display: grid; justify-items: start; gap: 6px; }
.pp-mc-line small { color: var(--pp-muted); }
.pp-mc-box footer { display: grid; gap: 10px; padding: 18px 22px 22px; border-top: 1px solid var(--pp-line); }
.pp-mc-box footer p { display: flex; justify-content: space-between; font-size: 1.05em; }

/* Tablets */
@container (max-width: 1100px) {
  .pp-nav { gap: 16px; font-size: .82em; }
  .pp-head-contact a:last-child { display: none; }
  .pp-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pp-slide-row { grid-auto-columns: calc((100% - 2 * 20px) / 3); }
  .pp-plp { grid-template-columns: 230px minmax(0, 1fr); }
  .pp-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pp-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pp-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .pp-menu { display: block; }
  .pp-nav, .pp-head-row2, .pp-head-search, .pp-icon-user, .pp-icon-search, .pp-icon-wish { display: none !important; }
  .pp-head-in, .pp-head-inner .pp-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 60px; gap: 10px; }
  .pp-logo { justify-self: center; }
  .pp-icons { justify-self: end; }
  .pp-head-home { border-bottom-color: var(--pp-line); }
  .pp-plp { grid-template-columns: 1fr; }
  .pp-side { order: -1; display: none; grid-template-columns: 1fr 1fr; column-gap: 20px; margin-bottom: 10px; padding: 4px 16px 16px; border: 1px solid var(--pp-line); }
  .pp-ftog:checked + .pp-side { display: grid; }
  .pp-ftog-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #111; cursor: pointer; }
  .pp-ftog-btn .pp-ico { width: 16px; height: 16px; }
  .pp-plp-main { order: 1; }
  .pp-side .pp-side-box { padding-block: 10px; }
  .pp-side-box:not([open]) > div { display: none; }
  .pp-facets { display: contents; }
  .pp-facets-foot { grid-column: 1 / -1; }
  .pp-product { grid-template-columns: 1fr; }
  .pp-tab-desc { display: grid; grid-template-columns: 1fr; }
  .pp-blog, .pp-contact, .pp-cart { grid-template-columns: 1fr; }
  .pp-sum { position: static; }
  .pp-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-story { grid-template-columns: 1fr; }
  .pp-mission { grid-template-columns: 1fr; }
  /* Phones: the bar of shortcuts at the bottom */
  .pp-phonebar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--pp-line); background: var(--color-bg); }
  .pp-phonebar a { position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0 6px; font-size: .7em; }
  .pp-phonebar a[aria-current] { color: var(--pp-acc); }
  .pp-phonebar .pp-ico { width: 20px; height: 20px; }
  .pp-phonebar i { position: absolute; top: 3px; left: calc(50% + 6px); min-width: 15px; height: 15px; border-radius: 99px; background: #111; color: #fff; font-size: 9px; font-style: normal; line-height: 15px; text-align: center; }
}
@container (max-width: 600px) {
  .pp { font-size: 13.5px; }
  .pp-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .pp-slide-row { grid-auto-columns: calc((100% - 12px) / 2); gap: 12px; }
  .pp-cols-2, .pp-cols-3, .pp-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  .pp-row { grid-template-columns: 110px minmax(0, 1fr); gap: 14px; }
  .pp-card-acts { opacity: 1; transform: none; }
  .pp-round { width: 30px; height: 30px; }
  .pp-plp-bar { flex-wrap: wrap; gap: 8px; }
  .pp-plp-bar > small { flex-basis: 100%; order: 3; }
  .pp-views { margin-inline-start: auto; }
  .pp-side { grid-template-columns: 1fr; }
  .pp-gallery { grid-template-columns: 1fr; }
  .pp-thumbs { order: 2; grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .pp-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-buy-row .pp-btn { padding-inline: 12px; }
  .pp-posts, .pp-related > div { grid-template-columns: 1fr; }
  .pp-q-item { grid-template-columns: 1fr; }
  .pp-q-pic { width: 160px; order: -1; }
  .pp-line { grid-template-columns: 72px minmax(0, 1fr) auto; gap: 10px; }
  .pp-line .pp-stepper { grid-column: 2; justify-self: start; }
  .pp-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; }
  .pp-checkout { grid-template-columns: 1fr; }
  .pp-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px; }
  .pp-news-form { flex-direction: column; }
  .pp-news-form button { min-height: 42px; }
  .pp-map { aspect-ratio: 1.3; }
  .pp-trail-row { padding-block: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-main > *, .pp-card, .pp-drawer { animation: none !important; }
}

/* ───── Papo look: purple header with a wave, orange, yellow, a green wavy footer ───── */
.pp { --pp-purple: #8B1BE8; --pp-orange: #FF782D; --pp-yellow: #FFD200; --pp-green: #A6C20A; --pp-brown: #7A5643; --pp-blue: #50D5F5; --pp-acc: var(--pp-orange);
  --pp-wrap: min(1260px, 100% - 2 * clamp(16px, 3.4cqi, 40px)); --pp-line: #EDEDED; --pp-soft: #FFF6EF; --pp-muted: #777; --sk-accent: var(--pp-orange); overflow-x: clip; }
.pp h1, .pp h2, .pp-title h2 { font-weight: 800; letter-spacing: 0; }
.pp-acc { color: var(--pp-orange); font-style: normal; }
.pp-btn { min-height: 46px; padding: 0 28px; border: 0; border-radius: 99px; background: var(--pp-orange); color: #fff !important; font-weight: 700; box-shadow: 0 10px 20px -12px rgb(255 120 45 / .8); transition: transform .25s, background .25s; }
.pp-btn:hover { background: var(--pp-purple); transform: translateY(-2px); }
.pp-btn.white { background: #fff; color: #222 !important; box-shadow: none; }
.pp-btn.white:hover { background: var(--pp-yellow); }
.pp-btn.yellow { background: var(--pp-yellow); color: #222 !important; box-shadow: none; }
.pp-btn.ghost { background: transparent; color: var(--pp-orange) !important; border: 2px solid currentColor; box-shadow: none; }
.pp-btn.ghost:hover { background: var(--pp-orange); color: #fff !important; border-color: var(--pp-orange); }
.pp-btn.ghost.light { color: #fff !important; }
.pp-btn.small { min-height: 36px; padding: 0 18px; font-size: .85em; }
.pp .sk-btn { border-radius: 99px; background: var(--pp-orange); }
.pp-title { display: grid; justify-items: center; gap: 2px; max-width: 46em; margin: 0 auto clamp(24px, 3cqi, 44px); text-align: center; }
.pp-title h2 { font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.pp-title p { color: var(--pp-muted); }
.pp-squiggle { width: 74px; height: 14px; color: var(--pp-orange); }
.pp-soft { background: var(--pp-soft); }
.pp-wavy { position: relative; margin-block: 40px; }
.pp-wavy::before, .pp-wavy::after { content: ""; position: absolute; inset-inline: 0; height: 40px; background: var(--pp-soft); }
.pp-wavy::before { bottom: 100%; clip-path: polygon(0 60%, 12% 40%, 28% 70%, 45% 30%, 62% 60%, 80% 20%, 100% 50%, 100% 100%, 0 100%); }
.pp-wavy::after { top: 100%; clip-path: polygon(0 0, 100% 0, 100% 50%, 82% 80%, 64% 40%, 46% 75%, 26% 35%, 10% 70%, 0 40%); }
.pp-add { display: grid; place-items: center; min-height: 140px; border: 2px dashed #ccc; border-radius: 22px; color: var(--pp-muted); cursor: pointer; }

/* Header: purple with a wavy bottom; over the hero on the home page */
.pp-head { position: relative; z-index: 30; color: #fff; background: url(${sampleImage("pa-head-wave", "png")}) center bottom / 100% 100% no-repeat; padding-bottom: clamp(26px, 4cqi, 60px); margin-bottom: calc(-1 * clamp(26px, 4cqi, 60px)); }
.pp-head.is-home { background: none; position: absolute; inset-inline: 0; top: 0; margin: 0; }
.pp-head-row { display: flex; align-items: center; gap: clamp(14px, 2.4cqi, 40px); min-height: 92px; }
.pp-logo { display: inline-flex; align-items: center; gap: 10px; color: #fff; }
.pp-logo img { width: 52px; height: 52px; object-fit: contain; }
.pp-logo b { font-size: 1.7em; font-weight: 800; letter-spacing: .02em; }
.pp-nav { display: flex; align-items: center; gap: clamp(14px, 2.2cqi, 34px); margin-inline-start: auto; font-weight: 700; }
.pp-nav-item > a { padding: 30px 0; color: #fff; }
.pp-nav-item > a::after { background: var(--pp-orange); }
.pp-nav-item > a[aria-current="page"], .pp-nav-item > a:hover { color: #FFB27F; }
.pp-sub { min-width: 210px; padding: 12px 0; border-radius: 16px; background: #fff; color: #333; box-shadow: 0 20px 40px -20px rgb(0 0 0 / .35); }
.pp-sub a { padding: 8px 22px; font-weight: 500; }
.pp-sub a:hover { color: var(--pp-orange); }
.pp-icons { display: flex; align-items: center; gap: 16px; }
.pp-icon { color: #fff; }
.pp-icon > i { background: var(--pp-orange); }
.pp-sign { display: inline-flex; align-items: center; gap: 6px; min-height: 42px; padding: 0 22px; border-radius: 99px; background: var(--pp-orange); color: #fff; font-weight: 700; cursor: pointer; }
.pp-sign .pp-ico { width: 18px; height: 18px; }
.pp-sign:hover { background: #fff; color: var(--pp-orange); }
.pp-find-tog { position: absolute; opacity: 0; pointer-events: none; }
.pp-find { position: absolute; inset-inline: 0; top: 100%; z-index: 5; display: none; gap: 10px; align-items: center; width: var(--pp-wrap); margin: -10px auto 0; padding: 12px; border-radius: 99px; background: #fff; box-shadow: 0 20px 40px -20px rgb(0 0 0 / .4); }
.pp-find-tog:checked + .pp-find { display: flex; }
.pp-find input { flex: 1; min-width: 0; padding: 10px 18px; border: 0; background: transparent; color: #333; font: inherit; outline: none; }
.pp-find-x { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #F1F1F1; color: #333; cursor: pointer; }
.pp-find-x .pp-ico { width: 16px; height: 16px; }

/* Phone menu */
.pp-menu { display: none; }
.pp-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; background: rgb(30 10 50 / .5); }
.pp-burger .pp-ico { width: 26px; height: 26px; }
.pp-drawer { top: 0; display: grid; align-content: start; gap: 12px; padding: 0 20px 40px; width: min(350px, 88%); color: #333; background: #fff; }
.pp .pp-drawer-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin: 0 -20px; padding: 14px 20px; background: var(--pp-purple); }
.pp-drawer-head .pp-logo img { width: 40px; height: 40px; }
.pp-x { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: rgb(255 255 255 / .2); color: #fff; }
.pp-x .pp-ico { width: 18px; height: 18px; stroke-width: 2; }
.pp-menu[open] .pp-drawer { pointer-events: none; }
.pp-menu[open] .pp-drawer > :not(.pp-drawer-head) { pointer-events: auto; }
.pp-drawer-find { display: flex; border: 1px solid var(--pp-line); border-radius: 99px; overflow: hidden; }
.pp-drawer-find input { flex: 1; min-width: 0; padding: 10px 16px; border: 0; font: inherit; outline: none; }
.pp-drawer-find button { display: grid; place-items: center; width: 46px; border: 0; background: var(--pp-orange); color: #fff; }
.pp-drawer-nav { display: grid; }
.pp-fold { border-bottom: 1px solid var(--pp-line); }
.pp-fold > summary { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; font-weight: 700; cursor: pointer; list-style: none; }
.pp-fold > summary::-webkit-details-marker { display: none; }
.pp .pp-fold > summary .pp-caret { display: block; width: 16px; height: 16px; transition: transform .25s; }
.pp-fold[open] > summary { color: var(--pp-orange); }
.pp .pp-fold[open] > summary .pp-caret { transform: rotate(180deg); }
.pp-fold > div { display: grid; padding: 0 14px 10px; }
.pp-fold > div a { padding: 7px 0; color: #666; font-size: .95em; }
.pp-fold > div a[aria-current] { color: var(--pp-orange); }
.pp .pp-fold-link { padding: 13px 0; border-bottom: 1px solid var(--pp-line); font-weight: 700; }
.pp .pp-fold-link[aria-current] { color: var(--pp-orange); }
.pp-drawer .pp-btn.wide { width: 100%; }
.pp-drawer-info { display: grid; gap: 8px; color: #666; font-size: .9em; }
.pp-drawer-info a, .pp-drawer-info span { display: flex; align-items: center; gap: 8px; }
.pp-drawer-info .pp-ico { width: 16px; height: 16px; color: var(--pp-orange); }
.pp-drawer-socials { justify-content: center; }

/* Hero: the picture (with its purple top) and the words over its left side */
.pp-hero { position: relative; background: #fff; }
.pp-hero-art { position: relative; aspect-ratio: 1920 / 1240; }
.pp-hero-art > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-hero-bubble { position: absolute; left: 59.5%; top: 55%; width: 14%; color: #fff; font-weight: 900; font-size: clamp(.9em, 2cqi, 1.9em); line-height: 1.2; text-align: center; transform: rotate(-8deg); animation: pp-bob 3s ease-in-out infinite; }
@keyframes pp-bob { 50% { transform: rotate(-4deg) translateY(-6px); } }
.pp-hero-in { position: absolute; inset: 0; display: flex; align-items: center; pointer-events: none; }
.pp-hero-text { display: grid; justify-items: start; gap: 12px; width: 40%; margin-inline-start: auto; padding-top: 4%; color: #fff; pointer-events: auto; direction: rtl; }
.pp-hero h1 { font-size: clamp(2em, 4.6cqi, 4.4em); line-height: 1.25; white-space: pre-line; animation: pp-in .8s both; }
.pp-hero-text > p { color: var(--pp-yellow); font-size: clamp(1em, 1.7cqi, 1.6em); font-weight: 800; animation: pp-in .8s .15s both; }
.pp-hero-btns { display: flex; flex-wrap: wrap; gap: 10px; animation: pp-in .8s .3s both; }
@keyframes pp-in { from { opacity: 0; transform: translateY(24px); } }
[dir="rtl"] .pp-hero-in .pp-wrap, .pp-hero-in { direction: ltr; }

/* Sale cards */
.pp-sales { margin-top: clamp(10px, 2cqi, 30px); }
.pp-sale-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 2 * 26px) / 3); gap: 26px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding-bottom: 6px; }
.pp-sale-row::-webkit-scrollbar { display: none; }
.pp-sale { position: relative; display: block; aspect-ratio: 534 / 408; overflow: hidden; border-radius: 26px; scroll-snap-align: start; color: #fff; }
.pp-sale > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.pp-sale:hover > img { transform: scale(1.05); }
.pp-sale-text { position: absolute; inset: 0 0 0 auto; width: 58%; display: grid; align-content: center; justify-items: center; gap: 2px; text-align: center; direction: rtl; }
.pp-sale-text small { font-size: 1.3em; font-weight: 800; }
.pp-sale-text b { font-size: clamp(2.6em, 5cqi, 4.4em); font-weight: 900; line-height: 1.05; }
.pp-sale-text em { font-style: normal; font-weight: 700; }
.pp-sale-text i { margin-top: 10px; padding: 6px 18px; border-radius: 99px; background: #fff; color: #222; font-style: normal; font-size: .85em; font-weight: 700; }

/* Tabs per animal */
.pp-pt-in { position: absolute; opacity: 0; pointer-events: none; }
.pp-pt-labels { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 26px; }
.pp-pt-labels label { padding: 8px 22px; border-radius: 99px; background: #F4F4F4; font-weight: 700; cursor: pointer; transition: background .2s, color .2s; }
.pp-pt-labels label:hover { color: var(--pp-orange); }
.pp-pt-panel { display: none; }
.pp-pt-in.t-all:checked ~ .pp-pt-panel.t-all, .pp-pt-in.t-dog:checked ~ .pp-pt-panel.t-dog, .pp-pt-in.t-cat:checked ~ .pp-pt-panel.t-cat, .pp-pt-in.t-bird:checked ~ .pp-pt-panel.t-bird, .pp-pt-in.t-rodent:checked ~ .pp-pt-panel.t-rodent, .pp-pt-in.t-fish:checked ~ .pp-pt-panel.t-fish { display: grid; justify-items: center; gap: 26px; }
.pp-pt-panel > .pp-grid { width: 100%; }
.pp-pt-in.t-all:checked ~ .pp-pt-labels .t-all, .pp-pt-in.t-dog:checked ~ .pp-pt-labels .t-dog, .pp-pt-in.t-cat:checked ~ .pp-pt-labels .t-cat, .pp-pt-in.t-bird:checked ~ .pp-pt-labels .t-bird, .pp-pt-in.t-rodent:checked ~ .pp-pt-labels .t-rodent, .pp-pt-in.t-fish:checked ~ .pp-pt-labels .t-fish { background: var(--pp-orange); color: #fff; }
.pp-pt-in:focus-visible ~ .pp-pt-labels { outline: 2px solid var(--pp-purple); outline-offset: 4px; border-radius: 99px; }

/* Product cards: soft grey picture box with round corners */
.pp-card-pic { border-radius: 22px; overflow: hidden; background: #F6F6F6; }
.pp-img img { mix-blend-mode: multiply; }
.pp-card-text { text-align: center; justify-items: center; }
.pp-card-name { font-weight: 700; }
.pp-price b, .pp-price ins { color: var(--pp-orange); font-weight: 800; }
.pp-badge { border-radius: 99px; background: var(--pp-green); }
.pp-round { border-radius: 50%; }
.pp-round:hover { background: var(--pp-orange); color: #fff; }
.pp-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 24px) / 4); gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.pp-slide-row::-webkit-scrollbar { display: none; }
.pp-slide-row > * { scroll-snap-align: start; }

/* Promo: orange half with the illustration, brown half with paws */
.pp-promo { display: grid; grid-template-columns: 1fr 1.3fr; overflow: hidden; border-radius: 30px; margin-block: clamp(30px, 4cqi, 60px); }
.pp-promo-art { display: grid; place-items: end center; min-height: 300px; background: var(--pp-orange); }
.pp-promo-art img { width: min(380px, 90%); }
.pp-promo-text { display: grid; align-content: center; justify-items: start; gap: 12px; padding: clamp(24px, 4cqi, 56px); background: var(--pp-brown) url(${sampleImage("pa-paw-big", "png")}) right 10% bottom -30px / 120px no-repeat; color: #fff; }
.pp-promo-text h2 { font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.pp-promo-text .pp-acc { color: var(--pp-yellow); }
.pp-promo .pp-clock, .pp-promo [class*="clock"] { color: #fff; }

/* Services: coloured cards; the illustration sits in the card, the grooming one leans out of it */
.pp-svcs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; padding-top: 50px; }
.pp-svc { position: relative; display: grid; grid-template-columns: 1fr 1fr; align-items: end; min-height: 300px; border-radius: 26px; background: var(--c); color: #fff; }
.pp-svc-art { position: relative; align-self: stretch; display: grid; align-items: end; }
.pp-svc-art img { width: 100%; max-height: 300px; object-fit: contain; object-position: bottom; transition: transform .5s; }
.pp-svc.s1 .pp-svc-art img, .pp-svc.s4 .pp-svc-art img { margin-top: -60px; max-height: 360px; }
.pp-svc:hover .pp-svc-art img { transform: translateY(-6px) rotate(-1deg); }
.pp-svc-text { display: grid; justify-items: start; align-content: center; gap: 8px; align-self: center; padding: 26px; }
.pp-svc h3 { font-size: 1.6em; font-weight: 800; }
.pp-svc p { opacity: .92; font-size: .92em; }
.pp-svc .pp-btn { margin-top: 6px; }

/* Testimonials */
.pp-quotes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; align-items: center; }
.pp-quote { position: relative; display: grid; gap: 12px; margin: 0; padding: 24px; border-radius: 20px; background: #fff; box-shadow: 0 16px 40px -24px rgb(0 0 0 / .35); text-align: center; }
.pp-quote:nth-child(3n + 2) { transform: translateY(-14px); }
.pp-quote figcaption { display: grid; justify-items: center; gap: 6px; }
.pp-avatar { display: grid; place-items: center; width: 58px; height: 58px; overflow: hidden; border-radius: 50%; background: var(--pp-yellow); color: #333; font-weight: 800; font-size: 1.3em; }
.pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pp-quote figcaption > span:nth-child(2) { display: grid; }
.pp-quote small { color: var(--pp-muted); }
.pp-stars { color: #FFB400; letter-spacing: 2px; }
.pp-quote blockquote { margin: 0; color: #555; line-height: 2; }
.pp-thumb { justify-self: center; width: 26px; height: 26px; color: var(--pp-green); }

/* Newsletter */
.pp-news { position: relative; margin-top: 60px; background: var(--pp-blue) url(${sampleImage("pa-paw-big", "png")}) 8% 20% / 70px no-repeat; color: #fff; }
.pp-news::before, .pp-news::after { content: ""; position: absolute; inset-inline: 0; height: 36px; background: var(--pp-blue); }
.pp-news::before { bottom: 100%; clip-path: polygon(0 70%, 20% 30%, 45% 60%, 70% 20%, 100% 55%, 100% 100%, 0 100%); }
.pp-news::after { top: 100%; clip-path: polygon(0 0, 100% 0, 100% 45%, 75% 80%, 50% 40%, 25% 75%, 0 35%); }
.pp-news-in { display: grid; grid-template-columns: 1fr minmax(0, 420px); align-items: end; gap: 30px; }
.pp-news-text { display: grid; gap: 12px; align-self: center; padding-block: 40px; text-align: start; }
.pp .pp-news { padding: 0; text-align: start; }
.pp .pp-news p { color: rgb(255 255 255 / .92); font-size: 1em; }
.pp .pp-quotes { background: none; }
.pp .pp-member b { font-weight: 800; }
.pp-news h2 { font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.pp-news .pp-acc { color: var(--pp-yellow); }
.pp-news-form { display: flex; max-width: 520px; padding: 6px; border-radius: 99px; background: #fff; }
.pp-news-form input { flex: 1; min-width: 0; padding: 8px 16px; border: 0; background: transparent; font: inherit; outline: none; }
.pp-news-form button { padding: 0 24px; border: 0; border-radius: 99px; background: var(--pp-orange); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.pp-news-pic img { display: block; width: 100%; -webkit-mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 12%); -webkit-mask-composite: source-in; mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 12%); mask-composite: intersect; }

/* Perks: brown band with round badges */
.pp-band { position: relative; margin-block: 90px 40px; background: var(--pp-brown) url(${sampleImage("pa-paw-big", "png")}) 3% 75% / 60px no-repeat; color: #fff; }
.pp-band::before, .pp-band::after { content: ""; position: absolute; inset-inline: 0; height: 40px; background: var(--pp-brown); }
.pp-band::before { bottom: 100%; clip-path: polygon(0 50%, 25% 20%, 50% 60%, 75% 25%, 100% 55%, 100% 100%, 0 100%); }
.pp-band::after { top: 100%; clip-path: polygon(0 0, 100% 0, 100% 40%, 75% 75%, 50% 35%, 25% 80%, 0 45%); }
.pp-band-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; padding-block: 30px; text-align: center; }
.pp-perk { display: grid; justify-items: center; gap: 6px; }
.pp-perk-ico { display: grid; place-items: center; width: 96px; height: 90px; margin-bottom: 8px; border-radius: 52% 48% 45% 55% / 55% 45% 55% 45%; background: #FFB3A1; color: #5a3a2c; }
.pp-perk-ico.c2 { background: #9BDCD6; }
.pp-perk-ico.c3 { background: #FF9AA2; }
.pp-perk-ico .pp-ico { width: 40px; height: 40px; }
.pp-perk b { color: var(--pp-yellow); font-size: 1.15em; }

/* Blog cards */
.pp-pcards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
.pp-pcard { display: grid; gap: 6px; align-content: start; }
.pp-pcard-pic { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 20px; background: var(--pp-soft); }
.pp-pcard-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.pp-pcard:hover .pp-pcard-pic img, .pp-post-card:hover .pp-post-pic img { transform: scale(1.08); }
.pp-pcard-cat { color: var(--pp-orange); font-weight: 700; }
.pp-pcard h3 { font-size: 1.1em; font-weight: 800; }
.pp-pcard h3 a:hover { color: var(--pp-orange); }
.pp-pcard p { color: var(--pp-muted); font-size: .9em; }

/* Inner page top: orange with two cartoon cats, a wavy bottom */
.pp-pagetop { position: relative; padding: clamp(90px, 10cqi, 150px) 0 clamp(60px, 7cqi, 110px); background: var(--pp-orange) url(${sampleImage("pa-cat-balloon", "png")}) left 6% bottom 10px / auto 78% no-repeat; color: #fff; }
.pp-pagetop::before { content: ""; position: absolute; left: 22%; bottom: 26%; width: clamp(90px, 11cqi, 170px); aspect-ratio: 388 / 301; background: url(${sampleImage("pa-cat-yarn", "png")}) center / contain no-repeat; }
.pp-pagetop::after { content: ""; position: absolute; inset-inline: 0; bottom: -1px; height: 44px; background: #fff; clip-path: polygon(0 100%, 0 60%, 20% 30%, 45% 65%, 70% 35%, 100% 70%, 100% 100%); }
.pp-pagetop-in { position: relative; z-index: 1; background: url(${sampleImage("pa-paw", "png")}) 40% 80% / 46px no-repeat; }
.pp-pagetop h1 { font-size: clamp(2em, 3.6cqi, 3.2em); }
.pp-pagetop .pp-trail { color: var(--pp-yellow); font-weight: 700; }
.pp-pagetop .pp-trail a:hover { color: #fff; }
.pp-sep { width: 14px; height: 14px; }
.pp-banner { display: none; }

/* About */
.pp-about-hero { position: relative; aspect-ratio: 1920 / 1320; min-height: 420px; overflow: hidden; }
.pp-about-hero > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center bottom; }
.pp-about-in { position: relative; display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: center; height: 70%; padding-top: 8%; }
.pp-about-in h1 { font-size: clamp(2em, 4cqi, 3.6em); color: #2b2b2b; }
.pp-about-in .pp-text { color: #3d3d3d; line-height: 2; }
.pp-team { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; }
.pp-member { display: grid; justify-items: center; gap: 10px; margin: 0; text-align: center; }
.pp-blob { display: block; width: 100%; aspect-ratio: 525 / 477; overflow: hidden; border-radius: 45% 55% 52% 48% / 52% 44% 56% 48%; transition: border-radius .8s; }
.pp-member.b2 .pp-blob { border-radius: 55% 45% 48% 52% / 46% 54% 46% 54%; }
.pp-member:hover .pp-blob { border-radius: 50%; }
.pp-blob img { width: 100%; height: 100%; object-fit: cover; }
.pp-member b { color: var(--pp-orange); font-size: 1.2em; }
.pp-member small { color: #555; font-weight: 600; }
.pp-why { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(26px, 5cqi, 70px); align-items: center; }
.pp-why-pic img { width: 100%; }
.pp-why h2 { margin-bottom: 10px; font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.pp-why p { color: #555; line-height: 2; }
.pp-bar { display: grid; gap: 6px; margin-top: 16px; }
.pp-bar > span { display: flex; justify-content: space-between; font-size: .92em; }
.pp-bar i { display: block; height: 10px; border-radius: 99px; background: linear-gradient(to left, var(--pp-orange) var(--n), #fff var(--n)); box-shadow: inset 0 0 0 1px #F3E2D6; }
.pp-bar i { animation: pp-fill 1.4s cubic-bezier(.2, 1, .3, 1) both; animation-timeline: view(); animation-range: entry 10% cover 40%; }
@keyframes pp-fill { from { background-size: 0 100%; background-position: right; } }

/* Service page and booking */
.pp-service { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: clamp(26px, 5cqi, 70px); align-items: center; }
.pp-service-art > span { display: grid; place-items: end center; aspect-ratio: 1; border-radius: 30px; background: var(--c); padding: 30px 30px 0; }
.pp-service-art img { max-height: 100%; object-fit: contain; }
.pp-service-info { display: grid; gap: 12px; }
.pp-service-info h2 { font-size: 2.2em; }
.pp-service-price b { color: var(--pp-orange); font-size: 1.3em; }
.pp-facts { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.pp-facts li { display: flex; align-items: center; gap: 8px; }
.pp-facts .pp-ico { width: 18px; height: 18px; color: var(--pp-green); stroke-width: 2.6; }
.pp-book { padding-block: 20px clamp(40px, 5cqi, 70px); }
.pp .bk-btn, .pp .bk-day.open:hover, .pp .bk-day.picked, .pp .bk-times input:checked + span { background: var(--pp-orange); border-color: var(--pp-orange); color: #fff; }
.pp .bk-cal, .pp .bk-side { border-radius: 22px; overflow: hidden; }
.pp .bk-cal-head { background: var(--pp-purple); color: #fff; }
.pp .bk-day.open::after { background: var(--pp-orange); }
.pp .bk-day.open { color: var(--pp-orange); font-weight: 800; }
.pp-mine { display: flex; justify-content: center; gap: 10px; margin-top: 18px; color: var(--pp-muted); }
.pp-mine a { color: var(--pp-orange); font-weight: 700; }
.pp-steps { display: flex; justify-content: center; gap: clamp(10px, 4cqi, 60px); margin: 0 0 26px; padding: 0; list-style: none; color: #aaa; font-weight: 700; }
.pp-steps li { display: flex; align-items: center; gap: 8px; }
.pp-steps i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #EEE; font-style: normal; }
.pp-steps li.now { color: var(--pp-orange); }
.pp-steps li.now i { background: var(--pp-orange); color: #fff; }
.pp-steps li.done { color: var(--pp-green); }
.pp-steps li.done i { background: var(--pp-green); color: #fff; }
.pp-svc-pick { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 30px; }
.pp-svc-chip { display: grid; justify-items: center; gap: 4px; padding: 10px; border: 2px solid var(--pp-line); border-radius: 22px; text-align: center; transition: border-color .2s, transform .2s; }
.pp-svc-chip > span { display: grid; place-items: end center; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 16px; background: var(--c); }
.pp-svc-chip img { width: 100%; height: 100%; object-fit: contain; object-position: bottom; }
.pp-svc-chip small { color: var(--pp-muted); }
.pp-svc-chip:hover { transform: translateY(-3px); }
.pp-svc-chip[aria-current] { border-color: var(--pp-orange); }

/* Price packages */
.pp-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 26px; }
.pp-plan { display: grid; justify-items: center; align-content: start; gap: 12px; padding: 30px 24px; border-radius: 26px; background: #fff; box-shadow: 0 20px 50px -30px rgb(0 0 0 / .35); text-align: center; transition: transform .3s; }
.pp-plan:hover { transform: translateY(-8px); }
.pp-plan { --c: #4E8E5E; }
.pp-plan.c2 { --c: #F25F5C; }
.pp-plan.c3 { --c: #F5B400; }
.pp-plan h3 { color: var(--c); font-size: 1.5em; font-weight: 800; }
.pp-plan-ico { width: 64px; height: 64px; color: var(--c); stroke-width: 1.2; }
.pp-plan-price { color: var(--c); font-size: 1.5em; font-weight: 800; }
.pp-plan-price small { color: #777; font-size: .6em; font-weight: 500; }
.pp-plan ul { display: grid; gap: 10px; margin: 0 0 8px; padding: 0; list-style: none; color: #666; font-size: .92em; }
.pp-plan li { display: flex; align-items: center; justify-content: center; gap: 8px; }
.pp-plan li .pp-ico { width: 15px; height: 15px; color: var(--c); stroke-width: 2.6; }
.pp-plan li.off { opacity: .35; text-decoration: line-through; }
.pp-plan-btn { min-height: 42px; padding: 0 30px; border: 0; background: var(--c); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }

/* Footer: green with a wave on top, darker blobs and a dog in a box */
.pp-foot { position: relative; margin-top: 70px; padding-bottom: 20px; overflow: visible; border: 0; background: var(--pp-green); color: #fff; }
.pp-foot::before { content: ""; position: absolute; inset-inline: 0; bottom: 100%; height: 60px; background: var(--pp-green); clip-path: polygon(0 100%, 0 45%, 20% 20%, 45% 45%, 70% 10%, 100% 35%, 100% 100%); }
.pp-foot::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 60%; background: url(${sampleImage("pa-foot-blobs", "png")}) left bottom / auto 100% no-repeat; opacity: .55; pointer-events: none; }
.pp-foot > * { position: relative; z-index: 1; }
.pp-foot-cols { grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr)); gap: 30px; padding-top: 30px; }
.pp-foot-cols h3 { position: relative; padding-bottom: 10px; margin-bottom: 8px; color: #fff; font-size: 1.15em; font-weight: 800; }
.pp-foot-cols h3::after { content: ""; position: absolute; inset-inline-start: 0; bottom: 0; width: 22px; height: 3px; border-radius: 3px; background: #fff; }
.pp-foot-cols a, .pp-foot-cols p { color: #fff; }
.pp-foot-cols a:hover { color: var(--pp-yellow); }
.pp-foot-brand { display: grid; justify-items: start; gap: 12px; }
.pp-foot-brand p { max-width: 24em; line-height: 2; }
.pp-foot .pp-socials a { color: #fff; border-color: rgb(255 255 255 / .5); }
.pp-foot .pp-socials a:hover { background: #fff; color: var(--pp-green); }
.pp-foot-bottom { border-color: rgb(255 255 255 / .3); color: #fff; }
.pp-foot-pet { position: absolute; inset-inline-start: 2%; bottom: 0; z-index: 1; width: clamp(90px, 10cqi, 150px); aspect-ratio: 613 / 552; background: url(${sampleImage("pa-pets-box", "png")}) center bottom / contain no-repeat; }
.pp-foot-bottom small { padding-inline-start: clamp(100px, 11cqi, 160px); }

@container (max-width: 1100px) {
  .pp-nav { gap: 14px; font-size: .92em; }
  .pp-sign span { display: none; }
  .pp-sign { padding: 0 12px; }
  .pp-slide-row { grid-auto-columns: calc((100% - 2 * 18px) / 3); gap: 18px; }
}
@container (max-width: 900px) {
  .pp-nav { display: none; }
  .pp-menu { display: block; }
  .pp-head-row { min-height: 70px; gap: 10px; }
  .pp-head-row .pp-logo { margin-inline-end: auto; }
  .pp-head-row .pp-logo img { width: 40px; height: 40px; }
  .pp-head-row .pp-logo b { font-size: 1.35em; }
  .pp-icons { gap: 12px; }
  .pp-sign { min-height: 36px; padding: 0 10px; }
  .pp-head.is-home { position: relative; background: var(--pp-purple); }
  .pp-hero-in { position: static; display: block; width: 100%; padding: 26px clamp(16px, 4cqi, 30px) 14px; background: var(--pp-orange); direction: rtl; }
  .pp-hero-text { width: auto; margin: 0; padding: 0; }
  .pp-hero-art { order: 2; aspect-ratio: 1920 / 1000; }
  .pp-hero-art > img { object-position: center bottom; }
  .pp-hero { display: flex; flex-direction: column; }
  .pp-hero-in { order: 1; }
  .pp-hero-bubble { top: 50%; font-size: .72em; }
  .pp-sale-row { grid-auto-columns: 78%; gap: 14px; }
  .pp-slide-row { grid-auto-columns: 46%; gap: 14px; }
  .pp-promo { grid-template-columns: 1fr; }
  .pp-promo-art { min-height: 200px; }
  .pp-svcs { grid-template-columns: 1fr; }
  .pp-quotes { grid-template-columns: 1fr; }
  .pp-quote:nth-child(3n + 2) { transform: none; }
  .pp-news-in { grid-template-columns: 1fr; }
  .pp-news-pic { max-width: 320px; justify-self: center; }
  .pp-news { background-image: none; }
  .pp-band-in { grid-template-columns: 1fr; gap: 30px; }
  .pp-pcards { grid-template-columns: 1fr 1fr; }
  .pp-about-in { grid-template-columns: 1fr; gap: 10px; padding-top: 30px; height: auto; }
  .pp-about-hero { aspect-ratio: auto; min-height: 560px; }
  .pp-team { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .pp-why, .pp-service { grid-template-columns: 1fr; }
  .pp-foot-cols { grid-template-columns: 1fr 1fr; }
  .pp-foot-brand { grid-column: 1 / -1; }
  .pp-pagetop { background-size: auto 55%; }
  .pp-pagetop::before { left: 34%; bottom: 14%; width: 80px; }
}
@container (max-width: 600px) {
  .pp-icons { gap: 8px; }
  .pp-icon .pp-ico { width: 21px; height: 21px; }
  .pp-sign span { display: none; }
  .pp-head-row .pp-logo b { font-size: 1.15em; }
  .pp-head-row .pp-logo img { width: 34px; height: 34px; }
  .pp-sale-row { grid-auto-columns: 86%; }
  .pp-svc { grid-template-columns: 1fr; min-height: 0; }
  .pp-svc-art img { max-height: 220px; }
  .pp-svc.s1 .pp-svc-art img, .pp-svc.s4 .pp-svc-art img { margin-top: -40px; max-height: 250px; }
  .pp-svc-text { padding: 18px 22px 24px; }
  .pp-pcards { grid-template-columns: 1fr; }
  .pp-team { grid-template-columns: 1fr; max-width: 320px; margin-inline: auto; }
  .pp-foot-cols { grid-template-columns: 1fr; text-align: center; }
  .pp-foot-cols > div { justify-items: center; }
  .pp-foot-cols h3::after { inset-inline: 0; margin-inline: auto; }
  .pp-foot-brand { justify-items: center; }
  .pp-foot-bottom small { padding: 0; }
  .pp-foot-pet { position: relative; display: block; margin: 10px auto 0; inset: auto; }
  .pp-pt-labels { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scrollbar-width: none; }
  .pp-pt-labels label { flex: none; }
  .pp-steps { gap: 10px; font-size: .85em; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-hero-bubble, .pp-hero h1, .pp-hero-text > p, .pp-hero-btns { animation: none !important; }
}
`;
