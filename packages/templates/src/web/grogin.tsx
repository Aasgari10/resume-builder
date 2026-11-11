/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Grogin": a grocery store (supermarket) in violet, white and light grey, rebuilt from the Grogin
// reference. Purple offer strip with a countdown, a three-row header (links, search, menu with
// category list and dropdowns), hero slider beside the category list, feature row, promo cards,
// new arrivals, featured products with a countdown, best sellers with tall promo cards, popular
// brands, newsletter and a five-column footer; shop page with a side column of filters, product
// page with tabs, blog list and posts, contact, cart, wishlist and checkout.
// Published pages run without scripts: dropdowns open on hover/focus, the slider and tabs use radios.

import type { ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, saleEnded, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, SORTS, SpecsTable, Stars, filterProducts, saleProducts, shopkitCss, timeLeft } from "./shopkit";
import { mapEmbed } from "./golsara";

/** Home page sections the user can switch off. */
export const GROGIN_BLOCKS = [
  { key: "strip", label: "نوار بنفش بالای صفحه (پیام و شمارش معکوس)" },
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "perks", label: "چهار ویژگی فروشگاه" },
  { key: "promos", label: "بنرهای تبلیغاتی" },
  { key: "new", label: "تازه‌ها" },
  { key: "featured", label: "محصولات ویژه با شمارش معکوس" },
  { key: "best", label: "پرفروش‌ها" },
  { key: "band", label: "نوار تبلیغ پهن" },
  { key: "brands", label: "برندهای محبوب" },
  { key: "newsletter", label: "خبرنامه" },
  { key: "app", label: "دکمه‌های دانلود اپلیکیشن" },
  { key: "payments", label: "آرم‌های روش پرداخت پایین صفحه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const GROGIN_OPTIONAL_PAGES = [{ path: "/blog", label: "صفحه‌ی بلاگ" }] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && !(data.site?.hiddenPages ?? []).includes("/blog");

export function groginPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const blog = hasBlog(data) ? ["/blog", ...livePosts(shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", "/shop", ...blog, ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...infoPages(shop)];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function GroginShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = groginPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "blog") body = id ? <Post {...view} id={id} /> : <Blog {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else
    body = (
      <div className="gg-wrap gg-inner">
        <Trail view={view} items={[{ label: page.startsWith("/support") ? "پشتیبانی" : page === "/faq" ? "سؤالات متداول" : "صفحه" }]} />
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className={`gg${page === "/" ? " gg-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className="gg-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      <BottomNav {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  cart: "M2.5 4h2.6l2.3 10.6h10.2l2.2-7.6H6.4 M9.2 19.6a1.3 1.3 0 1 0 0-.1 M17 19.6a1.3 1.3 0 1 0 0-.1",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16.2 16.2 20.5 20.5",
  heart: "M12 20s-7.8-4.7-7.8-10.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.8 2.5C19.8 15.3 12 20 12 20z",
  user: "M12 3.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4.6 20.6a7.4 7.4 0 0 1 14.8 0",
  pin: "M12 21s-6.5-5.6-6.5-10.6a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21z M12 7.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z",
  grid: "M4 4h6.5v6.5H4z M13.5 4H20v6.5h-6.5z M4 13.5h6.5V20H4z M13.5 13.5H20V20h-6.5z",
  down: "M6.5 9.5 12 15l5.5-5.5",
  left: "M14.5 6 8.5 12l6 6",
  right: "M9.5 6l6 6-6 6",
  arrow: "M19 12H5 M10 7l-5 5 5 5",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  home: "M4 11l8-7 8 7 M6 9.5V20h12V9.5 M10 20v-5h4v5",
  filter: "M4 6h16 M7 12h10 M10 18h4",
  phone: "M6.5 3.5h3.2l1.6 4.2-2.2 1.5a10 10 0 0 0 5.7 5.7l1.5-2.2 4.2 1.6v3.2a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  mail: "M3.5 6h17v12h-17z M3.5 7l8.5 6.2L20.5 7",
  card: "M3 6h18v12H3z M3 10h18 M6.5 14.5h4",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.9-7.5-9.5V6z M9 12l2 2 4-4",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  box: "M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8",
  badge: "M12 3l2.5 1.8 3-.2 1 2.9 2.5 1.8-1 2.9 1 2.9-2.5 1.8-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3 14.7l1-2.9-1-2.9 2.5-1.8 1-2.9 3 .2z M9 12l2 2 4-4",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4l3 2",
  share: "M12 15V3.5 M7.5 8 12 3.5 16.5 8 M5 12v8h14v-8",
  swap: "M7 7h12l-3-3 M17 17H5l3 3",
  leaf: "M5 19C5 10 11 5 20 5c0 9-5 15-14 14z M5 19l7-7",
  snow: "M12 3v18 M4.2 7.5l15.6 9 M4.2 16.5l15.6-9",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3.5v4 M16 3.5v4",
  chat: "M4 5h16v11H9l-5 4z",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  check: "M5 12.5l4.5 4.5L19 7.5",
  bag: "M5.5 8h13l-1 12h-11z M9 8V6.5a3 3 0 0 1 6 0V8",
  up: "M6 15l6-6 6 6",
  heartBig: "M12 21s-9.5-5.8-9.5-12.6A5.3 5.3 0 0 1 12 5.2a5.3 5.3 0 0 1 9.5 3.2C21.5 15.2 12 21 12 21z",
};

function Svg({ name, className = "gg-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const two = (n: number) => new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(n);
const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const day = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(d) : "";
};

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="gg-act">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={view.page} />
      {qty !== undefined && <input type="hidden" name="qty" value={qty} />}
      {size !== undefined && <input type="hidden" name="size" value={size} />}
      <button type="submit" className={className} aria-label={label} title={label}>
        {children}
      </button>
    </form>
  );
}

/** Section heading of the reference: bold title, a grey line beside it, "view all" on the other side. */
function Head({ view, title, text, titlePath, textPath, to, query }: { view: View; title?: string; text?: string; titlePath?: string; textPath?: string; to?: string; query?: Record<string, string> }) {
  return (
    <div className="gg-head-row">
      <div className="gg-head-text">
        <Opt value={title} editing={view.editing} edit={ed(titlePath ?? "", "text", "عنوان بخش")}>
          <h2 {...(titlePath ? ed(titlePath, "text", "عنوان بخش") : {})}>{title}</h2>
        </Opt>
        <Opt value={text} editing={view.editing} edit={ed(textPath ?? "", "text", "متن کنار عنوان")}>
          <p {...(textPath ? ed(textPath, "text", "متن کنار عنوان") : {})}>{text}</p>
        </Opt>
      </div>
      {to &&
        (query ? (
          <form method="get" action={view.link(to)}>
            {Object.entries(query).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button type="submit" className="gg-all">
              مشاهده‌ی همه <Svg name="arrow" />
            </button>
          </form>
        ) : (
          <PageLink to={to} link={view.link} className="gg-all">
            مشاهده‌ی همه <Svg name="arrow" />
          </PageLink>
        ))}
    </div>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className={`gg-price${now < p.price ? " sale" : ""}`}>
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

/** The small label under the picture («ارگانیک», «منجمد»…): blue for cold goods, green for the rest. */
function Chip({ text }: { text?: string }) {
  if (!text) return null;
  const cold = /منجمد|یخ|سرد|cold|frozen/i.test(text);
  return (
    <span className={`gg-chip${cold ? " cold" : ""}`}>
      <Svg name={cold ? "snow" : "leaf"} /> {text}
    </span>
  );
}

/** Days, hours and minutes left of a sale, in small boxes as in the reference. */
function Countdown({ end, note = "تا پایان تخفیف" }: { end: string; note?: string }) {
  const { d, h, m } = timeLeft(end);
  return (
    <div className="gg-count" title="زمان باقی‌مانده تا پایان تخفیف">
      <span>{two(d)}</span>
      <span>{two(h)}</span>
      <i>:</i>
      <span>{two(m)}</span>
      <small>{note}</small>
    </div>
  );
}

type CardMode = "home" | "shop" | "big";

function ProductCard({ view, p, mode = "home", bar }: { view: View; p: Product; mode?: CardMode; bar?: number }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  const rating = view.visitor.ratings?.[p.id];
  const add = !soldOut && (hasChoices(p) ? (
    <PageLink to={productPath(p)} link={view.link} className="gg-add">
      انتخاب گزینه‌ها <Svg name="plus" />
    </PageLink>
  ) : (
    <Act view={view} op="add" id={p.id} className="gg-add" label="افزودن به سبد خرید">
      افزودن به سبد <Svg name="plus" />
    </Act>
  ));
  return (
    <article className={`gg-card ${mode}`} data-product={p.id}>
      <div className="gg-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="gg-img">{img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}</span>
        </PageLink>
        {onSale(p) && !soldOut && <span className="gg-off">{fa(percentOff(p))}٪</span>}
        <Act view={view} op="wish" id={p.id} className={`gg-wish${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
          <Svg name="heart" />
        </Act>
        {!soldOut && !hasChoices(p) && mode !== "shop" && (
          <Act view={view} op="add" id={p.id} className="gg-quick" label="افزودن سریع به سبد">
            <Svg name="plus" />
          </Act>
        )}
        <Chip text={p.badge} />
      </div>
      <div className="gg-card-body">
        <PageLink to={productPath(p)} link={view.link} className="gg-card-name">
          <span>{p.name}</span>
        </PageLink>
        {rating ? <Stars value={rating.avg} count={rating.count} /> : <Stars value={5} />}
        <Price view={view} p={p} />
        {mode === "shop" ? (
          <div className="gg-stock-row">
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="gg-cartbtn">
                  <Svg name="cart" />
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="gg-cartbtn" label="افزودن به سبد خرید">
                  <Svg name="cart" />
                </Act>
              ))}
            <small className={soldOut ? "out" : undefined}>{soldOut ? "ناموجود" : "موجود در انبار"}</small>
          </div>
        ) : bar !== undefined ? (
          <div className="gg-run">
            <small>این محصول رو به اتمام است</small>
            <i style={{ ["--w" as string]: `${bar}%` }} />
            <small>
              فقط <b>{fa(p.stock ?? 0)}</b> عدد باقی مانده
            </small>
          </div>
        ) : (
          <>
            {soldOut ? <span className="gg-add off">ناموجود</span> : add}
            {mode === "big" && p.saleEndsAt && onSale(p) && !saleEnded(p) && <Countdown end={p.saleEndsAt} />}
          </>
        )}
      </div>
    </article>
  );
}

function Trail({ view, items }: { view: View; items: { label: string; to?: string }[] }) {
  return (
    <nav className="gg-trail" aria-label="مسیر صفحه">
      <PageLink to="/" link={view.link}>
        خانه
      </PageLink>
      {items.map((t, k) => (
        <span key={k}>
          <Svg name="left" />
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
  );
}

/** A picture the owner can change by clicking it in the editor. */
function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`gg-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/* ───────────── Header, footer, phone bar ───────────── */

/** The first sale that has not ended yet (for the countdown of the top strip). */
const soonestSale = (shop: Shop) => saleProducts(visible(shop)).find((p) => p.saleEndsAt && !saleEnded(p))?.saleEndsAt;

function Strip({ view }: { view: View }) {
  const { shop, editing } = view;
  const end = soonestSale(shop);
  const left = end ? timeLeft(end) : undefined;
  return (
    <div className="gg-strip">
      <div className="gg-wrap gg-strip-in">
        <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "پیام نوار بالا")}>
          <p {...ed("site.shop.promoText", "text", "پیام نوار بالا")}>{shop.promoText}</p>
        </Opt>
        <span className="gg-strip-pct" aria-hidden="true">
          ٪
        </span>
        {left && (
          <p className="gg-strip-time">
            تا پایان حراج:
            <b>{two(left.d)}</b> روز
            <b>{two(left.h)}</b> ساعت
            <b>{two(left.m)}</b> دقیقه
          </p>
        )}
      </div>
    </div>
  );
}

const isHere = (view: View, to: string) => (to === "/shop" ? view.page === "/shop" : to === "/blog" ? view.page.startsWith("/blog") : view.page === to);

/** The shop's categories that have products, with their own small icon (or a first letter). */
function catsOf(shop: Shop) {
  const products = visible(shop);
  return (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
}

function CatIcon({ c }: { c: Shop["categories"][number] }) {
  const src = safeUrl(c.image);
  return <span className="gg-cat-ico">{src ? <img src={src} alt="" /> : c.name.charAt(0)}</span>;
}

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className="gg-logo">
      {logo ? (
        <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} />
      ) : (
        <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>
      )}
    </PageLink>
  );
}

function Header(view: View) {
  const { ctx, link, visitor, shop, editing } = view;
  const data = ctx.data;
  const b = data.basics;
  const count = priceCart(shop, visitor.cart).count;
  const wishes = visitor.wishlist.filter((id) => visible(shop).some((p) => p.id === id)).length;
  const cats = catsOf(shop);
  const products = visible(shop);
  const trending = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 6);
  const low = products
    .filter((p) => p.stock !== undefined && p.stock > 0)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 6);
  const most = Math.max(1, ...low.map((p) => p.stock ?? 0));
  const about = (shop.pages ?? []).find((p) => p.slug === "about" && !p.hidden);
  const menu = [
    { to: "/", label: "خانه" },
    { to: "/shop", label: "فروشگاه", drop: true },
    ...cats.slice(0, 2).map((c) => ({ to: `/category/${c.id}`, label: c.name })),
    ...(hasBlog(data) ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
  return (
    <>
      {blockOn(data, "strip") && <Strip view={view} />}
      <div className="gg-links">
        <div className="gg-wrap gg-links-in">
          <nav>
            {about && (
              <PageLink to={`/page/${about.slug}`} link={link}>
                {about.title}
              </PageLink>
            )}
            <PageLink to="/account" link={link}>
              حساب من
            </PageLink>
            <PageLink to="/wishlist" link={link}>
              علاقه‌مندی‌ها
            </PageLink>
            <Opt value={data.site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت ارسال")}>
              <span className="gg-hours" {...ed("site.contactNote", "text", "ساعت ارسال")}>
                {data.site?.contactNote}
              </span>
            </Opt>
          </nav>
          <nav>
            <PageLink to="/support" link={link}>
              پشتیبانی
            </PageLink>
            <PageLink to="/account" link={link}>
              پیگیری سفارش
            </PageLink>
          </nav>
        </div>
      </div>
      <header className="gg-header">
        <div className="gg-wrap gg-header-in">
          {/* The phone menu opens without scripts: a details element whose summary turns into the close button. */}
          <details className="gg-burger">
            <summary aria-label="منو">
              <span />
            </summary>
            <nav className="gg-drawer">
              {menu.map((m) => (
                <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
                  {m.label}
                </PageLink>
              ))}
              <b>دسته‌بندی‌ها</b>
              {cats.map((c) => (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
                  <CatIcon c={c} /> {c.name}
                </PageLink>
              ))}
            </nav>
          </details>
          <Logo view={view} />
          <Opt value={b.location} editing={editing} edit={ed("basics.location", "text", "محدوده‌ی ارسال")}>
            <span className="gg-deliver">
              <Svg name="pin" />
              <span>
                <small>ارسال به</small>
                <b {...ed("basics.location", "text", "محدوده‌ی ارسال")}>{b.location}</b>
              </span>
            </span>
          </Opt>
          <form method="get" action={link("/search")} className="gg-search">
            <input name="q" placeholder="جستجوی محصول، دسته یا برند..." aria-label="جستجوی محصول" defaultValue={view.page === "/search" ? visitor.query.q : undefined} />
            <button type="submit" aria-label="جستجو">
              <Svg name="search" />
            </button>
          </form>
          <div className="gg-tools">
            <PageLink to="/account" link={link} className="gg-tool gg-account">
              <Svg name="user" />
              <span>
                <small>{visitor.customer ? "سلام" : "ورود"}</small>
                <b>{visitor.customer ? visitor.customer.name : "حساب کاربری"}</b>
              </span>
            </PageLink>
            <PageLink to="/wishlist" link={link} className="gg-tool gg-hide-sm">
              <span className="gg-tool-ico">
                <Svg name="heart" />
                <i>{fa(wishes)}</i>
              </span>
              <small>علاقه‌مندی</small>
            </PageLink>
            <PageLink to="/cart" link={link} className="gg-tool">
              <span className="gg-tool-ico">
                <Svg name="cart" />
                <i>{fa(count)}</i>
              </span>
              <small>سبد خرید</small>
            </PageLink>
          </div>
        </div>
      </header>
      <div className="gg-menu">
        <div className="gg-wrap gg-menu-in">
          <div className="gg-allcats" tabIndex={0}>
            <span className="gg-allcats-btn">
              <Svg name="grid" />
              همه‌ی دسته‌بندی‌ها
              <Svg name="down" className="gg-ico gg-caret" />
            </span>
            <nav className="gg-allcats-list">
              {cats.map((c) => (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
                  <CatIcon c={c} />
                  <span>{c.name}</span>
                  <Svg name="left" className="gg-ico gg-go" />
                </PageLink>
              ))}
            </nav>
          </div>
          <nav className="gg-nav">
            {menu.map((m) =>
              m.drop ? (
                <div key={m.to} className="gg-drop" tabIndex={-1}>
                  <PageLink to={m.to} link={link} current={view.page === "/shop" || view.page.startsWith("/category/")}>
                    {m.label} <Svg name="down" className="gg-ico gg-caret" />
                  </PageLink>
                  <div className="gg-drop-panel gg-mega">
                    {cats.map((c) => (
                      <div key={c.id}>
                        <PageLink to={`/category/${c.id}`} link={link} className="gg-mega-title">
                          {c.name}
                        </PageLink>
                        {products
                          .filter((p) => p.categoryId === c.id)
                          .slice(0, 4)
                          .map((p) => (
                            <PageLink key={p.id} to={productPath(p)} link={link}>
                              {p.name}
                            </PageLink>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
                  {m.label}
                </PageLink>
              ),
            )}
          </nav>
          <nav className="gg-nav gg-nav-end">
            {trending.length > 0 && (
              <div className="gg-drop gg-drop-end" tabIndex={-1}>
                <span className="gg-drop-btn" tabIndex={0}>
                  محصولات پرطرفدار <Svg name="down" className="gg-ico gg-caret" />
                </span>
                <div className="gg-drop-panel gg-drop-cards">
                  <div className="gg-head-row small">
                    <div className="gg-head-text">
                      <h2>محصولات پرطرفدار</h2>
                      <p>محبوب‌ترین‌های این هفته</p>
                    </div>
                  </div>
                  <div className="gg-row6">
                    {trending.map((p) => (
                      <ProductCard key={p.id} view={view} p={p} mode="home" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {low.length > 0 && (
              <div className="gg-drop gg-drop-end" tabIndex={-1}>
                <span className="gg-drop-btn gg-red" tabIndex={0}>
                  رو به اتمام <i className="gg-sale-tag">حراج</i> <Svg name="down" className="gg-ico gg-caret" />
                </span>
                <div className="gg-drop-panel gg-drop-cards">
                  <div className="gg-head-row small">
                    <div className="gg-head-text">
                      <h2>به‌زودی تمام می‌شوند</h2>
                      <p>تا موجودی هست این فرصت را از دست ندهید.</p>
                    </div>
                  </div>
                  <div className="gg-row6">
                    {low.map((p) => (
                      <ProductCard key={p.id} view={view} p={p} bar={Math.max(8, Math.round(((p.stock ?? 0) / most) * 100))} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const data = ctx.data;
  const b = data.basics;
  const site = data.site;
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  return (
    <footer className="gg-foot">
      {blockOn(data, "newsletter") && b.email && (
        <div className="gg-wrap gg-news">
          <div>
            <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>
              <h3 {...ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>{shop.newsletterTitle}</h3>
            </Opt>
            <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "multiline", "متن خبرنامه")}>
              <p {...ed("site.shop.newsletterText", "multiline", "متن خبرنامه")}>{shop.newsletterText}</p>
            </Opt>
          </div>
          <div>
            {/* No server mailbox yet: joining opens an email to the shop with the visitor's address. */}
            <form method="get" action={`mailto:${b.email}`} className="gg-news-form">
              <input type="hidden" name="subject" value="عضویت در خبرنامه" />
              <Svg name="mail" />
              <input name="body" type="email" required placeholder="ایمیل خود را وارد کنید" aria-label="ایمیل" dir="ltr" />
              <button type="submit">عضویت</button>
            </form>
            <small>با عضویت، قوانین و حریم خصوصی فروشگاه را می‌پذیرید.</small>
          </div>
        </div>
      )}
      <div className="gg-wrap gg-foot-cols">
        <div className="gg-foot-help">
          <h4>به کمک نیاز دارید؟</h4>
          <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن پایین صفحه")}>
            <p {...ed("site.aboutText", "multiline", "متن پایین صفحه")}>{site?.aboutText}</p>
          </Opt>
          <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
            <a className="gg-foot-contact" href={b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : "#"}>
              <Svg name="phone" />
              <span>
                <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
                  <small {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</small>
                </Opt>
                <b dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                  {b.phone}
                </b>
              </span>
            </a>
          </Opt>
          <Opt value={b.email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
            <a className="gg-foot-contact" href={b.email ? `mailto:${b.email}` : "#"}>
              <Svg name="mail" />
              <span>
                <small>سؤالی درباره‌ی سفارشتان دارید؟</small>
                <b dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                  {b.email}
                </b>
              </span>
            </a>
          </Opt>
        </div>
        <div>
          <h4>فروشگاه</h4>
          <PageLink to="/shop" link={link}>
            همه‌ی محصولات
          </PageLink>
          {catsOf(shop)
            .slice(0, 5)
            .map((c) => (
              <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
                {c.name}
              </PageLink>
            ))}
          {hasBlog(data) && (
            <PageLink to="/blog" link={link}>
              بلاگ
            </PageLink>
          )}
        </div>
        <div>
          <h4>به شما کمک می‌کنیم</h4>
          <PageLink to="/account" link={link}>
            حساب کاربری
          </PageLink>
          <PageLink to="/account" link={link}>
            سفارش‌های شما
          </PageLink>
          <PageLink to="/cart" link={link}>
            سبد خرید
          </PageLink>
          <PageLink to="/wishlist" link={link}>
            علاقه‌مندی‌ها
          </PageLink>
          <PageLink to="/support" link={link}>
            پشتیبانی و تیکت
          </PageLink>
          {(shop.faq ?? []).some((x) => x.q.trim() && x.a.trim()) && (
            <PageLink to="/faq" link={link}>
              سؤالات متداول
            </PageLink>
          )}
        </div>
        <div>
          <h4>درباره‌ی ما</h4>
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
          <PageLink to="/contact" link={link}>
            تماس با ما
          </PageLink>
        </div>
        <div className="gg-foot-app">
          {blockOn(data, "app") && (
            <>
              <h4>اپلیکیشن ما را نصب کنید</h4>
              <a href="#" className="gg-app">
                <img src={sampleImage("gg-gplay", "png")} alt="گوگل‌پلی" loading="lazy" />
                <small>دانلود از گوگل‌پلی، ۱۰٪ تخفیف</small>
              </a>
              <a href="#" className="gg-app">
                <img src={sampleImage("gg-appstore", "png")} alt="اپ‌استور" loading="lazy" />
                <small>دانلود از اپ‌استور، ۲۰٪ تخفیف</small>
              </a>
            </>
          )}
          <h5>ما را در شبکه‌های اجتماعی دنبال کنید:</h5>
          <Socials ctx={ctx} editing={editing} className="gg-socials" />
        </div>
      </div>
      <div className="gg-wrap gg-foot-end">
        <div>
          <span>
            © {fa(new Date().getFullYear())} {b.fullName}. همه‌ی حقوق محفوظ است.
          </span>
          {blockOn(data, "payments") && (shop.trustLogos ?? []).some((x) => safeUrl(x.image)) && (
            <span className="gg-pays">
              {shop.trustLogos!.filter((x) => safeUrl(x.image)).map((x) => {
                const href = safeUrl(x.link);
                const at = `${item("site.shop.trustLogos", x.id)}.image`;
                const img = <img src={safeUrl(x.image)} alt={x.title ?? ""} loading="lazy" {...ed(at, "image", "آرم")} />;
                return href ? (
                  <a key={x.id} href={href} {...outside(href)}>
                    {img}
                  </a>
                ) : (
                  <span key={x.id}>{img}</span>
                );
              })}
            </span>
          )}
        </div>
        <nav>
          {pages
            .filter((p) => p.slug !== "about")
            .map((p) => (
              <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
                {p.title}
              </PageLink>
            ))}
          <PageLink to="/account" link={link}>
            پیگیری سفارش
          </PageLink>
        </nav>
      </div>
      <a href="#" className="gg-top" aria-label="بالای صفحه">
        <Svg name="up" />
      </a>
    </footer>
  );
}

/** The phone tab bar of the reference (only on narrow screens). */
function BottomNav({ link, page, visitor, shop }: View) {
  const wishes = visitor.wishlist.length;
  const items: [string, string, string][] = [
    ["/", "home", "خانه"],
    ["/shop", "filter", "فیلتر"],
    ["/search", "search", "جستجو"],
    ["/wishlist", "heart", "علاقه‌مندی"],
    ["/account", "user", "حساب"],
  ];
  void shop;
  return (
    <nav className="gg-tabbar" aria-label="منوی پایین">
      {items.map(([to, icon, label]) => (
        <PageLink key={to} to={to} link={link} current={page === to}>
          <Svg name={icon} />
          {to === "/wishlist" && wishes > 0 && <b>{fa(wishes)}</b>}
          <span>{label}</span>
        </PageLink>
      ))}
    </nav>
  );
}

/* ───────────── Home ───────────── */

/** Home page slider. It works without scripts: hidden radio buttons pick the slide, the dots are their labels. */
function Hero({ view }: { view: View }) {
  const { shop, link, editing } = view;
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  const deal = saleProducts(visible(shop))[0];
  return (
    <section className={`gg-hero gg-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="gg-hero" id={`gg-hero-${k}`} className="gg-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {/* Checked until a dot is used: the slides then turn by themselves (paused under the pointer). */}
      {n > 1 && <input type="radio" name="gg-hero" className="gg-dot gg-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="gg-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className="gg-slide">
              <span className="gg-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
              </span>
              <div className="gg-slide-text">
                <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "برچسب بالای تیتر")}>
                  <span className="gg-kicker" {...ed("site.shop.heroKicker", "text", "برچسب بالای تیتر")}>
                    {shop.heroKicker}
                  </span>
                </Opt>
                <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                  <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                </Opt>
                <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "multiline", "متن اسلاید")}>
                  <p {...ed(at(s.id, "text"), "multiline", "متن اسلاید")}>{s.text}</p>
                </Opt>
                <div className="gg-slide-buy">
                  <PageLink to="/shop" link={link} className="gg-btn">
                    خرید کنید <Svg name="arrow" />
                  </PageLink>
                  {deal && (
                    <PageLink to={productPath(deal)} link={link} className="gg-slide-deal">
                      <Price view={view} p={deal} />
                      <small>این پیشنهاد محدود را از دست ندهید.</small>
                    </PageLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="gg-dots">
          {slides.map((s, k) => (
            <label key={s.id} htmlFor={`gg-hero-${k}`} title={`اسلاید ${fa(k + 1)}`} />
          ))}
        </div>
      )}
    </section>
  );
}

type BannerT = NonNullable<Shop["banners"]>[number];

/** A promo card: picture behind, a small kicker, a title, a line of text and a "shop now" button. */
function Promo({ view, b, className }: { view: View; b: BannerT; className?: string }) {
  const at = item("site.shop.banners", b.id);
  const href = safeUrl(b.link);
  const { editing } = view;
  const inner = (
    <>
      <Pic src={b.image} path={`${at}.image`} label="عکس بنر" className="gg-promo-pic" />
      <span className="gg-promo-text">
        <Opt value={b.kicker} editing={editing} edit={ed(`${at}.kicker`, "text", "خط کوچک بنر")}>
          <small {...ed(`${at}.kicker`, "text", "خط کوچک بنر")}>{b.kicker}</small>
        </Opt>
        <Opt value={b.title} editing={editing} edit={ed(`${at}.title`, "text", "عنوان بنر")}>
          <b {...ed(`${at}.title`, "text", "عنوان بنر")}>{b.title}</b>
        </Opt>
        <Opt value={b.text} editing={editing} edit={ed(`${at}.text`, "text", "متن بنر")}>
          <span {...ed(`${at}.text`, "text", "متن بنر")}>{b.text}</span>
        </Opt>
        <i className="gg-pill">
          خرید کنید <Svg name="arrow" />
        </i>
      </span>
    </>
  );
  return href ? (
    <a href={href} className={`gg-promo ${className ?? ""}`} {...outside(href)}>
      {inner}
    </a>
  ) : (
    <PageLink to="/shop" link={view.link} className={`gg-promo ${className ?? ""}`}>
      {inner}
    </PageLink>
  );
}

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = catsOf(shop);
  const banners = (shop.banners ?? []).filter((x) => !x.hidden);
  const three = banners.slice(0, 3);
  const four = banners.slice(3, 7);
  const pair = banners.slice(7, 9);
  const tall = banners.slice(9, 11);
  const newest = [...products].reverse().slice(0, 6);
  const featured = [...products.filter((p) => p.featured), ...saleProducts(products).filter((p) => !p.featured)].slice(0, 6);
  const best = products.filter((p) => !p.featured).slice(0, 8);
  const brands = (site?.clients ?? []).filter((c) => c.name.trim());
  const perks = (shop.perks ?? []).filter((x) => x.title.trim());
  return (
    <>
      <section className="gg-wrap gg-top-row">
        <nav className="gg-side-cats" aria-label="دسته‌بندی‌ها">
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
              <CatIcon c={c} />
              <span>{c.name}</span>
              <Svg name="left" className="gg-ico gg-go" />
            </PageLink>
          ))}
        </nav>
        {on("hero") && <Hero view={view} />}
      </section>

      {on("perks") && perks.length > 0 && (
        <section className="gg-wrap gg-perks">
          {perks.map((x) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id} className="gg-perk">
                <span>
                  <b {...ed(`${at}.title`, "text", "عنوان ویژگی")}>{x.title}</b>
                  <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح ویژگی")}>
                    <small {...ed(`${at}.text`, "text", "توضیح ویژگی")}>{x.text}</small>
                  </Opt>
                </span>
              </div>
            );
          })}
        </section>
      )}

      {on("promos") && three.length > 0 && (
        <section className="gg-wrap gg-promos three">
          {three.map((b) => (
            <Promo key={b.id} view={view} b={b} />
          ))}
        </section>
      )}

      {on("new") && newest.length > 0 && (
        <section className="gg-wrap gg-sec">
          <Head view={view} title={shop.newTitle} text={shop.newText} titlePath="site.shop.newTitle" textPath="site.shop.newText" to="/shop" />
          <div className="gg-row6 gg-boxed">
            {newest.map((p) => (
              <ProductCard key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}

      {on("promos") && four.length > 0 && (
        <section className="gg-wrap gg-promos four">
          {four.map((b) => (
            <Promo key={b.id} view={view} b={b} className="tall" />
          ))}
        </section>
      )}

      {on("featured") && featured.length > 0 && (
        <section className="gg-wrap gg-sec">
          <Head view={view} title={shop.showcaseTitle} text={shop.showcaseText} titlePath="site.shop.showcaseTitle" textPath="site.shop.showcaseText" to="/shop" query={{ sale: "1" }} />
          <div className="gg-row3 gg-boxed">
            {featured.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="big" />
            ))}
          </div>
        </section>
      )}

      {on("promos") && pair.length > 0 && (
        <section className="gg-wrap gg-promos two">
          {pair.map((b) => (
            <Promo key={b.id} view={view} b={b} className="wide" />
          ))}
        </section>
      )}

      {on("best") && best.length > 0 && (
        <section className="gg-wrap gg-sec">
          <Head view={view} title={shop.bestTitle} text={shop.bestText} titlePath="site.shop.bestTitle" textPath="site.shop.bestText" to="/shop" />
          <div className="gg-best gg-boxed">
            {best.slice(0, 2).map((p) => (
              <ProductCard key={p.id} view={view} p={p} />
            ))}
            {on("promos") && tall[0] && <Promo view={view} b={tall[0]} className="cell first" />}
            {best.slice(2, 6).map((p) => (
              <ProductCard key={p.id} view={view} p={p} />
            ))}
            {on("promos") && tall[1] && <Promo view={view} b={tall[1]} className="cell second" />}
            {best.slice(6, 8).map((p) => (
              <ProductCard key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}

      {on("band") && (shop.lookTitle || editing) && (
        <section className="gg-wrap">
          <PageLink to="/shop" link={link} className="gg-band">
            <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "متن نوار تبلیغ")}>
              <b {...ed("site.shop.lookTitle", "text", "متن نوار تبلیغ")}>{shop.lookTitle}</b>
            </Opt>
            <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "text", "خط زیر نوار تبلیغ")}>
              <small {...ed("site.shop.lookText", "text", "خط زیر نوار تبلیغ")}>{shop.lookText}</small>
            </Opt>
            <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس نوار تبلیغ" className="gg-band-pic" />
            <span className="gg-band-pct" aria-hidden="true">
              ٪۵۰
            </span>
          </PageLink>
        </section>
      )}

      {on("brands") && (brands.length > 0 || editing) && (
        <section className="gg-wrap gg-sec">
          <Head view={view} title={shop.discoverTitle} titlePath="site.shop.discoverTitle" text="برندهایی که بیشترین خرید را دارند" />
          <div className="gg-brands">
            {brands.map((c) => {
              const at = item("site.clients", c.id);
              return (
                <div key={c.id} className="gg-brand">
                  <div className="gg-brand-top">
                    <Pic src={c.image} path={`${at}.image`} label="آرم برند" className="gg-brand-pic" />
                    <span>
                      <b {...ed(`${at}.name`, "text", "نام برند")}>{c.name}</b>
                      <small>برند منتخب</small>
                      <Stars value={5} />
                    </span>
                  </div>
                  <Opt value={c.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح برند")}>
                    <p {...ed(`${at}.text`, "text", "توضیح برند")}>{c.text}</p>
                  </Opt>
                </div>
              );
            })}
            {editing && (
              <span className="gg-brand gg-add-brand" {...ed("site.clients", "newimage", "افزودن برند")}>
                + افزودن برند
              </span>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Shop page with filters ───────────── */

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

/** Price filter of the side column: two boxes, two handles on one line (plain range inputs) and a button. */
function PriceFilter({ view, here }: { view: View; here: string }) {
  const prices = visible(view.shop).map(unitPrice);
  if (!prices.length) return null;
  const step = 10000;
  const lo = Math.floor(Math.min(...prices) / step) * step;
  const hi = Math.max(lo + step, Math.ceil(Math.max(...prices) / step) * step);
  const q = view.visitor.query;
  const read = (v: string | undefined, d: number) => {
    const n = Number(String(v ?? "").replace(/[۰-۹]/g, (x) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).replace(/[^\d]/g, ""));
    return n ? Math.min(hi, Math.max(lo, n)) : d;
  };
  const min = read(q.min, lo);
  const max = read(q.max, hi);
  return (
    <form method="get" action={view.link(here)} className="gg-widget gg-price-filter">
      <h3>فیلتر قیمت</h3>
      <Keep query={q} skip={["min", "max"]} />
      <div className="gg-minmax">
        <label>
          <small>کمترین قیمت</small>
          <input name="min" inputMode="numeric" defaultValue={String(min)} aria-label="کمترین قیمت" />
        </label>
        <i>-</i>
        <label>
          <small>بیشترین قیمت</small>
          <input name="max" inputMode="numeric" defaultValue={String(max)} aria-label="بیشترین قیمت" />
        </label>
      </div>
      <div className="gg-range" aria-hidden="true">
        <input type="range" min={lo} max={hi} step={step} defaultValue={min} tabIndex={-1} disabled />
        <input type="range" min={lo} max={hi} step={step} defaultValue={max} tabIndex={-1} disabled />
      </div>
      <div className="gg-range-foot">
        <small>
          قیمت: {money(view, min)} — {money(view, max)}
        </small>
        <button type="submit">فیلتر</button>
      </div>
    </form>
  );
}

function Listing(view: View & { categoryId?: string }) {
  const { shop, link, visitor, editing } = view;
  const q = visitor.query;
  const { list, cats, cat, active } = filterProducts(visible(shop), shop.categories ?? [], q, view.categoryId);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  const sort = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  const chips: { label: string; drop: string[] }[] = [
    ...(q.q ? [{ label: `«${q.q}»`, drop: ["q"] }] : []),
    ...(q.min || q.max ? [{ label: "محدوده‌ی قیمت", drop: ["min", "max"] }] : []),
    ...(q.sale ? [{ label: "تخفیف‌دار", drop: ["sale"] }] : []),
    ...(q.stock ? [{ label: "موجود", drop: ["stock"] }] : []),
  ];
  const side = (
    <>
      <PriceFilter view={view} here={here} />
      <div className="gg-widget">
        <h3>دسته‌بندی محصولات</h3>
        <nav className="gg-checklist">
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
              <i className="gg-tick" />
              {c.name}
              <small>({fa(visible(shop).filter((p) => p.categoryId === c.id).length)})</small>
            </PageLink>
          ))}
        </nav>
      </div>
      <form method="get" action={link(here)} className="gg-widget gg-checks">
        <h3>وضعیت محصول</h3>
        <Keep query={q} skip={["sale", "stock"]} />
        <label>
          <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} /> موجود در انبار
        </label>
        <label>
          <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} /> تخفیف‌دار
        </label>
        <button type="submit" className="gg-btn small">
          اعمال
        </button>
      </form>
    </>
  );
  return (
    <section className="gg-wrap gg-inner">
      <Trail view={view} items={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : [{ label: "فروشگاه" }]} />
      <div className="gg-shop">
        <aside className="gg-shop-side">
          <details className="gg-filter-sm">
            <summary>
              <Svg name="filter" /> فیلتر محصولات
            </summary>
            {side}
          </details>
          <div className="gg-side-lg">{side}</div>
        </aside>
        <div>
          {(shop.discoverImage || editing) && (
            <div className="gg-shop-banner">
              <Pic src={shop.discoverImage} path="site.shop.discoverImage" label="عکس بنر فروشگاه" className="gg-shop-banner-pic" />
              <div>
                <span className="gg-kicker orange">فقط این هفته</span>
                <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "تیتر بنر فروشگاه")}>
                  <h2 {...ed("site.shop.promoTitle", "text", "تیتر بنر فروشگاه")}>{shop.promoTitle}</h2>
                </Opt>
                <Opt value={shop.discountTitle} editing={editing} edit={ed("site.shop.discountTitle", "text", "متن بنر فروشگاه")}>
                  <p {...ed("site.shop.discountTitle", "text", "متن بنر فروشگاه")}>{shop.discountTitle}</p>
                </Opt>
                <form method="get" action={link(here)}>
                  <input type="hidden" name="sale" value="1" />
                  <button type="submit" className="gg-pill">
                    خرید کنید <Svg name="arrow" />
                  </button>
                </form>
              </div>
            </div>
          )}
          {(chips.length > 0 || cat) && (
            <div className="gg-chips">
              {active && (
                <PageLink to={here} link={link}>
                  <Svg name="close" /> حذف فیلترها
                </PageLink>
              )}
              {cat && (
                <PageLink to="/shop" link={link}>
                  <Svg name="close" /> {cat.name}
                </PageLink>
              )}
              {chips.map((c) => (
                <form key={c.label} method="get" action={link(here)}>
                  <Keep query={q} skip={c.drop} />
                  <button type="submit">
                    <Svg name="close" /> {c.label}
                  </button>
                </form>
              ))}
            </div>
          )}
          <div className="gg-toolbar">
            <small>نمایش {fa(list.length)} محصول</small>
            <details className="gg-sort">
              <summary>
                مرتب‌سازی: <b>{sort[1]}</b> <Svg name="down" />
              </summary>
              <div>
                {SORTS.map(([k, label]) => (
                  <form key={k} method="get" action={link(here)}>
                    <Keep query={q} skip={["sort"]} />
                    <input type="hidden" name="sort" value={k} />
                    <button type="submit" aria-current={k === sort[0] || undefined}>
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </details>
          </div>
          {list.length ? (
            <div className="gg-row5 gg-boxed">
              {list.map((p) => (
                <ProductCard key={p.id} view={view} p={p} mode="shop" />
              ))}
            </div>
          ) : (
            <p className="gg-notice">{active ? "محصولی با این فیلترها پیدا نشد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Product ───────────── */

function ProductPage(view: View & { id: string }) {
  const { shop, link, visitor } = view;
  const p = visible(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = visible(shop)
    .filter((x) => x.id !== p.id && (!cat || x.categoryId === cat.id))
    .concat(visible(shop).filter((x) => x.id !== p.id && cat && x.categoryId !== cat.id))
    .slice(0, 6);
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const rating = visitor.ratings?.[p.id];
  const share = encodeURIComponent(p.name);
  const brand = p.specs?.find((s) => /برند|brand/i.test(s.label))?.value;
  return (
    <>
      <section className="gg-wrap gg-inner">
        <Trail view={view} items={[...(cat ? [{ label: cat.name, to: `/category/${cat.id}` }] : [{ label: "فروشگاه", to: "/shop" }]), { label: p.name }]} />
        <div className="gg-product" data-product={p.id}>
          {/* Gallery: the thumbnails pick the large picture; the large picture opens full screen. */}
          <div className="gg-gallery">
            <div className="gg-gallery-main">
              {(imgs.length ? imgs : [undefined]).map((src, k) =>
                src ? (
                  <ZoomOpen key={k} id={`${p.id}-${k}`} className="gg-gal">
                    <span>
                      <img src={src} alt={p.name} />
                    </span>
                  </ZoomOpen>
                ) : (
                  <span key={k} className="gg-gal" />
                ),
              )}
              {onSale(p) && !soldOut && <span className="gg-off">{fa(percentOff(p))}٪</span>}
              <Chip text={p.badge} />
            </div>
            {imgs.length > 1 && (
              <div className="gg-thumbs">
                {imgs.map((src, k) => (
                  <label key={k} className="gg-thumb">
                    <input type="radio" name="gg-gal" defaultChecked={k === 0} aria-label={`عکس ${fa(k + 1)}`} />
                    <img src={src} alt="" />
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="gg-pinfo">
            <h1>{p.name}</h1>
            <div className="gg-pmeta">
              {rating ? (
                <>
                  <Stars value={rating.avg} />
                  <b className="gg-score">{fa(Math.round(rating.avg * 10) / 10)}</b>
                  <small>{fa(rating.count)} نظر</small>
                </>
              ) : (
                <small>هنوز نظری ثبت نشده</small>
              )}
              {brand && (
                <small>
                  برند: <b>{brand}</b>
                </small>
              )}
              <small>
                کد کالا: <b dir="ltr">{p.id.toUpperCase()}</b>
              </small>
            </div>
            {p.description && <p className="gg-pdesc">{p.description.split(/\n/)[0]}</p>}
            <Price view={view} p={p} />
            {p.saleEndsAt && onSale(p) && !saleEnded(p) && <Countdown end={p.saleEndsAt} />}
            {soldOut ? (
              <p className="gg-notice">این محصول فعلاً ناموجود است.</p>
            ) : (
              <form method="post" action={link("/_cart")} className="gg-buy">
                <input type="hidden" name="op" value="add" />
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="back" value="/cart" />
                <OptionPicker p={p} />
                <div className="gg-buy-row">
                  <label className="gg-qty">
                    <span className="sr-only">تعداد</span>
                    <input type="number" name="qty" min={1} max={p.stock ?? 50} defaultValue={1} />
                  </label>
                  <button type="submit" className="gg-btn green">
                    <Svg name="bag" /> افزودن به سبد
                  </button>
                </div>
              </form>
            )}
            <div className="gg-ship-box">
              <Svg name="truck" />
              <b>ارسال سریع</b>
              <span>{p.stock !== undefined && p.stock > 0 ? `${fa(p.stock)} عدد در انبار؛ ` : ""}ارسال مطمئن به سراسر کشور</span>
            </div>
            <div className="gg-info-boxes">
              <p>
                <Svg name="card" />
                <span>
                  <b>پرداخت.</b> {shop.paymentNote || "پرداخت پس از ثبت سفارش، به روشی که فروشگاه اعلام می‌کند."}
                </span>
              </p>
              <p>
                <Svg name="shield" />
                <span>
                  <b>ضمانت.</b> کالای معیوب یا مغایر با توضیحات تا ۷ روز پس از تحویل پس گرفته می‌شود.
                </span>
              </p>
            </div>
            <div className="gg-plinks">
              <Act view={view} op="wish" id={p.id} className={`gg-plink${wished ? " on" : ""}`} label="علاقه‌مندی">
                <Svg name="heart" /> {wished ? "در علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
              </Act>
              <a className="gg-plink" href={`https://t.me/share/url?text=${share}`} target="_blank" rel="noopener noreferrer">
                <Svg name="share" /> اشتراک‌گذاری
              </a>
              <a className="gg-plink" href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
                <Icon name="whatsapp" className="gg-ico" />
              </a>
            </div>
          </div>
        </div>
        {/* Description and reviews tabs: two radios, no script. */}
        <div className="gg-tabs">
          <input type="radio" name="gg-tab" id="gg-tab-1" defaultChecked />
          <input type="radio" name="gg-tab" id="gg-tab-2" />
          <div className="gg-tab-heads">
            <label htmlFor="gg-tab-1">توضیحات</label>
            <label htmlFor="gg-tab-2">نظرات ({fa(rating?.count ?? 0)})</label>
          </div>
          <div className="gg-tab gg-tab-desc">
            {(p.description ?? "")
              .split(/\n\s*\n|\n/)
              .filter((x) => x.trim())
              .map((x, k) => (
                <p key={k}>{x}</p>
              ))}
            <SpecsTable p={p} className="gg-specs" />
          </div>
          <div className="gg-tab gg-tab-rev">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="gg-wrap gg-sec">
          <Head view={view} title="محصولات مرتبط" />
          <div className="gg-row6 gg-boxed">
            {related.map((x) => (
              <ProductCard key={x.id} view={view} p={x} mode="shop" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Blog ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];

const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 260 ? `${p.text.slice(0, 260).trim()}…` : p.text);

function PostMeta({ p }: { p: PostT }) {
  const parts = [day(p.date), p.author, p.category].filter(Boolean);
  return <small className="gg-post-meta">{parts.join(" · ")}</small>;
}

function BlogSide({ view, skip }: { view: View; skip?: string }) {
  const posts = livePosts(view.shop).filter((p) => p.id !== skip).slice(0, 4);
  return (
    <aside className="gg-blog-side">
      <div className="gg-widget">
        <h3>آخرین نوشته‌ها</h3>
        {posts.map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link} className="gg-mini-post">
            <span className="gg-mini-pic">{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <span>
              <b>{p.title}</b>
              <small>{day(p.date)}</small>
            </span>
          </PageLink>
        ))}
      </div>
      <div className="gg-widget">
        <h3>ما را دنبال کنید</h3>
        <Socials ctx={view.ctx} editing={view.editing} className="gg-social-big" />
      </div>
    </aside>
  );
}

function Blog(view: View) {
  const posts = livePosts(view.shop);
  return (
    <section className="gg-wrap gg-inner">
      <Trail view={view} items={[{ label: "بلاگ" }]} />
      <div className="gg-blog">
        <div className="gg-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="gg-post">
                <PageLink to={`/blog/${p.id}`} link={view.link} className="gg-post-pic">
                  <span {...ed(`${at}.image`, "image", "عکس نوشته")}>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
                  {p.category && <i className="gg-post-cat">{p.category}</i>}
                </PageLink>
                <PageLink to={`/blog/${p.id}`} link={view.link}>
                  <h2 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h2>
                </PageLink>
                <PostMeta p={p} />
                <p {...ed(p.excerpt ? `${at}.excerpt` : `${at}.text`, "multiline", p.excerpt ? "خلاصه‌ی نوشته" : "متن نوشته")}>{excerptOf(p)}</p>
                <PageLink to={`/blog/${p.id}`} link={view.link} className="gg-btn small">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
        </div>
        <BlogSide view={view} />
      </div>
    </section>
  );
}

function Post(view: View & { id: string }) {
  const p = livePosts(view.shop).find((x) => x.id === view.id)!;
  const at = item("site.shop.posts", p.id);
  return (
    <section className="gg-wrap gg-inner">
      <Trail view={view} items={[{ label: "بلاگ", to: "/blog" }, { label: p.title }]} />
      <div className="gg-blog">
        <article className="gg-post gg-post-full">
          <span className="gg-post-pic" {...ed(`${at}.image`, "image", "عکس نوشته")}>
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" />}
            {p.category && <i className="gg-post-cat">{p.category}</i>}
          </span>
          <h1 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h1>
          <PostMeta p={p} />
          <div className="gg-post-text" {...ed(`${at}.text`, "multiline", "متن نوشته")}>
            {p.text
              .split(/\n\s*\n|\n/)
              .filter((x) => x.trim())
              .map((x, k) => (
                <p key={k}>{x}</p>
              ))}
          </div>
          <PageLink to="/blog" link={view.link} className="gg-btn small ghost">
            <Svg name="right" /> بازگشت به بلاگ
          </PageLink>
        </article>
        <BlogSide view={view} skip={p.id} />
      </div>
    </section>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, shop, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const perks = (shop.perks ?? []).filter((x) => x.title.trim());
  return (
    <>
      <section className="gg-wrap gg-contact-top">
        <small>با ما در تماس باشید</small>
        <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>
          <h1 {...ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>{site?.contactTitle}</h1>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
          <p {...ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>{site?.contactText}</p>
        </Opt>
      </section>
      <section className="gg-wrap gg-offices">
        <div>
          <h2>نشانی فروشگاه</h2>
          <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "توضیح زیر نشانی")}>
            <p className="gg-muted" {...ed("site.styleText", "multiline", "توضیح زیر نشانی")}>
              {site?.styleText}
            </p>
          </Opt>
        </div>
        <div className="gg-office">
          <Svg name="pin" />
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <b {...ed("site.address", "text", "نشانی")}>{site?.address}</b>
          </Opt>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <small {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</small>
          </Opt>
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="gg-office-phone" dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className="gg-office-mail" dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
          <div className="gg-follow">
            <span>ما را دنبال کنید:</span>
            <Socials ctx={ctx} editing={editing} className="gg-social-sq" />
          </div>
        </div>
        <div className="gg-contact-form">
          <h2>پیام خود را بفرستید</h2>
          {b.email ? (
            // No server mailbox yet: sending opens an email to the shop.
            <form method="get" action={`mailto:${b.email}`}>
              <input name="subject" placeholder="نام شما" aria-label="نام شما" />
              <textarea name="body" required rows={5} placeholder="پیام شما" aria-label="پیام شما" />
              <button type="submit" className="gg-btn">
                ارسال پیام
              </button>
            </form>
          ) : (
            <p className="gg-muted">برای فعال شدن فرم، ایمیل فروشگاه را وارد کنید.</p>
          )}
        </div>
      </section>
      {embed ? (
        <section className="gg-wrap gg-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
          <a href={map} {...outside(map)} className="gg-btn small">
            مسیریابی
          </a>
        </section>
      ) : (
        <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
          <section className="gg-wrap">
            <a href={map ?? "#"} {...outside(map)} className="gg-btn ghost" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
              <Svg name="pin" /> مسیریابی روی نقشه
            </a>
          </section>
        </Opt>
      )}
      {perks.length > 0 && (
        <section className="gg-wrap gg-perks gg-perks-plain">
          {perks.map((x) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id} className="gg-perk">
                <span>
                  <b {...ed(`${at}.title`, "text", "عنوان ویژگی")}>{x.title}</b>
                  <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح ویژگی")}>
                    <small {...ed(`${at}.text`, "text", "توضیح ویژگی")}>{x.text}</small>
                  </Opt>
                </span>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

/* ───────────── Cart, wishlist, search ───────────── */

function PageHead({ title, view, trail }: { title: string; view: View; trail?: { label: string; to?: string }[] }) {
  return (
    <div className="gg-page-head">
      <Trail view={view} items={trail ?? [{ label: title }]} />
      <h1>{title}</h1>
    </div>
  );
}

function Empty({ view, text, heart }: { view: View; text: string; heart?: boolean }) {
  return (
    <div className="gg-empty">
      <Svg name={heart ? "heartBig" : "bag"} className="gg-empty-ico" />
      <p>{text}</p>
      <PageLink to="/shop" link={view.link} className="gg-btn dark">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="gg-wrap gg-inner">
      <PageHead view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <div className="gg-cart">
          <div className="gg-box gg-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="gg-line">
                <PageLink to={productPath(l.product)} link={link} className="gg-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="gg-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && (
                    <small>
                      {l.product.optionLabel || "انتخاب"}: {l.size}
                    </small>
                  )}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="gg-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    <Svg name="minus" />
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    <Svg name="plus" />
                  </Act>
                </div>
                <b className="gg-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="gg-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="gg-box gg-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <dl>
              <dt>جمع کالاها ({fa(cart.count)})</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="gg-minus">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="gg-btn wide">
              ادامه‌ی خرید
            </PageLink>
          </aside>
        </div>
      )}
    </section>
  );
}

function Wishlist(view: View) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <section className="gg-wrap gg-inner">
      {items.length === 0 ? (
        <Empty view={view} heart text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <>
          <PageHead view={view} title="علاقه‌مندی‌ها" />
          <div className="gg-row6 gg-boxed">
            {items.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Search(view: View) {
  const q = (view.visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const found = words.length ? visible(view.shop).filter((p) => words.every((w) => `${p.name} ${p.description ?? ""}`.includes(w))) : [];
  return (
    <section className="gg-wrap gg-inner">
      <PageHead view={view} title="جستجو" />
      <form method="get" action={view.link("/search")} className="gg-search gg-search-big">
        <input name="q" defaultValue={q} placeholder="نام محصول را بنویسید..." aria-label="جستجو" />
        <button type="submit" aria-label="جستجو">
          <Svg name="search" />
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="gg-row6 gg-boxed">
            {found.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        ) : (
          <p className="gg-notice">محصولی با «{q}» پیدا نشد.</p>
        ))}
    </section>
  );
}

/* ───────────── Checkout and confirmation ───────────── */

function Checkout(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <section className="gg-wrap gg-inner">
        <PageHead view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </section>
    );
  return (
    <section className="gg-wrap gg-inner">
      <PageHead view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <div className="gg-cart">
        <form method="post" action={link("/_order")} className="gg-box gg-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="gg-error">{error}</p>}
          {!me && (
            <p className="full gg-muted">
              قبلاً خرید کرده‌اید؟{" "}
              <PageLink to="/account" link={link}>
                وارد شوید
              </PageLink>{" "}
              تا سفارش در حسابتان ثبت شود.
            </p>
          )}
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
            <textarea name="note" maxLength={400} rows={2} />
          </label>
          {/* Left empty by people; filled only by spam robots. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="gg-trap" aria-hidden="true" />
          <button type="submit" className="gg-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="gg-box gg-sum">
          <h2>سفارش شما</h2>
          <ul className="gg-sum-lines">
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
                <dd className="gg-minus">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="gg-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
              {shop.paymentNote}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function Account(view: View) {
  return (
    <section className="gg-wrap gg-inner">
      <PageHead view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="gg-wrap gg-inner">
      <div className="gg-box gg-thanks">
        <span className="gg-done" aria-hidden="true">
          <Svg name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="gg-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="gg-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}

/* ───────────── Example content (from the Grogin reference, in Persian) ───────────── */

export function groginSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`gg-${n}`);
  const icon = (n: string) => sampleImage(`gg-${n}`, "svg");
  const soon = (days: number, hours = 5) => new Date(Date.now() + days * 86400000 + hours * 3600000).toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const products: Product[] = [
    { id: "g1", name: "موز تازه‌ی وارداتی، یک دسته", categoryId: "k1", price: 89000, salePrice: 74000, saleEndsAt: soon(1), stock: 34, badge: "ارگانیک", featured: true, images: [img("banana")], description: "موز تازه و رسیده، مناسب صبحانه و میان‌وعده. هر دسته حدود یک کیلوگرم.\nموزها هر روز صبح از بار تازه انتخاب و با بسته‌بندی مطمئن ارسال می‌شوند.", specs: [{ label: "وزن", value: "حدود ۱ کیلوگرم" }, { label: "کشور", value: "اکوادور" }] },
    { id: "g2", name: "چیپس کلاسیک سایز خانواده ۳۷۰ گرمی", categoryId: "k7", price: 99000, salePrice: 79000, saleEndsAt: soon(0, 4), stock: 63, featured: true, images: [img("chips")], description: "چیپس سیب‌زمینی با طعم کلاسیک و نمک ملایم، در بسته‌بندی خانواده.", specs: [{ label: "برند", value: "لیز" }, { label: "وزن", value: "۳۷۰ گرم" }] },
    { id: "g3", name: "پیتزا پپرونی منجمد مایکروویوی", categoryId: "k6", price: 245000, salePrice: 199000, saleEndsAt: soon(2), stock: 17, badge: "منجمد", featured: true, images: [img("pizza3")], description: "پیتزا پپرونی آماده که در سه دقیقه در مایکروویو آماده می‌شود.", specs: [{ label: "وزن", value: "۲۰۴ گرم" }] },
    { id: "g4", name: "آب سیب طبیعی ۱۰۰٪ دو لیتری", categoryId: "k5", price: 129000, salePrice: 65000, stock: 129, badge: "ارگانیک", images: [img("apple-juice")], description: "آب سیب طبیعی بدون شکر افزوده، از سیب‌های تازه‌ی درختی." },
    { id: "g5", name: "پیتزا سوپریم منجمد خمیر ضخیم", categoryId: "k6", price: 179000, salePrice: 159000, saleEndsAt: soon(3), stock: 94, badge: "منجمد", images: [img("pizza"), img("pizza2")], description: "پیتزا سوپریم با خمیر پف‌کرده، سبزیجات و گوشت. مناسب یک وعده‌ی سریع و خوشمزه.\nکافی است ۲۰ دقیقه در فر گرم بپزید.", specs: [{ label: "برند", value: "گریت ولیو" }, { label: "وزن", value: "۸۲۴ گرم" }, { label: "نگهداری", value: "فریزر، ۱۸- درجه" }] },
    { id: "g6", name: "آب پرتقال بدون تفاله ۱.۵ لیتری", categoryId: "k5", price: 98000, salePrice: 58000, stock: 63, images: [img("orange-juice")], description: "آب پرتقال طبیعی و خنک، بدون تفاله و بدون نگهدارنده." },
    { id: "g7", name: "پیتزا مارگاریتا منجمد", categoryId: "k6", price: 295000, salePrice: 235000, stock: 52, badge: "منجمد", images: [img("pizza2")], description: "پیتزا مارگاریتا با پنیر موتزارلا و سس گوجه‌فرنگی." },
    { id: "g8", name: "طالبی تازه‌ی برش‌خورده", categoryId: "k1", price: 125000, stock: 114, badge: "ارگانیک", images: [img("melon")], description: "طالبی شیرین و آبدار، برش‌خورده و آماده‌ی مصرف." },
    { id: "g9", name: "گوشت چرخ‌کرده‌ی گوساله ۵۰۰ گرمی", categoryId: "k2", price: 385000, salePrice: 349000, saleEndsAt: soon(2, 2), stock: 21, featured: true, images: [img("beef")], description: "گوشت چرخ‌کرده‌ی تازه با ۱۵٪ چربی، بسته‌بندی وکیوم." },
    { id: "g10", name: "دهان‌شویه‌ی ضد پوسیدگی بدون الکل", categoryId: "k10", price: 149000, salePrice: 119000, saleEndsAt: soon(2, 9), stock: 40, featured: true, images: [img("mouthwash")], description: "دهان‌شویه‌ی حاوی فلوراید برای پیشگیری از پوسیدگی دندان، بدون الکل." },
    { id: "g11", name: "ران بوقلمون دودی، هر کیلو", categoryId: "k2", price: 799000, salePrice: 639000, saleEndsAt: soon(1, 12), stock: 12, featured: true, images: [img("turkey")], description: "ران بوقلمون دودی کبابی، مناسب ساندویچ و پیش‌غذا." },
    { id: "g12", name: "دستمال توالت ۹ رول مگا", categoryId: "k9", price: 189000, salePrice: 149000, stock: 19, images: [img("tissue")], description: "دستمال توالت سه‌لایه‌ی نرم، هر رول معادل چهار رول معمولی." },
    { id: "g13", name: "کرم محافظ پای نوزاد ۱۱۰ گرمی", categoryId: "k11", price: 159000, salePrice: 129000, stock: 129, images: [img("cream")], description: "کرم محافظ و ضد سوختگی پای نوزاد با ترکیبات گیاهی." },
    { id: "g14", name: "نان باگت تازه، بسته‌ی ۲ عددی", categoryId: "k4", price: 49000, salePrice: 39000, stock: 45, images: [img("baguette")], description: "نان باگت تازه که هر روز صبح پخته می‌شود." },
    { id: "g15", name: "نان بیگل کنجدی ۶ عددی", categoryId: "k4", price: 89000, salePrice: 69000, stock: 30, images: [img("bagel")], description: "نان بیگل نرم با کنجد، مناسب صبحانه." },
    { id: "g16", name: "پنیر چدار نیم‌چرب ۹۰۰ گرمی", categoryId: "k3", price: 349000, stock: 26, images: [img("cheese")], description: "پنیر چدار با طعم متوسط، مناسب ساندویچ و پیتزا." },
    { id: "g17", name: "تخم‌مرغ محلی ۱۲ عددی", categoryId: "k3", price: 189000, salePrice: 159000, stock: 60, badge: "ارگانیک", images: [img("eggs")], description: "تخم‌مرغ محلی مرغ‌های آزاد، بسته‌ی دوازده عددی." },
    { id: "g18", name: "سیب‌زمینی زرد ۲ کیلویی", categoryId: "k1", price: 69000, stock: 80, badge: "ارگانیک", images: [img("potato")], description: "سیب‌زمینی زرد مناسب سرخ‌کردنی و آب‌پز." },
  ];
  const banner = (id: string, image: string, kicker: string, title: string, text: string) => ({ id, image: img(image), kicker, title, text });
  return {
    ...base,
    basics: { ...base.basics, fullName: "Grogin", jobTitle: "فروشگاه آنلاین مواد غذایی", avatarUrl: sampleImage("gg-logo", "png"), location: "همه‌ی شهرها", email: "info@example.com", phone: "021 0000 0000", summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "sl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "sl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      gallery: [],
      aboutText: "هر روز صبح کالاهای تازه را از بهترین تأمین‌کننده‌ها می‌گیریم و در کوتاه‌ترین زمان به دستتان می‌رسانیم.",
      address: "تهران، خیابان اصلی، پلاک ۱۲۳",
      contactNote: "هر روز از ساعت ۷ تا ۲۳ ارسال داریم",
      contactTitle: "سؤالی دارید؟ از ما بپرسید",
      contactText: "برای هر سؤال یا پیشنهادی با ما در تماس باشید؛ در کوتاه‌ترین زمان پاسخ می‌دهیم.",
      styleText: "فروشگاه حضوری ما هر روز باز است. می‌توانید سفارش اینترنتی‌تان را هم از همین‌جا تحویل بگیرید.",
      clients: [
        { id: "c1", name: "ماچیک", image: sampleImage("gg-brand", "png"), text: "محصولات باکیفیت را می‌توانید این‌جا پیدا کنید." },
        { id: "c2", name: "بلونه", image: sampleImage("gg-brand", "png"), text: "انواع کالاهای خواربار در این فروشگاه موجود است." },
        { id: "c3", name: "باکولا", image: sampleImage("gg-brand", "png"), text: "ما همیشه از تولیدکننده‌های محلی حمایت می‌کنیم." },
        { id: "c4", name: "مدی‌بازار", image: sampleImage("gg-brand", "png"), text: "وقتتان را صرفه‌جویی کنید؛ پولتان را هم." },
      ],
      shop: {
        promoText: "ارسال رایگان و ۴۰٪ تخفیف برای سه سفارش اول شما!",
        heroKicker: "تخفیف آخر هفته",
        slides: [
          { id: "s1", title: "بهترین کیفیت با کمترین قیمت", text: "تخفیف‌های ویژه‌ای برای خرید خواربار شما آماده کرده‌ایم. این فرصت‌ها را از دست ندهید...", image: img("s1") },
          { id: "s2", title: "خوراکی‌های خوشمزه برای دورهمی‌ها", text: "تنقلات، پنیر و نوشیدنی؛ همه‌ی آن‌چه برای یک دورهمی لازم دارید با تحویل سریع.", image: img("s2") },
        ],
        perks: [
          { id: "f1", title: "پرداخت آسان اینترنتی", text: "پرداخت امن با همه‌ی کارت‌های بانکی." },
          { id: "f2", title: "کالاهای تازه، هر روز", text: "هر روز صبح کالاها تازه می‌شوند." },
          { id: "f3", title: "تضمین کیفیت", text: "اگر راضی نبودید، پس می‌گیریم." },
          { id: "f4", title: "تحویل در یک ساعت", text: "سفارش‌های شهری در کمتر از یک ساعت." },
        ],
        banners: [
          banner("b1", "b1", "فقط این هفته", "تخم‌مرغ باکیفیت با قیمت مناسب", "هر روز یک تخم‌مرغ"),
          banner("b2", "b2", "فقط این هفته", "تنقلاتی که ذهن و بدن را تغذیه می‌کنند", "صبح را با انرژی شروع کنید..."),
          banner("b3", "b3", "فقط این هفته", "کیفیت بی‌رقیب، قیمت‌های بی‌رقیب", "فقط این هفته. از دستش ندهید..."),
          banner("b4", "b4", "فقط این هفته", "محصولات باکیفیتی که تجربه کرده‌اید", "بهترین‌ها برای خانواده‌تان"),
          banner("b5", "b5", "فقط این هفته", "خرید از ما یعنی کیفیت بهتر و قیمت بهتر", "فقط این هفته. از دستش ندهید..."),
          banner("b6", "b6", "فقط این هفته", "بهترین محصولات با کمترین قیمت", "فروشگاهی متفاوت برای خواربار"),
          banner("b7", "b7", "فقط این هفته", "همه‌ی برندهای محبوب زیر یک سقف", "فقط این هفته. از دستش ندهید..."),
          { ...banner("b8", "b8", "فقط این هفته", "خرید خواربار را برایتان آسان می‌کنیم", "فقط این هفته. از دستش ندهید..."), wide: true },
          { ...banner("b9", "b9", "فقط این هفته", "نیازهای روزانه‌تان را از ما بخواهید", "فروشگاهی متفاوت برای خواربار"), wide: true },
          banner("b10", "b10", "فقط این هفته", "همیشه کنار شما هستیم تا خرید راحت‌تری داشته باشید", "فروشگاهی متفاوت برای خواربار"),
          banner("b11", "b11", "فقط این هفته", "با غذاهای محبوبتان، حالتان را خوب می‌کنیم", "فقط این هفته. از دستش ندهید..."),
        ],
        newTitle: "تازه‌ها",
        newText: "این فرصت را برای تخفیف ویژه‌ی این هفته از دست ندهید.",
        showcaseTitle: "محصولات ویژه",
        showcaseText: "پیشنهادهای این ماه را تا تمام نشده‌اند از دست ندهید.",
        bestTitle: "پرفروش‌ها",
        bestText: "تازه‌ترین محصولاتی که این هفته رسیده‌اند",
        lookTitle: "سلامت و ایمنی شما در خرید حضوری و آنلاین، اولویت ماست",
        lookText: "تنها سوپرمارکتی که هم سالم نگهتان می‌دارد، هم در هزینه صرفه‌جویی می‌کند و هم زندگی بهتری می‌سازد.",
        lookImage: sampleImage("gg-promo", "png"),
        discoverTitle: "برندهای محبوب",
        discoverImage: img("s2"),
        promoTitle: "فروشگاه خواربار با کالاهای متنوع",
        discountTitle: "تخفیف‌های ویژه‌ای برای خرید خواربار شما آماده کرده‌ایم.",
        newsletterTitle: "عضو خبرنامه شوید و ۱۰٪ تخفیف بگیرید",
        newsletterText: "همین حالا عضو شوید تا از جدیدترین تخفیف‌ها و کدهای هدیه باخبر شوید. نگران نباشید، هرزنامه نمی‌فرستیم!",
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "q1", q: "سفارش من چقدر طول می‌کشد تا برسد؟", a: "سفارش‌های داخل شهر در کمتر از یک ساعت و سفارش‌های شهرهای دیگر حداکثر در دو روز کاری می‌رسد." },
          { id: "q2", q: "هزینه‌ی ارسال چقدر است؟", a: "هزینه‌ی ارسال در سبد خرید نمایش داده می‌شود و برای خریدهای بالای یک میلیون تومان رایگان است." },
          { id: "q3", q: "اگر کالا خراب یا تاریخ‌گذشته باشد چه کنم؟", a: "از بخش «حساب من» برای همان سفارش تیکت بفرستید؛ کالا را عوض می‌کنیم یا مبلغ را برمی‌گردانیم." },
        ],
        pages: [
          { id: "pg1", slug: "about", title: "درباره‌ی ما", text: "گروگین یک سوپرمارکت آنلاین است که کالاهای تازه و باکیفیت را با قیمت منصفانه به در خانه‌ی شما می‌رساند.\n\nهر روز صبح کالاها از بهترین تأمین‌کننده‌ها گرفته می‌شود و تیم ما برای هر سؤالی کنار شماست." },
          { id: "pg2", slug: "terms", title: "قوانین و مقررات", text: "ثبت سفارش در این فروشگاه به معنی پذیرش این قوانین است.\n\nقیمت‌ها به تومان است و در لحظه‌ی ثبت سفارش ثابت می‌شود. کالای معیوب یا تاریخ‌گذشته تا ۷ روز پس از تحویل پس گرفته می‌شود." },
          { id: "pg3", slug: "privacy", title: "حریم خصوصی", text: "اطلاعاتی که هنگام خرید وارد می‌کنید فقط برای ارسال سفارش و پشتیبانی استفاده می‌شود و در اختیار دیگران قرار نمی‌گیرد." },
        ],
        posts: [
          { id: "n1", title: "فروشگاه‌های مواد غذایی چطور با بازار ارسال آنلاین کنار می‌آیند", image: img("post1"), date: ago(3), author: "تیم گروگین", category: "اخبار", text: "خرید اینترنتی مواد غذایی در چند سال اخیر چند برابر شده است و فروشگاه‌ها برای ماندن در بازار باید ارسال سریع و مطمئن داشته باشند.\n\nدر این نوشته نگاهی می‌اندازیم به روش‌هایی که فروشگاه‌های موفق برای نگه‌داری کالای تازه، بسته‌بندی و ارسال در کمتر از یک ساعت استفاده می‌کنند.\n\nمهم‌ترین نکته، برنامه‌ریزی انبار و پیش‌بینی سفارش‌هاست؛ کالاهایی که زودتر تمام می‌شوند باید همیشه در دسترس باشند." },
          { id: "n2", title: "خرید آخر هفته: نوشیدنی‌های خنک برای روزهای گرم", image: img("post2"), date: ago(9), author: "تیم گروگین", category: "پیشنهاد خرید", text: "روزهای گرم تابستان بهترین زمان برای نوشیدنی‌های خنک و میوه‌های آبدار است.\n\nدر این فهرست، پرفروش‌ترین نوشیدنی‌ها و میوه‌های فصل را با تخفیف ویژه‌ی آخر هفته معرفی کرده‌ایم." },
          { id: "n3", title: "انتخاب پنیر مناسب برای سفره‌ی صبحانه و پیتزا", image: img("post3"), date: ago(16), author: "تیم گروگین", category: "آشپزی", text: "هر پنیری برای هر غذایی مناسب نیست. پنیرهای نرم برای صبحانه و پنیرهای کش‌دار برای پیتزا بهترند.\n\nدر این راهنما انواع پنیر موجود در فروشگاه و بهترین کاربرد هرکدام را می‌خوانید." },
        ],
        categories: [
          { id: "k1", name: "میوه و سبزیجات", image: icon("fruit") },
          { id: "k2", name: "گوشت و مرغ و ماهی", image: icon("meat") },
          { id: "k3", name: "صبحانه و لبنیات", image: icon("egg") },
          { id: "k4", name: "نان و شیرینی", image: icon("bread") },
          { id: "k5", name: "نوشیدنی‌ها", image: icon("drink") },
          { id: "k6", name: "غذاهای منجمد", image: icon("frozen") },
          { id: "k7", name: "تنقلات و بیسکویت", image: icon("snack") },
          { id: "k8", name: "خواربار", image: icon("grocery") },
          { id: "k9", name: "شوینده و بهداشتی", image: icon("household") },
          { id: "k10", name: "سلامت و مراقبت", image: icon("health") },
          { id: "k11", name: "کودک و نوزاد", image: icon("baby") },
        ],
        products,
        shippingFee: 45000,
        freeShippingFrom: 1000000,
        coupons: [
          { id: "d1", code: "GROGIN10", percent: 10, maxDiscount: 200000, active: true },
          { id: "d2", code: "FRESH", percent: 15, maxDiscount: 100000, usageLimit: 50, endsAt: "2027-03-20T20:30:00.000Z", categoryIds: ["k1"], active: true },
        ],
        paymentNote: "پس از ثبت سفارش، برای هماهنگی پرداخت (کارت به کارت یا پرداخت در محل) با شما تماس می‌گیریم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
        trustLogos: [1, 2, 3, 4, 5].map((n) => ({ id: `t${n}`, image: icon(`pay${n}`) })),
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.gg {
  --gg-violet: var(--color-primary);
  --gg-deep: color-mix(in srgb, var(--color-primary) 55%, #120A26);
  --gg-ink: #030712;
  --gg-muted: #6B7280;
  --gg-line: #E5E7EB;
  --gg-soft: #F3F4F6;
  --gg-red: #DC2626;
  --gg-green: #16A34A;
  --gg-orange: #EA580C;
  --sk-accent: var(--gg-violet);
  --sk-card: #fff;
  --sk-line: var(--gg-line);
  --sk-soft: var(--gg-soft);
  --sk-muted: var(--gg-muted);
  --sk-radius: 6px;
  --sk-card-radius: 8px;
  background: var(--color-bg);
  color: var(--gg-ink);
  font-size: 14px;
}
.gg a { color: inherit; text-decoration: none; }
.gg button { font: inherit; color: inherit; cursor: pointer; }
.gg h1, .gg h2, .gg h3, .gg h4 { margin: 0; }
.gg p { margin: 0; }
.gg-ico { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.gg-wrap { box-sizing: border-box; width: 100%; max-width: 1240px; margin-inline: auto; padding-inline: 20px; }
.gg-act { display: contents; }
.gg-muted { color: var(--gg-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Buttons */
.gg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 22px; height: 42px; border: none; border-radius: 6px; background: var(--gg-violet); color: #fff !important; font-weight: 600; font-size: 14px; transition: background .2s; }
.gg-btn:hover { background: var(--gg-deep); }
.gg-btn .gg-ico { width: 18px; height: 18px; }
.gg-btn.small { height: 36px; padding: 0 16px; font-size: 13px; }
.gg-btn.green { background: var(--gg-green); }
.gg-btn.green:hover { background: #15803D; }
.gg-btn.dark { background: var(--gg-ink); }
.gg-btn.ghost { background: #fff; color: var(--gg-ink) !important; border: 1px solid var(--gg-line); }
.gg-btn.wide, .gg-btn.full { width: 100%; }
.gg-pill { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px; border: none; border-radius: 999px; background: #fff; color: var(--gg-ink); font-size: 12px; font-weight: 600; font-style: normal; box-shadow: 0 1px 2px rgb(0 0 0 / .06); }
.gg-pill .gg-ico { width: 15px; height: 15px; }
.gg-kicker { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #DCFCE7; color: #166534; font-size: 13px; font-weight: 500; }
.gg-kicker.orange { background: #FFEDD5; color: #9A3412; }

/* Top strip */
.gg-strip { background: var(--gg-violet); color: #fff; overflow: hidden; }
.gg-strip-in { position: relative; display: flex; align-items: center; justify-content: center; gap: 40px; min-height: 40px; font-size: 13px; font-weight: 600; }
.gg-strip-pct { font-size: 48px; font-weight: 800; line-height: 1; color: rgb(255 255 255 / .22); margin-block: -6px; }
.gg-strip-time { display: flex; align-items: baseline; gap: 4px; font-weight: 400; font-size: 12px; }
.gg-strip-time b { margin-inline-start: 6px; font-size: 18px; font-weight: 700; }

/* Links row */
.gg-links { border-bottom: 1px solid var(--gg-line); font-size: 12px; color: #4B5563; }
.gg-links-in { display: flex; justify-content: space-between; align-items: center; min-height: 40px; gap: 16px; }
.gg-links nav { display: flex; align-items: center; gap: 16px; }
.gg-links a:hover { color: var(--gg-violet); }
.gg-hours { padding-inline-start: 16px; border-inline-start: 1px solid var(--gg-line); }

/* Header */
.gg-header-in { display: flex; align-items: center; gap: 24px; min-height: 90px; }
.gg-logo { flex: none; display: flex; align-items: center; }
.gg-logo img { display: block; height: 40px; width: auto; }
.gg-logo b { font-size: 30px; font-weight: 800; color: var(--gg-violet); }
.gg-deliver { display: flex; align-items: center; gap: 8px; flex: none; }
.gg-deliver > .gg-ico { width: 38px; height: 38px; padding: 9px; box-sizing: border-box; border: 1px solid var(--gg-line); border-radius: 50%; }
.gg-deliver span { display: grid; line-height: 1.3; }
.gg-deliver small { color: var(--gg-muted); font-size: 11px; }
.gg-deliver b { font-size: 13px; font-weight: 600; }
.gg-search { flex: 1; display: flex; align-items: center; height: 48px; border-radius: 8px; background: var(--gg-soft); overflow: hidden; }
.gg-search input { flex: 1; min-width: 0; height: 100%; padding: 0 18px; border: none; background: none; font: inherit; font-size: 14px; outline: none; }
.gg-search button { display: grid; place-items: center; width: 52px; height: 100%; border: none; background: none; }
.gg-search button .gg-ico { width: 22px; height: 22px; }
.gg-tools { display: flex; align-items: center; gap: 18px; flex: none; }
.gg-tool { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; }
.gg-tool > .gg-ico, .gg-tool-ico .gg-ico { width: 26px; height: 26px; }
.gg-tool-ico { position: relative; display: block; }
.gg-tool-ico i { position: absolute; top: -5px; inset-inline-end: -7px; min-width: 17px; height: 17px; padding: 0 3px; box-sizing: border-box; border-radius: 9px; background: var(--gg-red); color: #fff; font-size: 10px; font-style: normal; font-weight: 700; line-height: 17px; text-align: center; border: 2px solid #fff; }
.gg-account { flex-direction: row; gap: 8px; }
.gg-account span { display: grid; line-height: 1.3; }
.gg-account small { color: var(--gg-muted); font-size: 11px; }
.gg-account b { font-size: 12px; font-weight: 600; }
.gg-tool:hover { color: var(--gg-violet); }

/* Menu row */
.gg-menu { border-bottom: 1px solid var(--gg-line); }
.gg-menu-in { display: flex; align-items: stretch; gap: 30px; min-height: 54px; }
.gg-allcats { position: relative; flex: none; width: 290px; z-index: 30; outline: none; }
.gg-allcats-btn { display: flex; align-items: center; gap: 10px; height: 100%; padding: 0 16px; box-sizing: border-box; border: 1px solid var(--gg-line); border-bottom: none; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px; cursor: pointer; }
.gg-allcats-btn .gg-caret { margin-inline-start: auto; }
.gg-caret { width: 14px; height: 14px; }
.gg-allcats-list { position: absolute; top: 100%; inset-inline: 0; display: none; background: #fff; border: 1px solid var(--gg-line); border-radius: 0 0 8px 8px; box-shadow: 0 16px 30px -18px rgb(0 0 0 / .25); }
.gg-allcats:hover .gg-allcats-list, .gg-allcats:focus-within .gg-allcats-list { display: block; }
.gg-allcats-list a, .gg-side-cats a { display: flex; align-items: center; gap: 12px; height: 45px; padding: 0 16px; border-top: 1px solid var(--gg-line); font-size: 13px; }
.gg-allcats-list a:first-child { border-top: none; }
.gg-allcats-list a:hover, .gg-side-cats a:hover { color: var(--gg-violet); }
.gg-go { width: 14px; height: 14px; margin-inline-start: auto; color: var(--gg-muted); }
.gg-cat-ico { display: grid; place-items: center; width: 22px; height: 22px; flex: none; font-weight: 700; color: var(--gg-violet); }
.gg-cat-ico img { width: 20px; height: 20px; object-fit: contain; }
.gg-nav { display: flex; align-items: stretch; gap: 22px; font-size: 14px; font-weight: 600; }
.gg-nav > a, .gg-drop > a, .gg-drop-btn { display: flex; align-items: center; gap: 4px; position: relative; cursor: pointer; }
.gg-nav > a:hover, .gg-drop:hover > a, .gg-drop:hover > .gg-drop-btn { color: var(--gg-violet); }
.gg-nav a[aria-current="page"] { color: var(--gg-violet); }
.gg-nav > a[aria-current="page"]::after { content: ""; position: absolute; inset-inline: 0; bottom: 12px; height: 1px; background: currentColor; }
.gg-nav-end { margin-inline-start: auto; }
.gg-red { color: var(--gg-red); }
.gg-sale-tag { padding: 1px 6px; border-radius: 4px; background: var(--gg-red); color: #fff; font-size: 10px; font-style: normal; font-weight: 700; }
.gg-drop { position: relative; display: flex; outline: none; }
.gg-drop-panel { position: absolute; top: 100%; z-index: 40; display: none; padding: 22px; background: #fff; border: 1px solid var(--gg-line); border-radius: 0 0 8px 8px; box-shadow: 0 24px 40px -24px rgb(0 0 0 / .3); font-weight: 400; }
.gg-drop:hover .gg-drop-panel, .gg-drop:focus-within .gg-drop-panel { display: block; }
.gg-mega { inset-inline-start: -20px; width: 860px; display: none; grid-template-columns: repeat(4, 1fr); gap: 18px 24px; }
.gg-drop:hover .gg-mega, .gg-drop:focus-within .gg-mega { display: grid; }
.gg-mega div { display: grid; align-content: start; gap: 10px; font-size: 13px; }
.gg-mega a:hover { color: var(--gg-violet); }
.gg-mega-title { font-weight: 700; font-size: 14px; }
.gg-drop-end { position: static; }
.gg-nav-end { position: relative; }
.gg-drop-cards { inset-inline-end: 0; width: 1160px; max-width: 92vw; box-sizing: border-box; }
.gg-drop-cards .gg-row6 { border: none; }
.gg-drop-cards .gg-card { border: none !important; }

/* Home: categories beside the hero */
.gg-top-row { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 30px; align-items: start; }
.gg-side-cats { display: grid; border: 1px solid var(--gg-line); border-top: none; border-radius: 0 0 8px 8px; }
.gg-side-cats a:first-child { border-top: none; }
.gg-home .gg-allcats:not(:focus-within) .gg-allcats-list { display: none !important; }
.gg-home .gg-allcats-btn { cursor: default; }

/* Hero slider */
.gg-hero { position: relative; margin-top: 30px; border-radius: 8px; overflow: hidden; background: #EEEEEC; }
.gg-dot { position: absolute; top: 50%; left: 50%; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.gg-slides { display: grid; }
.gg-slide { grid-area: 1 / 1; position: relative; display: grid; align-items: center; min-height: 470px; opacity: 0; visibility: hidden; transition: opacity .7s, visibility .7s; }
.gg-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.gg-dot:nth-of-type(${n}):checked ~ .gg-slides > .gg-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes gg-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.12).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.gg-n${n} .gg-auto:checked ~ .gg-slides > .gg-slide { animation: gg-cycle${n} ${n * 6}s infinite both; }
${Array.from({ length: n }, (_, k) => `.gg-n${n} .gg-auto:checked ~ .gg-slides > .gg-slide:nth-child(${k + 1}) { animation-delay: ${k * 6 - 0.4}s; }`).join("\n")}`;
  })
  .join("\n")}
.gg-hero:hover .gg-slide, .gg-hero:focus-within .gg-slide { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .gg-auto:checked ~ .gg-slides > .gg-slide { animation: none !important; } .gg-auto:checked ~ .gg-slides > .gg-slide:first-child { opacity: 1; visibility: visible; } }
/* The picture sits on the far side from the text (its product keeps to the picture's right, so it is not mirrored). */
.gg-slide-pic { position: absolute; inset-block: 0; inset-inline-end: 0; width: 56%; }
.gg-slide-pic img { width: 100%; height: 100%; object-fit: cover; object-position: right center; -webkit-mask-image: linear-gradient(to right, #000 82%, transparent); mask-image: linear-gradient(to right, #000 82%, transparent); }
.gg-slide-text { position: relative; display: grid; justify-items: start; gap: 14px; max-width: 470px; padding: 40px 50px; }
.gg-slide-text h1, .gg-slide-text h2 { font-size: 40px; font-weight: 700; line-height: 1.45; color: var(--gg-deep); }
.gg-slide-text p { max-width: 400px; font-size: 15px; line-height: 1.9; color: var(--gg-ink); }
.gg-slide-buy { display: flex; align-items: center; gap: 18px; margin-top: 18px; }
.gg-slide-buy .gg-btn { height: 40px; border-radius: 6px; }
.gg-slide-deal { display: grid; gap: 2px; }
.gg-slide-deal .gg-price b { font-size: 24px; }
.gg-slide-deal small { font-size: 10px; color: var(--gg-muted); }
.gg-dots { position: absolute; bottom: 16px; left: 50%; translate: -50% 0; display: flex; gap: 6px; }
.gg-dots label { width: 8px; height: 8px; border-radius: 50%; background: rgb(0 0 0 / .18); cursor: pointer; }
${[1, 2, 3, 4, 5].map((n) => `.gg-dot:nth-of-type(${n}):checked ~ .gg-dots label:nth-child(${n})`).join(", ")}, .gg-auto:checked ~ .gg-dots label:first-child { background: var(--gg-ink); }

/* Features */
.gg-perks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding-block: 34px; border-bottom: 1px solid var(--gg-line); }
.gg-perk { display: flex; gap: 14px; align-items: flex-start; }
.gg-perk-ico { width: 34px; height: 34px; color: var(--gg-violet); stroke-width: 1.3; }
.gg-perk span { display: grid; gap: 6px; }
.gg-perk b { font-size: 15px; font-weight: 600; }
.gg-perk small { color: var(--gg-muted); font-size: 12px; line-height: 1.7; }
.gg-perks-plain { border-bottom: none; text-align: center; }

/* Promo cards */
.gg-promos { display: grid; gap: 22px; margin-top: 34px; }
.gg-promos.three { grid-template-columns: repeat(3, 1fr); }
.gg-promos.four { grid-template-columns: repeat(4, 1fr); }
.gg-promos.two { grid-template-columns: repeat(2, 1fr); }
.gg-promo { position: relative; display: block; min-height: 194px; border-radius: 8px; overflow: hidden; background: #F4F1EC; isolation: isolate; }
.gg-promo.tall { min-height: 382px; }
.gg-promo.wide { min-height: 250px; }
.gg-promo-pic { position: absolute; inset-block: 0; inset-inline-end: 0; width: 60%; z-index: -1; }
.gg-promo.tall .gg-promo-pic, .gg-promo.cell .gg-promo-pic { inset: 0; width: auto; }
.gg-pic { display: block; }
.gg-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.gg-promo-pic img { object-position: right center; transition: transform .5s; -webkit-mask-image: linear-gradient(to right, #000 80%, transparent); mask-image: linear-gradient(to right, #000 80%, transparent); }
.gg-promo.tall .gg-promo-pic img, .gg-promo.cell .gg-promo-pic img { object-position: center bottom; -webkit-mask-image: none; mask-image: none; }
.gg-promo:hover .gg-promo-pic img { transform: scale(1.04); }
.gg-promo-text { display: grid; justify-items: start; gap: 8px; max-width: 64%; padding: 24px 22px; }
.gg-promo.tall .gg-promo-text { max-width: 92%; }
.gg-promo-text small { color: var(--gg-orange); font-size: 12px; font-weight: 500; }
.gg-promo-text b { font-size: 19px; font-weight: 700; line-height: 1.45; }
.gg-promo.wide .gg-promo-text b { font-size: 24px; }
.gg-promo-text span { color: var(--gg-muted); font-size: 12px; }
.gg-promo-text .gg-pill { margin-top: 8px; }

/* Sections */
.gg-sec { margin-top: 44px; }
.gg-head-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.gg-head-text { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.gg-head-text h2 { font-size: 20px; font-weight: 700; }
.gg-head-text p { color: var(--gg-muted); font-size: 12px; }
.gg-head-row.small h2 { font-size: 16px; }
.gg-all { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 1px solid var(--gg-line); border-radius: 999px; background: #fff; font-size: 12px; font-weight: 600; white-space: nowrap; }
.gg-all .gg-ico { width: 15px; height: 15px; }
.gg-all:hover { border-color: var(--gg-violet); color: var(--gg-violet); }

/* Product grids: cells share their borders, as in the reference */
.gg-boxed { display: grid; border: 1px solid var(--gg-line); border-radius: 8px; overflow: hidden; }
.gg-boxed > * { box-shadow: -1px -1px 0 var(--gg-line) inset; margin: 0 -1px -1px 0; }
.gg-row6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.gg-row5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.gg-row3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gg-drop-cards .gg-row6 { display: grid; }
.gg-best { grid-template-columns: repeat(6, minmax(0, 1fr)); grid-auto-flow: dense; }
.gg-best .gg-promo.cell { grid-column: 3 / span 2; grid-row: 1; min-height: 0; margin: 12px; border-radius: 8px; box-shadow: none; }
.gg-best .gg-promo.cell.second { grid-row: 2; }
.gg-best .gg-promo.cell .gg-promo-text { max-width: 90%; }
.gg-promo.cell::after, .gg-promo.tall::after { content: ""; position: absolute; inset: 0 0 40%; z-index: -1; background: linear-gradient(#F4F1EC 50%, rgb(244 241 236 / 0)); pointer-events: none; }
.gg-best .gg-promo.cell .gg-promo-text b { font-size: 22px; }

/* Product card */
.gg-card { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 18px; background: #fff; min-width: 0; }
.gg-card-pic { position: relative; }
.gg-img { display: grid; place-items: center; aspect-ratio: 1; overflow: hidden; }
.gg-img img { width: 82%; height: 82%; object-fit: contain; transition: transform .4s; }
.gg-card:hover .gg-img img { transform: scale(1.05); }
.gg-img b { font-size: 34px; color: var(--gg-line); }
.gg-off { position: absolute; top: 0; inset-inline-start: 0; padding: 3px 7px; border-radius: 999px; background: var(--gg-red); color: #fff; font-size: 11px; font-weight: 700; }
.gg-wish { position: absolute; top: 0; inset-inline-end: 0; display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: none; border-radius: 50%; background: #fff; }
.gg-wish .gg-ico { width: 21px; height: 21px; }
.gg-wish.on .gg-ico, .gg-wish:hover .gg-ico { fill: var(--gg-red); stroke: var(--gg-red); }
.gg-quick { position: absolute; bottom: 4px; inset-inline-end: 4px; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: none; border-radius: 50%; background: var(--gg-violet); color: #fff; opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s; }
.gg-quick .gg-ico { width: 18px; height: 18px; stroke-width: 2.2; }
.gg-card:hover .gg-quick { opacity: 1; transform: none; }
.gg-chip { position: absolute; bottom: 0; inset-inline-start: 0; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700; }
.gg-chip.cold { background: #E0F2FE; color: #075985; }
.gg-chip .gg-ico { width: 12px; height: 12px; stroke-width: 2.2; }
.gg-card-body { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.gg-card-name { font-size: 13px; font-weight: 500; line-height: 1.6; min-height: 3.2em; }
.gg-card-name span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.gg-card-name:hover { color: var(--gg-violet); }
.gg .sk-stars svg { width: 13px; height: 13px; }
.gg-price { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.gg-price b { font-size: 17px; font-weight: 700; color: var(--gg-ink); }
.gg-price.sale b { color: var(--gg-red); }
.gg-price s { color: var(--gg-ink); font-size: 12px; opacity: .8; }
.gg-add { display: flex; align-items: center; justify-content: space-between; gap: 6px; width: 100%; height: 32px; margin-top: auto; padding: 0 14px; box-sizing: border-box; border: 1px solid var(--gg-violet); border-radius: 999px; background: #fff; color: var(--gg-violet) !important; font-size: 12px; font-weight: 500; transition: background .2s, color .2s; }
.gg-add .gg-ico { width: 15px; height: 15px; }
.gg-add:hover { background: var(--gg-violet); color: #fff !important; }
.gg-add.off { justify-content: center; border-color: var(--gg-line); color: var(--gg-muted) !important; }
.gg-card .gg-act:has(.gg-add) { display: block; margin-top: auto; }
.gg-stock-row { display: flex; align-items: center; gap: 10px; margin-top: auto; }
.gg-cartbtn { display: grid; place-items: center; width: 36px; height: 34px; padding: 0; border: none; border-radius: 6px; background: var(--gg-green); color: #fff !important; }
.gg-cartbtn .gg-ico { width: 20px; height: 20px; }
.gg-cartbtn:hover { background: #15803D; }
.gg-stock-row small { color: var(--gg-green); font-size: 11px; font-weight: 700; }
.gg-stock-row small.out { color: var(--gg-red); }
.gg-run { display: grid; gap: 6px; font-size: 11px; color: var(--gg-muted); }
.gg-run i { position: relative; height: 4px; border-radius: 4px; background: var(--gg-line); overflow: hidden; }
.gg-run i::after { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: var(--w); background: linear-gradient(90deg, var(--gg-red), #F59E0B); border-radius: inherit; }
.gg-run b { color: var(--gg-ink); font-size: 14px; }
.gg-card.big { padding: 24px; }
.gg-card.big .gg-img img { width: 72%; height: 72%; }
.gg-card.big .gg-card-name { font-size: 14px; }
.gg-card.big .gg-price b { font-size: 20px; }
.gg-count { display: flex; align-items: center; gap: 4px; margin-top: 6px; }
.gg-count span { display: grid; place-items: center; min-width: 28px; height: 26px; border-radius: 4px; background: var(--gg-soft); font-size: 11px; font-weight: 600; }
.gg-count i { font-style: normal; font-weight: 700; }
.gg-count small { margin-inline-start: 10px; color: var(--gg-muted); font-size: 10px; }

/* Wide band */
.gg-band { position: relative; display: grid; gap: 4px; margin-top: 40px; padding: 22px 26px; border-radius: 8px; background: #FDF2F1; overflow: hidden; isolation: isolate; }
.gg-band b { color: var(--gg-red); font-size: 18px; font-weight: 700; max-width: 60%; }
.gg-band small { color: var(--gg-muted); font-size: 12px; max-width: 60%; }
.gg-band-pic { position: absolute; inset-block: 0; inset-inline-end: 0; width: 34%; z-index: -1; }
.gg-band-pic img { object-fit: cover; object-position: center 30%; -webkit-mask-image: linear-gradient(to left, #000 60%, transparent); mask-image: linear-gradient(to left, #000 60%, transparent); }
.gg-band-pct { position: absolute; inset-inline-end: 32%; top: 50%; translate: 0 -50%; z-index: -1; font-size: 110px; font-weight: 800; color: rgb(220 38 38 / .1); }

/* Brands */
.gg-brands { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--gg-line); border-radius: 8px; }
.gg-brand { display: grid; gap: 14px; align-content: start; padding: 22px; border-inline-start: 1px solid var(--gg-line); }
.gg-brand:first-child { border-inline-start: none; }
.gg-brand-top { display: flex; align-items: center; gap: 14px; }
.gg-brand-pic { width: 72px; height: 72px; flex: none; border-radius: 50%; overflow: hidden; border: 1px solid var(--gg-line); }
.gg-brand-top > span { display: grid; gap: 2px; }
.gg-brand-top .sk-stars { display: flex; }
.gg-brand-top b { font-size: 14px; }
.gg-brand-top small { color: var(--gg-muted); font-size: 11px; }
.gg-brand p { color: var(--gg-muted); font-size: 12px; line-height: 1.7; }
.gg-add-brand { place-items: center; color: var(--gg-muted); cursor: pointer; }

/* Footer */
.gg-foot { position: relative; margin-top: 60px; padding-bottom: 20px; background: var(--gg-soft); font-size: 13px; }
.gg-news { display: flex; justify-content: space-between; align-items: center; gap: 30px; padding-block: 44px; border-bottom: 1px solid var(--gg-line); }
.gg-news h3 { font-size: 20px; font-weight: 700; }
.gg-news p { max-width: 420px; margin-top: 6px; color: var(--gg-muted); font-size: 12px; line-height: 1.8; }
.gg-news > div:last-child { display: grid; gap: 8px; }
.gg-news > div:last-child small { color: var(--gg-muted); font-size: 11px; }
.gg-news-form { display: flex; align-items: center; width: 470px; max-width: 100%; height: 50px; border: 1px solid var(--gg-line); border-radius: 6px; background: #fff; overflow: hidden; }
.gg-news-form .gg-ico { margin-inline: 14px 4px; color: var(--gg-muted); width: 18px; }
.gg-news-form input[type="email"] { flex: 1; min-width: 0; height: 100%; border: none; outline: none; font: inherit; background: none; }
.gg-news-form button { height: 100%; padding: 0 24px; border: none; background: var(--gg-violet); color: #fff; font-weight: 700; }
.gg-foot-cols { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 1.2fr; gap: 30px; padding-block: 44px; border-bottom: 1px solid var(--gg-line); }
.gg-foot-cols > div { display: grid; align-content: start; gap: 10px; }
.gg-foot-cols h4 { margin-bottom: 8px; font-size: 14px; font-weight: 700; }
.gg-foot-cols a { color: #4B5563; font-size: 13px; }
.gg-foot-cols a:hover { color: var(--gg-violet); }
.gg-foot-help p { color: var(--gg-muted); line-height: 1.8; font-size: 12px; max-width: 290px; margin-bottom: 14px; }
.gg-foot-contact { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
.gg-foot-contact > .gg-ico { width: 30px; height: 30px; stroke-width: 1.3; color: var(--gg-ink); }
.gg-foot-contact span { display: grid; gap: 2px; }
.gg-foot-contact small { color: var(--gg-muted); font-size: 11px; }
.gg-foot-contact b { color: var(--gg-ink); font-size: 18px; font-weight: 700; text-align: start; }
.gg-foot-help .gg-foot-contact:last-child b { font-size: 14px; }
.gg-app { display: flex; align-items: center; gap: 10px; }
.gg-app img { width: 130px; height: auto; border-radius: 6px; }
.gg-app small { color: var(--gg-muted); font-size: 10px; line-height: 1.5; }
.gg-foot-app h5 { margin: 12px 0 0; font-size: 12px; font-weight: 600; }
.gg-socials { display: flex; flex-wrap: wrap; gap: 8px; }
.gg-socials a { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 6px; background: #fff; color: var(--gg-violet) !important; box-shadow: 0 1px 2px rgb(0 0 0 / .05); }
.gg-socials .p-ico { width: 16px; height: 16px; }
.gg-foot-end { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding-block: 24px 10px; color: var(--gg-muted); font-size: 12px; }
.gg-foot-end > div { display: grid; gap: 12px; }
.gg-foot-end nav { display: flex; gap: 14px; }
.gg-foot-end nav a { color: var(--gg-ink); }
.gg-pays { display: flex; align-items: center; gap: 14px; }
.gg-pays a, .gg-pays span { display: contents; }
.gg-pays img { height: 16px; max-width: 90px; width: auto; object-fit: contain; }
.gg-top { position: absolute; bottom: 24px; inset-inline-end: 24px; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--gg-line); border-radius: 50%; background: #fff; }
.gg-top .gg-ico { width: 18px; height: 18px; }

/* Inner pages */
.gg-inner { padding-top: 20px; }
.gg-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 22px; color: var(--gg-muted); font-size: 12px; }
.gg-trail span { display: inline-flex; align-items: center; gap: 6px; }
.gg-trail .gg-ico { width: 12px; height: 12px; }
.gg-trail b { color: var(--gg-ink); font-weight: 500; }
.gg-trail a:hover { color: var(--gg-violet); }
.gg-page-head h1 { margin-bottom: 22px; font-size: 26px; font-weight: 700; }
.gg-notice { padding: 30px; border: 1px dashed var(--gg-line); border-radius: 8px; color: var(--gg-muted); text-align: center; }
.gg-box { padding: 22px; border: 1px solid var(--gg-line); border-radius: 8px; background: #fff; }

/* Shop page */
.gg-shop { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 30px; align-items: start; }
.gg-widget { display: grid; gap: 14px; padding-bottom: 26px; margin-bottom: 26px; border-bottom: 1px solid var(--gg-line); }
.gg-widget h3 { font-size: 14px; font-weight: 700; }
.gg-minmax { display: flex; align-items: flex-end; gap: 8px; }
.gg-minmax label { flex: 1; display: grid; gap: 4px; }
.gg-minmax small { color: var(--gg-muted); font-size: 11px; }
.gg-minmax input { width: 100%; height: 40px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--gg-line); border-radius: 6px; font: inherit; }
.gg-minmax i { padding-bottom: 10px; font-style: normal; }
.gg-range { position: relative; height: 18px; }
.gg-range input { position: absolute; inset: 0; width: 100%; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.gg-range input:first-child { background: linear-gradient(var(--gg-ink), var(--gg-ink)) center / 100% 3px no-repeat; }
.gg-range input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--gg-ink); }
.gg-range input::-moz-range-thumb { width: 14px; height: 14px; border: none; border-radius: 50%; background: var(--gg-ink); }
.gg-range-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.gg-range-foot small { color: var(--gg-muted); font-size: 11px; }
.gg-range-foot button { height: 34px; padding: 0 18px; border: none; border-radius: 6px; background: var(--gg-soft); font-weight: 600; font-size: 12px; }
.gg-range-foot button:hover { background: var(--gg-line); }
.gg-checklist { display: grid; gap: 10px; font-size: 13px; }
.gg-checklist a { display: flex; align-items: center; gap: 10px; }
.gg-checklist small { color: var(--gg-muted); margin-inline-start: auto; }
.gg-box { box-sizing: border-box; }
.gg-tick { width: 16px; height: 16px; padding: 0; border: 1px solid #D1D5DB; border-radius: 3px; }
.gg-checklist a[aria-current="page"] .gg-tick { background: var(--gg-violet) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center / 12px no-repeat; border-color: var(--gg-violet); }
.gg-checks label { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.gg-checks input { width: 16px; height: 16px; accent-color: var(--gg-violet); }
.gg-checks .gg-btn { justify-self: start; }
.gg-filter-sm { display: none; }
.gg-shop-banner { position: relative; display: flex; align-items: center; min-height: 230px; margin-bottom: 18px; border-radius: 8px; overflow: hidden; background: #EEEEEC; isolation: isolate; }
.gg-shop-banner-pic { position: absolute; inset-block: 0; inset-inline-end: 0; width: 62%; z-index: -1; }
.gg-shop-banner-pic img { object-position: right center; -webkit-mask-image: linear-gradient(to right, #000 80%, transparent); mask-image: linear-gradient(to right, #000 80%, transparent); }
.gg-shop-banner > div { display: grid; justify-items: start; gap: 10px; max-width: 360px; padding: 30px; }
.gg-shop-banner h2 { font-size: 28px; font-weight: 700; line-height: 1.4; }
.gg-shop-banner p { color: var(--gg-muted); font-size: 13px; }
.gg-chips { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 14px; font-size: 12px; }
.gg-chips a, .gg-chips button { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: none; background: none; }
.gg-chips .gg-ico { width: 12px; height: 12px; stroke-width: 2.4; }
.gg-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; padding: 10px 14px; border-radius: 8px; background: var(--gg-soft); }
.gg-toolbar > small { color: var(--gg-muted); font-size: 12px; }
.gg-sort { position: relative; font-size: 12px; }
.gg-sort summary { display: flex; align-items: center; gap: 6px; list-style: none; cursor: pointer; color: var(--gg-muted); }
.gg-sort summary b { color: var(--gg-ink); font-weight: 600; }
.gg-sort summary::-webkit-details-marker { display: none; }
.gg-sort summary .gg-ico { width: 14px; height: 14px; }
.gg-sort > div { position: absolute; top: calc(100% + 8px); inset-inline-end: 0; z-index: 20; display: grid; min-width: 170px; padding: 6px; background: #fff; border: 1px solid var(--gg-line); border-radius: 8px; box-shadow: 0 16px 30px -18px rgb(0 0 0 / .3); }
.gg-sort form button { width: 100%; padding: 8px 10px; border: none; border-radius: 6px; background: none; text-align: start; }
.gg-sort form button:hover, .gg-sort form button[aria-current] { background: var(--gg-soft); color: var(--gg-violet); }

/* Product page */
.gg-product { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 50px; align-items: start; }
.gg-gallery { display: grid; gap: 12px; }
.gg-gallery-main { position: relative; display: grid; }
.gg-gal { grid-area: 1 / 1; display: grid; place-items: center; aspect-ratio: 1; cursor: zoom-in; }
.gg-gal span { display: contents; }
.gg-gal img { width: 88%; height: 88%; object-fit: contain; }
.gg-gallery:has(.gg-thumbs) .gg-gal { visibility: hidden; }
${[1, 2, 3, 4, 5, 6].map((n) => `.gg-gallery:has(.gg-thumb:nth-child(${n}) input:checked) .gg-gal:nth-child(${n})`).join(", ")} { visibility: visible; }
.gg-gallery-main .gg-off { top: 8px; inset-inline-start: 8px; }
.gg-gallery-main .gg-chip { top: 38px; bottom: auto; inset-inline-start: 8px; }
.gg-thumbs { display: flex; gap: 10px; }
.gg-thumb { display: grid; place-items: center; width: 72px; height: 72px; border: 1px solid var(--gg-line); border-radius: 6px; cursor: pointer; }
.gg-thumb input { position: absolute; opacity: 0; pointer-events: none; }
.gg-thumb img { width: 80%; height: 80%; object-fit: contain; }
.gg-thumb:has(input:checked) { border-color: var(--gg-ink); }
.gg-pinfo { display: grid; gap: 14px; }
.gg-pinfo h1 { font-size: 30px; font-weight: 700; line-height: 1.45; }
.gg-pmeta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; color: var(--gg-muted); font-size: 12px; }
.gg-pmeta b { color: var(--gg-ink); font-weight: 600; }
.gg-score { padding: 1px 6px; border: 1px solid var(--gg-line); border-radius: 4px; }
.gg-pdesc { color: #4B5563; font-size: 13px; line-height: 1.9; }
.gg-pinfo .gg-price b { font-size: 26px; }
.gg-pinfo .gg-price s { font-size: 16px; }
.gg-buy { display: grid; gap: 12px; }
.gg-buy-row { display: flex; gap: 12px; }
.gg-qty input { width: 110px; height: 44px; box-sizing: border-box; padding: 0 12px; border: 1px solid var(--gg-line); border-radius: 6px; font: inherit; text-align: center; }
.gg-buy .gg-btn { height: 44px; }
.gg-ship-box { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--gg-line); border-radius: 6px; font-size: 12px; }
.gg-ship-box span { color: var(--gg-muted); }
.gg-info-boxes { border: 1px solid var(--gg-line); border-radius: 6px; }
.gg-info-boxes p { display: flex; gap: 16px; padding: 14px 16px; color: var(--gg-muted); font-size: 12px; line-height: 1.8; }
.gg-info-boxes p + p { border-top: 1px solid var(--gg-line); }
.gg-info-boxes b { color: var(--gg-ink); }
.gg-info-boxes .gg-ico { color: var(--gg-muted); margin-top: 2px; }
.gg-plinks { display: flex; flex-wrap: wrap; gap: 20px; }
.gg-plink { display: inline-flex; align-items: center; gap: 8px; padding: 0; border: none; background: none; font-size: 13px; }
.gg-plink .gg-ico { width: 30px; height: 30px; padding: 6px; box-sizing: border-box; border: 1px solid var(--gg-line); border-radius: 50%; }
.gg-plink.on .gg-ico { fill: var(--gg-red); stroke: var(--gg-red); }
.gg-tabs { margin-top: 50px; }
.gg-tabs > input { position: absolute; opacity: 0; pointer-events: none; }
.gg-tab-heads { display: flex; gap: 28px; border-bottom: 1px solid var(--gg-line); }
.gg-tab-heads label { padding: 10px 0; margin-bottom: -1px; border-bottom: 2px solid transparent; color: var(--gg-muted); font-size: 15px; font-weight: 600; cursor: pointer; }
#gg-tab-1:checked ~ .gg-tab-heads label[for="gg-tab-1"], #gg-tab-2:checked ~ .gg-tab-heads label[for="gg-tab-2"] { border-color: var(--gg-ink); color: var(--gg-ink); }
.gg-tab { display: none; padding-top: 22px; }
#gg-tab-1:checked ~ .gg-tab-desc, #gg-tab-2:checked ~ .gg-tab-rev { display: grid; gap: 14px; }
.gg-tab-desc p { color: #374151; line-height: 2; max-width: 900px; }

/* Blog */
.gg-blog { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 50px; align-items: start; }
.gg-posts { display: grid; gap: 50px; }
.gg-post { display: grid; justify-items: start; gap: 12px; }
.gg-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 1240 / 826; border-radius: 6px; overflow: hidden; background: var(--gg-soft); }
.gg-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.gg-post-pic > span { display: contents; }
.gg-post:hover .gg-post-pic img { transform: scale(1.03); }
.gg-post-cat { position: absolute; top: 14px; inset-inline-start: 14px; padding: 3px 9px; border-radius: 4px; background: #fff; font-size: 10px; font-style: normal; font-weight: 700; }
.gg-post h2, .gg-post h1 { font-size: 28px; font-weight: 700; line-height: 1.5; }
.gg-post h2:hover { color: var(--gg-violet); }
.gg-post-meta { color: var(--gg-muted); font-size: 12px; }
.gg-post > p { color: #4B5563; font-size: 13px; line-height: 1.9; }
.gg-post-text { display: grid; gap: 14px; color: #374151; line-height: 2.1; font-size: 15px; }
.gg-blog-side { position: sticky; top: 20px; }
.gg-mini-post { display: flex; align-items: center; gap: 12px; }
.gg-mini-pic { width: 52px; height: 52px; flex: none; border-radius: 50%; overflow: hidden; background: var(--gg-soft); }
.gg-mini-pic img { width: 100%; height: 100%; object-fit: cover; }
.gg-mini-post span:last-child { display: grid; gap: 4px; }
.gg-mini-post b { font-size: 12px; font-weight: 600; line-height: 1.6; }
.gg-mini-post small { color: var(--gg-muted); font-size: 11px; }
.gg-mini-post:hover b { color: var(--gg-violet); }
.gg-social-big { display: grid; gap: 8px; }
.gg-social-big a { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border-radius: 6px; background: var(--gg-violet); color: #fff !important; font-size: 12px; }
.gg-social-big .p-ico { width: 16px; height: 16px; }

/* Contact */
.gg-contact-top { display: grid; justify-items: center; gap: 12px; padding-block: 30px 40px; border-bottom: 1px solid var(--gg-line); text-align: center; }
.gg-contact-top small { font-size: 12px; font-weight: 600; }
.gg-contact-top h1 { font-size: 46px; font-weight: 700; line-height: 1.4; }
.gg-contact-top p { max-width: 520px; color: var(--gg-ink); font-size: 14px; line-height: 1.9; }
.gg-offices { display: grid; grid-template-columns: 1.1fr 1fr 1.2fr; gap: 40px; padding-block: 40px; }
.gg-offices h2 { margin-bottom: 14px; font-size: 22px; font-weight: 700; }
.gg-offices p { line-height: 1.9; font-size: 13px; }
.gg-office { display: grid; align-content: start; justify-items: start; gap: 8px; font-size: 13px; }
.gg-office > .gg-ico { width: 22px; height: 22px; }
.gg-office b { font-size: 16px; }
.gg-office small { color: var(--gg-muted); }
.gg-office-phone { margin-top: 8px; font-size: 16px; font-weight: 700; }
.gg-office-mail { color: var(--gg-violet) !important; }
.gg-follow { display: flex; align-items: center; gap: 10px; margin-top: 18px; font-size: 12px; }
.gg-social-sq { display: flex; gap: 6px; }
.gg-social-sq a { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 4px; background: var(--gg-violet); color: #fff !important; }
.gg-social-sq .p-ico { width: 15px; height: 15px; }
.gg-contact-form form { display: grid; gap: 12px; }
.gg-contact-form input, .gg-contact-form textarea { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid var(--gg-line); border-radius: 6px; font: inherit; background: #fff; }
.gg-contact-form .gg-btn { justify-self: start; }
.gg-map { position: relative; height: 380px; }
.gg-map iframe { width: 100%; height: 100%; border: 1px solid var(--gg-line); border-radius: 8px; }
.gg-map .gg-btn { position: absolute; bottom: 18px; inset-inline-start: 38px; }

/* Cart, checkout and the rest */
.gg-empty { display: grid; justify-items: center; gap: 20px; padding-block: 90px 70px; text-align: center; }
.gg-empty-ico { width: 110px; height: 110px; stroke-width: 1.6; color: var(--gg-ink); }
.gg-empty p { color: var(--gg-red); font-size: 18px; font-weight: 700; }
.gg-cart { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
.gg-lines { padding: 0; }
.gg-line { display: grid; grid-template-columns: 80px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px 20px; border-top: 1px solid var(--gg-line); }
.gg-line:first-child { border-top: none; }
.gg-line-pic img { width: 80px; height: 80px; object-fit: contain; }
.gg-line-info { display: grid; gap: 4px; }
.gg-line-info small { color: var(--gg-muted); }
.gg-stepper { display: flex; align-items: center; gap: 10px; padding: 4px; border: 1px solid var(--gg-line); border-radius: 6px; }
.gg-stepper button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 4px; background: var(--gg-soft); }
.gg-stepper .gg-ico { width: 14px; height: 14px; }
.gg-line-total { min-width: 110px; text-align: end; }
.gg-remove { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: none; border-radius: 50%; background: none; color: var(--gg-muted); }
.gg-remove:hover { color: var(--gg-red); background: #FEF2F2; }
.gg-sum { display: grid; gap: 14px; }
.gg-sum h2, .gg-checkout h2 { font-size: 17px; font-weight: 700; }
.gg-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: 13px; }
.gg-sum dd { margin: 0; font-weight: 600; }
.gg-sum .total { padding-top: 12px; border-top: 1px solid var(--gg-line); font-size: 15px; font-weight: 700; }
.gg-sum > small { color: var(--gg-green); }
.gg-minus { color: var(--gg-green); }
.gg-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 13px; }
.gg-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.gg-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.gg-checkout h2, .gg-checkout .full, .gg-checkout .gg-error { grid-column: 1 / -1; }
.gg-checkout label { display: grid; gap: 6px; font-size: 13px; }
.gg-checkout input, .gg-checkout textarea { padding: 10px 12px; border: 1px solid var(--gg-line); border-radius: 6px; font: inherit; }
.gg-trap { position: absolute; left: -9999px; }
.gg-error { padding: 10px 14px; border-radius: 6px; background: #FEF2F2; color: var(--gg-red); }
.gg-pay { padding: 12px 14px; border-radius: 6px; background: var(--gg-soft); font-size: 12px; line-height: 1.8; }
.gg-thanks { display: grid; justify-items: center; gap: 14px; max-width: 520px; margin: 40px auto; text-align: center; }
.gg-done { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7; color: var(--gg-green); }
.gg-done .gg-ico { width: 30px; height: 30px; stroke-width: 2.4; }
.gg-search-big { max-width: 640px; margin-bottom: 24px; }

/* Phone tab bar (narrow screens only) */
.gg-tabbar { display: none; }
.gg-burger { display: none; }

@container (max-width: 1180px) {
  .gg-row6, .gg-best { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .gg-best .gg-promo.cell { grid-column: 2 / span 2; }
  .gg-row5 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .gg-deliver { display: none; }
  .gg-mega { width: 640px; grid-template-columns: repeat(3, 1fr); }
  .gg-drop-cards { width: 900px; }
}
@container (max-width: 1000px) {
  .gg-top-row { grid-template-columns: 1fr; }
  .gg-side-cats { display: none; }
  .gg-home .gg-allcats:not(:focus-within) .gg-allcats-list { display: none !important; }
  .gg-home .gg-allcats-btn { cursor: pointer; }
  .gg-allcats { width: 230px; }
  .gg-nav-end { display: none; }
  .gg-promos.four { grid-template-columns: repeat(2, 1fr); }
  .gg-perks { grid-template-columns: repeat(2, 1fr); }
  .gg-row3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gg-brands { grid-template-columns: repeat(2, 1fr); }
  .gg-brand:nth-child(3) { border-inline-start: none; }
  .gg-brand:nth-child(n + 3) { border-top: 1px solid var(--gg-line); }
  .gg-foot-cols { grid-template-columns: 1fr 1fr 1fr; }
  .gg-foot-help { grid-column: 1 / -1; }
  .gg-shop { grid-template-columns: 1fr; }
  .gg-side-lg { display: none; }
  .gg-filter-sm { display: block; margin-bottom: 10px; padding: 0 14px; border: 1px solid var(--gg-line); border-radius: 8px; }
  .gg-filter-sm summary { display: flex; align-items: center; gap: 8px; height: 44px; list-style: none; cursor: pointer; font-weight: 600; }
  .gg-filter-sm summary::-webkit-details-marker { display: none; }
  .gg-row5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gg-product, .gg-blog, .gg-cart, .gg-offices { grid-template-columns: 1fr; gap: 30px; }
  .gg-blog-side { position: static; }
}
@container (max-width: 760px) {
  .gg { font-size: 13px; }
  .gg-wrap { padding-inline: 14px; }
  .gg-strip-in { flex-direction: column; gap: 2px; padding-block: 8px; text-align: center; }
  .gg-strip-pct { display: none; }
  .gg-links, .gg-menu, .gg-search, .gg-account, .gg-hide-sm, .gg-tool small { display: none; }
  .gg-header-in { min-height: 64px; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--gg-line); }
  .gg-logo img { height: 32px; }
  .gg-burger { display: block; }
  .gg-burger summary { display: grid; place-items: center; width: 36px; height: 36px; list-style: none; cursor: pointer; }
  .gg-burger summary::-webkit-details-marker { display: none; }
  .gg-burger summary span, .gg-burger summary span::before, .gg-burger summary span::after { display: block; width: 22px; height: 2px; background: var(--gg-ink); border-radius: 2px; position: relative; }
  .gg-burger summary span::before, .gg-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .gg-burger summary span::before { top: -7px; }
  .gg-burger summary span::after { top: 7px; }
  .gg-burger[open] summary span { background: transparent; }
  .gg-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .gg-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .gg-drawer { position: absolute; inset-inline: 0; top: 100%; z-index: 50; display: grid; gap: 2px; max-height: 70vh; overflow: auto; padding: 12px 14px 20px; background: #fff; border-bottom: 1px solid var(--gg-line); box-shadow: 0 20px 30px -20px rgb(0 0 0 / .3); }
  .gg-header { position: relative; }
  .gg-drawer a { display: flex; align-items: center; gap: 10px; padding: 10px 4px; font-size: 14px; }
  .gg-drawer a[aria-current="page"] { color: var(--gg-violet); }
  .gg-drawer b { margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--gg-line); font-size: 12px; color: var(--gg-muted); }
  .gg-tools { gap: 0; }
  .gg-hero { margin-top: 16px; }
  .gg-slide { min-height: 380px; align-items: start; }
  .gg-slide-pic { width: 100%; }
  .gg-slide-pic img { opacity: .4; -webkit-mask-image: none; mask-image: none; }
  .gg-slide-text { padding: 26px 20px; }
  .gg-slide-text h1, .gg-slide-text h2 { font-size: 28px; }
  .gg-slide-buy { flex-wrap: wrap; }
  .gg-perks { grid-template-columns: 1fr 1fr; gap: 18px; padding-block: 24px; }
  .gg-perk-ico { width: 28px; height: 28px; }
  .gg-promos.three, .gg-promos.two { grid-template-columns: 1fr; }
  .gg-promos.four { grid-template-columns: 1fr 1fr; gap: 12px; }
  .gg-promo.tall { min-height: 300px; }
  .gg-promo-text b { font-size: 16px; }
  .gg-row6, .gg-row5, .gg-row3, .gg-best { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gg-best .gg-promo.cell, .gg-best .gg-promo.cell.second { grid-column: 1 / -1; grid-row: auto; min-height: 260px; }
  .gg-card { padding: 12px; }
  .gg-card.big { padding: 12px; }
  .gg-add { padding: 0 10px; font-size: 11px; white-space: nowrap; }
  .gg-count small { display: none; }
  .gg-count span { min-width: 24px; }
  .gg-price b { font-size: 15px; }
  .gg-quick { opacity: 1; transform: none; width: 30px; height: 30px; }
  .gg-head-text { display: grid; gap: 4px; }
  .gg-head-text h2 { font-size: 18px; }
  .gg-band b, .gg-band small { max-width: 100%; }
  .gg-band-pic { opacity: .25; width: 60%; }
  .gg-brands { grid-template-columns: 1fr; }
  .gg-brand { border-inline-start: none !important; border-top: 1px solid var(--gg-line); }
  .gg-brand:first-child { border-top: none; }
  .gg-news { flex-direction: column; align-items: stretch; text-align: center; padding-block: 30px; }
  .gg-news p { margin-inline: auto; }
  .gg-news-form { width: 100%; }
  .gg-foot-cols { grid-template-columns: 1fr; gap: 24px; }
  .gg-foot-end { flex-direction: column; align-items: flex-start; padding-bottom: 80px; }
  .gg-foot-end nav { flex-wrap: wrap; }
  .gg-top { bottom: 84px; }
  .gg-shop-banner h2 { font-size: 22px; }
  .gg-shop-banner-pic { width: 100%; opacity: .3; }
  .gg-shop-banner-pic img { -webkit-mask-image: none; mask-image: none; }
  .gg-toolbar { flex-wrap: wrap; }
  .gg-pinfo h1 { font-size: 22px; }
  .gg-post h2, .gg-post h1 { font-size: 20px; }
  .gg-contact-top h1 { font-size: 30px; }
  .gg-line { grid-template-columns: 64px minmax(0, 1fr) auto; }
  .gg-line-pic img { width: 64px; height: 64px; }
  .gg-line-total { grid-column: 2; text-align: start; min-width: 0; }
  .gg-checkout { grid-template-columns: 1fr; }
  .gg-tabbar { position: sticky; bottom: 0; z-index: 60; display: grid; grid-template-columns: repeat(5, 1fr); padding: 6px 0 8px; background: #fff; border-top: 1px solid var(--gg-line); }
  .gg-tabbar a { position: relative; display: grid; justify-items: center; gap: 2px; font-size: 9px; color: var(--gg-muted); }
  .gg-tabbar a[aria-current="page"] { color: var(--gg-violet); }
  .gg-tabbar .gg-ico { width: 22px; height: 22px; color: var(--gg-ink); }
  .gg-tabbar b { position: absolute; top: -4px; left: calc(50% + 4px); min-width: 15px; height: 15px; border-radius: 8px; background: var(--gg-red); color: #fff; font-size: 9px; line-height: 15px; text-align: center; }
}
`;
