/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Pulad": a gym: a black top strip and a white logo corner,
// a dark hero with an athlete and red slanted bars, navy sections with thin diagonal stripes, red
// hexagon icons, class cards whose white box slides up on hover, price tables, a round photo with
// arcs (the outer red one swings slowly), the week's timetable, BMI, and a faded footer picture.
// Classes are products of the classes category with weekly sessions: a visitor books one meeting
// (bookings, a capacity per class) or pays the class's fee through the cart; membership plans are
// products of the plans category; coaches are the gallery. The shop sells the other products.
// The page works without scripts: cart buttons are small forms, menus are details elements, the
// timetable filter and the meeting choice are links, BMI is a GET form.

import type { CSSProperties, ReactNode } from "react";
import { GYM_FIXED, emptyVisitor, formatToman, gymDefaults, meetingsOf, priceCart, takenFor, todayTehran, unitPrice, type Product, type ResumeData, type Schedule, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SORTS, SpecsTable, Stars, timeLeft, filterProducts, PriceFilterBox } from "./shopkit";
import { mapEmbed } from "./golsara";
import { TrackBooking, bookingCss } from "./booking";

export const PULAD_BLOCKS = [
  { key: "services", label: "کاشی‌های خدمات (زیر عکس بزرگ)" },
  { key: "why", label: "چرا ما (شش‌ضلعی‌های قرمز)" },
  { key: "classes", label: "کارت کلاس‌ها" },
  { key: "pricing", label: "تعرفه‌ها" },
  { key: "shape", label: "عکس گرد و معرفی" },
  { key: "timetable", label: "برنامه‌ی هفتگی کلاس‌ها" },
  { key: "trainers", label: "مربیان و فهرست کلاس‌ها" },
  { key: "bmi", label: "محاسبه‌ی BMI" },
  { key: "blog", label: "آخرین مطالب بلاگ" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const PULAD_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/trainers", label: "صفحه‌ی مربیان" },
  { path: "/classes", label: "صفحه‌ی کلاس‌ها" },
  { path: "/pricing", label: "صفحه‌ی تعرفه‌ها" },
  { path: "/events", label: "صفحه‌ی رویدادها" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

/** Goods of the shop: every product but the classes and the plans. */
const visible = (shop: Shop | undefined) => {
  const not = new Set([shop?.showcaseCategoryId, shop?.plansCategoryId].filter(Boolean));
  return (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim() && !(p.categoryId && not.has(p.categoryId)) && !p.sessions?.length);
};
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

/** Every page of the site: the gym pages, the shop pages, one per class, coach, category, product and post. */
export function puladPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const goods = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => goods.some((p) => p.categoryId === c.id));
  const own = PULAD_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p));
  const posts = pageOn(data, "/blog") ? livePosts(shop).map((p) => `/blog/${p.id}`) : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  const classes = classesOf(shop);
  const products = [...goods, ...plansOf(shop), ...classes.filter((p) => !p.sessions?.length)];
  return [
    "/",
    ...own,
    "/timetable",
    "/shop",
    "/contact",
    ...classes.filter((p) => p.sessions?.length).map((p) => `/class/${p.id}`),
    ...(pageOn(data, "/trainers") ? coachesOf(data).map((g) => `/trainer/${g.id}`) : []),
    ...cats.map((c) => `/category/${c.id}`),
    ...products.map((p) => `/product/${p.id}`),
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

export function PuladShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = puladPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "class") body = <ClassPage {...view} id={id!} />;
  else if (kind === "classes") body = <ClassesPage {...view} />;
  else if (kind === "trainers") body = <TrainersPage {...view} />;
  else if (kind === "trainer") body = <TrainerPage {...view} id={id!} />;
  else if (kind === "pricing") body = <PricingPage {...view} />;
  else if (kind === "timetable") body = <TimetablePage {...view} />;
  else if (kind === "events") body = <EventsPage {...view} />;
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
        <div className="pl-wrap pl-sec">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`pl${page === "/" ? " pl-home" : ""}`} css={partsCss + shopkitCss + bookingCss + css}>
      <Header {...view} />
      <main className="pl-main" key={page}>
        {body}
      </main>
      {page !== "/" && <OfferBand view={view} />}
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
};
const PERK_ICONS = ["truck", "shield", "card", "undo", "gem", "gift"];

function Svg({ name, className = "pl-ico" }: { name: string; className?: string }) {
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
const productPath = (p: Product) => (p.sessions?.length ? `/class/${p.id}` : `/product/${p.id}`);
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
    <form method="post" action={view.link("/_cart")} className="pl-act">
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
    <span className="pl-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function Badge({ p }: { p: Product }) {
  const soldOut = p.stock === 0;
  if (soldOut) return <span className="pl-badge out">ناموجود</span>;
  return (
    <span className="pl-badges">
      {onSale(p) && <span className="pl-badge off">{fa(percentOff(p))}٪ تخفیف</span>}
      {p.badge && <span className="pl-badge hot">{p.badge}</span>}
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
    <article className={`pl-card${row ? " pl-row" : ""}`} style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="pl-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="pl-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
            {hover && <img src={hover} alt="" loading="lazy" className="pl-img-2" />}
          </span>
        </PageLink>
        <Badge p={p} />
        <div className="pl-card-acts">
          <Act view={view} op="wish" id={p.id} className={`pl-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="pl-round" label="دیدن محصول">
            <Svg name="eye" />
          </PageLink>
          {!soldOut && !hasChoices(p) && (
            <Act view={view} op="add" id={p.id} className="pl-round" label="افزودن به سبد خرید">
              <Svg name="bag" />
            </Act>
          )}
        </div>
      </div>
      <div className="pl-card-text">
        {cat && <small className="pl-card-cat">{cat}</small>}
        <PageLink to={productPath(p)} link={view.link} className="pl-card-name">
          <span>{p.name}</span>
        </PageLink>
                <Price view={view} p={p} />
        {row && (
          <>
            {p.description && <p className="pl-card-desc">{p.description.slice(0, 160)}</p>}
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="pl-btn small ghost">
                  انتخاب گزینه‌ها
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="pl-btn small ghost" label="افزودن به سبد خرید">
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
    <span className={`pl-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A centred heading with an optional line of text under it. */
function Head({ view, title, titlePath, text, textPath, fallback }: { view: View; title?: string; titlePath?: string; text?: string; textPath?: string; fallback?: string }) {
  // A heading without a path is fixed text (nothing to edit on the page).
  const edit = titlePath ? ed(titlePath, "text", "تیتر") : undefined;
  return (
    <div className="pl-head-c">
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
    <div className="pl-wrap pl-empty">
      <p className="pl-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="pl-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Gym data: classes, plans, coaches ───────────── */

const WEEK = [6, 0, 1, 2, 3, 4, 5]; // Saturday first
const DAY_NAMES = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const allLive = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
/** The classes: products of the classes category (or any product with weekly sessions). */
const classesOf = (shop: Shop | undefined) => allLive(shop).filter((p) => (shop?.showcaseCategoryId && p.categoryId === shop.showcaseCategoryId) || (p.sessions?.length ?? 0) > 0);
const plansOf = (shop: Shop | undefined) => allLive(shop).filter((p) => shop?.plansCategoryId && p.categoryId === shop.plansCategoryId);
const coachesOf = (data: ResumeData) => (data.site?.gallery ?? []).filter((g) => g.title.trim());
const specOf = (p: Product, label: string) => p.specs?.find((s) => s.label.trim() === label)?.value;
const gymSchedule = (shop: Shop): Schedule => ({ ...gymDefaults(), ...shop.schedule, ...GYM_FIXED });
const faTime = (t: string) => t.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const dayLabel = (d: string) => faDate(d, { weekday: "long", day: "numeric", month: "long" });

/** Text with *starred words* in the accent colour (titles such as "Why join *us*"). */
function Accent({ text }: { text?: string }) {
  return (
    <>
      {(text ?? "").split(/(\*[^*]+\*)/).map((x, k) =>
        x.startsWith("*") && x.endsWith("*") && x.length > 2 ? (
          <em key={k} className="pl-acc">
            {x.slice(1, -1)}
          </em>
        ) : (
          x
        ),
      )}
    </>
  );
}
const plain = (t?: string) => (t ?? "").replace(/\*/g, "");

/** The trainer's own links, by site: an icon each. */
function socialKind(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram")) return "instagram";
  if (u.includes("t.me") || u.includes("telegram")) return "telegram";
  if (u.includes("wa.me") || u.includes("whatsapp")) return "whatsapp";
  if (u.includes("eitaa")) return "eitaa";
  if (u.includes("rubika")) return "rubika";
  return "link";
}
const linksOf = (g: { links?: string }) =>
  (g.links ?? "")
    .split(/\s+/)
    .map((x) => safeUrl(x))
    .filter((x): x is string => Boolean(x))
    .slice(0, 5);

/* ───────────── Frame: top strip, header, offer band, footer ───────────── */

type MenuItem = { to: string; label: string; sub?: { to: string; label: string }[] };
function menu(view: View): MenuItem[] {
  const data = view.ctx.data;
  const shop = view.shop;
  const about = [
    pageOn(data, "/about") && { to: "/about", label: "درباره‌ی باشگاه" },
    pageOn(data, "/trainers") && coachesOf(data).length > 0 && { to: "/trainers", label: "مربیان" },
    pageOn(data, "/classes") && classesOf(shop).length > 0 && { to: "/classes", label: "کلاس‌ها" },
    pageOn(data, "/pricing") && plansOf(shop).length > 0 && { to: "/pricing", label: "تعرفه‌ی عضویت" },
    pageOn(data, "/events") && (shop.events ?? []).some((e) => !e.hidden) && { to: "/events", label: "رویدادها" },
    visible(shop).length > 0 && { to: "/shop", label: "فروشگاه" },
  ].filter(Boolean) as { to: string; label: string }[];
  const book = [
    { to: "/timetable", label: "برنامه‌ی هفتگی کلاس‌ها" },
    { to: "/track", label: "پیگیری رزرو" },
  ];
  return [
    { to: "/", label: "خانه" },
    { to: about[0]?.to ?? "/contact", label: "درباره‌ی ما", sub: about.length > 1 ? about : undefined },
    ...(classesOf(shop).length > 0 ? [{ to: "/timetable", label: "رزرو آنلاین", sub: book }] : []),
    ...(pageOn(data, "/blog") && livePosts(shop).length > 0 ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
}

const isHere = (view: View, to: string) => {
  const p = view.page;
  if (to === "/") return p === "/";
  if (to === "/timetable") return p === "/timetable" || p === "/track";
  if (to === "/about") return ["/about", "/trainers", "/classes", "/pricing", "/events", "/shop"].some((x) => p === x || p.startsWith(`${x}/`)) || /^\/(trainer|class|category|product)\//.test(p);
  return p === to || p.startsWith(`${to}/`);
};

function Logo({ view, className = "pl-logo" }: { view: View; className?: string }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className={className}>
      {logo && <img src={logo} alt="" {...ed("basics.avatarUrl", "image", "لوگو")} />}
      <span>
        <b {...ed("basics.fullName", "text", "نام باشگاه")}>{b.fullName}</b>
        <Opt value={b.jobTitle} editing={view.editing} edit={ed("basics.jobTitle", "text", "خط زیر نام")}>
          <small {...ed("basics.jobTitle", "text", "خط زیر نام")}>{b.jobTitle}</small>
        </Opt>
      </span>
    </PageLink>
  );
}

const shopCats = (shop: Shop) => (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id));

function Nav({ view, className }: { view: View; className: string }) {
  return (
    <nav className={className}>
      {menu(view).map((m) => (
        <span key={m.label} className={`pl-nav-item${m.sub ? " has-sub" : ""}`}>
          <PageLink to={m.to} link={view.link} current={isHere(view, m.to)}>
            {m.label}
            {m.sub && <Svg name="down" className="pl-ico pl-caret" />}
          </PageLink>
          {m.sub && (
            <span className="pl-sub">
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

function Icons({ view }: { view: View }) {
  const { link, visitor, shop } = view;
  const count = priceCart(shop, visitor.cart).count;
  return (
    <div className="pl-icons">
      <PageLink to="/cart" link={link} className="pl-icon">
        <Svg name="bag" />
        <i>{fa(count)}</i>
        <span className="sr-only">سبد خرید</span>
      </PageLink>
      <PageLink to="/search" link={link} className="pl-icon pl-icon-search">
        <Svg name="search" />
        <span className="sr-only">جست‌وجو</span>
      </PageLink>
      {visitor.customer ? (
        <PageLink to="/account" link={link} className="pl-icon pl-icon-user">
          <Svg name="user" />
          <span className="sr-only">حساب {visitor.customer.name}</span>
        </PageLink>
      ) : (
        <label htmlFor="pl-login" className="pl-icon pl-icon-user" title="ورود / ثبت‌نام">
          <Svg name="user" />
          <span className="sr-only">ورود / ثبت‌نام</span>
        </label>
      )}
    </div>
  );
}

/** The phone menu, as in the design: the logo, a round grey close button, items that fold open. */
function Drawer({ view }: { view: View }) {
  const { link } = view;
  return (
    <details className="pl-menu">
      <summary className="pl-icon pl-burger" aria-label="منو">
        <Svg name="menu" className="pl-ico pl-burger-ico" />
      </summary>
      <div className="pl-drawer">
        <div className="pl-drawer-head">
          <Logo view={view} />
          <span className="pl-x" aria-hidden="true">
            <Svg name="close" />
          </span>
        </div>
        <nav className="pl-drawer-nav">
          {menu(view).map((m) =>
            m.sub ? (
              <details key={m.label} className="pl-fold" open={isHere(view, m.to)}>
                <summary>
                  {m.label}
                  <Svg name="down" className="pl-ico pl-caret" />
                </summary>
                <div>
                  {m.sub.map((x) => (
                    <PageLink key={x.to} to={x.to} link={link} current={view.page === x.to}>
                      {x.label}
                    </PageLink>
                  ))}
                </div>
              </details>
            ) : (
              <PageLink key={m.label} to={m.to} link={link} current={isHere(view, m.to)} className="pl-fold-link">
                {m.label}
              </PageLink>
            ),
          )}
          <PageLink to="/account" link={link} className="pl-fold-link">
            {view.visitor.customer ? "حساب من" : "ورود / ثبت‌نام"}
          </PageLink>
        </nav>
        <PageLink to={plansOf(view.shop).length ? "/pricing" : "/contact"} link={link} className="pl-btn wide">
          عضویت در باشگاه
        </PageLink>
        <Socials ctx={view.ctx} editing={false} className="pl-socials pl-drawer-socials" />
      </div>
    </details>
  );
}

function Header(view: View) {
  const { ctx, editing, link } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  return (
    <header className={`pl-head${view.page === "/" ? " is-home" : ""}`}>
      <div className="pl-head-logo">
        <Logo view={view} />
      </div>
      <div className="pl-head-main">
        <div className="pl-topbar">
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <span>
              <Svg name="pin" />
              <span {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</span>
            </span>
          </Opt>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <span>
              <Svg name="clock" />
              <span {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</span>
            </span>
          </Opt>
          {b.phone && (
            <a href={telHref(b.phone)}>
              <Svg name="phone" />
              <span dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </span>
            </a>
          )}
        </div>
        <div className="pl-head-row">
          <Nav view={view} className="pl-nav" />
          <Icons view={view} />
          <PageLink to={plansOf(view.shop).length ? "/pricing" : "/contact"} link={link} className="pl-btn pl-join">
            عضویت در باشگاه
          </PageLink>
          <Drawer view={view} />
        </div>
      </div>
    </header>
  );
}

/** The navy "special offer" band above the footer (as "Spring membership offer" in the design). */
function OfferBand({ view }: { view: View }) {
  const { shop, editing, link } = view;
  if (!shop.newsletterTitle && !editing) return null;
  return (
    <section className="pl-offer">
      <div className="pl-wrap pl-offer-in">
        <div>
          <h2 {...ed("site.shop.newsletterTitle", "text", "تیتر پیشنهاد ویژه")}>
            <Accent text={shop.newsletterTitle} />
          </h2>
          <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن پیشنهاد")}>
            <p {...ed("site.shop.newsletterText", "text", "متن پیشنهاد")}>
              <Accent text={shop.newsletterText} />
            </p>
          </Opt>
        </div>
        <PageLink to="/contact" link={link} className="pl-btn">
          تماس با ما
        </PageLink>
      </div>
    </section>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  const info = menu(view).flatMap((m) => m.sub ?? [m]).filter((m) => m.to !== "/" && m.to !== "/timetable" && m.to !== "/track");
  return (
    <footer className="pl-foot">
      <div className="pl-wrap pl-foot-cols">
        <div className="pl-foot-brand">
          <Logo view={view} />
          <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه")}>
            <p {...ed("basics.summary", "multiline", "معرفی کوتاه")}>{b.summary}</p>
          </Opt>
          <Socials ctx={ctx} editing={editing} className="pl-socials" />
        </div>
        <div>
          <h3>اطلاعات</h3>
          {info.slice(0, 6).map((m) => (
            <PageLink key={m.to} to={m.to} link={link}>
              {m.label}
            </PageLink>
          ))}
        </div>
        <div>
          <h3>لینک‌های مفید</h3>
          {classesOf(shop).length > 0 && (
            <PageLink to="/timetable" link={link}>
              رزرو آنلاین کلاس
            </PageLink>
          )}
          <PageLink to="/account" link={link}>
            حساب کاربری
          </PageLink>
          <PageLink to="/track" link={link}>
            پیگیری رزرو
          </PageLink>
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </div>
        <div className="pl-foot-contact">
          <h3>تماس با ما</h3>
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p>
              <Svg name="pin" />
              <span {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</span>
            </p>
          </Opt>
          {b.phone && (
            <a href={telHref(b.phone)}>
              <Svg name="phone" />
              <span dir="ltr">{b.phone}</span>
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`}>
              <Svg name="mail" />
              <span dir="ltr">{b.email}</span>
            </a>
          )}
        </div>
      </div>
      <div className="pl-wrap pl-foot-bottom">
        <small>© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
        <a href="#" className="pl-top-btn" aria-label="بالای صفحه">
          <Svg name="up" />
        </a>
      </div>
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
      <input type="checkbox" id="pl-login" className="pl-pop-in" aria-hidden="true" tabIndex={-1} />
      <div className="pl-pop" role="dialog" aria-label="ورود یا ثبت‌نام">
        <label htmlFor="pl-login" className="pl-pop-shade" aria-label="بستن" />
        <div className="pl-pop-box">
          <label htmlFor="pl-login" className="pl-pop-x" aria-label="بستن">
            <Svg name="close" />
          </label>
          <input type="radio" name="pl-lt" id="pl-lt-1" className="pl-lt" defaultChecked />
          <input type="radio" name="pl-lt" id="pl-lt-2" className="pl-lt" />
          <div className="pl-lt-tabs">
            <label htmlFor="pl-lt-1">ورود</label>
            <label htmlFor="pl-lt-2">ثبت‌نام</label>
          </div>
          <form method="post" action={link("/_account")} className="pl-pop-form">
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
            <button type="submit" className="pl-btn wide">
              ورود
            </button>
            <small>
              رمز را فراموش کرده‌اید؟{" "}
              <PageLink to="/contact" link={link}>
                با ما تماس بگیرید
              </PageLink>
            </small>
          </form>
          <form method="post" action={link("/_account")} className="pl-pop-form">
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
            <button type="submit" className="pl-btn wide">
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
      <input type="checkbox" id="pl-mc" className="pl-pop-in pl-mc-in" defaultChecked aria-hidden="true" tabIndex={-1} />
      <div className="pl-mc" role="dialog" aria-label="سبد خرید">
        <label htmlFor="pl-mc" className="pl-pop-shade" aria-label="بستن" />
        <aside className="pl-mc-box">
          <header>
            <h2>سبد خرید شما ({fa(cart.count)})</h2>
            <label htmlFor="pl-mc">بستن</label>
          </header>
          <div className="pl-mc-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="pl-mc-line">
                <PageLink to={productPath(l.product)} link={link} className="pl-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div>
                  <PageLink to={productPath(l.product)} link={link}>
                    {l.product.name}
                  </PageLink>
                  {l.size && <small>{l.size}</small>}
                  <div className="pl-stepper">
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
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pl-remove" label="حذف از سبد">
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
            <PageLink to="/cart" link={link} className="pl-btn ghost wide">
              دیدن سبد خرید
            </PageLink>
            <PageLink to="/checkout" link={link} className="pl-btn wide">
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
    <span className="pl-clock">
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
  const list = base.list.filter((p) => !q.size || sizesOf(p).includes(q.size));
  const { cats, cat } = base;
  const title = cat?.name ?? (q.sale ? "حراج ویژه" : "فروشگاه");
  const here = categoryId ? `/category/${categoryId}` : "/shop";
  const mode = VIEWS.some(([k]) => k === q.view) ? q.view! : "3";
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const at = Math.min(pages, Math.max(1, Number(q.p) || 1));
  const shown = list.slice((at - 1) * PER_PAGE, at * PER_PAGE);
  const from = list.length ? (at - 1) * PER_PAGE + 1 : 0;
  return (
    <>
      <Banner view={view} title={title} items={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : [{ label: title }]} />
      <section className="pl-wrap pl-plp">
        <div className="pl-plp-main">
          <div className="pl-plp-bar">
            <label htmlFor="pl-ftog" className="pl-ftog-btn">
              <Svg name="list" /> فیلترها
            </label>
            <small>
              {fa(from)}–{fa(from ? from + shown.length - 1 : 0)} از {fa(list.length)} محصول
            </small>
            <SortMenu view={view} here={here} />
            <div className="pl-views">
              {VIEWS.map(([k, icon, label]) => (
                <a key={k} href={`${link(here)}${qsOf(q, { view: k === "3" ? undefined : k, p: undefined })}`} aria-current={mode === k || undefined} title={label} aria-label={label}>
                  <Svg name={icon} />
                </a>
              ))}
            </div>
          </div>
          {shown.length ? (
            <div className={`pl-grid pl-cols-${mode}`}>
              {shown.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} row={mode === "list"} />
              ))}
            </div>
          ) : (
            <p className="pl-notice">{base.active || list.length !== base.list.length ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
          {pages > 1 && (
            <nav className="pl-pager" aria-label="صفحه‌ها">
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
        <input type="checkbox" id="pl-ftog" className="pl-ftog" aria-label="نمایش فیلترها" />
        <Sidebar view={view} here={here} cats={cats} cat={cat} />
      </section>
    </>
  );
}

function SideBox({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="pl-side-box" open={open}>
      <summary>
        {title}
        <Svg name="up" className="pl-ico pl-caret" />
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
    <aside className="pl-side">
      <SideBox title="دسته‌ها">
        <nav className="pl-side-cats">
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
      <form method="get" action={link(here)} className="pl-facets">
        <Keep query={q} skip={["size", "sale", "stock", "p"]} />
        {sizes.length > 0 && (
          <SideBox title="وزن و اندازه">
            <div className="pl-sizes">
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
          <label className="pl-check">
            <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} />
            <span>تخفیف‌دارها</span>
          </label>
          <label className="pl-check">
            <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} />
            <span>کالاهای موجود</span>
          </label>
        </SideBox>
        <div className="pl-facets-foot">
          <button type="submit" className="pl-btn small">
            اعمال فیلترها
          </button>
          <a href={link(here)} className="pl-under">
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
    <details className="pl-sort">
      <summary>
        مرتب‌سازی: <b>{now[1]}</b>
        <Svg name="down" className="pl-ico pl-caret" />
      </summary>
      <div className="pl-sort-list">
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
      <PriceFilterBox link={view.link} here={here} query={view.visitor.query} prices={prices} buttonClass="pl-btn tiny" />
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
        <span className="pl-prevnext">
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
      <section className="pl-wrap pl-product" data-product={p.id}>
        <div className={`pl-gallery pl-n${Math.min(imgs.length, 6)}`}>
          {imgs.length > 1 && imgs.slice(0, 6).map((_, i) => <input key={i} type="radio" name="pl-g" id={`pl-g-${i}`} className="pl-g" defaultChecked={i === 0} aria-label={`عکس ${fa(i + 1)}`} />)}
          <div className="pl-thumbs">
            {imgs.length > 1 &&
              imgs.slice(0, 6).map((src, i) => (
                <label key={i} htmlFor={`pl-g-${i}`}>
                  <img src={src} alt="" loading="lazy" />
                </label>
              ))}
          </div>
          <div className="pl-mainpic">
            {(imgs.length ? imgs.slice(0, 6) : [undefined]).map((src, i) =>
              src ? (
                <ZoomOpen key={i} id={`${p.id}-${i}`} className="pl-big">
                  <img src={src} alt={p.name} />
                  <span className="pl-zoom-ico">
                    <Svg name="expand" />
                  </span>
                </ZoomOpen>
              ) : (
                <span key={i} className="pl-big" />
              ),
            )}
            <Badge p={p} />
          </div>
        </div>
        <div className="pl-info">
          <h1>{p.name}</h1>
          {rating?.count ? (
            <a href="#pl-tab-reviews" className="pl-rating">
              <Stars value={rating.avg} /> <small>({fa(rating.count)} نظر)</small>
            </a>
          ) : null}
          <div className="pl-info-price">
            <Price view={view} p={p} />
            {onSale(p) && !soldOut && <span className="pl-save">{fa(percentOff(p))}٪ تخفیف</span>}
          </div>
          <SaleClock p={p} />
          {p.description && <p className="pl-desc">{p.description.split("\n")[0]}</p>}
          <p className="pl-avail">
            وضعیت: {soldOut ? <b className="out">ناموجود</b> : <b className="in">{p.stock !== undefined && p.stock <= 3 ? `فقط ${fa(p.stock)} عدد موجود است` : "موجود"}</b>}
          </p>
          {soldOut ? (
            <p className="pl-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="pl-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <OptionPicker p={p} />
              <div className="pl-buy-row">
                <label className="pl-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" name="back" value={view.page} className="pl-btn">
                  افزودن به سبد خرید
                </button>
              </div>
              <button type="submit" name="back" value="/checkout" className="pl-btn grey wide">
                خرید فوری
              </button>
            </form>
          )}
          <div className="pl-links">
            <Act view={view} op="wish" id={p.id} className="pl-linkbtn" label="علاقه‌مندی">
              <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            </Act>
            {hasReturns && (
              <PageLink to={`/page/${hasReturns.slug}`} link={link} className="pl-linkbtn">
                <Svg name="undo" /> {hasReturns.title}
              </PageLink>
            )}
            <PageLink to="/contact" link={link} className="pl-linkbtn">
              <Svg name="question" /> سؤال درباره‌ی این محصول
            </PageLink>
          </div>
          <p className="pl-eta">
            <Svg name="truck" /> زودترین زمان تحویل: <b>{deliveryWindow()}</b>
          </p>
          {perks.length > 0 && (
            <ul className="pl-perks">
              {perks.map((x, i) => (
                <li key={x.id}>
                  {safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={PERK_ICONS[i % PERK_ICONS.length]!} />}
                  <span>{x.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="pl-meta">
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
      <section className="pl-wrap pl-tabs">
        {tabs.map((t, i) => (
          <input key={t.id} type="radio" name="pl-tab" id={`pl-tab-${t.id}`} className="pl-tab-in" defaultChecked={i === 0} />
        ))}
        <div className="pl-tab-labels" role="tablist">
          {tabs.map((t) => (
            <label key={t.id} htmlFor={`pl-tab-${t.id}`} role="tab">
              {t.label}
            </label>
          ))}
        </div>
        <div className="pl-tab-panels">
          <div className="pl-tab-panel">
            <div className="pl-tab-desc">
              <div className="pl-text">
                <Para text={p.description} />
              </div>
              {imgs[1] && <img src={imgs[1]} alt="" loading="lazy" />}
            </div>
          </div>
          <div className="pl-tab-panel">
            <SpecsTable p={p} className="pl-specs" />
            {!(p.specs ?? []).length && <p className="pl-muted">مشخصاتی برای این محصول ثبت نشده است.</p>}
          </div>
          <div className="pl-tab-panel">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length + more.length > 0 && (
        <section className="pl-wrap pl-sec">
          <Head view={view} title="محصولات مرتبط" />
          <div className="pl-slide-row">
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
    <p className="pl-meta pl-share">
      اشتراک‌گذاری:
      <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
        <Icon name="telegram" className="pl-ico" />
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
        <Icon name="whatsapp" className="pl-ico" />
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
    <aside className="pl-side pl-blog-side">
      <form method="get" action={link("/search")} className="pl-side-search">
        <input name="q" placeholder="جست‌وجو..." aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <SideBox title="تازه‌ترین مطالب">
        {posts.slice(0, 3).map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={link} className="pl-mini">
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
          <div className="pl-tags">
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
      <section className="pl-wrap">
        <h1 className="pl-page-title">بلاگ</h1>
      </section>
      <section className="pl-wrap pl-blog">
        <div className="pl-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="pl-post-card">
                <PageLink to={`/blog/${p.id}`} link={link} className="pl-post-pic">
                  {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
                  {p.category && <span className="pl-badge dark">{p.category}</span>}
                </PageLink>
                <small className="pl-post-meta">
                  {p.author && `${p.author} · `}
                  {p.date && faDate(p.date)}
                </small>
                <h2>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <span {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</span>
                  </PageLink>
                </h2>
                <p>{p.excerpt || p.text.slice(0, 200)}</p>
                <PageLink to={`/blog/${p.id}`} link={link} className="pl-btn tiny ghost">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
          {!posts.length && <p className="pl-notice">هنوز مطلبی نوشته نشده است.</p>}
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
      <section className="pl-wrap pl-blog">
        <article className="pl-article">
          {p.category && <span className="pl-badge dark">{p.category}</span>}
          <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
          <small className="pl-post-meta">
            {p.author && `${p.author} · `}
            {p.date && faDate(p.date)}
          </small>
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" className="pl-article-pic" {...ed(`${at}.image`, "image", "عکس")} />}
          <div className="pl-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          <nav className="pl-post-nav">
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
            <div className="pl-related">
              <h2>شاید این‌ها را هم دوست داشته باشید</h2>
              <div>
                {related.map((r) => (
                  <PageLink key={r.id} to={`/blog/${r.id}`} link={link} className="pl-rel">
                    <span>
                      {safeUrl(r.image) && <img src={safeUrl(r.image)} alt="" loading="lazy" />}
                      {r.category && <i className="pl-badge dark">{r.category}</i>}
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
      <section className="pl-wrap pl-about-top">
        <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر")}>
          <h1 {...ed("site.contactTitle", "text", "تیتر")}>{site?.contactTitle}</h1>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
          <p {...ed("site.contactText", "multiline", "متن")}>{site?.contactText}</p>
        </Opt>
      </section>
      <section className="pl-wrap pl-contact">
        <div className="pl-contact-info">
          {rows.map((r) => (
            <Opt key={r.path} value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
              <div className="pl-contact-item">
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
          <Socials ctx={ctx} editing={editing} className="pl-socials" />
        </div>
        <form method="post" action={view.link("/_form")} className="pl-message">
          <FormMeta kind="contact" back={view.page} />
          <h2>برای ما پیام بگذارید</h2>
          <input name="name" placeholder="نام شما" aria-label="نام شما" />
          <input name="phone" placeholder="شماره‌ی تماس" aria-label="شماره‌ی تماس" dir="ltr" inputMode="tel" />
          {view.visitor.query.subject && <input name="subject" defaultValue={view.visitor.query.subject.slice(0, 160)} aria-label="موضوع" />}
          <textarea name="body" required rows={5} placeholder="پیام شما" aria-label="پیام شما" />
          <button type="submit" className="pl-btn">
            ارسال پیام
          </button>
        </form>
      </section>
      <section className="pl-wrap pl-sec pl-sec-tight">
        {embed ? (
          <div className="pl-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
            <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
            <a href={map} {...outside(map)} className="pl-btn small">
              مسیریابی
            </a>
          </div>
        ) : (
          <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
            <a href={map ?? "#"} {...outside(map)} className="pl-map-link" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
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
      <h1 className="pl-wrap pl-page-title">سبد خرید</h1>
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="pl-wrap pl-cart">
          <div className="pl-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="pl-line">
                <PageLink to={productPath(l.product)} link={link} className="pl-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="pl-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                                    {l.size && <small>{l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="pl-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="pl-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pl-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="pl-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="pl-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="pl-btn wide">
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
      <h1 className="pl-wrap pl-page-title">علاقه‌مندی‌ها</h1>
      {items.length === 0 ? (
        <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <section className="pl-wrap pl-sec pl-sec-tight">
          <div className="pl-grid pl-cols-4">
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
      <section className="pl-wrap pl-search">
        <form method="get" action={view.link("/search")} className="pl-search-box">
          <input name="q" defaultValue={q} placeholder="انگشتر، گردنبند، دستبند..." aria-label="جست‌وجو" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        {active &&
          (found.length ? (
            <>
              <p className="pl-muted">{fa(found.length)} محصول پیدا شد.</p>
              <div className="pl-grid pl-cols-4">
                {found.map((p, k) => (
                  <ProductCard key={p.id} view={view} p={p} i={k} />
                ))}
              </div>
            </>
          ) : (
            <p className="pl-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
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
      <h1 className="pl-wrap pl-page-title">ثبت سفارش</h1>
      <section className="pl-wrap pl-cart">
        <form method="post" action={link("/_order")} className="pl-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="pl-error">{error}</p>}
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
          <input name="website" tabIndex={-1} autoComplete="off" className="pl-trap" aria-hidden="true" />
          <button type="submit" className="pl-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="pl-sum">
          <h2>سفارش شما</h2>
          <ul className="pl-sum-lines">
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
                <dd className="pl-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="pl-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
      <section className="pl-wrap pl-sec pl-sec-tight">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="pl-wrap pl-thanks">
      <span className="pl-done" aria-hidden="true">
        ✓
      </span>
      <h1>ممنون از خرید شما!</h1>
      {code && (
        <p>
          کد پیگیری سفارش: <b dir="ltr">{code}</b>
        </p>
      )}
      {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
      {shop.paymentNote && <p className="pl-pay">{shop.paymentNote}</p>}
      <PageLink to="/shop" link={view.link} className="pl-btn">
        بازگشت به فروشگاه
      </PageLink>
    </section>
  );
}


/* ───────────── Delivery days, custom cakes, gallery, tracking ───────────── */

/* ───────────── Home ───────────── */

const HEX_ICONS = ["dumbbell", "muscle", "fire", "heart", "bolt", "clock"];
const CLASS_ICONS = ["bike", "muscle", "fire", "dumbbell", "bolt", "heart"];

/** A heading with *starred* words in red and a grey line under it, centred. */
function Title({ view, title, titlePath, text, textPath, light }: { view: View; title?: string; titlePath?: string; text?: string; textPath?: string; light?: boolean }) {
  return (
    <div className={`pl-title${light ? " light" : ""}`}>
      <h2 {...(titlePath ? ed(titlePath, "text", "تیتر (کلمه‌ی قرمز را بین دو ستاره بنویسید)") : {})}>
        <Accent text={title} />
      </h2>
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
  const lines = (shop.heroTitle ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const img = safeUrl(shop.heroImage);
  return (
    <section className="pl-hero" {...ed("site.shop.heroImage", "image", "عکس بزرگ بالای صفحه")}>
      {img && <img src={img} alt="" className="pl-hero-pic" />}
      <div className="pl-wrap pl-hero-in">
        <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط بالای تیتر")}>
          <small {...ed("site.shop.heroKicker", "text", "خط بالای تیتر")}>{shop.heroKicker}</small>
        </Opt>
        <h1 {...ed("site.shop.heroTitle", "multiline", "تیتر (سه خط؛ خط دوم توخالی)")}>
          {lines.map((l, k) => (
            <span key={k} className={k === 1 ? "pl-outline" : undefined}>
              {l}
            </span>
          ))}
        </h1>
        <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "text", "متن زیر تیتر")}>
          <p {...ed("site.shop.heroText", "text", "متن زیر تیتر")}>{shop.heroText}</p>
        </Opt>
        <div className="pl-hero-btns">
          <PageLink to={classesOf(shop).length ? "/timetable" : "/contact"} link={link} className="pl-btn">
            رزرو آنلاین کلاس
          </PageLink>
          {plansOf(shop).length > 0 && (
            <PageLink to="/pricing" link={link} className="pl-btn ghost light">
              تعرفه‌ی عضویت
            </PageLink>
          )}
        </div>
      </div>
    </section>
  );
}

/** "Achieve amazing results with our services": a navy title box, two photo tiles and a tall video tile. */
function Services({ view }: { view: View }) {
  const { shop, editing } = view;
  const tiles = (shop.banners ?? []).filter((b) => !b.hidden).slice(0, 3);
  const tile = (b: (typeof tiles)[number], k: number) => {
    const at = item("site.shop.banners", b.id);
    const url = safeUrl(b.link);
    const inner = (
      <>
        <span className="pl-tile-pic" {...ed(`${at}.image`, "image", "عکس")}>
          {safeUrl(b.image) && <img src={safeUrl(b.image)} alt="" loading="lazy" />}
        </span>
        <span className="pl-tile-text">
          {k < 2 && <Svg name={["muscle", "lotus"][k]!} className="pl-ico pl-tile-ico" />}
          <b {...ed(`${at}.title`, "text", "عنوان")}>{b.title}</b>
          {k === 2 && (
            <span className="pl-play" aria-hidden="true">
              <Svg name="play" />
            </span>
          )}
        </span>
      </>
    );
    return url ? (
      <a key={b.id} href={url} {...outside(url)} className={`pl-tile t${k + 1}`}>
        {inner}
      </a>
    ) : (
      <div key={b.id} className={`pl-tile t${k + 1}`}>
        {inner}
      </div>
    );
  };
  return (
    <section className="pl-services">
      <div className="pl-svc-title">
        <h2 {...ed("site.shop.discoverTitle", "text", "تیتر (کلمه‌های قرمز بین ستاره)")}>
          <Accent text={shop.discoverTitle} />
        </h2>
      </div>
      {tiles.map(tile)}
      {editing && tiles.length < 3 && (
        <span className="pl-add" {...ed("site.shop.banners", "newimage", "افزودن کاشی عکس")}>
          + افزودن کاشی
        </span>
      )}
    </section>
  );
}

/** "Why join": three red hexagons with an icon over a faded photo. */
function WhyJoin({ view }: { view: View }) {
  const { shop } = view;
  const perks = (shop.perks ?? []).slice(0, 3);
  const bg = safeUrl(shop.lookImage);
  return (
    <section className="pl-why" {...ed("site.shop.lookImage", "image", "عکس کم‌رنگ پشت بخش")}>
      {bg && <img src={bg} alt="" className="pl-why-bg" loading="lazy" />}
      <div className="pl-wrap pl-sec">
        <Title view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" text={shop.promoText} textPath="site.shop.promoText" />
        <div className="pl-why-list">
          {perks.map((x, k) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id} className={`pl-why-item${k === 1 ? " up" : ""}`}>
                <span className="pl-hex">{safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={HEX_ICONS[k % HEX_ICONS.length]!} />}</span>
                <h3 {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</h3>
                {x.text && <p {...ed(`${at}.text`, "text", "متن")}>{x.text}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** A class card: the photo with red slanted bands; on hover its white box slides up and shows the text. */
function ClassCard({ view, p, k }: { view: View; p: Product; k: number }) {
  return (
    <PageLink to={productPath(p)} link={view.link} className="pl-cc">
      <span className="pl-cc-pic">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
      <span className="pl-cc-box">
        <span className="pl-cc-head">
          <i>
            <Svg name={CLASS_ICONS[k % CLASS_ICONS.length]!} />
          </i>
          <b>{p.name}</b>
        </span>
        <span className="pl-cc-more">
          <span>
            <small>{(p.description ?? "").split("\n")[0]?.slice(0, 110)}</small>
            <em>
              مشاهده و رزرو <Svg name="left" />
            </em>
          </span>
        </span>
      </span>
    </PageLink>
  );
}

function ClassCards({ view, list }: { view: View; list: Product[] }) {
  return (
    <div className="pl-cc-row">
      {list.map((p, k) => (
        <ClassCard key={p.id} view={view} p={p} k={k} />
      ))}
    </div>
  );
}

/** A plan in a row (home): its name and line, the price, the features and a button; rows alternate white and navy. */
function PlanRow({ view, p, k }: { view: View; p: Product; k: number }) {
  const feats = (p.specs ?? []).filter((s) => !/^(ندارد|—|-|خیر)$/.test(s.value.trim())).slice(0, 4);
  return (
    <article className={`pl-plan-row${k % 4 === 1 || k % 4 === 2 ? " dark" : ""}`}>
      <div className="pl-plan-name">
        <h3>{p.name}</h3>
        {p.description && <small>{p.description.split("\n")[0]}</small>}
      </div>
      <ul>
        {feats.map((s) => (
          <li key={s.label}>
            <Svg name="check" /> {s.label}
          </li>
        ))}
      </ul>
      <div className="pl-plan-price">
        <b>
          {money(view, unitPrice(p))}
          {p.badge && <small> / {p.badge}</small>}
        </b>
        {unitPrice(p) < p.price && <s>{money(view, p.price)}</s>}
      </div>
      <Act view={view} op="add" id={p.id} className="pl-btn small ghost-acc" label={`ثبت‌نام ${p.name}`}>
        شروع کنید
      </Act>
    </article>
  );
}

/** A plan as a tall price table (the pricing page); the middle one is red. */
function PlanCard({ view, p, k, hot }: { view: View; p: Product; k: number; hot: boolean }) {
  const price = unitPrice(p);
  return (
    <article className={`pl-plan${hot ? " hot" : ""}`} style={{ "--i": k } as CSSProperties}>
      <span className="pl-plan-ghost" aria-hidden="true">
        {fa(Math.round(price / 1_000_000) || Math.round(price / 1000))}
      </span>
      <h3>{p.name}</h3>
      <b className="pl-plan-big">
        {money(view, price)}
        {p.badge && <small> / {p.badge}</small>}
      </b>
      {price < p.price && <s>{money(view, p.price)}</s>}
      <ul>
        {(p.specs ?? []).map((s) => {
          const off = /^(ندارد|—|-|خیر)$/.test(s.value.trim());
          return (
            <li key={s.label} className={off ? "off" : undefined}>
              {off ? "—" : s.label}
            </li>
          );
        })}
      </ul>
      <Act view={view} op="add" id={p.id} className="pl-btn small" label={`ثبت‌نام ${p.name}`}>
        شروع کنید
      </Act>
    </article>
  );
}

/** "We can give a shape of your body": text and two features beside a round photo with moving arcs. */
function Shape({ view }: { view: View }) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const feats = (shop.perks ?? []).slice(3, 5);
  return (
    <section className="pl-wrap pl-sec pl-shape">
      <div className="pl-shape-text">
        <h2 {...ed("site.aboutTitle", "text", "تیتر (کلمه‌های قرمز بین ستاره)")}>
          <Accent text={site?.aboutTitle} />
        </h2>
        <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن")}>
          <div className="pl-text" {...ed("site.aboutText", "multiline", "متن")}>
            <Para text={site?.aboutText} />
          </div>
        </Opt>
        {feats.map((f, k) => {
          const at = item("site.shop.perks", f.id);
          return (
            <div key={f.id} className="pl-feat">
              <Svg name={["dumbbell", "apple"][k]!} className="pl-ico pl-feat-ico" />
              <div>
                <h3 {...ed(`${at}.title`, "text", "عنوان")}>{f.title}</h3>
                {f.text && <p {...ed(`${at}.text`, "text", "متن")}>{f.text}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Rings view={view} />
    </section>
  );
}

/** The round photo, a small round photo on its edge and two arcs; the outer red half circle swings slowly back and forth. */
function Rings({ view }: { view: View }) {
  const site = view.ctx.data.site;
  return (
    <div className="pl-rings">
      <svg viewBox="0 0 400 400" className="pl-arc pl-arc-in" aria-hidden="true">
        <defs>
          <linearGradient id="pl-g1" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB31A" />
            <stop offset="1" stopColor="#F5094B" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="168" fill="none" stroke="url(#pl-g1)" strokeWidth="7" strokeLinecap="round" strokeDasharray="800 256" transform="rotate(130 200 200)" />
      </svg>
      <svg viewBox="0 0 400 400" className="pl-arc pl-arc-out" aria-hidden="true">
        <circle cx="200" cy="200" r="192" fill="none" stroke="#F5094B" strokeWidth="7" strokeLinecap="round" strokeDasharray="560 700" transform="rotate(-80 200 200)" />
        <circle cx="152" cy="388" r="7" fill="#F5094B" />
      </svg>
      <span className="pl-ring-big" {...ed("site.aboutImage", "image", "عکس گرد بزرگ")}>
        {safeUrl(site?.aboutImage) && <img src={safeUrl(site?.aboutImage)} alt="" loading="lazy" />}
      </span>
      <span className="pl-ring-small" {...ed("site.heroImage", "image", "عکس گرد کوچک")}>
        {safeUrl(site?.heroImage) && <img src={safeUrl(site?.heroImage)} alt="" loading="lazy" />}
      </span>
    </div>
  );
}

/** The week of classes: a column a day (Saturday first), a card a meeting; chips above filter by class. */
function Timetable({ view, here }: { view: View; here: string }) {
  const { shop, link, visitor } = view;
  const s = gymSchedule(shop);
  const all = classesOf(shop);
  const pick = all.find((p) => p.id === visitor.query.class);
  const list = pick ? [pick] : all;
  const taken = visitor.taken ?? {};
  const next = (p: Product, day: number, time: string) => meetingsOf(s, [{ day, time }], p.stock ?? s.capacity, takenFor(s, taken, p.name))[0];
  return (
    <div className="pl-tt">
      <nav className="pl-tt-filter" aria-label="کلاس‌ها">
        <PageLink to={here} link={link} current={!pick} className="pl-chip">
          همه‌ی کلاس‌ها
        </PageLink>
        {all.map((p) => (
          <PageLink key={p.id} to={`${here}?class=${p.id}`} link={link} current={pick?.id === p.id} className="pl-chip">
            {p.name}
          </PageLink>
        ))}
      </nav>
      <div className="pl-tt-grid">
        {WEEK.map((d) => {
          const rows = list.flatMap((p) => (p.sessions ?? []).filter((x) => x.day === d).map((x) => ({ p, time: x.time }))).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={d} className="pl-tt-day">
              <h3>{DAY_NAMES[d]}</h3>
              {rows.length === 0 && <p className="pl-tt-off">—</p>}
              {rows.map(({ p, time }) => {
                const m = next(p, d, time);
                const coach = specOf(p, "مربی");
                return (
                  <PageLink key={p.id + time} to={m ? `${productPath(p)}?date=${m.date}&time=${time}` : productPath(p)} link={link} className={`pl-tt-item${m && m.free < 1 ? " full" : ""}`}>
                    <time>{faTime(time)}</time>
                    <b>{p.name}</b>
                    {coach && <small>{coach}</small>}
                    <em>{!m ? "تعطیل" : m.free < 1 ? "ظرفیت پر" : "رزرو"}</em>
                  </PageLink>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "Work with our trainers": a red box with an icon and a photo (still while the page scrolls), and the list of classes. */
function Trainers({ view }: { view: View }) {
  const { shop, editing, link } = view;
  const list = classesOf(shop).slice(0, 6);
  const img = safeUrl(shop.newImage);
  return (
    <section className="pl-wrap pl-sec pl-trn">
      <div>
        <h2 {...ed("site.shop.lookTitle", "text", "تیتر (کلمه‌های قرمز بین ستاره)")}>
          <Accent text={shop.lookTitle} />
        </h2>
        <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "multiline", "متن")}>
          <p className="pl-muted" {...ed("site.shop.lookText", "multiline", "متن")}>
            {shop.lookText}
          </p>
        </Opt>
        <div className="pl-care">
          <div className="pl-care-box">
            <Svg name="muscle" className="pl-ico pl-care-ico" />
            <b {...ed("site.shop.newText", "text", "متن جعبه‌ی قرمز")}>{shop.newText}</b>
          </div>
          <span className="pl-care-pic" style={img ? ({ backgroundImage: `url("${img}")` } as CSSProperties) : undefined} {...ed("site.shop.newImage", "image", "عکس کنار جعبه‌ی قرمز")} />
        </div>
      </div>
      <ol className="pl-trn-list">
        {list.map((p, k) => (
          <li key={p.id}>
            <PageLink to={productPath(p)} link={link}>
              <i>{fa(k + 1).padStart(2, "۰")}.</i>
              <b>{p.name}</b>
              <Svg name="arrow" />
            </PageLink>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Body mass index from height and weight (a GET form: the page works it out, no script). */
function Bmi({ view, here }: { view: View; here: string }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const h = Number((q.h ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
  const w = Number((q.w ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
  const ok = h >= 80 && h <= 250 && w >= 20 && w <= 350;
  const bmi = ok ? w / (h / 100) ** 2 : 0;
  const kind = bmi < 18.5 ? "کمبود وزن" : bmi < 25 ? "وزن مناسب" : bmi < 30 ? "اضافه‌وزن" : "چاقی";
  const lo = Math.round(18.5 * (h / 100) ** 2);
  const hi = Math.round(24.9 * (h / 100) ** 2);
  const img = safeUrl(shop.trendImage);
  return (
    <section className="pl-bmi" id="bmi" style={img ? ({ "--pl-bmi": `url("${img}")` } as CSSProperties) : undefined} {...ed("site.shop.trendImage", "image", "عکس پشت بخش BMI")}>
      <div className="pl-wrap pl-bmi-in">
        <h2>
          شاخص توده‌ی بدنی <em className="pl-acc">(BMI)</em> شما
        </h2>
        <p>BMI با قد و وزن نشان می‌دهد وزن شما نسبت به قدتان چقدر مناسب است؛ برای بزرگسالان (زن و مرد) معتبر است.</p>
        <form method="get" action={link(here)} className="pl-bmi-form">
          <label>
            <span>قد (سانتی‌متر)</span>
            <input name="h" inputMode="numeric" required defaultValue={q.h} placeholder="مثلاً ۱۷۵" />
          </label>
          <label>
            <span>وزن (کیلوگرم)</span>
            <input name="w" inputMode="decimal" required defaultValue={q.w} placeholder="مثلاً ۷۲" />
          </label>
          <div className="pl-bmi-btns">
            <PageLink to={here} link={link} className="pl-btn">
              پاک کردن
            </PageLink>
            <button type="submit" className="pl-btn ghost-green">
              محاسبه
            </button>
          </div>
          {ok && (
            <output className="pl-bmi-out">
              BMI شما <b>{faDec(Math.round(bmi * 10) / 10)}</b> است: <b>{kind}</b>. وزن مناسب برای قد شما بین {fa(lo)} تا {fa(hi)} کیلوگرم است.
            </output>
          )}
          {(q.h || q.w) && !ok && <output className="pl-bmi-out">قد را به سانتی‌متر (۸۰ تا ۲۵۰) و وزن را به کیلوگرم بنویسید.</output>}
        </form>
      </div>
    </section>
  );
}

/** Blog cards: the picture grows on hover. */
function PostCards({ view, list }: { view: View; list: NonNullable<Shop["posts"]> }) {
  return (
    <div className="pl-pcards">
      {list.map((p) => (
        <article key={p.id} className="pl-pcard">
          <PageLink to={`/blog/${p.id}`} link={view.link} className="pl-pcard-pic">
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
          </PageLink>
          <small className="pl-post-meta">
            {p.date && faDate(p.date)}
            {p.author && ` · ${p.author}`}
          </small>
          <h3>
            <PageLink to={`/blog/${p.id}`} link={view.link}>
              {p.title}
            </PageLink>
          </h3>
          <PageLink to={`/blog/${p.id}`} link={view.link} className="pl-read">
            ادامه‌ی مطلب <Svg name="left" />
          </PageLink>
        </article>
      ))}
    </div>
  );
}

function Home(view: View) {
  const { shop, ctx } = view;
  const on = (k: string) => blockOn(ctx.data, k);
  const classes = classesOf(shop);
  const plans = plansOf(shop);
  const posts = pageOn(ctx.data, "/blog") ? livePosts(shop).slice(0, 3) : [];
  const ttBg = safeUrl(shop.discoverImage);
  return (
    <>
      <Hero view={view} />
      {on("services") && <Services view={view} />}
      {on("why") && (shop.perks ?? []).length > 0 && <WhyJoin view={view} />}
      {on("classes") && classes.length > 0 && (
        <section className="pl-navy pl-stripes">
          <div className="pl-wrap pl-sec pl-sec-flush">
            <Title view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" text={shop.showcaseText} textPath="site.shop.showcaseText" light />
          </div>
          <div className="pl-wrap">
            <ClassCards view={view} list={classes.slice(0, 4)} />
          </div>
        </section>
      )}
      {on("pricing") && plans.length > 0 && (
        <section className="pl-wrap pl-sec pl-plans-home">
          <Title view={view} title={shop.bestTitle} titlePath="site.shop.bestTitle" text={shop.bestText} textPath="site.shop.bestText" />
          <div className="pl-plan-rows">
            {plans.slice(0, 4).map((p, k) => (
              <PlanRow key={p.id} view={view} p={p} k={k} />
            ))}
          </div>
        </section>
      )}
      {on("shape") && <Shape view={view} />}
      {on("timetable") && classes.length > 0 && (
        <section className="pl-navy pl-tt-sec" style={ttBg ? ({ "--pl-tt": `url("${ttBg}")` } as CSSProperties) : undefined} {...ed("site.shop.discoverImage", "image", "عکس پشت برنامه‌ی کلاس‌ها")}>
          <div className="pl-wrap pl-sec">
            <Title view={view} title={shop.discountTitle} titlePath="site.shop.discountTitle" light />
            <Timetable view={view} here="/" />
          </div>
        </section>
      )}
      {on("trainers") && <Trainers view={view} />}
      {on("bmi") && <Bmi view={view} here="/" />}
      {on("blog") && posts.length > 0 && (
        <section className="pl-wrap pl-sec">
          <Title view={view} title="آخرین مطالب *بلاگ*" />
          <PostCards view={view} list={posts} />
        </section>
      )}
    </>
  );
}

/* ───────────── Gym pages ───────────── */

/** The dark band at the top of inner pages: the title (its last word red) and the path. */
function PageTop({ view, title, items }: { view: View; title: string; items?: { label: string; to?: string }[] }) {
  const words = title.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : undefined;
  return (
    <section className="pl-pagetop">
      <h1>
        {words.join(" ")} {last && <em className="pl-acc">{last}</em>}
      </h1>
      <nav className="pl-trail" aria-label="مسیر صفحه">
        <PageLink to="/" link={view.link}>
          خانه
        </PageLink>
        {(items ?? [{ label: title }]).map((t, k) => (
          <span key={k}>
            <Svg name="left" className="pl-ico pl-sep" />
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
    </section>
  );
}

function Trail({ view, items, children }: { view: View; items: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <>
      <PageTop view={view} title={items[items.length - 1]?.label ?? ""} items={items} />
      {children && <div className="pl-wrap pl-trail-row">{children}</div>}
    </>
  );
}

function Banner({ view, title, items }: { view: View; title: string; items: { label: string; to?: string }[] }) {
  return <PageTop view={view} title={title} items={items} />;
}

function About(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const stats = (shop.stats ?? []).filter((s) => s.value.trim());
  const coaches = coachesOf(ctx.data).slice(0, 4);
  const quotes = (site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim()).slice(0, 2);
  const posts = pageOn(ctx.data, "/blog") ? livePosts(shop).slice(0, 3) : [];
  return (
    <>
      <PageTop view={view} title="درباره‌ی ما" />
      <section className="pl-wrap pl-sec pl-intro">
        <div className="pl-intro-box">
          <h2 {...ed("site.aboutCaption", "text", "متن جعبه‌ی قرمز")}>{site?.aboutCaption}</h2>
        </div>
        <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس" className="pl-intro-pic" />
        <div className="pl-intro-text">
          <h3 {...ed("site.aboutTitle", "text", "تیتر")}>
            <Accent text={site?.aboutTitle} />
          </h3>
          <div className="pl-text" {...ed("site.aboutText", "multiline", "متن")}>
            <Para text={site?.aboutText} />
          </div>
          <PageLink to={plansOf(shop).length ? "/pricing" : "/contact"} link={view.link} className="pl-btn small">
            عضویت در باشگاه
          </PageLink>
        </div>
      </section>
      {stats.length > 0 && (
        <section className="pl-wrap pl-stats">
          {stats.slice(0, 4).map((s, k) => {
            const at = item("site.shop.stats", s.id);
            return (
              <div key={s.id}>
                <Svg name={["bike", "shirt", "muscle", "heart"][k % 4]!} className="pl-ico pl-stat-ico" />
                <b {...ed(`${at}.value`, "text", "عدد")}>{s.value}</b>
                <small {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</small>
              </div>
            );
          })}
        </section>
      )}
      {(shop.perks ?? []).length > 0 && (
        <section className="pl-navy pl-stripes">
          <div className="pl-wrap pl-sec">
            <Title view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" text={shop.promoText} textPath="site.shop.promoText" light />
            <div className="pl-why-list dark">
              {(shop.perks ?? []).slice(0, 3).map((x, k) => (
                <div key={x.id} className="pl-why-item">
                  <span className="pl-badge-ico">
                    <Svg name={HEX_ICONS[k % HEX_ICONS.length]!} />
                  </span>
                  <h3>{x.title}</h3>
                  {x.text && <p>{x.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {coaches.length > 0 && (
        <section className="pl-wrap pl-sec">
          <Title view={view} title="مربیان *باشگاه*" text="با مربی‌هایی تمرین کنید که مسیر شما را تا رسیدن به نتیجه همراهی می‌کنند." />
          <CoachGrid view={view} list={coaches} />
        </section>
      )}
      {quotes.length > 0 && (
        <section className="pl-navy pl-stripes">
          <div className="pl-wrap pl-sec pl-stories">
            <div>
              <h2>
                داستان <em className="pl-acc">موفقیت</em> اعضا
              </h2>
              <p>شاگردان ما از تجربه‌ی تمرین در باشگاه می‌گویند.</p>
            </div>
            {quotes.map((t) => (
              <figure key={t.id} className="pl-story" style={safeUrl(t.image) ? ({ backgroundImage: `url("${safeUrl(t.image)}")` } as CSSProperties) : undefined}>
                <blockquote>«{t.text}»</blockquote>
                <figcaption>
                  <b>{t.name}</b>
                  {t.role && <small>{t.role}</small>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section className="pl-wrap pl-sec">
          <Title view={view} title="آخرین مطالب *بلاگ*" />
          <PostCards view={view} list={posts} />
        </section>
      )}
      {editing && null}
    </>
  );
}

/** Coach cards: on hover a red veil rises over the photo with the coach's links. */
function CoachGrid({ view, list }: { view: View; list: ReturnType<typeof coachesOf> }) {
  return (
    <div className="pl-coaches">
      {list.map((g) => {
        const at = item("site.gallery", g.id);
        const links = linksOf(g);
        return (
          <figure key={g.id} className="pl-coach">
            <span className="pl-coach-pic">
              <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />
              <span className="pl-coach-veil">
                {links.map((u) => (
                  <a key={u} href={u} {...outside(u)} aria-label={socialKind(u)}>
                    <Icon name={socialKind(u) === "link" ? "website" : socialKind(u)} />
                  </a>
                ))}
                <PageLink to={`/trainer/${g.id}`} link={view.link} className="pl-coach-more">
                  پروفایل مربی
                </PageLink>
              </span>
            </span>
            <figcaption>
              <PageLink to={`/trainer/${g.id}`} link={view.link}>
                <b {...ed(`${at}.title`, "text", "نام")}>{g.title}</b>
              </PageLink>
              <small {...ed(`${at}.description`, "text", "تخصص (خط اول) و معرفی")}>{(g.description ?? "").split("\n")[0]}</small>
            </figcaption>
          </figure>
        );
      })}
      {view.editing && (
        <span className="pl-add" {...ed("site.gallery", "newimage", "افزودن مربی")}>
          + افزودن مربی
        </span>
      )}
    </div>
  );
}

function TrainersPage(view: View) {
  return (
    <>
      <PageTop view={view} title="مربیان باشگاه" />
      <section className="pl-wrap pl-sec">
        <CoachGrid view={view} list={coachesOf(view.ctx.data)} />
      </section>
    </>
  );
}

function TrainerPage(view: View & { id: string }) {
  const { ctx, shop, link } = view;
  const g = coachesOf(ctx.data).find((x) => x.id === view.id);
  if (!g) return <Empty view={view} text="این مربی پیدا نشد." />;
  const [role, ...bio] = (g.description ?? "").split("\n");
  const teaches = classesOf(shop).filter((p) => (specOf(p, "مربی") ?? "").includes(g.title.trim()));
  const at = item("site.gallery", g.id);
  return (
    <>
      <PageTop view={view} title={g.title} items={[{ label: "مربیان", to: "/trainers" }, { label: g.title }]} />
      <section className="pl-wrap pl-sec pl-coach-page">
        <ZoomOpen id={g.id} className="pl-coach-big">
          <img src={safeUrl(g.image)} alt={g.title} {...ed(`${at}.image`, "image", "عکس")} />
        </ZoomOpen>
        <div className="pl-coach-info">
          <h2>{g.title}</h2>
          {role && <p className="pl-acc">{role}</p>}
          <div className="pl-text">
            <Para text={bio.join("\n")} />
          </div>
          {linksOf(g).length > 0 && (
            <div className="pl-socials pl-coach-links">
              {linksOf(g).map((u) => (
                <a key={u} href={u} {...outside(u)} aria-label={socialKind(u)}>
                  <Icon name={socialKind(u) === "link" ? "website" : socialKind(u)} />
                </a>
              ))}
            </div>
          )}
          {teaches.length > 0 && (
            <div className="pl-coach-classes">
              <h3>کلاس‌های این مربی</h3>
              {teaches.map((p) => (
                <PageLink key={p.id} to={productPath(p)} link={link} className="pl-mini-class">
                  <b>{p.name}</b>
                  <small>{(p.sessions ?? []).map((x) => `${DAY_NAMES[x.day]} ${faTime(x.time)}`).join("، ")}</small>
                </PageLink>
              ))}
            </div>
          )}
          <PageLink to={teaches.length ? "/timetable" : "/contact"} link={link} className="pl-btn">
            رزرو جلسه با این مربی
          </PageLink>
        </div>
      </section>
    </>
  );
}

function ClassesPage(view: View) {
  const list = classesOf(view.shop);
  return (
    <>
      <PageTop view={view} title="کلاس‌های باشگاه" />
      <section className="pl-wrap pl-sec">
        <div className="pl-cc-row pl-cc-all">
          {list.map((p, k) => (
            <ClassCard key={p.id} view={view} p={p} k={k} />
          ))}
        </div>
      </section>
      <WhyJoin view={view} />
    </>
  );
}

/** A class: its photo and text, a box of facts, its meetings to pick one, and the booking form. */
function ClassPage(view: View & { id: string }) {
  const { shop, link, visitor, editing } = view;
  const p = classesOf(shop).find((x) => x.id === view.id);
  if (!p) return <Empty view={view} text="این کلاس پیدا نشد." />;
  const s = gymSchedule(shop);
  const places = p.stock ?? s.capacity;
  const meetings = meetingsOf(s, p.sessions, places, takenFor(s, visitor.taken ?? {}, p.name)).slice(0, 12);
  const q = visitor.query;
  const chosen = meetings.find((m) => m.date === q.date && m.time === q.time && m.free > 0) ?? meetings.find((m) => m.free > 0);
  const [lead, ...rest] = (p.description ?? "").split("\n");
  const others = classesOf(shop).filter((x) => x.id !== p.id).slice(0, 3);
  const facts = (p.specs ?? []).filter((x) => x.value.trim());
  const why = rest.filter((x) => x.trim().startsWith("-")).map((x) => x.replace(/^\s*-\s*/, ""));
  const text = rest.filter((x) => !x.trim().startsWith("-"));
  return (
    <>
      <PageTop view={view} title={p.name} items={[{ label: "کلاس‌ها", to: "/classes" }, { label: p.name }]} />
      <section className="pl-wrap pl-sec pl-class">
        <div className="pl-class-main">
          <ZoomOpen id={p.id} className="pl-class-pic">
            {pic(p) && <img src={pic(p)} alt={p.name} />}
          </ZoomOpen>
          <h2>{p.name}</h2>
          <div className="pl-text">
            <p>{lead}</p>
            <Para text={text.join("\n")} />
          </div>
          {why.length > 0 && (
            <div className="pl-why-need">
              {pic(p, 1) && <img src={pic(p, 1)} alt="" loading="lazy" />}
              <div>
                <h3>چرا این کلاس؟</h3>
                <ul>
                  {why.map((w) => (
                    <li key={w}>
                      <Svg name="check" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="pl-book" id="book">
            <h3>رزرو آنلاین یک جلسه</h3>
            {meetings.length === 0 ? (
              <p className="pl-notice">فعلاً جلسه‌ای برای رزرو آنلاین باز نیست؛ برای هماهنگی تماس بگیرید.</p>
            ) : (
              <>
                <p className="pl-muted">یک جلسه را انتخاب کنید:</p>
                <div className="pl-meetings">
                  {meetings.map((m) => (
                    <PageLink key={m.date + m.time} to={`${productPath(p)}?date=${m.date}&time=${m.time}`} link={link} current={chosen === m} className={`pl-meet${m.free < 1 ? " full" : ""}`}>
                      <b>{dayLabel(m.date)}</b>
                      <span>ساعت {faTime(m.time)}</span>
                      <small>{m.free < 1 ? "ظرفیت پر" : `${fa(m.free)} جای خالی`}</small>
                    </PageLink>
                  ))}
                </div>
                {chosen && (
                  <form method="post" action={link("/_form")} className="pl-book-form">
                    <FormMeta kind="booking" back={productPath(p)} />
                    <input type="hidden" name="service" value={p.name} />
                    <input type="hidden" name="date" value={chosen.date} />
                    <input type="hidden" name="time" value={chosen.time} />
                    <p className="pl-chosen">
                      جلسه‌ی انتخاب‌شده: <b>{dayLabel(chosen.date)}، ساعت {faTime(chosen.time)}</b>
                    </p>
                    <label>
                      <span>نام و نام خانوادگی</span>
                      <input name="name" required maxLength={80} autoComplete="name" defaultValue={visitor.customer?.name} />
                    </label>
                    <label>
                      <span>شماره‌ی موبایل</span>
                      <input name="phone" required inputMode="tel" dir="ltr" maxLength={20} autoComplete="tel" placeholder="09xx xxx xxxx" defaultValue={visitor.customer?.phone} />
                    </label>
                    <label className="full">
                      <span>توضیحات (اختیاری)</span>
                      <textarea name="body" rows={2} maxLength={1000} placeholder="سابقه‌ی ورزشی، آسیب‌دیدگی و..." />
                    </label>
                    <button type="submit" className="pl-btn">
                      رزرو این جلسه
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <aside className="pl-class-side">
          <div className="pl-info-box">
            <h3>اطلاعات کلاس</h3>
            <p>
              <Svg name="card" /> شهریه: <b>{money(view, unitPrice(p))}</b>
              {p.badge && <small> / {p.badge}</small>}
            </p>
            {facts.map((f) => (
              <p key={f.label}>
                <Svg name={f.label === "مربی" ? "user" : f.label.includes("مدت") ? "clock" : "check"} /> {f.label}: <b>{f.value}</b>
              </p>
            ))}
            <p>
              <Svg name="calendar" /> روزها: <b>{(p.sessions ?? []).map((x) => `${DAY_NAMES[x.day]} ${faTime(x.time)}`).join("، ") || "—"}</b>
            </p>
            {p.stock !== undefined && (
              <p>
                <Svg name="users" /> ظرفیت هر جلسه: <b>{fa(places)} نفر</b>
              </p>
            )}
            <Act view={view} op="add" id={p.id} className="pl-btn wide" label={`ثبت‌نام در ${p.name}`}>
              ثبت‌نام و پرداخت شهریه
            </Act>
          </div>
          {others.length > 0 && (
            <div className="pl-like">
              <h3>کلاس‌های دیگر</h3>
              {others.map((o) => (
                <PageLink key={o.id} to={productPath(o)} link={link} className="pl-like-item">
                  <span>{pic(o) && <img src={pic(o)} alt="" loading="lazy" />}</span>
                  <span>
                    <b>{o.name}</b>
                    <em>{o.sessions?.[0] ? DAY_NAMES[o.sessions[0].day] : ""}</em>
                    <small>{o.sessions?.[0] ? faTime(o.sessions[0].time) : ""}</small>
                  </span>
                </PageLink>
              ))}
            </div>
          )}
          {editing && null}
        </aside>
      </section>
    </>
  );
}

function PricingPage(view: View) {
  const { shop } = view;
  const plans = plansOf(shop);
  const mid = plans.length >= 3 ? Math.floor((Math.min(plans.length, 3) - 1) / 2) : -1;
  return (
    <>
      <PageTop view={view} title="تعرفه‌ی عضویت" />
      <section className="pl-wrap pl-sec">
        <Title view={view} title={shop.bestTitle} titlePath="site.shop.bestTitle" text={shop.bestText} textPath="site.shop.bestText" />
        <div className="pl-plans">
          {plans.slice(0, 3).map((p, k) => (
            <PlanCard key={p.id} view={view} p={p} k={k} hot={k === mid} />
          ))}
        </div>
      </section>
      {plans.length > 3 && (
        <section className="pl-soft">
          <div className="pl-wrap pl-sec">
            <div className="pl-plan-rows">
              {plans.slice(3).map((p, k) => (
                <PlanRow key={p.id} view={view} p={p} k={k} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function TimetablePage(view: View) {
  return (
    <>
      <PageTop view={view} title="رزرو آنلاین کلاس" items={[{ label: "برنامه‌ی هفتگی و رزرو آنلاین" }]} />
      <section className="pl-wrap pl-sec">
        <ol className="pl-steps">
          <li>
            <i>۱</i> کلاس و ساعت را از جدول انتخاب کنید
          </li>
          <li>
            <i>۲</i> روز جلسه را بزنید و نام و موبایل را بنویسید
          </li>
          <li>
            <i>۳</i> کد پیگیری می‌گیرید؛ وضعیت را در «پیگیری رزرو» ببینید
          </li>
        </ol>
        <div className="pl-tt-light">
          <Timetable view={view} here="/timetable" />
        </div>
      </section>
    </>
  );
}

function EventsPage(view: View) {
  const { shop, link } = view;
  const today = todayTehran();
  const list = (shop.events ?? []).filter((e) => !e.hidden && (e.end || e.start) >= today).sort((a, b) => a.start.localeCompare(b.start));
  return (
    <>
      <PageTop view={view} title="رویدادهای باشگاه" />
      <section className="pl-wrap pl-sec">
        {list.length === 0 ? (
          <p className="pl-notice">فعلاً رویداد پیش‌رویی نداریم؛ به‌زودی خبر می‌دهیم.</p>
        ) : (
          <div className="pl-events">
            {list.map((e) => {
              const url = safeUrl(e.link);
              return (
                <article key={e.id} className="pl-event">
                  <span className="pl-event-pic">
                    {safeUrl(e.image) && <img src={safeUrl(e.image)} alt="" loading="lazy" />}
                    <time>
                      <b>{faDate(e.start, { day: "numeric" })}</b>
                      <small>{faDate(e.start, { month: "long" })}</small>
                    </time>
                  </span>
                  <div>
                    <h3>{e.title}</h3>
                    <small className="pl-muted">
                      {faDate(e.start, { weekday: "long", day: "numeric", month: "long" })}
                      {e.end && e.end !== e.start && ` تا ${faDate(e.end, { day: "numeric", month: "long" })}`}
                    </small>
                    <p className="pl-event-price">{e.price ? money(view, e.price) : "رایگان"}</p>
                    {url ? (
                      <a href={url} {...outside(url)} className="pl-btn small">
                        ثبت‌نام
                      </a>
                    ) : (
                      <PageLink to={`/contact?subject=${encodeURIComponent(`ثبت‌نام در ${e.title}`)}`} link={link} className="pl-btn small">
                        ثبت‌نام
                      </PageLink>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری رزرو" />
      <section className="pl-wrap pl-sec">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

/* ───────────── Example content ───────────── */

export function puladSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`pl-${n}`);
  const png = (n: string) => sampleImage(`pl-${n}`, "png");
  const day = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const ago = (days: number) => day(-days);
  const S = 6, U = 0, M = 1, T = 2, W = 3, H = 4, F = 5; // Saturday … Friday, as JavaScript counts them
  const cats = [
    { id: "g1", name: "کلاس‌ها" },
    { id: "g2", name: "اشتراک‌ها" },
    { id: "g3", name: "مکمل‌ها", image: img("p-protein") },
    { id: "g4", name: "لوازم ورزشی", image: img("p-dumbbell") },
    { id: "g5", name: "پوشاک ورزشی", image: img("p-hoodie") },
  ];
  const cls = (id: string, name: string, image: string[], coach: string, sessions: [number, string][], price: number, about: string, why: string[], extra: Partial<Product> = {}): Product => ({
    id,
    name,
    categoryId: "g1",
    price,
    badge: "ماهانه",
    stock: 15,
    images: image.map(img),
    sessions: sessions.map(([d, time]) => ({ day: d, time })),
    description: `${about}\nهر جلسه با گرم کردن شروع می‌شود و با سرد کردن و کشش تمام می‌شود؛ مربی در تمام جلسه کنار شماست و حرکت‌ها را با توان بدنی هر نفر تنظیم می‌کند.\n${why.map((w) => `- ${w}`).join("\n")}`,
    specs: [
      { label: "مربی", value: coach },
      { label: "مدت هر جلسه", value: "۶۰ دقیقه" },
      { label: "سطح", value: "همه‌ی سطح‌ها" },
    ],
    ...extra,
  });
  const classes: Product[] = [
    cls("k1", "چربی‌سوزی", ["class-hero", "class2"], "علی رضایی", [[S, "08:00"], [M, "08:00"], [W, "18:00"]], 1_800_000, "تمرین‌های هوازی و قدرتی پرشدت برای سوزاندن چربی و بالا بردن آمادگی بدن.", ["حدود ۶۰۰ کیلوکالری در هر جلسه", "تقویت قلب و ریه", "افزایش آمادگی و استقامت بدن", "روشی طبیعی و پایدار برای کم کردن وزن"]),
    cls("k2", "بدنسازی و حجم", ["post4", "post1"], "رضا کریمی", [[U, "17:00"], [T, "17:00"], [H, "10:00"]], 2_200_000, "برنامه‌ی قدرتی با وزنه و دستگاه برای عضله‌سازی اصولی، همراه با آموزش فرم درست هر حرکت.", ["افزایش حجم و قدرت عضلات", "فرم درست حرکت و پیشگیری از آسیب", "برنامه‌ی تمرینی متناسب با بدن شما"]),
    cls("k3", "یوگا و کشش", ["svc2", "stretch"], "امیر حسینی", [[S, "10:00"], [M, "19:00"], [W, "10:00"]], 1_500_000, "یوگا و حرکات کششی برای انعطاف بدن، تنفس درست و آرامش ذهن.", ["انعطاف بیشتر و درد کمتر", "تنفس عمیق و آرامش", "تعادل و تمرکز بهتر"]),
    cls("k4", "تی‌آر‌ایکس و کراس‌فیت", ["video", "post5"], "محمد احمدی", [[U, "19:30"], [T, "19:30"], [F, "09:00"]], 2_000_000, "تمرین‌های عملکردی با بند تی‌آر‌ایکس، طناب و کتل‌بل برای قدرت و استقامت کل بدن.", ["قدرت کل بدن در یک جلسه", "تقویت عضلات مرکزی (کور)", "تمرین گروهی پرانرژی"]),
    cls("k5", "بوکس و رزمی", ["post10", "post9"], "حسین مرادی", [[M, "20:30"], [H, "18:00"]], 2_100_000, "آموزش فنون پایه‌ی بوکس، کار با کیسه و تمرین‌های سرعت و واکنش.", ["افزایش سرعت و واکنش", "تخلیه‌ی انرژی و استرس", "دفاع شخصی"]),
    cls("k6", "تمرین شخصی (PT)", ["post7", "post3"], "مهدی نوری", [[S, "16:00"], [T, "11:00"], [H, "16:00"]], 4_500_000, "جلسه‌های خصوصی با مربی، با برنامه‌ی تمرینی و تغذیه‌ی اختصاصی برای هدف شما.", ["برنامه‌ی کاملاً اختصاصی", "پیگیری هفتگی پیشرفت", "مشاوره‌ی تغذیه"], { stock: 2, specs: [{ label: "مربی", value: "مهدی نوری" }, { label: "مدت هر جلسه", value: "۷۵ دقیقه" }, { label: "سطح", value: "شخصی" }] }),
  ];
  const yes = "دارد";
  const no = "ندارد";
  const feats = (...on: boolean[]) => ["برنامه‌ی تمرینی", "سونا و جکوزی", "مربی شخصی", "مشاوره‌ی تغذیه", "استخر", "کلاس‌های گروهی"].map((label, k) => ({ label, value: on[k] ? yes : no }));
  const plans: Product[] = [
    { id: "m1", name: "اشتراک پایه", categoryId: "g2", price: 1_500_000, badge: "یک ماه", images: [], description: "برای شروع تمرین", specs: feats(true, true, false, false, false, false) },
    { id: "m2", name: "اشتراک استاندارد", categoryId: "g2", price: 3_900_000, badge: "سه ماه", images: [], description: "پرطرفدارترین", specs: feats(true, true, true, true, false, false) },
    { id: "m3", name: "اشتراک ویژه", categoryId: "g2", price: 7_200_000, badge: "شش ماه", images: [], description: "همه‌چیز در یک اشتراک", specs: feats(true, true, true, true, true, true) },
    { id: "m4", name: "اشتراک سالانه", categoryId: "g2", price: 12_500_000, salePrice: 11_000_000, saleEndsAt: new Date(Date.now() + 6 * 86400000).toISOString(), badge: "دوازده ماه", images: [], description: "به‌صرفه‌ترین انتخاب", specs: feats(true, true, true, true, true, true) },
  ];
  const sizes = { options: [{ name: "سایز", values: ["S", "M", "L", "XL"].map((label) => ({ label })) }] };
  const good = (id: string, name: string, cat: string, pic: string, price: number, text: string, extra: Partial<Product> = {}): Product => ({ id, name, categoryId: cat, price, images: [img(`p-${pic}`)], description: text, ...extra });
  const goods: Product[] = [
    good("p1", "پروتئین وی ۲ کیلویی", "g3", "protein", 3_400_000, "پروتئین وی برای ریکاوری و عضله‌سازی بعد از تمرین؛ هر پیمانه ۲۴ گرم پروتئین.", { badge: "پرفروش", specs: [{ label: "وزن", value: "۲ کیلوگرم" }, { label: "طعم", value: "شکلات" }] }),
    good("p2", "دمبل ۵ کیلویی (جفت)", "g4", "dumbbell", 1_650_000, "دمبل روکش‌دار با دسته‌ی ضدلغزش برای تمرین در خانه.", { salePrice: 1_350_000, saleEndsAt: new Date(Date.now() + 3 * 86400000).toISOString() }),
    good("p3", "ساعت هوشمند ورزشی", "g4", "watch", 4_800_000, "ضربان قلب، کالری و قدم‌ها را ثبت می‌کند؛ ضدآب و با باتری یک‌هفته‌ای."),
    good("p4", "هدفون بی‌سیم ورزشی", "g4", "speaker", 2_900_000, "صدای قوی و باتری ۲۰ ساعته برای تمرین با موسیقی."),
    good("p5", "قمقمه‌ی فلزی ۷۵۰ میلی‌لیتری", "g4", "bottles", 690_000, "قمقمه‌ی استیل که آب را تا ۱۲ ساعت خنک نگه می‌دارد."),
    good("p6", "شیکر و قمقمه‌ی ورزشی", "g4", "bottle", 420_000, "برای مخلوط کردن پودر پروتئین و نوشیدنی‌های ورزشی."),
    good("p7", "مچ‌بند هوشمند", "g4", "watch2", 1_900_000, "مچ‌بند سبک برای شمارش قدم و کالری و پایش خواب."),
    good("p8", "ساک ورزشی", "g4", "bag", 1_450_000, "ساک جادار با جای جداگانه برای کفش و حوله."),
    good("p9", "هودی ورزشی", "g5", "hoodie", 1_850_000, "هودی نخی گرم برای قبل و بعد از تمرین.", sizes),
    good("p10", "تی‌شرت ورزشی نخی", "g5", "tshirt", 690_000, "تی‌شرت نخی خنک و راحت.", sizes),
    good("p11", "تی‌شرت دری‌فیت", "g5", "jersey", 890_000, "پارچه‌ی دری‌فیت که عرق را سریع خشک می‌کند.", sizes),
    good("p12", "بلوز آستین‌بلند ورزشی", "g5", "sweater", 1_200_000, "بلوز سبک برای تمرین در هوای سرد.", sizes),
  ];
  const coach = (n: number, title: string, role: string, bio: string) => ({ id: `gc${n}`, title, image: img(`coach${n}`), description: `${role}\n${bio}`, links: "https://instagram.com/example https://t.me/example" });
  const post = (t: string) =>
    `${t}\n\nتمرین منظم فقط نیمی از مسیر است؛ خواب کافی، آب کافی و تغذیه‌ی درست نیم دیگر آن است. بدن در روزهای استراحت عضله می‌سازد، پس برنامه‌ی هفتگی باید روز استراحت هم داشته باشد.\n\nاگر تازه شروع کرده‌اید، با وزنه‌ی سبک و فرم درست شروع کنید و هر هفته کمی بار را بیشتر کنید. از مربی بخواهید فرم حرکت‌ها را ببیند تا از آسیب دور بمانید.`;
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "پولاد",
      jobTitle: "باشگاه ورزشی",
      // A placeholder logo, for now (to be replaced by the designer's).
      avatarUrl: png("logo-temp"),
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان ولیعصر، پلاک ۱۰۰",
      summary: "باشگاه ورزشی پولاد؛ بدنسازی، چربی‌سوزی، یوگا و کلاس‌های گروهی با مربیان باتجربه، هر روز هفته.",
      links: [
        { id: "pl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "pl2", type: "telegram", url: "https://t.me/example" },
        { id: "pl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "pl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "pl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      address: "تهران، خیابان ولیعصر، پلاک ۱۰۰",
      contactNote: "شنبه تا پنجشنبه ۶ صبح تا ۱۱ شب",
      contactTitle: "تماس با باشگاه",
      contactText: "برای مشاوره‌ی رایگان، جلسه‌ی آزمایشی یا هر سؤالی پیام بگذارید یا زنگ بزنید.",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.75750&mlon=51.40970#map=16/35.75750/51.40970",
      heroImage: img("round-small"),
      aboutImage: img("round-big"),
      aboutCaption: "ما می‌دانیم شما به چه نیاز دارید",
      aboutTitle: "بدنی که می‌خواهید را *اینجا* بسازید",
      aboutText: "بیش از ۵۰ جلسه‌ی تمرین گروهی در هفته، برای هر سن و هر سطحی. اینجا جای همه است: چه تازه شروع کرده باشید و چه ورزشکار حرفه‌ای باشید، برنامه‌ای متناسب با هدف شما داریم.",
      gallery: [
        coach(1, "علی رضایی", "مربی چربی‌سوزی", "دارای مدرک مربیگری درجه‌ی یک فدراسیون، با ۱۲ سال سابقه‌ی کار با شاگردانی که می‌خواهند وزن کم کنند."),
        coach(2, "محمد احمدی", "مربی کراس‌فیت", "متخصص تمرین‌های عملکردی و کراس‌فیت؛ برنامه‌هایش کوتاه، پرشدت و پرانرژی است."),
        coach(3, "امیر حسینی", "مربی یوگا", "مربی یوگا و حرکات اصلاحی؛ کمک می‌کند بدنتان منعطف‌تر و دردهایش کمتر شود."),
        coach(4, "رضا کریمی", "مربی بدنسازی", "قهرمان سابق پرورش اندام استان؛ متخصص عضله‌سازی اصولی و برنامه‌ی حجم."),
        coach(5, "حسین مرادی", "مربی بوکس", "مربی بوکس و آمادگی جسمانی با ۸ سال سابقه‌ی تدریس."),
        coach(6, "مهدی نوری", "مربی شخصی", "برنامه‌ی تمرین و تغذیه‌ی اختصاصی می‌نویسد و پیشرفت شما را هفته به هفته پیگیری می‌کند."),
        coach(7, "سعید کاظمی", "مربی آمادگی جسمانی", "متخصص تمرین‌های استقامتی و آمادگی برای آزمون‌های ورزشی."),
        coach(8, "نیما صادقی", "مربی تغذیه", "کارشناس تغذیه‌ی ورزشی؛ برنامه‌ی غذایی را با تمرین شما هماهنگ می‌کند."),
      ],
      testimonials: [
        { id: "pt1", name: "بهروز رحیمی", role: "عضو از ۱۴۰۱", text: "بهترین روزهای هفته‌ام روزهایی است که اینجا تمرین می‌کنم؛ در شش ماه ۱۴ کیلو کم کردم.", image: img("svc1"), rating: 5 },
        { id: "pt2", name: "کامران شریفی", role: "عضو از ۱۴۰۲", text: "جای خوبی برای چربی‌سوزی و تناسب اندام؛ مربی‌ها واقعاً پیگیرند.", image: img("post3"), rating: 5 },
      ],
      shop: {
        categories: cats,
        products: [...classes, ...plans, ...goods],
        showcaseCategoryId: "g1",
        plansCategoryId: "g2",
        heroImage: img("hero"),
        heroKicker: "بدنتان را با مربی‌های ما ۱۰۰٪ قوی‌تر کنید",
        heroTitle: "بهترین جا\nبرای تناسب\nاندام",
        discoverTitle: "با خدمات ما به *نتیجه‌ی شگفت‌انگیز* برسید",
        banners: [
          { id: "pb1", image: img("svc1"), title: "بدنسازی" },
          { id: "pb2", image: img("svc2"), title: "یوگا" },
          { id: "pb3", image: img("video"), title: "باشگاه قدرت تغییر زندگی شما را دارد" },
        ],
        promoTitle: "چرا *پولاد*؟",
        promoText: "باشگاهی که دور شما طراحی شده؛ مطمئنیم اینجا را دوست خواهید داشت.",
        lookImage: img("post3"),
        perks: [
          { id: "pk1", title: "جلسه‌ی آزمایشی رایگان", text: "بیش از ۵۰ جلسه‌ی گروهی در هفته؛ اولین جلسه را مهمان ما باشید." },
          { id: "pk2", title: "هوازی و قدرتی", text: "دستگاه‌های هوازی و قدرتی نو، برای هر هدفی که دارید." },
          { id: "pk3", title: "اشتراک بدون تعهد", text: "هر وقت خواستید اشتراک را تمدید کنید یا نگه دارید." },
          { id: "pk4", title: "مراقبت ویژه", text: "مربی‌ها برنامه‌ی هر نفر را با توان بدنی و سابقه‌ی آسیب‌دیدگی او تنظیم می‌کنند." },
          { id: "pk5", title: "برنامه‌ی غذایی", text: "مشاوره‌ی تغذیه‌ی ورزشی و برنامه‌ی غذایی هماهنگ با تمرین شما." },
        ],
        showcaseTitle: "با عضویت در *پولاد* چه می‌گیرید؟",
        showcaseText: "کلاس‌های گروهی با مربیان باتجربه، هر روز هفته.",
        bestTitle: "تعرفه‌ی *عضویت*",
        bestText: "با اشتراک‌های متنوع، برنامه‌ای پیدا کنید که با زندگی شما جور باشد.",
        discountTitle: "برنامه‌ی *کلاس‌ها*",
        discoverImage: img("post9"),
        lookTitle: "با مربی‌های ما تمرین کنید و *الهام بگیرید*",
        lookText: "مربی‌های پولاد برنامه‌ی هر کلاس را با سطح شما تنظیم می‌کنند؛ کلاس دلخواهتان را انتخاب و آنلاین رزرو کنید.",
        newText: "بیشترین آسایش و مراقبت برای اعضای باشگاه",
        newImage: img("care"),
        trendImage: img("bmi"),
        newsletterTitle: "پیشنهاد ویژه‌ی *پاییز*",
        newsletterText: "تا دو ماه عضویت رایگان با خرید اشتراک خانوادگی سالانه.",
        stats: [
          { id: "ps1", value: "۱۵۰+", label: "جلسه در هفته" },
          { id: "ps2", value: "۴٬۲۵۰+", label: "عضو باشگاه" },
          { id: "ps3", value: "۲٬۵۰۰+", label: "برنامه‌ی تمرینی" },
          { id: "ps4", value: "۴۵۷+", label: "عضو راضی" },
        ],
        events: [
          { id: "pe1", title: "مسابقه‌ی پرس سینه‌ی اعضا", image: img("post1"), start: day(9), price: 0 },
          { id: "pe2", title: "کارگاه تغذیه‌ی ورزشی", image: img("food"), start: day(16), price: 450_000 },
          { id: "pe3", title: "دوی صبحگاهی جمعه در پارک", image: img("post5"), start: day(20), price: 0 },
          { id: "pe4", title: "دوره‌ی فشرده‌ی آموزش بوکس", image: img("post10"), start: day(27), end: day(31), price: 1_900_000 },
        ],
        coupons: [
          { id: "pq1", code: "PULAD10", percent: 10, maxDiscount: 500_000, active: true },
          { id: "pq2", code: "GEAR15", percent: 15, maxDiscount: 400_000, categoryIds: ["g4", "g5"], active: true },
        ],
        schedule: { ...gymDefaults(), closed: [] },
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "pf1", q: "جلسه‌ی آزمایشی دارید؟", a: "بله، اولین جلسه‌ی هر کلاس رایگان است؛ از برنامه‌ی هفتگی رزرو کنید." },
          { id: "pf2", q: "اگر نتوانم سر جلسه‌ی رزروشده بیایم؟", a: "تا ۳ ساعت قبل از جلسه زنگ بزنید تا رزرو را جابه‌جا کنیم." },
          { id: "pf3", q: "اشتراک را می‌شود نگه داشت؟", a: "اشتراک‌های سه‌ماهه و بیشتر تا ۱۵ روز قابل تعلیق‌اند." },
        ],
        pages: [
          { id: "pp1", slug: "rules", title: "قوانین باشگاه", text: "همراه داشتن حوله و کفش مخصوص سالن الزامی است.\n\nلطفاً وزنه‌ها را بعد از تمرین سر جایشان بگذارید." },
        ],
        posts: [
          { id: "pw1", title: "تمرین قدرتی را چطور شروع کنیم؟", image: img("post1"), date: ago(3), author: "علی رضایی", category: "تمرین", excerpt: "از کجا شروع کنیم، چند جلسه در هفته و با چه وزنه‌ای؟", text: post("تمرین قدرتی فقط برای حجم عضله نیست؛ استخوان‌ها را محکم و متابولیسم را بالا می‌برد.") },
          { id: "pw2", title: "چربی‌سوزی سریع‌تر با تمرین ترکیبی", image: img("post3"), date: ago(9), author: "محمد احمدی", category: "چربی‌سوزی", text: post("ترکیب تمرین قدرتی و هوازی بیشترین کالری را می‌سوزاند.") },
          { id: "pw3", title: "تقویت استقامت با تمرین روی تردمیل", image: img("post4"), date: ago(15), author: "سعید کاظمی", category: "هوازی", text: post("تمرین اینتروال روی تردمیل استقامت قلبی را سریع بالا می‌برد.") },
          { id: "pw4", title: "تغذیه‌ی قبل و بعد از تمرین", image: img("food"), date: ago(22), author: "نیما صادقی", category: "تغذیه", text: post("یک وعده‌ی سبک دو ساعت قبل از تمرین و پروتئین بعد از آن.") },
          { id: "pw5", title: "حرکات کششی برای انعطاف بیشتر", image: img("stretch"), date: ago(30), author: "امیر حسینی", category: "یوگا", text: post("ده دقیقه کشش در روز دامنه‌ی حرکتی مفاصل را بیشتر می‌کند.") },
          { id: "pw6", title: "کتل‌بل؛ یک وزنه برای کل بدن", image: img("post8"), date: ago(41), author: "محمد احمدی", category: "تمرین", text: post("با یک کتل‌بل می‌شود کل بدن را تمرین داد.") },
        ],
        shippingFee: 90_000,
        freeShippingFrom: 3_000_000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش برای تأیید و اعلام شماره‌ی کارت با شما تماس می‌گیریم. شهریه‌ی کلاس‌ها و اشتراک را می‌توانید حضوری هم در باشگاه بپردازید.",
        orderNote: "ثبت شد؛ به‌زودی برای هماهنگی با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.pl { --pl-ink: var(--color-text); --pl-muted: var(--color-muted); --pl-line: #E9E9E9; --pl-soft: #F5F5F5; --pl-pink: #F8EBEF; --pl-lilac: #F6E8F4; --pl-blue: #D8EDF5; --pl-sand: #F5ECE9;
  --pl-hot: #E5484D; --pl-off: #F0883E; --pl-acc: var(--color-primary);
  --pl-wrap: min(1370px, 100% - 2 * clamp(14px, 3cqi, 40px));
  --sk-accent: #111; --sk-card: var(--color-bg); --sk-line: var(--pl-line); --sk-soft: var(--pl-soft); --sk-muted: var(--pl-muted); --sk-card-radius: 0; --sk-radius: 0;
  background: var(--color-bg); color: var(--pl-ink); min-height: 100%; font-size: 14px; font-weight: 300; line-height: 1.8; }
.pl a { color: inherit; text-decoration: none; }
.pl button { font: inherit; color: inherit; }
.pl .sk-btn { border-radius: 0; background: #111; color: #fff; }
.pl .sk-btn:hover { background: var(--pl-acc); }
.pl .sk-form input, .pl .sk-form textarea, .pl .sk-coupon input, .pl .sk-card { border-radius: 0; }
.pl b, .pl strong, .pl h3 { font-weight: 600; }
.pl h1, .pl h2 { font-weight: 400; letter-spacing: 0; line-height: 1.5; }
.pl .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.pl-wrap { width: var(--pl-wrap); margin-inline: auto; }
.pl-ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.pl-act { display: contents; }
.pl-sec { padding-block: clamp(40px, 5.5cqi, 80px); }
.pl-sec-tight { padding-top: 10px; }
.pl-sec-line { border-top: 1px solid var(--pl-line); }
.pl-muted { color: var(--pl-muted); }
.pl-notice { padding: 18px 24px; border-inline-start: 3px solid var(--pl-ink); background: var(--pl-soft); }
.pl-error { padding: 12px 16px; background: #FDECEC; color: #C62A2F; }
.pl-text { display: grid; gap: 14px; color: var(--pl-muted); line-height: 2.1; }
.pl-pic { position: relative; display: block; overflow: hidden; background: var(--pl-soft); }
.pl-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pl-add { display: grid; place-items: center; min-height: 80px; border: 1px dashed var(--pl-line); color: var(--pl-muted); cursor: pointer; }
.pl-main > * { animation: pl-in .6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes pl-in { from { opacity: 0; transform: translateY(14px); } }

/* Buttons: black, a framed light one, a grey wide one; small sizes */
.pl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 28px; border: 1px solid #111; background: #111; color: #fff !important; font-size: .86em; font-weight: 500; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.pl-btn:hover { background: var(--pl-acc); border-color: var(--pl-acc); }
.pl-btn.ghost { background: transparent; color: #111 !important; }
.pl-btn.ghost:hover { background: #111; color: #fff !important; border-color: #111; }
.pl-btn.grey { background: var(--pl-soft); border-color: var(--pl-soft); color: #111 !important; }
.pl-btn.grey:hover { background: #111; border-color: #111; color: #fff !important; }
.pl-btn.small { min-height: 36px; padding: 0 18px; font-size: .8em; }
.pl-btn.tiny { min-height: 30px; padding: 0 14px; font-size: .76em; }
.pl-btn.wide, .pl-btn.full { width: 100%; }
.pl-under { display: inline-block; padding-bottom: 2px; border: 0; border-bottom: 1px solid currentColor; background: none; font-size: .8em; font-weight: 500; cursor: pointer; }
.pl-under:hover { color: var(--pl-acc); }
.pl-more { display: inline-flex; align-items: center; gap: 4px; font-size: .86em; }
.pl-more .pl-ico { width: 16px; height: 16px; }

/* Headings of sections */
.pl-head-c { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(22px, 3cqi, 36px); text-align: center; }
.pl-head-c h2 { font-size: clamp(1.5em, 2.2cqi, 2.05em); }
.pl-head-c p, .pl-head-c a { color: var(--pl-muted); font-size: .92em; }

/* Header */
.pl-head { position: sticky; top: 0; z-index: 30; background: var(--color-bg); }
.pl-head-home { border-bottom: 1px solid transparent; }
.pl-head-in { display: flex; align-items: center; gap: 28px; min-height: 76px; }
.pl-logo { display: inline-flex; align-items: center; flex: none; }
.pl-logo img { display: block; width: auto; height: 22px; }
.pl-logo b { font-size: 1.7em; font-weight: 400; letter-spacing: .02em; }
.pl-nav { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); margin-inline: auto; font-size: .86em; font-weight: 500; }
.pl-nav-item { position: relative; }
.pl-nav-item > a { display: inline-flex; align-items: center; gap: 3px; padding: 26px 0; transition: color .2s; }
.pl-nav-item > a::after { content: ""; position: absolute; inset-inline: 0; bottom: 20px; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.pl-nav-item > a:hover::after, .pl-nav-item > a[aria-current="page"]::after { transform: scaleX(1); }
.pl-caret { width: 12px; height: 12px; stroke-width: 1.6; }
.pl-sub { position: absolute; top: 100%; inset-inline-start: -18px; z-index: 5; display: grid; min-width: 200px; padding: 12px 0; background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.pl-nav-item:hover .pl-sub, .pl-nav-item:focus-within .pl-sub { opacity: 1; visibility: visible; transform: none; }
.pl-sub a { padding: 7px 20px; font-weight: 400; }
.pl-sub a:hover { color: var(--pl-acc); }
.pl-icons { display: flex; align-items: center; gap: 18px; }
.pl-icon { position: relative; display: inline-flex; align-items: center; transition: color .2s; }
.pl-icon:hover { color: var(--pl-acc); }
.pl-icon > i { position: absolute; top: -7px; inset-inline-end: -9px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px; background: #111; color: #fff; font-size: 10px; font-style: normal; font-weight: 500; line-height: 16px; text-align: center; }
.pl-head-inner .pl-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 80px; }
.pl-head-inner .pl-icons { justify-self: end; }
.pl-head-search { display: flex; width: min(340px, 100%); border: 1px solid var(--pl-line); }
.pl-head-search input, .pl-side-search input, .pl-drawer-search input { flex: 1; min-width: 0; padding: 9px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: .9em; }
.pl-head-search input:focus, .pl-side-search input:focus, .pl-drawer-search input:focus { outline: none; }
.pl-head-search button, .pl-side-search button, .pl-drawer-search button { display: grid; place-items: center; padding-inline: 12px; border: 0; background: none; cursor: pointer; }
.pl-head-search .pl-ico { width: 17px; height: 17px; }
.pl-head-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--pl-line); }
.pl-head-row2 .pl-nav { margin: 0; }
.pl-head-row2 .pl-nav-item > a { padding: 14px 0; }
.pl-head-row2 .pl-nav-item > a::after { bottom: 9px; }
.pl-browse { position: relative; font-size: .84em; font-weight: 600; }
.pl-browse > summary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 0; cursor: pointer; list-style: none; }
.pl-browse > summary::-webkit-details-marker { display: none; }
.pl-browse > div { position: absolute; top: 100%; inset-inline-start: 0; z-index: 6; display: grid; min-width: 230px; padding: 8px 0; border: 1px solid var(--pl-line); background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); }
.pl-browse > div a { padding: 8px 18px; font-weight: 400; }
.pl-browse > div a:hover { background: var(--pl-soft); }
.pl-head-contact { display: flex; justify-content: flex-end; gap: 22px; font-size: .84em; }
.pl-head-contact a { display: inline-flex; align-items: center; gap: 6px; }
.pl-head-contact .pl-ico { width: 17px; height: 17px; }
.pl-menu { display: none; }
.pl-menu > summary { list-style: none; cursor: pointer; }
.pl-menu > summary::-webkit-details-marker { display: none; }
.pl-burger .pl-x { display: none; }
.pl-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; background: rgb(0 0 0 / .4); }
.pl-menu[open] .pl-burger-ico { display: none; }
.pl-menu[open] .pl-x { position: absolute; top: 16px; inset-inline-end: 16px; display: block; width: 40px; height: 40px; padding: 9px; border-radius: 50%; background: #fff; color: #111; }
.pl-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 4px; width: min(340px, 86%); height: 100vh; padding: 18px 22px 90px; overflow-y: auto; background: var(--color-bg); box-shadow: 0 0 40px rgb(0 0 0 / .2); animation: pl-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes pl-drawer { from { transform: translateX(100%); } }
/* The open phone menu sits above everything of the page (the header is its own layer, under the bar of shortcuts otherwise). */
.pl-head:has(.pl-menu[open]) { z-index: 200; }
.pl:has(.pl-menu[open]) .pl-phonebar { visibility: hidden; }
.pl .pl-drawer .pl-nav-item > a { color: var(--pl-brown); padding: 12px 0; }
.pl .pl-drawer .pl-nav-item > a[aria-current="page"] { color: var(--pl-red); }
.pl .pl-drawer { color: var(--pl-brown); }
.pl .pl-menu[open] .pl-x { width: 42px; height: 42px; padding: 10px; color: #111; stroke-width: 2; }
.pl-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pl .pl-drawer-head { margin: -18px -22px 10px; padding: 14px 22px; background: var(--pl-choc); }
.pl-drawer-search { display: flex; margin-bottom: 8px; border: 1px solid var(--pl-line); }
.pl-drawer-nav { display: grid; }
.pl-drawer-nav .pl-nav-item > a { width: 100%; padding: 11px 0; border-bottom: 1px solid var(--pl-line); }
.pl-drawer-nav .pl-nav-item > a::after, .pl-drawer-nav .pl-caret { display: none; }
.pl-drawer-nav .pl-sub { position: static; display: grid; min-width: 0; padding: 0 14px 6px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
.pl-drawer-nav .pl-sub a { padding: 6px 0; font-size: .92em; color: var(--pl-muted); }
.pl-drawer > a { padding: 10px 0; }
.pl-drawer hr { width: 100%; margin: 8px 0; border: 0; border-top: 1px solid var(--pl-line); }
.pl-drawer .pl-rate { margin-top: 12px; font-size: .82em; }

/* Home: categories, product row, sale head, store strip */
.pl-cats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; }
.pl-cat { display: grid; justify-items: center; gap: 14px; text-align: center; }
.pl-cat-pic { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: var(--pl-soft); }
.pl-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.pl-cat:hover .pl-cat-pic img { transform: scale(1.08); }
.pl-cat b { font-size: .82em; font-weight: 500; }
.pl-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 20px) / 4); gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: thin; }
.pl-slide-row > * { scroll-snap-align: start; }
.pl-sale-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-bottom: 22px; }
.pl-sale-head h2 { font-size: clamp(1.4em, 2cqi, 1.9em); }
.pl-sale-head .pl-more { margin-inline-start: auto; }
.pl-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--pl-hot); font-size: .82em; font-weight: 500; }
.pl-clock .pl-ico { width: 15px; height: 15px; }
.pl-store { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px 18px; min-height: 64px; padding: 10px 16px; background: var(--pl-lilac); font-size: 1.05em; }
.pl-store > .pl-ico { width: 22px; height: 22px; }

/* Product cards: a square picture on pale grey (the second picture on hover), badges, side buttons */
.pl-card { display: grid; gap: 4px; align-content: start; text-align: center; animation: pl-in .6s calc(var(--i) * 50ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.pl-card-pic { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--pl-soft); }
.pl-img, .pl-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-img img { object-fit: cover; mix-blend-mode: multiply; transition: opacity .5s, transform .9s cubic-bezier(.2, 1, .3, 1); }
.pl-img .pl-img-2 { opacity: 0; }
.pl-card:hover .pl-img .pl-img-2 { opacity: 1; }
.pl-card:hover .pl-img img { transform: scale(1.04); }
.pl-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 2.6em; color: var(--pl-muted); }
.pl-badges { position: absolute; top: 12px; inset-inline-start: 12px; display: grid; justify-items: start; gap: 5px; pointer-events: none; }
.pl-badge { display: inline-block; padding: 1px 8px; background: var(--pl-hot); color: #fff; font-size: .7em; font-weight: 500; line-height: 1.9; }
.pl-badge.off { background: var(--pl-off); }
.pl-badge.out { position: absolute; top: 12px; inset-inline-start: 12px; background: #8A8A8A; }
.pl-badge.dark { background: #111; }
.pl-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2; display: grid; gap: 6px; opacity: 0; transform: translateX(-10px); transition: opacity .3s, transform .3s; }
.pl-card:hover .pl-card-acts, .pl-card-acts:focus-within { opacity: 1; transform: none; }
.pl-round { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 4px 14px -6px rgb(0 0 0 / .3); cursor: pointer; transition: background .2s, color .2s; }
.pl-round:hover, .pl-round.on { background: #111; color: #fff !important; }
.pl-round .pl-ico { width: 17px; height: 17px; }
.pl-card-text { display: grid; justify-items: center; gap: 2px; padding-top: 10px; }
.pl-card-cat { color: #999; font-size: .72em; }
.pl-card-name { font-size: .92em; font-weight: 400; }
.pl-card-name:hover { color: var(--pl-acc); }
.pl-goldline { color: var(--pl-muted); font-size: .76em; }
.pl-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; font-size: .9em; }
.pl-price b { font-weight: 500; }
.pl-price s { color: #A0A0A0; font-size: .86em; }
.pl-card-desc { color: var(--pl-muted); font-size: .86em; line-height: 1.9; }

/* Shop: picture band, bar, grid modes, side column, pages */
.pl-banner { position: relative; display: grid; place-items: center; min-height: clamp(150px, 15cqi, 230px); overflow: hidden; background: #D6D6D6; text-align: center; }
.pl-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pl-banner > div { position: relative; display: grid; justify-items: center; gap: 2px; padding: 20px; }
.pl-banner h1 { font-size: clamp(1.8em, 3cqi, 2.6em); }
.pl-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--pl-muted); font-size: .8em; }
.pl-trail a:hover { color: var(--pl-ink); }
.pl-trail i { margin-inline: 6px; font-style: normal; opacity: .6; }
.pl-trail b { color: var(--pl-ink); font-weight: 400; }
.pl-sep { width: 12px; height: 12px; margin-inline: 4px; opacity: .6; }
.pl-trail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 16px; }
.pl-prevnext { display: flex; gap: 6px; }
.pl-prevnext .pl-ico { width: 18px; height: 18px; }
.pl-plp { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: clamp(24px, 3cqi, 40px); align-items: start; padding-block: 26px clamp(40px, 5cqi, 70px); }
.pl-plp-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; font-size: .86em; }
.pl-plp-bar > small { margin-inline-end: auto; color: var(--pl-muted); font-size: 1em; }
.pl-views { display: flex; gap: 6px; }
.pl-views a { display: grid; place-items: center; width: 30px; height: 30px; color: #B5B5B5; }
.pl-views a[aria-current], .pl-views a:hover { color: #111; }
.pl-views .pl-ico { width: 18px; height: 18px; }
.pl-sort { position: relative; }
.pl-sort > summary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: var(--pl-muted); cursor: pointer; list-style: none; }
.pl-sort > summary::-webkit-details-marker { display: none; }
.pl-sort > summary b { color: var(--pl-ink); font-weight: 400; }
.pl-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 170px; border: 1px solid var(--pl-line); background: var(--color-bg); box-shadow: 0 12px 24px -16px rgb(0 0 0 / .3); }
.pl-sort-list button { width: 100%; padding: 8px 14px; border: 0; background: none; text-align: start; cursor: pointer; }
.pl-sort-list button:hover, .pl-sort-list button[aria-current] { background: var(--pl-soft); }
.pl-grid { display: grid; gap: 34px 20px; }
.pl-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pl-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pl-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.pl-cols-list { grid-template-columns: 1fr; gap: 24px; }
.pl-row { grid-template-columns: 180px minmax(0, 1fr); gap: 24px; text-align: start; }
.pl-row .pl-card-text { justify-items: start; align-content: center; padding: 0; gap: 4px; }
.pl-row .pl-price { justify-content: flex-start; }
.pl-row .pl-btn { margin-top: 10px; }
.pl-pager { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.pl-pager a { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid transparent; font-size: .9em; }
.pl-pager a[aria-current] { border-color: #111; }
.pl-pager .pl-ico { width: 16px; height: 16px; }
.pl-side { display: grid; gap: 0; align-content: start; }
.pl-plp > .pl-side { order: -1; }
.pl-side-box { padding-block: 16px; border-bottom: 1px solid var(--pl-line); }
.pl-side-box > summary { display: flex; align-items: center; justify-content: space-between; font-size: 1.05em; font-weight: 400; cursor: pointer; list-style: none; }
.pl-side-box > summary::-webkit-details-marker { display: none; }
.pl-side-box:not([open]) .pl-caret { transform: rotate(180deg); }
.pl-side-box > div { display: grid; gap: 8px; padding-top: 14px; }
.pl-side-cats { display: grid; gap: 6px; font-size: .9em; }
.pl-side-cats a { display: flex; justify-content: space-between; color: #555; }
.pl-side-cats a:hover, .pl-side-cats a[aria-current] { color: var(--pl-ink); font-weight: 500; }
.pl-side-cats small, .pl-check small { color: #AAA; }
.pl-check { display: flex; align-items: center; gap: 10px; font-size: .9em; color: #555; cursor: pointer; }
.pl-check span { flex: 1; }
.pl-check input { width: 15px; height: 15px; margin: 0; accent-color: #111; }
.pl-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.pl-sizes label { cursor: pointer; }
.pl-sizes input { position: absolute; opacity: 0; }
.pl-sizes span { display: grid; place-items: center; min-width: 38px; height: 34px; padding: 0 8px; border: 1px solid var(--pl-line); font-size: .86em; }
.pl-sizes input:checked + span { border-color: #111; background: #111; color: #fff; }
.pl-facets-foot { display: flex; align-items: center; gap: 16px; padding-top: 18px; }
.pl-range { position: relative; height: 18px; }
.pl-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: #111; }
.pl-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.pl-range input::-webkit-slider-thumb { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.pl-range input::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; }
.pl-range input::-webkit-slider-runnable-track { background: none; }
.pl-range input::-moz-range-track { background: none; }
.pl-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.pl-range-foot small { font-size: .8em; color: #555; }
.pl-side-search { display: flex; border: 1px solid var(--pl-line); margin-bottom: 4px; }

/* Product page */
.pl-product { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(26px, 4cqi, 60px); padding-bottom: clamp(30px, 4cqi, 56px); }
.pl-gallery { position: relative; display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.pl-gallery.pl-n0, .pl-gallery.pl-n1 { grid-template-columns: 1fr; }
.pl-g { position: absolute; opacity: 0; pointer-events: none; }
.pl-thumbs { display: grid; gap: 10px; }
.pl-thumbs label { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border: 1px solid transparent; background: var(--pl-soft); cursor: pointer; transition: border-color .2s; }
.pl-thumbs img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pl-mainpic { position: relative; display: grid; background: var(--pl-soft); }
.pl-big { grid-area: 1 / 1; position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.pl-big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pl-gallery:not(.pl-n0):not(.pl-n1) .pl-big { visibility: hidden; opacity: 0; transition: opacity .4s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.pl-g:nth-of-type(${n}):checked ~ .pl-mainpic > .pl-big:nth-child(${n})`).join(", ")} { visibility: visible !important; opacity: 1 !important; }
${[1, 2, 3, 4, 5, 6].map((n) => `.pl-g:nth-of-type(${n}):checked ~ .pl-thumbs > label:nth-child(${n})`).join(", ")} { border-color: #111; }
.pl-zoom-ico { position: absolute; top: 14px; inset-inline-end: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.pl-zoom-ico .pl-ico { width: 16px; height: 16px; }
.pl-mainpic .pl-badges, .pl-mainpic .pl-badge.out { z-index: 1; }
.pl-info { display: grid; gap: 12px; align-content: start; }
.pl-info h1 { font-size: clamp(1.5em, 2.1cqi, 2em); line-height: 1.5; }
.pl-rating { display: inline-flex; align-items: center; gap: 6px; font-size: .86em; color: var(--pl-muted); }
.pl-info-price { display: flex; align-items: center; gap: 12px; }
.pl-info-price .pl-price { font-size: 1.35em; }
.pl-save { padding: 1px 8px; background: var(--pl-off); color: #fff; font-size: .78em; }
.pl-desc { color: var(--pl-muted); line-height: 2; }
.pl-avail { font-size: .9em; }
.pl-avail .in { color: #16A34A; font-weight: 500; }
.pl-avail .out { color: var(--pl-hot); font-weight: 500; }
.pl-goldbox { display: grid; gap: 8px; padding: 16px 18px; border: 1px solid var(--pl-line); background: #FCFAF6; }
.pl-goldbox h3 { font-size: .95em; }
.pl-goldbox dl { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 10px; row-gap: 0; margin: 0; font-size: .88em; }
.pl-goldbox dt { grid-row: 1; color: var(--pl-muted); }
.pl-goldbox dd { grid-row: 2; margin: 0 0 0 24px; font-weight: 500; }
.pl-goldbox .pl-under { justify-self: start; }
.pl-buy { display: grid; gap: 10px; }
.pl-buy-row { display: flex; gap: 10px; }
.pl-buy-row .pl-btn { flex: 1; }
.pl-qty input { width: 90px; height: 44px; padding: 0 10px; border: 1px solid var(--pl-line); background: var(--color-bg); color: inherit; font: inherit; text-align: center; }
.pl-links { display: flex; flex-wrap: wrap; gap: 8px 22px; padding-top: 6px; }
.pl-linkbtn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; font-size: .86em; cursor: pointer; }
.pl-linkbtn:hover { color: var(--pl-acc); }
.pl-linkbtn .pl-ico, .pl-eta .pl-ico { width: 17px; height: 17px; }
.pl-eta { display: flex; align-items: center; gap: 8px; font-size: .86em; color: #555; }
.pl-eta b { font-weight: 500; color: var(--pl-ink); }
.pl-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 6px 0 0; padding: 16px 10px; list-style: none; border: 1px solid var(--pl-line); text-align: center; }
.pl-perks li { display: grid; justify-items: center; gap: 6px; font-size: .78em; color: #555; }
.pl-perks .pl-ico, .pl-perks img { width: 26px; height: 26px; stroke-width: 1.2; object-fit: contain; }
.pl-meta { display: flex; align-items: center; gap: 6px; color: var(--pl-muted); font-size: .86em; }
.pl-meta a:hover { color: var(--pl-ink); }
.pl-share .pl-ico { width: 17px; height: 17px; }
.pl-tabs { display: grid; padding-block: 10px clamp(30px, 4cqi, 60px); border-top: 1px solid var(--pl-line); }
.pl-tab-in { position: absolute; opacity: 0; pointer-events: none; }
.pl-tab-labels { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px clamp(18px, 3cqi, 44px); margin-bottom: 26px; }
.pl-tab-labels label { position: relative; padding: 14px 0 8px; color: var(--pl-muted); font-size: 1.02em; cursor: pointer; }
.pl-tab-labels label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: #111; transform: scaleX(0); transition: transform .3s; }
.pl-tab-panel { display: none; }
${[1, 2, 3, 4].map((n) => `.pl-tab-in:nth-of-type(${n}):checked ~ .pl-tab-panels > .pl-tab-panel:nth-child(${n})`).join(", ")} { display: block; animation: pl-in .4s ease both; }
${[1, 2, 3, 4].map((n) => `.pl-tab-in:nth-of-type(${n}):checked ~ .pl-tab-labels > label:nth-child(${n})`).join(", ")} { color: var(--pl-ink); }
${[1, 2, 3, 4].map((n) => `.pl-tab-in:nth-of-type(${n}):checked ~ .pl-tab-labels > label:nth-child(${n})::after`).join(", ")} { transform: scaleX(1); }
.pl-tab-desc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.pl-tab-desc img { width: 100%; max-height: 460px; aspect-ratio: 4 / 3; object-fit: cover; background: var(--pl-soft); }
.pl-specs { width: min(720px, 100%); margin-inline: auto; }
.pl-breakup { display: grid; gap: 12px; width: min(620px, 100%); margin-inline: auto; }
.pl-breakup table { width: 100%; border-collapse: collapse; font-size: .92em; }
.pl-breakup th, .pl-breakup td { padding: 11px 14px; border-bottom: 1px solid var(--pl-line); text-align: start; font-weight: 400; }
.pl-breakup td { text-align: end; white-space: nowrap; }
.pl-breakup tr:nth-child(odd) { background: #FAFAFA; }
.pl-breakup .total th, .pl-breakup .total td { border-bottom: 0; background: #111; color: #fff; font-weight: 500; }
.pl-breakup p { font-size: .84em; }
.pl-tab-panels .sk-reviews { width: min(860px, 100%); margin-inline: auto; }

/* About */
.pl-about-top { display: grid; justify-items: center; gap: 4px; padding-block: 0 clamp(18px, 2.4cqi, 32px); text-align: center; }
.pl-about-top h1, .pl-page-title { font-size: clamp(1.8em, 2.8cqi, 2.5em); }
.pl-page-title { padding-block: 6px 18px; }
.pl-about-top p { max-width: 40em; color: var(--pl-muted); }
.pl-about-pics { display: grid; grid-template-columns: 1fr 1fr; }
.pl-about-pics > .pl-pic { aspect-ratio: 960 / 687; }
.pl-story { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 2fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.pl-story h2 { display: flex; align-items: center; gap: 16px; font-size: clamp(1.5em, 2.3cqi, 2.1em); }
.pl-story h2 i { width: 70px; height: 1px; background: currentColor; }
.pl-story > div { display: grid; gap: 16px; }
.pl-story-lead { font-size: 1.15em; font-weight: 500; line-height: 1.9; white-space: pre-line; }
.pl-mission { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; width: var(--pl-wrap); margin-inline: auto; }
.pl-mission-pic { aspect-ratio: 960 / 540; }
.pl-mission-text { display: grid; align-content: center; gap: 30px; padding: clamp(24px, 4cqi, 60px); background: var(--pl-soft); }
.pl-mission-text h3 { margin-bottom: 8px; font-size: 1.25em; font-weight: 400; }
.pl-mission-text p { color: var(--pl-muted); font-size: .9em; line-height: 2; }
.pl-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 26px; text-align: center; }
.pl-values > div { display: grid; justify-items: center; gap: 8px; }
.pl-values .pl-ico, .pl-values img { width: 34px; height: 34px; stroke-width: 1.2; object-fit: contain; }
.pl-values h3 { font-size: 1.05em; font-weight: 500; }
.pl-values p { max-width: 24em; color: var(--pl-muted); font-size: .86em; line-height: 1.9; }
.pl-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.pl-team figure { display: grid; gap: 10px; margin: 0; }
.pl-team-pic { position: relative; display: block; aspect-ratio: 435 / 488; overflow: hidden; background: var(--pl-soft); }
.pl-team-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.pl-team figure:hover img { transform: scale(1.05); }
.pl-team figcaption { display: grid; }
.pl-team b { font-weight: 500; }
.pl-team small { color: var(--pl-muted); }
.pl-quotes { position: relative; background: var(--pl-pink); }
.pl-q-in { position: absolute; opacity: 0; pointer-events: none; }
.pl-q-list { display: grid; padding-block: clamp(30px, 4cqi, 60px); }
.pl-q-item { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) 240px; align-items: center; gap: clamp(20px, 4cqi, 60px); margin: 0; }
.pl-q2 .pl-q-item, .pl-q3 .pl-q-item, .pl-q4 .pl-q-item, .pl-q5 .pl-q-item { visibility: hidden; opacity: 0; transition: opacity .5s; }
${[1, 2, 3, 4, 5].map((n) => `.pl-q-in:nth-of-type(${n}):checked ~ .pl-q-list > .pl-q-item:nth-child(${n})`).join(", ")} { visibility: visible; opacity: 1; }
.pl-q-item > div { display: grid; justify-items: start; gap: 10px; }
.pl-q-item small { font-size: .8em; color: #555; }
.pl-stars { color: #F2994A; letter-spacing: 2px; }
.pl-q-item blockquote { margin: 0; font-size: clamp(1.1em, 1.6cqi, 1.45em); line-height: 1.8; }
.pl-q-item figcaption { font-size: .86em; font-weight: 500; }
.pl-q-arrows { display: flex; gap: 14px; margin-top: 10px; }
.pl-q-arrows label { cursor: pointer; }
.pl-q-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.pl-q-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Blog */
.pl-blog { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: clamp(24px, 4cqi, 56px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.pl-posts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.pl-post-card { display: grid; gap: 8px; align-content: start; justify-items: start; }
.pl-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--pl-soft); }
.pl-post-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.pl-post-card:hover .pl-post-pic img { transform: scale(1.05); }
.pl-post-pic .pl-badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.pl-post-meta { color: #999; font-size: .76em; }
.pl-post-card h2 { font-size: 1.2em; line-height: 1.6; }
.pl-post-card h2 a:hover { color: var(--pl-acc); }
.pl-post-card p { color: var(--pl-muted); font-size: .9em; line-height: 1.9; }
.pl-mini { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: center; }
.pl-mini > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--pl-soft); }
.pl-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pl-mini > span:last-child { display: grid; gap: 2px; font-size: .86em; }
.pl-mini b { font-weight: 500; }
.pl-mini small { color: #999; }
.pl-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pl-tags span { padding: 3px 10px; border: 1px solid var(--pl-line); font-size: .8em; }
.pl-article { display: grid; gap: 14px; align-content: start; justify-items: start; }
.pl-article h1 { font-size: clamp(1.6em, 2.6cqi, 2.3em); }
.pl-article-pic { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.pl-article .pl-text { color: #555; }
.pl-post-nav { display: flex; justify-content: space-between; gap: 20px; width: 100%; padding-block: 18px; border-block: 1px solid var(--pl-line); }
.pl-post-nav a { display: grid; gap: 2px; max-width: 46%; }
.pl-post-nav a:last-child { text-align: end; }
.pl-post-nav small { color: #999; font-size: .78em; }
.pl-post-nav b { font-weight: 400; }
.pl-related { display: grid; gap: 14px; width: 100%; }
.pl-related h2 { font-size: 1.2em; }
.pl-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.pl-rel { display: grid; gap: 8px; }
.pl-rel > span { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--pl-soft); }
.pl-rel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pl-rel .pl-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-style: normal; }
.pl-rel b { font-weight: 400; }

/* Contact */
.pl-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.pl-contact-info { display: grid; gap: 20px; }
.pl-contact-item { display: flex; align-items: flex-start; gap: 14px; }
.pl-contact-item > .pl-ico { width: 24px; height: 24px; margin-top: 4px; }
.pl-contact-item span { display: grid; }
.pl-contact-item small { color: var(--pl-muted); }
.pl-contact-item b, .pl-contact-item a { font-weight: 500; }
.pl-message { display: grid; gap: 12px; padding: clamp(20px, 3cqi, 36px); background: var(--pl-soft); }
.pl-message h2 { font-size: 1.4em; }
.pl-message input, .pl-message textarea, .pl-checkout input, .pl-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--pl-line); background: var(--color-bg); color: inherit; font: inherit; }
.pl-message input:focus, .pl-message textarea:focus, .pl-checkout input:focus, .pl-checkout textarea:focus { outline: none; border-color: #111; }
.pl-message .pl-btn { justify-self: start; }
.pl-map { position: relative; aspect-ratio: 3 / 1; border: 1px solid var(--pl-line); background: var(--pl-soft); }
.pl-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.pl-map .pl-btn { position: absolute; bottom: 14px; inset-inline-start: 14px; }
.pl-map-link { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 20px; border: 1px dashed var(--pl-line); }

/* Cart, checkout, search, thanks */
.pl-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.pl-lines { display: grid; border-top: 1px solid var(--pl-line); }
.pl-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--pl-line); }
.pl-line-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--pl-soft); }
.pl-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.pl-line-info { display: grid; gap: 2px; }
.pl-line-info b { font-weight: 500; }
.pl-line-info small { color: var(--pl-muted); }
.pl-stepper { display: flex; align-items: center; border: 1px solid var(--pl-line); }
.pl-stepper button { width: 34px; height: 34px; border: 0; background: none; font-size: 1.1em; cursor: pointer; }
.pl-stepper span { min-width: 24px; text-align: center; }
.pl-line-total { min-width: 8em; text-align: end; font-weight: 500; }
.pl-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--pl-muted) !important; cursor: pointer; }
.pl-remove:hover { color: var(--pl-hot) !important; }
.pl-sum { position: sticky; top: 140px; display: grid; gap: 14px; padding: 24px; background: var(--pl-soft); }
.pl-sum h2 { font-size: 1.25em; }
.pl-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; }
.pl-sum dd { margin: 0; text-align: end; }
.pl-sum .total { padding-top: 12px; border-top: 1px solid #DDD; font-weight: 600; }
.pl-sum small { color: var(--pl-muted); }
.pl-off { color: #15803D; }
.pl-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: .9em; }
.pl-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.pl-pay { padding: 12px 14px; border: 1px dashed #CCC; background: var(--color-bg); font-size: .86em; line-height: 1.9; }
.pl-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.pl-checkout h2, .pl-checkout .full, .pl-checkout .pl-error { grid-column: 1 / -1; }
.pl-checkout h2 { font-size: 1.25em; }
.pl-checkout label { display: grid; gap: 6px; font-size: .9em; font-weight: 500; }
.pl-trap { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.pl-empty { display: grid; justify-items: start; gap: 24px; padding-bottom: clamp(40px, 5cqi, 70px); }
.pl-empty .pl-notice { justify-self: stretch; }
.pl-search { display: grid; gap: 26px; padding-bottom: clamp(40px, 5cqi, 70px); }
.pl-search-box { display: flex; width: min(560px, 100%); margin-inline: auto; border: 1px solid #111; }
.pl-search-box input { flex: 1; min-width: 0; padding: 16px 20px; border: 0; background: none; color: inherit; font: inherit; }
.pl-search-box input:focus { outline: none; }
.pl-search-box button { width: 60px; border: 0; background: none; cursor: pointer; }
.pl-search .pl-muted { text-align: center; }
.pl-thanks { display: grid; justify-items: center; gap: 14px; padding-block: clamp(40px, 6cqi, 90px); text-align: center; }
.pl-thanks p { max-width: 36em; line-height: 2; }
.pl-done { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #E8F6EC; color: #16A34A; font-size: 2em; }

/* Newsletter and footer */
.pl-news { padding-block: clamp(36px, 5cqi, 64px); background: var(--pl-soft); text-align: center; }
.pl-news.is-home { background: var(--color-bg); }
.pl-news .pl-wrap { display: grid; justify-items: center; gap: 6px; }
.pl-news h2 { font-size: clamp(1.4em, 2.1cqi, 1.9em); }
.pl-news p { color: var(--pl-muted); font-size: .88em; }
.pl-news-form { display: flex; gap: 8px; width: min(480px, 100%); margin-top: 14px; }
.pl-news-form input { flex: 1; min-width: 0; padding: 10px 14px; border: 1px solid #111; background: var(--color-bg); color: inherit; font: inherit; font-size: .9em; }
.pl-news-form button { padding: 0 24px; border: 1px solid #111; background: #111; color: #fff; font-size: .82em; cursor: pointer; transition: background .2s; }
.pl-news-form button:hover { background: var(--pl-acc); border-color: var(--pl-acc); }
.pl-foot { padding-top: clamp(40px, 5cqi, 64px); border-top: 1px solid var(--pl-line); background: #FAFAFA; font-size: .88em; }
.pl-foot-cols { display: grid; grid-template-columns: 1.3fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-bottom: 36px; }
.pl-foot-cols > div { display: grid; align-content: start; gap: 8px; }
.pl-foot-cols h3 { margin-bottom: 6px; font-size: 1.05em; font-weight: 500; }
.pl-foot-cols a { color: #666; }
.pl-foot-cols a:hover { color: #111; }
.pl-foot-brand small { color: var(--pl-muted); }
.pl-foot-brand .pl-logo img { height: 24px; }
.pl-foot-phone { display: flex; align-items: center; gap: 10px; color: #111 !important; }
.pl-foot-phone .pl-ico { width: 34px; height: 34px; padding: 7px; border-radius: 50%; background: #E9E9E9; }
.pl-foot-phone span { display: grid; line-height: 1.5; }
.pl-foot-phone small { color: var(--pl-muted); }
.pl-foot-phone b { font-size: 1.15em; font-weight: 500; }
.pl-foot-store p { color: #666; }
.pl-foot-store p b { color: #111; }
.pl-socials { gap: 4px; }
.pl-socials a { width: 32px; height: 32px; border: 0; color: #111; }
.pl-socials a:hover { background: #111; color: #fff; }
.pl-foot-bottom { display: grid; justify-items: center; gap: 10px; padding-block: 18px 24px; border-top: 1px solid var(--pl-line); color: var(--pl-muted); text-align: center; }
.pl-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.pl-trust img { height: 44px; width: auto; }
.pl-phonebar { display: none; }
.pl-ftog, .pl-ftog-btn { display: none; }


/* Big menu under "shop" */
.pl-nav-item.has-mega { position: static; }
.pl-mega { position: absolute; inset-inline: 0; top: 100%; z-index: 6; border-top: 1px solid var(--pl-line); background: var(--color-bg); box-shadow: 0 20px 30px -24px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.pl-nav-item.has-mega:hover .pl-mega, .pl-nav-item.has-mega:focus-within .pl-mega { opacity: 1; visibility: visible; transform: none; }
.pl-mega-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 280px; gap: 30px; padding-block: 30px; }
.pl-mega-in > div { display: grid; align-content: start; gap: 10px; }
.pl-mega h4 { margin: 0 0 4px; font-size: 1em; font-weight: 600; }
.pl-mega h4.pl-mega-h2 { margin-top: 18px; }
.pl-mega-in > div a { color: #666; font-weight: 300; }
.pl-mega-in > div a:hover { color: #111; }
.pl-mega-card { position: relative; display: block; aspect-ratio: 305 / 400; overflow: hidden; background: var(--pl-soft); }
.pl-mega-pic, .pl-mega-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-mega-pic img { object-fit: cover; }
.pl-mega-note { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; justify-items: center; gap: 2px; padding: 14px 10px; background: #fff; text-align: center; }
.pl-mega-note b { font-size: 1.2em; font-weight: 400; }
.pl-mega-note small { color: #555; }
.pl-browse > summary { min-width: 270px; padding: 13px 18px; background: #111; color: #fff; justify-content: space-between; }
.pl-browse > div { min-width: 270px; padding: 0; border-top: 0; }
.pl-browse > div a { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid var(--pl-line); color: #555; }
.pl-browse > div a.strong { color: #111; font-weight: 500; }
.pl-browse > div a .pl-caret { opacity: .5; }
.pl-head-row2 { min-height: 46px; }

/* Phone menu: two tabs, menu and categories */
.pl-dtab { position: absolute; opacity: 0; pointer-events: none; }
.pl-dtabs { display: flex; gap: 22px; margin: 6px 0 8px; border-bottom: 1px solid var(--pl-line); }
.pl-dtabs label { padding: 8px 0; color: var(--pl-muted); cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; }
#pl-dtab-1:checked ~ .pl-dtabs label:first-child, #pl-dtab-2:checked ~ .pl-dtabs label:last-child { color: #111; border-color: #111; }
.pl-dpanel { display: none; }
#pl-dtab-1:checked ~ .pl-dpanel-1, #pl-dtab-2:checked ~ .pl-dpanel-2 { display: grid; }
.pl-dpanel > a { padding: 10px 0; border-bottom: 1px solid var(--pl-line); }
.pl-drawer-socials { margin-top: 14px; }

/* Sign-in window and side cart (hidden checkboxes open them) */
.pl-pop-in { position: fixed; opacity: 0; pointer-events: none; }
.pl-pop, .pl-mc { position: fixed; inset: 0; z-index: 120; display: none; }
#pl-login:checked + .pl-pop, .pl-mc-in:checked + .pl-mc { display: grid; }
.pl-pop { place-items: center; padding: 16px; }
.pl-pop-shade { position: absolute; inset: 0; background: rgb(0 0 0 / .45); cursor: pointer; }
.pl-pop-box { position: relative; display: grid; gap: 14px; width: min(440px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; padding: 30px 28px; background: var(--color-bg); animation: pl-in .35s ease both; }
.pl-pop-x { position: absolute; top: 14px; inset-inline-end: 14px; cursor: pointer; }
.pl-lt { position: absolute; opacity: 0; pointer-events: none; }
.pl-lt-tabs { display: flex; justify-content: center; gap: 30px; }
.pl-lt-tabs label { font-size: 1.6em; font-weight: 300; color: #BBB; cursor: pointer; }
#pl-lt-1:checked ~ .pl-lt-tabs label:first-child, #pl-lt-2:checked ~ .pl-lt-tabs label:last-child { color: #111; }
.pl-pop-form { display: none; gap: 14px; }
#pl-lt-1:checked ~ .pl-pop-form:nth-of-type(1), #pl-lt-2:checked ~ .pl-pop-form:nth-of-type(2) { display: grid; }
.pl-pop-form label { display: grid; gap: 6px; font-size: .92em; font-weight: 500; }
.pl-pop-form label i { color: var(--pl-hot); font-style: normal; }
.pl-pop-form input { width: 100%; padding: 12px 14px; border: 1px solid var(--pl-line); background: var(--color-bg); color: inherit; font: inherit; }
.pl-pop-form input:focus { outline: none; border-color: #111; }
.pl-pop-form small { color: var(--pl-muted); text-align: center; }
.pl-pop-form small a { color: #111; text-decoration: underline; }
.pl-icon-user { cursor: pointer; }
.pl-mc-box { position: absolute; inset-block: 0; inset-inline-end: 0; display: grid; grid-template-rows: auto 1fr auto; width: min(400px, 92%); background: var(--color-bg); animation: pl-mc .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes pl-mc { from { transform: translateX(-100%); } }
.pl-mc-box header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--pl-line); }
.pl-mc-box header h2 { font-size: 1.3em; }
.pl-mc-box header label { cursor: pointer; }
.pl-mc-lines { display: grid; align-content: start; gap: 4px; padding: 6px 22px; overflow-y: auto; }
.pl-mc-line { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--pl-line); }
.pl-mc-line > div { display: grid; justify-items: start; gap: 6px; }
.pl-mc-line small { color: var(--pl-muted); }
.pl-mc-box footer { display: grid; gap: 10px; padding: 18px 22px 22px; border-top: 1px solid var(--pl-line); }
.pl-mc-box footer p { display: flex; justify-content: space-between; font-size: 1.05em; }

/* Tablets */
@container (max-width: 1100px) {
  .pl-nav { gap: 16px; font-size: .82em; }
  .pl-head-contact a:last-child { display: none; }
  .pl-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pl-slide-row { grid-auto-columns: calc((100% - 2 * 20px) / 3); }
  .pl-plp { grid-template-columns: 230px minmax(0, 1fr); }
  .pl-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pl-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pl-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .pl-menu { display: block; }
  .pl-nav, .pl-head-row2, .pl-head-search, .pl-icon-user, .pl-icon-search, .pl-icon-wish { display: none !important; }
  .pl-head-in, .pl-head-inner .pl-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 60px; gap: 10px; }
  .pl-logo { justify-self: center; }
  .pl-icons { justify-self: end; }
  .pl-head-home { border-bottom-color: var(--pl-line); }
  .pl-plp { grid-template-columns: 1fr; }
  .pl-side { order: -1; display: none; grid-template-columns: 1fr 1fr; column-gap: 20px; margin-bottom: 10px; padding: 4px 16px 16px; border: 1px solid var(--pl-line); }
  .pl-ftog:checked + .pl-side { display: grid; }
  .pl-ftog-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #111; cursor: pointer; }
  .pl-ftog-btn .pl-ico { width: 16px; height: 16px; }
  .pl-plp-main { order: 1; }
  .pl-side .pl-side-box { padding-block: 10px; }
  .pl-side-box:not([open]) > div { display: none; }
  .pl-facets { display: contents; }
  .pl-facets-foot { grid-column: 1 / -1; }
  .pl-product { grid-template-columns: 1fr; }
  .pl-tab-desc { display: grid; grid-template-columns: 1fr; }
  .pl-blog, .pl-contact, .pl-cart { grid-template-columns: 1fr; }
  .pl-sum { position: static; }
  .pl-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pl-story { grid-template-columns: 1fr; }
  .pl-mission { grid-template-columns: 1fr; }
  /* Phones: the bar of shortcuts at the bottom */
  .pl-phonebar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--pl-line); background: var(--color-bg); }
  .pl-phonebar a { position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0 6px; font-size: .7em; }
  .pl-phonebar a[aria-current] { color: var(--pl-acc); }
  .pl-phonebar .pl-ico { width: 20px; height: 20px; }
  .pl-phonebar i { position: absolute; top: 3px; left: calc(50% + 6px); min-width: 15px; height: 15px; border-radius: 99px; background: #111; color: #fff; font-size: 9px; font-style: normal; line-height: 15px; text-align: center; }
}
@container (max-width: 600px) {
  .pl { font-size: 13.5px; }
  .pl-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .pl-slide-row { grid-auto-columns: calc((100% - 12px) / 2); gap: 12px; }
  .pl-cols-2, .pl-cols-3, .pl-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  .pl-row { grid-template-columns: 110px minmax(0, 1fr); gap: 14px; }
  .pl-card-acts { opacity: 1; transform: none; }
  .pl-round { width: 30px; height: 30px; }
  .pl-plp-bar { flex-wrap: wrap; gap: 8px; }
  .pl-plp-bar > small { flex-basis: 100%; order: 3; }
  .pl-views { margin-inline-start: auto; }
  .pl-side { grid-template-columns: 1fr; }
  .pl-gallery { grid-template-columns: 1fr; }
  .pl-thumbs { order: 2; grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .pl-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pl-buy-row .pl-btn { padding-inline: 12px; }
  .pl-posts, .pl-related > div { grid-template-columns: 1fr; }
  .pl-q-item { grid-template-columns: 1fr; }
  .pl-q-pic { width: 160px; order: -1; }
  .pl-line { grid-template-columns: 72px minmax(0, 1fr) auto; gap: 10px; }
  .pl-line .pl-stepper { grid-column: 2; justify-self: start; }
  .pl-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; }
  .pl-checkout { grid-template-columns: 1fr; }
  .pl-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px; }
  .pl-news-form { flex-direction: column; }
  .pl-news-form button { min-height: 42px; }
  .pl-map { aspect-ratio: 1.3; }
  .pl-trail-row { padding-block: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .pl-main > *, .pl-card, .pl-drawer { animation: none !important; }
}

/* ───── Pulad look: red #F5094B, navy, black strips, a heavy display font ───── */
@font-face { font-family: "Pulad Lalezar"; src: url("/_assets/fonts/escape-lalezar.woff") format("woff"); font-display: swap; }
.pl { --pl-red: #F5094B; --pl-navy: #0B1D3F; --pl-black: #05070C; --pl-acc: var(--pl-red); --pl-font: "Pulad Lalezar", var(--font-heading); --pl-wrap: min(1320px, 100% - 2 * clamp(16px, 3.4cqi, 48px));
  --pl-line: #E6E8EE; --pl-soft: #F3F5F9; --pl-muted: #6B7280; --sk-accent: var(--pl-red); font-weight: 400; overflow-x: clip; }
.pl h1, .pl h2, .pl-title h2, .pl h3.pl-disp { font-family: var(--pl-font); font-weight: 400; line-height: 1.35; letter-spacing: 0; }
.pl-acc { color: var(--pl-red); font-style: normal; }
.pl-btn { min-height: 46px; padding: 0 30px; border: 1px solid var(--pl-red); background: var(--pl-red); color: #fff !important; font-weight: 600; font-size: .9em; }
.pl-btn:hover { background: var(--pl-navy); border-color: var(--pl-navy); }
.pl-btn.ghost { background: transparent; color: var(--pl-ink) !important; border-color: currentColor; }
.pl-btn.ghost.light { color: #fff !important; border-color: #fff; }
.pl-btn.ghost:hover { background: var(--pl-red); border-color: var(--pl-red); color: #fff !important; }
.pl-btn.ghost-acc { background: transparent; color: var(--pl-red) !important; border-color: var(--pl-red); }
.pl-btn.ghost-acc:hover { background: var(--pl-red); color: #fff !important; }
.pl-btn.ghost-green { background: transparent; color: #4ADE80 !important; border-color: #4ADE80; }
.pl-btn.ghost-green:hover { background: #4ADE80; color: var(--pl-black) !important; }
.pl .sk-btn { background: var(--pl-red); }
.pl .sk-btn:hover { background: var(--pl-navy); }
.pl-sec-flush { padding-bottom: 0; }
.pl-soft { background: var(--pl-soft); }
.pl-navy { position: relative; background: var(--pl-navy); color: #fff; }
.pl-stripes { background-image: repeating-linear-gradient(115deg, transparent 0 70px, rgb(255 255 255 / .035) 70px 72px); }
.pl-title { display: grid; justify-items: center; gap: 8px; max-width: 46em; margin: 0 auto clamp(26px, 3.4cqi, 48px); text-align: center; }
.pl-title h2 { font-size: clamp(1.7em, 2.8cqi, 2.6em); }
.pl-title p { color: var(--pl-muted); font-size: 1.02em; line-height: 2; }
.pl-title.light p { color: rgb(255 255 255 / .85); }
.pl-add { display: grid; place-items: center; min-height: 120px; border: 1px dashed #bbb; color: var(--pl-muted); cursor: pointer; }

/* Header: a white logo corner, a black top strip cut on a slant, the menu row; over the hero on the home page */
.pl-head { position: relative; z-index: 30; display: grid; grid-template-columns: auto minmax(0, 1fr); background: #fff; box-shadow: 0 1px 0 var(--pl-line); }
.pl-head-logo { display: grid; align-items: center; padding: 10px clamp(16px, 3cqi, 46px); }
.pl-logo { display: inline-flex; align-items: center; gap: 10px; }
.pl-logo img { width: 56px; height: 56px; object-fit: contain; }
.pl-logo > span { display: grid; line-height: 1.2; }
.pl-logo b { font-family: var(--pl-font); font-size: 1.9em; font-weight: 400; color: var(--pl-navy); }
.pl-logo small { font-size: .7em; letter-spacing: .02em; color: var(--pl-muted); }
.pl-head-main { display: grid; }
.pl-topbar { display: flex; align-items: center; justify-content: flex-start; flex-wrap: wrap; gap: 6px 34px; min-height: 42px; padding: 6px clamp(16px, 3cqi, 46px); padding-inline-start: 80px; background: var(--pl-black); color: #fff; font-size: .8em; font-weight: 500; clip-path: polygon(0 0, 100% 0, calc(100% - 46px) 100%, 0 100%); }
.pl-topbar > span, .pl-topbar > a { display: inline-flex; align-items: center; gap: 8px; }
.pl-topbar .pl-ico { width: 15px; height: 15px; color: var(--pl-red); }
.pl-head-row { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); min-height: 74px; padding-inline: 20px clamp(16px, 3cqi, 46px); }
.pl-nav { display: flex; align-items: center; gap: clamp(16px, 2.4cqi, 38px); margin-inline-end: auto; font-weight: 700; font-size: .95em; }
.pl-nav-item > a { padding: 25px 0; }
.pl-nav-item > a::after { display: none; }
.pl-nav-item > a:hover, .pl-nav-item > a[aria-current="page"] { color: var(--pl-red); }
.pl-nav-item.has-sub:hover > a .pl-caret { transform: rotate(180deg); }
.pl-caret { transition: transform .25s; }
.pl-sub { min-width: 220px; padding: 10px 0; border-top: 3px solid var(--pl-red); background: #fff; color: var(--pl-ink); }
.pl-sub a { padding: 8px 22px; font-weight: 500; font-size: .95em; }
.pl-icons { gap: 22px; }
.pl-icon > i { background: var(--pl-red); }
.pl-join { min-height: 48px; padding-inline: 26px; }
.pl-head.is-home { position: absolute; inset-inline: 0; top: 0; background: transparent; box-shadow: none; color: #fff; }
.pl-head.is-home .pl-head-row { background: rgb(5 7 12 / .28); backdrop-filter: blur(2px); }
.pl-head.is-home .pl-logo b, .pl-head.is-home .pl-logo small { color: #fff; }
.pl-head.is-home .pl-head-logo { background: rgb(5 7 12 / .28); }
.pl-head.is-home .pl-topbar { background: var(--pl-black); }

/* Phone menu: the head (logo and a round grey X) belongs to the summary, so a click there closes it */
.pl-menu { display: none; }
.pl-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; background: rgb(5 7 12 / .55); }
.pl-burger .pl-ico { width: 26px; height: 26px; }
.pl-drawer { top: 0; padding: 0 22px 40px; width: min(360px, 88%); color: var(--pl-ink); background: #fff; }
.pl .pl-drawer-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin: 0 -22px 6px; padding: 14px 22px; background: #fff; border-bottom: 1px solid var(--pl-line); }
.pl-drawer-head .pl-logo { pointer-events: none; }
.pl-drawer-head .pl-logo b { color: var(--pl-navy) !important; }
.pl-drawer-head .pl-logo img { width: 44px; height: 44px; }
.pl-x { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: #EEF0F3; color: var(--pl-ink); }
.pl-x .pl-ico { width: 18px; height: 18px; stroke-width: 2; }
.pl-menu[open] .pl-drawer { pointer-events: none; }
.pl-menu[open] .pl-drawer > :not(.pl-drawer-head) { pointer-events: auto; }
.pl-drawer-nav { display: grid; margin-bottom: 18px; }
.pl-fold { border-bottom: 1px solid var(--pl-line); }
.pl-fold > summary { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; font-weight: 700; cursor: pointer; list-style: none; }
.pl-fold > summary::-webkit-details-marker { display: none; }
.pl .pl-fold > summary .pl-caret { display: block; width: 16px; height: 16px; }
.pl-fold[open] > summary { color: var(--pl-red); }
.pl .pl-fold[open] > summary .pl-caret { transform: rotate(180deg); }
.pl-fold > div { display: grid; padding: 0 14px 10px; }
.pl-fold > div a { padding: 8px 0; color: #555; font-size: .95em; }
.pl-fold > div a[aria-current] { color: var(--pl-red); }
.pl .pl-fold-link { padding: 14px 0; border-bottom: 1px solid var(--pl-line); font-weight: 700; }
.pl .pl-fold-link[aria-current] { color: var(--pl-red); }
.pl-drawer-socials { justify-content: center; margin-top: 14px; }

/* Hero: the athlete photo, the kicker, three lines (the middle one hollow), buttons */
.pl-hero { position: relative; display: grid; align-items: center; min-height: clamp(560px, 62cqi, 860px); overflow: hidden; background: var(--pl-black); color: #fff; }
.pl-hero-pic { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: left center; transform: scaleX(-1); }
.pl-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to left, rgb(5 7 12 / .75), rgb(5 7 12 / .2) 55%, transparent); }
.pl-hero-in { position: relative; z-index: 1; display: grid; justify-items: start; gap: 12px; padding-top: 120px; }
.pl-hero-in > small { font-size: 1.05em; font-weight: 700; animation: pl-up .8s .1s both; }
.pl-hero h1 { display: grid; font-size: clamp(3em, 7.2cqi, 7em); line-height: 1.12; }
.pl-hero h1 span { animation: pl-up .8s both; }
.pl-hero h1 span:nth-child(2) { animation-delay: .15s; }
.pl-hero h1 span:nth-child(3) { animation-delay: .3s; }
.pl-outline { color: transparent; -webkit-text-stroke: 1.5px #fff; }
.pl-hero-in > p { max-width: 32em; color: rgb(255 255 255 / .85); }
.pl-hero-btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; animation: pl-up .8s .45s both; }
@keyframes pl-up { from { opacity: 0; transform: translateY(30px); } }

/* Services: a navy title box, two photo tiles under it and a tall video tile */
.pl-services { display: grid; grid-template-columns: 1fr 1fr 2fr; grid-template-rows: auto auto; }
.pl-svc-title { grid-column: 1 / 3; display: grid; align-items: center; padding: clamp(26px, 4.5cqi, 70px); background: var(--pl-navy); color: #fff; }
.pl-svc-title h2 { font-size: clamp(1.6em, 2.5cqi, 2.5em); max-width: 12em; }
.pl-tile { position: relative; display: grid; align-items: end; min-height: clamp(220px, 22cqi, 430px); overflow: hidden; color: #fff; }
.pl-tile.t3 { grid-column: 3; grid-row: 1 / 3; }
.pl-tile-pic, .pl-tile-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-tile-pic img { object-fit: cover; transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.pl-tile:hover .pl-tile-pic img { transform: scale(1.06); }
.pl-tile::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(5 7 12 / .7), transparent 60%); }
.pl-tile-text { position: relative; z-index: 1; display: grid; justify-items: center; gap: 8px; padding: 26px; text-align: center; }
.pl-tile.t3 .pl-tile-text { justify-items: start; text-align: start; max-width: 22em; padding: clamp(24px, 3cqi, 50px); }
.pl-tile-text b { font-family: var(--pl-font); font-size: clamp(1.4em, 2cqi, 2em); font-weight: 400; line-height: 1.4; }
.pl-tile-ico { width: 44px; height: 44px; stroke-width: 1.3; }
.pl-play { position: relative; display: grid; place-items: center; width: 66px; height: 66px; background: var(--pl-red); }
.pl-play::before { content: ""; position: absolute; inset: -8px; border: 1px solid var(--pl-red); animation: pl-pulse 2s infinite; }
.pl-play .pl-ico { width: 24px; height: 24px; fill: #fff; stroke: none; }
@keyframes pl-pulse { 50% { inset: -14px; opacity: .3; } }

/* Why join: red hexagons over a faded photo */
.pl-why { position: relative; overflow: hidden; background: #fff; }
.pl-why-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); opacity: .09; }
.pl-why .pl-wrap { position: relative; }
.pl-why-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 4cqi, 60px); align-items: start; text-align: center; }
.pl-why-item { display: grid; justify-items: center; gap: 10px; }
.pl-why-item.up { margin-top: -50px; }
.pl-why-item h3 { font-family: var(--pl-font); font-size: 1.5em; font-weight: 400; }
.pl-why-item p { max-width: 22em; color: var(--pl-muted); font-size: .92em; line-height: 2; }
.pl-why-list.dark p { color: rgb(255 255 255 / .8); }
.pl-why-list.dark .pl-why-item.up { margin-top: 0; }
.pl-hex { position: relative; display: grid; place-items: center; width: 150px; aspect-ratio: 1.12; margin-bottom: 18px; background: radial-gradient(circle at 30% 30%, rgb(255 255 255 / .18), transparent 40%), repeating-linear-gradient(35deg, rgb(255 255 255 / .07) 0 2px, transparent 2px 9px), var(--pl-red); clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); color: #fff; transition: transform .5s; }
.pl-hex::before { content: ""; position: absolute; inset: 9px; background: transparent; clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%, 2.5% 50%, 26.4% 97.5%, 73.6% 97.5%, 97.5% 50%, 73.6% 2.5%, 26.4% 2.5%, 2.5% 50%, 0 50%); background: #fff; }
.pl-hex .pl-ico, .pl-hex img { position: relative; width: 56px; height: 56px; stroke-width: 1.2; object-fit: contain; }
.pl-why-item:hover .pl-hex { transform: rotateY(180deg); }
.pl-badge-ico { display: grid; place-items: center; width: 110px; height: 110px; border-radius: 50%; background: linear-gradient(135deg, #7C3AED, #F5094B); color: #fff; }
.pl-badge-ico .pl-ico { width: 50px; height: 50px; }

/* Class cards: red slanted bands; the white box slides up on hover and shows the text */
.pl-cc-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.pl-navy .pl-cc-row { transform: translateY(0); margin-bottom: -1px; }
.pl-cc-all { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
.pl .pl-cc { position: relative; display: block; aspect-ratio: 464 / 594; overflow: hidden; background: #111; color: var(--pl-ink); }
.pl-cc-pic, .pl-cc-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-cc-pic img { object-fit: cover; transition: transform 1.1s cubic-bezier(.2, 1, .3, 1); }
.pl-cc:hover .pl-cc-pic img { transform: scale(1.07); }
.pl-cc::before, .pl-cc::after { content: ""; position: absolute; z-index: 1; inset-inline-end: 0; bottom: 0; background: var(--pl-red); pointer-events: none; }
.pl-cc::before { width: 70%; height: 46%; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
.pl-cc::after { width: 92%; height: 62%; background: transparent; border: 0; background-image: linear-gradient(to top left, transparent calc(50% - 7px), var(--pl-red) calc(50% - 7px), var(--pl-red) calc(50% + 7px), transparent calc(50% + 7px)); }
.pl-cc:dir(rtl)::before { clip-path: polygon(0 0, 100% 100%, 0 100%); }
.pl-cc:dir(rtl)::after { background-image: linear-gradient(to top right, transparent calc(50% - 7px), var(--pl-red) calc(50% - 7px), var(--pl-red) calc(50% + 7px), transparent calc(50% + 7px)); }
.pl-cc-box { position: absolute; inset-inline: 9%; bottom: 7%; z-index: 2; display: grid; background: #fff; box-shadow: 0 18px 30px -18px rgb(0 0 0 / .5); }
.pl-cc-head { display: flex; align-items: center; gap: 14px; padding: 12px; }
.pl-cc-head i { display: grid; place-items: center; flex: none; width: 52px; height: 52px; background: var(--pl-navy); color: #fff; }
.pl-cc-head i .pl-ico { width: 26px; height: 26px; stroke-width: 1.4; }
.pl-cc-head b { font-family: var(--pl-font); font-size: clamp(1.15em, 1.5cqi, 1.5em); font-weight: 400; line-height: 1.3; }
.pl-cc-more { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .55s cubic-bezier(.2, 1, .3, 1); }
.pl-cc-more > span { display: grid; gap: 8px; overflow: hidden; padding-inline: 14px; }
.pl-cc-more small { padding-top: 2px; color: var(--pl-muted); font-size: .84em; line-height: 1.9; }
.pl-cc-more em { display: inline-flex; align-items: center; gap: 6px; padding-bottom: 14px; color: var(--pl-red); font-style: normal; font-weight: 700; font-size: .85em; }
.pl-cc-more em .pl-ico { width: 15px; height: 15px; }
.pl-cc:hover .pl-cc-more, .pl-cc:focus-visible .pl-cc-more { grid-template-rows: 1fr; }

/* Plans: rows (home), tables (pricing page) */
.pl-plan-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
.pl-plan-row { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.4fr); align-items: center; gap: 0 22px; padding: 26px; border: 1px solid var(--pl-line); background: #fff; }
.pl-plan-row.dark { background: var(--pl-navy); border-color: var(--pl-navy); color: #fff; }
.pl-plan-name { padding-inline-end: 18px; border-inline-end: 1px solid var(--pl-line); }
.pl-plan-row.dark .pl-plan-name { border-color: rgb(255 255 255 / .15); }
.pl-plan-name h3 { font-family: var(--pl-font); font-size: 1.45em; font-weight: 400; line-height: 1.3; }
.pl-plan-name small, .pl-plan-price s { color: var(--pl-muted); font-size: .82em; }
.pl-plan-row.dark .pl-plan-name small { color: rgb(255 255 255 / .7); }
.pl-plan-row ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; font-size: .88em; }
.pl-plan-row li { display: flex; align-items: center; gap: 8px; }
.pl-plan-row li .pl-ico { width: 16px; height: 16px; padding: 2px; border-radius: 50%; background: var(--pl-red); color: #fff; stroke-width: 3; }
.pl-plan-price { display: grid; margin-top: 18px; padding-top: 16px; padding-inline-end: 18px; border-top: 1px solid var(--pl-line); border-inline-end: 1px solid var(--pl-line); }
.pl-plan-row.dark .pl-plan-price { border-color: rgb(255 255 255 / .15); }
.pl-plan-price b { color: var(--pl-red); font-family: var(--pl-font); font-size: 1.4em; font-weight: 400; }
.pl-plan-price b small { font-size: .6em; color: inherit; }
.pl-plan-row .pl-act button, .pl-plan-row > .pl-act { justify-self: start; }
.pl-plan-row form { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--pl-line); }
.pl-plan-row.dark form { border-color: rgb(255 255 255 / .15); }
.pl-plan-row.dark .pl-btn.ghost-acc:not(:hover) { color: #fff !important; background: var(--pl-red); }
.pl-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; align-items: stretch; }
.pl-plan { position: relative; display: grid; justify-items: center; align-content: start; gap: 12px; padding: 34px 26px 40px; overflow: hidden; border: 1px solid #D9DCE3; border-radius: 12px; background: #fff; text-align: center; transition: transform .4s, box-shadow .4s; }
.pl-plan:hover { transform: translateY(-8px); box-shadow: 0 30px 50px -30px rgb(11 29 63 / .45); }
.pl-plan.hot { border: 0; background: linear-gradient(to bottom, var(--pl-red), var(--pl-navy)); color: #fff; }
.pl-plan-ghost { position: absolute; top: -18px; inset-inline-start: 50%; translate: -50% 0; font-family: var(--pl-font); font-size: 7em; line-height: 1; color: #E4E7EE; pointer-events: none; }
.pl-plan.hot .pl-plan-ghost { color: rgb(255 255 255 / .12); }
.pl-plan h3 { position: relative; font-family: var(--pl-font); font-size: 1.6em; font-weight: 400; }
.pl-plan-big { position: relative; font-family: var(--pl-font); font-size: 1.9em; font-weight: 400; }
.pl-plan-big small { font-size: .5em; }
.pl-plan ul { display: grid; gap: 12px; width: 100%; margin: 10px 0 18px; padding: 0; list-style: none; color: var(--pl-muted); font-size: .92em; }
.pl-plan.hot ul { color: rgb(255 255 255 / .9); }
.pl-plan li.off { opacity: .45; }

/* "Shape your body": text and the round photos with arcs */
.pl-shape { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: clamp(26px, 5cqi, 80px); }
.pl-shape-text { display: grid; gap: 18px; }
.pl-shape-text h2 { font-size: clamp(1.7em, 2.8cqi, 2.6em); }
.pl-feat { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 16px; align-items: start; }
.pl-feat-ico { position: relative; width: 52px; height: 52px; color: var(--pl-red); stroke-width: 1.2; filter: drop-shadow(8px 8px 0 #FBC4D3); }
.pl-feat h3 { font-family: var(--pl-font); font-size: 1.35em; font-weight: 400; }
.pl-feat p { color: var(--pl-muted); font-size: .92em; line-height: 2; }
.pl-rings { position: relative; width: min(560px, 100%); aspect-ratio: 1; justify-self: center; direction: ltr; }
.pl-arc { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pl-arc-out { animation: pl-swing 16s ease-in-out infinite alternate; transform-origin: 50% 50%; }
@keyframes pl-swing { from { transform: rotate(-90deg); } to { transform: rotate(90deg); } }
.pl-ring-big { position: absolute; inset: 13%; overflow: hidden; border-radius: 50%; background: var(--pl-soft); }
.pl-ring-big img, .pl-ring-small img { width: 100%; height: 100%; object-fit: cover; }
.pl-ring-small { position: absolute; top: 3%; left: 1%; width: 34%; aspect-ratio: 1; overflow: hidden; border: 6px solid #fff; border-radius: 50%; background: var(--pl-soft); box-shadow: 0 12px 30px -14px rgb(0 0 0 / .4); }

/* Timetable */
.pl-tt-sec { background-color: var(--pl-navy); background-image: linear-gradient(rgb(11 29 63 / .88), rgb(11 29 63 / .92)), var(--pl-tt, none); background-size: cover; background-position: center; background-attachment: fixed; }
.pl-tt { display: grid; gap: 26px; }
.pl-tt-filter { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.pl-chip { padding: 6px 16px; border: 1px solid var(--pl-red); border-radius: 99px; font-size: .86em; transition: background .2s, color .2s; }
.pl-chip[aria-current], .pl-chip:hover { background: var(--pl-red); color: #fff; }
.pl-tt-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border: 1px solid rgb(255 255 255 / .12); }
.pl-tt-day { display: grid; align-content: start; gap: 8px; min-height: 160px; padding: 0 8px 12px; border-inline-start: 1px solid rgb(255 255 255 / .12); }
.pl-tt-day:first-child { border-inline-start: 0; }
.pl-tt-day h3 { margin: 0 -8px 4px; padding: 12px 6px; background: rgb(255 255 255 / .06); border-bottom: 1px solid rgb(255 255 255 / .12); font-size: .9em; font-weight: 700; text-align: center; }
.pl-tt-off { color: rgb(255 255 255 / .35); text-align: center; }
.pl-tt-item { display: grid; gap: 1px; padding: 10px; border-inline-start: 3px solid var(--pl-red); background: rgb(255 255 255 / .07); font-size: .86em; transition: background .25s, transform .25s; }
.pl-tt-item:hover { background: var(--pl-red); transform: translateY(-3px); }
.pl-tt-item time { color: #FDA4B9; font-weight: 700; }
.pl-tt-item:hover time { color: #fff; }
.pl-tt-item small { opacity: .75; }
.pl-tt-item em { justify-self: start; margin-top: 4px; font-style: normal; font-size: .82em; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
.pl-tt-item.full { opacity: .55; }
.pl-tt-light .pl-tt-grid { border-color: var(--pl-line); }
.pl-tt-light .pl-tt-day { border-color: var(--pl-line); }
.pl-tt-light .pl-tt-day h3 { background: var(--pl-navy); color: #fff; border: 0; }
.pl-tt-light .pl-tt-off { color: #bbb; }
.pl-tt-light .pl-tt-item { background: var(--pl-soft); }
.pl-tt-light .pl-tt-item time { color: var(--pl-red); }
.pl-tt-light .pl-tt-item:hover { color: #fff; }
.pl-tt-light .pl-tt-item:hover time { color: #fff; }
.pl-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0 0 30px; padding: 0; list-style: none; }
.pl-steps li { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--pl-soft); font-weight: 500; }
.pl-steps i { display: grid; place-items: center; flex: none; width: 38px; height: 38px; background: var(--pl-red); color: #fff; font-style: normal; font-weight: 700; }

/* Trainers: the red box with a still photo beside it (it stays while the page scrolls), the list */
.pl-trn { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(26px, 5cqi, 80px); align-items: center; }
.pl-trn h2 { font-size: clamp(1.7em, 2.8cqi, 2.6em); }
.pl-trn .pl-muted { margin: 12px 0 26px; line-height: 2; }
.pl-care { display: grid; grid-template-columns: 1fr 1fr; align-items: center; }
.pl-care-box { position: relative; z-index: 1; display: grid; align-content: center; gap: 18px; min-height: 290px; padding: 30px; background: var(--pl-red); color: #fff; }
.pl-care-ico { width: 54px; height: 54px; stroke-width: 1.2; }
.pl-care-box b { font-family: var(--pl-font); font-size: clamp(1.3em, 1.9cqi, 1.8em); font-weight: 400; line-height: 1.4; }
.pl-care-pic { display: block; height: 210px; background: #222 center / cover no-repeat; background-attachment: fixed; }
.pl-trn-list { display: grid; margin: 0; padding: 0; list-style: none; }
.pl-trn-list a { display: flex; align-items: center; gap: 10px; padding: 22px 0; border-bottom: 1px solid var(--pl-line); font-family: var(--pl-font); font-size: 1.3em; transition: color .25s, padding .3s; }
.pl-trn-list i { color: var(--pl-red); font-style: normal; }
.pl-trn-list b { flex: 1; font-weight: 400; }
.pl-trn-list .pl-ico { width: 22px; height: 22px; transform: scaleX(-1); transition: transform .3s; }
.pl-trn-list a:hover { color: var(--pl-red); padding-inline-start: 10px; }
.pl-trn-list a:hover .pl-ico { transform: scaleX(-1) rotate(45deg); }

/* BMI: the photo stays still behind (a window over it as the page scrolls) */
.pl-bmi { position: relative; padding-block: clamp(50px, 7cqi, 110px); background: linear-gradient(to right, transparent calc(78vh - 280px), var(--pl-black) 78vh) left top / 100% 100vh no-repeat fixed, var(--pl-bmi, none) left top / auto 100vh no-repeat fixed, var(--pl-black); color: #fff; }
.pl-bmi::before { content: ""; position: absolute; inset: 0; background: rgb(5 7 12 / .15); }
.pl-bmi-in { position: relative; display: grid; justify-items: start; gap: 12px; }
.pl-bmi-in > * { max-width: 560px; }
.pl-bmi h2 { font-size: clamp(1.8em, 2.8cqi, 2.6em); }
.pl-bmi-in > p { color: rgb(255 255 255 / .85); line-height: 2; }
.pl-bmi-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; margin-top: 8px; padding: 26px; background: rgb(11 29 63 / .85); }
.pl-bmi-form label { display: grid; gap: 6px; font-weight: 700; font-size: .9em; }
.pl-bmi-form input { padding: 12px 14px; border: 1px solid rgb(255 255 255 / .45); background: transparent; color: #fff; font: inherit; }
.pl-bmi-form input::placeholder { color: rgb(255 255 255 / .55); }
.pl-bmi-form input:focus { outline: none; border-color: var(--pl-red); }
.pl-bmi-btns { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pl-bmi-out { grid-column: 1 / -1; padding: 12px 14px; border-inline-start: 3px solid var(--pl-red); background: rgb(255 255 255 / .08); line-height: 2; }
.pl-bmi-out b { color: #FDA4B9; }

/* Blog cards: the picture grows on hover */
.pl-pcards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
.pl-pcard { display: grid; gap: 8px; align-content: start; }
.pl-pcard-pic { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--pl-soft); }
.pl-pcard-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.pl-pcard:hover .pl-pcard-pic img, .pl-post-card:hover .pl-post-pic img, .pl-rel:hover img { transform: scale(1.1); }
.pl-rel img { transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.pl-pcard h3 { font-family: var(--pl-font); font-size: 1.3em; font-weight: 400; line-height: 1.5; }
.pl-pcard h3 a:hover { color: var(--pl-red); }
.pl-read { display: inline-flex; align-items: center; gap: 6px; color: var(--pl-red); font-size: .82em; font-weight: 700; }
.pl-read .pl-ico { width: 14px; height: 14px; }

/* Inner pages: the dark band with the title */
.pl-pagetop { display: grid; justify-items: center; align-content: center; gap: 10px; min-height: clamp(200px, 20cqi, 330px); padding: 30px 16px; background: var(--pl-black); color: #fff; text-align: center; }
.pl-pagetop h1 { font-size: clamp(2em, 3.6cqi, 3.2em); }
.pl-pagetop .pl-trail { color: rgb(255 255 255 / .8); }
.pl-pagetop .pl-trail b { color: #fff; }
.pl-pagetop .pl-trail a:hover { color: var(--pl-red); }
.pl-sep { transform: none; }
.pl-banner { display: none; }

/* About */
.pl-intro { display: grid; grid-template-columns: 220px minmax(0, 1fr) minmax(0, 1.1fr); align-items: center; gap: 0 clamp(20px, 4cqi, 60px); }
.pl-intro-box { position: relative; z-index: 1; display: grid; align-content: end; min-height: 300px; margin-inline-end: -90px; padding: 26px; background: var(--pl-red); color: #fff; }
.pl-intro-box h2 { font-size: 1.8em; line-height: 1.3; }
.pl-intro-pic { aspect-ratio: 4 / 3.4; }
.pl-intro-text { display: grid; justify-items: start; gap: 12px; }
.pl-intro-text h3 { font-family: var(--pl-font); font-size: 1.5em; font-weight: 400; color: var(--pl-red); }
.pl-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-block: 10px clamp(40px, 5cqi, 70px); text-align: center; }
.pl-stats > div { display: grid; justify-items: center; gap: 6px; border-inline-start: 1px solid var(--pl-line); }
.pl-stats > div:first-child { border: 0; }
.pl-stat-ico { width: 40px; height: 40px; color: var(--pl-red); stroke-width: 1.2; }
.pl-stats b { font-family: var(--pl-font); font-size: 2em; font-weight: 400; }
.pl-stats small { color: var(--pl-muted); }
.pl-stories { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: stretch; }
.pl-stories > div { display: grid; align-content: center; gap: 12px; }
.pl-stories h2 { font-size: clamp(1.7em, 2.6cqi, 2.4em); }
.pl-story { position: relative; display: grid; align-content: end; gap: 12px; min-height: 260px; margin: 0; padding: 24px; background: #333 center / cover; color: #fff; }
.pl-story::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(5 7 12 / .85), rgb(5 7 12 / .25)); }
.pl-story > * { position: relative; }
.pl-story blockquote { margin: 0; font-size: 1.05em; line-height: 1.9; }
.pl-story small { display: block; opacity: .75; }

/* Coaches: a red veil rises over the photo on hover with the links */
.pl-coaches { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px 22px; }
.pl-coach { display: grid; gap: 14px; margin: 0; text-align: center; }
.pl-coach-pic { position: relative; display: block; aspect-ratio: 441 / 463; overflow: hidden; background: var(--pl-soft); }
.pl-coach-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.pl-coach-veil { position: absolute; inset: 0; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 10px; padding: 20px; background: color-mix(in srgb, var(--pl-red) 78%, transparent); clip-path: inset(100% 0 0 0); transition: clip-path .55s cubic-bezier(.2, 1, .3, 1); }
.pl-coach:hover .pl-coach-veil, .pl-coach-veil:focus-within { clip-path: inset(0 0 0 0); }
.pl-coach:hover .pl-coach-pic img { transform: scale(1.06); }
.pl-coach-veil a { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid rgb(255 255 255 / .8); border-radius: 50%; color: #fff; transform: translateY(16px); opacity: 0; transition: transform .45s .15s, opacity .45s .15s, background .2s; }
.pl-coach:hover .pl-coach-veil a { transform: none; opacity: 1; }
.pl-coach-veil a:hover { background: #fff; color: var(--pl-red); }
.pl-coach-veil .p-ico { width: 18px; height: 18px; }
.pl .pl-coach-more { flex-basis: 100%; width: auto; height: auto; border: 0; border-radius: 0; font-weight: 700; font-size: .9em; text-decoration: underline; text-underline-offset: 5px; }
.pl .pl-coach-more:hover { background: none; color: #fff; }
.pl-coach figcaption { display: grid; gap: 2px; }
.pl-coach b { font-family: var(--pl-font); font-size: 1.35em; font-weight: 400; }
.pl-coach small { color: var(--pl-muted); }
.pl-coach-page { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(26px, 5cqi, 70px); align-items: start; }
.pl-coach-big { display: block; aspect-ratio: 441 / 463; overflow: hidden; }
.pl-coach-big img { width: 100%; height: 100%; object-fit: cover; }
.pl-coach-info { display: grid; justify-items: start; gap: 14px; }
.pl-coach-info h2 { font-size: 2.2em; }
.pl-coach-info > .pl-acc { font-weight: 700; }
.pl-coach-links a { border: 1px solid var(--pl-line); }
.pl-coach-classes { display: grid; gap: 8px; width: 100%; }
.pl-coach-classes h3 { font-family: var(--pl-font); font-size: 1.3em; font-weight: 400; }
.pl-mini-class { display: grid; gap: 2px; padding: 12px 16px; border-inline-start: 3px solid var(--pl-red); background: var(--pl-soft); }
.pl-mini-class small { color: var(--pl-muted); }

/* A class page */
.pl-class { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: clamp(26px, 4cqi, 56px); align-items: start; }
.pl-class-main { display: grid; gap: 16px; }
.pl-class-pic { display: block; aspect-ratio: 16 / 8.2; overflow: hidden; }
.pl-class-pic img { width: 100%; height: 100%; object-fit: cover; }
.pl-class-main h2 { font-size: 2em; }
.pl-why-need { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: center; }
.pl-why-need img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
.pl-why-need h3 { margin-bottom: 8px; font-family: var(--pl-font); font-size: 1.3em; font-weight: 400; }
.pl-why-need ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; color: var(--pl-muted); }
.pl-why-need li { display: flex; gap: 8px; align-items: center; }
.pl-why-need .pl-ico { width: 18px; height: 18px; color: var(--pl-red); stroke-width: 2.4; }
.pl-book { display: grid; gap: 12px; margin-top: 10px; padding: clamp(18px, 3cqi, 30px); border-top: 4px solid var(--pl-red); background: var(--pl-soft); scroll-margin-top: 20px; }
.pl-book > h3 { font-family: var(--pl-font); font-size: 1.6em; font-weight: 400; }
.pl-meetings { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.pl-meet { display: grid; gap: 0; padding: 10px 12px; border: 1px solid var(--pl-line); background: #fff; font-size: .86em; transition: border-color .2s, background .2s; }
.pl-meet:hover { border-color: var(--pl-red); }
.pl-meet[aria-current] { border-color: var(--pl-red); background: var(--pl-red); color: #fff; }
.pl-meet small { color: var(--pl-muted); }
.pl-meet[aria-current] small { color: #fff; }
.pl-meet.full { opacity: .5; pointer-events: none; }
.pl-book-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pl-book-form .full, .pl-chosen, .pl-book-form .pl-btn { grid-column: 1 / -1; }
.pl-book-form .pl-btn { justify-self: start; }
.pl-book-form label { display: grid; gap: 6px; font-size: .9em; font-weight: 600; }
.pl-book-form input, .pl-book-form textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--pl-line); background: #fff; color: inherit; font: inherit; }
.pl-book-form input:focus, .pl-book-form textarea:focus { outline: none; border-color: var(--pl-red); }
.pl-chosen b { color: var(--pl-red); }
.pl-class-side { display: grid; gap: 26px; position: sticky; top: 20px; }
.pl-info-box { display: grid; gap: 4px; padding: 24px; background: #E9ECF2; }
.pl-info-box h3, .pl-like h3 { margin-bottom: 8px; font-family: var(--pl-font); font-size: 1.35em; font-weight: 400; }
.pl-info-box p { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 0; border-bottom: 1px solid #D6DAE3; font-size: .9em; }
.pl-info-box .pl-ico { width: 17px; height: 17px; color: var(--pl-red); }
.pl-info-box .pl-act button, .pl-info-box .pl-btn { margin-top: 12px; }
.pl-like { display: grid; gap: 14px; }
.pl-like-item { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 14px; align-items: center; }
.pl-like-item > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 50%; background: var(--pl-soft); }
.pl-like-item img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pl-like-item > span:last-child { display: grid; font-size: .88em; }
.pl-like-item em { color: var(--pl-red); font-style: normal; }
.pl-like-item small { color: var(--pl-muted); }

/* Events */
.pl-events { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; }
.pl-event { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); border: 1px solid var(--pl-line); background: #fff; transition: box-shadow .3s; }
.pl-event:hover { box-shadow: 0 24px 40px -28px rgb(11 29 63 / .5); }
.pl-event-pic { position: relative; min-height: 220px; overflow: hidden; background: var(--pl-soft); }
.pl-event-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1s; }
.pl-event:hover .pl-event-pic img { transform: scale(1.08); }
.pl-event-pic time { position: absolute; top: 14px; inset-inline-start: 14px; display: grid; justify-items: center; min-width: 64px; padding: 8px; background: var(--pl-red); color: #fff; line-height: 1.3; }
.pl-event-pic time b { font-family: var(--pl-font); font-size: 1.7em; font-weight: 400; }
.pl-event > div { display: grid; align-content: center; justify-items: start; gap: 8px; padding: 22px; }
.pl-event h3 { font-family: var(--pl-font); font-size: 1.4em; font-weight: 400; line-height: 1.4; }
.pl-event-price { color: var(--pl-red); font-weight: 700; }

/* Offer band and footer */
.pl-offer { background: var(--pl-navy) linear-gradient(115deg, transparent 55%, rgb(255 255 255 / .04) 55% 75%, transparent 75%); color: #fff; }
.pl-offer-in { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; padding-block: clamp(34px, 4.5cqi, 60px); }
.pl-offer h2 { font-size: clamp(1.7em, 2.7cqi, 2.6em); }
.pl-offer p { color: rgb(255 255 255 / .9); }
.pl-foot { position: relative; overflow: hidden; border: 0; background: #F6F8FB; color: #555; }
.pl-foot::before { content: ""; position: absolute; inset: 0; background: url(${sampleImage("pl-post8")}) left center / cover no-repeat; opacity: .13; filter: saturate(.6); }
.pl-foot::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to left, #F6F8FB 30%, rgb(246 248 251 / .55)); }
.pl-foot > * { position: relative; z-index: 1; }
.pl-foot-cols { grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 30px; padding-top: clamp(40px, 5cqi, 70px); }
.pl-foot-cols h3 { font-family: var(--pl-font); font-size: 1.2em; font-weight: 400; color: var(--pl-navy); }
.pl-foot-cols a { color: #555; }
.pl-foot-cols a:hover { color: var(--pl-red); }
.pl-foot-brand { display: grid; justify-items: start; gap: 12px; }
.pl-foot-brand p { max-width: 24em; line-height: 2; }
.pl-foot-contact p, .pl-foot-contact a { display: flex; align-items: flex-start; gap: 10px; margin: 0; }
.pl-foot-contact .pl-ico { width: 18px; height: 18px; margin-top: 4px; color: var(--pl-red); }
.pl-foot-bottom { position: relative; display: flex; justify-content: center; border-color: #E2E6ED; }
.pl-top-btn { position: absolute; inset-inline-end: 0; top: 50%; translate: 0 -50%; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--pl-red); color: #fff; }
.pl-socials a { color: var(--pl-navy); }
.pl-socials a:hover { background: var(--pl-red); color: #fff; }

/* Shop pieces in the gym colours */
.pl-card-name { font-weight: 700; }
.pl-price b { color: var(--pl-red); font-weight: 700; }
.pl-badge { background: var(--pl-red); }
.pl-img img { mix-blend-mode: normal; }
.pl-card-pic { background: #E9EDF3; }

.pl .bk-cal-head { background: var(--pl-navy); color: #fff; }
.pl .bk-day.open::after { background: var(--pl-red); }

/* No scrollbar on rows that swipe */
.pl-slide-row, .pl-meetings { scrollbar-width: none; }
.pl-slide-row::-webkit-scrollbar { display: none; }

@container (max-width: 1100px) {
  .pl-topbar > span:first-child { display: none; }
  .pl-nav { gap: 18px; font-size: .9em; }
  .pl-cc-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pl-cc-all { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pl-plan-rows { grid-template-columns: 1fr; }
  .pl-coaches { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pl-intro { grid-template-columns: 180px minmax(0, 1fr); }
  .pl-intro-text { grid-column: 1 / -1; margin-top: 26px; }
  .pl-stories { grid-template-columns: 1fr 1fr; }
  .pl-stories > div { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .pl-head { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
  .pl-head-main { display: contents; }
  .pl-topbar, .pl-nav, .pl-join, .pl-icon-search, .pl-icon-user { display: none !important; }
  .pl-head-row { min-height: 70px; padding-inline: 0 16px; gap: 16px; background: none !important; backdrop-filter: none !important; }
  .pl-head.is-home .pl-head-logo { background: none; }
  .pl-head.is-home { background: rgb(5 7 12 / .35); }
  .pl-logo img { width: 44px; height: 44px; }
  .pl-logo b { font-size: 1.6em; }
  .pl-menu { display: block; }
  .pl-hero { min-height: 560px; }
  .pl-hero-pic { object-position: 20% center; }
  .pl-hero::after { background: linear-gradient(to top, rgb(5 7 12 / .85), rgb(5 7 12 / .35)); }
  .pl-hero-in { align-self: end; padding-bottom: 50px; }
  .pl-services { grid-template-columns: 1fr 1fr; }
  .pl-svc-title { grid-column: 1 / -1; }
  .pl-tile.t3 { grid-column: 1 / -1; grid-row: auto; min-height: 340px; }
  .pl-why-list { grid-template-columns: 1fr; gap: 34px; }
  .pl-why-item.up { margin-top: 0; }
  .pl-shape, .pl-trn, .pl-class, .pl-coach-page, .pl-events { grid-template-columns: 1fr; }
  .pl-rings { order: -1; width: min(420px, 100%); }
  .pl-plans { grid-template-columns: 1fr; max-width: 440px; margin-inline: auto; }
  .pl-tt-grid { grid-template-columns: 1fr; border: 0; gap: 16px; }
  .pl-tt-day { border: 1px solid rgb(255 255 255 / .12) !important; padding-bottom: 12px; min-height: 0; }
  .pl-tt-light .pl-tt-day { border-color: var(--pl-line) !important; }
  .pl-tt-day:has(.pl-tt-off) { display: none; }
  .pl-tt-day h3 { text-align: start; padding-inline: 14px; }
  .pl-tt-filter { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .pl-tt-filter::-webkit-scrollbar { display: none; }
  .pl-chip { flex: none; }
  .pl-steps { grid-template-columns: 1fr; }
  .pl-class-side { position: static; }
  .pl-pcards { grid-template-columns: 1fr 1fr; }
  .pl-stats { grid-template-columns: 1fr 1fr; gap: 26px 0; }
  .pl-stats > div:nth-child(3) { border: 0; }
  .pl-bmi { background-size: cover; background-position: center; }
  .pl-bmi::before { background: rgb(5 7 12 / .78); }
  .pl-care-pic, .pl-tt-sec, .pl-bmi { background-attachment: scroll; }
  .pl-foot-cols { grid-template-columns: 1fr 1fr; }
  .pl-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 600px) {
  .pl-cc-row, .pl-cc-all { grid-template-columns: 1fr; }
  .pl-cc { aspect-ratio: 464 / 520; }
  .pl-services { grid-template-columns: 1fr; }
  .pl-tile { min-height: 240px; }
  .pl-plan-row { grid-template-columns: 1fr; gap: 14px; }
  .pl-plan-name, .pl-plan-price { padding: 0; border: 0 !important; }
  .pl-plan-price { margin: 0; }
  .pl-plan-row form { margin-top: 0; }
  .pl-coaches { grid-template-columns: 1fr 1fr; gap: 20px 12px; }
  .pl-coach b { font-size: 1.1em; }
  .pl-intro { grid-template-columns: 1fr; }
  .pl-intro-box { min-height: 150px; margin: 0; }
  .pl-stories { grid-template-columns: 1fr; }
  .pl-pcards { grid-template-columns: 1fr; }
  .pl-why-need, .pl-book-form, .pl-bmi-form { grid-template-columns: 1fr; }
  .pl-event { grid-template-columns: 1fr; }
  .pl-care { grid-template-columns: 1fr; }
  .pl-care-box { min-height: 0; }
  .pl-meetings { grid-template-columns: 1fr 1fr; }
  .pl-foot-cols { grid-template-columns: 1fr; }
  .pl-top-btn { position: static; translate: none; }
  .pl-foot-bottom { flex-direction: column; align-items: center; }
  .pl-offer-in { justify-content: center; text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .pl-arc-out, .pl-play::before, .pl-hero h1 span, .pl-hero-in > *, .pl-hero-btns { animation: none !important; }
}
`;
