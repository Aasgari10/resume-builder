/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Shirin": a pastry shop, after the Sweet Mielo reference: a chocolate header that drips onto a
// cream page, the logo in a red bowl, and the home page made of big round pastries (donuts) that
// slide in from the sides as they come into view, each with a red price badge and an "order"
// button. Besides the shop pages (all products, a category, a product with weights, cart, checkout
// with a delivery day, account) it has a custom-cake order form with a daily limit (bookings),
// about us, a gallery, a blog and contact.
// The page works without scripts: cart and wishlist buttons are small forms the server answers,
// the gallery and the product tabs are radio buttons, menus are details elements.

import type { CSSProperties, ReactNode } from "react";
import { CAKE_FIXED, addDay, cakeDefaults, emptyVisitor, formatToman, freeFor, priceCart, slotsOf, takenFor, todayTehran, unitPrice, type Product, type ResumeData, type Schedule, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SORTS, SpecsTable, Stars, timeLeft, filterProducts, PriceFilterBox } from "./shopkit";
import { mapEmbed } from "./golsara";
import { TrackBooking, bookingCss } from "./booking";

export const SHIRIN_BLOCKS = [
  { key: "showcase", label: "شیرینی‌های بزرگ صفحه‌ی اول (محصولات ویژه)" },
  { key: "collections", label: "دسته‌ها با عکس" },
  { key: "sale", label: "حراج ویژه (کالاهای تخفیف‌دار)" },
  { key: "custom", label: "نوار «کیک سفارشی»" },
  { key: "newsletter", label: "خبرنامه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const SHIRIN_OPTIONAL_PAGES = [
  { path: "/custom", label: "صفحه‌ی سفارش کیک سفارشی" },
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/gallery", label: "صفحه‌ی گالری" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

/** Every page this shop has: the fixed shop pages, one per category, product and blog post. */
export function shirinPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const own = SHIRIN_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p));
  const posts = pageOn(data, "/blog") ? livePosts(shop).map((p) => `/blog/${p.id}`) : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", "/shop", ...own, "/contact", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), ...posts, "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", "/track", ...info];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function ShirinShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = shirinPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else if (kind === "about") body = <About {...view} />;
  else if (kind === "blog") body = id ? <Post {...view} id={id} /> : <Blog {...view} />;
  else if (kind === "custom") body = <Custom {...view} />;
  else if (kind === "gallery") body = <Gallery {...view} />;
  else if (kind === "track") body = <Track {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else
    body = (
      <>
        <Trail view={view} items={[{ label: "اطلاعات" }]} />
        <div className="sn-wrap sn-sec">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`sn${page === "/" ? " sn-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className="sn-main" key={page}>
        {body}
      </main>
      {blockOn(ctx.data, "newsletter") && <Newsletter view={view} />}
      <Footer {...view} />
      <PhoneBar {...view} />
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
};
const PERK_ICONS = ["truck", "shield", "card", "undo", "gem", "gift"];
const ABOUT_ICONS = ["smile", "rocket", "heart", "gem", "shield", "gift"];

function Svg({ name, className = "sn-ico" }: { name: string; className?: string }) {
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
    <form method="post" action={view.link("/_cart")} className="sn-act">
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
    <span className="sn-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function Badge({ p }: { p: Product }) {
  const soldOut = p.stock === 0;
  if (soldOut) return <span className="sn-badge out">ناموجود</span>;
  return (
    <span className="sn-badges">
      {onSale(p) && <span className="sn-badge off">{fa(percentOff(p))}٪ تخفیف</span>}
      {p.badge && <span className="sn-badge hot">{p.badge}</span>}
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
    <article className={`sn-card${row ? " sn-row" : ""}`} style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="sn-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="sn-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
            {hover && <img src={hover} alt="" loading="lazy" className="sn-img-2" />}
          </span>
        </PageLink>
        <Badge p={p} />
        <div className="sn-card-acts">
          <Act view={view} op="wish" id={p.id} className={`sn-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="sn-round" label="دیدن محصول">
            <Svg name="eye" />
          </PageLink>
          {!soldOut && !hasChoices(p) && (
            <Act view={view} op="add" id={p.id} className="sn-round" label="افزودن به سبد خرید">
              <Svg name="bag" />
            </Act>
          )}
        </div>
      </div>
      <div className="sn-card-text">
        {cat && <small className="sn-card-cat">{cat}</small>}
        <PageLink to={productPath(p)} link={view.link} className="sn-card-name">
          <span>{p.name}</span>
        </PageLink>
                <Price view={view} p={p} />
        {row && (
          <>
            {p.description && <p className="sn-card-desc">{p.description.slice(0, 160)}</p>}
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="sn-btn small ghost">
                  انتخاب گزینه‌ها
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="sn-btn small ghost" label="افزودن به سبد خرید">
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
    <span className={`sn-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A centred heading with an optional line of text under it. */
function Head({ view, title, titlePath, text, textPath, fallback }: { view: View; title?: string; titlePath: string; text?: string; textPath?: string; fallback?: string }) {
  return (
    <div className="sn-head-c">
      <Opt value={title || fallback} editing={view.editing} edit={ed(titlePath, "text", "تیتر")}>
        <h2 {...ed(titlePath, "text", "تیتر")}>{title || fallback}</h2>
      </Opt>
      {textPath && (
        <Opt value={text} editing={view.editing} edit={ed(textPath, "text", "متن زیر تیتر")}>
          <p {...ed(textPath, "text", "متن زیر تیتر")}>{text}</p>
        </Opt>
      )}
    </div>
  );
}

/** "Home > Shop > Rings" under the header. */
function Trail({ view, items, children }: { view: View; items: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <div className="sn-wrap sn-trail-row">
      <nav className="sn-trail" aria-label="مسیر صفحه">
        <PageLink to="/" link={view.link}>
          خانه
        </PageLink>
        {items.map((t, k) => (
          <span key={k}>
            <Svg name="left" className="sn-ico sn-sep" />
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
      {children}
    </div>
  );
}

/** The grey picture band with the page name in the middle (shop and category pages). */
function Banner({ view, title, items }: { view: View; title: string; items: { label: string; to?: string }[] }) {
  const img = safeUrl(view.shop.heroImage);
  return (
    <section className="sn-banner" {...ed("site.shop.heroImage", "image", "عکس بالای صفحه‌ی فروشگاه")}>
      {img && <img src={img} alt="" />}
      <div>
        <h1>{title}</h1>
        <nav className="sn-trail" aria-label="مسیر صفحه">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          {items.map((t, k) => (
            <span key={k}>
              <i>/</i>
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
    </section>
  );
}

function Empty({ view, text }: { view: View; text: string }) {
  return (
    <div className="sn-wrap sn-empty">
      <p className="sn-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="sn-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Frame: top strips, header, newsletter, footer ───────────── */

function menu(view: View) {
  const data = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    { to: "/shop", label: "فروشگاه", cats: true },
    { to: "/shop?sale=1", label: "حراج ویژه", sale: true },
    { to: "/about", label: "درباره‌ی ما" },
    { to: "/blog", label: "بلاگ" },
    { to: "/contact", label: "تماس با ما" },
  ].filter((m) => (m.to === "/about" || m.to === "/blog" ? pageOn(data, m.to) : m.sale ? saleProducts(visible(view.shop)).length > 0 : true));
}

const isHere = (view: View, to: string) =>
  to === "/" ? view.page === "/" : to === "/shop" ? view.page === "/shop" || view.page.startsWith("/category/") || view.page.startsWith("/product/") : to.includes("?") ? false : view.page === to || view.page.startsWith(`${to}/`);

function Logo({ view, className = "sn-logo" }: { view: View; className?: string }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className={className}>
      {logo ? (
        <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو (خالی: نام فروشگاه)")} />
      ) : (
        <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>
      )}
      <span className="sr-only">{b.fullName}</span>
    </PageLink>
  );
}

const shopCats = (shop: Shop) => (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id));

function Nav({ view, className }: { view: View; className: string }) {
  return (
    <nav className={className}>
      {menu(view).map((m) => (
        <span key={m.to} className="sn-nav-item">
          <PageLink to={m.to} link={view.link} current={isHere(view, m.to)}>
            {m.label}
          </PageLink>
        </span>
      ))}
    </nav>
  );
}

function Icons({ view, search }: { view: View; search?: boolean }) {
  const { link, visitor, shop } = view;
  const count = priceCart(shop, visitor.cart).count;
  const wishes = visitor.wishlist.filter((id) => visible(shop).some((p) => p.id === id)).length;
  return (
    <div className="sn-icons">
      {search && (
        <PageLink to="/search" link={link} className="sn-icon sn-icon-search">
          <Svg name="search" />
          <span className="sr-only">جست‌وجو</span>
        </PageLink>
      )}
      {visitor.customer ? (
        <PageLink to="/account" link={link} className="sn-icon sn-icon-user">
          <Svg name="user" />
          <span className="sr-only">حساب {visitor.customer.name}</span>
        </PageLink>
      ) : (
        <label htmlFor="sn-login" className="sn-icon sn-icon-user" title="ورود / ثبت‌نام">
          <Svg name="user" />
          <span className="sr-only">ورود / ثبت‌نام</span>
        </label>
      )}
      <PageLink to="/wishlist" link={link} className="sn-icon sn-icon-wish">
        <Svg name="heart" />
        <i>{fa(wishes)}</i>
        <span className="sr-only">علاقه‌مندی‌ها</span>
      </PageLink>
      <PageLink to="/cart" link={link} className="sn-icon">
        <Svg name="bag" />
        <i>{fa(count)}</i>
        <span className="sr-only">سبد خرید</span>
      </PageLink>
    </div>
  );
}

/** The phone menu: opens without scripts (a details element). */
function Drawer({ view }: { view: View }) {
  const { link } = view;
  return (
    <details className="sn-menu">
      {/* Open, the summary covers the page behind the menu: a click there (or on its close button) shuts it. */}
      <summary className="sn-icon sn-burger" aria-label="منو">
        <Svg name="menu" className="sn-ico sn-burger-ico" />
        <Svg name="close" className="sn-ico sn-x" />
      </summary>
      <div className="sn-drawer">
        <div className="sn-drawer-head">
          <Logo view={view} />
        </div>
        <form method="get" action={link("/search")} className="sn-drawer-search">
          <input name="q" placeholder="جست‌وجوی محصول" aria-label="جست‌وجوی محصول" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        <input type="radio" name="sn-dtab" id="sn-dtab-1" className="sn-dtab" defaultChecked />
        <input type="radio" name="sn-dtab" id="sn-dtab-2" className="sn-dtab" />
        <div className="sn-dtabs">
          <label htmlFor="sn-dtab-1">منو</label>
          <label htmlFor="sn-dtab-2">دسته‌ها</label>
        </div>
        <div className="sn-dpanel sn-dpanel-1">
          <Nav view={view} className="sn-drawer-nav" />
          <PageLink to="/wishlist" link={link}>
            علاقه‌مندی‌ها
          </PageLink>
          <PageLink to="/account" link={link}>
            {view.visitor.customer ? "حساب من" : "ورود / ثبت‌نام"}
          </PageLink>
        </div>
        <div className="sn-dpanel sn-dpanel-2">
          <PageLink to="/shop" link={link}>
            محصولات جدید
          </PageLink>
          {saleProducts(visible(view.shop)).length > 0 && (
            <PageLink to="/shop?sale=1" link={link}>
              حراج امروز
            </PageLink>
          )}
          {shopCats(view.shop).map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
              {c.name}
            </PageLink>
          ))}
        </div>
        <Socials ctx={view.ctx} editing={false} className="sn-socials sn-drawer-socials" />
      </div>
    </details>
  );
}

function Header(view: View) {
  const { ctx, editing } = view;
  return (
    <header className="sn-head">
      <div className="sn-wrap sn-head-top">
        <Drawer view={view} />
        <div className="sn-follow">
          <b>ما را دنبال کنید</b>
          <i aria-hidden="true" />
          <Socials ctx={ctx} editing={editing} className="sn-head-socials" />
        </div>
        <div className="sn-bowl">
          <Logo view={view} />
        </div>
        <Icons view={view} search />
      </div>
      <div className="sn-wrap sn-head-nav">
        <Nav view={view} className="sn-nav" />
      </div>
    </header>
  );
}

function Newsletter({ view }: { view: View }) {
  const { shop, editing } = view;
  const home = view.page === "/";
  return (
    <section className={`sn-news ${home ? "is-home" : ""}`}>
      <div className="sn-wrap">
        <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>
          <h2 {...ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>{shop.newsletterTitle}</h2>
        </Opt>
        <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن خبرنامه")}>
          <p {...ed("site.shop.newsletterText", "text", "متن خبرنامه")}>{shop.newsletterText}</p>
        </Opt>
        <form method="post" action={view.link("/_form")} className="sn-news-form">
          <FormMeta kind="newsletter" back={view.page} />
          <input name="email" type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
          <button type="submit">عضویت</button>
        </form>
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
    <footer className="sn-foot">
      <div className="sn-wrap sn-foot-cols">
        <div className="sn-foot-brand">
          <PageLink to="/" link={link} className="sn-foot-logo">
            {safeUrl(site?.signatureImage) ? <img src={safeUrl(site?.signatureImage)} alt={b.fullName} {...ed("site.signatureImage", "image", "لوگوی پایین صفحه")} /> : <b>{b.fullName}</b>}
          </PageLink>
          <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه")}>
            <p {...ed("basics.summary", "multiline", "معرفی کوتاه")}>{b.summary}</p>
          </Opt>
          <Socials ctx={ctx} editing={editing} className="sn-socials" />
        </div>
        <div>
          <h3>شیرینی‌ها</h3>
          <PageLink to="/shop" link={link}>
            همه‌ی محصولات
          </PageLink>
          {shopCats(shop)
            .slice(0, 5)
            .map((c) => (
              <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
                {c.name}
              </PageLink>
            ))}
        </div>
        <div>
          <h3>{b.fullName}</h3>
          {SHIRIN_OPTIONAL_PAGES.filter((p) => pageOn(ctx.data, p.path)).map((p) => (
            <PageLink key={p.path} to={p.path} link={link}>
              {p.label.replace(/^صفحه‌ی /, "").replace("سفارش کیک سفارشی", "کیک سفارشی")}
            </PageLink>
          ))}
          <PageLink to="/contact" link={link}>
            تماس با ما
          </PageLink>
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </div>
        <div className="sn-foot-store">
          <h3>سفارش تلفنی</h3>
          {b.phone && (
            <a href={telHref(b.phone)} className="sn-foot-phone">
              <Svg name="phone" />
              <b dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </b>
            </a>
          )}
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <p {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</p>
          </Opt>
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</p>
          </Opt>
        </div>
      </div>
      <div className="sn-wrap sn-foot-bottom">
        <small>© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
        <a href="#" className="sn-top-btn" aria-label="بالای صفحه">
          <Svg name="up" />
        </a>
      </div>
    </footer>
  );
}

/** The bar at the bottom of phone screens, as in the reference: home, search, wishlist, account. */
function PhoneBar(view: View) {
  const { link, visitor } = view;
  return (
    <nav className="sn-phonebar" aria-label="میان‌برها">
      <PageLink to="/" link={link} current={view.page === "/"}>
        <Svg name="home" />
        خانه
      </PageLink>
      <PageLink to="/search" link={link} current={view.page === "/search"}>
        <Svg name="search" />
        جست‌وجو
      </PageLink>
      <PageLink to="/wishlist" link={link} current={view.page === "/wishlist"}>
        <Svg name="heart" />
        <i>{fa(visitor.wishlist.length)}</i>
        علاقه‌مندی
      </PageLink>
      <PageLink to="/account" link={link} current={view.page === "/account"}>
        <Svg name="user" />
        حساب
      </PageLink>
    </nav>
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
      <input type="checkbox" id="sn-login" className="sn-pop-in" aria-hidden="true" tabIndex={-1} />
      <div className="sn-pop" role="dialog" aria-label="ورود یا ثبت‌نام">
        <label htmlFor="sn-login" className="sn-pop-shade" aria-label="بستن" />
        <div className="sn-pop-box">
          <label htmlFor="sn-login" className="sn-pop-x" aria-label="بستن">
            <Svg name="close" />
          </label>
          <input type="radio" name="sn-lt" id="sn-lt-1" className="sn-lt" defaultChecked />
          <input type="radio" name="sn-lt" id="sn-lt-2" className="sn-lt" />
          <div className="sn-lt-tabs">
            <label htmlFor="sn-lt-1">ورود</label>
            <label htmlFor="sn-lt-2">ثبت‌نام</label>
          </div>
          <form method="post" action={link("/_account")} className="sn-pop-form">
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
            <button type="submit" className="sn-btn wide">
              ورود
            </button>
            <small>
              رمز را فراموش کرده‌اید؟{" "}
              <PageLink to="/contact" link={link}>
                با ما تماس بگیرید
              </PageLink>
            </small>
          </form>
          <form method="post" action={link("/_account")} className="sn-pop-form">
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
            <button type="submit" className="sn-btn wide">
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
  if (!added || !visible(shop).some((p) => p.id === added)) return null;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <>
      <input type="checkbox" id="sn-mc" className="sn-pop-in sn-mc-in" defaultChecked aria-hidden="true" tabIndex={-1} />
      <div className="sn-mc" role="dialog" aria-label="سبد خرید">
        <label htmlFor="sn-mc" className="sn-pop-shade" aria-label="بستن" />
        <aside className="sn-mc-box">
          <header>
            <h2>سبد خرید شما ({fa(cart.count)})</h2>
            <label htmlFor="sn-mc">بستن</label>
          </header>
          <div className="sn-mc-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="sn-mc-line">
                <PageLink to={productPath(l.product)} link={link} className="sn-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div>
                  <PageLink to={productPath(l.product)} link={link}>
                    {l.product.name}
                  </PageLink>
                  {l.size && <small>{l.size}</small>}
                  <div className="sn-stepper">
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
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="sn-remove" label="حذف از سبد">
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
            <PageLink to="/cart" link={link} className="sn-btn ghost wide">
              دیدن سبد خرید
            </PageLink>
            <PageLink to="/checkout" link={link} className="sn-btn wide">
              ادامه و پرداخت
            </PageLink>
          </footer>
        </aside>
      </div>
    </>
  );
}

/* ───────────── Home ───────────── */

/** A product name on two lines, as in the reference ("Sweet donut / with nuts"): the first half red. */
function twoLines(name: string): [string, string] {
  const w = name.trim().split(/\s+/);
  if (w.length < 2) return [name, ""];
  const cut = Math.ceil(w.length / 2);
  return [w.slice(0, cut).join(" "), w.slice(cut).join(" ")];
}

/** "۴۹۰ هزار تومان" in the badge (whole thousands of tomans read best on a small round tag). */
function Tag({ view, p }: { view: View; p: Product }) {
  const n = unitPrice(p);
  const big = n >= 1000 && n % 1000 === 0;
  return (
    <span className="sn-tag" aria-label={money(view, n)}>
      <b>{fa(big ? n / 1000 : n)}</b>
      <small>{big ? "هزار تومان" : "تومان"}</small>
      {n < p.price && <s>{fa(p.price >= 1000 && p.price % 1000 === 0 ? p.price / 1000 : p.price)}</s>}
    </span>
  );
}

const CHOCO = (n: number) => sampleImage(`sh-choco-${((n - 1) % 12) + 1}`, "png");

/** One big pastry of the home page: text on one side, the round picture coming in from the other. */
function Showcase({ view, p, k }: { view: View; p: Product; k: number }) {
  const [a, b] = twoLines(p.name);
  const img = pic(p);
  const soldOut = p.stock === 0;
  const facts = (p.specs ?? []).slice(0, 2);
  return (
    <section className={`sn-show ${k % 2 ? "is-end" : "is-start"}`} data-product={p.id}>
      <img src={CHOCO(k * 2 + 1)} alt="" aria-hidden="true" className="sn-choco c1" loading="lazy" />
      <img src={CHOCO(k * 2 + 6)} alt="" aria-hidden="true" className="sn-choco c2" loading="lazy" />
      <div className="sn-wrap sn-show-in">
        <div className="sn-show-text">
          <h2>
            <span>{a}</span>
            {b && <span>{b}</span>}
          </h2>
          {p.description && <p>{p.description.split("\n")[0]}</p>}
          {facts.length > 0 && (
            <ul className="sn-facts">
              {facts.map((f, i) => (
                <li key={f.label}>
                  <Svg name={i ? "scale" : "fire"} />
                  {f.label}: {f.value}
                </li>
              ))}
            </ul>
          )}
          <div className="sn-show-btns">
            {soldOut ? (
              <span className="sn-btn grey">تمام شد</span>
            ) : hasChoices(p) ? (
              <PageLink to={productPath(p)} link={view.link} className="sn-btn">
                سفارش
              </PageLink>
            ) : (
              <Act view={view} op="add" id={p.id} className="sn-btn" label={`سفارش ${p.name}`}>
                سفارش
              </Act>
            )}
            <PageLink to={productPath(p)} link={view.link} className="sn-more">
              جزئیات
            </PageLink>
          </div>
        </div>
        <PageLink to={productPath(p)} link={view.link} className="sn-show-pic" label={p.name} product={p.id}>
          <span className="sn-roll">
            <span className="sn-roll-in">
              {img ? <img src={img} alt={p.name} loading={k ? "lazy" : undefined} /> : <b>{p.name.charAt(0)}</b>}
            </span>
            {p.price > 0 && <Tag view={view} p={p} />}
          </span>
        </PageLink>
      </div>
    </section>
  );
}

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = shopCats(shop);
  const picks = products.filter((p) => p.featured);
  const show = (picks.length ? picks : products).slice(0, 8);
  const sale = saleProducts(products).slice(0, 8);
  return (
    <>
      {on("showcase") && show.map((p, k) => <Showcase key={p.id} view={view} p={p} k={k} />)}

      {on("collections") && cats.length > 0 && (
        <section className="sn-wrap sn-sec">
          <Head view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" text={shop.newText} textPath="site.shop.newText" fallback="دسته‌ها" />
          <div className="sn-cats">
            {cats.slice(0, 6).map((c) => {
              const img = safeUrl(c.image) ?? pic(products.find((p) => p.categoryId === c.id)!);
              return (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} className="sn-cat">
                  <span className="sn-cat-pic">{img && <img src={img} alt="" loading="lazy" />}</span>
                  <b>{c.name}</b>
                </PageLink>
              );
            })}
          </div>
        </section>
      )}

      {on("sale") && sale.length > 0 && (
        <section className="sn-wrap sn-sec sn-sec-tight">
          <div className="sn-sale-head">
            <h2 {...ed("site.shop.discountTitle", "text", "تیتر حراج")}>{shop.discountTitle?.trim() || "حراج ویژه"}</h2>
            <SaleClock p={sale[0]!} />
            <PageLink to="/shop?sale=1" link={link} className="sn-more">
              همه‌ی حراجی‌ها
            </PageLink>
          </div>
          <div className="sn-slide-row">
            {sale.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("custom") && pageOn(data, "/custom") && (
        <section className="sn-custom-band">
          <div className="sn-wrap sn-custom-in">
            <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس" className="sn-custom-pic" />
            <div>
              <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "تیتر")}>
                <h2 {...ed("site.shop.lookTitle", "text", "تیتر")}>{shop.lookTitle}</h2>
              </Opt>
              <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "multiline", "متن")}>
                <p {...ed("site.shop.lookText", "multiline", "متن")}>{shop.lookText}</p>
              </Opt>
              <PageLink to="/custom" link={link} className="sn-btn yellow">
                سفارش کیک سفارشی
              </PageLink>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** Time left of a sale, as "۲ روز و ۵ ساعت تا پایان حراج". */
function SaleClock({ p }: { p: Product }) {
  if (!p.saleEndsAt || !onSale(p)) return null;
  const { d, h, m } = timeLeft(p.saleEndsAt);
  const text = d ? `${fa(d)} روز${h ? ` و ${fa(h)} ساعت` : ""}` : h ? `${fa(h)} ساعت${m ? ` و ${fa(m)} دقیقه` : ""}` : `${fa(Math.max(1, m))} دقیقه`;
  return (
    <span className="sn-clock">
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
      <section className="sn-wrap sn-plp">
        <div className="sn-plp-main">
          <div className="sn-plp-bar">
            <label htmlFor="sn-ftog" className="sn-ftog-btn">
              <Svg name="list" /> فیلترها
            </label>
            <small>
              {fa(from)}–{fa(from ? from + shown.length - 1 : 0)} از {fa(list.length)} محصول
            </small>
            <SortMenu view={view} here={here} />
            <div className="sn-views">
              {VIEWS.map(([k, icon, label]) => (
                <a key={k} href={`${link(here)}${qsOf(q, { view: k === "3" ? undefined : k, p: undefined })}`} aria-current={mode === k || undefined} title={label} aria-label={label}>
                  <Svg name={icon} />
                </a>
              ))}
            </div>
          </div>
          {shown.length ? (
            <div className={`sn-grid sn-cols-${mode}`}>
              {shown.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} row={mode === "list"} />
              ))}
            </div>
          ) : (
            <p className="sn-notice">{base.active || list.length !== base.list.length ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
          {pages > 1 && (
            <nav className="sn-pager" aria-label="صفحه‌ها">
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
        <input type="checkbox" id="sn-ftog" className="sn-ftog" aria-label="نمایش فیلترها" />
        <Sidebar view={view} here={here} cats={cats} cat={cat} />
      </section>
    </>
  );
}

function SideBox({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="sn-side-box" open={open}>
      <summary>
        {title}
        <Svg name="up" className="sn-ico sn-caret" />
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
    <aside className="sn-side">
      <SideBox title="دسته‌ها">
        <nav className="sn-side-cats">
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
      <form method="get" action={link(here)} className="sn-facets">
        <Keep query={q} skip={["size", "sale", "stock", "p"]} />
        {sizes.length > 0 && (
          <SideBox title="وزن و اندازه">
            <div className="sn-sizes">
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
          <label className="sn-check">
            <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} />
            <span>تخفیف‌دارها</span>
          </label>
          <label className="sn-check">
            <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} />
            <span>کالاهای موجود</span>
          </label>
        </SideBox>
        <div className="sn-facets-foot">
          <button type="submit" className="sn-btn small">
            اعمال فیلترها
          </button>
          <a href={link(here)} className="sn-under">
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
    <details className="sn-sort">
      <summary>
        مرتب‌سازی: <b>{now[1]}</b>
        <Svg name="down" className="sn-ico sn-caret" />
      </summary>
      <div className="sn-sort-list">
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
      <PriceFilterBox link={view.link} here={here} query={view.visitor.query} prices={prices} buttonClass="sn-btn tiny" />
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
  const p = all.find((x) => x.id === view.id)!;
  const k = all.indexOf(p);
  const prev = all[k - 1];
  const next = all[k + 1];
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
        <span className="sn-prevnext">
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
      <section className="sn-wrap sn-product" data-product={p.id}>
        <div className={`sn-gallery sn-n${Math.min(imgs.length, 6)}`}>
          {imgs.length > 1 && imgs.slice(0, 6).map((_, i) => <input key={i} type="radio" name="sn-g" id={`sn-g-${i}`} className="sn-g" defaultChecked={i === 0} aria-label={`عکس ${fa(i + 1)}`} />)}
          <div className="sn-thumbs">
            {imgs.length > 1 &&
              imgs.slice(0, 6).map((src, i) => (
                <label key={i} htmlFor={`sn-g-${i}`}>
                  <img src={src} alt="" loading="lazy" />
                </label>
              ))}
          </div>
          <div className="sn-mainpic">
            {(imgs.length ? imgs.slice(0, 6) : [undefined]).map((src, i) =>
              src ? (
                <ZoomOpen key={i} id={`${p.id}-${i}`} className="sn-big">
                  <img src={src} alt={p.name} />
                  <span className="sn-zoom-ico">
                    <Svg name="expand" />
                  </span>
                </ZoomOpen>
              ) : (
                <span key={i} className="sn-big" />
              ),
            )}
            <Badge p={p} />
          </div>
        </div>
        <div className="sn-info">
          <h1>{p.name}</h1>
          {rating?.count ? (
            <a href="#sn-tab-reviews" className="sn-rating">
              <Stars value={rating.avg} /> <small>({fa(rating.count)} نظر)</small>
            </a>
          ) : null}
          <div className="sn-info-price">
            <Price view={view} p={p} />
            {onSale(p) && !soldOut && <span className="sn-save">{fa(percentOff(p))}٪ تخفیف</span>}
          </div>
          <SaleClock p={p} />
          {p.description && <p className="sn-desc">{p.description.split("\n")[0]}</p>}
          <p className="sn-avail">
            وضعیت: {soldOut ? <b className="out">ناموجود</b> : <b className="in">{p.stock !== undefined && p.stock <= 3 ? `فقط ${fa(p.stock)} عدد موجود است` : "موجود"}</b>}
          </p>
          {soldOut ? (
            <p className="sn-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="sn-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <OptionPicker p={p} />
              <div className="sn-buy-row">
                <label className="sn-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" name="back" value={view.page} className="sn-btn">
                  افزودن به سبد خرید
                </button>
              </div>
              <button type="submit" name="back" value="/checkout" className="sn-btn grey wide">
                خرید فوری
              </button>
            </form>
          )}
          <div className="sn-links">
            <Act view={view} op="wish" id={p.id} className="sn-linkbtn" label="علاقه‌مندی">
              <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            </Act>
            {hasReturns && (
              <PageLink to={`/page/${hasReturns.slug}`} link={link} className="sn-linkbtn">
                <Svg name="undo" /> {hasReturns.title}
              </PageLink>
            )}
            <PageLink to="/contact" link={link} className="sn-linkbtn">
              <Svg name="question" /> سؤال درباره‌ی این محصول
            </PageLink>
          </div>
          <p className="sn-eta">
            <Svg name="truck" /> زودترین زمان تحویل: <b>{deliveryWindow()}</b>
          </p>
          {perks.length > 0 && (
            <ul className="sn-perks">
              {perks.map((x, i) => (
                <li key={x.id}>
                  {safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={PERK_ICONS[i % PERK_ICONS.length]!} />}
                  <span>{x.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="sn-meta">
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
      <section className="sn-wrap sn-tabs">
        {tabs.map((t, i) => (
          <input key={t.id} type="radio" name="sn-tab" id={`sn-tab-${t.id}`} className="sn-tab-in" defaultChecked={i === 0} />
        ))}
        <div className="sn-tab-labels" role="tablist">
          {tabs.map((t) => (
            <label key={t.id} htmlFor={`sn-tab-${t.id}`} role="tab">
              {t.label}
            </label>
          ))}
        </div>
        <div className="sn-tab-panels">
          <div className="sn-tab-panel">
            <div className="sn-tab-desc">
              <div className="sn-text">
                <Para text={p.description} />
              </div>
              {imgs[1] && <img src={imgs[1]} alt="" loading="lazy" />}
            </div>
          </div>
          <div className="sn-tab-panel">
            <SpecsTable p={p} className="sn-specs" />
            {!(p.specs ?? []).length && <p className="sn-muted">مشخصاتی برای این محصول ثبت نشده است.</p>}
          </div>
          <div className="sn-tab-panel">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length + more.length > 0 && (
        <section className="sn-wrap sn-sec">
          <Head view={view} title="محصولات مرتبط" titlePath="site.shop.products" />
          <div className="sn-slide-row">
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
    <p className="sn-meta sn-share">
      اشتراک‌گذاری:
      <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
        <Icon name="telegram" className="sn-ico" />
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
        <Icon name="whatsapp" className="sn-ico" />
      </a>
    </p>
  );
}

/* ───────────── About, blog, contact ───────────── */

function About(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const stats = shop.stats ?? [];
  const perks = shop.perks ?? [];
  const team = (site?.clients ?? []).filter((c) => c.name.trim());
  const quotes = (site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  return (
    <>
      <Trail view={view} items={[{ label: "درباره‌ی ما" }]} />
      <section className="sn-wrap sn-about-top">
        <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر صفحه")}>
          <h1 {...ed("site.aboutTitle", "text", "تیتر صفحه")}>{site?.aboutTitle}</h1>
        </Opt>
        <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط زیر تیتر")}>
          <p {...ed("site.shop.heroKicker", "text", "خط زیر تیتر")}>{shop.heroKicker}</p>
        </Opt>
      </section>
      <section className="sn-about-pics">
        <Pic src={site?.heroImage} path="site.heroImage" label="عکس اول" />
        <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس دوم" />
      </section>
      <section className="sn-wrap sn-sec sn-story">
        <h2>
          <span {...ed("site.shop.showcaseText", "text", "تیتر")}>{shop.showcaseText || "داستان ما"}</span>
          <i aria-hidden="true" />
        </h2>
        <div>
          <Opt value={shop.discoverTitle} editing={editing} edit={ed("site.shop.discoverTitle", "multiline", "جمله‌ی اول")}>
            <p className="sn-story-lead" {...ed("site.shop.discoverTitle", "multiline", "جمله‌ی اول")}>
              {shop.discoverTitle}
            </p>
          </Opt>
          <div className="sn-text" {...ed("site.aboutText", "multiline", "متن داستان")}>
            <Para text={site?.aboutText} />
          </div>
        </div>
      </section>
      {stats.length > 0 && (
        <section className="sn-mission">
          <Pic src={shop.discoverImage} path="site.shop.discoverImage" label="عکس" className="sn-mission-pic" />
          <div className="sn-mission-text">
            {stats.slice(0, 3).map((s) => (
              <div key={s.id}>
                <h3>{s.label}</h3>
                {s.text && <p>{s.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {perks.length > 0 && (
        <section className="sn-wrap sn-sec">
          <Head view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" fallback="چرا ما را انتخاب می‌کنند" />
          <div className="sn-values">
            {perks.map((x, i) => (
              <div key={x.id}>
                {safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={ABOUT_ICONS[i % ABOUT_ICONS.length]!} />}
                <h3>{x.title}</h3>
                {x.text && <p>{x.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {team.length > 0 && (
        <section className="sn-wrap sn-sec sn-sec-line">
          <Head view={view} title={shop.bestText} titlePath="site.shop.bestText" fallback="تیم ما" />
          <div className="sn-team">
            {team.map((m) => (
              <figure key={m.id}>
                <span className="sn-team-pic">{safeUrl(m.image) && <img src={safeUrl(m.image)} alt={m.name} loading="lazy" />}</span>
                <figcaption>
                  <b>{m.name}</b>
                  {m.text && <small>{m.text}</small>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      {quotes.length > 0 && <Quotes view={view} quotes={quotes} />}
    </>
  );
}

/** What customers said, one at a time; the arrows are labels of hidden radio buttons (no script). */
function Quotes({ view, quotes }: { view: View; quotes: NonNullable<NonNullable<ResumeData["site"]>["testimonials"]> }) {
  const n = Math.min(quotes.length, 5);
  return (
    <section className={`sn-quotes sn-q${n}`}>
      {n > 1 && quotes.slice(0, n).map((t, k) => <input key={t.id} type="radio" name="sn-q" id={`sn-q-${k}`} className="sn-q-in" defaultChecked={k === 0} aria-label={`نظر ${fa(k + 1)}`} />)}
      <div className="sn-wrap sn-q-list">
        {quotes.slice(0, n).map((t, k) => {
          const at = item("site.testimonials", t.id);
          return (
            <figure key={t.id} className="sn-q-item">
              <div>
                <small>{view.ctx.data.basics.fullName}، انتخاب ما</small>
                <span className="sn-stars" aria-label={`${fa(t.rating ?? 5)} ستاره`}>
                  {"★".repeat(t.rating ?? 5)}
                </span>
                <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                <figcaption {...ed(`${at}.name`, "text", "نام")}>— {t.name}</figcaption>
                {n > 1 && (
                  <span className="sn-q-arrows">
                    <label htmlFor={`sn-q-${(k + n - 1) % n}`} aria-label="قبلی">
                      <Svg name="right" />
                    </label>
                    <label htmlFor={`sn-q-${(k + 1) % n}`} aria-label="بعدی">
                      <Svg name="left" />
                    </label>
                  </span>
                )}
              </div>
              <span className="sn-q-pic" {...ed(`${at}.image`, "image", "عکس")}>
                {safeUrl(t.image) && <img src={safeUrl(t.image)} alt="" loading="lazy" />}
              </span>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function BlogSide({ view }: { view: View }) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  return (
    <aside className="sn-side sn-blog-side">
      <form method="get" action={link("/search")} className="sn-side-search">
        <input name="q" placeholder="جست‌وجو..." aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <SideBox title="تازه‌ترین مطالب">
        {posts.slice(0, 3).map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={link} className="sn-mini">
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
          <div className="sn-tags">
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
      <section className="sn-wrap">
        <h1 className="sn-page-title">بلاگ</h1>
      </section>
      <section className="sn-wrap sn-blog">
        <div className="sn-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="sn-post-card">
                <PageLink to={`/blog/${p.id}`} link={link} className="sn-post-pic">
                  {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
                  {p.category && <span className="sn-badge dark">{p.category}</span>}
                </PageLink>
                <small className="sn-post-meta">
                  {p.author && `${p.author} · `}
                  {p.date && faDate(p.date)}
                </small>
                <h2>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <span {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</span>
                  </PageLink>
                </h2>
                <p>{p.excerpt || p.text.slice(0, 200)}</p>
                <PageLink to={`/blog/${p.id}`} link={link} className="sn-btn tiny ghost">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
          {!posts.length && <p className="sn-notice">هنوز مطلبی نوشته نشده است.</p>}
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
      <section className="sn-wrap sn-blog">
        <article className="sn-article">
          {p.category && <span className="sn-badge dark">{p.category}</span>}
          <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
          <small className="sn-post-meta">
            {p.author && `${p.author} · `}
            {p.date && faDate(p.date)}
          </small>
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" className="sn-article-pic" {...ed(`${at}.image`, "image", "عکس")} />}
          <div className="sn-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          <nav className="sn-post-nav">
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
            <div className="sn-related">
              <h2>شاید این‌ها را هم دوست داشته باشید</h2>
              <div>
                {related.map((r) => (
                  <PageLink key={r.id} to={`/blog/${r.id}`} link={link} className="sn-rel">
                    <span>
                      {safeUrl(r.image) && <img src={safeUrl(r.image)} alt="" loading="lazy" />}
                      {r.category && <i className="sn-badge dark">{r.category}</i>}
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
      <section className="sn-wrap sn-about-top">
        <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر")}>
          <h1 {...ed("site.contactTitle", "text", "تیتر")}>{site?.contactTitle}</h1>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
          <p {...ed("site.contactText", "multiline", "متن")}>{site?.contactText}</p>
        </Opt>
      </section>
      <section className="sn-wrap sn-contact">
        <div className="sn-contact-info">
          {rows.map((r) => (
            <Opt key={r.path} value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
              <div className="sn-contact-item">
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
          <Socials ctx={ctx} editing={editing} className="sn-socials" />
        </div>
        <form method="post" action={view.link("/_form")} className="sn-message">
          <FormMeta kind="contact" back={view.page} />
          <h2>برای ما پیام بگذارید</h2>
          <input name="name" placeholder="نام شما" aria-label="نام شما" />
          <input name="phone" placeholder="شماره‌ی تماس" aria-label="شماره‌ی تماس" dir="ltr" inputMode="tel" />
          <textarea name="body" required rows={5} placeholder="پیام شما" aria-label="پیام شما" />
          <button type="submit" className="sn-btn">
            ارسال پیام
          </button>
        </form>
      </section>
      <section className="sn-wrap sn-sec sn-sec-tight">
        {embed ? (
          <div className="sn-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
            <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
            <a href={map} {...outside(map)} className="sn-btn small">
              مسیریابی
            </a>
          </div>
        ) : (
          <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
            <a href={map ?? "#"} {...outside(map)} className="sn-map-link" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
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
      <h1 className="sn-wrap sn-page-title">سبد خرید</h1>
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="sn-wrap sn-cart">
          <div className="sn-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="sn-line">
                <PageLink to={productPath(l.product)} link={link} className="sn-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="sn-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                                    {l.size && <small>{l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="sn-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="sn-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="sn-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="sn-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="sn-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="sn-btn wide">
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
      <h1 className="sn-wrap sn-page-title">علاقه‌مندی‌ها</h1>
      {items.length === 0 ? (
        <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <section className="sn-wrap sn-sec sn-sec-tight">
          <div className="sn-grid sn-cols-4">
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
      <section className="sn-wrap sn-search">
        <form method="get" action={view.link("/search")} className="sn-search-box">
          <input name="q" defaultValue={q} placeholder="انگشتر، گردنبند، دستبند..." aria-label="جست‌وجو" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        {active &&
          (found.length ? (
            <>
              <p className="sn-muted">{fa(found.length)} محصول پیدا شد.</p>
              <div className="sn-grid sn-cols-4">
                {found.map((p, k) => (
                  <ProductCard key={p.id} view={view} p={p} i={k} />
                ))}
              </div>
            </>
          ) : (
            <p className="sn-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
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
      <h1 className="sn-wrap sn-page-title">ثبت سفارش</h1>
      <section className="sn-wrap sn-cart">
        <form method="post" action={link("/_order")} className="sn-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="sn-error">{error}</p>}
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
            روز تحویل *
            <DaySelect name="deliveryDay" schedule={cakeSchedule(shop)} days={14} />
          </label>
          <label className="full">
            توضیحات سفارش
            <textarea name="note" maxLength={400} rows={2} placeholder="ساعت دلخواه تحویل، متن کارت تبریک و..." />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" className="sn-trap" aria-hidden="true" />
          <button type="submit" className="sn-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="sn-sum">
          <h2>سفارش شما</h2>
          <ul className="sn-sum-lines">
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
                <dd className="sn-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="sn-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
      <section className="sn-wrap sn-sec sn-sec-tight">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="sn-wrap sn-thanks">
      <span className="sn-done" aria-hidden="true">
        ✓
      </span>
      <h1>ممنون از خرید شما!</h1>
      {code && (
        <p>
          کد پیگیری سفارش: <b dir="ltr">{code}</b>
        </p>
      )}
      {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
      {shop.paymentNote && <p className="sn-pay">{shop.paymentNote}</p>}
      <PageLink to="/shop" link={view.link} className="sn-btn">
        بازگشت به فروشگاه
      </PageLink>
    </section>
  );
}


/* ───────────── Delivery days, custom cakes, gallery, tracking ───────────── */

/**
 * The shop's baking days: open weekdays, days off, how far ahead, and how many custom cakes a day
 * (one booking time a day, at midnight: today is never offered, the cakes need a day).
 */
const cakeSchedule = (shop: Shop): Schedule => ({ ...cakeDefaults(), ...shop.schedule, ...CAKE_FIXED });
const dayLabel = (d: string) => faDate(d, { weekday: "long", day: "numeric", month: "long" });

/** A day in the Persian calendar ("پنجشنبه ۲۹ آبان") from tomorrow on; closed days are left out, full ones say so. */
function DaySelect({ name, schedule: s, days, taken, value }: { name: string; schedule: Schedule; days: number; taken?: Record<string, number>; value?: string }) {
  const today = todayTehran();
  const list = Array.from({ length: Math.min(days, s.ahead) }, (_, k) => addDay(today, k + 1)).filter((d) => slotsOf(s, d).length > 0);
  const free = (d: string) => (taken ? freeFor(s, taken, d, s.start) > 0 : true);
  const first = list.find(free);
  return (
    <select name={name} required defaultValue={value && list.includes(value) && free(value) ? value : first}>
      {list.map((d) => (
        <option key={d} value={d} disabled={!free(d)}>
          {d === addDay(today, 1) ? "فردا، " : ""}
          {dayLabel(d)}
          {!free(d) ? " (ظرفیت پر)" : ""}
        </option>
      ))}
    </select>
  );
}

/** The custom-cake order: a style, the weight, the day, the writing on it; the panel gets it as a booking. */
function Custom(view: View) {
  const { shop, link, visitor, ctx, editing } = view;
  const s = cakeSchedule(shop);
  const taken = takenFor(s, visitor.taken ?? {});
  const styles = visible(shop).filter((p) => p.categoryId && p.categoryId === shop.showcaseCategoryId);
  const q = visitor.query;
  const site = ctx.data.site;
  return (
    <>
      <PageTop view={view} title="سفارش کیک سفارشی" />
      <section className="sn-wrap sn-sec sn-custom-page">
        <div className="sn-custom-intro">
          <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "multiline", "متن")}>
            <p {...ed("site.shop.lookText", "multiline", "متن")}>{shop.lookText}</p>
          </Opt>
          <ol className="sn-steps">
            <li>
              <Svg name="cake" /> طرح و وزن کیک را انتخاب کنید
            </li>
            <li>
              <Svg name="calendar" /> روز تحویل و متن روی کیک را بنویسید
            </li>
            <li>
              <Svg name="phone" /> برای هماهنگی نهایی و پیش‌پرداخت تماس می‌گیریم
            </li>
          </ol>
        </div>
        <form method="post" action={link("/_form")} className="sn-custom-form">
          <FormMeta kind="booking" back="/custom" />
          <input type="hidden" name="time" value={s.start} />
          {styles.length > 0 ? (
            <fieldset className="sn-styles">
              <legend>طرح کیک</legend>
              {styles.map((p, k) => (
                <label key={p.id}>
                  <input type="radio" name="service" value={p.name} required defaultChecked={q.style ? q.style === p.id : k === 0} />
                  <span className="sn-style">
                    <span className="sn-style-pic">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
                    <b>{p.name}</b>
                    {p.price > 0 && <small>کیلویی {money(view, unitPrice(p))}</small>}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <label>
              <span>طرح کیک</span>
              <input name="service" required maxLength={80} placeholder="مثلاً کیک تولد با خامه و توت‌فرنگی" />
            </label>
          )}
          <div className="sn-form-row">
            <label>
              <span>وزن</span>
              <select name="guests" defaultValue="2">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {fa(n)} کیلو
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>روز تحویل</span>
              <DaySelect name="date" schedule={s} days={s.ahead} taken={taken} value={q.date} />
            </label>
          </div>
          <label>
            <span>متن روی کیک</span>
            <input name="subject" maxLength={160} placeholder="مثلاً: سارا جان تولدت مبارک" />
          </label>
          <label>
            <span>طعم، رنگ و توضیحات</span>
            <textarea name="body" rows={4} maxLength={3000} placeholder="طعم کیک، رنگ خامه، عکس یا لینک نمونه‌ی دلخواه، تعداد مهمان‌ها..." />
          </label>
          <div className="sn-form-row">
            <label>
              <span>نام و نام خانوادگی</span>
              <input name="name" required maxLength={80} autoComplete="name" defaultValue={visitor.customer?.name} />
            </label>
            <label>
              <span>شماره‌ی موبایل</span>
              <input name="phone" required inputMode="tel" dir="ltr" maxLength={20} autoComplete="tel" placeholder="09xx xxx xxxx" defaultValue={visitor.customer?.phone} />
            </label>
          </div>
          <button type="submit" className="sn-btn">
            ثبت سفارش کیک
          </button>
          <small className="sn-muted">
            هر روز فقط {fa(s.capacity)} کیک سفارشی می‌پذیریم؛ روزهای پر در فهرست مشخص شده‌اند. با کد پیگیری، وضعیت سفارش را در{" "}
            <PageLink to="/track" link={link}>
              پیگیری سفارش
            </PageLink>{" "}
            ببینید.
          </small>
        </form>
      </section>
      {(site?.gallery ?? []).length > 0 && pageOn(ctx.data, "/gallery") && (
        <section className="sn-wrap sn-sec sn-sec-tight">
          <Head view={view} title="نمونه‌کارهای ما" titlePath="site.shop.bestTitle" />
          <div className="sn-gal-row">
            {(site?.gallery ?? [])
              .filter((g) => safeUrl(g.image))
              .slice(0, 4)
              .map((g) => (
                <ZoomOpen key={g.id} id={g.id} className="sn-gal-pic">
                  <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                </ZoomOpen>
              ))}
          </div>
        </section>
      )}
    </>
  );
}

function Gallery(view: View) {
  const { ctx, editing } = view;
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <>
      <PageTop view={view} title="گالری" />
      <section className="sn-wrap sn-sec sn-gallery">
        {items.map((g) => {
          const at = item("site.gallery", g.id);
          return (
            <figure key={g.id}>
              <ZoomOpen id={g.id} className="sn-gal-pic">
                <span {...ed(`${at}.image`, "image", "عکس")}>
                  <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                </span>
              </ZoomOpen>
              <figcaption {...ed(`${at}.title`, "text", "عنوان")}>{g.title}</figcaption>
            </figure>
          );
        })}
        {editing && (
          <span className="sn-add" {...ed("site.gallery", "newimage", "افزودن عکس به گالری")}>
            + افزودن عکس
          </span>
        )}
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری سفارش کیک" />
      <section className="sn-wrap sn-sec sn-sec-tight">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

/** The top of inner pages: the page name on cream under the dripping header. */
function PageTop({ view, title }: { view: View; title: string }) {
  return (
    <section className="sn-pagetop">
      <h1>{title}</h1>
      <nav className="sn-trail" aria-label="مسیر صفحه">
        <PageLink to="/" link={view.link}>
          خانه
        </PageLink>
        <i>/</i>
        <b aria-current="page">{title}</b>
      </nav>
    </section>
  );
}

/* ───────────── Example content ───────────── */

export function shirinSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`sh-${n}`);
  const png = (n: string) => sampleImage(`sh-${n}`, "png");
  const soon = (days: number) => new Date(Date.now() + days * 86400000 + 5 * 3600000).toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const cats = [
    { id: "c1", name: "دونات", image: png("dn3") },
    { id: "c2", name: "کیک", image: img("p14") },
    { id: "c3", name: "کاپ‌کیک", image: img("p10") },
    { id: "c4", name: "تارت و پای", image: img("p2") },
    { id: "c5", name: "دسر و شیرینی", image: img("p12") },
    { id: "c6", name: "کیک سفارشی", image: img("p6") },
  ];
  const fact = (kcal: number, grams: number) => [
    { label: "انرژی", value: `${new Intl.NumberFormat("fa-IR").format(kcal)} کیلوکالری` },
    { label: "وزن", value: `${new Intl.NumberFormat("fa-IR").format(grams)} گرم` },
  ];
  const kg = (perKg: number) => ({
    options: [{ name: "وزن", values: ["۱ کیلو", "۲ کیلو", "۳ کیلو"].map((label) => ({ label })) }],
    variants: [
      { key: "۱ کیلو", price: perKg },
      { key: "۲ کیلو", price: perKg * 2 },
      { key: "۳ کیلو", price: perKg * 3 },
    ],
  });
  const donut = (what: string) => `دونات تازه‌ی ${what}؛ هر روز صبح با آرد مرغوب و کره‌ی تازه پخته می‌شود.\nبرای سفارش‌های بیشتر از ۲۴ عدد (تولد، جشن، مهمانی) یک روز زودتر سفارش بدهید.`;
  const cake = (what: string) => `${what}؛ با خامه‌ی تازه، بدون مواد نگه‌دارنده و همان روز تحویل پخته می‌شود.\nوزن را انتخاب کنید؛ برای متن یا طرح خاص روی کیک از صفحه‌ی «کیک سفارشی» سفارش بدهید.`;
  const sweet = (what: string) => `${what}؛ تازه و دست‌ساز، در جعبه‌ی مخصوص بسته‌بندی می‌شود.\nتا ۲ روز در یخچال تازه می‌ماند.`;
  const products: Product[] = [
    { id: "s1", name: "دونات شکلاتی با فندق", categoryId: "c1", price: 95_000, images: [png("dn4")], featured: true, description: donut("شکلاتی با فندق برشته"), specs: fact(310, 120) },
    { id: "s2", name: "دونات کاراملی با روکش شکلات سفید", categoryId: "c1", price: 85_000, images: [png("dn2")], featured: true, description: donut("کاراملی با خطوط شکلات سفید"), specs: fact(268, 110) },
    { id: "s3", name: "دونات توت‌فرنگی با ترافل", categoryId: "c1", price: 89_000, salePrice: 75_000, saleEndsAt: soon(2), images: [png("dn5")], featured: true, badge: "محبوب", description: donut("با گلیز توت‌فرنگی و ترافل رنگی"), specs: fact(285, 115) },
    { id: "s4", name: "دونات کاکائو با دانه‌های شکلات", categoryId: "c1", price: 92_000, images: [png("dn1")], featured: true, description: donut("کاکائویی با قطره‌های شکلات شیری و سفید"), specs: fact(296, 118) },
    { id: "s5", name: "دونات شکلاتی رنگین‌کمان", categoryId: "c1", price: 98_000, images: [png("dn3")], featured: true, description: donut("شکلاتی با ترافل رنگی"), specs: fact(320, 125) },
    { id: "s6", name: "کیک بلک فارست", categoryId: "c2", price: 690_000, images: [img("p14")], ...kg(690_000), description: cake("کیک شکلاتی با گیلاس و خامه"), specs: [{ label: "ماندگاری", value: "۳ روز در یخچال" }] },
    { id: "s7", name: "کیک رنگین‌کمانی", categoryId: "c2", price: 750_000, images: [img("p9")], ...kg(750_000), badge: "جدید", description: cake("کیک لایه‌لایه‌ی رنگی با خامه‌ی وانیلی"), specs: [{ label: "ماندگاری", value: "۳ روز در یخچال" }] },
    { id: "s8", name: "کیک میوه‌ای تولد", categoryId: "c6", price: 720_000, images: [img("p6")], ...kg(720_000), description: cake("کیک اسفنجی با خامه و میوه‌های فصل"), specs: [{ label: "ماندگاری", value: "۲ روز در یخچال" }] },
    { id: "s9", name: "کیک کودک «پاندا»", categoryId: "c6", price: 890_000, images: [img("p16")], ...kg(890_000), description: cake("کیک فوندانتی با طرح پاندا برای تولد کودک"), specs: [{ label: "ماندگاری", value: "۳ روز در یخچال" }] },
    { id: "s10", name: "کاپ‌کیک قلبی", categoryId: "c3", price: 120_000, images: [img("p5")], description: sweet("کاپ‌کیک شکلاتی با خامه و قلب فوندانتی"), specs: fact(240, 90) },
    { id: "s11", name: "کاپ‌کیک توت‌فرنگی", categoryId: "c3", price: 110_000, images: [img("p8")], description: sweet("کاپ‌کیک وانیلی با خامه‌ی توت‌فرنگی"), specs: fact(230, 85) },
    { id: "s12", name: "کاپ‌کیک شکلاتی", categoryId: "c3", price: 115_000, salePrice: 95_000, saleEndsAt: soon(4), images: [img("p10")], description: sweet("کاپ‌کیک شکلاتی با خامه‌ی کاکائو"), specs: fact(255, 90) },
    { id: "s13", name: "پای سیب", categoryId: "c4", price: 420_000, images: [img("p1")], description: sweet("پای سیب و دارچین با خمیر کره‌ای"), specs: [{ label: "اندازه", value: "۸ برش" }] },
    { id: "s14", name: "تارت توت جنگلی", categoryId: "c4", price: 560_000, images: [img("p2")], description: sweet("تارت کره‌ای با کرم پاتیسیر و توت‌های جنگلی"), specs: [{ label: "اندازه", value: "۸ برش" }] },
    { id: "s15", name: "پای گیلاس", categoryId: "c4", price: 480_000, images: [img("p7")], description: sweet("پای گیلاس با روکش مشبک"), specs: [{ label: "اندازه", value: "۸ برش" }] },
    { id: "s16", name: "تیرامیسو", categoryId: "c5", price: 210_000, images: [img("p12")], badge: "محبوب", description: sweet("تیرامیسو با قهوه‌ی تازه و پنیر ماسکارپونه"), specs: fact(390, 180) },
    { id: "s17", name: "پاناکوتا با سس توت‌فرنگی", categoryId: "c5", price: 160_000, images: [img("p11")], description: sweet("پاناکوتا وانیلی با سس توت‌فرنگی"), specs: fact(280, 150) },
    { id: "s18", name: "ماکارون (جعبه‌ی ۱۲ عددی)", categoryId: "c5", price: 380_000, images: [img("p15")], description: sweet("ماکارون فرانسوی در شش طعم"), specs: [{ label: "تعداد", value: "۱۲ عدد" }] },
    { id: "s19", name: "کروسان شکلاتی", categoryId: "c5", price: 75_000, images: [img("p4")], description: sweet("کروسان کره‌ای با شکلات"), specs: fact(330, 90) },
  ];
  const post = (t: string) =>
    `${t}\n\nشیرینی خوب از مواد اولیه‌ی خوب شروع می‌شود: آرد تازه، کره‌ی واقعی، تخم‌مرغ محلی و شکلات مرغوب. ما همه‌ی مواد را هر هفته از تأمین‌کننده‌های ثابت خودمان می‌خریم.\n\nبرای نگه‌داری کیک‌های خامه‌ای، آن‌ها را در یخچال و دور از غذاهای بودار بگذارید و نیم ساعت قبل از سرو بیرون بیاورید تا طعم خامه کامل شود.`;
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "شیرین",
      jobTitle: "شیرینی‌پزی",
      // The reference's logo, for now (to be replaced by the designer's).
      avatarUrl: png("logo-temp"),
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان شریعتی، پلاک ۲۰۰",
      summary: "شیرینی‌پزی شیرین؛ دونات، کیک و شیرینی تازه هر روز، با ارسال در تهران.",
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
      address: "تهران، خیابان شریعتی، پلاک ۲۰۰",
      contactNote: "هر روز ۸ صبح تا ۱۰ شب",
      contactTitle: "تماس با ما",
      contactText: "برای سفارش‌های مهمانی، کیک‌های بزرگ یا هر سؤالی پیام بگذارید یا زنگ بزنید.",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.77380&mlon=51.44370#map=16/35.77380/51.44370",
      signatureImage: png("logo-temp-dark"),
      heroImage: img("about"),
      aboutImage: img("class"),
      aboutTitle: "درباره‌ی شیرینی‌پزی شیرین",
      aboutText:
        "شیرین را با یک فر کوچک در آشپزخانه‌ی خانه شروع کردیم و امروز هر روز صدها دونات، کیک و شیرینی تازه می‌پزیم.\n\nهنوز هم همه‌چیز را با دست و بدون مواد نگه‌دارنده درست می‌کنیم، و هر کیک سفارشی را با همان دقتی می‌سازیم که برای جشن خانواده‌ی خودمان.",
      gallery: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `sg${n}`, title: ["میز شیرینی جشن", "کاپ‌کیک‌های تولد", "شیرینی‌های مهمانی", "کیک‌های ماه", "کاپ‌کیک‌های رنگی", "کاپ‌کیک توت‌فرنگی"][n - 1]!, image: img(`g${n}`) })),
      testimonials: [
        { id: "st1", name: "نگار رضایی", text: "کیک تولد دخترم دقیقاً همان طرحی شد که خواسته بودیم و طعمش عالی بود. ممنون!", image: img("p16"), rating: 5 },
        { id: "st2", name: "علی محمدی", text: "دونات‌هایشان تازه‌ترین دونات‌هایی است که در تهران خورده‌ام.", image: png("dn4"), rating: 5 },
      ],
      clients: [
        { id: "sm1", name: "مهدی سلیمی", text: "سرآشپز شیرینی", image: img("team1") },
        { id: "sm2", name: "سمیرا کاظمی", text: "طراح کیک", image: img("team2") },
        { id: "sm3", name: "رضا نوری", text: "قناد", image: img("team3") },
        { id: "sm4", name: "مریم صادقی", text: "مدیر سفارش‌ها", image: img("team4") },
      ],
      shop: {
        categories: cats,
        products,
        heroImage: img("top"),
        newImage: img("g5"),
        heroKicker: "شیرینی تازه، هر روز صبح از فر خودمان",
        showcaseTitle: "دسته‌های ما",
        showcaseText: "داستان ما",
        showcaseCategoryId: "c6",
        newText: "هر چه دلتان بخواهد، تازه پخته می‌شود.",
        discountTitle: "حراج امروز",
        bestTitle: "نمونه‌کارهای ما",
        bestText: "قنادهای ما",
        lookTitle: "کیک سفارشی برای روزهای خاص",
        lookText: "طرح، وزن و متن روی کیک را انتخاب کنید و روز تحویل را بگویید؛ برای هماهنگی نهایی با شما تماس می‌گیریم. کیک‌های سفارشی دست‌کم یک روز قبل سفارش داده شوند.",
        lookImage: img("p6"),
        promoTitle: "چرا شیرین؟",
        discoverTitle: "از یک فر کوچک در خانه شروع کردیم؛ با این باور که شیرینی خوب باید تازه و بی‌نگه‌دارنده باشد.",
        discoverImage: img("chef"),
        newsletterTitle: "از شیرینی‌های تازه باخبر شوید",
        newsletterText: "حراج‌ها و طعم‌های جدید را زودتر از همه بدانید.",
        stats: [
          { id: "ss1", value: "", label: "مأموریت ما", text: "شیرینی تازه و سالم، با مواد اولیه‌ی مرغوب و قیمت منصفانه." },
          { id: "ss2", value: "", label: "چشم‌انداز ما", text: "اینکه شیرین بخشی از خاطره‌ی هر جشن خانوادگی شما باشد." },
        ],
        perks: [
          { id: "sk1", title: "ارسال همان روز", text: "سفارش‌های تا ساعت ۴ عصر همان روز در تهران تحویل می‌شوند." },
          { id: "sk2", title: "تازه‌پخت هر روز", text: "هیچ شیرینی‌ای از دیروز نمی‌ماند." },
          { id: "sk3", title: "پرداخت مطمئن", text: "پرداخت پس از تأیید تلفنی سفارش." },
          { id: "sk4", title: "بسته‌بندی ایمن", text: "جعبه‌های مخصوص که کیک را سالم می‌رساند." },
        ],
        coupons: [
          { id: "sq1", code: "SHIRIN10", percent: 10, maxDiscount: 150_000, active: true },
          { id: "sq2", code: "DONUT6", amount: 90_000, minTotal: 500_000, categoryIds: ["c1"], active: true },
        ],
        schedule: { ...cakeDefaults(), closed: [] },
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "sf1", q: "کیک سفارشی را چند روز قبل سفارش بدهم؟", a: "دست‌کم یک روز قبل؛ برای کیک‌های طبقه‌ای و فوندانتی سه روز قبل بهتر است." },
          { id: "sf2", q: "ارسال دارید؟", a: "بله، در تهران با پیک مخصوص شیرینی؛ هزینه‌ی ارسال در سبد خرید حساب می‌شود." },
          { id: "sf3", q: "شیرینی بدون شکر یا بدون گلوتن دارید؟", a: "بعضی محصولات را می‌توانیم بدون شکر بپزیم؛ در توضیحات سفارش بنویسید تا با شما هماهنگ کنیم." },
        ],
        pages: [
          { id: "sp1", slug: "delivery", title: "ارسال و تحویل", text: "سفارش‌ها پس از تأیید تلفنی آماده و با پیک مخصوص ارسال می‌شوند.\n\nکیک‌های سفارشی در روزی که انتخاب کرده‌اید تحویل داده می‌شوند." },
          { id: "sp2", slug: "terms", title: "قوانین و مقررات", text: "به‌دلیل تازه بودن محصولات، سفارش پس از آماده شدن قابل لغو نیست." },
        ],
        posts: [
          { id: "sw1", title: "راز دونات‌های پفکی و سبک", image: img("post1"), date: ago(4), author: "سرآشپز شیرین", category: "دستور پخت", excerpt: "چرا دونات‌های ما سبک می‌مانند و روغن نمی‌گیرند؟", text: post("چرا دونات‌های ما سبک می‌مانند و روغن نمی‌گیرند؟") },
          { id: "sw2", title: "پاناکوتای خانگی در ۱۵ دقیقه", image: img("post2"), date: ago(12), author: "سرآشپز شیرین", category: "دستور پخت", text: post("پاناکوتا یکی از ساده‌ترین دسرهای ایتالیایی است.") },
          { id: "sw3", title: "انتخاب کیک تولد مناسب", image: img("post3"), date: ago(20), author: "تیم شیرین", category: "راهنما", text: post("برای چند مهمان چه وزن کیکی سفارش بدهیم؟") },
          { id: "sw4", title: "شکلات خوب را از کجا بشناسیم؟", image: img("post4"), date: ago(33), author: "تیم شیرین", category: "راهنما", text: post("درصد کاکائو فقط یکی از نشانه‌های شکلات خوب است.") },
        ],
        shippingFee: 120_000,
        freeShippingFrom: 2_000_000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش برای تأیید و اعلام شماره‌ی کارت با شما تماس می‌گیریم.",
        orderNote: "سفارش شما ثبت شد؛ به‌زودی برای هماهنگی زمان تحویل با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.sn { --sn-ink: var(--color-text); --sn-muted: var(--color-muted); --sn-line: #E9E9E9; --sn-soft: #F5F5F5; --sn-pink: #F8EBEF; --sn-lilac: #F6E8F4; --sn-blue: #D8EDF5; --sn-sand: #F5ECE9;
  --sn-hot: #E5484D; --sn-off: #F0883E; --sn-acc: var(--color-primary);
  --sn-wrap: min(1370px, 100% - 2 * clamp(14px, 3cqi, 40px));
  --sk-accent: #111; --sk-card: var(--color-bg); --sk-line: var(--sn-line); --sk-soft: var(--sn-soft); --sk-muted: var(--sn-muted); --sk-card-radius: 0; --sk-radius: 0;
  background: var(--color-bg); color: var(--sn-ink); min-height: 100%; font-size: 14px; font-weight: 300; line-height: 1.8; }
.sn a { color: inherit; text-decoration: none; }
.sn button { font: inherit; color: inherit; }
.sn .sk-btn { border-radius: 0; background: #111; color: #fff; }
.sn .sk-btn:hover { background: var(--sn-acc); }
.sn .sk-form input, .sn .sk-form textarea, .sn .sk-coupon input, .sn .sk-card { border-radius: 0; }
.sn b, .sn strong, .sn h3 { font-weight: 600; }
.sn h1, .sn h2 { font-weight: 400; letter-spacing: 0; line-height: 1.5; }
.sn .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sn-wrap { width: var(--sn-wrap); margin-inline: auto; }
.sn-ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.sn-act { display: contents; }
.sn-sec { padding-block: clamp(40px, 5.5cqi, 80px); }
.sn-sec-tight { padding-top: 10px; }
.sn-sec-line { border-top: 1px solid var(--sn-line); }
.sn-muted { color: var(--sn-muted); }
.sn-notice { padding: 18px 24px; border-inline-start: 3px solid var(--sn-ink); background: var(--sn-soft); }
.sn-error { padding: 12px 16px; background: #FDECEC; color: #C62A2F; }
.sn-text { display: grid; gap: 14px; color: var(--sn-muted); line-height: 2.1; }
.sn-pic { position: relative; display: block; overflow: hidden; background: var(--sn-soft); }
.sn-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sn-add { display: grid; place-items: center; min-height: 80px; border: 1px dashed var(--sn-line); color: var(--sn-muted); cursor: pointer; }
.sn-main > * { animation: sn-in .6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes sn-in { from { opacity: 0; transform: translateY(14px); } }

/* Buttons: black, a framed light one, a grey wide one; small sizes */
.sn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 28px; border: 1px solid #111; background: #111; color: #fff !important; font-size: .86em; font-weight: 500; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.sn-btn:hover { background: var(--sn-acc); border-color: var(--sn-acc); }
.sn-btn.ghost { background: transparent; color: #111 !important; }
.sn-btn.ghost:hover { background: #111; color: #fff !important; border-color: #111; }
.sn-btn.grey { background: var(--sn-soft); border-color: var(--sn-soft); color: #111 !important; }
.sn-btn.grey:hover { background: #111; border-color: #111; color: #fff !important; }
.sn-btn.small { min-height: 36px; padding: 0 18px; font-size: .8em; }
.sn-btn.tiny { min-height: 30px; padding: 0 14px; font-size: .76em; }
.sn-btn.wide, .sn-btn.full { width: 100%; }
.sn-under { display: inline-block; padding-bottom: 2px; border: 0; border-bottom: 1px solid currentColor; background: none; font-size: .8em; font-weight: 500; cursor: pointer; }
.sn-under:hover { color: var(--sn-acc); }
.sn-more { display: inline-flex; align-items: center; gap: 4px; font-size: .86em; }
.sn-more .sn-ico { width: 16px; height: 16px; }

/* Headings of sections */
.sn-head-c { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(22px, 3cqi, 36px); text-align: center; }
.sn-head-c h2 { font-size: clamp(1.5em, 2.2cqi, 2.05em); }
.sn-head-c p, .sn-head-c a { color: var(--sn-muted); font-size: .92em; }

/* Header */
.sn-head { position: sticky; top: 0; z-index: 30; background: var(--color-bg); }
.sn-head-home { border-bottom: 1px solid transparent; }
.sn-head-in { display: flex; align-items: center; gap: 28px; min-height: 76px; }
.sn-logo { display: inline-flex; align-items: center; flex: none; }
.sn-logo img { display: block; width: auto; height: 22px; }
.sn-logo b { font-size: 1.7em; font-weight: 400; letter-spacing: .02em; }
.sn-nav { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); margin-inline: auto; font-size: .86em; font-weight: 500; }
.sn-nav-item { position: relative; }
.sn-nav-item > a { display: inline-flex; align-items: center; gap: 3px; padding: 26px 0; transition: color .2s; }
.sn-nav-item > a::after { content: ""; position: absolute; inset-inline: 0; bottom: 20px; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.sn-nav-item > a:hover::after, .sn-nav-item > a[aria-current="page"]::after { transform: scaleX(1); }
.sn-caret { width: 12px; height: 12px; stroke-width: 1.6; }
.sn-sub { position: absolute; top: 100%; inset-inline-start: -18px; z-index: 5; display: grid; min-width: 200px; padding: 12px 0; background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.sn-nav-item:hover .sn-sub, .sn-nav-item:focus-within .sn-sub { opacity: 1; visibility: visible; transform: none; }
.sn-sub a { padding: 7px 20px; font-weight: 400; }
.sn-sub a:hover { color: var(--sn-acc); }
.sn-icons { display: flex; align-items: center; gap: 18px; }
.sn-icon { position: relative; display: inline-flex; align-items: center; transition: color .2s; }
.sn-icon:hover { color: var(--sn-acc); }
.sn-icon > i { position: absolute; top: -7px; inset-inline-end: -9px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px; background: #111; color: #fff; font-size: 10px; font-style: normal; font-weight: 500; line-height: 16px; text-align: center; }
.sn-head-inner .sn-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 80px; }
.sn-head-inner .sn-icons { justify-self: end; }
.sn-head-search { display: flex; width: min(340px, 100%); border: 1px solid var(--sn-line); }
.sn-head-search input, .sn-side-search input, .sn-drawer-search input { flex: 1; min-width: 0; padding: 9px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: .9em; }
.sn-head-search input:focus, .sn-side-search input:focus, .sn-drawer-search input:focus { outline: none; }
.sn-head-search button, .sn-side-search button, .sn-drawer-search button { display: grid; place-items: center; padding-inline: 12px; border: 0; background: none; cursor: pointer; }
.sn-head-search .sn-ico { width: 17px; height: 17px; }
.sn-head-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--sn-line); }
.sn-head-row2 .sn-nav { margin: 0; }
.sn-head-row2 .sn-nav-item > a { padding: 14px 0; }
.sn-head-row2 .sn-nav-item > a::after { bottom: 9px; }
.sn-browse { position: relative; font-size: .84em; font-weight: 600; }
.sn-browse > summary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 0; cursor: pointer; list-style: none; }
.sn-browse > summary::-webkit-details-marker { display: none; }
.sn-browse > div { position: absolute; top: 100%; inset-inline-start: 0; z-index: 6; display: grid; min-width: 230px; padding: 8px 0; border: 1px solid var(--sn-line); background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); }
.sn-browse > div a { padding: 8px 18px; font-weight: 400; }
.sn-browse > div a:hover { background: var(--sn-soft); }
.sn-head-contact { display: flex; justify-content: flex-end; gap: 22px; font-size: .84em; }
.sn-head-contact a { display: inline-flex; align-items: center; gap: 6px; }
.sn-head-contact .sn-ico { width: 17px; height: 17px; }
.sn-menu { display: none; }
.sn-menu > summary { list-style: none; cursor: pointer; }
.sn-menu > summary::-webkit-details-marker { display: none; }
.sn-burger .sn-x { display: none; }
.sn-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; background: rgb(0 0 0 / .4); }
.sn-menu[open] .sn-burger-ico { display: none; }
.sn-menu[open] .sn-x { position: absolute; top: 16px; inset-inline-end: 16px; display: block; width: 40px; height: 40px; padding: 9px; border-radius: 50%; background: #fff; color: #111; }
.sn-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 4px; width: min(340px, 86%); height: 100vh; padding: 18px 22px 90px; overflow-y: auto; background: var(--color-bg); box-shadow: 0 0 40px rgb(0 0 0 / .2); animation: sn-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes sn-drawer { from { transform: translateX(100%); } }
.sn-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.sn .sn-drawer-head { margin: -18px -22px 10px; padding: 14px 22px; background: var(--sn-choc); }
.sn-drawer-search { display: flex; margin-bottom: 8px; border: 1px solid var(--sn-line); }
.sn-drawer-nav { display: grid; }
.sn-drawer-nav .sn-nav-item > a { width: 100%; padding: 11px 0; border-bottom: 1px solid var(--sn-line); }
.sn-drawer-nav .sn-nav-item > a::after, .sn-drawer-nav .sn-caret { display: none; }
.sn-drawer-nav .sn-sub { position: static; display: grid; min-width: 0; padding: 0 14px 6px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
.sn-drawer-nav .sn-sub a { padding: 6px 0; font-size: .92em; color: var(--sn-muted); }
.sn-drawer > a { padding: 10px 0; }
.sn-drawer hr { width: 100%; margin: 8px 0; border: 0; border-top: 1px solid var(--sn-line); }
.sn-drawer .sn-rate { margin-top: 12px; font-size: .82em; }

/* Home: categories, product row, sale head, store strip */
.sn-cats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; }
.sn-cat { display: grid; justify-items: center; gap: 14px; text-align: center; }
.sn-cat-pic { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: var(--sn-soft); }
.sn-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.sn-cat:hover .sn-cat-pic img { transform: scale(1.08); }
.sn-cat b { font-size: .82em; font-weight: 500; }
.sn-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 20px) / 4); gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: thin; }
.sn-slide-row > * { scroll-snap-align: start; }
.sn-sale-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-bottom: 22px; }
.sn-sale-head h2 { font-size: clamp(1.4em, 2cqi, 1.9em); }
.sn-sale-head .sn-more { margin-inline-start: auto; }
.sn-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--sn-hot); font-size: .82em; font-weight: 500; }
.sn-clock .sn-ico { width: 15px; height: 15px; }
.sn-store { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px 18px; min-height: 64px; padding: 10px 16px; background: var(--sn-lilac); font-size: 1.05em; }
.sn-store > .sn-ico { width: 22px; height: 22px; }

/* Product cards: a square picture on pale grey (the second picture on hover), badges, side buttons */
.sn-card { display: grid; gap: 4px; align-content: start; text-align: center; animation: sn-in .6s calc(var(--i) * 50ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.sn-card-pic { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--sn-soft); }
.sn-img, .sn-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.sn-img img { object-fit: cover; mix-blend-mode: multiply; transition: opacity .5s, transform .9s cubic-bezier(.2, 1, .3, 1); }
.sn-img .sn-img-2 { opacity: 0; }
.sn-card:hover .sn-img .sn-img-2 { opacity: 1; }
.sn-card:hover .sn-img img { transform: scale(1.04); }
.sn-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 2.6em; color: var(--sn-muted); }
.sn-badges { position: absolute; top: 12px; inset-inline-start: 12px; display: grid; justify-items: start; gap: 5px; pointer-events: none; }
.sn-badge { display: inline-block; padding: 1px 8px; background: var(--sn-hot); color: #fff; font-size: .7em; font-weight: 500; line-height: 1.9; }
.sn-badge.off { background: var(--sn-off); }
.sn-badge.out { position: absolute; top: 12px; inset-inline-start: 12px; background: #8A8A8A; }
.sn-badge.dark { background: #111; }
.sn-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2; display: grid; gap: 6px; opacity: 0; transform: translateX(-10px); transition: opacity .3s, transform .3s; }
.sn-card:hover .sn-card-acts, .sn-card-acts:focus-within { opacity: 1; transform: none; }
.sn-round { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 4px 14px -6px rgb(0 0 0 / .3); cursor: pointer; transition: background .2s, color .2s; }
.sn-round:hover, .sn-round.on { background: #111; color: #fff !important; }
.sn-round .sn-ico { width: 17px; height: 17px; }
.sn-card-text { display: grid; justify-items: center; gap: 2px; padding-top: 10px; }
.sn-card-cat { color: #999; font-size: .72em; }
.sn-card-name { font-size: .92em; font-weight: 400; }
.sn-card-name:hover { color: var(--sn-acc); }
.sn-goldline { color: var(--sn-muted); font-size: .76em; }
.sn-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; font-size: .9em; }
.sn-price b { font-weight: 500; }
.sn-price s { color: #A0A0A0; font-size: .86em; }
.sn-card-desc { color: var(--sn-muted); font-size: .86em; line-height: 1.9; }

/* Shop: picture band, bar, grid modes, side column, pages */
.sn-banner { position: relative; display: grid; place-items: center; min-height: clamp(150px, 15cqi, 230px); overflow: hidden; background: #D6D6D6; text-align: center; }
.sn-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sn-banner > div { position: relative; display: grid; justify-items: center; gap: 2px; padding: 20px; }
.sn-banner h1 { font-size: clamp(1.8em, 3cqi, 2.6em); }
.sn-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--sn-muted); font-size: .8em; }
.sn-trail a:hover { color: var(--sn-ink); }
.sn-trail i { margin-inline: 6px; font-style: normal; opacity: .6; }
.sn-trail b { color: var(--sn-ink); font-weight: 400; }
.sn-sep { width: 12px; height: 12px; margin-inline: 4px; opacity: .6; }
.sn-trail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 16px; }
.sn-prevnext { display: flex; gap: 6px; }
.sn-prevnext .sn-ico { width: 18px; height: 18px; }
.sn-plp { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: clamp(24px, 3cqi, 40px); align-items: start; padding-block: 26px clamp(40px, 5cqi, 70px); }
.sn-plp-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; font-size: .86em; }
.sn-plp-bar > small { margin-inline-end: auto; color: var(--sn-muted); font-size: 1em; }
.sn-views { display: flex; gap: 6px; }
.sn-views a { display: grid; place-items: center; width: 30px; height: 30px; color: #B5B5B5; }
.sn-views a[aria-current], .sn-views a:hover { color: #111; }
.sn-views .sn-ico { width: 18px; height: 18px; }
.sn-sort { position: relative; }
.sn-sort > summary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: var(--sn-muted); cursor: pointer; list-style: none; }
.sn-sort > summary::-webkit-details-marker { display: none; }
.sn-sort > summary b { color: var(--sn-ink); font-weight: 400; }
.sn-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 170px; border: 1px solid var(--sn-line); background: var(--color-bg); box-shadow: 0 12px 24px -16px rgb(0 0 0 / .3); }
.sn-sort-list button { width: 100%; padding: 8px 14px; border: 0; background: none; text-align: start; cursor: pointer; }
.sn-sort-list button:hover, .sn-sort-list button[aria-current] { background: var(--sn-soft); }
.sn-grid { display: grid; gap: 34px 20px; }
.sn-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sn-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.sn-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sn-cols-list { grid-template-columns: 1fr; gap: 24px; }
.sn-row { grid-template-columns: 180px minmax(0, 1fr); gap: 24px; text-align: start; }
.sn-row .sn-card-text { justify-items: start; align-content: center; padding: 0; gap: 4px; }
.sn-row .sn-price { justify-content: flex-start; }
.sn-row .sn-btn { margin-top: 10px; }
.sn-pager { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.sn-pager a { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid transparent; font-size: .9em; }
.sn-pager a[aria-current] { border-color: #111; }
.sn-pager .sn-ico { width: 16px; height: 16px; }
.sn-side { display: grid; gap: 0; align-content: start; }
.sn-plp > .sn-side { order: -1; }
.sn-side-box { padding-block: 16px; border-bottom: 1px solid var(--sn-line); }
.sn-side-box > summary { display: flex; align-items: center; justify-content: space-between; font-size: 1.05em; font-weight: 400; cursor: pointer; list-style: none; }
.sn-side-box > summary::-webkit-details-marker { display: none; }
.sn-side-box:not([open]) .sn-caret { transform: rotate(180deg); }
.sn-side-box > div { display: grid; gap: 8px; padding-top: 14px; }
.sn-side-cats { display: grid; gap: 6px; font-size: .9em; }
.sn-side-cats a { display: flex; justify-content: space-between; color: #555; }
.sn-side-cats a:hover, .sn-side-cats a[aria-current] { color: var(--sn-ink); font-weight: 500; }
.sn-side-cats small, .sn-check small { color: #AAA; }
.sn-check { display: flex; align-items: center; gap: 10px; font-size: .9em; color: #555; cursor: pointer; }
.sn-check span { flex: 1; }
.sn-check input { width: 15px; height: 15px; margin: 0; accent-color: #111; }
.sn-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.sn-sizes label { cursor: pointer; }
.sn-sizes input { position: absolute; opacity: 0; }
.sn-sizes span { display: grid; place-items: center; min-width: 38px; height: 34px; padding: 0 8px; border: 1px solid var(--sn-line); font-size: .86em; }
.sn-sizes input:checked + span { border-color: #111; background: #111; color: #fff; }
.sn-facets-foot { display: flex; align-items: center; gap: 16px; padding-top: 18px; }
.sn-range { position: relative; height: 18px; }
.sn-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: #111; }
.sn-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.sn-range input::-webkit-slider-thumb { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.sn-range input::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; }
.sn-range input::-webkit-slider-runnable-track { background: none; }
.sn-range input::-moz-range-track { background: none; }
.sn-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.sn-range-foot small { font-size: .8em; color: #555; }
.sn-side-search { display: flex; border: 1px solid var(--sn-line); margin-bottom: 4px; }

/* Product page */
.sn-product { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(26px, 4cqi, 60px); padding-bottom: clamp(30px, 4cqi, 56px); }
.sn-gallery { position: relative; display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.sn-gallery.sn-n0, .sn-gallery.sn-n1 { grid-template-columns: 1fr; }
.sn-g { position: absolute; opacity: 0; pointer-events: none; }
.sn-thumbs { display: grid; gap: 10px; }
.sn-thumbs label { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border: 1px solid transparent; background: var(--sn-soft); cursor: pointer; transition: border-color .2s; }
.sn-thumbs img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.sn-mainpic { position: relative; display: grid; background: var(--sn-soft); }
.sn-big { grid-area: 1 / 1; position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.sn-big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.sn-gallery:not(.sn-n0):not(.sn-n1) .sn-big { visibility: hidden; opacity: 0; transition: opacity .4s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.sn-g:nth-of-type(${n}):checked ~ .sn-mainpic > .sn-big:nth-child(${n})`).join(", ")} { visibility: visible !important; opacity: 1 !important; }
${[1, 2, 3, 4, 5, 6].map((n) => `.sn-g:nth-of-type(${n}):checked ~ .sn-thumbs > label:nth-child(${n})`).join(", ")} { border-color: #111; }
.sn-zoom-ico { position: absolute; top: 14px; inset-inline-end: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.sn-zoom-ico .sn-ico { width: 16px; height: 16px; }
.sn-mainpic .sn-badges, .sn-mainpic .sn-badge.out { z-index: 1; }
.sn-info { display: grid; gap: 12px; align-content: start; }
.sn-info h1 { font-size: clamp(1.5em, 2.1cqi, 2em); line-height: 1.5; }
.sn-rating { display: inline-flex; align-items: center; gap: 6px; font-size: .86em; color: var(--sn-muted); }
.sn-info-price { display: flex; align-items: center; gap: 12px; }
.sn-info-price .sn-price { font-size: 1.35em; }
.sn-save { padding: 1px 8px; background: var(--sn-off); color: #fff; font-size: .78em; }
.sn-desc { color: var(--sn-muted); line-height: 2; }
.sn-avail { font-size: .9em; }
.sn-avail .in { color: #16A34A; font-weight: 500; }
.sn-avail .out { color: var(--sn-hot); font-weight: 500; }
.sn-goldbox { display: grid; gap: 8px; padding: 16px 18px; border: 1px solid var(--sn-line); background: #FCFAF6; }
.sn-goldbox h3 { font-size: .95em; }
.sn-goldbox dl { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 10px; row-gap: 0; margin: 0; font-size: .88em; }
.sn-goldbox dt { grid-row: 1; color: var(--sn-muted); }
.sn-goldbox dd { grid-row: 2; margin: 0 0 0 24px; font-weight: 500; }
.sn-goldbox .sn-under { justify-self: start; }
.sn-buy { display: grid; gap: 10px; }
.sn-buy-row { display: flex; gap: 10px; }
.sn-buy-row .sn-btn { flex: 1; }
.sn-qty input { width: 90px; height: 44px; padding: 0 10px; border: 1px solid var(--sn-line); background: var(--color-bg); color: inherit; font: inherit; text-align: center; }
.sn-links { display: flex; flex-wrap: wrap; gap: 8px 22px; padding-top: 6px; }
.sn-linkbtn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; font-size: .86em; cursor: pointer; }
.sn-linkbtn:hover { color: var(--sn-acc); }
.sn-linkbtn .sn-ico, .sn-eta .sn-ico { width: 17px; height: 17px; }
.sn-eta { display: flex; align-items: center; gap: 8px; font-size: .86em; color: #555; }
.sn-eta b { font-weight: 500; color: var(--sn-ink); }
.sn-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 6px 0 0; padding: 16px 10px; list-style: none; border: 1px solid var(--sn-line); text-align: center; }
.sn-perks li { display: grid; justify-items: center; gap: 6px; font-size: .78em; color: #555; }
.sn-perks .sn-ico, .sn-perks img { width: 26px; height: 26px; stroke-width: 1.2; object-fit: contain; }
.sn-meta { display: flex; align-items: center; gap: 6px; color: var(--sn-muted); font-size: .86em; }
.sn-meta a:hover { color: var(--sn-ink); }
.sn-share .sn-ico { width: 17px; height: 17px; }
.sn-tabs { display: grid; padding-block: 10px clamp(30px, 4cqi, 60px); border-top: 1px solid var(--sn-line); }
.sn-tab-in { position: absolute; opacity: 0; pointer-events: none; }
.sn-tab-labels { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px clamp(18px, 3cqi, 44px); margin-bottom: 26px; }
.sn-tab-labels label { position: relative; padding: 14px 0 8px; color: var(--sn-muted); font-size: 1.02em; cursor: pointer; }
.sn-tab-labels label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: #111; transform: scaleX(0); transition: transform .3s; }
.sn-tab-panel { display: none; }
${[1, 2, 3, 4].map((n) => `.sn-tab-in:nth-of-type(${n}):checked ~ .sn-tab-panels > .sn-tab-panel:nth-child(${n})`).join(", ")} { display: block; animation: sn-in .4s ease both; }
${[1, 2, 3, 4].map((n) => `.sn-tab-in:nth-of-type(${n}):checked ~ .sn-tab-labels > label:nth-child(${n})`).join(", ")} { color: var(--sn-ink); }
${[1, 2, 3, 4].map((n) => `.sn-tab-in:nth-of-type(${n}):checked ~ .sn-tab-labels > label:nth-child(${n})::after`).join(", ")} { transform: scaleX(1); }
.sn-tab-desc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.sn-tab-desc img { width: 100%; max-height: 460px; aspect-ratio: 4 / 3; object-fit: cover; background: var(--sn-soft); }
.sn-specs { width: min(720px, 100%); margin-inline: auto; }
.sn-breakup { display: grid; gap: 12px; width: min(620px, 100%); margin-inline: auto; }
.sn-breakup table { width: 100%; border-collapse: collapse; font-size: .92em; }
.sn-breakup th, .sn-breakup td { padding: 11px 14px; border-bottom: 1px solid var(--sn-line); text-align: start; font-weight: 400; }
.sn-breakup td { text-align: end; white-space: nowrap; }
.sn-breakup tr:nth-child(odd) { background: #FAFAFA; }
.sn-breakup .total th, .sn-breakup .total td { border-bottom: 0; background: #111; color: #fff; font-weight: 500; }
.sn-breakup p { font-size: .84em; }
.sn-tab-panels .sk-reviews { width: min(860px, 100%); margin-inline: auto; }

/* About */
.sn-about-top { display: grid; justify-items: center; gap: 4px; padding-block: 0 clamp(18px, 2.4cqi, 32px); text-align: center; }
.sn-about-top h1, .sn-page-title { font-size: clamp(1.8em, 2.8cqi, 2.5em); }
.sn-page-title { padding-block: 6px 18px; }
.sn-about-top p { max-width: 40em; color: var(--sn-muted); }
.sn-about-pics { display: grid; grid-template-columns: 1fr 1fr; }
.sn-about-pics > .sn-pic { aspect-ratio: 960 / 687; }
.sn-story { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 2fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.sn-story h2 { display: flex; align-items: center; gap: 16px; font-size: clamp(1.5em, 2.3cqi, 2.1em); }
.sn-story h2 i { width: 70px; height: 1px; background: currentColor; }
.sn-story > div { display: grid; gap: 16px; }
.sn-story-lead { font-size: 1.15em; font-weight: 500; line-height: 1.9; white-space: pre-line; }
.sn-mission { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; width: var(--sn-wrap); margin-inline: auto; }
.sn-mission-pic { aspect-ratio: 960 / 540; }
.sn-mission-text { display: grid; align-content: center; gap: 30px; padding: clamp(24px, 4cqi, 60px); background: var(--sn-soft); }
.sn-mission-text h3 { margin-bottom: 8px; font-size: 1.25em; font-weight: 400; }
.sn-mission-text p { color: var(--sn-muted); font-size: .9em; line-height: 2; }
.sn-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 26px; text-align: center; }
.sn-values > div { display: grid; justify-items: center; gap: 8px; }
.sn-values .sn-ico, .sn-values img { width: 34px; height: 34px; stroke-width: 1.2; object-fit: contain; }
.sn-values h3 { font-size: 1.05em; font-weight: 500; }
.sn-values p { max-width: 24em; color: var(--sn-muted); font-size: .86em; line-height: 1.9; }
.sn-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.sn-team figure { display: grid; gap: 10px; margin: 0; }
.sn-team-pic { position: relative; display: block; aspect-ratio: 435 / 488; overflow: hidden; background: var(--sn-soft); }
.sn-team-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.sn-team figure:hover img { transform: scale(1.05); }
.sn-team figcaption { display: grid; }
.sn-team b { font-weight: 500; }
.sn-team small { color: var(--sn-muted); }
.sn-quotes { position: relative; background: var(--sn-pink); }
.sn-q-in { position: absolute; opacity: 0; pointer-events: none; }
.sn-q-list { display: grid; padding-block: clamp(30px, 4cqi, 60px); }
.sn-q-item { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) 240px; align-items: center; gap: clamp(20px, 4cqi, 60px); margin: 0; }
.sn-q2 .sn-q-item, .sn-q3 .sn-q-item, .sn-q4 .sn-q-item, .sn-q5 .sn-q-item { visibility: hidden; opacity: 0; transition: opacity .5s; }
${[1, 2, 3, 4, 5].map((n) => `.sn-q-in:nth-of-type(${n}):checked ~ .sn-q-list > .sn-q-item:nth-child(${n})`).join(", ")} { visibility: visible; opacity: 1; }
.sn-q-item > div { display: grid; justify-items: start; gap: 10px; }
.sn-q-item small { font-size: .8em; color: #555; }
.sn-stars { color: #F2994A; letter-spacing: 2px; }
.sn-q-item blockquote { margin: 0; font-size: clamp(1.1em, 1.6cqi, 1.45em); line-height: 1.8; }
.sn-q-item figcaption { font-size: .86em; font-weight: 500; }
.sn-q-arrows { display: flex; gap: 14px; margin-top: 10px; }
.sn-q-arrows label { cursor: pointer; }
.sn-q-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.sn-q-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Blog */
.sn-blog { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: clamp(24px, 4cqi, 56px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.sn-posts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.sn-post-card { display: grid; gap: 8px; align-content: start; justify-items: start; }
.sn-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--sn-soft); }
.sn-post-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.sn-post-card:hover .sn-post-pic img { transform: scale(1.05); }
.sn-post-pic .sn-badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.sn-post-meta { color: #999; font-size: .76em; }
.sn-post-card h2 { font-size: 1.2em; line-height: 1.6; }
.sn-post-card h2 a:hover { color: var(--sn-acc); }
.sn-post-card p { color: var(--sn-muted); font-size: .9em; line-height: 1.9; }
.sn-mini { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: center; }
.sn-mini > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--sn-soft); }
.sn-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sn-mini > span:last-child { display: grid; gap: 2px; font-size: .86em; }
.sn-mini b { font-weight: 500; }
.sn-mini small { color: #999; }
.sn-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sn-tags span { padding: 3px 10px; border: 1px solid var(--sn-line); font-size: .8em; }
.sn-article { display: grid; gap: 14px; align-content: start; justify-items: start; }
.sn-article h1 { font-size: clamp(1.6em, 2.6cqi, 2.3em); }
.sn-article-pic { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.sn-article .sn-text { color: #555; }
.sn-post-nav { display: flex; justify-content: space-between; gap: 20px; width: 100%; padding-block: 18px; border-block: 1px solid var(--sn-line); }
.sn-post-nav a { display: grid; gap: 2px; max-width: 46%; }
.sn-post-nav a:last-child { text-align: end; }
.sn-post-nav small { color: #999; font-size: .78em; }
.sn-post-nav b { font-weight: 400; }
.sn-related { display: grid; gap: 14px; width: 100%; }
.sn-related h2 { font-size: 1.2em; }
.sn-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.sn-rel { display: grid; gap: 8px; }
.sn-rel > span { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--sn-soft); }
.sn-rel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sn-rel .sn-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-style: normal; }
.sn-rel b { font-weight: 400; }

/* Contact */
.sn-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.sn-contact-info { display: grid; gap: 20px; }
.sn-contact-item { display: flex; align-items: flex-start; gap: 14px; }
.sn-contact-item > .sn-ico { width: 24px; height: 24px; margin-top: 4px; }
.sn-contact-item span { display: grid; }
.sn-contact-item small { color: var(--sn-muted); }
.sn-contact-item b, .sn-contact-item a { font-weight: 500; }
.sn-message { display: grid; gap: 12px; padding: clamp(20px, 3cqi, 36px); background: var(--sn-soft); }
.sn-message h2 { font-size: 1.4em; }
.sn-message input, .sn-message textarea, .sn-checkout input, .sn-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--sn-line); background: var(--color-bg); color: inherit; font: inherit; }
.sn-message input:focus, .sn-message textarea:focus, .sn-checkout input:focus, .sn-checkout textarea:focus { outline: none; border-color: #111; }
.sn-message .sn-btn { justify-self: start; }
.sn-map { position: relative; aspect-ratio: 3 / 1; border: 1px solid var(--sn-line); background: var(--sn-soft); }
.sn-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.sn-map .sn-btn { position: absolute; bottom: 14px; inset-inline-start: 14px; }
.sn-map-link { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 20px; border: 1px dashed var(--sn-line); }

/* Cart, checkout, search, thanks */
.sn-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.sn-lines { display: grid; border-top: 1px solid var(--sn-line); }
.sn-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--sn-line); }
.sn-line-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--sn-soft); }
.sn-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.sn-line-info { display: grid; gap: 2px; }
.sn-line-info b { font-weight: 500; }
.sn-line-info small { color: var(--sn-muted); }
.sn-stepper { display: flex; align-items: center; border: 1px solid var(--sn-line); }
.sn-stepper button { width: 34px; height: 34px; border: 0; background: none; font-size: 1.1em; cursor: pointer; }
.sn-stepper span { min-width: 24px; text-align: center; }
.sn-line-total { min-width: 8em; text-align: end; font-weight: 500; }
.sn-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--sn-muted) !important; cursor: pointer; }
.sn-remove:hover { color: var(--sn-hot) !important; }
.sn-sum { position: sticky; top: 140px; display: grid; gap: 14px; padding: 24px; background: var(--sn-soft); }
.sn-sum h2 { font-size: 1.25em; }
.sn-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; }
.sn-sum dd { margin: 0; text-align: end; }
.sn-sum .total { padding-top: 12px; border-top: 1px solid #DDD; font-weight: 600; }
.sn-sum small { color: var(--sn-muted); }
.sn-off { color: #15803D; }
.sn-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: .9em; }
.sn-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.sn-pay { padding: 12px 14px; border: 1px dashed #CCC; background: var(--color-bg); font-size: .86em; line-height: 1.9; }
.sn-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.sn-checkout h2, .sn-checkout .full, .sn-checkout .sn-error { grid-column: 1 / -1; }
.sn-checkout h2 { font-size: 1.25em; }
.sn-checkout label { display: grid; gap: 6px; font-size: .9em; font-weight: 500; }
.sn-trap { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.sn-empty { display: grid; justify-items: start; gap: 24px; padding-bottom: clamp(40px, 5cqi, 70px); }
.sn-empty .sn-notice { justify-self: stretch; }
.sn-search { display: grid; gap: 26px; padding-bottom: clamp(40px, 5cqi, 70px); }
.sn-search-box { display: flex; width: min(560px, 100%); margin-inline: auto; border: 1px solid #111; }
.sn-search-box input { flex: 1; min-width: 0; padding: 16px 20px; border: 0; background: none; color: inherit; font: inherit; }
.sn-search-box input:focus { outline: none; }
.sn-search-box button { width: 60px; border: 0; background: none; cursor: pointer; }
.sn-search .sn-muted { text-align: center; }
.sn-thanks { display: grid; justify-items: center; gap: 14px; padding-block: clamp(40px, 6cqi, 90px); text-align: center; }
.sn-thanks p { max-width: 36em; line-height: 2; }
.sn-done { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #E8F6EC; color: #16A34A; font-size: 2em; }

/* Newsletter and footer */
.sn-news { padding-block: clamp(36px, 5cqi, 64px); background: var(--sn-soft); text-align: center; }
.sn-news.is-home { background: var(--color-bg); }
.sn-news .sn-wrap { display: grid; justify-items: center; gap: 6px; }
.sn-news h2 { font-size: clamp(1.4em, 2.1cqi, 1.9em); }
.sn-news p { color: var(--sn-muted); font-size: .88em; }
.sn-news-form { display: flex; gap: 8px; width: min(480px, 100%); margin-top: 14px; }
.sn-news-form input { flex: 1; min-width: 0; padding: 10px 14px; border: 1px solid #111; background: var(--color-bg); color: inherit; font: inherit; font-size: .9em; }
.sn-news-form button { padding: 0 24px; border: 1px solid #111; background: #111; color: #fff; font-size: .82em; cursor: pointer; transition: background .2s; }
.sn-news-form button:hover { background: var(--sn-acc); border-color: var(--sn-acc); }
.sn-foot { padding-top: clamp(40px, 5cqi, 64px); border-top: 1px solid var(--sn-line); background: #FAFAFA; font-size: .88em; }
.sn-foot-cols { display: grid; grid-template-columns: 1.3fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-bottom: 36px; }
.sn-foot-cols > div { display: grid; align-content: start; gap: 8px; }
.sn-foot-cols h3 { margin-bottom: 6px; font-size: 1.05em; font-weight: 500; }
.sn-foot-cols a { color: #666; }
.sn-foot-cols a:hover { color: #111; }
.sn-foot-brand small { color: var(--sn-muted); }
.sn-foot-brand .sn-logo img { height: 24px; }
.sn-foot-phone { display: flex; align-items: center; gap: 10px; color: #111 !important; }
.sn-foot-phone .sn-ico { width: 34px; height: 34px; padding: 7px; border-radius: 50%; background: #E9E9E9; }
.sn-foot-phone span { display: grid; line-height: 1.5; }
.sn-foot-phone small { color: var(--sn-muted); }
.sn-foot-phone b { font-size: 1.15em; font-weight: 500; }
.sn-foot-store p { color: #666; }
.sn-foot-store p b { color: #111; }
.sn-socials { gap: 4px; }
.sn-socials a { width: 32px; height: 32px; border: 0; color: #111; }
.sn-socials a:hover { background: #111; color: #fff; }
.sn-foot-bottom { display: grid; justify-items: center; gap: 10px; padding-block: 18px 24px; border-top: 1px solid var(--sn-line); color: var(--sn-muted); text-align: center; }
.sn-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.sn-trust img { height: 44px; width: auto; }
.sn-phonebar { display: none; }
.sn-ftog, .sn-ftog-btn { display: none; }


/* Big menu under "shop" */
.sn-nav-item.has-mega { position: static; }
.sn-mega { position: absolute; inset-inline: 0; top: 100%; z-index: 6; border-top: 1px solid var(--sn-line); background: var(--color-bg); box-shadow: 0 20px 30px -24px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.sn-nav-item.has-mega:hover .sn-mega, .sn-nav-item.has-mega:focus-within .sn-mega { opacity: 1; visibility: visible; transform: none; }
.sn-mega-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 280px; gap: 30px; padding-block: 30px; }
.sn-mega-in > div { display: grid; align-content: start; gap: 10px; }
.sn-mega h4 { margin: 0 0 4px; font-size: 1em; font-weight: 600; }
.sn-mega h4.sn-mega-h2 { margin-top: 18px; }
.sn-mega-in > div a { color: #666; font-weight: 300; }
.sn-mega-in > div a:hover { color: #111; }
.sn-mega-card { position: relative; display: block; aspect-ratio: 305 / 400; overflow: hidden; background: var(--sn-soft); }
.sn-mega-pic, .sn-mega-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.sn-mega-pic img { object-fit: cover; }
.sn-mega-note { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; justify-items: center; gap: 2px; padding: 14px 10px; background: #fff; text-align: center; }
.sn-mega-note b { font-size: 1.2em; font-weight: 400; }
.sn-mega-note small { color: #555; }
.sn-browse > summary { min-width: 270px; padding: 13px 18px; background: #111; color: #fff; justify-content: space-between; }
.sn-browse > div { min-width: 270px; padding: 0; border-top: 0; }
.sn-browse > div a { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid var(--sn-line); color: #555; }
.sn-browse > div a.strong { color: #111; font-weight: 500; }
.sn-browse > div a .sn-caret { opacity: .5; }
.sn-head-row2 { min-height: 46px; }

/* Phone menu: two tabs, menu and categories */
.sn-dtab { position: absolute; opacity: 0; pointer-events: none; }
.sn-dtabs { display: flex; gap: 22px; margin: 6px 0 8px; border-bottom: 1px solid var(--sn-line); }
.sn-dtabs label { padding: 8px 0; color: var(--sn-muted); cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; }
#sn-dtab-1:checked ~ .sn-dtabs label:first-child, #sn-dtab-2:checked ~ .sn-dtabs label:last-child { color: #111; border-color: #111; }
.sn-dpanel { display: none; }
#sn-dtab-1:checked ~ .sn-dpanel-1, #sn-dtab-2:checked ~ .sn-dpanel-2 { display: grid; }
.sn-dpanel > a { padding: 10px 0; border-bottom: 1px solid var(--sn-line); }
.sn-drawer-socials { margin-top: 14px; }

/* Sign-in window and side cart (hidden checkboxes open them) */
.sn-pop-in { position: fixed; opacity: 0; pointer-events: none; }
.sn-pop, .sn-mc { position: fixed; inset: 0; z-index: 120; display: none; }
#sn-login:checked + .sn-pop, .sn-mc-in:checked + .sn-mc { display: grid; }
.sn-pop { place-items: center; padding: 16px; }
.sn-pop-shade { position: absolute; inset: 0; background: rgb(0 0 0 / .45); cursor: pointer; }
.sn-pop-box { position: relative; display: grid; gap: 14px; width: min(440px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; padding: 30px 28px; background: var(--color-bg); animation: sn-in .35s ease both; }
.sn-pop-x { position: absolute; top: 14px; inset-inline-end: 14px; cursor: pointer; }
.sn-lt { position: absolute; opacity: 0; pointer-events: none; }
.sn-lt-tabs { display: flex; justify-content: center; gap: 30px; }
.sn-lt-tabs label { font-size: 1.6em; font-weight: 300; color: #BBB; cursor: pointer; }
#sn-lt-1:checked ~ .sn-lt-tabs label:first-child, #sn-lt-2:checked ~ .sn-lt-tabs label:last-child { color: #111; }
.sn-pop-form { display: none; gap: 14px; }
#sn-lt-1:checked ~ .sn-pop-form:nth-of-type(1), #sn-lt-2:checked ~ .sn-pop-form:nth-of-type(2) { display: grid; }
.sn-pop-form label { display: grid; gap: 6px; font-size: .92em; font-weight: 500; }
.sn-pop-form label i { color: var(--sn-hot); font-style: normal; }
.sn-pop-form input { width: 100%; padding: 12px 14px; border: 1px solid var(--sn-line); background: var(--color-bg); color: inherit; font: inherit; }
.sn-pop-form input:focus { outline: none; border-color: #111; }
.sn-pop-form small { color: var(--sn-muted); text-align: center; }
.sn-pop-form small a { color: #111; text-decoration: underline; }
.sn-icon-user { cursor: pointer; }
.sn-mc-box { position: absolute; inset-block: 0; inset-inline-end: 0; display: grid; grid-template-rows: auto 1fr auto; width: min(400px, 92%); background: var(--color-bg); animation: sn-mc .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes sn-mc { from { transform: translateX(-100%); } }
.sn-mc-box header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--sn-line); }
.sn-mc-box header h2 { font-size: 1.3em; }
.sn-mc-box header label { cursor: pointer; }
.sn-mc-lines { display: grid; align-content: start; gap: 4px; padding: 6px 22px; overflow-y: auto; }
.sn-mc-line { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--sn-line); }
.sn-mc-line > div { display: grid; justify-items: start; gap: 6px; }
.sn-mc-line small { color: var(--sn-muted); }
.sn-mc-box footer { display: grid; gap: 10px; padding: 18px 22px 22px; border-top: 1px solid var(--sn-line); }
.sn-mc-box footer p { display: flex; justify-content: space-between; font-size: 1.05em; }

/* Tablets */
@container (max-width: 1100px) {
  .sn-nav { gap: 16px; font-size: .82em; }
  .sn-head-contact a:last-child { display: none; }
  .sn-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sn-slide-row { grid-auto-columns: calc((100% - 2 * 20px) / 3); }
  .sn-plp { grid-template-columns: 230px minmax(0, 1fr); }
  .sn-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sn-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sn-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .sn-menu { display: block; }
  .sn-nav, .sn-head-row2, .sn-head-search, .sn-icon-user, .sn-icon-search, .sn-icon-wish { display: none !important; }
  .sn-head-in, .sn-head-inner .sn-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 60px; gap: 10px; }
  .sn-logo { justify-self: center; }
  .sn-icons { justify-self: end; }
  .sn-head-home { border-bottom-color: var(--sn-line); }
  .sn-plp { grid-template-columns: 1fr; }
  .sn-side { order: -1; display: none; grid-template-columns: 1fr 1fr; column-gap: 20px; margin-bottom: 10px; padding: 4px 16px 16px; border: 1px solid var(--sn-line); }
  .sn-ftog:checked + .sn-side { display: grid; }
  .sn-ftog-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #111; cursor: pointer; }
  .sn-ftog-btn .sn-ico { width: 16px; height: 16px; }
  .sn-plp-main { order: 1; }
  .sn-side .sn-side-box { padding-block: 10px; }
  .sn-side-box:not([open]) > div { display: none; }
  .sn-facets { display: contents; }
  .sn-facets-foot { grid-column: 1 / -1; }
  .sn-product { grid-template-columns: 1fr; }
  .sn-tab-desc { display: grid; grid-template-columns: 1fr; }
  .sn-blog, .sn-contact, .sn-cart { grid-template-columns: 1fr; }
  .sn-sum { position: static; }
  .sn-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sn-story { grid-template-columns: 1fr; }
  .sn-mission { grid-template-columns: 1fr; }
  /* Phones: the bar of shortcuts at the bottom */
  .sn-phonebar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--sn-line); background: var(--color-bg); }
  .sn-phonebar a { position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0 6px; font-size: .7em; }
  .sn-phonebar a[aria-current] { color: var(--sn-acc); }
  .sn-phonebar .sn-ico { width: 20px; height: 20px; }
  .sn-phonebar i { position: absolute; top: 3px; left: calc(50% + 6px); min-width: 15px; height: 15px; border-radius: 99px; background: #111; color: #fff; font-size: 9px; font-style: normal; line-height: 15px; text-align: center; }
}
@container (max-width: 600px) {
  .sn { font-size: 13.5px; }
  .sn-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .sn-slide-row { grid-auto-columns: calc((100% - 12px) / 2); gap: 12px; }
  .sn-cols-2, .sn-cols-3, .sn-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  .sn-row { grid-template-columns: 110px minmax(0, 1fr); gap: 14px; }
  .sn-card-acts { opacity: 1; transform: none; }
  .sn-round { width: 30px; height: 30px; }
  .sn-plp-bar { flex-wrap: wrap; gap: 8px; }
  .sn-plp-bar > small { flex-basis: 100%; order: 3; }
  .sn-views { margin-inline-start: auto; }
  .sn-side { grid-template-columns: 1fr; }
  .sn-gallery { grid-template-columns: 1fr; }
  .sn-thumbs { order: 2; grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .sn-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sn-buy-row .sn-btn { padding-inline: 12px; }
  .sn-posts, .sn-related > div { grid-template-columns: 1fr; }
  .sn-q-item { grid-template-columns: 1fr; }
  .sn-q-pic { width: 160px; order: -1; }
  .sn-line { grid-template-columns: 72px minmax(0, 1fr) auto; gap: 10px; }
  .sn-line .sn-stepper { grid-column: 2; justify-self: start; }
  .sn-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; }
  .sn-checkout { grid-template-columns: 1fr; }
  .sn-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px; }
  .sn-news-form { flex-direction: column; }
  .sn-news-form button { min-height: 42px; }
  .sn-map { aspect-ratio: 1.3; }
  .sn-trail-row { padding-block: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .sn-main > *, .sn-card, .sn-drawer { animation: none !important; }
}

/* ───── Shirin look: chocolate header dripping onto cream, red and yellow, a playful heading font ───── */
@font-face { font-family: "Shirin Lalezar"; src: url("/_assets/fonts/escape-lalezar.woff") format("woff"); font-display: swap; }
.sn { --sn-red: var(--color-primary); --sn-choc: #271A13; --sn-brown: #3E2620; --sn-yellow: #FFD43B; --sn-cream: #FBFAF8; --sn-line: #EEE6E0; --sn-soft: #F6F1EC; --sn-acc: var(--sn-red); --sn-hot: var(--sn-red);
  --sn-font: "Shirin Lalezar", var(--font-heading); --sn-wrap: min(1200px, 100% - 2 * clamp(16px, 4cqi, 60px));
  --sk-accent: var(--sn-red); --sk-radius: 999px; --sk-card-radius: 18px;
  background: var(--sn-cream) url(${sampleImage("sh-cream")}) center top / 100% auto repeat-y; color: var(--sn-brown); font-weight: 400; overflow-x: clip; }
.sn h1, .sn h2, .sn-head-c h2 { font-family: var(--sn-font); font-weight: 400; line-height: 1.3; }
.sn .sk-btn { border-radius: 999px; background: var(--sn-red); }
.sn .sk-form input, .sn .sk-form textarea, .sn .sk-coupon input { border-radius: 14px; }
.sn .sk-card { border-radius: 18px; }
.sn-btn { min-height: 46px; padding: 0 30px; border: 0; border-radius: 999px; background: var(--sn-red); color: #fff !important; font-family: var(--sn-font); font-size: 1.05em; font-weight: 400; box-shadow: 0 10px 22px -12px color-mix(in srgb, var(--sn-red) 80%, transparent); transition: transform .2s, background .2s, box-shadow .2s; }
.sn-btn:hover { background: color-mix(in srgb, var(--sn-red) 85%, #000); transform: translateY(-2px); }
.sn-btn.ghost { border: 2px solid var(--sn-red); background: transparent; color: var(--sn-red) !important; box-shadow: none; }
.sn-btn.ghost:hover { background: var(--sn-red); color: #fff !important; }
.sn-btn.grey { background: #E9E2DC; color: var(--sn-brown) !important; box-shadow: none; }
.sn-btn.yellow { background: var(--sn-yellow); color: var(--sn-choc) !important; }
.sn-btn.small { min-height: 38px; padding: 0 20px; font-size: .95em; }
.sn-btn.tiny { min-height: 32px; padding: 0 16px; font-size: .9em; }
.sn-under, .sn-more { color: var(--sn-red); font-weight: 600; }
.sn-notice { border-color: var(--sn-red); border-radius: 0 14px 14px 0; background: #fff; }

/* Header: chocolate, the logo in the red bowl hanging from the top, socials on one side, search and
   cart on the other, the menu under them; the dripping chocolate hangs over the page below. */
.sn-head { position: relative; z-index: 30; background: var(--sn-choc); color: #fff; }
.sn-head::after { content: ""; position: absolute; inset-inline: 0; top: calc(100% - 100cqi * 250 / 1920); height: calc(100cqi * 536 / 1920); background: url(${sampleImage("sh-drip", "png")}) center top / 100% auto no-repeat; pointer-events: none; }
.sn-head > * { position: relative; z-index: 1; }
.sn-head-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; min-height: clamp(86px, 7cqi, 112px); }
.sn-follow { display: flex; align-items: center; gap: 14px; align-self: center; font-size: .9em; }
.sn-follow b { color: var(--sn-yellow); font-weight: 700; }
.sn-follow > i { width: 40px; height: 1px; background: var(--sn-yellow); opacity: .7; }
.sn-head-socials { gap: 2px; }
.sn-head-socials a { width: 30px; height: 30px; border: 0; color: #fff; }
.sn-head-socials a:hover { background: none; color: var(--sn-red); }
.sn-head-socials .p-ico { width: 16px; height: 16px; }
.sn-bowl { display: grid; place-items: center; width: clamp(260px, 26cqi, 470px); aspect-ratio: 975 / 210; margin-top: -1px; background: url(${sampleImage("sh-bowl", "png")}) center top / 100% 100% no-repeat; }
.sn-bowl .sn-logo { margin-top: -6%; }
.sn-bowl .sn-logo img { height: clamp(40px, 3.6cqi, 62px); }
.sn-bowl .sn-logo b { font-family: var(--sn-font); font-size: 2em; color: #fff; }
.sn-head .sn-icons { justify-self: end; align-self: center; gap: 22px; }
.sn-head .sn-icon { color: var(--sn-red); }
.sn-head .sn-icon:hover { color: var(--sn-yellow); }
.sn-head .sn-icon .sn-ico { width: 22px; height: 22px; stroke-width: 2; }
.sn-head .sn-icon > i { background: var(--sn-yellow); color: var(--sn-choc); font-weight: 700; }
.sn-head-nav { display: flex; justify-content: center; padding-bottom: 6px; }
.sn-head .sn-nav { margin: 0; gap: clamp(16px, 2.2cqi, 34px); font-size: .95em; font-weight: 700; }
.sn-head .sn-nav-item > a { gap: 4px; padding: 16px 0; color: #fff; }
.sn-head .sn-nav-item > a::after { display: none; }
.sn-head .sn-nav-item > a:hover, .sn-head .sn-nav-item > a[aria-current="page"] { color: var(--sn-red); }
.sn-head .sn-caret { width: 13px; height: 13px; stroke-width: 2.4; transform: rotate(90deg); }
.sn-mega { color: var(--sn-brown); border-radius: 0 0 22px 22px; }
.sn-main { padding-top: calc(100cqi * 250 / 1920); }

/* Home: one big round pastry per section, sliding in from its side as it comes into view and moving
   a little toward the middle under the pointer; red price badge with a yellow shadow. */
.sn-show { position: relative; }
.sn-show-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); align-items: center; gap: 2cqi; min-height: clamp(460px, 56cqi, 900px); }
.sn-show.is-end .sn-show-text { order: 2; }
.sn-show-text { position: relative; z-index: 2; display: grid; justify-items: start; gap: 14px; max-width: 470px; }
.sn-show-text h2 { display: grid; font-size: clamp(2.1em, 3.7cqi, 3.6em); line-height: 1.15; }
.sn-show-text h2 span:first-child { color: var(--sn-red); }
.sn-show-text h2 span + span { color: var(--sn-brown); }
.sn-show-text p { color: #7A6A64; font-size: .95em; line-height: 2; }
.sn-facts { display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 0; padding: 0; list-style: none; font-size: .85em; font-weight: 700; }
.sn-facts li { display: inline-flex; align-items: center; gap: 6px; }
.sn-facts .sn-ico { width: 16px; height: 16px; color: var(--sn-red); fill: currentColor; stroke: none; }
.sn-facts li + li .sn-ico { fill: none; stroke: currentColor; stroke-width: 2; }
.sn-show-btns { display: flex; align-items: center; gap: 18px; margin-top: 12px; }
.sn-show-pic { position: relative; z-index: 1; display: block; --dir: -1; }
.sn-show.is-end .sn-show-pic { --dir: 1; }
.sn-roll { position: relative; display: block; width: min(860px, 52cqi); aspect-ratio: 1; margin-inline-end: -6cqi; }
.sn-show.is-end .sn-roll { margin-inline: -6cqi 0; justify-self: start; }
.sn-show.is-start .sn-roll { margin-inline-start: auto; }
.sn-roll-in { position: absolute; inset: 0; display: block; }
.sn-roll-in img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 30px 40px rgb(60 30 10 / .25)); transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.sn-roll-in b { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--sn-soft); font-family: var(--sn-font); font-size: 6em; color: var(--sn-red); }
.sn-show-pic:hover .sn-roll-in img, .sn-show-pic:focus-visible .sn-roll-in img { transform: translateX(calc(var(--dir) * -4%)) rotate(calc(var(--dir) * -7deg)); }
.sn-show-pic:hover .sn-tag { transform: translateX(calc(var(--dir) * -18%)) rotate(-3deg); }
.sn-tag { position: absolute; top: 20%; z-index: 2; display: grid; justify-items: center; min-width: 7.2em; padding: .65em 1.1em .5em; border-radius: 50%; background: var(--sn-red); color: #fff; line-height: 1; box-shadow: -7px 7px 0 var(--sn-yellow); transform: rotate(-6deg); transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.sn-show.is-start .sn-tag { inset-inline-start: 6%; }
.sn-show.is-end .sn-tag { inset-inline-end: 6%; box-shadow: 7px 7px 0 var(--sn-yellow); }
.sn-tag b { font-family: var(--sn-font); font-size: clamp(1.6em, 2.2cqi, 2.3em); font-weight: 400; }
.sn-tag small { font-size: .7em; font-weight: 700; }
.sn-tag s { margin-top: 3px; font-size: .7em; opacity: .75; }
@supports (animation-timeline: view()) {
  .sn-roll { animation: sn-roll-in linear both; animation-timeline: view(); animation-range: entry 0% cover 42%; }
}
@supports not (animation-timeline: view()) {
  .sn-roll { animation: sn-roll-in 1.3s cubic-bezier(.2, 1, .3, 1) both; }
  .sn-show + .sn-show .sn-roll { animation-delay: .2s; }
}
@keyframes sn-roll-in { from { opacity: 0; transform: translateX(calc(var(--dir) * 60%)) rotate(calc(var(--dir) * 120deg)); } 70% { opacity: 1; } to { opacity: 1; transform: none; } }
.sn-choco { position: absolute; z-index: 0; width: clamp(40px, 6cqi, 110px); pointer-events: none; animation: sn-float 7s ease-in-out infinite alternate; }
.sn-choco.c1 { top: 6%; inset-inline-start: 2%; }
.sn-choco.c2 { bottom: 4%; inset-inline-start: 46%; width: clamp(30px, 4cqi, 70px); animation-delay: -3s; }
.sn-show.is-end .sn-choco.c1 { inset-inline-start: auto; inset-inline-end: 3%; }
@keyframes sn-float { from { transform: translateY(0) rotate(0); } to { transform: translateY(-18px) rotate(14deg); } }

/* Home: categories, sale row, custom-cake band */
.sn-cats { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 22px; }
.sn-cat { gap: 10px; }
.sn-cat-pic { border-radius: 50%; background: #fff; box-shadow: 0 16px 30px -22px rgb(60 30 10 / .5); }
.sn-cat-pic img { mix-blend-mode: normal; }
.sn-cat b { font-family: var(--sn-font); font-size: 1.15em; font-weight: 400; color: var(--sn-brown); }
.sn-cat:hover b { color: var(--sn-red); }
.sn-sale-head h2 { color: var(--sn-red); }
.sn-custom-band { margin-top: clamp(30px, 4cqi, 60px); background: var(--sn-choc); color: #fff; }
.sn-custom-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); align-items: center; gap: clamp(24px, 4cqi, 60px); padding-block: clamp(36px, 5cqi, 70px); }
.sn-custom-pic { aspect-ratio: 4 / 3; border-radius: 28px; }
.sn-custom-in h2 { margin-bottom: 10px; color: var(--sn-yellow); font-size: clamp(1.8em, 3cqi, 2.8em); }
.sn-custom-in p { margin-bottom: 22px; color: #E8DCD6; line-height: 2; }

/* Product cards: white rounded cards on the cream */
.sn-card { padding: 12px 12px 16px; border-radius: 22px; background: #fff; box-shadow: 0 18px 30px -26px rgb(60 30 10 / .45); }
.sn-card-pic { border-radius: 16px; background: var(--sn-soft); }
.sn-img img { mix-blend-mode: normal; }
.sn-card-name { font-family: var(--sn-font); font-size: 1.15em; }
.sn-price b { color: var(--sn-red); font-weight: 700; }
.sn-badge { border-radius: 999px; padding-inline: 10px; }
.sn-badge.off { background: var(--sn-yellow); color: var(--sn-choc); }
.sn-round:hover, .sn-round.on { background: var(--sn-red); }
.sn-row { padding: 14px; }

/* Inner pages */
.sn-pagetop, .sn-about-top { display: grid; justify-items: center; gap: 2px; padding-block: 10px 26px; text-align: center; }
.sn-pagetop h1, .sn-about-top h1, .sn-page-title { color: var(--sn-red); font-size: clamp(2em, 3.4cqi, 3em); }
.sn-trail-row { padding-top: 4px; }
.sn-banner { min-height: clamp(150px, 14cqi, 220px); margin-top: calc(-100cqi * 250 / 1920); padding-top: calc(100cqi * 250 / 1920); }
.sn-banner::after { content: ""; position: absolute; inset: 0; background: rgb(39 26 19 / .45); }
.sn-banner > div { z-index: 1; color: #fff; }
.sn-banner .sn-trail, .sn-banner .sn-trail b { color: #fff; }
.sn-side-box > summary { font-family: var(--sn-font); font-size: 1.2em; }
.sn-sizes span { border-radius: 999px; }
.sn-sizes input:checked + span { border-color: var(--sn-red); background: var(--sn-red); }
.sn-mainpic, .sn-thumbs label, .sn-big { border-radius: 22px; }
.sn-mainpic { overflow: hidden; background: #fff; }
.sn-big img, .sn-thumbs img { mix-blend-mode: normal; }
.sn-info h1 { color: var(--sn-brown); font-size: clamp(1.8em, 2.8cqi, 2.6em); }
.sn-info-price .sn-price { font-size: 1.5em; }
.sn-save { border-radius: 999px; background: var(--sn-yellow); color: var(--sn-choc); }
.sn-perks { border-radius: 18px; background: #fff; }
.sn-tab-labels label { font-family: var(--sn-font); font-size: 1.3em; }
.sn-tab-labels label::after { background: var(--sn-red); height: 2px; }
.sn-qty input, .sn-checkout input, .sn-checkout textarea, .sn-checkout select, .sn-message input, .sn-message textarea { border-radius: 14px; }
.sn-checkout select { width: 100%; padding: 11px 14px; border: 1px solid var(--sn-line); background: #fff; color: inherit; font: inherit; }
.sn-sum, .sn-message { border-radius: 22px; background: #fff; }
.sn-mission-text { background: #fff; }

/* Custom-cake order page */
.sn-custom-page { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.4fr); gap: clamp(24px, 4cqi, 60px); align-items: start; padding-top: 0; }
.sn-custom-intro { display: grid; gap: 20px; color: #7A6A64; line-height: 2; }
.sn-steps { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.sn-steps li { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: #fff; color: var(--sn-brown); font-weight: 700; }
.sn-steps .sn-ico { width: 26px; height: 26px; color: var(--sn-red); }
.sn-custom-form { display: grid; gap: 16px; padding: clamp(18px, 3cqi, 34px); border-radius: 26px; background: #fff; box-shadow: 0 24px 40px -34px rgb(60 30 10 / .5); }
.sn-custom-form label { display: grid; gap: 6px; font-weight: 700; font-size: .92em; }
.sn-custom-form input:not([type=radio]), .sn-custom-form select, .sn-custom-form textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--sn-line); border-radius: 14px; background: var(--sn-cream); color: inherit; font: inherit; font-weight: 400; }
.sn-custom-form input:focus, .sn-custom-form select:focus, .sn-custom-form textarea:focus { outline: none; border-color: var(--sn-red); }
.sn-custom-form .sn-btn { justify-self: start; }
.sn-custom-form small a { color: var(--sn-red); }
.sn-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sn-styles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 0; padding: 0; border: 0; }
.sn-styles legend { margin-bottom: 8px; font-weight: 700; font-size: .92em; }
.sn-styles label { display: block; cursor: pointer; }
.sn-styles input { position: absolute; opacity: 0; }
.sn-style { display: grid; gap: 6px; padding: 8px; border: 2px solid var(--sn-line); border-radius: 18px; text-align: center; transition: border-color .2s, transform .2s; }
.sn-style-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: var(--sn-soft); }
.sn-style-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sn-style b { font-family: var(--sn-font); font-weight: 400; font-size: 1.05em; }
.sn-style small { color: var(--sn-muted); font-weight: 400; }
.sn-styles input:checked + .sn-style { border-color: var(--sn-red); transform: translateY(-3px); }
.sn-styles input:focus-visible + .sn-style { outline: 2px solid var(--sn-red); }
.sn-gal-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.sn-gal-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border-radius: 22px; cursor: zoom-in; }
.sn-gal-pic img, .sn-gal-pic span { position: absolute; inset: 0; width: 100%; height: 100%; }
.sn-gal-pic img { object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.sn-gal-pic:hover img { transform: scale(1.06); }
.sn-gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; padding-top: 0; }
.sn-gallery figure { display: grid; gap: 8px; margin: 0; }
.sn-gallery figcaption { font-family: var(--sn-font); font-size: 1.15em; text-align: center; }

/* Footer: white with a wavy top edge */
.sn-news { background: #fff; }
.sn-news h2 { color: var(--sn-red); }
.sn-news-form input { border-radius: 999px; border-color: var(--sn-line); padding-inline: 18px; }
.sn-news-form button { border-radius: 999px; border: 0; background: var(--sn-red); }
.sn-foot { position: relative; border-top: 0; background: #fff; }
.sn-foot::before { content: ""; position: absolute; inset-inline: 0; bottom: 100%; height: 16px; background: url(${sampleImage("sh-waves", "png")}) center bottom / auto 16px repeat-x; }
.sn-foot-cols { grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)); }
.sn-foot-cols h3 { font-family: var(--sn-font); font-size: 1.25em; font-weight: 400; color: var(--sn-red); }
.sn-foot-logo img { display: block; width: auto; height: 54px; }
.sn-foot-logo b { font-family: var(--sn-font); font-size: 2em; color: var(--sn-red); }
.sn-foot-brand p { color: #7A6A64; }
.sn-foot-phone { display: inline-flex; align-items: center; gap: 8px; color: var(--sn-brown) !important; font-size: 1.2em; }
.sn-foot-phone .sn-ico { width: 22px; height: 22px; color: var(--sn-red); }
.sn-foot-store p { color: #7A6A64; }
.sn-foot-bottom { grid-auto-flow: column; justify-content: space-between; align-items: center; }
.sn-top-btn { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: var(--sn-red); color: #fff; }
.sn-socials a:hover { background: var(--sn-red); }

@container (max-width: 1100px) {
  .sn-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sn-follow b, .sn-follow > i { display: none; }
}
@container (max-width: 900px) {
  .sn-head-top { grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 70px; }
  .sn-follow, .sn-head-nav { display: none; }
  .sn-head .sn-menu { display: block; color: #fff; }
  .sn-bowl { align-self: start; width: clamp(200px, 52cqi, 300px); }
  .sn-head .sn-icons .sn-icon-user, .sn-head .sn-icons .sn-icon-wish { display: none !important; }
  .sn-head .sn-icons .sn-icon-search { display: inline-flex !important; }
  .sn-head::after { top: calc(100% - 100cqi * 120 / 1920); height: calc(100cqi * 536 / 1920 * 1.6); background-size: 160% auto; }
  .sn-main { padding-top: calc(100cqi * 600 / 1920); }
  .sn-home .sn-main { padding-top: calc(100cqi * 300 / 1920); }
  .sn-banner { margin-top: calc(-100cqi * 600 / 1920); padding-top: calc(100cqi * 600 / 1920); }
  .sn-show-in, .sn-show.is-end .sn-show-in { grid-template-columns: 1fr; gap: 0; min-height: 0; padding-block: 20px 50px; }
  .sn-show-text, .sn-show.is-end .sn-show-text { order: 2; justify-self: center; justify-items: center; text-align: center; }
  .sn-show-btns { justify-content: center; }
  .sn-facts { justify-content: center; }
  .sn-roll, .sn-show.is-end .sn-roll, .sn-show.is-start .sn-roll { width: min(560px, 92cqi); margin: 0 auto; }
  .sn-custom-in, .sn-custom-page { grid-template-columns: 1fr; }
  .sn-foot-cols { grid-template-columns: 1fr 1fr; }
  .sn-foot-brand { grid-column: 1 / -1; }
  .sn-gallery { grid-template-columns: 1fr 1fr; }
  .sn-gal-row { grid-template-columns: 1fr 1fr; }
}
@container (max-width: 600px) {
  .sn-show-text h2 { font-size: 2.1em; }
  .sn-tag { min-width: 6em; font-size: .85em; }
  .sn-form-row { grid-template-columns: 1fr; }
  .sn-styles { grid-template-columns: 1fr 1fr; }
  .sn-choco.c2 { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sn-roll, .sn-choco { animation: none !important; }
}
`;
