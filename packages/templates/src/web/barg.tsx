/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Barg": a bookshop in deep green, cream and white, with serif headings. A dark green strip of
// announcements, a header with a search box (category, words) and a menu row; a pastel hero slider
// with a wavy discount badge, a moving band of numbers, rows of book covers, top categories with
// drawn icons, a wide banner, half-price books, three promo cards, "picks for you", featured
// authors, readers' reviews, four perks, news and a newsletter row above a five-column footer.
// Pages: shop (filters for category, genre, format, author and price; grid or list), product,
// blog with a side column, contact with store locations, wishlist, cart, checkout and account.
// Published pages run only the small carousel script of scripts.ts; the slider and menus need none.

import type { ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, saleEnded, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, SORTS, SpecsTable, Stars, filterProducts, saleProducts, shopkitCss } from "./shopkit";
import { mapEmbed } from "./golsara";

/** Home page sections the user can switch off. */
export const BARG_BLOCKS = [
  { key: "strip", label: "نوار سبز پیام‌ها بالای صفحه" },
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "stats", label: "نوار متحرک اعداد" },
  { key: "highlights", label: "کتاب‌های منتخب هفته" },
  { key: "categories", label: "دسته‌های محبوب" },
  { key: "best", label: "پرفروش‌ها" },
  { key: "banner", label: "بنر پهن" },
  { key: "sale", label: "کتاب‌های نیم‌بها" },
  { key: "promos", label: "سه بنر رنگی" },
  { key: "picks", label: "پیشنهاد برای شما" },
  { key: "authors", label: "نویسندگان محبوب" },
  { key: "testimonials", label: "نظر خوانندگان" },
  { key: "perks", label: "چهار ویژگی فروشگاه" },
  { key: "news", label: "اخبار و رویدادها" },
  { key: "newsletter", label: "خبرنامه" },
  { key: "payments", label: "آرم‌های روش پرداخت پایین صفحه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const BARG_OPTIONAL_PAGES = [{ path: "/blog", label: "صفحه‌ی بلاگ" }] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && !(data.site?.hiddenPages ?? []).includes("/blog");

export function bargPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const blog = hasBlog(data) ? ["/blog", ...livePosts(shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", "/shop", ...blog, "/contact", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...infoPages(shop)];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function BargShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = bargPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
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
      <div className="brg-wrap brg-inner">
        <Trail view={view} items={[{ label: page.startsWith("/support") ? "پشتیبانی" : page === "/faq" ? "سؤالات متداول" : "صفحه" }]} />
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className={`brg${page === "/" ? " brg-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className="brg-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      <BottomNav {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  cart: "M5.5 8h13l-1 12h-11z M9 8V6.5a3 3 0 0 1 6 0V8",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16.2 16.2 20.5 20.5",
  heart: "M12 20s-7.8-4.7-7.8-10.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.8 2.5C19.8 15.3 12 20 12 20z",
  user: "M12 3.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4.6 20.6a7.4 7.4 0 0 1 14.8 0",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  down: "M6.5 9.5 12 15l5.5-5.5",
  left: "M14.5 6 8.5 12l6 6",
  right: "M9.5 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  phone: "M6.5 3.5h3.2l1.6 4.2-2.2 1.5a10 10 0 0 0 5.7 5.7l1.5-2.2 4.2 1.6v3.2a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  pin: "M12 21s-6.5-5.6-6.5-10.6a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21z M12 7.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z",
  grid: "M4 4h6.5v6.5H4z M13.5 4H20v6.5h-6.5z M4 13.5h6.5V20H4z M13.5 13.5H20V20h-6.5z",
  list: "M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
  filter: "M4 6h16 M7 12h10 M10 18h4",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  check: "M5 12.5l4.5 4.5L19 7.5",
  up: "M6 15l6-6 6 6",
  // The four perks: a parcel, a gift, a percent tag, a shop front.
  box: "M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8 M8 6l8 4",
  gift: "M4 9h16v4H4z M5.5 13v7h13v-7 M12 9v11 M12 9c-1.5-3-5-3.5-5-1.2C7 9 9.5 9 12 9zm0 0c1.5-3 5-3.5 5-1.2C17 9 14.5 9 12 9",
  tag: "M12 3.5l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.9 2.6-2.7-.2L12 20.5l-2.2-1.6-2.7.2-.9-2.6-2.2-1.6.9-2.6-.9-2.6 2.2-1.6.9-2.6 2.7.2z M9.5 14.5l5-5 M9.8 9.8h.01 M14.2 14.2h.01",
  store: "M4 9l1.5-4.5h13L20 9 M4 9h16v2.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0z M5.5 13v7h13v-7 M10 20v-4h4v4",
  book: "M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z M12 6.5v13",
  quote: "M9.5 7C6.5 8 5 10.5 5 14v3h5v-5H7.5c0-2 1-3.5 2.5-4z M18.5 7c-3 1-4.5 3.5-4.5 7v3h5v-5h-2.5c0-2 1-3.5 2.5-4z",
};

function Svg({ name, className = "brg-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const digits = (n: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const day = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(d) : "";
};

/** A book's details kept in its specs: the author, the genre. */
const spec = (p: Product, re: RegExp) => p.specs?.find((s) => re.test(s.label))?.value?.trim() || undefined;
const authorOf = (p: Product) => spec(p, /نویسنده|author/i);
const genreOf = (p: Product) => spec(p, /ژانر|genre/i);
/** The cover kinds a book comes in (paperback, hardcover…): the values of its first choice. */
const formatsOf = (p: Product) => (p.options?.[0]?.values ?? []).map((v) => v.label).concat(p.sizes ?? []);

/** The lowest and highest price of a book with priced choices (a paperback and a hardcover). */
function priceSpan(p: Product): [number, number] {
  const now = unitPrice(p);
  const prices = (p.variants ?? []).map((v) => v.price).filter((x): x is number => typeof x === "number" && x > 0);
  if (!prices.length) return [now, now];
  return [Math.min(now, ...prices), Math.max(now, ...prices)];
}

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="brg-act">
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

/** Section heading: a large serif title, and a round-ended "view all" button on the other side. */
function Head({ view, title, titlePath, to, query, center, label = "مشاهده‌ی همه" }: { view: View; title?: string; titlePath?: string; to?: string; query?: Record<string, string>; center?: boolean; label?: string }) {
  const edit = titlePath ? ed(titlePath, "text", "عنوان بخش") : undefined;
  return (
    <div className={`brg-head${center ? " center" : ""}`}>
      <Opt value={title} editing={view.editing} edit={edit}>
        <h2 {...edit}>{title}</h2>
      </Opt>
      {to &&
        (query ? (
          <form method="get" action={view.link(to)}>
            {Object.entries(query).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button type="submit" className="brg-all">
              {label} <Svg name="left" />
            </button>
          </form>
        ) : (
          <PageLink to={to} link={view.link} className="brg-all">
            {label} <Svg name="left" />
          </PageLink>
        ))}
    </div>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  const now = unitPrice(p);
  const [lo, hi] = priceSpan(p);
  if (hi > lo)
    return (
      <span className="brg-price">
        <b>
          {money(view, lo).replace(/\s*تومان\s*$/, "")} – {money(view, hi)}
        </b>
      </span>
    );
  return (
    <span className="brg-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function Rating({ view, p }: { view: View; p: Product }) {
  const r = view.visitor.ratings?.[p.id];
  return (
    <span className="brg-rate">
      <Stars value={r?.avg ?? 5} count={r?.count ?? 0} />
    </span>
  );
}

type CardMode = "row" | "shop" | "list";

function Card({ view, p, mode = "row" }: { view: View; p: Product; mode?: CardMode }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  const author = authorOf(p);
  const add = soldOut ? (
    <span className="brg-add off">ناموجود</span>
  ) : hasChoices(p) ? (
    <PageLink to={productPath(p)} link={view.link} className="brg-add">
      <Svg name="plus" /> انتخاب نوع جلد
    </PageLink>
  ) : (
    <Act view={view} op="add" id={p.id} className="brg-add" label="افزودن به سبد خرید">
      <Svg name="plus" /> افزودن به سبد
    </Act>
  );
  return (
    <article className={`brg-card ${mode}`} data-product={p.id}>
      <div className="brg-cover">
        <PageLink to={productPath(p)} link={view.link} className="brg-cover-pic" product={p.id}>
          {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
        </PageLink>
        {onSale(p) && !soldOut && <span className="brg-off">{fa(percentOff(p))}٪</span>}
        <div className="brg-tools">
          <Act view={view} op="wish" id={p.id} className={`brg-tool${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="brg-tool" label="مشاهده‌ی کتاب">
            <Svg name="eye" />
          </PageLink>
        </div>
        <Rating view={view} p={p} />
      </div>
      <div className="brg-card-body">
        <PageLink to={productPath(p)} link={view.link} className="brg-card-name">
          {p.name}
        </PageLink>
        {author && <small className="brg-author">{author}</small>}
        {mode === "list" && p.description && <p className="brg-card-desc">{p.description.split("\n")[0]}</p>}
        <Price view={view} p={p} />
        {add}
      </div>
    </article>
  );
}

function Trail({ view, items }: { view: View; items: { label: string; to?: string }[] }) {
  return (
    <nav className="brg-trail" aria-label="مسیر صفحه">
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
    <span className={`brg-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A horizontal row that scrolls with the arrows beside it (the page script) or by swiping. */
function Carousel({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div className="brg-car" data-brg-car="">
      <button type="button" className="brg-arrow prev" data-brg-prev="" aria-label={`${label}: قبلی`}>
        <Svg name="right" />
      </button>
      <div className={`brg-row ${className ?? ""}`} data-brg-row="">
        {children}
      </div>
      <button type="button" className="brg-arrow next" data-brg-next="" aria-label={`${label}: بعدی`}>
        <Svg name="left" />
      </button>
    </div>
  );
}

/* ───────────── Header, footer, phone bar ───────────── */

/** The announcements of the dark strip: one at a time, turned by the arrows (radios) or by themselves. */
function Strip({ view }: { view: View }) {
  const { shop, editing } = view;
  const own = (shop.announcements ?? []).filter((x) => x.trim());
  if (!own.length && !editing) return null;
  const list = own.length ? own : [""];
  const n = list.length;
  return (
    <div className={`brg-strip brg-sn${n}`}>
      {n > 1 && list.map((_, k) => <input key={k} type="radio" name="brg-strip" id={`brg-strip-${k}`} className="brg-dot" aria-label={`پیام ${fa(k + 1)}`} />)}
      {n > 1 && <input type="radio" name="brg-strip" className="brg-dot brg-auto" defaultChecked aria-label="نمایش خودکار پیام‌ها" />}
      <div className="brg-wrap brg-strip-in">
        <div className="brg-strip-msgs">
          {list.map((m, k) => (
            <p key={k} className="brg-strip-msg" {...ed(`site.shop.announcements.${k}`, "text", "پیام نوار بالا")}>
              {m || (editing ? "+ پیام نوار بالا" : "")}
            </p>
          ))}
        </div>
        {n > 1 && (
          <div className="brg-strip-nav">
            {list.map((_, k) => (
              <span key={k} className="brg-strip-pair">
                <label htmlFor={`brg-strip-${(k + n - 1) % n}`} className="prev" aria-label="پیام قبلی">
                  <Svg name="right" />
                </label>
                <label htmlFor={`brg-strip-${(k + 1) % n}`} className="next" aria-label="پیام بعدی">
                  <Svg name="left" />
                </label>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const isHere = (view: View, to: string) => (to === "/shop" ? view.page === "/shop" || view.page.startsWith("/category/") : to === "/blog" ? view.page.startsWith("/blog") : view.page === to);

/** The shop's categories that have books. */
function catsOf(shop: Shop) {
  const products = visible(shop);
  return (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
}

/** The logo: the owner's picture, or an open book drawn beside the shop's name. */
function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className="brg-logo">
      {logo ? (
        <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} />
      ) : (
        <>
          <span className="brg-logo-mark" aria-hidden="true">
            <Svg name="book" />
          </span>
          <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>
        </>
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
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  const faq = (shop.faq ?? []).some((x) => x.q.trim() && x.a.trim());
  const q = view.page === "/shop" || view.page.startsWith("/category/") ? visitor.query : {};
  const tel = b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : "#";
  return (
    <>
      {blockOn(data, "strip") && <Strip view={view} />}
      <header className="brg-header">
        <div className="brg-wrap brg-header-in">
          <Logo view={view} />
          <form method="get" action={link("/shop")} className="brg-search">
            <label className="brg-search-cat">
              <span className="sr-only">دسته</span>
              <select name="cat" defaultValue={q.cat ?? ""}>
                <option value="">همه</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Svg name="down" />
            </label>
            <input name="q" placeholder="نام کتاب یا نویسنده را بنویسید…" aria-label="جستجوی کتاب" defaultValue={q.q} />
            <button type="submit">
              <Svg name="search" /> جستجو
            </button>
          </form>
          <div className="brg-icons">
            <PageLink to="/account" link={link} className="brg-icon" label={visitor.customer ? "حساب کاربری" : "ورود"}>
              <Svg name="user" />
            </PageLink>
            <PageLink to="/wishlist" link={link} className="brg-icon" label="علاقه‌مندی‌ها">
              <Svg name="heart" />
              <i>{fa(wishes)}</i>
            </PageLink>
            <PageLink to="/cart" link={link} className="brg-icon" label="سبد خرید">
              <Svg name="cart" />
              <i>{fa(count)}</i>
            </PageLink>
          </div>
          {/* The phone menu opens without scripts: a details element whose summary turns into the close button. */}
          <details className="brg-burger">
            <summary aria-label="منو">
              <span />
            </summary>
            <div className="brg-drawer">
              <form method="get" action={link("/shop")} className="brg-drawer-search">
                <input name="q" placeholder="جستجوی کتاب…" aria-label="جستجوی کتاب" />
                <button type="submit" aria-label="جستجو">
                  <Svg name="search" />
                </button>
              </form>
              <nav>
                <PageLink to="/" link={link} current={view.page === "/"}>
                  خانه
                </PageLink>
                <PageLink to="/shop" link={link} current={isHere(view, "/shop")}>
                  فروشگاه
                </PageLink>
                {hasBlog(data) && (
                  <PageLink to="/blog" link={link} current={isHere(view, "/blog")}>
                    بلاگ
                  </PageLink>
                )}
                {pages
                  .filter((p) => p.slug === "about")
                  .map((p) => (
                    <PageLink key={p.id} to={`/page/${p.slug}`} link={link} current={view.page === `/page/${p.slug}`}>
                      {p.title}
                    </PageLink>
                  ))}
                <PageLink to="/wishlist" link={link} current={view.page === "/wishlist"}>
                  علاقه‌مندی‌ها
                </PageLink>
                <PageLink to="/contact" link={link} current={view.page === "/contact"}>
                  تماس با ما
                </PageLink>
              </nav>
              <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
                <a className="brg-drawer-phone" href={tel}>
                  <Svg name="phone" /> <span dir="ltr">{b.phone}</span>
                </a>
              </Opt>
            </div>
          </details>
        </div>
      </header>
      <div className="brg-menu">
        <div className="brg-wrap brg-menu-in">
          <nav className="brg-nav">
            <PageLink to="/" link={link} current={view.page === "/"}>
              خانه
            </PageLink>
            <div className="brg-drop" tabIndex={-1}>
              <PageLink to="/shop" link={link} current={isHere(view, "/shop")}>
                فروشگاه <Svg name="down" className="brg-ico brg-caret" />
              </PageLink>
              {cats.length > 0 && (
                <div className="brg-drop-panel">
                  {cats.map((c) => (
                    <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
                      {c.name}
                    </PageLink>
                  ))}
                </div>
              )}
            </div>
            {hasBlog(data) && (
              <PageLink to="/blog" link={link} current={isHere(view, "/blog")}>
                بلاگ
              </PageLink>
            )}
            {(pages.length > 0 || faq) && (
              <div className="brg-drop" tabIndex={-1}>
                <span className="brg-drop-btn" tabIndex={0}>
                  صفحه‌ها <Svg name="down" className="brg-ico brg-caret" />
                </span>
                <div className="brg-drop-panel">
                  {pages.map((p) => (
                    <PageLink key={p.id} to={`/page/${p.slug}`} link={link} current={view.page === `/page/${p.slug}`}>
                      {p.title}
                    </PageLink>
                  ))}
                  {faq && (
                    <PageLink to="/faq" link={link} current={view.page === "/faq"}>
                      سؤالات متداول
                    </PageLink>
                  )}
                  <PageLink to="/wishlist" link={link}>
                    علاقه‌مندی‌ها
                  </PageLink>
                </div>
              </div>
            )}
            <PageLink to="/contact" link={link} current={view.page === "/contact"}>
              تماس با ما
            </PageLink>
          </nav>
          <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
            <a className="brg-help" href={tel}>
              به کمک نیاز دارید؟ تماس بگیرید: <b dir="ltr">{b.phone}</b>
            </a>
          </Opt>
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
  const about = pages.find((p) => p.slug === "about");
  const other = pages.filter((p) => p.slug !== "about");
  const faq = (shop.faq ?? []).some((x) => x.q.trim() && x.a.trim());
  return (
    <footer className="brg-foot">
      {blockOn(data, "newsletter") && (
        <div className="brg-news">
          <div className="brg-wrap brg-news-in">
            <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>
              <h3 {...ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>{shop.newsletterTitle}</h3>
            </Opt>
            <div className="brg-news-text">
              <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "multiline", "متن خبرنامه")}>
                <p {...ed("site.shop.newsletterText", "multiline", "متن خبرنامه")}>{shop.newsletterText}</p>
              </Opt>
            </div>
            <Socials ctx={ctx} editing={editing} className="brg-socials" />
          </div>
        </div>
      )}
      <div className="brg-wrap brg-foot-cols">
        <div className="brg-foot-about">
          <Logo view={view} />
          <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن پایین صفحه")}>
            <p {...ed("site.aboutText", "multiline", "متن پایین صفحه")}>{site?.aboutText}</p>
          </Opt>
          <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
            <a className="brg-foot-phone" href={b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : "#"} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          </Opt>
          <Opt value={b.email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
            <a className="brg-foot-mail" href={b.email ? `mailto:${b.email}` : "#"} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          </Opt>
        </div>
        <div>
          <h4>دسته‌ها</h4>
          {catsOf(shop)
            .slice(0, 6)
            .map((c) => (
              <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
                {c.name}
              </PageLink>
            ))}
        </div>
        <div>
          <h4>لینک‌های مفید</h4>
          {other.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
          {faq && (
            <PageLink to="/faq" link={link}>
              سؤالات متداول
            </PageLink>
          )}
          <PageLink to="/support" link={link}>
            پشتیبانی
          </PageLink>
        </div>
        <div>
          <h4>بیشتر بدانید</h4>
          {about && (
            <PageLink to={`/page/${about.slug}`} link={link}>
              {about.title}
            </PageLink>
          )}
          <PageLink to="/contact" link={link}>
            نشانی فروشگاه‌ها
          </PageLink>
          <PageLink to="/shop" link={link}>
            همه‌ی کتاب‌ها
          </PageLink>
          {hasBlog(data) && (
            <PageLink to="/blog" link={link}>
              بلاگ
            </PageLink>
          )}
        </div>
        <div>
          <h4>در ارتباط باشید</h4>
          <PageLink to="/account" link={link}>
            حساب کاربری
          </PageLink>
          <PageLink to="/account" link={link}>
            پیگیری سفارش
          </PageLink>
          <PageLink to="/wishlist" link={link}>
            علاقه‌مندی‌ها
          </PageLink>
          <PageLink to="/contact" link={link}>
            تماس با ما
          </PageLink>
        </div>
      </div>
      <div className="brg-wrap brg-foot-end">
        <span>
          © {fa(new Date().getFullYear())} <b>{b.fullName}</b>. همه‌ی حقوق محفوظ است.
        </span>
        {blockOn(data, "payments") && (shop.trustLogos ?? []).some((x) => safeUrl(x.image)) && (
          <span className="brg-pays">
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
      <a href="#" className="brg-top" aria-label="بالای صفحه">
        <Svg name="up" />
      </a>
    </footer>
  );
}

/** The phone tab bar of the design: search, account and cart (only on narrow screens). */
function BottomNav({ link, page, visitor, shop }: View) {
  const count = priceCart(shop, visitor.cart).count;
  const items: [string, string, string][] = [
    ["/search", "search", "جستجو"],
    ["/account", "user", "حساب"],
    ["/cart", "cart", "سبد خرید"],
  ];
  return (
    <nav className="brg-tabbar" aria-label="منوی پایین">
      {items.map(([to, icon, label]) => (
        <PageLink key={to} to={to} link={link} current={page === to} label={label}>
          <Svg name={icon} />
          {to === "/cart" && count > 0 && <b>{fa(count)}</b>}
        </PageLink>
      ))}
    </nav>
  );
}

/* ───────────── Home ───────────── */

/** The wavy round badge of the hero ("۱۵٪ تخفیف"). */
function Badge({ text, path, editing }: { text?: string; path: string; editing: boolean }) {
  return (
    <Opt value={text} editing={editing} edit={ed(path, "text", "متن نشان گرد اسلایدر")}>
      <span className="brg-badge" {...ed(path, "text", "متن نشان گرد اسلایدر")}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d={wavy} />
        </svg>
        <b>{text}</b>
      </span>
    </Opt>
  );
}

/** A circle with sixteen soft bumps. */
const wavy = (() => {
  const pts: string[] = [];
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const r = 44 + 4 * Math.cos(a * 16);
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/** Home page slider. It works without scripts: hidden radio buttons pick the slide, the dots are their labels. */
function Hero({ view }: { view: View }) {
  const { shop, link, editing } = view;
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  return (
    <section className={`brg-hero brg-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="brg-hero" id={`brg-hero-${k}`} className="brg-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {/* Checked until a dot is used: the slides then turn by themselves (paused under the pointer). */}
      {n > 1 && <input type="radio" name="brg-hero" className="brg-dot brg-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="brg-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className="brg-slide">
              <div className="brg-wrap brg-slide-in">
                <div className="brg-slide-text">
                  <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط کوچک بالای تیتر")}>
                    <span className="brg-kicker" {...ed("site.shop.heroKicker", "text", "خط کوچک بالای تیتر")}>
                      {shop.heroKicker}
                    </span>
                  </Opt>
                  <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                    <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                  </Opt>
                  <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "multiline", "متن اسلاید")}>
                    <p {...ed(at(s.id, "text"), "multiline", "متن اسلاید")}>{s.text}</p>
                  </Opt>
                  <PageLink to="/shop" link={link} className="brg-pill">
                    همین حالا ببینید <Svg name="left" />
                  </PageLink>
                </div>
                <div className="brg-slide-art">
                  <Badge text={shop.promoText} path="site.shop.promoText" editing={editing} />
                  <span className="brg-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                    {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="brg-dots">
          {slides.map((s, k) => (
            <label key={s.id} htmlFor={`brg-hero-${k}`} title={`اسلاید ${fa(k + 1)}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/** The moving band of numbers ("۱۵٬۲۵۴ عنوان کتاب ✱ ۱٬۲۵۸ نویسنده …"), repeated so it never ends. */
function Ticker({ view }: { view: View }) {
  const stats = (view.shop.stats ?? []).filter((s) => s.value.trim() || s.label.trim());
  if (!stats.length) return null;
  const one = (copy: number) =>
    stats.map((s) => {
      const at = item("site.shop.stats", s.id);
      return (
        <span key={`${copy}-${s.id}`} className="brg-tick" aria-hidden={copy > 0 || undefined}>
          <i className="brg-star" aria-hidden="true">
            ✱
          </i>
          <b {...(copy === 0 ? ed(`${at}.value`, "text", "عدد") : {})}>{s.value}</b>
          <span {...(copy === 0 ? ed(`${at}.label`, "text", "عنوان عدد") : {})}>{s.label}</span>
        </span>
      );
    });
  return (
    <section className="brg-ticker">
      <div className="brg-ticker-run">
        {one(0)}
        {one(1)}
        {one(2)}
        {one(3)}
      </div>
    </section>
  );
}

type BannerT = NonNullable<Shop["banners"]>[number];

/** A banner: the picture fills it, a small coloured kicker, a white title and a white pill button. */
function Banner({ view, b, className }: { view: View; b: BannerT; className?: string }) {
  const at = item("site.shop.banners", b.id);
  const href = safeUrl(b.link);
  const { editing } = view;
  const inner = (
    <>
      <Pic src={b.image} path={`${at}.image`} label="عکس بنر" className="brg-banner-pic" />
      <span className="brg-banner-text">
        <Opt value={b.kicker} editing={editing} edit={ed(`${at}.kicker`, "text", "خط کوچک بنر")}>
          <small {...ed(`${at}.kicker`, "text", "خط کوچک بنر")}>{b.kicker}</small>
        </Opt>
        <Opt value={b.title} editing={editing} edit={ed(`${at}.title`, "text", "عنوان بنر")}>
          <b {...ed(`${at}.title`, "text", "عنوان بنر")}>{b.title}</b>
        </Opt>
        <Opt value={b.text} editing={editing} edit={ed(`${at}.text`, "text", "متن بنر")}>
          <span {...ed(`${at}.text`, "text", "متن بنر")}>{b.text}</span>
        </Opt>
        <i className="brg-pill small">
          {className?.includes("wide") ? "همین حالا ببینید" : "خرید کنید"} <Svg name="left" />
        </i>
      </span>
    </>
  );
  return href ? (
    <a href={href} className={`brg-banner ${className ?? ""}`} {...outside(href)}>
      {inner}
    </a>
  ) : (
    <PageLink to="/shop" link={view.link} className={`brg-banner ${className ?? ""}`}>
      {inner}
    </PageLink>
  );
}

const PERK_ICONS = ["box", "gift", "tag", "store"];

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = catsOf(shop);
  const banners = (shop.banners ?? []).filter((x) => !x.hidden);
  const wide = banners[0];
  const three = banners.slice(1, 4);
  const highlights = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 6);
  const best = [...products].reverse().slice(0, 6);
  const sale = saleProducts(products).slice(0, 6);
  const big = products.find((p) => p.id === shop.lookProductId) ?? sale[0] ?? products[0];
  const picks = products.filter((p) => p.id !== big?.id && !sale.slice(0, 2).some((s) => s.id === p.id)).slice(0, 6);
  const authors = (site?.clients ?? []).filter((c) => c.name.trim());
  const quotes = (site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  const avg = quotes.length ? quotes.reduce((s, t) => s + (t.rating ?? 5), 0) / quotes.length : 5;
  const perks = (shop.perks ?? []).filter((x) => x.title.trim());
  const posts = livePosts(shop).slice(0, 3);
  return (
    <>
      {on("hero") && <Hero view={view} />}
      {on("stats") && <Ticker view={view} />}

      {on("highlights") && highlights.length > 0 && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={shop.newTitle} titlePath="site.shop.newTitle" to="/shop" />
          <div className="brg-books">
            {highlights.map((p) => (
              <Card key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}

      {on("categories") && cats.length > 0 && (
        <section className="brg-cats-sec">
          <div className="brg-wrap brg-sec brg-rise">
            <Head view={view} title={shop.discoverTitle} titlePath="site.shop.discoverTitle" to="/shop" />
            <div className="brg-cats">
              {cats.slice(0, 8).map((c) => {
                const src = safeUrl(c.image);
                return (
                  <PageLink key={c.id} to={`/category/${c.id}`} link={link} className="brg-cat">
                    <span className="brg-cat-ico">{src ? <img src={src} alt="" loading="lazy" /> : <Svg name="book" />}</span>
                    <b>{c.name}</b>
                  </PageLink>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {on("best") && best.length > 0 && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={shop.bestTitle} titlePath="site.shop.bestTitle" to="/shop" />
          <div className="brg-books">
            {best.map((p) => (
              <Card key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}

      {on("banner") && wide && (
        <section className="brg-wrap brg-sec-sm brg-rise">
          <Banner view={view} b={wide} className="wide" />
        </section>
      )}

      {on("sale") && sale.length > 0 && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={shop.discountTitle} titlePath="site.shop.discountTitle" to="/shop" query={{ sale: "1" }} />
          <div className="brg-books">
            {sale.map((p) => (
              <Card key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}

      {((on("promos") && three.length > 0) || (on("picks") && big)) && (
        <section className="brg-cream">
          {on("promos") && three.length > 0 && (
            <div className="brg-wrap brg-promos brg-rise">
              {three.map((b) => (
                <Banner key={b.id} view={view} b={b} className="promo" />
              ))}
            </div>
          )}
          {on("picks") && big && (
            <div className="brg-wrap brg-sec brg-rise">
              <Head view={view} title={shop.lookTitle} titlePath="site.shop.lookTitle" to="/shop" />
              <div className="brg-picks">
                <article className="brg-pick-big" data-product={big.id}>
                  <PageLink to={productPath(big)} link={link} className="brg-pick-cover" product={big.id}>
                    {pic(big) && <img src={pic(big)} alt={big.name} loading="lazy" />}
                    {onSale(big) && big.stock !== 0 && <span className="brg-off">{fa(percentOff(big))}٪</span>}
                  </PageLink>
                  <div className="brg-pick-info">
                    <Stars value={view.visitor.ratings?.[big.id]?.avg ?? 5} count={view.visitor.ratings?.[big.id]?.count ?? 0} />
                    <PageLink to={productPath(big)} link={link} className="brg-pick-name">
                      {big.name}
                    </PageLink>
                    {authorOf(big) && <small className="brg-author">{authorOf(big)}</small>}
                    {big.description && <p>{big.description.split("\n")[0]}</p>}
                    <Price view={view} p={big} />
                    {big.stock !== 0 &&
                      (hasChoices(big) ? (
                        <PageLink to={productPath(big)} link={link} className="brg-add solid">
                          <Svg name="plus" /> انتخاب نوع جلد
                        </PageLink>
                      ) : (
                        <Act view={view} op="add" id={big.id} className="brg-add solid" label="افزودن به سبد خرید">
                          <Svg name="plus" /> افزودن به سبد
                        </Act>
                      ))}
                  </div>
                </article>
                {picks.length > 0 && (
                  <div className="brg-pick-list">
                    {picks.map((p) => (
                      <PageLink key={p.id} to={productPath(p)} link={link} className="brg-mini" product={p.id}>
                        <span className="brg-mini-cover">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
                        <span className="brg-mini-text">
                          <Stars value={view.visitor.ratings?.[p.id]?.avg ?? 5} count={view.visitor.ratings?.[p.id]?.count ?? 0} />
                          <b>{p.name}</b>
                          {authorOf(p) && <small>{authorOf(p)}</small>}
                          <Price view={view} p={p} />
                        </span>
                      </PageLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {on("authors") && (authors.length > 0 || editing) && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" center />
          <Carousel className="brg-authors" label="نویسندگان">
            {authors.map((c) => {
              const at = item("site.clients", c.id);
              return (
                <form key={c.id} method="get" action={link("/shop")} className="brg-author-card">
                  <input type="hidden" name="author" value={c.name} />
                  <Pic src={c.image} path={`${at}.image`} label="عکس نویسنده" className="brg-author-pic" />
                  <button type="submit" {...ed(`${at}.name`, "text", "نام نویسنده")}>
                    {c.name}
                  </button>
                </form>
              );
            })}
            {editing && (
              <span className="brg-author-card brg-add-new" {...ed("site.clients", "newimage", "افزودن نویسنده")}>
                <span className="brg-author-pic">+</span>
                <b>افزودن نویسنده</b>
              </span>
            )}
          </Carousel>
        </section>
      )}

      {on("testimonials") && quotes.length > 0 && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" />
          <div className="brg-quotes">
            <span className="brg-score">
              <b>
                {fa(Math.round(avg * 10) / 10)}
                <small>/۵</small>
              </b>
              <Stars value={avg} />
              <small>از {fa(quotes.length)} نظر</small>
            </span>
            <Carousel className="brg-quote-row" label="نظرات">
              {quotes.map((t) => {
                const at = item("site.testimonials", t.id);
                return (
                  <figure key={t.id} className="brg-quote">
                    <div className="brg-quote-top">
                      <span>
                        <b {...ed(`${at}.name`, "text", "نام")}>{t.name}</b>
                        <Stars value={t.rating ?? 5} />
                      </span>
                      <Svg name="quote" className="brg-ico brg-quote-mark" />
                    </div>
                    <Opt value={t.role} editing={editing} edit={ed(`${at}.role`, "text", "عنوان نظر")}>
                      <h3 {...ed(`${at}.role`, "text", "عنوان نظر")}>{t.role}</h3>
                    </Opt>
                    <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                  </figure>
                );
              })}
            </Carousel>
          </div>
        </section>
      )}

      {on("perks") && perks.length > 0 && (
        <section className="brg-wrap brg-perks brg-rise">
          {perks.slice(0, 4).map((x, k) => {
            const at = item("site.shop.perks", x.id);
            const src = safeUrl(x.image);
            return (
              <div key={x.id} className="brg-perk">
                {src ? <img src={src} alt="" className="brg-perk-ico" /> : <Svg name={PERK_ICONS[k % 4]!} className="brg-ico brg-perk-ico" />}
                <b {...ed(`${at}.title`, "text", "عنوان ویژگی")}>{x.title}</b>
                <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح ویژگی")}>
                  <small {...ed(`${at}.text`, "text", "توضیح ویژگی")}>{x.text}</small>
                </Opt>
              </div>
            );
          })}
        </section>
      )}

      {on("news") && hasBlog(data) && posts.length > 0 && (
        <section className="brg-wrap brg-sec brg-rise">
          <Head view={view} title={site?.styleTitle} titlePath="site.styleTitle" to="/blog" label="همه‌ی نوشته‌ها" />
          <div className="brg-news-row">
            {posts.map((p) => (
              <PostCard key={p.id} view={view} p={p} />
            ))}
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

/** One choice of a filter list: a box that is ticked while it applies; a click turns it on or off. */
function Choice({ view, here, name, value, label, count }: { view: View; here: string; name: string; value: string; label: string; count: number }) {
  const q = view.visitor.query;
  const on = q[name] === value;
  return (
    <form method="get" action={view.link(here)}>
      <Keep query={q} skip={[name, "page"]} />
      {!on && <input type="hidden" name={name} value={value} />}
      <button type="submit" className={`brg-choice${on ? " on" : ""}`} aria-pressed={on}>
        <i className="brg-box" />
        <span>{label}</span>
        <small>({fa(count)})</small>
      </button>
    </form>
  );
}

/** A side box that folds open and shut (a details element). */
function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="brg-widget" open>
      <summary>
        {title} <Svg name="down" />
      </summary>
      <div className="brg-widget-body">{children}</div>
    </details>
  );
}

/** Price filter: two boxes, a line between the lowest and the highest price, and a button. */
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
    <Fold title="قیمت">
      <form method="get" action={view.link(here)} className="brg-price-filter">
        <Keep query={q} skip={["min", "max", "page"]} />
        <div className="brg-range" aria-hidden="true">
          <i style={{ ["--a" as string]: `${((min - lo) / (hi - lo)) * 100}%`, ["--b" as string]: `${((max - lo) / (hi - lo)) * 100}%` }} />
        </div>
        <div className="brg-minmax">
          <input name="min" inputMode="numeric" defaultValue={digits(min)} aria-label="کمترین قیمت" />
          <span>تا</span>
          <input name="max" inputMode="numeric" defaultValue={digits(max)} aria-label="بیشترین قیمت" />
        </div>
        <div className="brg-range-foot">
          <small>
            قیمت: <b>{money(view, min)}</b> – <b>{money(view, max)}</b>
          </small>
          <button type="submit">فیلتر</button>
        </div>
      </form>
    </Fold>
  );
}

const PER_PAGE = 12;

function Listing(view: View & { categoryId?: string }) {
  const { shop, link, visitor, editing } = view;
  const q = visitor.query;
  const all = visible(shop);
  const base = filterProducts(all, shop.categories ?? [], q, view.categoryId);
  const { cats, cat } = base;
  const list = base.list.filter((p) => (!q.genre || genreOf(p) === q.genre) && (!q.format || formatsOf(p).includes(q.format)) && (!q.author || authorOf(p) === q.author));
  const active = base.active || Boolean(q.genre || q.format || q.author);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  const sort = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const pageNo = Math.min(pages, Math.max(1, Number(q.page) || 1));
  const shown = list.slice((pageNo - 1) * PER_PAGE, pageNo * PER_PAGE);
  const asList = q.view === "list";
  const counted = (values: (string | undefined)[]) => {
    const m = new Map<string, number>();
    values.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1));
    return [...m.entries()];
  };
  const genres = counted(all.map(genreOf));
  const formats = counted(all.flatMap(formatsOf));
  const authors = counted(all.map(authorOf));
  const upcoming = [...all].reverse().slice(0, 3);
  const side = (
    <>
      <Fold title="دسته‌ها">
        <nav className="brg-checks">
          {cats.map((c) => (
            <PageLink key={c.id} to={cat?.id === c.id ? "/shop" : `/category/${c.id}`} link={link} className={`brg-choice${cat?.id === c.id ? " on" : ""}`}>
              <i className="brg-box" />
              <span>{c.name}</span>
              <small>({fa(all.filter((p) => p.categoryId === c.id).length)})</small>
            </PageLink>
          ))}
        </nav>
      </Fold>
      {genres.length > 0 && (
        <Fold title="ژانر">
          <div className="brg-checks">
            {genres.map(([g, n]) => (
              <Choice key={g} view={view} here={here} name="genre" value={g} label={g} count={n} />
            ))}
          </div>
        </Fold>
      )}
      {formats.length > 0 && (
        <Fold title="نوع جلد">
          <div className="brg-checks">
            {formats.map(([g, n]) => (
              <Choice key={g} view={view} here={here} name="format" value={g} label={g} count={n} />
            ))}
          </div>
        </Fold>
      )}
      {authors.length > 0 && (
        <Fold title="نویسنده">
          <div className="brg-checks">
            {authors.map(([g, n]) => (
              <Choice key={g} view={view} here={here} name="author" value={g} label={g} count={n} />
            ))}
          </div>
        </Fold>
      )}
      <PriceFilter view={view} here={here} />
    </>
  );
  return (
    <>
      {(shop.newText || editing) && (
        <section className="brg-preorder">
          <div className="brg-wrap brg-preorder-in">
            <Opt value={shop.newText} editing={editing} edit={ed("site.shop.newText", "text", "متن نوار بالای فروشگاه")}>
              <h2 {...ed("site.shop.newText", "text", "متن نوار بالای فروشگاه")}>{shop.newText}</h2>
            </Opt>
            <span className="brg-preorder-books" aria-hidden="true">
              <i className="brg-soon">به‌زودی</i>
              {upcoming.map((p) => pic(p) && <img key={p.id} src={pic(p)} alt="" loading="lazy" />)}
            </span>
            {upcoming[0] && (
              <PageLink to={productPath(upcoming[0])} link={link} className="brg-preorder-go">
                پیش‌خرید
              </PageLink>
            )}
          </div>
        </section>
      )}
      <section className="brg-wrap brg-inner">
        <div className="brg-shop">
          <aside className="brg-shop-side">
            <details className="brg-filter-sm">
              <summary>
                <Svg name="filter" /> فیلتر کتاب‌ها
              </summary>
              {side}
            </details>
            <div className="brg-side-lg">{side}</div>
          </aside>
          <div>
            <div className="brg-shop-head">
              <Trail view={view} items={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : [{ label: "فروشگاه" }]} />
              <h1>{cat ? cat.name : q.author ? `کتاب‌های ${q.author}` : "همه‌ی کتاب‌ها"}</h1>
              {cat?.text ? (
                <p {...ed(`${item("site.shop.categories", cat.id)}.text`, "multiline", "توضیح دسته")}>{cat.text}</p>
              ) : (
                !cat && (
                  <Opt value={shop.bestText} editing={editing} edit={ed("site.shop.bestText", "multiline", "متن بالای فروشگاه")}>
                    <p {...ed("site.shop.bestText", "multiline", "متن بالای فروشگاه")}>{shop.bestText}</p>
                  </Opt>
                )
              )}
            </div>
            <div className="brg-toolbar">
              <div className="brg-views">
                {(["grid", "list"] as const).map((v) => (
                  <form key={v} method="get" action={link(here)}>
                    <Keep query={q} skip={["view"]} />
                    {v === "list" && <input type="hidden" name="view" value="list" />}
                    <button type="submit" aria-label={v === "list" ? "نمایش فهرستی" : "نمایش شبکه‌ای"} aria-pressed={(v === "list") === asList} className={(v === "list") === asList ? "on" : undefined}>
                      <Svg name={v} />
                    </button>
                  </form>
                ))}
              </div>
              <small>
                {list.length ? `نمایش ${fa((pageNo - 1) * PER_PAGE + 1)} تا ${fa((pageNo - 1) * PER_PAGE + shown.length)} از ${fa(list.length)} کتاب` : "بدون کتاب"}
              </small>
              <details className="brg-sort">
                <summary>
                  {sort[1]} <Svg name="down" />
                </summary>
                <div>
                  {SORTS.map(([k, label]) => (
                    <form key={k} method="get" action={link(here)}>
                      <Keep query={q} skip={["sort", "page"]} />
                      <input type="hidden" name="sort" value={k} />
                      <button type="submit" aria-current={k === sort[0] || undefined}>
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              </details>
            </div>
            {active && (
              <div className="brg-chips">
                <PageLink to={here} link={link}>
                  <Svg name="close" /> حذف همه‌ی فیلترها
                </PageLink>
              </div>
            )}
            {shown.length ? (
              <div className={asList ? "brg-list" : "brg-grid"}>
                {shown.map((p) => (
                  <Card key={p.id} view={view} p={p} mode={asList ? "list" : "shop"} />
                ))}
              </div>
            ) : (
              <p className="brg-notice">{active ? "کتابی با این فیلترها پیدا نشد؛ فیلترها را تغییر دهید." : "هنوز کتابی اضافه نشده است."}</p>
            )}
            {pages > 1 && (
              <nav className="brg-pages" aria-label="صفحه‌ها">
                {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
                  <form key={n} method="get" action={link(here)}>
                    <Keep query={q} skip={["page"]} />
                    {n > 1 && <input type="hidden" name="page" value={n} />}
                    <button type="submit" className={n === pageNo ? "on" : undefined} aria-current={n === pageNo ? "page" : undefined}>
                      {fa(n)}
                    </button>
                  </form>
                ))}
                {pageNo < pages && (
                  <form method="get" action={link(here)}>
                    <Keep query={q} skip={["page"]} />
                    <input type="hidden" name="page" value={pageNo + 1} />
                    <button type="submit" aria-label="صفحه‌ی بعد">
                      <Svg name="left" />
                    </button>
                  </form>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
    </>
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
  const author = authorOf(p);
  return (
    <>
      <section className="brg-wrap brg-inner">
        <Trail view={view} items={[...(cat ? [{ label: cat.name, to: `/category/${cat.id}` }] : [{ label: "فروشگاه", to: "/shop" }]), { label: p.name }]} />
        <div className="brg-product" data-product={p.id}>
          {/* Gallery: the thumbnails pick the large picture; the large picture opens full screen. */}
          <div className="brg-gallery">
            <div className="brg-gallery-main">
              {(imgs.length ? imgs : [undefined]).map((src, k) =>
                src ? (
                  <ZoomOpen key={k} id={`${p.id}-${k}`} className="brg-gal">
                    <span>
                      <img src={src} alt={p.name} />
                    </span>
                  </ZoomOpen>
                ) : (
                  <span key={k} className="brg-gal" />
                ),
              )}
              {onSale(p) && !soldOut && <span className="brg-off">{fa(percentOff(p))}٪</span>}
            </div>
            {imgs.length > 1 && (
              <div className="brg-thumbs">
                {imgs.map((src, k) => (
                  <label key={k} className="brg-thumb">
                    <input type="radio" name="brg-gal" defaultChecked={k === 0} aria-label={`عکس ${fa(k + 1)}`} />
                    <img src={src} alt="" />
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="brg-pinfo">
            {rating ? (
              <span className="brg-pmeta">
                <Stars value={rating.avg} count={rating.count} />
              </span>
            ) : (
              <small className="brg-muted">هنوز نظری ثبت نشده</small>
            )}
            <h1>{p.name}</h1>
            {author && (
              <form method="get" action={link("/shop")} className="brg-by">
                <input type="hidden" name="author" value={author} />
                نوشته‌ی <button type="submit">{author}</button>
              </form>
            )}
            <Price view={view} p={p} />
            {p.description && <p className="brg-pdesc">{p.description.split(/\n/)[0]}</p>}
            {soldOut ? (
              <p className="brg-notice">این کتاب فعلاً ناموجود است.</p>
            ) : (
              <form method="post" action={link("/_cart")} className="brg-buy">
                <input type="hidden" name="op" value="add" />
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="back" value="/cart" />
                <OptionPicker p={p} />
                <div className="brg-buy-row">
                  <label className="brg-qty">
                    <span className="sr-only">تعداد</span>
                    <input type="number" name="qty" min={1} max={p.stock ?? 50} defaultValue={1} />
                  </label>
                  <button type="submit" className="brg-btn">
                    <Svg name="cart" /> افزودن به سبد
                  </button>
                </div>
              </form>
            )}
            <div className="brg-plinks">
              <Act view={view} op="wish" id={p.id} className={`brg-plink${wished ? " on" : ""}`} label="علاقه‌مندی">
                <Svg name="heart" /> {wished ? "در علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
              </Act>
              <a className="brg-plink" href={`https://t.me/share/url?text=${share}`} target="_blank" rel="noopener noreferrer">
                <Icon name="telegram" className="brg-ico" /> اشتراک‌گذاری
              </a>
            </div>
            <dl className="brg-facts">
              {cat && (
                <>
                  <dt>دسته</dt>
                  <dd>
                    <PageLink to={`/category/${cat.id}`} link={link}>
                      {cat.name}
                    </PageLink>
                  </dd>
                </>
              )}
              {genreOf(p) && (
                <>
                  <dt>ژانر</dt>
                  <dd>{genreOf(p)}</dd>
                </>
              )}
              <dt>کد کتاب</dt>
              <dd dir="ltr">{p.id.toUpperCase()}</dd>
            </dl>
          </div>
        </div>
        {/* Description and reviews tabs: two radios, no script. */}
        <div className="brg-tabs">
          <input type="radio" name="brg-tab" id="brg-tab-1" defaultChecked />
          <input type="radio" name="brg-tab" id="brg-tab-2" />
          <div className="brg-tab-heads">
            <label htmlFor="brg-tab-1">معرفی کتاب</label>
            <label htmlFor="brg-tab-2">نظرات ({fa(rating?.count ?? 0)})</label>
          </div>
          <div className="brg-tab brg-tab-desc">
            {(p.description ?? "")
              .split(/\n\s*\n|\n/)
              .filter((x) => x.trim())
              .map((x, k) => (
                <p key={k}>{x}</p>
              ))}
            <SpecsTable p={p} className="brg-specs" />
          </div>
          <div className="brg-tab brg-tab-rev">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="brg-wrap brg-sec">
          <Head view={view} title="کتاب‌های مرتبط" />
          <div className="brg-books">
            {related.map((x) => (
              <Card key={x.id} view={view} p={x} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Blog ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];

const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 220 ? `${p.text.slice(0, 220).trim()}…` : p.text);

/** The small white tag on the picture: category, date and writer. */
function PostTag({ p }: { p: PostT }) {
  return (
    <span className="brg-post-tag">
      {p.category && (
        <>
          در <b>{p.category}</b>
        </>
      )}
      {p.date && <i>{day(p.date)}</i>}
      {p.author && <i>{p.author}</i>}
    </span>
  );
}

function PostCard({ view, p }: { view: View; p: PostT }) {
  const at = item("site.shop.posts", p.id);
  return (
    <article className="brg-post-card">
      <PageLink to={`/blog/${p.id}`} link={view.link} className="brg-post-pic">
        <span {...ed(`${at}.image`, "image", "عکس نوشته")}>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
        <PostTag p={p} />
      </PageLink>
      <PageLink to={`/blog/${p.id}`} link={view.link}>
        <h3 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h3>
      </PageLink>
    </article>
  );
}

function BlogSide({ view, skip }: { view: View; skip?: string }) {
  const all = livePosts(view.shop);
  const recent = all.filter((p) => p.id !== skip).slice(0, 4);
  const cats = new Map<string, number>();
  all.forEach((p) => p.category && cats.set(p.category, (cats.get(p.category) ?? 0) + 1));
  const gallery = all.map((p) => safeUrl(p.image)).filter((u): u is string => Boolean(u)).slice(0, 6);
  return (
    <aside className="brg-blog-side">
      <form method="get" action={view.link("/blog")} className="brg-side-search">
        <input name="q" placeholder="جستجو…" aria-label="جستجو در بلاگ" defaultValue={view.page === "/blog" ? view.visitor.query.q : undefined} />
        <button type="submit" aria-label="جستجو">
          <Svg name="search" />
        </button>
      </form>
      <div className="brg-side-box">
        <h3>آخرین نوشته‌ها</h3>
        {recent.map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link} className="brg-mini-post">
            <span className="brg-mini-pic">{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <span>
              <small>{day(p.date)}</small>
              <b>{p.title}</b>
            </span>
          </PageLink>
        ))}
      </div>
      {cats.size > 0 && (
        <div className="brg-side-box">
          <h3>دسته‌های بلاگ</h3>
          <div className="brg-blog-cats">
            {[...cats.entries()].map(([c, n]) => (
              <form key={c} method="get" action={view.link("/blog")}>
                <input type="hidden" name="cat" value={c} />
                <button type="submit">
                  <span>{c}</span>
                  <small>({fa(n)})</small>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
      {gallery.length > 0 && (
        <div className="brg-side-box">
          <h3>گالری</h3>
          <div className="brg-side-gallery">
            {gallery.map((src, k) => (
              <img key={k} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function BlogTop({ view, title }: { view: View; title: string }) {
  const img = safeUrl(view.ctx.data.site?.heroImage);
  return (
    <section className="brg-blog-top" {...ed("site.heroImage", "image", "عکس بالای بلاگ")}>
      {img && <img src={img} alt="" />}
      <div className="brg-blog-top-in">
        <Trail view={view} items={[{ label: "بلاگ" }]} />
        <h1>{title}</h1>
      </div>
    </section>
  );
}

const POSTS_PER_PAGE = 6;

function Blog(view: View) {
  const q = view.visitor.query;
  const words = (q.q ?? "").trim().split(/\s+/).filter(Boolean);
  const posts = livePosts(view.shop).filter((p) => (!q.cat || p.category === q.cat) && words.every((w) => `${p.title} ${p.text}`.includes(w)));
  const pages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pageNo = Math.min(pages, Math.max(1, Number(q.page) || 1));
  return (
    <>
      <BlogTop view={view} title={q.cat ? q.cat : "بلاگ"} />
      <section className="brg-wrap brg-inner">
        <div className="brg-blog">
          <div className="brg-posts">
            {posts.length === 0 && <p className="brg-notice">نوشته‌ای پیدا نشد.</p>}
            {posts.slice((pageNo - 1) * POSTS_PER_PAGE, pageNo * POSTS_PER_PAGE).map((p) => {
              const at = item("site.shop.posts", p.id);
              return (
                <article key={p.id} className="brg-post">
                  <PageLink to={`/blog/${p.id}`} link={view.link} className="brg-post-pic">
                    <span {...ed(`${at}.image`, "image", "عکس نوشته")}>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
                    <PostTag p={p} />
                  </PageLink>
                  <PageLink to={`/blog/${p.id}`} link={view.link}>
                    <h2 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h2>
                  </PageLink>
                  <p {...ed(p.excerpt ? `${at}.excerpt` : `${at}.text`, "multiline", p.excerpt ? "خلاصه‌ی نوشته" : "متن نوشته")}>{excerptOf(p)}</p>
                  <PageLink to={`/blog/${p.id}`} link={view.link} className="brg-more">
                    ادامه‌ی مطلب
                  </PageLink>
                </article>
              );
            })}
            {pages > 1 && (
              <nav className="brg-pages" aria-label="صفحه‌ها">
                {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
                  <form key={n} method="get" action={view.link("/blog")}>
                    <Keep query={q} skip={["page"]} />
                    {n > 1 && <input type="hidden" name="page" value={n} />}
                    <button type="submit" className={n === pageNo ? "on" : undefined} aria-current={n === pageNo ? "page" : undefined}>
                      {fa(n)}
                    </button>
                  </form>
                ))}
              </nav>
            )}
          </div>
          <BlogSide view={view} />
        </div>
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const p = livePosts(view.shop).find((x) => x.id === view.id)!;
  const at = item("site.shop.posts", p.id);
  return (
    <section className="brg-wrap brg-inner">
      <Trail view={view} items={[{ label: "بلاگ", to: "/blog" }, { label: p.title }]} />
      <div className="brg-blog">
        <article className="brg-post brg-post-full">
          <span className="brg-post-pic" {...ed(`${at}.image`, "image", "عکس نوشته")}>
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" />}
            <PostTag p={p} />
          </span>
          <h1 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h1>
          <div className="brg-post-text" {...ed(`${at}.text`, "multiline", "متن نوشته")}>
            {p.text
              .split(/\n\s*\n|\n/)
              .filter((x) => x.trim())
              .map((x, k) => (
                <p key={k}>{x}</p>
              ))}
          </div>
          <PageLink to="/blog" link={view.link} className="brg-more">
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
  const { ctx, editing } = view;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const stores = (site?.gallery ?? []).filter((g) => g.title.trim());
  return (
    <section className="brg-wrap brg-inner">
      <Trail view={view} items={[{ label: "تماس با ما" }]} />
      {embed ? (
        <div className="brg-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
          <a href={map ?? "#"} {...outside(map)} className="brg-btn ghost" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
            <Svg name="pin" /> مسیریابی روی نقشه
          </a>
        </Opt>
      )}
      <div className="brg-contact">
        <div className="brg-contact-form">
          <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر فرم تماس")}>
            <h1 {...ed("site.contactTitle", "text", "تیتر فرم تماس")}>{site?.contactTitle}</h1>
          </Opt>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن فرم تماس")}>
            <p {...ed("site.contactText", "multiline", "متن فرم تماس")}>{site?.contactText}</p>
          </Opt>
          <form method="post" action={view.link("/_form")}>
            <FormMeta kind="contact" back={view.page} />
            <label className="full">
              موضوع و پیام
              <textarea name="message" required rows={4} />
            </label>
            <label>
              نام شما
              <input name="name" autoComplete="name" />
            </label>
            <label>
              ایمیل یا تلفن شما
              <input name="email" dir="ltr" autoComplete="email" />
            </label>
            <button type="submit" className="brg-btn">
              ارسال درخواست <Svg name="left" />
            </button>
          </form>
        </div>
        <div className="brg-stores">
          <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر فروشگاه‌ها")}>
            <h2 {...ed("site.aboutTitle", "text", "تیتر فروشگاه‌ها")}>{site?.aboutTitle}</h2>
          </Opt>
          <div className="brg-store-row">
            {stores.map((g) => {
              const at = item("site.gallery", g.id);
              const lines = (g.description ?? "").split("\n").filter((x) => x.trim());
              return (
                <div key={g.id} className="brg-store">
                  <Pic src={g.image} path={`${at}.image`} label="عکس فروشگاه" className="brg-store-pic" />
                  <b {...ed(`${at}.title`, "text", "نام فروشگاه")}>{g.title}</b>
                  <div className="brg-store-lines" {...ed(`${at}.description`, "multiline", "نشانی، تلفن و ساعت کاری (هر کدام در یک خط)")}>
                    {lines.map((l, k) => (
                      <span key={k}>{l}</span>
                    ))}
                  </div>
                </div>
              );
            })}
            {editing && (
              <span className="brg-store brg-add-new" {...ed("site.gallery.store", "newimage", "افزودن فروشگاه")}>
                + افزودن فروشگاه
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Cart, wishlist, search ───────────── */

function PageHead({ title, view, trail }: { title: string; view: View; trail?: { label: string; to?: string }[] }) {
  return (
    <div className="brg-page-head">
      <Trail view={view} items={trail ?? [{ label: title }]} />
      <h1>{title}</h1>
    </div>
  );
}

function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="brg-wrap brg-inner">
      <PageHead view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <div className="brg-empty">
          <p>سبد خرید شما خالی است.</p>
          <PageLink to="/shop" link={link} className="brg-btn">
            رفتن به فروشگاه
          </PageLink>
        </div>
      ) : (
        <div className="brg-cart">
          <div className="brg-table">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="brg-line">
                <PageLink to={productPath(l.product)} link={link} className="brg-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="brg-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && (
                    <small>
                      {l.product.options?.[0]?.name || l.product.optionLabel || "نوع"}: {l.size}
                    </small>
                  )}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="brg-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    <Svg name="plus" />
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    <Svg name="minus" />
                  </Act>
                </div>
                <b className="brg-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="brg-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="brg-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <dl>
              <dt>جمع کتاب‌ها ({fa(cart.count)})</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="brg-minus">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="brg-btn wide">
              ادامه‌ی خرید
            </PageLink>
          </aside>
        </div>
      )}
    </section>
  );
}

/** The wishlist as in the design: a table of the books, each with its price and an "add to cart" button. */
function Wishlist(view: View) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <section className="brg-wrap brg-inner">
      <Trail view={view} items={[{ label: "علاقه‌مندی‌ها" }]} />
      {items.length === 0 ? (
        <p className="brg-wish-empty">هیچ کتابی در فهرست علاقه‌مندی‌ها نیست!</p>
      ) : (
        <div className="brg-wish">
          {items.map((p) => (
            <div key={p.id} className="brg-wish-row">
              <PageLink to={productPath(p)} link={view.link} className="brg-wish-pic">
                {pic(p) && <img src={pic(p)} alt="" loading="lazy" />}
              </PageLink>
              <div className="brg-wish-info">
                <PageLink to={productPath(p)} link={view.link}>
                  <b>{p.name}</b>
                </PageLink>
                {authorOf(p) && <small>{authorOf(p)}</small>}
                <Price view={view} p={p} />
              </div>
              <div className="brg-wish-do">
                {p.stock === 0 ? (
                  <span className="brg-muted">ناموجود</span>
                ) : hasChoices(p) ? (
                  <PageLink to={productPath(p)} link={view.link} className="brg-btn">
                    انتخاب نوع جلد
                  </PageLink>
                ) : (
                  <Act view={view} op="add" id={p.id} className="brg-btn" label="افزودن به سبد خرید">
                    افزودن به سبد
                  </Act>
                )}
                <Act view={view} op="wish" id={p.id} className="brg-remove" label="حذف از علاقه‌مندی‌ها">
                  <Svg name="close" />
                </Act>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Search(view: View) {
  const q = (view.visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const found = words.length ? visible(view.shop).filter((p) => words.every((w) => `${p.name} ${authorOf(p) ?? ""} ${p.description ?? ""}`.includes(w))) : [];
  return (
    <section className="brg-wrap brg-inner">
      <PageHead view={view} title="جستجو" />
      <form method="get" action={view.link("/search")} className="brg-search brg-search-big">
        <input name="q" defaultValue={q} placeholder="نام کتاب یا نویسنده…" aria-label="جستجو" />
        <button type="submit">
          <Svg name="search" /> جستجو
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="brg-grid wide">
            {found.map((p) => (
              <Card key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        ) : (
          <p className="brg-notice">کتابی با «{q}» پیدا نشد.</p>
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
      <section className="brg-wrap brg-inner">
        <PageHead view={view} title="ثبت سفارش" />
        <div className="brg-empty">
          <p>سبد خرید شما خالی است؛ اول چند کتاب اضافه کنید.</p>
          <PageLink to="/shop" link={link} className="brg-btn">
            رفتن به فروشگاه
          </PageLink>
        </div>
      </section>
    );
  return (
    <section className="brg-wrap brg-inner">
      <PageHead view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <div className="brg-cart">
        <form method="post" action={link("/_order")} className="brg-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="brg-error">{error}</p>}
          {!me && (
            <p className="full brg-muted">
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
          <input name="website" tabIndex={-1} autoComplete="off" className="brg-trap" aria-hidden="true" />
          <button type="submit" className="brg-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="brg-sum">
          <h2>سفارش شما</h2>
          <ul className="brg-sum-lines">
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
                <dd className="brg-minus">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="brg-pay-note" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
    <section className="brg-wrap brg-inner">
      <PageHead view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="brg-wrap brg-inner">
      <div className="brg-thanks">
        <span className="brg-done" aria-hidden="true">
          <Svg name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="brg-pay-note">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="brg-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}

/* ───────────── Example content (in Persian) ───────────── */

export function bargSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const book = (n: string) => sampleImage(`brg-book-${n}`);
  const img = (n: string) => sampleImage(`brg-${n}`);
  const icon = (n: string) => sampleImage(`brg-cat-${n}`, "svg");
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const who = ["سیمین افشار", "کاوه رادمنش", "نگار صدری", "آرش کیانی", "مهسا نوری", "بهرام ستوده", "رضا امینی", "لیلا فرهمند"];
  const specs = (author: string, genre: string, pages: string, year: string) => [
    { label: "نویسنده", value: author },
    { label: "ژانر", value: genre },
    { label: "تعداد صفحه", value: pages },
    { label: "سال انتشار", value: year },
  ];
  // Two covers, two prices: the book's price range shows on its card.
  const covers = (soft: number, hard: number) => ({
    options: [{ name: "نوع جلد", values: [{ label: "شومیز" }, { label: "گالینگور" }] }],
    variants: [
      { key: "شومیز", price: soft },
      { key: "گالینگور", price: hard },
    ],
  });
  const text = (first: string) => `${first}\nداستانی پرکشش با شخصیت‌هایی که تا مدت‌ها با شما می‌مانند. ترجمه‌ای روان و ویرایش‌شده، با چاپ و صحافی باکیفیت.`;
  const products: Product[] = [
    { id: "b1", name: "جادوگری که به خانه می‌آید", categoryId: "k8", price: 395000, salePrice: 292000, stock: 18, featured: true, images: [book("sorcery")], description: text("زنی که برای نجات خانواده‌اش با جادوی ممنوعه روبه‌رو می‌شود."), specs: specs(who[0]!, "رمان", "۳۸۴", "۱۴۰۳") },
    { id: "b2", name: "پاک‌شدگی", categoryId: "k3", price: 245000, stock: 22, featured: true, images: [book("erasure")], description: text("طنزی تلخ درباره‌ی نویسنده‌ای که از کلیشه‌ها خسته شده است."), specs: specs(who[1]!, "طنز", "۲۹۶", "۱۴۰۲") },
    { id: "b3", name: "ایلیاد", categoryId: "k6", price: 420000, stock: 9, featured: true, images: [book("iliad")], description: text("حماسه‌ی جاودانه‌ی جنگ تروا در ترجمه‌ای تازه."), specs: specs(who[2]!, "حماسه", "۶۴۰", "۱۴۰۱") },
    { id: "b4", name: "استحقاق", categoryId: "k2", price: 280000, stock: 14, featured: true, images: [book("entitlement")], description: text("داستان زنی جوان در شهری بزرگ و خانواده‌ای که او را به چالش می‌کشد."), specs: specs(who[3]!, "رمان", "۳۲۰", "۱۴۰۳") },
    { id: "b5", name: "کشتار مهتابی", categoryId: "k1", price: 259000, stock: 30, featured: true, images: [book("moonlit")], description: text("معمایی شبانه در روستایی دورافتاده که هیچ‌کس در آن بی‌گناه نیست."), specs: specs(who[4]!, "جنایی", "۲۷۲", "۱۴۰۲") },
    { id: "b6", name: "گم‌شده و گرفتار", categoryId: "k4", price: 319000, stock: 12, featured: true, images: [book("lassoed")], description: text("عشقی ناگهانی در دل دشت‌های غرب وحشی."), specs: specs(who[5]!, "عاشقانه", "۳۴۸", "۱۴۰۳") },
    { id: "b7", name: "میزی برای دو نفر", categoryId: "k3", price: 230000, stock: 25, images: [book("table")], description: text("مجموعه‌ای از داستان‌های کوتاه درباره‌ی دیدارهای ناتمام."), specs: specs(who[6]!, "داستان کوتاه", "۲۵۶", "۱۴۰۱") },
    { id: "b8", name: "تاج شیشه‌ای", categoryId: "k8", price: 285000, stock: 16, images: [book("throne")], description: text("دختری که برای آزادی باید در مسابقه‌ای مرگبار پیروز شود."), specs: specs(who[7]!, "فانتزی", "۴۱۶", "۱۴۰۲"), ...covers(285000, 345000) },
    { id: "b9", name: "قدیس درهای روشن", categoryId: "k8", price: 329000, stock: 11, images: [book("saint")], description: text("پسری که برای کشتن به دنیا آمده و راه دیگری انتخاب می‌کند."), specs: specs(who[0]!, "فانتزی", "۳۶۰", "۱۴۰۳") },
    { id: "b10", name: "دختر را فراموش نکن", categoryId: "k1", price: 299000, salePrice: 149000, stock: 20, images: [book("girl")], description: text("رازی بیست‌ساله که با بازگشت یک دوست قدیمی دوباره زنده می‌شود."), specs: specs(who[1]!, "جنایی", "۳۱۲", "۱۴۰۲"), badge: "نیم‌بها" },
    { id: "b11", name: "افسانه‌ها و لاته‌ها", categoryId: "k8", price: 340000, salePrice: 276000, stock: 15, images: [book("legends")], description: text("جنگجویی بازنشسته که می‌خواهد کافه‌ای کوچک باز کند."), specs: specs(who[2]!, "فانتزی", "۳۰۴", "۱۴۰۲") },
    { id: "b12", name: "معاوضه‌ی کتاب", categoryId: "k4", price: 268000, salePrice: 134000, stock: 19, images: [book("swap")], description: text("دو غریبه که از یادداشت‌های حاشیه‌ی کتاب‌ها عاشق هم می‌شوند."), specs: specs(who[3]!, "عاشقانه", "۲۸۸", "۱۴۰۳") },
    { id: "b13", name: "خیلی تشنه", categoryId: "k1", price: 255000, salePrice: 212000, stock: 13, images: [book("thirsty")], description: text("سفری آخر هفته که به کابوسی خون‌آشامی تبدیل می‌شود."), specs: specs(who[4]!, "وحشت", "۲۶۴", "۱۴۰۲") },
    { id: "b14", name: "سفر نفرین‌شدگان", categoryId: "k8", price: 315000, salePrice: 158000, stock: 10, images: [book("voyage")], description: text("قتلی بر عرشه‌ی کشتی‌ای که هیچ‌کس نمی‌تواند از آن پیاده شود."), specs: specs(who[5]!, "فانتزی", "۵۱۲", "۱۴۰۳"), ...covers(158000, 210000) },
    { id: "b15", name: "بخشایش", categoryId: "k3", price: 335000, stock: 8, images: [book("absolution")], description: text("سفری علمی به منطقه‌ای که قوانین طبیعت در آن کار نمی‌کند."), specs: specs(who[6]!, "علمی‌تخیلی", "۴۴۸", "۱۴۰۳") },
    { id: "b16", name: "پروژه‌ی هیل مری", categoryId: "k3", price: 365000, stock: 21, images: [book("hailmary")], description: text("فضانوردی تنها که برای نجات زمین باید حافظه‌اش را پس بگیرد."), specs: specs(who[7]!, "علمی‌تخیلی", "۴۹۶", "۱۴۰۲") },
    { id: "b17", name: "زمین بازی", categoryId: "k7", price: 298000, stock: 17, images: [book("playground")], description: text("زندگی‌نامه‌ای داستانی از غواصی که اقیانوس را خانه‌ی خود می‌دانست."), specs: specs(who[0]!, "زندگی‌نامه", "۳۹۲", "۱۴۰۳") },
  ];
  const post = (id: string, title: string, n: number, days: number, category: string) => ({
    id,
    title,
    image: img(`post${n}`),
    date: ago(days),
    author: "تیم برگ",
    category,
    text: "کتاب‌فروشی فقط جای خرید کتاب نیست؛ جایی است برای پیدا کردن هم‌صحبت، کشف نویسنده‌های تازه و گذراندن ساعتی آرام.\n\nدر این نوشته از تجربه‌های خودمان و پیشنهادهای خوانندگان می‌گوییم و چند کتاب را معرفی می‌کنیم که این روزها بیشتر از همه سراغشان را می‌گیرند.\n\nاگر کتاب دیگری در ذهن دارید، در بخش نظرات برایمان بنویسید تا در فهرست بعدی بیاوریم.",
  });
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "برگ",
      jobTitle: "کتاب‌فروشی آنلاین",
      avatarUrl: "",
      location: "تهران",
      email: "info@example.com",
      phone: "021 0000 0000",
      summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "eitaa", url: "https://eitaa.com/example" },
      ],
    },
    site: {
      ...base.site,
      heroImage: img("post1"),
      aboutText: "برگ کتاب‌خوان‌های همه‌ی سنین را دور هم جمع می‌کند؛ با کتاب‌های خوب، پیشنهادهای صادقانه و دیدار با نویسنده‌های محبوبشان.",
      address: "تهران، خیابان انقلاب، روبه‌روی دانشگاه، پلاک ۱۲",
      contactTitle: "ارسال درخواست",
      contactText: "فرم زیر را پر کنید، موضوع را انتخاب کنید و سؤال یا پیشنهادتان را بنویسید؛ در اولین فرصت پاسخ می‌دهیم.",
      aboutTitle: "فروشگاه‌های ما",
      styleTitle: "اخبار و رویدادها",
      mapUrl: "https://www.openstreetmap.org/#map=15/35.7010/51.3910",
      gallery: [
        { id: "st1", title: "شعبه‌ی انقلاب", image: img("post6"), description: "تهران، خیابان انقلاب، پلاک ۱۲\n۰۲۱ ۰۰۰۰ ۰۰۰۰\nشنبه تا پنجشنبه: ۹ تا ۲۱\nجمعه: ۱۰ تا ۱۸" },
        { id: "st2", title: "شعبه‌ی تجریش", image: img("post5"), description: "تهران، میدان تجریش، بازارچه‌ی کتاب\n۰۲۱ ۰۰۰۰ ۰۰۰۱\nشنبه تا پنجشنبه: ۹ تا ۲۱\nجمعه: ۱۰ تا ۱۸" },
      ],
      clients: who.map((name, k) => ({ id: `a${k + 1}`, name, image: img(`author${k + 1}`) })),
      testimonials: [
        { id: "t1", name: "سارا م.", role: "بسته‌بندی عالی", text: "کتاب‌ها با بسته‌بندی محکم و سالم رسیدند. بعد از تحویل سؤالی درباره‌ی نویسنده پرسیدم و خیلی زود جواب گرفتم.", rating: 5 },
        { id: "t2", name: "مرتضی ک.", role: "بهترین کتاب‌فروشی!", text: "خوشحالم جایی پیدا کردم که کتاب‌های کمتر دیده‌شده را هم دارد. بسته‌بندی فوق‌العاده بود و سفارش سر وقت رسید.", rating: 5 },
        { id: "t3", name: "پریسا ر.", role: "کتاب‌های خوب، پیشنهادهای خوب", text: "نه‌تنها کتاب‌های متنوعی دارند، کارکنانشان هم مهربان و راهنما هستند. تجربه‌ی خرید به‌یادماندنی‌ای بود.", rating: 5 },
        { id: "t4", name: "علی ن.", role: "پناهگاه کتاب‌خوان‌ها", text: "هر بار سر زدن به این‌جا غرق شدن در دنیای دانستن است. کیفیت کتاب‌ها و رسیدگی دقیق به مشتری بی‌نظیر است.", rating: 4 },
        { id: "t5", name: "نازنین ح.", role: "ارسال سریع", text: "سفارشم یک روزه رسید و کتاب‌ها دقیقاً همان چاپی بودند که می‌خواستم. حتماً دوباره خرید می‌کنم.", rating: 5 },
      ],
      shop: {
        announcements: ["همه‌ی کتاب‌ها دست‌کم ۱۰٪ زیر قیمت پشت جلد، هر روز", "ارسال رایگان برای خریدهای بالای یک میلیون تومان"],
        heroKicker: "یک مجموعه‌ی تازه",
        promoText: "۱۵٪ تخفیف",
        slides: [
          { id: "s1", title: "دنیای رمان‌های نوجوان", text: "تا ۱۵٪ تخفیف برای تازه‌های این فصل.", image: sampleImage("brg-slide1", "png") },
          { id: "s2", title: "رمان‌های وحشت از نویسنده‌های محبوب", text: "تازه‌ترین و هیجان‌انگیزترین کتاب‌ها را از دست ندهید.", image: sampleImage("brg-slide2", "png") },
          { id: "s3", title: "کتاب‌هایی برای شب‌های بلند", text: "داستان‌هایی که نمی‌توانید زمینشان بگذارید.", image: sampleImage("brg-slide3", "png") },
        ],
        stats: [
          { id: "n1", value: "۱۵٬۲۵۴", label: "عنوان کتاب" },
          { id: "n2", value: "۱٬۲۵۸", label: "نویسنده" },
          { id: "n3", value: "۲۰٬۸۹۸", label: "کتاب فروخته‌شده" },
          { id: "n4", value: "۹۷٪", label: "مشتری راضی" },
        ],
        newTitle: "منتخب‌های این هفته",
        discoverTitle: "دسته‌های محبوب",
        bestTitle: "پرفروش‌های این روزها",
        bestText: "کتاب محبوبتان را پیدا کنید: از پرفروش‌ها تا تازه‌واردها، از کتاب کودک و رمان جنایی تا علمی‌تخیلی.",
        discountTitle: "کتاب‌های نیم‌بها",
        lookTitle: "پیشنهاد برای شما",
        showcaseTitle: "نویسندگان محبوب",
        promoTitle: "نظر خوانندگان",
        newText: "تازه‌ترین کتاب‌های در راه را از همین حالا پیش‌خرید کنید!",
        banners: [
          { id: "w1", image: img("thriller"), kicker: "بهترین مجموعه", title: "محبوب‌ترین داستان‌های هیجانی", text: "انتخاب ما از بهترین کتاب‌های همه‌ی دوران." },
          { id: "p1", image: img("promo1"), kicker: "بازی، انیمه، زندگی", title: "کلکسیون کتاب" },
          { id: "p2", image: img("promo2"), kicker: "تازه‌های این هفته", title: "حقیقت این‌جاست" },
          { id: "p3", image: img("promo3"), kicker: "پرفروش‌های داستانی", title: "زنی در آب" },
        ],
        lookProductId: "b13",
        perks: [
          { id: "f1", title: "ارسال سریع", text: "ارسال رایگان برای خریدهای بالای یک میلیون" },
          { id: "f2", title: "بهترین قیمت و هدیه", text: "بسته‌بندی کادویی برای هر سفارش" },
          { id: "f3", title: "تخفیف روزانه", text: "هر روز یک کتاب با تخفیف ویژه" },
          { id: "f4", title: "تحویل حضوری", text: "سفارش آنلاین، تحویل از نزدیک‌ترین شعبه" },
        ],
        newsletterTitle: "از تازه‌ها باخبر باشید",
        newsletterText: "در خبرنامه‌ی ما عضو شوید تا از تازه‌ترین کتاب‌ها، تخفیف‌ها و رویدادهای نزدیک شما باخبر شوید.",
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "q1", q: "سفارش من چقدر طول می‌کشد تا برسد؟", a: "سفارش‌های تهران یک روز کاری و شهرهای دیگر دو تا چهار روز کاری می‌رسد." },
          { id: "q2", q: "کتابی که می‌خواهم موجود نیست؛ چه کنم؟", a: "از صفحه‌ی تماس نام کتاب را برایمان بنویسید؛ اگر قابل تهیه باشد خبرتان می‌کنیم." },
          { id: "q3", q: "می‌توانم کتاب را پس بدهم؟", a: "کتاب سالم و بدون استفاده را تا هفت روز پس از تحویل پس می‌گیریم." },
        ],
        pages: [
          { id: "pg1", slug: "about", title: "درباره‌ی ما", text: "برگ یک کتاب‌فروشی مستقل است که از سال ۱۳۹۵ کارش را با یک قفسه‌ی کوچک کتاب شروع کرد. امروز هزاران عنوان کتاب داریم و هنوز هم هر کتاب را خودمان می‌خوانیم و انتخاب می‌کنیم." },
          { id: "pg2", slug: "shipping", title: "شرایط ارسال", text: "سفارش‌ها در بسته‌بندی مقاوم و با پست پیشتاز یا پیک ارسال می‌شوند. هزینه‌ی ارسال در سبد خرید نمایش داده می‌شود." },
          { id: "pg3", slug: "terms", title: "قوانین و مقررات", text: "ثبت سفارش در این فروشگاه به معنی پذیرش این قوانین است. قیمت‌ها به تومان است و در لحظه‌ی ثبت سفارش ثابت می‌ماند." },
          { id: "pg4", slug: "privacy", title: "حریم خصوصی", text: "اطلاعاتی که هنگام خرید وارد می‌کنید فقط برای ارسال سفارش و پشتیبانی استفاده می‌شود و در اختیار دیگران قرار نمی‌گیرد." },
        ],
        posts: [
          post("n1", "کلاس‌ها و دورهمی‌های کتاب‌خوانی نزدیک شما", 1, 2, "پیشنهاد"),
          post("n2", "سه دلیل برای این‌که کتاب کاغذی هنوز زنده است", 2, 5, "یادداشت"),
          post("n3", "چطور کتاب‌ها را سالم و سریع به دستتان می‌رسانیم", 3, 9, "پشت صحنه"),
          post("n4", "پنج رمان جنایی که نباید از دست بدهید", 4, 13, "معرفی کتاب"),
          post("n5", "گزارشی از نمایشگاه کتاب امسال", 5, 20, "رویداد"),
          post("n6", "آیا خواندن کتاب کودک برای بزرگ‌ترها خجالت دارد؟", 6, 27, "یادداشت"),
        ],
        categories: [
          { id: "k1", name: "وحشت و جنایی", image: icon("horror") },
          { id: "k2", name: "خانواده", image: icon("family") },
          { id: "k3", name: "داستان", image: icon("fiction") },
          { id: "k4", name: "عاشقانه", image: icon("romance") },
          { id: "k5", name: "کودک", image: icon("kids") },
          { id: "k6", name: "تاریخ", image: icon("history") },
          { id: "k7", name: "زندگی‌نامه", image: icon("biography") },
          { id: "k8", name: "فانتزی", image: icon("fantasy") },
        ],
        products: [...products, { id: "b18", name: "الفبای قصه‌ها", categoryId: "k5", price: 145000, stock: 40, images: [book("swap")], description: text("کتابی رنگارنگ برای کودکانی که تازه خواندن را شروع کرده‌اند."), specs: specs(who[1]!, "کودک", "۹۶", "۱۴۰۳"), hidden: true }],
        shippingFee: 45000,
        freeShippingFrom: 1000000,
        coupons: [{ id: "d1", code: "BARG10", percent: 10, maxDiscount: 100000, active: true }],
        paymentNote: "پس از ثبت سفارش، برای هماهنگی پرداخت (کارت به کارت یا پرداخت در محل) با شما تماس می‌گیریم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
        trustLogos: [1, 2, 3, 4, 5].map((n) => ({ id: `t${n}`, image: sampleImage(`gg-pay${n}`, "svg") })),
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Barg Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.brg {
  --brg-green: var(--color-primary);
  --brg-deep: color-mix(in srgb, var(--color-primary) 45%, #04140B);
  --brg-ink: #121212;
  --brg-muted: #6F6F6F;
  --brg-line: #E9E6E0;
  --brg-cream: #F7F4EE;
  --brg-gold: #E0A95E;
  --brg-red: #E53935;
  --brg-orange: #FF8A00;
  --brg-head: "Barg Markazi", var(--font-heading), serif;
  --sk-accent: var(--brg-green);
  --sk-card: #fff;
  --sk-line: var(--brg-line);
  --sk-soft: var(--brg-cream);
  --sk-muted: var(--brg-muted);
  --sk-radius: 22px;
  --sk-card-radius: 12px;
  background: var(--color-bg);
  color: var(--brg-ink);
  font-size: 14px;
  overflow-x: clip;
}
/* The editor app styles every input (padding, border, full width); undo that here (low weight) so the
   preview looks like the published page. The template's own rules below still win. */
.brg :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; outline-offset: 2px; }
.brg :where(a) { color: inherit; text-decoration: none; }
.brg :where(button) { font: inherit; color: inherit; cursor: pointer; background: none; border: 0; padding: 0; }
.brg h1, .brg h2, .brg h3, .brg h4 { margin: 0; font-weight: 500; }
.brg p { margin: 0; }
.brg-ico { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.brg-wrap { box-sizing: border-box; width: 100%; max-width: 1770px; margin-inline: auto; padding-inline: 24px; }
.brg-act { display: contents; }
.brg .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.brg-muted { color: var(--brg-muted); }
.brg-dot { position: absolute; top: 0; left: 0; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }

/* Buttons */
.brg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; padding: 0 26px; border-radius: 999px; background: var(--brg-green); color: #fff !important; font-weight: 700; font-size: 14px; transition: background .3s, transform .3s; }
.brg-btn:hover { background: var(--brg-deep); }
.brg-btn.wide, .brg-btn.full { width: 100%; }
.brg-btn.ghost { background: #fff; color: var(--brg-ink) !important; border: 1px solid var(--brg-line); }
.brg-btn .brg-ico { width: 16px; height: 16px; }
.brg-pill { display: inline-flex; align-items: center; gap: 10px; height: 46px; padding: 0 24px; border-radius: 999px; background: #fff; color: var(--brg-ink); font-weight: 700; font-size: 14px; font-style: normal; box-shadow: 0 6px 20px rgb(0 0 0 / .06); transition: background .3s, color .3s; }
.brg-pill:hover { background: var(--brg-green); color: #fff; }
.brg-pill.small { height: 38px; padding: 0 18px; font-size: 13px; }
.brg-pill .brg-ico { width: 16px; height: 16px; }
.brg-all { display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 20px; border: 1px solid var(--brg-line); border-radius: 999px; background: #fff; font-size: 13px; font-weight: 700; white-space: nowrap; transition: border-color .3s, color .3s; }
.brg-all:hover { border-color: var(--brg-green); color: var(--brg-green); }
.brg-all .brg-ico { width: 15px; height: 15px; }

/* Announcement strip */
.brg-strip { position: relative; background: var(--brg-deep); color: #fff; }
.brg-strip-in { position: relative; display: flex; justify-content: center; align-items: center; height: 42px; }
.brg-strip-msgs { display: grid; }
.brg-strip-msg { grid-area: 1 / 1; font-size: 13px; font-weight: 700; text-align: center; opacity: 0; visibility: hidden; transition: opacity .6s, visibility .6s; }
.brg-strip-msg:only-child, ${[1, 2, 3, 4].map((n) => `.brg-dot:nth-of-type(${n}):checked ~ .brg-strip-in .brg-strip-msg:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
.brg-strip-nav { position: absolute; inset: 0; pointer-events: none; display: grid; }
.brg-strip-pair { grid-area: 1 / 1; display: none; justify-content: center; align-items: center; gap: min(560px, 46vw); }
.brg-strip-pair label { pointer-events: auto; display: grid; place-items: center; width: 28px; height: 28px; cursor: pointer; opacity: .85; }
.brg-strip-pair label:hover { opacity: 1; }
.brg-strip-pair .brg-ico { width: 16px; height: 16px; }
${[1, 2, 3, 4].map((n) => `.brg-dot:nth-of-type(${n}):checked ~ .brg-strip-in .brg-strip-pair:nth-child(${n})`).join(", ")}, .brg-auto:checked ~ .brg-strip-in .brg-strip-pair:first-child { display: flex; }
${[2, 3, 4]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes brg-msg${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.1).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.brg-sn${n} .brg-auto:checked ~ .brg-strip-in .brg-strip-msg { animation: brg-msg${n} ${n * 5}s infinite both; }
${Array.from({ length: n }, (_, k) => `.brg-sn${n} .brg-auto:checked ~ .brg-strip-in .brg-strip-msg:nth-child(${k + 1}) { animation-delay: ${k * 5 - 0.3}s; }`).join("\n")}`;
  })
  .join("\n")}

/* Header */
.brg-header { background: #fff; border-bottom: 1px solid var(--brg-line); }
.brg-header-in { display: flex; align-items: center; gap: 40px; height: 88px; }
.brg .brg-logo { display: inline-flex; align-items: center; gap: 8px; flex: none; color: var(--brg-deep); }
.brg-logo img { max-height: 46px; max-width: 180px; }
.brg-logo-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--brg-green); color: #fff; }
.brg-logo-mark .brg-ico { width: 26px; height: 26px; stroke-width: 1.8; }
.brg-logo b { font-family: var(--brg-head); font-size: 40px; font-weight: 700; line-height: 1; }
.brg-search { display: flex; align-items: center; flex: 1; max-width: 640px; height: 50px; padding-inline-start: 22px; border-radius: 999px; background: #F3F3F1; }
.brg-search-cat { position: relative; display: flex; align-items: center; width: 140px; height: 100%; border-inline-end: 1px solid #DEDBD6; }
.brg-search-cat select { appearance: none; width: 100%; height: 100%; font: inherit; font-size: 13px; color: var(--brg-ink); cursor: pointer; padding-inline-end: 22px; }
.brg-search-cat .brg-ico { position: absolute; inset-inline-end: 10px; width: 14px; height: 14px; pointer-events: none; }
.brg-search input { flex: 1; min-width: 0; height: 100%; padding-inline: 16px; font: inherit; font-size: 13px; }
.brg-search button { display: inline-flex; align-items: center; gap: 6px; height: 100%; padding: 0 28px; border-radius: 999px; background: var(--brg-green); color: #fff; font-weight: 700; font-size: 14px; transition: background .3s; }
.brg-search button:hover { background: var(--brg-deep); }
.brg-search button .brg-ico { width: 18px; height: 18px; stroke-width: 2; }
.brg-icons { display: flex; align-items: center; gap: 18px; margin-inline-start: auto; }
.brg-icon { position: relative; display: grid; place-items: center; width: 30px; height: 30px; transition: color .3s; }
.brg-icon:hover { color: var(--brg-green); }
.brg-icon .brg-ico { width: 22px; height: 22px; }
.brg-icon i { position: absolute; top: -4px; inset-inline-end: -8px; display: grid; place-items: center; min-width: 17px; height: 17px; padding: 0 3px; border-radius: 99px; background: #F04D23; color: #fff; font-size: 10px; font-style: normal; font-weight: 700; box-sizing: border-box; }
.brg-burger { display: none; }
.brg-menu { background: #fff; border-bottom: 1px solid var(--brg-line); }
.brg-menu-in { display: flex; align-items: center; justify-content: space-between; height: 56px; }
.brg-nav { display: flex; align-items: center; gap: 34px; height: 100%; }
.brg-nav > a, .brg-drop > a, .brg-drop-btn { display: inline-flex; align-items: center; gap: 4px; height: 100%; font-size: 15px; font-weight: 700; cursor: pointer; transition: color .3s; }
.brg-nav > a:hover, .brg-drop:hover > a, .brg-drop:hover .brg-drop-btn, .brg-nav a[aria-current="page"] { color: var(--brg-green); }
.brg-caret { width: 14px; height: 14px; transition: transform .3s; }
.brg-drop { position: relative; height: 100%; }
.brg-drop:hover .brg-caret, .brg-drop:focus-within .brg-caret { transform: rotate(180deg); }
.brg-drop-panel { position: absolute; z-index: 40; top: 100%; inset-inline-start: -20px; display: grid; min-width: 220px; padding: 12px 0; border-radius: 12px; background: #fff; box-shadow: 0 18px 40px rgb(0 0 0 / .1); opacity: 0; visibility: hidden; translate: 0 10px; transition: opacity .3s, visibility .3s, translate .3s; }
.brg-drop:hover .brg-drop-panel, .brg-drop:focus-within .brg-drop-panel { opacity: 1; visibility: visible; translate: 0 0; }
.brg-drop-panel a { padding: 9px 22px; font-size: 14px; transition: color .25s, padding .25s; }
.brg-drop-panel a:hover, .brg-drop-panel a[aria-current="page"] { color: var(--brg-green); padding-inline-start: 28px; }
.brg-help { font-size: 13px; color: var(--brg-ink); }
.brg-help b { font-weight: 800; }

/* Hero slider */
.brg-hero { position: relative; overflow: hidden; }
.brg-slides { display: grid; }
.brg-slide { grid-area: 1 / 1; position: relative; overflow: hidden; background: #D5E9F0; opacity: 0; visibility: hidden; transition: opacity .8s, visibility .8s; }
.brg-slide:nth-child(2) { background: #F6D6DC; }
.brg-slide:nth-child(3) { background: #DCEBDD; }
.brg-slide::before { content: ""; position: absolute; inset-block: 0; inset-inline-end: 0; width: 66%; background: url("/_assets/samples/brg-blob.png") left center / cover no-repeat; transform: scaleX(-1); opacity: .95; }
.brg-slide:nth-child(2)::before { filter: hue-rotate(-30deg) saturate(.7) brightness(1.04); }
.brg-slide:nth-child(3)::before { filter: hue-rotate(40deg) saturate(.5); }
.brg-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.brg-dot:nth-of-type(${n}):checked ~ .brg-slides > .brg-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes brg-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.12).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.brg-n${n} .brg-auto:checked ~ .brg-slides > .brg-slide { animation: brg-cycle${n} ${n * 6}s infinite both; }
${Array.from({ length: n }, (_, k) => `.brg-n${n} .brg-auto:checked ~ .brg-slides > .brg-slide:nth-child(${k + 1}) { animation-delay: ${k * 6 - 0.4}s; }`).join("\n")}`;
  })
  .join("\n")}
.brg-hero:hover .brg-slide, .brg-hero:focus-within .brg-slide { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .brg-auto:checked ~ .brg-slides > .brg-slide, .brg-auto:checked ~ .brg-strip-in .brg-strip-msg { animation: none !important; } .brg-auto:checked ~ .brg-slides > .brg-slide:first-child, .brg-auto:checked ~ .brg-strip-in .brg-strip-msg:first-child { opacity: 1; visibility: visible; } }
.brg-slide-in { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: center; gap: 30px; min-height: clamp(520px, 39cqi, 750px); }
.brg-slide-text { display: grid; justify-items: start; gap: 22px; max-width: 600px; padding-block: 60px; }
.brg-kicker { color: #2E8C7E; font-size: 16px; font-weight: 700; }
.brg-slide-text h1, .brg-slide-text h2 { font-family: var(--brg-head); font-size: clamp(38px, 4.4cqi, 84px); font-weight: 700; line-height: 1.2; color: var(--brg-ink); }
.brg-slide-text p { font-size: clamp(15px, 1cqi, 18px); line-height: 1.9; }
.brg-slide-text .brg-pill { margin-top: 8px; }
.brg-slide-art { position: relative; display: flex; align-items: center; justify-content: center; gap: 2%; height: 100%; }
.brg-slide-pic { display: grid; place-items: center; flex: 1; min-width: 0; }
.brg-slide-pic img { max-width: 100%; max-height: clamp(300px, 30cqi, 560px); object-fit: contain; filter: drop-shadow(0 18px 26px rgb(0 0 0 / .2)); }
.brg-badge { position: relative; z-index: 1; flex: none; display: grid; place-items: center; width: clamp(96px, 10cqi, 150px); aspect-ratio: 1; color: #fff; text-align: center; }
.brg-badge svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--brg-orange); animation: brg-spin 24s linear infinite; }
.brg-badge b { position: relative; max-width: 70%; font-family: var(--brg-head); font-size: clamp(20px, 2.1cqi, 32px); font-weight: 700; line-height: 1.1; }
@keyframes brg-spin { to { rotate: 360deg; } }
.brg-dots { position: absolute; bottom: 22px; inset-inline: 0; display: flex; justify-content: center; gap: 8px; }
.brg-dots label { width: 10px; height: 10px; border-radius: 50%; background: #fff; cursor: pointer; transition: box-shadow .3s; }
${[1, 2, 3, 4, 5].map((n) => `.brg-dot:nth-of-type(${n}):checked ~ .brg-dots label:nth-child(${n})`).join(", ")}, .brg-auto:checked ~ .brg-dots label:first-child { background: var(--brg-green); box-shadow: 0 0 0 3px #fff, 0 0 0 4px var(--brg-green); }
/* The active slide's text and books come in as it shows. */
.brg-slide .brg-slide-text > *, .brg-slide .brg-slide-pic { animation: brg-up .9s cubic-bezier(.2, .7, .2, 1) both; }
.brg-slide .brg-slide-text > :nth-child(2) { animation-delay: .1s; } .brg-slide .brg-slide-text > :nth-child(3) { animation-delay: .2s; } .brg-slide .brg-slide-text > :nth-child(4) { animation-delay: .3s; }
.brg-slide .brg-slide-pic { animation-name: brg-from-end; animation-delay: .15s; }
.brg-slide .brg-badge { animation: brg-pop .8s cubic-bezier(.2, .9, .3, 1.3) .45s both; }
@keyframes brg-pop { from { opacity: 0; transform: scale(.4); } }

/* Ticker */
.brg-ticker { overflow: hidden; background: #fff; }
.brg-ticker-run { display: flex; width: max-content; animation: brg-run 40s linear infinite; }
.brg-ticker:hover .brg-ticker-run { animation-play-state: paused; }
.brg-tick { display: inline-flex; align-items: center; gap: 6px; padding: 18px 24px; font-size: 16px; white-space: nowrap; }
.brg-tick b { color: var(--brg-green); font-weight: 800; }
.brg-star { color: var(--brg-gold); font-style: normal; font-size: 20px; margin-inline-end: 18px; }
@keyframes brg-run { to { transform: translateX(50%); } }
@media (prefers-reduced-motion: reduce) { .brg-ticker-run, .brg-badge svg { animation: none; } }

/* Sections */
.brg-sec { padding-block: 70px 0; }
.brg-sec-sm { padding-block: 60px 0; }
.brg-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
.brg-head.center { justify-content: center; }
.brg-head h2 { font-family: var(--brg-head); font-size: clamp(30px, 2.8cqi, 42px); font-weight: 500; line-height: 1.2; }
.brg-books { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 28px 24px; }

/* Book card */
.brg-card { display: grid; align-content: start; gap: 14px; }
.brg-cover { position: relative; }
.brg-cover-pic { display: block; aspect-ratio: 5 / 7; overflow: hidden; border-radius: 6px; background: var(--brg-cream); }
.brg-cover-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.2, .7, .2, 1); }
.brg-cover-pic b { display: grid; place-items: center; height: 100%; font-family: var(--brg-head); font-size: 50px; color: var(--brg-green); }
.brg-card:hover .brg-cover-pic img { transform: scale(1.05); }
.brg-off { position: absolute; top: 10px; inset-inline-start: 10px; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--brg-red); color: #fff; font-size: 11px; font-weight: 800; }
.brg-tools { position: absolute; top: 10px; inset-inline-end: 10px; display: grid; gap: 8px; }
.brg-tool { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; box-shadow: 0 4px 12px rgb(0 0 0 / .12); opacity: 0; translate: 10px 0; transition: opacity .3s, translate .3s, background .3s, color .3s; }
.brg-tool:nth-child(2) { transition-delay: .06s; }
.brg-tool .brg-ico { width: 17px; height: 17px; }
.brg-tool:hover { background: var(--brg-green); color: #fff; }
.brg-tool.on { color: var(--brg-red); opacity: 1; translate: 0 0; }
.brg-tool.on .brg-ico { fill: currentColor; }
.brg-card:hover .brg-tool, .brg-card:focus-within .brg-tool { opacity: 1; translate: 0 0; }
.brg-rate { position: absolute; bottom: -12px; inset-inline: 0; display: flex; justify-content: center; }
.brg-rate .sk-stars { padding: 4px 10px; border-radius: 999px; background: #fff; box-shadow: 0 2px 8px rgb(0 0 0 / .08); }
.brg .sk-stars svg { width: 12px; height: 12px; fill: #D9D9D9; }
.brg .sk-stars svg.on, .brg .sk-stars svg.half { fill: var(--brg-gold); }
.brg .sk-stars small { font-size: 11px; color: var(--brg-ink); margin-inline-start: 3px; }
.brg-card-body { display: grid; justify-items: center; gap: 4px; padding-top: 8px; text-align: center; }
.brg-card-name { font-family: var(--brg-head); font-size: 18px; font-weight: 500; line-height: 1.35; transition: color .3s; }
.brg-card-name:hover { color: var(--brg-green); }
.brg-author { font-size: 12px; color: var(--brg-muted); }
.brg-price { display: inline-flex; align-items: baseline; gap: 8px; flex-wrap: wrap; justify-content: center; }
.brg-price b { color: var(--brg-green); font-size: 16px; font-weight: 800; }
.brg-price s { color: var(--brg-muted); font-size: 12px; }
.brg-add { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 38px; margin-top: 6px; border-radius: 999px; background: var(--brg-green); color: #fff !important; font-size: 13px; font-weight: 700; opacity: 0; translate: 0 6px; transition: opacity .3s, translate .3s, background .3s; }
.brg-add .brg-ico { width: 15px; height: 15px; stroke-width: 2.2; }
.brg-add:hover { background: var(--brg-deep); }
.brg-add.off { background: #E5E5E5; color: var(--brg-muted) !important; }
.brg-card:hover .brg-add, .brg-card:focus-within .brg-add, .brg-add.solid { opacity: 1; translate: 0 0; }
.brg-add.solid { width: auto; padding: 0 26px; }
@media (hover: none) { .brg-tool, .brg-add { opacity: 1; translate: 0 0; } }

/* Categories */
.brg-cats-sec { margin-top: 70px; background: var(--brg-cream); padding-bottom: 70px; }
.brg-cats { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 18px; }
.brg-cat { display: grid; justify-items: center; gap: 18px; padding: 30px 10px 24px; border: 1px solid var(--brg-line); border-radius: 12px; background: #fff; transition: border-color .3s, transform .4s cubic-bezier(.2, .7, .2, 1), box-shadow .4s; }
.brg-cat:hover { border-color: var(--brg-green); transform: translateY(-6px); box-shadow: 0 14px 30px rgb(0 0 0 / .07); }
.brg-cat-ico { display: grid; place-items: center; width: 64px; height: 64px; }
.brg-cat-ico img { width: 100%; height: 100%; object-fit: contain; }
.brg-cat-ico .brg-ico { width: 48px; height: 48px; color: var(--brg-gold); }
.brg-cat b { font-family: var(--brg-head); font-size: 18px; font-weight: 500; }

/* Banners */
.brg .brg-banner { position: relative; display: flex; align-items: center; overflow: hidden; border-radius: 12px; color: #fff; isolation: isolate; }
.brg-banner-pic { position: absolute; inset: 0; z-index: -1; }
.brg-banner-pic > img { display: block; }
.brg-banner-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, .7, .2, 1); }
.brg-banner:hover .brg-banner-pic img { transform: scale(1.04); }
.brg-banner-text { display: grid; justify-items: start; gap: 10px; }
.brg-banner-text small { color: #FFD66B; font-size: 13px; font-weight: 700; }
.brg-banner-text b { font-family: var(--brg-head); font-weight: 700; line-height: 1.15; }
.brg-banner-text span { font-size: 14px; opacity: .9; }
.brg-banner-text .brg-pill { margin-top: 10px; }
.brg-banner.wide { min-height: 300px; padding-inline: 7%; }
.brg-banner.wide .brg-banner-text { max-width: 46%; }
.brg-banner.wide .brg-banner-text b { font-size: clamp(30px, 3cqi, 46px); }
.brg-cream { margin-top: 70px; padding: 70px 0; background: linear-gradient(#fff 0 140px, var(--brg-cream) 140px); }
.brg-promos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
.brg-banner.promo { min-height: 220px; padding-inline: 34px; justify-content: flex-start; }
.brg-banner.promo .brg-banner-text { margin-inline-start: 0; max-width: 54%; }
.brg-banner.promo .brg-banner-text b { font-size: clamp(24px, 2.2cqi, 32px); }
.brg-banner.promo small { color: #8FE3C5; }
.brg-cream .brg-sec { padding-top: 60px; }

/* Picks for you */
.brg-picks { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 22px; }
.brg-pick-big { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1fr); gap: 26px; padding: 22px; border-radius: 14px; background: #fff; }
.brg-pick-cover { position: relative; display: block; aspect-ratio: 5 / 7; overflow: hidden; border-radius: 8px; }
.brg-pick-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.brg-pick-big:hover .brg-pick-cover img { transform: scale(1.04); }
.brg-pick-info { display: grid; align-content: start; justify-items: start; gap: 10px; padding-top: 6px; }
.brg-pick-name { font-family: var(--brg-head); font-size: 28px; line-height: 1.25; }
.brg-pick-info p { color: var(--brg-muted); font-size: 13px; line-height: 2; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.brg-pick-info .brg-price { justify-content: start; }
.brg-pick-list { display: grid; grid-template-columns: 1fr 1fr; padding: 14px 26px; border-radius: 14px; background: #fff; }
.brg-mini { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--brg-line); }
.brg-mini:nth-last-child(-n+2) { border-bottom: 0; }
.brg-mini:nth-child(odd) { margin-inline-end: 22px; }
.brg-mini-cover { flex: none; width: 70px; aspect-ratio: 5 / 7; overflow: hidden; border-radius: 4px; background: var(--brg-cream); }
.brg-mini-cover img { width: 100%; height: 100%; object-fit: cover; }
.brg-mini-text { display: grid; align-content: start; gap: 4px; }
.brg-mini-text b { font-family: var(--brg-head); font-size: 17px; font-weight: 500; line-height: 1.3; transition: color .3s; }
.brg-mini:hover b { color: var(--brg-green); }
.brg-mini-text small { font-size: 12px; color: var(--brg-muted); }
.brg-mini-text .brg-price { justify-content: start; }

/* Carousels */
.brg-car { position: relative; }
.brg-car.fits .brg-arrow { visibility: hidden; }
.brg-row { display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; scroll-behavior: smooth; }
.brg-row::-webkit-scrollbar { display: none; }
.brg-row > * { scroll-snap-align: start; }
.brg-arrow { position: absolute; z-index: 2; top: 50%; translate: 0 -50%; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--brg-ink); transition: color .3s, background .3s; }
.brg-arrow:hover { color: var(--brg-green); }
.brg-arrow .brg-ico { width: 24px; height: 24px; }
.brg-arrow.prev { inset-inline-start: -50px; }
.brg-arrow.next { inset-inline-end: -50px; }
.brg-authors { justify-content: safe center; }
.brg-author-card { flex: none; display: grid; justify-items: center; gap: 14px; width: clamp(110px, 8cqi, 150px); }
.brg-authors { gap: clamp(20px, 3cqi, 56px); }
.brg-author-pic { display: grid; place-items: center; width: 100%; aspect-ratio: 1; overflow: hidden; border-radius: 50%; background: var(--brg-cream); color: var(--brg-green); font-size: 40px; }
.brg-author-pic img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(.15); transition: transform .5s, filter .5s; }
.brg-author-card:hover .brg-author-pic img { transform: scale(1.07); filter: none; }
.brg-author-card button, .brg-author-card > b { font-size: 14px; font-weight: 700; transition: color .3s; }
.brg-author-card:hover button { color: var(--brg-green); }

/* Reviews */
.brg-quotes { position: relative; padding: 46px 46px 46px 0; border-radius: 14px; background: var(--brg-cream); }
.brg-score { position: absolute; z-index: 3; top: -70px; inset-inline-end: 60px; display: grid; justify-items: center; align-content: center; gap: 2px; width: 140px; height: 140px; border-radius: 50%; background: var(--brg-green); color: #fff; }
.brg-score b { font-size: 34px; font-weight: 800; color: #FFD66B; line-height: 1; }
.brg-score b small { font-size: 14px; color: #fff; }
.brg-score .sk-stars svg { fill: rgb(255 255 255 / .35); }
.brg-score .sk-stars svg.on, .brg-score .sk-stars svg.half { fill: #FFD66B; }
.brg-score > small { font-size: 11px; text-decoration: underline; }
.brg-quotes .brg-car { margin-inline-start: 46px; }
.brg-quotes .brg-arrow { display: none; }
.brg-quote { flex: none; display: grid; align-content: start; gap: 14px; width: calc((100% - 3 * 20px) / 3.4); min-width: 250px; margin: 0; padding: 26px; border-radius: 12px; background: #fff; }
.brg-quote-row { gap: 20px; }
.brg-quote-top { display: flex; justify-content: space-between; gap: 10px; padding-bottom: 16px; border-bottom: 1px solid var(--brg-line); }
.brg-quote-top > span { display: grid; justify-items: start; gap: 6px; }
.brg-quote-top b { font-size: 14px; }
.brg-quote .sk-stars svg.on { fill: var(--brg-green); }
.brg-quote-mark { width: 30px; height: 30px; color: var(--brg-line); fill: var(--brg-line); stroke: none; }
.brg-quote h3 { font-size: 17px; font-weight: 800; }
.brg-quote blockquote { margin: 0; color: var(--brg-muted); font-size: 13.5px; line-height: 2; }

/* Perks */
.brg-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; padding-block: 60px 50px; border-bottom: 1px solid var(--brg-line); }
.brg-perk { display: grid; justify-items: center; gap: 8px; text-align: center; }
.brg-perk-ico { width: 32px; height: 32px; margin-bottom: 8px; object-fit: contain; transition: transform .5s; }
.brg-perk:hover .brg-perk-ico { transform: translateY(-4px) rotate(-6deg); }
.brg-perk b { font-size: 13px; font-weight: 800; letter-spacing: .02em; }
.brg-perk small { color: var(--brg-muted); font-size: 13px; }

/* News */
.brg-news-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; padding-bottom: 70px; }
.brg-post-card { display: grid; gap: 22px; }
.brg-post-pic { position: relative; display: block; }
.brg-post-pic > span:first-child { display: block; aspect-ratio: 2 / 1; overflow: hidden; border-radius: 10px; background: var(--brg-cream); }
.brg-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.2, .7, .2, 1); }
.brg-post-card:hover .brg-post-pic img, .brg-post:hover .brg-post-pic img { transform: scale(1.05); }
.brg-post-tag { position: absolute; bottom: -10px; inset-inline-start: 16px; display: inline-flex; flex-wrap: nowrap; white-space: nowrap; max-width: calc(100% - 32px); overflow: hidden; gap: 4px 6px; padding: 4px 14px; border-radius: 999px; background: #fff; font-size: 11px; color: var(--brg-muted); }
.brg-post-tag b { color: var(--brg-green); font-weight: 700; }
.brg-post-tag i { font-style: normal; }
.brg-post-tag i::before { content: "/"; margin-inline-end: 6px; color: #C9C9C9; }
.brg-post-card h3 { font-family: var(--brg-head); font-size: 22px; font-weight: 500; line-height: 1.4; transition: color .3s; }
.brg-post-card:hover h3 { color: var(--brg-green); }

/* Footer */
.brg-foot { position: relative; border-top: 1px solid var(--brg-line); }
.brg-news { border-bottom: 1px solid var(--brg-line); }
.brg-news-in { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 50px; padding-block: 40px; }
.brg-news h3 { font-family: var(--brg-head); font-size: clamp(30px, 2.8cqi, 42px); font-weight: 500; }
.brg-news-text { display: grid; gap: 12px; max-width: 460px; }
.brg-news-text p { color: #444; font-size: 13.5px; line-height: 1.9; }
.brg-socials { display: flex; gap: 6px; }
.brg-socials a { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: #1DA1F2; color: #fff; transition: transform .3s; }
.brg-socials a:nth-child(2) { background: #222; }
.brg-socials a:nth-child(3) { background: #8F4AF6; }
.brg-socials a:nth-child(4) { background: var(--brg-green); }
.brg-socials a:hover { transform: translateY(-3px); }
.brg-socials .p-ico { width: 18px; height: 18px; }
.brg-foot-cols { display: grid; grid-template-columns: 1.6fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-block: 60px 40px; }
.brg-foot-about { display: grid; align-content: start; justify-items: start; gap: 18px; max-width: 320px; }
.brg-foot-about p { color: #444; font-size: 13.5px; line-height: 1.95; }
.brg .brg-foot-phone { color: var(--brg-gold); font-size: 26px; font-weight: 800; }
.brg-foot-mail { font-size: 14px; margin-top: -10px; }
.brg-foot-cols > div:not(.brg-foot-about) { display: grid; align-content: start; gap: 12px; }
.brg-foot h4 { padding-bottom: 14px; margin-bottom: 6px; border-bottom: 1px solid var(--brg-line); font-family: var(--brg-head); font-size: 22px; font-weight: 500; }
.brg-foot-cols a:not(.brg-logo):not(.brg-foot-phone):not(.brg-foot-mail) { width: fit-content; font-size: 14px; color: #333; transition: color .3s, translate .3s; }
.brg-foot-cols a:not(.brg-logo):not(.brg-foot-phone):not(.brg-foot-mail):hover { color: var(--brg-green); translate: -4px 0; }
.brg-foot-end { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding-block: 22px 28px; border-top: 1px solid var(--brg-line); font-size: 13px; }
.brg-foot-end b { color: var(--brg-green); font-weight: 700; }
.brg-pays { display: flex; gap: 6px; }
.brg-pays img { height: 24px; padding: 3px 6px; border: 1px solid var(--brg-line); border-radius: 4px; background: #fff; }
.brg-top { position: absolute; bottom: 20px; inset-inline-end: 24px; display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid var(--brg-line); border-radius: 50%; background: #fff; transition: background .3s, color .3s; }
.brg-top:hover { background: var(--brg-green); color: #fff; }
.brg-tabbar { display: none; }

/* Inner pages */
.brg-inner { padding-block: 24px 80px; }
.brg-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; color: var(--brg-muted); font-size: 13px; }
.brg-trail span { display: inline-flex; align-items: center; gap: 4px; }
.brg-trail .brg-ico { width: 13px; height: 13px; }
.brg-trail a:hover { color: var(--brg-green); }
.brg-trail b { font-weight: 400; }
.brg-page-head { display: grid; gap: 14px; margin-bottom: 30px; }
.brg-page-head h1 { font-family: var(--brg-head); font-size: 40px; }
.brg-notice { padding: 22px; border-radius: 12px; background: var(--brg-cream); color: var(--brg-muted); text-align: center; }
.brg-error { color: var(--brg-red); }

/* Shop */
.brg-preorder { background: linear-gradient(100deg, #DDF2FB, #9BD7F2); overflow: hidden; }
.brg-preorder-in { display: flex; align-items: center; justify-content: space-between; gap: 30px; height: 96px; }
.brg-preorder h2 { font-family: var(--brg-head); font-size: clamp(22px, 2.2cqi, 32px); }
.brg-preorder-books { position: relative; display: flex; align-items: flex-end; align-self: flex-end; gap: 4px; height: 84px; }
.brg-preorder-books img { height: 78px; border-radius: 3px 3px 0 0; box-shadow: 0 4px 14px rgb(0 0 0 / .2); transition: transform .4s; }
.brg-preorder-books img:nth-child(3) { height: 86px; }
.brg-preorder:hover .brg-preorder-books img { transform: translateY(-4px); }
.brg-soon { position: absolute; z-index: 1; top: -6px; inset-inline-start: -50px; display: grid; place-items: center; width: 66px; height: 66px; border-radius: 50%; background: var(--brg-red); color: #fff; font-size: 12px; font-weight: 800; font-style: normal; rotate: -10deg; }
.brg-preorder-go { font-weight: 800; font-size: 16px; text-decoration: underline !important; text-underline-offset: 6px; }
.brg-shop { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 30px; align-items: start; }
.brg-shop-side { position: sticky; top: 16px; display: grid; gap: 18px; }
.brg-side-lg { display: grid; gap: 18px; }
.brg-filter-sm { display: none; }
.brg-widget { border: 1px solid var(--brg-line); border-radius: 12px; background: #fff; }
.brg-widget summary { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; font-size: 16px; font-weight: 800; list-style: none; cursor: pointer; }
.brg-widget summary::-webkit-details-marker { display: none; }
.brg-widget summary .brg-ico { width: 16px; height: 16px; transition: transform .3s; }
.brg-widget[open] summary .brg-ico { transform: rotate(180deg); }
.brg-widget-body { padding: 0 20px 18px; }
.brg-checks { display: grid; gap: 2px; }
.brg-choice { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 0; font-size: 13.5px; text-align: start; transition: color .25s; }
.brg-choice:hover { color: var(--brg-green); }
.brg-choice small { margin-inline-start: auto; color: var(--brg-muted); }
.brg-box { position: relative; flex: none; width: 15px; height: 15px; border: 1px solid #C9C9C9; border-radius: 3px; transition: background .25s, border-color .25s; }
.brg-choice.on .brg-box { background: var(--brg-green); border-color: var(--brg-green); }
.brg-choice.on .brg-box::after { content: ""; position: absolute; inset: 2px 4px 4px; border: solid #fff; border-width: 0 2px 2px 0; rotate: 45deg; }
.brg-price-filter { display: grid; gap: 14px; }
.brg-range { position: relative; height: 16px; }
.brg-range::before { content: ""; position: absolute; top: 7px; inset-inline: 0; height: 2px; background: var(--brg-line); }
.brg-range i { position: absolute; top: 7px; height: 2px; inset-inline-start: var(--a); inset-inline-end: calc(100% - var(--b)); background: var(--brg-green); }
.brg-range i::before, .brg-range i::after { content: ""; position: absolute; top: -6px; width: 12px; height: 12px; border: 2px solid var(--brg-green); border-radius: 3px; background: #fff; }
.brg-range i::before { inset-inline-start: -7px; }
.brg-range i::after { inset-inline-end: -7px; }
.brg-minmax { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--brg-muted); }
.brg-minmax input { width: 100%; min-width: 0; height: 36px; padding-inline: 10px; border: 1px solid var(--brg-line); border-radius: 8px; font: inherit; font-size: 12px; text-align: center; }
.brg-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; }
.brg-range-foot b { font-weight: 800; }
.brg-range-foot button { font-weight: 800; font-size: 12px; text-decoration: underline; }
.brg-shop-head { display: grid; justify-items: center; gap: 14px; padding: 16px 0 30px; text-align: center; }
.brg-shop-head h1 { font-family: var(--brg-head); font-size: clamp(40px, 4cqi, 56px); }
.brg-shop-head p { max-width: 560px; color: #444; font-size: 14px; line-height: 1.9; }
.brg-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 20px; }
.brg-toolbar > small { font-size: 13px; }
.brg-views { display: flex; gap: 6px; }
.brg-views button { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--brg-line); border-radius: 50%; color: var(--brg-muted); transition: color .3s, border-color .3s; }
.brg-views button.on, .brg-views button:hover { color: var(--brg-ink); border-color: var(--brg-ink); }
.brg-views .brg-ico { width: 16px; height: 16px; }
.brg-sort { position: relative; }
.brg-sort summary { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px; border: 1px solid var(--brg-line); border-radius: 999px; font-size: 13px; list-style: none; cursor: pointer; }
.brg-sort summary::-webkit-details-marker { display: none; }
.brg-sort summary .brg-ico { width: 14px; height: 14px; }
.brg-sort > div { position: absolute; z-index: 10; top: calc(100% + 6px); inset-inline-end: 0; display: grid; min-width: 180px; padding: 8px 0; border-radius: 12px; background: #fff; box-shadow: 0 14px 34px rgb(0 0 0 / .12); }
.brg-sort > div button { width: 100%; padding: 8px 18px; text-align: start; font-size: 13px; }
.brg-sort > div button:hover, .brg-sort > div button[aria-current] { color: var(--brg-green); }
.brg-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.brg-chips a { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; background: var(--brg-cream); font-size: 12px; }
.brg-chips .brg-ico { width: 13px; height: 13px; }
.brg-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px 24px; }
.brg-grid.wide { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.brg-card.shop .brg-card-name { font-size: 19px; }
.brg-list { display: grid; gap: 24px; }
.brg-card.list { grid-template-columns: 180px minmax(0, 1fr); gap: 30px; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--brg-line); }
.brg-card.list .brg-card-body { justify-items: start; text-align: start; }
.brg-card.list .brg-price { justify-content: start; }
.brg-card.list .brg-add { width: auto; padding: 0 26px; opacity: 1; translate: 0 0; }
.brg-card-desc { color: var(--brg-muted); font-size: 13px; line-height: 1.9; }
.brg-pages { display: flex; gap: 8px; margin-top: 40px; }
.brg-pages button { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--brg-line); border-radius: 6px; font-size: 14px; transition: background .3s, color .3s; }
.brg-pages button:hover { border-color: var(--brg-ink); }
.brg-pages button.on { background: var(--brg-ink); border-color: var(--brg-ink); color: #fff; }
.brg-pages .brg-ico { width: 16px; height: 16px; }

/* Product page */
.brg-product { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1fr); gap: 50px; margin-top: 24px; }
.brg-gallery { display: grid; gap: 14px; }
.brg-gallery-main { position: relative; display: grid; }
.brg-gal { grid-area: 1 / 1; display: block; overflow: hidden; border-radius: 12px; background: var(--brg-cream); }
.brg-gal span { display: grid; place-items: center; padding: 30px; }
.brg-gal img { max-width: 100%; max-height: 560px; border-radius: 4px; box-shadow: 0 20px 40px rgb(0 0 0 / .18); }
.brg-gallery-main .brg-gal:not(:first-child) { visibility: hidden; }
.brg-gallery:has(.brg-thumb:nth-child(2) input:checked) .brg-gal { visibility: hidden; }
.brg-gallery:has(.brg-thumb:nth-child(2) input:checked) .brg-gal:nth-child(2) { visibility: visible; }
.brg-gallery:has(.brg-thumb:nth-child(3) input:checked) .brg-gal { visibility: hidden; }
.brg-gallery:has(.brg-thumb:nth-child(3) input:checked) .brg-gal:nth-child(3) { visibility: visible; }
.brg-thumbs { display: flex; gap: 10px; }
.brg-thumb { width: 70px; border: 2px solid transparent; border-radius: 8px; overflow: hidden; cursor: pointer; }
.brg-thumb:has(input:checked) { border-color: var(--brg-green); }
.brg-thumb input { position: absolute; opacity: 0; }
.brg-thumb img { display: block; width: 100%; }
.brg-pinfo { display: grid; align-content: start; justify-items: start; gap: 14px; }
.brg-pinfo h1 { font-family: var(--brg-head); font-size: clamp(32px, 3cqi, 44px); line-height: 1.2; }
.brg-by { font-size: 14px; color: var(--brg-muted); }
.brg-by button { color: var(--brg-green); font-weight: 700; }
.brg-pinfo .brg-price b { font-size: 24px; }
.brg-pdesc { color: #444; line-height: 2; }
.brg-buy { display: grid; gap: 16px; width: 100%; padding-block: 8px; }
.brg-buy-row { display: flex; gap: 12px; }
.brg-qty input { width: 80px; height: 46px; border: 1px solid var(--brg-line); border-radius: 999px; font: inherit; text-align: center; }
.brg-plinks { display: flex; flex-wrap: wrap; gap: 18px; }
.brg-plink { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; transition: color .3s; }
.brg-plink:hover, .brg-plink.on { color: var(--brg-green); }
.brg-plink .brg-ico { width: 17px; height: 17px; }
.brg-facts { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; width: 100%; margin: 10px 0 0; padding-top: 18px; border-top: 1px solid var(--brg-line); font-size: 13px; }
.brg-facts dt { color: var(--brg-muted); }
.brg-facts dd { margin: 0; text-align: right; }
.brg-tabs { margin-top: 60px; }
.brg-tabs > input { position: absolute; opacity: 0; pointer-events: none; }
.brg-tab-heads { display: flex; justify-content: center; gap: 30px; border-bottom: 1px solid var(--brg-line); }
.brg-tab-heads label { padding: 14px 4px; font-family: var(--brg-head); font-size: 22px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
#brg-tab-1:checked ~ .brg-tab-heads label[for="brg-tab-1"], #brg-tab-2:checked ~ .brg-tab-heads label[for="brg-tab-2"] { border-color: var(--brg-green); color: var(--brg-green); }
.brg-tab { display: none; max-width: 860px; margin: 30px auto 0; line-height: 2; }
#brg-tab-1:checked ~ .brg-tab-desc, #brg-tab-2:checked ~ .brg-tab-rev { display: grid; gap: 16px; }

/* Blog */
.brg-blog-top { position: relative; display: grid; place-items: center; min-height: 300px; overflow: hidden; background: #2B2420; color: #fff; text-align: center; }
.brg-blog-top > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; animation: brg-zoom 8s ease-out both; }
.brg-blog-top-in { position: relative; display: grid; justify-items: center; gap: 12px; }
.brg-blog-top .brg-trail { color: rgb(255 255 255 / .75); justify-content: center; }
.brg-blog-top h1 { font-family: var(--brg-head); font-size: clamp(44px, 4.4cqi, 64px); animation: brg-up .9s cubic-bezier(.2, .7, .2, 1) both; }
.brg-blog { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 40px; align-items: start; margin-top: 20px; }
.brg-posts { display: grid; gap: 50px; }
.brg-post { display: grid; gap: 16px; }
.brg-post .brg-post-pic > span:first-child { aspect-ratio: 2.2 / 1; }
.brg-post h2, .brg-post h1 { font-family: var(--brg-head); font-size: clamp(26px, 2.4cqi, 36px); font-weight: 500; line-height: 1.3; margin-top: 10px; transition: color .3s; }
.brg-post:not(.brg-post-full) h2:hover { color: var(--brg-green); }
.brg-post > p { color: #555; line-height: 2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.brg-more { display: inline-flex; align-items: center; gap: 6px; width: fit-content; font-size: 13px; font-weight: 800; text-decoration: underline !important; text-underline-offset: 4px; }
.brg-more .brg-ico { width: 14px; height: 14px; }
.brg-post-text { display: grid; gap: 14px; line-height: 2.1; color: #333; }
.brg-blog-side { position: sticky; top: 16px; display: grid; gap: 0; padding: 26px; border: 1px solid var(--brg-line); border-radius: 14px; }
.brg-side-search { display: flex; height: 46px; padding-inline: 18px 8px; border-radius: 999px; background: #F3F3F1; }
.brg-side-search input { flex: 1; min-width: 0; font: inherit; font-size: 13px; }
.brg-side-search button { display: grid; place-items: center; width: 36px; }
.brg-side-search .brg-ico { width: 17px; height: 17px; }
.brg-side-box { display: grid; gap: 4px; padding-top: 24px; margin-top: 24px; border-top: 1px solid var(--brg-line); }
.brg-side-box h3 { margin-bottom: 10px; font-family: var(--brg-head); font-size: 24px; }
.brg-mini-post { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--brg-line); }
.brg-mini-post:last-child { border-bottom: 0; }
.brg-mini-pic { flex: none; width: 64px; height: 56px; overflow: hidden; border-radius: 6px; background: var(--brg-cream); }
.brg-mini-pic img { width: 100%; height: 100%; object-fit: cover; }
.brg-mini-post span:last-child { display: grid; align-content: start; gap: 4px; }
.brg-mini-post small { color: var(--brg-muted); font-size: 11px; }
.brg-mini-post b { font-size: 13.5px; line-height: 1.6; transition: color .3s; }
.brg-mini-post:hover b { color: var(--brg-green); }
.brg-blog-cats { display: grid; }
.brg-blog-cats button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 5px 0; font-size: 13.5px; transition: color .3s; }
.brg-blog-cats button::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--brg-green); }
.brg-blog-cats button:hover { color: var(--brg-green); }
.brg-blog-cats small { margin-inline-start: auto; color: var(--brg-muted); }
.brg-side-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.brg-side-gallery img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; }

/* Contact */
.brg-map { margin-top: 20px; overflow: hidden; border-radius: 12px; }
.brg-map iframe { display: block; width: 100%; height: 380px; border: 0; }
.brg-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 60px; margin-top: 50px; }
.brg-contact-form { display: grid; align-content: start; gap: 14px; }
.brg-contact-form h1, .brg-stores h2 { font-family: var(--brg-head); font-size: clamp(32px, 3cqi, 44px); }
.brg-contact-form > p { color: #444; line-height: 1.9; max-width: 460px; }
.brg-contact-form form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; }
.brg-contact-form label { display: grid; gap: 8px; font-size: 11px; font-weight: 800; }
.brg-contact-form label.full { grid-column: 1 / -1; }
.brg-contact-form input, .brg-contact-form textarea { width: 100%; box-sizing: border-box; padding: 12px 18px; border-radius: 22px; background: #F3F3F1; font: inherit; font-size: 13px; font-weight: 400; resize: vertical; }
.brg-contact-form input { height: 42px; padding-block: 0; }
.brg-contact-form .brg-btn { width: fit-content; }
.brg-stores { display: grid; align-content: start; gap: 24px; }
.brg-store-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.brg-store { display: grid; align-content: start; gap: 10px; }
.brg-store-pic { display: block; aspect-ratio: 2 / 1.05; overflow: hidden; border-radius: 10px; background: var(--brg-cream); }
.brg-store-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.brg-store:hover .brg-store-pic img { transform: scale(1.05); }
.brg-store > b { margin-top: 6px; font-size: 16px; }
.brg-store-lines { display: grid; gap: 4px; color: var(--brg-muted); font-size: 13px; }
.brg-store-lines span { unicode-bidi: plaintext; text-align: right; }
.brg-store-lines span:nth-child(2) { color: var(--brg-ink); margin-bottom: 8px; }
.brg-add-new { display: grid; place-items: center; min-height: 160px; border: 2px dashed var(--brg-line); border-radius: 10px; color: var(--brg-muted); cursor: pointer; }

/* Wishlist */
.brg-wish-empty { padding: 50px 0 30px; font-size: 15px; }
.brg-wish { margin-top: 40px; border: 1px solid var(--brg-line); }
.brg-wish-row { display: grid; grid-template-columns: 90px minmax(0, 1fr) minmax(0, 1fr); align-items: center; border-bottom: 1px solid var(--brg-line); }
.brg-wish-row:nth-child(even) { background: #F5F5F5; }
.brg-wish-row:last-child { border-bottom: 0; }
.brg-wish-pic { display: block; padding: 10px; border-inline-end: 1px solid var(--brg-line); }
.brg-wish-pic img { display: block; width: 100%; aspect-ratio: 5 / 7; object-fit: cover; }
.brg-wish-info { display: grid; gap: 4px; padding: 10px 16px; border-inline-end: 1px solid var(--brg-line); align-self: stretch; align-content: center; }
.brg-wish-info b { font-size: 15px; }
.brg-wish-info small { color: var(--brg-muted); }
.brg-wish-info .brg-price { justify-content: start; }
.brg-wish-info .brg-price b { color: var(--brg-ink); font-weight: 400; font-size: 14px; }
.brg-wish-do { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; }
.brg-remove { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: var(--brg-muted); transition: color .3s, background .3s; }
.brg-remove:hover { color: var(--brg-red); background: #FDECEC; }
.brg-remove .brg-ico { width: 17px; height: 17px; }

/* Cart and checkout */
.brg-empty { display: grid; justify-items: center; gap: 18px; padding: 40px 0; }
.brg-cart { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 30px; align-items: start; }
.brg-table { border: 1px solid var(--brg-line); border-radius: 12px; }
.brg-line { display: grid; grid-template-columns: 70px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid var(--brg-line); }
.brg-line:last-child { border-bottom: 0; }
.brg-line-pic img { display: block; width: 70px; aspect-ratio: 5 / 7; object-fit: cover; border-radius: 4px; }
.brg-line-info { display: grid; gap: 4px; }
.brg-line-info small { color: var(--brg-muted); }
.brg-stepper { display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 6px; border: 1px solid var(--brg-line); border-radius: 999px; }
.brg-stepper button { display: grid; place-items: center; width: 26px; height: 26px; }
.brg-stepper .brg-ico { width: 14px; height: 14px; }
.brg-line-total { color: var(--brg-green); }
.brg-sum, .brg-checkout { display: grid; gap: 14px; padding: 26px; border-radius: 14px; background: var(--brg-cream); }
.brg-sum h2, .brg-checkout h2 { font-family: var(--brg-head); font-size: 28px; }
.brg-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: 14px; }
.brg-sum dd { margin: 0; }
.brg-sum .total { padding-top: 12px; border-top: 1px solid var(--brg-line); font-weight: 800; }
.brg-minus { color: var(--brg-red); }
.brg-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 13px; }
.brg-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.brg-checkout { grid-template-columns: 1fr 1fr; background: #fff; border: 1px solid var(--brg-line); }
.brg-checkout h2, .brg-checkout .full, .brg-checkout .brg-error { grid-column: 1 / -1; }
.brg-checkout label { display: grid; gap: 6px; font-size: 12px; font-weight: 700; }
.brg-checkout input, .brg-checkout textarea { width: 100%; box-sizing: border-box; padding: 10px 16px; border-radius: 20px; background: #F3F3F1; font: inherit; font-weight: 400; }
.brg-checkout input { height: 42px; padding-block: 0; }
.brg-trap { position: absolute; left: -9999px; }
.brg-pay-note { font-size: 13px; color: var(--brg-muted); line-height: 1.9; }
.brg-thanks { display: grid; justify-items: center; gap: 16px; max-width: 520px; margin: 30px auto; padding: 40px; border-radius: 14px; background: var(--brg-cream); text-align: center; }
.brg-thanks h1 { font-family: var(--brg-head); font-size: 36px; }
.brg-done { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--brg-green); color: #fff; }
.brg-done .brg-ico { width: 32px; height: 32px; stroke-width: 2.4; }
.brg-search-big { max-width: 640px; margin-bottom: 30px; padding-inline-start: 0; }

/* Entrances: sections rise as they scroll into view (where supported). */
@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) {
  .brg-rise { animation: brg-up linear both; animation-timeline: view(); animation-range: entry 0% cover 22%; }
  .brg-books > *, .brg-cats > *, .brg-grid > * { animation: brg-up linear both; animation-timeline: view(); animation-range: entry 0% cover 18%; }
} }
@keyframes brg-up { from { opacity: 0; transform: translateY(36px); } }
/* "end" is the left side in Persian: the books slide in from there. */
@keyframes brg-from-end { from { opacity: 0; transform: translateX(-60px); } }
@keyframes brg-zoom { from { transform: scale(1.12); } }
.brg-main > :first-child:not(.brg-hero) { animation: brg-up .8s cubic-bezier(.2, .7, .2, 1) both; }

@container (max-width: 1240px) {
  .brg-books { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .brg-books > :nth-child(n+5) { display: none; }
  .brg-cats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .brg-arrow.prev { inset-inline-start: -8px; }
  .brg-arrow.next { inset-inline-end: -8px; }
  .brg-grid.wide { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@container (max-width: 1000px) {
  .brg-header-in { gap: 20px; }
  .brg-search-cat { width: 100px; }
  .brg-help { display: none; }
  .brg-picks { grid-template-columns: 1fr; }
  .brg-shop { grid-template-columns: 220px minmax(0, 1fr); }
  .brg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .brg-blog { grid-template-columns: minmax(0, 1fr) 270px; }
  .brg-foot-cols { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .brg-foot-about { grid-column: 1 / -1; max-width: none; }
  .brg-news-in { grid-template-columns: 1fr auto; }
  .brg-news-text { grid-column: 1 / -1; grid-row: 2; max-width: none; }
  .brg-cart { grid-template-columns: 1fr; }
  .brg-contact { gap: 40px; }
}
@container (max-width: 760px) {
  .brg { font-size: 13.5px; padding-bottom: 62px; }
  .brg-wrap { padding-inline: 16px; }
  .brg-strip-pair { gap: 0; justify-content: space-between; padding-inline: 4px; }
  .brg-strip-msg { padding-inline: 34px; font-size: 12px; }
  .brg-header { position: sticky; top: 0; z-index: 50; }
  .brg-header-in { position: relative; height: 66px; gap: 10px; }
  .brg-logo b { font-size: 32px; }
  .brg-logo-mark { width: 34px; height: 34px; }
  .brg-search, .brg-icons, .brg-menu { display: none; }
  .brg-burger { display: block; margin-inline-start: auto; }
  .brg-burger summary { display: grid; place-items: center; width: 44px; height: 44px; list-style: none; cursor: pointer; }
  .brg-burger summary::-webkit-details-marker { display: none; }
  .brg-burger summary span, .brg-burger summary span::before, .brg-burger summary span::after { display: block; width: 22px; height: 2px; background: var(--brg-ink); position: relative; transition: transform .3s, background .3s; }
  .brg-burger summary span::before, .brg-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .brg-burger summary span::before { top: -7px; width: 16px; }
  .brg-burger summary span::after { top: 7px; }
  .brg-burger[open] summary span { background: transparent; }
  .brg-burger[open] summary span::before { top: 0; width: 22px; transform: rotate(45deg); }
  .brg-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  /* The menu fills the screen under the header; it never scrolls by itself. */
  .brg-drawer { position: absolute; z-index: 60; top: 100%; inset-inline: -16px; display: flex; flex-direction: column; gap: 10px; height: calc(100svh - 66px); box-sizing: border-box; padding: 16px 24px 24px; background: #fff; border-top: 1px solid var(--brg-line); animation: brg-drop .35s cubic-bezier(.2, .7, .2, 1) both; }
  .brg-drawer-search { display: flex; flex: none; height: 46px; padding-inline: 18px 6px; border-radius: 999px; background: #F3F3F1; }
  .brg-drawer-search input { flex: 1; min-width: 0; font: inherit; }
  .brg-drawer-search button { display: grid; place-items: center; width: 36px; }
  .brg-drawer nav { display: grid; }
  .brg-drawer nav a { display: flex; align-items: center; justify-content: space-between; padding: min(14px, 1.8svh) 0; border-bottom: 1px solid var(--brg-line); font-size: min(17px, 2.3svh); font-weight: 700; animation: brg-drop .45s cubic-bezier(.2, .7, .2, 1) both; transition: color .3s, padding .3s; }
  .brg-drawer nav a::after { content: "‹"; color: var(--brg-muted); font-size: 1.3em; line-height: 1; }
  .brg-drawer nav a:nth-child(2) { animation-delay: .03s; } .brg-drawer nav a:nth-child(3) { animation-delay: .06s; } .brg-drawer nav a:nth-child(4) { animation-delay: .09s; } .brg-drawer nav a:nth-child(5) { animation-delay: .12s; } .brg-drawer nav a:nth-child(n+6) { animation-delay: .15s; }
  .brg-drawer nav a[aria-current="page"] { color: var(--brg-green); }
  .brg-drawer nav a:hover { padding-inline-start: 6px; }
  .brg .brg-drawer-phone { display: flex; align-items: center; gap: 8px; margin-top: auto; color: var(--brg-green); font-weight: 800; font-size: 16px; }
  .brg-tabbar { position: fixed; z-index: 45; bottom: 0; inset-inline: 0; display: grid; grid-template-columns: repeat(3, 1fr); height: 56px; background: #fff; border-top: 1px solid var(--brg-line); }
  .brg-tabbar a { position: relative; display: grid; place-items: center; border-inline-end: 1px solid var(--brg-line); }
  .brg-tabbar a:last-child { border-inline-end: 0; }
  .brg-tabbar a[aria-current="page"] { color: var(--brg-green); }
  .brg-tabbar b { position: absolute; top: 8px; inset-inline-start: calc(50% + 6px); display: grid; place-items: center; min-width: 16px; height: 16px; border-radius: 99px; background: #F04D23; color: #fff; font-size: 10px; }
  .brg-slide-in { grid-template-columns: 1fr; gap: 0; min-height: 0; text-align: center; }
  .brg-slide::before { width: 100%; inset-block: auto 0; height: 55%; }
  .brg-slide-text { justify-items: center; padding: 34px 0 10px; gap: 12px; }
  .brg-slide-text h1, .brg-slide-text h2 { font-size: 30px; }
  .brg-slide-art { padding-bottom: 50px; }
  .brg-slide-pic img { max-height: 210px; }
  .brg-badge { width: 84px; inset-inline-start: auto; inset-inline-end: 0; top: 30%; }
  .brg-badge b { font-size: 18px; }
  .brg-tick { padding: 12px 16px; font-size: 14px; }
  .brg-sec { padding-top: 50px; }
  .brg-head { flex-direction: column; gap: 12px; margin-bottom: 22px; }
  .brg-head h2 { font-size: 28px; text-align: center; }
  /* Rows of books and categories slide sideways on phones, one card and a bit of the next. */
  .brg-books, .brg-cats { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; gap: 14px; margin-inline: -16px; padding-inline: 16px; scroll-padding-inline: 16px; }
  .brg-books::-webkit-scrollbar, .brg-cats::-webkit-scrollbar { display: none; }
  .brg-books > *, .brg-cats > * { flex: none; scroll-snap-align: start; }
  .brg-books > :nth-child(n+5) { display: grid; }
  .brg-books > .brg-card { width: 72%; }
  .brg-cats > .brg-cat { width: 42%; }
  .brg-cats-sec { margin-top: 50px; padding-bottom: 50px; }
  .brg-banner.wide { min-height: 460px; align-items: flex-start; padding: 34px 24px; }
  .brg-banner.wide .brg-banner-text { max-width: none; }
  .brg-banner.wide .brg-banner-pic img { object-position: 14% center; }
  .brg-banner.wide .brg-banner-pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(16 28 34 / .97) 0, rgb(16 28 34 / .9) 48%, rgb(16 28 34 / .2) 78%, transparent); }
  .brg-cream { margin-top: 50px; padding: 50px 0; background: var(--brg-cream); }
  .brg-promos { grid-template-columns: 1fr; gap: 14px; }
  .brg-banner.promo { min-height: 170px; }
  .brg-pick-big { grid-template-columns: 1fr; text-align: center; }
  .brg-pick-info { justify-items: center; }
  .brg-pick-info .brg-price { justify-content: center; }
  .brg-pick-list { grid-template-columns: 1fr; padding: 4px 18px; }
  .brg-mini:nth-child(odd) { margin-inline-end: 0; }
  .brg-mini:nth-last-child(2) { border-bottom: 1px solid var(--brg-line); }
  .brg-author-card { width: 40%; }
  .brg-arrow { display: none; }
  .brg-quotes { padding: 80px 0 24px; border-radius: 0; margin-inline: -16px; }
  .brg-score { top: -40px; inset-inline-end: 50%; translate: 50% 0; width: 110px; height: 110px; }
  .brg-score b { font-size: 26px; }
  .brg-quotes .brg-car { margin-inline-start: 16px; }
  .brg-quote { width: 80%; min-width: 0; }
  .brg-perks { grid-template-columns: 1fr; gap: 28px; padding-block: 40px; }
  .brg-news-row { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; margin-inline: -16px; padding-inline: 16px; padding-bottom: 50px; }
  .brg-news-row > * { flex: none; width: 84%; scroll-snap-align: start; }
  .brg-news-in { grid-template-columns: 1fr; justify-items: center; gap: 18px; text-align: center; padding-block: 34px; }
  .brg-news-text { grid-row: auto; }
  .brg-foot-cols { grid-template-columns: 1fr; gap: 26px; text-align: center; padding-block: 40px 20px; }
  .brg-foot-about { justify-items: center; }
  .brg-foot-cols > div:not(.brg-foot-about) { justify-items: center; }
  .brg-foot h4 { width: 100%; }
  .brg-foot-cols a:not(.brg-logo):not(.brg-foot-phone):not(.brg-foot-mail):hover { translate: 0 0; }
  .brg-foot-end { flex-direction: column; justify-content: center; text-align: center; }
  .brg-pays { flex-wrap: wrap; justify-content: center; }
  .brg-top { display: none; }
  .brg-preorder-in { height: auto; flex-wrap: wrap; padding-block: 16px 0; gap: 10px; }
  .brg-preorder h2 { width: 100%; font-size: 22px; text-align: center; }
  .brg-preorder-books { margin-inline: auto; }
  .brg-preorder-go { display: none; }
  .brg-shop { grid-template-columns: 1fr; gap: 0; }
  .brg-shop-side { position: static; order: 2; }
  .brg-side-lg { display: none; }
  .brg-filter-sm { display: grid; gap: 14px; order: -1; }
  .brg-filter-sm summary { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; border: 1px solid var(--brg-line); border-radius: 999px; font-weight: 800; list-style: none; cursor: pointer; }
  .brg-filter-sm summary::-webkit-details-marker { display: none; }
  .brg-shop > div { order: 1; }
  .brg-shop-side { order: 0; margin-bottom: 10px; }
  .brg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px 14px; }
  .brg-grid.wide { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .brg-card.shop .brg-card-name { font-size: 16px; }
  .brg-card.list { grid-template-columns: 110px minmax(0, 1fr); gap: 16px; }
  .brg-toolbar { flex-wrap: wrap; }
  .brg-toolbar > small { order: 3; width: 100%; text-align: center; }
  .brg-product { grid-template-columns: 1fr; gap: 26px; }
  .brg-gal img { max-height: 380px; }
  .brg-blog { grid-template-columns: 1fr; }
  .brg-blog-side { position: static; }
  .brg-blog-top { min-height: 200px; }
  .brg-post .brg-post-pic > span:first-child { aspect-ratio: 2 / 1.1; }
  .brg-contact { grid-template-columns: 1fr; text-align: center; }
  .brg-contact-form > p { margin-inline: auto; }
  .brg-contact-form form { grid-template-columns: 1fr; text-align: start; }
  .brg-contact-form .brg-btn { justify-self: start; }
  .brg-store-row { grid-template-columns: 1fr; padding-inline: 8%; }
  .brg-map iframe { height: 240px; }
  .brg-wish-row { grid-template-columns: 70px minmax(0, 1fr); }
  .brg-wish-do { grid-column: 1 / -1; border-top: 1px solid var(--brg-line); }
  .brg-line { grid-template-columns: 60px minmax(0, 1fr) auto; }
  .brg-line-total { grid-column: 2; }
  .brg-checkout { grid-template-columns: 1fr; }
}
@keyframes brg-drop { from { opacity: 0; transform: translateY(-12px); } }
`;
