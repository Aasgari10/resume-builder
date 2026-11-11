/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Juno": a toy shop in navy, sky blue and green, rebuilt from the Juno reference. Centred logo
// with phone and a "let's talk" button on the home page; hero slider with a speech bubble and a
// waving bear; featured and popular toys; "what we do"; a photo band; clients; testimonials beside
// a photo; latest news; a newsletter with large faded lettering; navy footer. Pages: about us,
// services, team, contact, questions, shop with a side column, product, blog, cart and checkout.
// Published pages run without scripts: menus are <details>, the slider and tabs use radios, and
// the gentle motion is CSS only (switched off for visitors who ask for less motion).

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, SORTS, SpecsTable, Stars, filterProducts, shopkitCss } from "./shopkit";
import { mapEmbed } from "./golsara";

/** Home page sections the user can switch off. */
export const JUNO_BLOCKS = [
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "featured", label: "محصولات ویژه" },
  { key: "about", label: "معرفی (کاری که می‌کنیم)" },
  { key: "popular", label: "محبوب‌ترین‌ها" },
  { key: "band", label: "نوار عکس با تیتر" },
  { key: "clients", label: "مشتری‌ها و همکاران" },
  { key: "testimonials", label: "نظرات مشتریان" },
  { key: "news", label: "آخرین اخبار (بلاگ)" },
  { key: "newsletter", label: "خبرنامه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const JUNO_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/services", label: "صفحه‌ی خدمات ما" },
  { path: "/team", label: "صفحه‌ی تیم ما" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && pageOn(data, "/blog");
const answered = (shop: Shop | undefined) => (shop?.faq ?? []).filter((x) => x.q.trim() && x.a.trim());

export function junoPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const own = ["/about", "/services", "/team"].filter((p) => pageOn(data, p));
  const blog = hasBlog(data) ? ["/blog", ...livePosts(shop).map((p) => `/blog/${p.id}`)] : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", "/shop", ...own, "/contact", ...blog, ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...info];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function JunoShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = junoPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "about") body = <About {...view} />;
  else if (kind === "services") body = <Services {...view} />;
  else if (kind === "team") body = <Team {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else if (kind === "faq") body = <Faq {...view} />;
  else if (kind === "blog") body = id ? <Post {...view} id={id} /> : <Blog {...view} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else
    body = (
      <>
        <Band view={view} title={page.startsWith("/support") ? "پشتیبانی" : (shop.pages ?? []).find((p) => `/page/${p.slug}` === page)?.title ?? "صفحه"} />
        <div className="jn-wrap jn-inner">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`jn${page === "/" ? " jn-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className={`jn-main${["shop", "category", "product", "blog", "cart", "wishlist", "search", "checkout", "account", "thanks", "faq", "support", "page"].includes(kind ?? "") ? " jn-grey" : ""}`} key={page}>
        {body}
      </main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  bag: "M6 8.5h12l-.9 11.5H6.9z M9 8.5V7a3 3 0 0 1 6 0v1.5",
  cart: "M3 4.5h2.4l2.2 10h9.6l2-7.2H6.2 M9.4 19.3a1.1 1.1 0 1 0 0-.1 M16.8 19.3a1.1 1.1 0 1 0 0-.1",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.8 15.8 20 20",
  heart: "M12 19.5s-7.3-4.4-7.3-9.6A4 4 0 0 1 12 7.3a4 4 0 0 1 7.3 2.6c0 5.2-7.3 9.6-7.3 9.6z",
  user: "M12 4.5a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z M5 20a7 7 0 0 1 14 0",
  down: "M7 10l5 5 5-5",
  left: "M14.5 6 8.5 12l6 6",
  right: "M9.5 6l6 6-6 6",
  arrow: "M19 12H5 M10 7l-5 5 5 5",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  zoom: "M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M15 15l5 5 M10.5 8v5 M8 10.5h5",
  phone: "M6.5 3.5h3.2l1.6 4.2-2.2 1.5a10 10 0 0 0 5.7 5.7l1.5-2.2 4.2 1.6v3.2a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  mail: "M3.5 6h17v12h-17z M3.5 7l8.5 6.2L20.5 7",
  pin: "M12 21s-6.5-5.6-6.5-10.6a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21z M12 7.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z",
  user2: "M8 7.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0z M3.5 19a7.5 7.5 0 0 1 15 0",
  pen: "M4 20l4-1 11-11-3-3L5 16z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  play: "M9 7l8 5-8 5z",
  quote: "M6 17c0-4 1.5-7 5-9l1 1.5c-2 1.3-3 3-3 4.5h2.5V19H6z M13 17c0-4 1.5-7 5-9l1 1.5c-2 1.3-3 3-3 4.5h2.5V19H13z",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  tag: "M3.5 12V4.5H11l9.5 9.5-7.5 7.5z M7.5 8.5v.01",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.9-7.5-9.5V6z M9 12l2 2 4-4",
  chat: "M4 5h16v11H9l-5 4z",
  up: "M6 15l6-6 6 6",
  heartBig: "M12 21s-9.5-5.8-9.5-12.6A5.3 5.3 0 0 1 12 5.2a5.3 5.3 0 0 1 9.5 3.2C21.5 15.2 12 21 12 21z",
};
const BAND_ICONS = ["tag", "truck", "shield", "chat"];

function Svg({ name, className = "jn-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

/** The nine-dot menu icon of the reference. */
const Dots = () => (
  <svg viewBox="0 0 24 24" className="jn-ico jn-dots-ico" aria-hidden="true">
    {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" />))}
  </svg>
);

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const day = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(d) : "";
};
/** Reveal-on-scroll class (CSS scroll-driven; nothing happens where that is not supported). */
const rise = "jn-rise";

/** Small line above section titles: «فروشگاه جونو». */
const shopLine = (view: View) => `فروشگاه ${view.ctx.data.basics.fullName}`;

function Title({ kicker, title, path, center, light, view }: { kicker?: string; title?: string; path?: string; center?: boolean; light?: boolean; view: View }) {
  return (
    <div className={`jn-title${center ? " center" : ""}${light ? " light" : ""} ${rise}`}>
      {kicker && <small>{kicker}</small>}
      <Opt value={title} editing={view.editing} edit={ed(path ?? "", "text", "تیتر")}>
        <h2 {...(path ? ed(path, "text", "تیتر") : {})}>{title}</h2>
      </Opt>
    </div>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="jn-price">
      {now < p.price && <s>{money(view, p.price)}</s>}
      <b>{money(view, now)}</b>
    </span>
  );
}

function ProductCard({ view, p, i = 0 }: { view: View; p: Product; i?: number; mode?: string }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  return (
    <article className={`jn-card ${rise}`} style={{ "--i": i % 4 } as CSSProperties} data-product={p.id}>
      <div className="jn-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="jn-img">{img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}</span>
        </PageLink>
        {soldOut ? <span className="jn-badge dark">ناموجود</span> : onSale(p) ? <span className="jn-badge">{fa(percentOff(p))}٪-</span> : p.badge ? <span className="jn-badge green">{p.badge}</span> : null}
        <div className="jn-card-acts">
          <Act view={view} op="wish" id={p.id} className={`jn-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          {!soldOut &&
            (hasChoices(p) ? (
              <PageLink to={productPath(p)} link={view.link} className="jn-round blue">
                <Svg name="cart" />
              </PageLink>
            ) : (
              <Act view={view} op="add" id={p.id} className="jn-round blue" label="افزودن به سبد خرید">
                <Svg name="cart" />
              </Act>
            ))}
        </div>
      </div>
      <PageLink to={productPath(p)} link={view.link} className="jn-card-name">
        <span>{p.name}</span>
      </PageLink>
      <Price view={view} p={p} />
    </article>
  );
}

/** The grey title band at the top of inner pages: the page name and a small bouncing arrow. */
function Band({ view, title }: { view: View; title: string }) {
  void view;
  return (
    <section className="jn-band">
      <h1>{title}</h1>
      <Svg name="down" className="jn-ico jn-band-arrow" />
    </section>
  );
}

/* ───────────── Header, menu drawer, footer ───────────── */

function menu(view: View) {
  const data = view.ctx.data;
  const pages = [
    { to: "/about", label: "درباره‌ی ما" },
    { to: "/services", label: "خدمات ما" },
    { to: "/team", label: "تیم ما" },
    ...(answered(view.shop).length ? [{ to: "/faq", label: "سؤالات متداول" }] : []),
  ].filter((m) => pageOn(data, m.to));
  return {
    pages,
    items: [
      { to: "/", label: "خانه" },
      ...(pages.length ? [{ to: pages[0]!.to, label: "صفحه‌ها", sub: pages }] : []),
      { to: "/shop", label: "فروشگاه" },
      ...(hasBlog(data) ? [{ to: "/blog", label: "بلاگ" }] : []),
      { to: "/contact", label: "تماس با ما" },
    ] as { to: string; label: string; sub?: { to: string; label: string }[] }[],
  };
}

const isHere = (view: View, to: string, sub?: { to: string }[]) =>
  sub ? sub.some((s) => s.to === view.page) : to === "/shop" ? view.page === "/shop" || view.page.startsWith("/category/") || view.page.startsWith("/product/") : to === "/blog" ? view.page.startsWith("/blog") : view.page === to;

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className="jn-logo">
      {logo ? <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} /> : <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>}
    </PageLink>
  );
}

function Nav({ view }: { view: View }) {
  return (
    <nav className="jn-nav">
      {menu(view).items.map((m) =>
        m.sub ? (
          <div key={m.label} className="jn-drop" tabIndex={-1}>
            <span className={isHere(view, m.to, m.sub) ? "on" : undefined} tabIndex={0}>
              {m.label}
            </span>
            <div className="jn-drop-panel">
              {m.sub.map((s) => (
                <PageLink key={s.to} to={s.to} link={view.link} current={view.page === s.to}>
                  {s.label}
                </PageLink>
              ))}
            </div>
          </div>
        ) : (
          <PageLink key={m.to} to={m.to} link={view.link} current={isHere(view, m.to)}>
            {m.label}
          </PageLink>
        ),
      )}
    </nav>
  );
}

function CartIcon({ view }: { view: View }) {
  const count = priceCart(view.shop, view.visitor.cart).count;
  return (
    <PageLink to="/cart" link={view.link} className="jn-icon jn-cart-ico">
      <Svg name="bag" />
      <i>{fa(count)}</i>
      <span className="sr-only">سبد خرید</span>
    </PageLink>
  );
}

/** The full-height navy menu of the reference; it opens without scripts (a details element). */
function Drawer({ view }: { view: View }) {
  const { items } = menu(view);
  return (
    <details className="jn-drawer">
      <summary className="jn-icon" aria-label="منو">
        <Dots />
      </summary>
      <div className="jn-drawer-panel">
        <div className="jn-drawer-head">
          <Logo view={view} />
          <span className="jn-drawer-x" aria-hidden="true">
            <Svg name="close" />
          </span>
        </div>
        <nav>
          {items.flatMap((m) => (m.sub ? m.sub : [m])).map((m, k) => (
            <PageLink key={m.to} to={m.to} link={view.link} current={view.page === m.to}>
              <span style={{ "--i": k } as CSSProperties}>
                {m.label} <Svg name="arrow" />
              </span>
            </PageLink>
          ))}
          <PageLink to="/account" link={view.link} current={view.page === "/account"}>
            <span style={{ "--i": items.length + 3 } as CSSProperties}>
              حساب من <Svg name="arrow" />
            </span>
          </PageLink>
        </nav>
        <Socials ctx={view.ctx} editing={view.editing} className="jn-drawer-socials" />
      </div>
    </details>
  );
}

function Header(view: View) {
  const { ctx, link, editing } = view;
  const b = ctx.data.basics;
  if (view.page === "/")
    return (
      <header className="jn-head home">
        <div className="jn-wrap jn-head-top">
          <PageLink to="/search" link={link} className="jn-icon jn-hide-sm">
            <Svg name="search" />
            <span className="sr-only">جستجو</span>
          </PageLink>
          <Logo view={view} />
          <div className="jn-head-call">
            <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
              <a href={b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : "#"} className="jn-phone" dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </a>
            </Opt>
            <PageLink to="/contact" link={link} className="jn-btn blue">
              با ما حرف بزنید
            </PageLink>
          </div>
          <div className="jn-sm-tools">
            <CartIcon view={view} />
            <Drawer view={view} />
          </div>
        </div>
        <div className="jn-wrap jn-head-row">
          <Drawer view={view} />
          <Nav view={view} />
          <CartIcon view={view} />
        </div>
      </header>
    );
  return (
    <header className="jn-head">
      <div className="jn-wrap jn-head-in">
        <Logo view={view} />
        <Nav view={view} />
        <div className="jn-head-icons">
          <CartIcon view={view} />
          <PageLink to="/search" link={link} className="jn-icon jn-hide-sm">
            <Svg name="search" />
            <span className="sr-only">جستجو</span>
          </PageLink>
          <Drawer view={view} />
        </div>
      </div>
    </header>
  );
}

function Newsletter({ view }: { view: View }) {
  const { shop, editing, ctx } = view;
  const email = ctx.data.basics.email;
  if (!email || !blockOn(ctx.data, "newsletter")) return null;
  return (
    <section className="jn-news">
      <span className="jn-news-word" aria-hidden="true">
        خبرنامه
      </span>
      <div className="jn-wrap jn-news-in">
        <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>
          <h2 className="sr-only" {...ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>
            {shop.newsletterTitle}
          </h2>
        </Opt>
        {/* No server mailbox yet: joining opens an email to the shop with the visitor's address. */}
        <form method="get" action={`mailto:${email}`} className="jn-news-form">
          <input type="hidden" name="subject" value="عضویت در خبرنامه" />
          <input name="body" type="email" required placeholder="ایمیل خود را وارد کنید" aria-label="ایمیل" dir="ltr" />
          <button type="submit">
            <Svg name="mail" /> عضویت
          </button>
        </form>
        <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن زیر خبرنامه")}>
          <small {...ed("site.shop.newsletterText", "text", "متن زیر خبرنامه")}>{shop.newsletterText}</small>
        </Opt>
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
    <>
      {view.page !== "/contact" && <Newsletter view={view} />}
      <footer className="jn-foot">
        <div className="jn-wrap">
          <Opt value={site?.bandText} editing={editing} edit={ed("site.bandText", "text", "تیتر پایین صفحه")}>
            <h2 className={rise} {...ed("site.bandText", "text", "تیتر پایین صفحه")}>
              {site?.bandText}
            </h2>
          </Opt>
          <div className="jn-foot-cols">
            <div>
              <h4>نشانی</h4>
              <Opt value={site?.address} editing={editing} edit={ed("site.address", "multiline", "نشانی")}>
                <p {...ed("site.address", "multiline", "نشانی")}>{site?.address}</p>
              </Opt>
            </div>
            <div>
              <h4>سلام کنید</h4>
              <Opt value={b.email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
                <a href={b.email ? `mailto:${b.email}` : "#"} className="jn-u" dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                  {b.email}
                </a>
              </Opt>
              <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
                <a href={b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : "#"} className="jn-strong" dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                  {b.phone}
                </a>
              </Opt>
            </div>
            <div>
              <h4>صفحه‌ها</h4>
              <PageLink to="/shop" link={link}>
                فروشگاه
              </PageLink>
              <PageLink to="/account" link={link}>
                حساب من
              </PageLink>
              <PageLink to="/support" link={link}>
                پشتیبانی
              </PageLink>
              {pages.map((p) => (
                <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
                  {p.title}
                </PageLink>
              ))}
            </div>
            <div>
              <h4>ما را دنبال کنید</h4>
              <Socials ctx={ctx} editing={editing} className="jn-foot-socials" />
            </div>
          </div>
          <div className="jn-foot-end">
            <span>
              {b.fullName} © {fa(new Date().getFullYear())}. همه‌ی حقوق محفوظ است.
            </span>
            {(shop.trustLogos ?? []).some((x) => safeUrl(x.image)) && (
              <span className="jn-trust">
                {shop.trustLogos!.filter((x) => safeUrl(x.image)).map((x) => {
                  const href = safeUrl(x.link);
                  const img = <img src={safeUrl(x.image)} alt={x.title ?? ""} loading="lazy" {...ed(`${item("site.shop.trustLogos", x.id)}.image`, "image", "آرم")} />;
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
            <a href="#" className="jn-top" aria-label="بالای صفحه">
              <Svg name="up" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ───────────── Home ───────────── */

/** Home slider: a big photo, a speech bubble (or a blue blob) with the title, and a waving bear. */
function Hero({ view }: { view: View }) {
  const { shop, link, editing } = view;
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  const bear = safeUrl(shop.trendImage);
  return (
    <section className={`jn-hero jn-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="jn-hero" id={`jn-hero-${k}`} className="jn-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {/* Checked until a dot is used: the slides then turn by themselves (paused under the pointer). */}
      {n > 1 && <input type="radio" name="jn-hero" className="jn-dot jn-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="jn-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className={`jn-slide ${k % 2 ? "blob" : "bubble"}`}>
              <span className="jn-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
              </span>
              <div className="jn-say">
                <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                  <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                </Opt>
                <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "text", "متن اسلاید")}>
                  <p {...ed(at(s.id, "text"), "text", "متن اسلاید")}>{s.text}</p>
                </Opt>
                <PageLink to="/shop" link={link} className="jn-btn blue">
                  دیدن محصولات
                </PageLink>
              </div>
            </div>
          );
        })}
      </div>
      <span className="jn-bear" {...ed("site.shop.trendImage", "image", "عکس شخصیت کارتونی")}>
        {bear && <img src={bear} alt="" />}
      </span>
      {n > 1 && (
        <div className="jn-dots">
          {slides.map((s, k) => (
            <label key={s.id} htmlFor={`jn-hero-${k}`} title={`اسلاید ${fa(k + 1)}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/** "What we do": the playful picture beside a heading, a paragraph and a green button. */
function WhatWeDo({ view, kicker = "کاری که می‌کنیم", to = "/shop" }: { view: View; kicker?: string; to?: string }) {
  const { ctx, editing, link } = view;
  const site = ctx.data.site;
  return (
    <section className="jn-wrap jn-what">
      <div className={`jn-what-pic ${rise}`}>
        <span className="jn-blob-bg" aria-hidden="true" />
        <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس معرفی" className="jn-float" />
      </div>
      <div className={`jn-what-text ${rise}`}>
        <small className="jn-kicker">{kicker}</small>
        <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر معرفی")}>
          <h2 {...ed("site.aboutTitle", "text", "تیتر معرفی")}>{site?.aboutTitle}</h2>
        </Opt>
        <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن معرفی")}>
          <p {...ed("site.aboutText", "multiline", "متن معرفی")}>{site?.aboutText}</p>
        </Opt>
        <PageLink to={to} link={link} className="jn-btn green">
          بیشتر ببینید
        </PageLink>
      </div>
    </section>
  );
}

/** The wide photo with a dark veil, a kicker, a big heading and a button. */
function PhotoBand({ view }: { view: View }) {
  const { shop, editing, link } = view;
  const img = safeUrl(shop.lookImage);
  return (
    <section className="jn-photo">
      <span className="jn-photo-pic" {...ed("site.shop.lookImage", "image", "عکس نوار")}>
        {img && <img src={img} alt="" loading="lazy" />}
      </span>
      <div className={`jn-photo-text ${rise}`}>
        <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "text", "خط کوچک نوار")}>
          <small {...ed("site.shop.lookText", "text", "خط کوچک نوار")}>{shop.lookText}</small>
        </Opt>
        <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "تیتر نوار")}>
          <h2 {...ed("site.shop.lookTitle", "text", "تیتر نوار")}>{shop.lookTitle}</h2>
        </Opt>
        <PageLink to={pageOn(view.ctx.data, "/about") ? "/about" : "/shop"} link={link} className="jn-btn blue">
          درباره‌ی ما
        </PageLink>
      </div>
    </section>
  );
}

function Clients({ view }: { view: View }) {
  const { ctx, editing } = view;
  const site = ctx.data.site;
  const clients = (site?.clients ?? []).filter((c) => safeUrl(c.image));
  if (!clients.length && !editing) return null;
  return (
    <section className="jn-wrap jn-clients">
      <div className={`jn-clients-head ${rise}`}>
        <div>
          <small className="jn-kicker">مشتری‌های ما</small>
          <Opt value={site?.styleTitle} editing={editing} edit={ed("site.styleTitle", "text", "تیتر مشتری‌ها")}>
            <h2 {...ed("site.styleTitle", "text", "تیتر مشتری‌ها")}>{site?.styleTitle}</h2>
          </Opt>
        </div>
        <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن مشتری‌ها")}>
          <p {...ed("site.styleText", "multiline", "متن مشتری‌ها")}>{site?.styleText}</p>
        </Opt>
      </div>
      <div className={`jn-logos ${rise}`}>
        {clients.map((c) => (
          <span key={c.id} title={c.name} {...ed(`${item("site.clients", c.id)}.image`, "image", `آرم ${c.name}`)}>
            <img src={safeUrl(c.image)} alt={c.name} loading="lazy" />
          </span>
        ))}
        {editing && (
          <span className="jn-logo-add" {...ed("site.clients", "newimage", "افزودن آرم")}>
            +
          </span>
        )}
      </div>
    </section>
  );
}

/** Customer quotes on navy, one at a time (radio dots), beside a photo with a pulsing play mark. */
function Quotes({ view }: { view: View }) {
  const { ctx, editing } = view;
  const list = (ctx.data.site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  if (!list.length) return null;
  const photo = safeUrl(ctx.data.site?.accentImage);
  return (
    <section className="jn-quotes">
      <div className="jn-quotes-text">
        {list.length > 1 && list.map((t, k) => <input key={t.id} type="radio" name="jn-quote" id={`jn-quote-${k}`} className="jn-dot" defaultChecked={k === 0} aria-label={t.name} />)}
        <small className="jn-kicker light">نظرات</small>
        <h2>آن‌ها چه می‌گویند</h2>
        <Svg name="quote" className="jn-ico jn-quote-mark" />
        <div className="jn-quote-stack">
          {list.map((t) => {
            const at = item("site.testimonials", t.id);
            return (
              <figure key={t.id} className="jn-quote">
                <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                <span className="jn-face">{safeUrl(t.image) ? <img src={safeUrl(t.image)} alt="" loading="lazy" /> : t.name.charAt(0)}</span>
                <figcaption {...ed(`${at}.name`, "text", "نام")}>{t.name}</figcaption>
              </figure>
            );
          })}
        </div>
        {list.length > 1 && (
          <div className="jn-qdots">
            {list.map((t, k) => (
              <label key={t.id} htmlFor={`jn-quote-${k}`} title={t.name} />
            ))}
          </div>
        )}
      </div>
      <span className="jn-quotes-pic" {...ed("site.accentImage", "image", "عکس کنار نظرات")}>
        {photo && <img src={photo} alt="" loading="lazy" />}
        <i className="jn-play" aria-hidden="true">
          <Svg name="play" />
        </i>
      </span>
      {editing && <span className="sr-only">{list.length}</span>}
    </section>
  );
}

function LatestNews({ view }: { view: View }) {
  const posts = livePosts(view.shop).slice(0, 3);
  if (!posts.length || !hasBlog(view.ctx.data)) return null;
  return (
    <section className="jn-sec jn-grey">
      <div className="jn-wrap">
      <Title view={view} kicker="بلاگ ما" title="آخرین اخبار" center />
      <div className="jn-tiles">
        {posts.map((p, k) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link} className={`jn-tile ${rise}`}>
            <span className="jn-tile-in" style={{ "--i": k } as CSSProperties}>
              {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
              <span className="jn-tile-text">
                <small>{day(p.date)}</small>
                <b>{p.title}</b>
              </span>
            </span>
          </PageLink>
        ))}
      </div>
      </div>
    </section>
  );
}

function Home(view: View) {
  const { ctx, shop } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 4);
  const popular = products.filter((p) => !featured.includes(p)).slice(0, 8);
  return (
    <>
      {on("hero") && <Hero view={view} />}

      {on("featured") && featured.length > 0 && (
        <section className="jn-sec jn-grey">
          <div className="jn-wrap">
            <Title view={view} kicker={shopLine(view)} title={shop.newTitle} path="site.shop.newTitle" center />
            <div className="jn-grid four">
              {featured.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} />
              ))}
            </div>
          </div>
        </section>
      )}

      {on("about") && (
        <section className="jn-grey jn-what-wrap">
          <WhatWeDo view={view} to={pageOn(data, "/services") ? "/services" : "/shop"} />
        </section>
      )}

      {on("popular") && popular.length > 0 && (
        <section className="jn-sec jn-grey">
          <div className="jn-wrap">
            <Title view={view} kicker={shopLine(view)} title={shop.bestTitle} path="site.shop.bestTitle" center />
            <div className="jn-grid four">
              {popular.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} />
              ))}
            </div>
          </div>
        </section>
      )}

      {on("band") && <PhotoBand view={view} />}
      {on("clients") && <Clients view={view} />}
      {on("testimonials") && <Quotes view={view} />}
      {on("news") && <LatestNews view={view} />}
    </>
  );
}

/* ───────────── About us, services, team ───────────── */

function TeamGrid({ view, limit }: { view: View; limit?: number }) {
  const team = (view.ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image)).slice(0, limit);
  if (!team.length && !view.editing) return null;
  return (
    <div className={`jn-team${limit === 4 ? " four" : ""}`}>
      {team.map((g, k) => {
        const at = item("site.gallery", g.id);
        return (
          <figure key={g.id} className={`jn-member ${rise}`} style={{ "--i": k % 4 } as CSSProperties}>
            <ZoomOpen id={g.id} className="jn-member-pic">
              <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />
            </ZoomOpen>
            <figcaption>
              <b {...ed(`${at}.title`, "text", "نام")}>{g.title}</b>
              <Opt value={g.description} editing={view.editing} edit={ed(`${at}.description`, "text", "سمت")}>
                <small {...ed(`${at}.description`, "text", "سمت")}>{g.description}</small>
              </Opt>
            </figcaption>
          </figure>
        );
      })}
      {view.editing && (
        <span className="jn-member jn-member-add" {...ed("site.gallery", "newimage", "افزودن عضو تیم")}>
          + افزودن عضو
        </span>
      )}
    </div>
  );
}

/** "We help you take care of the kids": two photos, a spinning round badge and a heading. */
function Care({ view }: { view: View }) {
  const { shop, editing } = view;
  return (
    <section className="jn-wrap jn-care">
      <div className={`jn-care-a ${rise}`}>
        <Pic src={shop.newImage} path="site.shop.newImage" label="عکس اول" className="jn-care-pic" />
        <span className="jn-spin" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <defs>
              <path id="jn-ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
            </defs>
            <text>
              <textPath href="#jn-ring">درباره‌ی ما • درباره‌ی ما • درباره‌ی ما •</textPath>
            </text>
          </svg>
          <i>
            <svg viewBox="0 0 40 40">
              <path d="M14 13v8M26 13v8M11 25c4 6 14 6 18 0" />
            </svg>
          </i>
        </span>
      </div>
      <div className={`jn-care-b ${rise}`}>
        <small className="jn-kicker">رویکرد خلاقانه</small>
        <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "تیتر")}>
          <h2 {...ed("site.shop.promoTitle", "text", "تیتر")}>{shop.promoTitle}</h2>
        </Opt>
        <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "متن")}>
          <p {...ed("site.shop.promoText", "text", "متن")}>{shop.promoText}</p>
        </Opt>
        <Pic src={shop.discoverImage} path="site.shop.discoverImage" label="عکس دوم" className="jn-care-pic2" />
      </div>
    </section>
  );
}

/** Quotes as text with a row of faces (about us page). */
function QuoteRow({ view }: { view: View }) {
  const list = (view.ctx.data.site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  if (!list.length) return null;
  return (
    <section className="jn-sec jn-grey">
      <div className="jn-wrap jn-qrow">
        {list.length > 1 && list.map((t, k) => <input key={t.id} type="radio" name="jn-qrow" id={`jn-qrow-${k}`} className="jn-dot" defaultChecked={k === 0} aria-label={t.name} />)}
        <div className="jn-qrow-faces">
          {list.map((t, k) => (
            <label key={t.id} htmlFor={`jn-qrow-${k}`} title={t.name}>
              <span className="jn-face">{safeUrl(t.image) ? <img src={safeUrl(t.image)} alt="" loading="lazy" /> : t.name.charAt(0)}</span>
              <b>{t.name}</b>
            </label>
          ))}
        </div>
        <div className="jn-qrow-text">
          {list.map((t) => (
            <blockquote key={t.id} {...ed(`${item("site.testimonials", t.id)}.text`, "multiline", "متن نظر")}>
              {t.text}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function About(view: View) {
  return (
    <>
      <Band view={view} title="درباره‌ی ما" />
      <section className="jn-what-wrap">
        <WhatWeDo view={view} kicker="کاری که می‌کنیم" to="/shop" />
      </section>
      <section className="jn-sec jn-grey">
        <div className="jn-wrap">
          <Title view={view} kicker={shopLine(view)} title="تیم ما" center />
          <TeamGrid view={view} limit={4} />
        </div>
      </section>
      <Care view={view} />
      <QuoteRow view={view} />
    </>
  );
}

function Services(view: View) {
  const { shop, editing, link } = view;
  const perks = (shop.perks ?? []).filter((x) => x.title.trim());
  const cats = (shop.categories ?? []).filter((c) => safeUrl(c.image) && visible(shop).some((p) => p.categoryId === c.id)).slice(0, 3);
  const band = (shop.bandItems ?? []).filter((x) => x.trim());
  return (
    <>
      <Band view={view} title="خدمات ما" />
      {perks.length > 0 && (
        <section className="jn-wrap jn-services">
          {perks.map((x, k) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id} className={`jn-service ${rise}`} style={{ "--i": k } as CSSProperties}>
                <span className="jn-service-ico" {...ed(`${at}.image`, "image", "آیکون")}>
                  {safeUrl(x.image) && <img src={safeUrl(x.image)} alt="" loading="lazy" />}
                </span>
                <b {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</b>
                <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح")}>
                  <small {...ed(`${at}.text`, "text", "توضیح")}>{x.text}</small>
                </Opt>
              </div>
            );
          })}
        </section>
      )}
      <Clients view={view} />
      <Quotes view={view} />
      {cats.length > 0 && (
        <section className="jn-sec jn-wrap">
          <Title view={view} kicker={shopLine(view)} title="دسته‌های ما" center />
          <div className="jn-grid three">
            {cats.map((c, k) => (
              <PageLink key={c.id} to={`/category/${c.id}`} link={link} className={`jn-cat ${rise}`}>
                <span className="jn-cat-pic" style={{ "--i": k } as CSSProperties}>
                  <img src={safeUrl(c.image)} alt="" loading="lazy" />
                </span>
                <b>{c.name}</b>
                <small>{fa(visible(shop).filter((p) => p.categoryId === c.id).length)} محصول</small>
                <Svg name="arrow" />
              </PageLink>
            ))}
          </div>
        </section>
      )}
      {band.length > 0 && (
        <section className="jn-wrap jn-feats">
          {band.map((x, k) => (
            <span key={k} {...ed(`site.shop.bandItems[${k}]`, "text", "ویژگی")}>
              <Svg name={BAND_ICONS[k % 4]!} /> {x}
            </span>
          ))}
        </section>
      )}
    </>
  );
}

function Team(view: View) {
  const skills = view.ctx.data.skills.filter((s) => s.name.trim());
  const site = view.ctx.data.site;
  return (
    <>
      <Band view={view} title="تیم ما" />
      <section className="jn-wrap jn-team-top">
        <div className={rise}>
          <small className="jn-kicker">درباره‌ی ما</small>
          <Opt value={site?.aboutCaption} editing={view.editing} edit={ed("site.aboutCaption", "text", "تیتر")}>
            <h2 {...ed("site.aboutCaption", "text", "تیتر")}>{site?.aboutCaption}</h2>
          </Opt>
          <Opt value={site?.contactNote} editing={view.editing} edit={ed("site.contactNote", "multiline", "متن")}>
            <p {...ed("site.contactNote", "multiline", "متن")}>{site?.contactNote}</p>
          </Opt>
        </div>
        {skills.length > 0 && (
          <div className={`jn-bars ${rise}`}>
            {skills.slice(0, 4).map((s) => (
              <div key={s.id} className="jn-bar" style={{ "--w": `${(s.level ?? 4) * 20}%` } as CSSProperties}>
                <span>
                  <b {...ed(`${item("skills", s.id)}.name`, "text", "عنوان")}>{s.name}</b>
                  <small>{fa((s.level ?? 4) * 20)}٪</small>
                </span>
                <i />
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="jn-sec jn-grey">
        <div className="jn-wrap">
          <Title view={view} kicker="فروشندگان خلاق" title="تیم ما" center />
          <TeamGrid view={view} />
        </div>
      </section>
      <PhotoBand view={view} />
    </>
  );
}

/* ───────────── Contact and questions ───────────── */

function Contact(view: View) {
  const { ctx, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const photo = safeUrl(site?.heroImage);
  return (
    <>
      <section className="jn-contact">
        <span className="jn-contact-pic" {...ed("site.heroImage", "image", "عکس صفحه‌ی تماس")}>
          {photo && <img src={photo} alt="" />}
        </span>
        <div className={`jn-contact-form ${rise}`}>
          <small className="jn-kicker">تماس با ما</small>
          <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>
            <h1 {...ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>{site?.contactTitle}</h1>
          </Opt>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
            <p className="jn-muted" {...ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
              {site?.contactText}
            </p>
          </Opt>
          {b.email ? (
            // No server mailbox yet: sending opens an email to the shop.
            <form method="get" action={`mailto:${b.email}`}>
              <label>
                <Svg name="user2" />
                <input name="subject" placeholder="نام شما" aria-label="نام شما" />
              </label>
              <label>
                <Svg name="phone" />
                <input name="cc" placeholder="تلفن" aria-label="تلفن" dir="auto" />
              </label>
              <label className="full">
                <Svg name="pen" />
                <textarea name="body" required rows={3} placeholder="چطور می‌توانیم کمکتان کنیم؟" aria-label="پیام شما" />
              </label>
              <button type="submit" className="jn-btn blue">
                <Svg name="mail" /> ارسال پیام
              </button>
            </form>
          ) : (
            <p className="jn-muted">برای فعال شدن فرم، ایمیل فروشگاه را وارد کنید.</p>
          )}
        </div>
      </section>
      {embed ? (
        <section className="jn-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
        </section>
      ) : (
        <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
          <section className="jn-wrap jn-sec">
            <a href={map ?? "#"} {...outside(map)} className="jn-btn ghost" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
              <Svg name="pin" /> مسیریابی روی نقشه
            </a>
          </section>
        </Opt>
      )}
      <section className="jn-wrap jn-contact-row">
        <Opt value={site?.address} editing={editing} edit={ed("site.address", "multiline", "نشانی")}>
          <p {...ed("site.address", "multiline", "نشانی")}>{site?.address}</p>
        </Opt>
        <div>
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
        </div>
        <Socials ctx={ctx} editing={editing} className="jn-social-round" />
      </section>
    </>
  );
}

function Faq(view: View) {
  const list = answered(view.shop);
  const photo = safeUrl(view.ctx.data.site?.signatureImage);
  return (
    <>
      <Band view={view} title={view.shop.faqTitle?.trim() || "سؤالات متداول"} />
      <section className="jn-wrap jn-faq">
        {list.map((x, k) => {
          const at = item("site.shop.faq", x.id);
          return (
            <details key={x.id} className={`jn-qa ${rise}`} open={k === 0}>
              <summary>
                <span {...ed(`${at}.q`, "text", "سؤال")}>{x.q}</span>
                <i aria-hidden="true" />
              </summary>
              <p {...ed(`${at}.a`, "multiline", "پاسخ")}>{x.a}</p>
            </details>
          );
        })}
      </section>
      <span className="jn-faq-pic" {...ed("site.signatureImage", "image", "عکس صفحه‌ی سؤالات")}>
        {photo && <img src={photo} alt="" loading="lazy" />}
      </span>
    </>
  );
}

/* ───────────── Shop page with a side column ───────────── */

function Listing(view: View & { categoryId?: string }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const { list, cats, cat, active } = filterProducts(visible(shop), shop.categories ?? [], q, view.categoryId);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  const sort = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  const cart = priceCart(shop, visitor.cart);
  const side = (
    <>
      <div className="jn-widget">
        <h3>سبد خرید</h3>
        {cart.count ? (
          <p>
            {fa(cart.count)} کالا · {money(view, cart.subtotal)}{" "}
            <PageLink to="/cart" link={link}>
              دیدن سبد
            </PageLink>
          </p>
        ) : (
          <p className="jn-muted">سبد خرید شما خالی است.</p>
        )}
        <form method="get" action={link("/search")} className="jn-side-search">
          <Svg name="search" />
          <input name="q" placeholder="جستجوی محصول..." aria-label="جستجوی محصول" />
        </form>
      </div>
      <div className="jn-widget">
        <h3>دسته‌بندی محصولات</h3>
        <ul className="jn-cats">
          {cats.map((c) => (
            <li key={c.id}>
              <PageLink to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
                {c.name} <small>({fa(visible(shop).filter((p) => p.categoryId === c.id).length)})</small>
              </PageLink>
            </li>
          ))}
        </ul>
      </div>
      <PriceFilter view={view} here={here} />
      <form method="get" action={link(here)} className="jn-widget jn-checks">
        <h3>وضعیت</h3>
        <Keep query={q} skip={["sale", "stock"]} />
        <label>
          <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} /> موجود
        </label>
        <label>
          <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} /> تخفیف‌دار
        </label>
        <button type="submit" className="jn-btn blue small">
          اعمال
        </button>
      </form>
    </>
  );
  return (
    <>
      <Band view={view} title={cat?.name ?? "فروشگاه"} />
      <section className="jn-wrap jn-shop">
        <div>
          <div className="jn-toolbar">
            <small>
              نمایش {fa(list.length)} محصول
              {active && (
                <>
                  {" · "}
                  <PageLink to={here} link={link}>
                    حذف فیلترها
                  </PageLink>
                </>
              )}
            </small>
            <details className="jn-sort">
              <summary>
                {sort[1]} <Svg name="down" />
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
            <div className="jn-grid two">
              {list.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} />
              ))}
            </div>
          ) : (
            <p className="jn-notice">{active ? "محصولی با این فیلترها پیدا نشد." : "هنوز محصولی اضافه نشده است."}</p>
          )}
        </div>
        <aside className="jn-side">
          <details className="jn-filter-sm">
            <summary>فیلتر محصولات</summary>
            {side}
          </details>
          <div className="jn-side-lg">{side}</div>
        </aside>
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
    .slice(0, 3);
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const rating = visitor.ratings?.[p.id];
  const [lead, ...rest] = (p.description ?? "").split(/\n\s*\n|\n/).filter((x) => x.trim());
  return (
    <>
      <Band view={view} title="فروشگاه" />
      <section className="jn-wrap jn-product" data-product={p.id}>
        <div className="jn-gallery">
          {imgs.length > 1 && (
            <div className="jn-thumbs">
              {imgs.map((src, k) => (
                <label key={k} className="jn-thumb">
                  <input type="radio" name="jn-gal" defaultChecked={k === 0} aria-label={`عکس ${fa(k + 1)}`} />
                  <img src={src} alt="" />
                </label>
              ))}
            </div>
          )}
          <div className="jn-gallery-main">
            {(imgs.length ? imgs : [undefined]).map((src, k) =>
              src ? (
                <ZoomOpen key={k} id={`${p.id}-${k}`} className="jn-gal">
                  <span>
                    <img src={src} alt={p.name} />
                  </span>
                </ZoomOpen>
              ) : (
                <span key={k} className="jn-gal" />
              ),
            )}
            <i className="jn-zoom" aria-hidden="true">
              <Svg name="zoom" />
            </i>
            {onSale(p) && !soldOut && <span className="jn-badge">{fa(percentOff(p))}٪-</span>}
          </div>
        </div>
        <div className="jn-pinfo">
          <h1>{p.name}</h1>
          {rating && <Stars value={rating.avg} count={rating.count} />}
          <Price view={view} p={p} />
          {lead && <p className="jn-muted">{lead}</p>}
          {soldOut ? (
            <p className="jn-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="jn-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value="/cart" />
              <OptionPicker p={p} />
              <div className="jn-buy-row">
                <label className="jn-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 50} defaultValue={1} />
                </label>
                <button type="submit" className="jn-btn blue">
                  <Svg name="cart" /> خرید
                </button>
                <Act view={view} op="wish" id={p.id} className={`jn-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
                  <Svg name="heart" />
                </Act>
              </div>
            </form>
          )}
          <dl className="jn-meta">
            {cat && (
              <>
                <dt>دسته:</dt>
                <dd>
                  <PageLink to={`/category/${cat.id}`} link={link}>
                    {cat.name}
                  </PageLink>
                </dd>
              </>
            )}
            {p.badge && (
              <>
                <dt>برچسب:</dt>
                <dd>{p.badge}</dd>
              </>
            )}
            <dt>کد کالا:</dt>
            <dd dir="ltr">{p.id.toUpperCase()}</dd>
          </dl>
        </div>
      </section>
      <section className="jn-wrap jn-tabs">
        <input type="radio" name="jn-tab" id="jn-tab-1" defaultChecked />
        <input type="radio" name="jn-tab" id="jn-tab-2" />
        <div className="jn-tab-heads">
          <label htmlFor="jn-tab-1">توضیحات</label>
          <label htmlFor="jn-tab-2">نظرات ({fa(rating?.count ?? 0)})</label>
        </div>
        <div className="jn-tab jn-tab-desc">
          {(rest.length ? rest : lead ? [lead] : []).map((x, k) => (
            <p key={k}>{x}</p>
          ))}
          <SpecsTable p={p} className="jn-specs" />
        </div>
        <div className="jn-tab jn-tab-rev">
          <Reviews p={p} link={link} page={view.page} visitor={visitor} />
        </div>
      </section>
      {related.length > 0 && (
        <section className="jn-wrap jn-sec">
          <div className="jn-title">
            <h2>محصولات مرتبط</h2>
          </div>
          <div className="jn-grid three">
            {related.map((x, k) => (
              <ProductCard key={x.id} view={view} p={x} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Blog, cart, checkout and the rest (shared shapes, Juno look) ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];
const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 260 ? `${p.text.slice(0, 260).trim()}…` : p.text);

function Act({ view, op, id, children, className, qty, size, label }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="jn-act">
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
    <form method="get" action={view.link(here)} className="jn-widget jn-price-filter">
      <h3>فیلتر قیمت</h3>
      <Keep query={q} skip={["min", "max"]} />
      <div className="jn-minmax">
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
      <div className="jn-range" aria-hidden="true">
        <input type="range" min={lo} max={hi} step={step} defaultValue={min} tabIndex={-1} disabled />
        <input type="range" min={lo} max={hi} step={step} defaultValue={max} tabIndex={-1} disabled />
      </div>
      <div className="jn-range-foot">
        <small>
          قیمت: {money(view, min)} — {money(view, max)}
        </small>
        <button type="submit">فیلتر</button>
      </div>
    </form>
  );
}


function PageHead({ title, view }: { title: string; view: View; trail?: { label: string; to?: string }[] }) {
  return <Band view={view} title={title} />;
}


function Empty({ view, text, heart }: { view: View; text: string; heart?: boolean }) {
  return (
    <div className="jn-empty">
      <Svg name={heart ? "heartBig" : "bag"} className="jn-empty-ico" />
      <p>{text}</p>
      <PageLink to="/shop" link={view.link} className="jn-btn dark">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}


function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="jn-wrap jn-inner">
      <PageHead view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <div className="jn-cart">
          <div className="jn-box jn-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="jn-line">
                <PageLink to={productPath(l.product)} link={link} className="jn-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="jn-line-info">
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
                <div className="jn-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    <Svg name="minus" />
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    <Svg name="plus" />
                  </Act>
                </div>
                <b className="jn-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="jn-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="jn-box jn-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <dl>
              <dt>جمع کالاها ({fa(cart.count)})</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="jn-minus">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="jn-btn wide">
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
    <section className="jn-wrap jn-inner">
      {items.length === 0 ? (
        <Empty view={view} heart text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <>
          <PageHead view={view} title="علاقه‌مندی‌ها" />
          <div className="jn-grid four">
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
    <section className="jn-wrap jn-inner">
      <PageHead view={view} title="جستجو" />
      <form method="get" action={view.link("/search")} className="jn-search jn-search-big">
        <input name="q" defaultValue={q} placeholder="نام محصول را بنویسید..." aria-label="جستجو" />
        <button type="submit" aria-label="جستجو">
          <Svg name="search" />
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="jn-grid four">
            {found.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        ) : (
          <p className="jn-notice">محصولی با «{q}» پیدا نشد.</p>
        ))}
    </section>
  );
}


function Checkout(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <section className="jn-wrap jn-inner">
        <PageHead view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </section>
    );
  return (
    <section className="jn-wrap jn-inner">
      <PageHead view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <div className="jn-cart">
        <form method="post" action={link("/_order")} className="jn-box jn-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="jn-error">{error}</p>}
          {!me && (
            <p className="full jn-muted">
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
          <input name="website" tabIndex={-1} autoComplete="off" className="jn-trap" aria-hidden="true" />
          <button type="submit" className="jn-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="jn-box jn-sum">
          <h2>سفارش شما</h2>
          <ul className="jn-sum-lines">
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
                <dd className="jn-minus">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="jn-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
    <section className="jn-wrap jn-inner">
      <PageHead view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}


function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="jn-wrap jn-inner">
      <div className="jn-box jn-thanks">
        <span className="jn-done" aria-hidden="true">
          <Svg name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="jn-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="jn-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}


function PostMeta({ p }: { p: PostT }) {
  const parts = [day(p.date), p.author, p.category].filter(Boolean);
  return <small className="jn-post-meta">{parts.join(" · ")}</small>;
}


function BlogSide({ view, skip }: { view: View; skip?: string }) {
  const posts = livePosts(view.shop).filter((p) => p.id !== skip).slice(0, 4);
  return (
    <aside className="jn-blog-side">
      <div className="jn-widget">
        <h3>آخرین نوشته‌ها</h3>
        {posts.map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link} className="jn-mini-post">
            <span className="jn-mini-pic">{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <span>
              <b>{p.title}</b>
              <small>{day(p.date)}</small>
            </span>
          </PageLink>
        ))}
      </div>
      <div className="jn-widget">
        <h3>ما را دنبال کنید</h3>
        <Socials ctx={view.ctx} editing={view.editing} className="jn-social-big" />
      </div>
    </aside>
  );
}


function Blog(view: View) {
  const posts = livePosts(view.shop);
  return (
    <section className="jn-wrap jn-inner">
      <Trail view={view} items={[{ label: "بلاگ" }]} />
      <div className="jn-blog">
        <div className="jn-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="jn-post">
                <PageLink to={`/blog/${p.id}`} link={view.link} className="jn-post-pic">
                  <span {...ed(`${at}.image`, "image", "عکس نوشته")}>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
                  {p.category && <i className="jn-post-cat">{p.category}</i>}
                </PageLink>
                <PageLink to={`/blog/${p.id}`} link={view.link}>
                  <h2 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h2>
                </PageLink>
                <PostMeta p={p} />
                <p {...ed(p.excerpt ? `${at}.excerpt` : `${at}.text`, "multiline", p.excerpt ? "خلاصه‌ی نوشته" : "متن نوشته")}>{excerptOf(p)}</p>
                <PageLink to={`/blog/${p.id}`} link={view.link} className="jn-btn small">
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
    <section className="jn-wrap jn-inner">
      <Trail view={view} items={[{ label: "بلاگ", to: "/blog" }, { label: p.title }]} />
      <div className="jn-blog">
        <article className="jn-post jn-post-full">
          <span className="jn-post-pic" {...ed(`${at}.image`, "image", "عکس نوشته")}>
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" />}
            {p.category && <i className="jn-post-cat">{p.category}</i>}
          </span>
          <h1 {...ed(`${at}.title`, "text", "عنوان نوشته")}>{p.title}</h1>
          <PostMeta p={p} />
          <div className="jn-post-text" {...ed(`${at}.text`, "multiline", "متن نوشته")}>
            {p.text
              .split(/\n\s*\n|\n/)
              .filter((x) => x.trim())
              .map((x, k) => (
                <p key={k}>{x}</p>
              ))}
          </div>
          <PageLink to="/blog" link={view.link} className="jn-btn small ghost">
            <Svg name="right" /> بازگشت به بلاگ
          </PageLink>
        </article>
        <BlogSide view={view} skip={p.id} />
      </div>
    </section>
  );
}


function Trail({ view, items }: { view: View; items: { label: string; to?: string }[] }) {
  return <Band view={view} title={items[0]?.label ?? ""} />;
}

/** A picture the owner can change by clicking it in the editor. */

function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`jn-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}


/* ───────────── Example content (from the Juno reference, in Persian) ───────────── */

export function junoSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`jn-${n}`);
  const png = (n: string) => sampleImage(`jn-${n}`, "png");
  const soon = (days: number) => new Date(Date.now() + days * 86400000 + 5 * 3600000).toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const products: Product[] = [
    { id: "j1", name: "خانه‌ی سیار عروسک", categoryId: "c2", price: 3200000, stock: 6, featured: true, images: [img("dolls-trailer")], description: "خانه‌ی سیار عروسک با آشپزخانه، تخت و استخر کوچک؛ کلی بازی و قصه برای بچه‌ها.\nمناسب سه سال به بالا، با قطعه‌های محکم و رنگ‌های بی‌خطر.", specs: [{ label: "سن", value: "۳ سال به بالا" }, { label: "جنس", value: "پلاستیک بی‌خطر" }] },
    { id: "j2", name: "لیوان لگویی", categoryId: "c3", price: 220000, stock: 30, featured: true, images: [img("cup")], description: "لیوانی که می‌شود رویش با آجرهای لگو ساخت‌وساز کرد." },
    { id: "j3", name: "خرس عروسکی", categoryId: "c2", price: 700000, stock: 14, featured: true, images: [img("teddy")], description: "خرس عروسکی نرم و بزرگ با پاپیون چهارخانه؛ بهترین هدیه‌ی تولد." },
    { id: "j4", name: "ماشین امداد", categoryId: "c3", price: 1000000, salePrice: 800000, saleEndsAt: soon(6), stock: 9, featured: true, images: [img("truck")], description: "ماشین امداد قابل ساخت با قطعه‌های رنگی و یک آدمک راننده." },
    { id: "j5", name: "هلیکوپتر اسکای‌وایندر", categoryId: "c1", price: 2500000, stock: 8, images: [img("skywinder")], description: "هلیکوپتر کنترلی که با یک حرکت ساده‌ی دست به پرواز درمی‌آید.\nباتری قابل شارژ دارد و برای بازی در خانه و حیاط مناسب است.", specs: [{ label: "برند", value: "ایرهاگز" }, { label: "سن", value: "۸ سال به بالا" }] },
    { id: "j6", name: "بیل مکانیکی", categoryId: "c1", price: 1220000, stock: 12, images: [img("excavator")], description: "بیل مکانیکی فلزی با بازوی متحرک و چرخ‌های زنجیری." },
    { id: "j7", name: "عروسک دختر ناز", categoryId: "c2", price: 1500000, stock: 5, images: [img("cutie-doll")], description: "عروسک با لباس سرمه‌ای و موهای فرفری طلایی." },
    { id: "j8", name: "واکر موزیکال", categoryId: "c4", price: 1000000, stock: 20, images: [img("genius-tray")], description: "واکر آموزشی با دکمه‌های موزیکال، حروف و شکل‌ها؛ برای قدم‌های اول کودک." },
    { id: "j9", name: "عروسک دکتر", categoryId: "c2", price: 1220000, salePrice: 990000, saleEndsAt: soon(3), stock: 7, images: [img("doctor-doll")], description: "عروسک دکتر کوچولو با روپوش و گوشی پزشکی." },
    { id: "j10", name: "کیف کارتونی", categoryId: "c3", price: 900000, stock: 18, images: [img("cartoon-kit")], description: "کیف دوشی سبک با طرح شخصیت‌های کارتونی." },
    { id: "j11", name: "سطل آجرهای ساختنی", categoryId: "c4", price: 3220000, stock: 4, badge: "جدید", images: [img("blocks")], description: "۸۰ آجر بزرگ و رنگی در یک سطل؛ برای ساختن هر چیزی که بچه‌ها تصور می‌کنند." },
  ];
  return {
    ...base,
    basics: { ...base.basics, fullName: "Juno", jobTitle: "اسباب‌بازی و سرگرمی", avatarUrl: png("logo"), email: "info@example.com", phone: "1 800 458 56 97", summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "sl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "sl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    skills: [
      { id: "k1", name: "طراحی", level: 4 },
      { id: "k2", name: "برندسازی", level: 5 },
      { id: "k3", name: "فروش آنلاین", level: 3 },
    ],
    site: {
      ...base.site,
      gallery: [
        { id: "t1", title: "وندی ویلیامز", description: "مدیر فروش", image: img("team1") },
        { id: "t2", title: "گری فریمونت", description: "مدیرعامل", image: img("team2") },
        { id: "t3", title: "ویکی وارم‌هارت", description: "مدیر فروش", image: img("team4") },
        { id: "t4", title: "آنا اسمیت", description: "مدیر خلاقیت", image: img("team5") },
      ],
      aboutTitle: "ما برای بچه‌ها رویداد برگزار می‌کنیم",
      aboutText: "فعالیت‌های سرگرم‌کننده و آموزشی برای هر مناسبت، همراه با اسباب‌بازی‌ها و خوراکی‌های عالی. درباره‌ی خدمات ما بیشتر بدانید.",
      aboutImage: png("creative"),
      aboutCaption: "ما بهترین اسباب‌بازی‌ها را ارائه می‌دهیم",
      contactNote: "ما به کیفیت و اعتماد شما اهمیت می‌دهیم. اسباب‌بازی‌های ما از تولیدکننده‌های معتبر می‌آیند و پیش از فروش بررسی می‌شوند.",
      styleTitle: "با مشتری‌ها و همکاران ما آشنا شوید",
      styleText: "از اعتماد شما سپاسگزاریم. با مشتری‌های همیشگی و همکارانی آشنا شوید که ما را برای اسباب‌بازی‌های بچه‌هایشان انتخاب کرده‌اند.",
      accentImage: img("video"),
      heroImage: img("contact"),
      signatureImage: img("faq"),
      contactTitle: "سؤالی دارید؟ با ما در تماس باشید!",
      contactText: "هر سؤالی درباره‌ی سفارش یا اسباب‌بازی‌ها دارید، بپرسید؛ زود جواب می‌دهیم.",
      address: "تهران، خیابان اصلی، پلاک ۱۲۳",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7000&mlon=51.4000",
      bandText: "تجربه‌ی خرید شما را شادتر می‌کنیم",
      testimonials: [
        { id: "q1", name: "استیون مک‌فلای", text: "جای فوق‌العاده‌ای برای همه‌ی خانواده! بچه‌هایم عاشق سر زدن به فروشگاه‌اند و هر بار از تنوع اسباب‌بازی‌ها و تخفیف‌ها هیجان‌زده می‌شوند.", image: png("face2") },
        { id: "q2", name: "جسیکا مور", text: "اسباب‌بازی‌ها باکیفیت و بسته‌بندی‌ها عالی بود. سفارشم خیلی سریع رسید و پشتیبانی هم صبورانه جواب داد.", image: png("face5") },
        { id: "q3", name: "جرج جانسون", text: "از دقت فروشنده‌ها در انتخاب اسباب‌بازی مناسب سن بچه‌ام شگفت‌زده شدم. حتماً دوباره خرید می‌کنم.", image: png("face6") },
      ],
      clients: [1, 2, 3, 4, 5].map((n) => ({ id: `cl${n}`, name: ["اسباب‌بازی کوچولو", "فروشگاه نوزاد", "بچه‌ها", "فروشگاه کودک", "بیبی شاپ"][n - 1]!, image: png(`client${n}`) })),
      shop: {
        slides: [
          { id: "s1", title: "حراج بزرگ!", text: "", image: img("s1") },
          { id: "s2", title: "اسباب‌بازی‌های تازه رسید", text: "برای هر سن، با بهترین قیمت", image: img("s2") },
        ],
        trendImage: sampleImage("jn-bear", "png"),
        newTitle: "محصولات ویژه",
        bestTitle: "محبوب‌ترین‌های فروشگاه",
        lookTitle: "بچه‌ها را با بهترین اسباب‌بازی‌ها شادتر می‌کنیم",
        lookText: "بهترین اسباب‌بازی‌ها",
        lookImage: img("band"),
        promoTitle: "در مراقبت از بچه‌ها کنارتان هستیم",
        promoText: "ما فقط اسباب‌بازی نمی‌فروشیم؛ تلاش می‌کنیم بچه‌ها با خیال راحت بازی کنند، یاد بگیرند و شاد باشند.",
        newImage: img("girls"),
        discoverImage: img("bubbles"),
        newsletterTitle: "خبرنامه",
        newsletterText: "با عضویت، قوانین و حریم خصوصی فروشگاه را می‌پذیرید.",
        perks: [
          { id: "f1", title: "تنوع زیاد", text: "بیشترین تنوع اسباب‌بازی", image: img("icon1") },
          { id: "f2", title: "فروشگاه آنلاین", text: "خرید آنلاین، ساده و سریع", image: img("icon2") },
          { id: "f3", title: "ارسال", text: "ارسال سریع و آسان", image: img("icon3") },
          { id: "f4", title: "پشتیبانی", text: "همیشه پاسخگوی شما هستیم", image: img("icon4") },
        ],
        bandItems: ["بهترین قیمت‌ها", "ارسال سریع", "ضمانت خرید", "پشتیبانی آنلاین"],
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "a1", q: "چه روش‌های پرداختی دارید؟", a: "فعلاً پس از ثبت سفارش برای هماهنگی پرداخت (کارت به کارت یا پرداخت در محل) با شما تماس می‌گیریم." },
          { id: "a2", q: "می‌توانم سفارشم را عوض کنم؟", a: "تا وقتی سفارش ارسال نشده، از بخش «حساب من» تیکت بفرستید تا تغییرش بدهیم." },
          { id: "a3", q: "اسباب‌بازی‌ها برای چه سنی مناسب‌اند؟", a: "سن مناسب هر اسباب‌بازی در بخش مشخصات صفحه‌ی همان محصول نوشته شده است." },
          { id: "a4", q: "امکان مرجوع کردن هست؟", a: "بله، کالای سالم و بازنشده تا ۷ روز پس از تحویل پس گرفته می‌شود." },
        ],
        pages: [
          { id: "pg1", slug: "terms", title: "قوانین و مقررات", text: "ثبت سفارش در این فروشگاه به معنی پذیرش این قوانین است.\n\nقیمت‌ها به تومان است و در لحظه‌ی ثبت سفارش ثابت می‌شود." },
          { id: "pg2", slug: "privacy", title: "حریم خصوصی", text: "اطلاعاتی که هنگام خرید وارد می‌کنید فقط برای ارسال سفارش و پشتیبانی استفاده می‌شود." },
        ],
        posts: [
          { id: "n1", title: "۱۰ فروشگاه آنلاین برای لباس و اسباب‌بازی بچه‌ها", image: img("post1"), date: ago(4), author: "تیم جونو", category: "خرید", text: "خرید اینترنتی برای بچه‌ها هر سال راحت‌تر می‌شود. در این نوشته چند نکته برای انتخاب فروشگاه مطمئن و اسباب‌بازی مناسب سن کودک را مرور می‌کنیم.\n\nاول از همه به سن مناسب و جنس اسباب‌بازی دقت کنید؛ بعد به نظر خریدارهای قبلی." },
          { id: "n2", title: "چطور برای تولد کودک یک جشن خلاقانه بگیریم", image: img("post2"), date: ago(11), author: "تیم جونو", category: "سرگرمی", text: "یک جشن تولد کوچک هم می‌تواند به‌یادماندنی باشد. با چند بازی گروهی، تزئینات رنگی و هدیه‌های ساده، روز خاصی برای بچه‌ها بسازید." },
          { id: "n3", title: "اسباب‌بازی‌های چوبی؛ ساده، ماندگار و خلاقانه", image: img("post3"), date: ago(19), author: "تیم جونو", category: "آموزش", text: "اسباب‌بازی‌های چوبی سال‌ها دوام می‌آورند و تخیل بچه‌ها را پرورش می‌دهند. در این نوشته با انواعشان آشنا می‌شویم." },
        ],
        categories: [
          { id: "c1", name: "اسباب‌بازی برقی", image: img("svc1") },
          { id: "c2", name: "عروسک و نمایش", image: img("svc2") },
          { id: "c3", name: "سرگرمی و ساخت", image: img("svc3") },
          { id: "c4", name: "آموزشی", image: "" },
        ],
        products,
        shippingFee: 60000,
        freeShippingFrom: 2000000,
        coupons: [{ id: "d1", code: "JUNO10", percent: 10, maxDiscount: 300000, active: true }],
        paymentNote: "پس از ثبت سفارش، برای هماهنگی پرداخت (کارت به کارت یا پرداخت در محل) با شما تماس می‌گیریم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.jn {
  --jn-navy: #182352;
  --jn-ink: #181D4E;
  --jn-blue: var(--color-primary);
  --jn-green: #2BB24C;
  --jn-yellow: #F3B53B;
  --jn-grey: #F5F6F7;
  --jn-line: #E7E9EE;
  --jn-muted: #6B6F8C;
  --sk-accent: var(--jn-blue);
  --sk-card: #fff;
  --sk-line: var(--jn-line);
  --sk-soft: var(--jn-grey);
  --sk-muted: var(--jn-muted);
  --sk-radius: 22px;
  --sk-card-radius: 18px;
  background: #fff;
  color: var(--jn-ink);
  font-size: 15px;
}
.jn a { color: inherit; text-decoration: none; }
.jn button { font: inherit; color: inherit; cursor: pointer; }
.jn h1, .jn h2, .jn h3, .jn h4, .jn p, .jn figure, .jn blockquote { margin: 0; }
.jn-ico { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.jn-dots-ico { fill: currentColor; stroke: none; }
.jn-wrap { box-sizing: border-box; width: 100%; max-width: 1180px; margin-inline: auto; padding-inline: 20px; }
.jn-act { display: contents; }
.jn-muted { color: var(--jn-muted); }
.jn-grey { background: var(--jn-grey); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.jn-pic { display: block; }
.jn-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* Buttons: pill shape; the colour deepens and a soft shadow lifts it on hover */
.jn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; padding: 0 28px; border: none; border-radius: 999px; font-weight: 700; font-size: 14px; color: #fff !important; transition: transform .3s cubic-bezier(.2, .9, .3, 1.3), box-shadow .3s, background .3s; }
.jn-btn .jn-ico { width: 18px; height: 18px; }
.jn-btn.blue { background: var(--jn-blue); box-shadow: 0 10px 22px -12px var(--jn-blue); }
.jn-btn.green { background: var(--jn-green); box-shadow: 0 10px 22px -12px var(--jn-green); }
.jn-btn.ghost { background: #fff; color: var(--jn-ink) !important; border: 1px solid var(--jn-line); }
.jn-btn.dark { background: var(--jn-navy); }
.jn-btn.small { height: 38px; padding: 0 20px; font-size: 13px; }
.jn-btn.wide, .jn-btn.full { width: 100%; }
.jn-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 26px -14px var(--jn-ink); }
.jn-kicker, .jn-title small { display: block; font-size: 12px; font-weight: 700; color: var(--jn-ink); }
.jn-kicker.light { color: #fff; }

/* Header: centred logo on the home page, logo beside the menu on inner pages */
.jn-head { position: relative; z-index: 30; background: #fff; }
.jn-head-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 92px; border-bottom: 1px solid var(--jn-line); }
.jn-head-top > .jn-icon { justify-self: start; }
.jn-head-call { justify-self: end; display: flex; align-items: center; gap: 26px; }
.jn-phone { font-size: 18px; font-weight: 700; }
.jn-head-row { display: flex; align-items: center; justify-content: space-between; min-height: 64px; }
.jn-head-in { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 92px; }
.jn-head-icons { display: flex; align-items: center; gap: 14px; }
.jn-logo { display: flex; align-items: center; }
.jn-logo img { display: block; height: 52px; width: auto; transition: transform .4s cubic-bezier(.2, .9, .3, 1.4); }
.jn-logo:hover img { transform: rotate(-4deg) scale(1.05); }
.jn-logo b { font-size: 30px; font-weight: 800; color: var(--jn-blue); }
.jn-icon { position: relative; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; transition: background .2s, color .2s; }
.jn-icon:hover { background: var(--jn-grey); color: var(--jn-blue); }
.jn-cart-ico i { position: absolute; top: 3px; inset-inline-end: 1px; min-width: 16px; height: 16px; padding: 0 3px; box-sizing: border-box; border-radius: 8px; background: var(--jn-blue); color: #fff; font-size: 10px; font-style: normal; font-weight: 700; line-height: 16px; text-align: center; }
.jn-nav { display: flex; align-items: center; gap: 28px; font-size: 15px; font-weight: 600; }
.jn-nav > a, .jn-drop > span { position: relative; padding: 6px 0; cursor: pointer; }
.jn-nav > a::after, .jn-drop > span::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; border-radius: 2px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.jn-nav > a:hover::after, .jn-nav > a[aria-current="page"]::after, .jn-drop > span.on::after, .jn-drop:hover > span::after { transform: scaleX(1); }
.jn-nav a[aria-current="page"], .jn-drop > span.on { color: var(--jn-blue); }
.jn-drop { position: relative; outline: none; }
.jn-drop-panel { position: absolute; top: calc(100% + 10px); inset-inline-start: -18px; display: grid; min-width: 190px; padding: 10px; background: #fff; border-radius: 14px; box-shadow: 0 20px 40px -18px rgb(24 35 82 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.jn-drop:hover .jn-drop-panel, .jn-drop:focus-within .jn-drop-panel { opacity: 1; visibility: visible; transform: none; }
.jn-drop-panel a { padding: 9px 12px; border-radius: 8px; font-weight: 500; }
.jn-drop-panel a:hover { background: var(--jn-grey); color: var(--jn-blue); }
.jn-sm-tools { display: none; }

/* Drawer: navy full-height menu sliding in, links arriving one after another */
.jn-drawer summary { list-style: none; cursor: pointer; }
.jn-drawer summary::-webkit-details-marker { display: none; }
.jn-drawer-panel { position: fixed; top: 0; height: 100vh; inset-inline-start: 0; z-index: 90; display: flex; flex-direction: column; gap: 26px; width: min(360px, 88vw); padding: 26px 30px; box-sizing: border-box; background: var(--jn-navy); color: #fff; box-shadow: 0 0 0 100vmax rgb(10 14 40 / .45); animation: jn-drawer .45s cubic-bezier(.2, .9, .3, 1) both; overflow: auto; }
@keyframes jn-drawer { from { transform: translateX(100%); box-shadow: 0 0 0 100vmax rgb(10 14 40 / 0); } }
.jn-drawer-head { display: flex; align-items: center; justify-content: space-between; }
.jn-drawer-head .jn-logo img { height: 40px; }
.jn-drawer-x { display: grid; place-items: center; width: 40px; height: 40px; cursor: pointer; }
.jn-drawer[open] summary { position: fixed; top: 26px; inset-inline-start: calc(min(360px, 88vw) - 70px); z-index: 91; width: 40px; height: 40px; opacity: 0; }
.jn-drawer nav { display: grid; gap: 6px; padding-bottom: 24px; border-bottom: 1px solid rgb(255 255 255 / .15); }
.jn-drawer nav a span { display: inline-flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 22px; font-weight: 600; animation: jn-in .5s calc(.12s + var(--i) * 60ms) cubic-bezier(.2, .9, .3, 1) both; transition: color .2s, gap .25s; }
.jn-drawer nav a span .jn-ico { width: 18px; height: 18px; }
.jn-drawer nav a:hover span, .jn-drawer nav a[aria-current="page"] span { color: var(--jn-blue); gap: 18px; }
@keyframes jn-in { from { opacity: 0; transform: translateX(24px); } }
.jn-drawer-socials { display: flex; gap: 16px; }
.jn-drawer-socials a { color: #fff !important; }

/* Hero slider */
.jn-hero { position: relative; overflow: hidden; background: #F0EFEC; }
.jn-dot { position: absolute; top: 50%; left: 50%; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.jn-slides { display: grid; }
.jn-slide { grid-area: 1 / 1; position: relative; display: grid; align-items: center; height: clamp(380px, 45cqi, 580px); opacity: 0; visibility: hidden; transition: opacity .9s, visibility .9s; }
.jn-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-slides > .jn-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes jn-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.1).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.92).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.jn-n${n} .jn-auto:checked ~ .jn-slides > .jn-slide { animation: jn-cycle${n} ${n * 7}s infinite both; }
${Array.from({ length: n }, (_, k) => `.jn-n${n} .jn-auto:checked ~ .jn-slides > .jn-slide:nth-child(${k + 1}) { animation-delay: ${k * 7 - 0.5}s; }`).join("\n")}`;
  })
  .join("\n")}
.jn-hero:hover .jn-slide, .jn-hero:focus-within .jn-slide { animation-play-state: paused !important; }
.jn-slide-pic { position: absolute; inset: 0; }
.jn-slide-pic img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.06); transition: transform 7s ease-out; }
.jn-slide:only-child .jn-slide-pic img, ${[1, 2, 3, 4, 5].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-slides > .jn-slide:nth-child(${n}) .jn-slide-pic img`).join(", ")} { transform: none; }
/* The speech bubble (or blue blob) that holds the title; it pops in and floats gently */
.jn-say { position: relative; justify-self: center; display: grid; justify-items: center; align-content: center; gap: 12px; width: clamp(250px, 29cqi, 380px); aspect-ratio: 505 / 316; padding: 24px 30px 40px; box-sizing: border-box; text-align: center; translate: 0 calc(clamp(380px, 45cqi, 580px) * .18); animation: jn-float 5s ease-in-out infinite; }
.jn-say::before { content: ""; position: absolute; inset: 0; z-index: -1; background: center / 100% 100% no-repeat; }
.jn-slide.bubble .jn-say::before { background-image: url("${sampleImage("jn-bubble", "png")}"); }
.jn-slide.blob .jn-say::before { background-image: url("${sampleImage("jn-blob", "png")}"); }
.jn-slide.blob .jn-say { color: #fff; aspect-ratio: 522 / 269; }
.jn-say h1, .jn-say h2 { font-size: clamp(24px, 3cqi, 42px); font-weight: 800; line-height: 1.3; }
.jn-say p { font-size: 13px; }
.jn-say .jn-btn { height: 44px; padding: 0 26px; font-size: 14px; }
.jn-slide.blob .jn-say .jn-btn { background: #fff; color: var(--jn-blue) !important; }
.jn-slide .jn-say > * { opacity: 0; transform: scale(.7); transition: opacity .5s .35s, transform .6s .35s cubic-bezier(.2, .9, .3, 1.5); }
.jn-slide:only-child .jn-say > *, ${[1, 2, 3, 4, 5].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-slides > .jn-slide:nth-child(${n}) .jn-say > *`).join(", ")} { opacity: 1; transform: none; }
.jn-auto:checked ~ .jn-slides .jn-say > * { opacity: 1; transform: none; }
@keyframes jn-float { 50% { transform: translateY(-10px) rotate(-1.5deg); } }
.jn-bear { position: absolute; bottom: -6px; inset-inline-end: 8%; z-index: 2; width: clamp(80px, 9cqi, 128px); transform-origin: bottom center; animation: jn-wave 3.2s ease-in-out infinite; }
.jn-bear img { display: block; width: 100%; }
@keyframes jn-wave { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg) translateY(-6px); } }
.jn-dots { position: absolute; bottom: 18px; left: 50%; translate: -50% 0; z-index: 3; display: flex; gap: 8px; }
.jn-dots label { width: 10px; height: 10px; border-radius: 50%; background: rgb(255 255 255 / .6); box-shadow: 0 0 0 1px rgb(0 0 0 / .1); cursor: pointer; transition: width .3s, background .3s; }
${[1, 2, 3, 4, 5].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-dots label:nth-child(${n})`).join(", ")}, .jn-auto:checked ~ .jn-dots label:first-child { width: 26px; border-radius: 5px; background: var(--jn-blue); }

/* Sections and titles */
.jn-sec { padding-block: 80px; }
.jn-title { display: grid; gap: 10px; margin-bottom: 40px; }
.jn-title.center { justify-items: center; text-align: center; }
.jn-title h2, .jn-what-text h2, .jn-clients-head h2, .jn-care-b h2, .jn-team-top h2 { font-size: clamp(28px, 3.3cqi, 44px); font-weight: 800; line-height: 1.35; color: var(--jn-ink); }

/* Product cards: soft rounded tile, the picture zooms and two round buttons rise on hover */
.jn-grid { display: grid; gap: 26px; }
.jn-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.jn-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.jn-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.jn-card { display: grid; justify-items: center; gap: 6px; text-align: center; min-width: 0; }
.jn-card-pic { position: relative; width: 100%; border-radius: 18px; background: #fff; overflow: hidden; transition: box-shadow .4s, transform .4s cubic-bezier(.2, .9, .3, 1.2); }
.jn-grid.soft .jn-card-pic, .jn-grey .jn-grid.soft .jn-card-pic { background: var(--jn-grey); }
.jn-card:hover .jn-card-pic { transform: translateY(-6px); box-shadow: 0 26px 40px -26px rgb(24 35 82 / .45); }
.jn-img { display: grid; place-items: center; aspect-ratio: 1; }
.jn-img img { width: 76%; height: 76%; object-fit: contain; transition: transform .6s cubic-bezier(.2, .9, .3, 1.2); }
.jn-card:hover .jn-img img { transform: scale(1.08) rotate(-2deg); }
.jn-img b { font-size: 40px; color: var(--jn-line); }
.jn-badge { position: absolute; top: 14px; inset-inline-start: 14px; padding: 3px 9px; border-radius: 999px; background: var(--jn-blue); color: #fff; font-size: 11px; font-weight: 700; }
.jn-badge.green { background: var(--jn-green); }
.jn-badge.dark { background: var(--jn-ink); }
.jn-card-acts { position: absolute; bottom: 14px; left: 50%; display: flex; gap: 8px; translate: -50% 0; opacity: 0; transform: translateY(14px); transition: opacity .3s, transform .4s cubic-bezier(.2, .9, .3, 1.4); }
.jn-card:hover .jn-card-acts, .jn-card:focus-within .jn-card-acts { opacity: 1; transform: none; }
.jn-round { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: none; border-radius: 50%; background: #fff; color: var(--jn-ink) !important; box-shadow: 0 8px 18px -10px rgb(24 35 82 / .5); transition: background .2s, color .2s, transform .2s; }
.jn-round .jn-ico { width: 19px; height: 19px; }
.jn-round:hover { transform: scale(1.1); }
.jn-round.blue { background: var(--jn-blue); color: #fff !important; }
.jn-round.on .jn-ico { fill: #E5484D; stroke: #E5484D; }
.jn-card-name { margin-top: 12px; font-size: 16px; font-weight: 700; transition: color .2s; }
.jn-card-name:hover { color: var(--jn-blue); }
.jn-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; color: var(--jn-muted); font-size: 14px; }
.jn-price b, .jn-price s { white-space: nowrap; }
.jn-price b { font-weight: 500; }
.jn-price s { opacity: .7; }

/* What we do */
.jn-what-wrap { padding-block: 20px 40px; }
.jn-what { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; }
.jn-what-pic { position: relative; display: grid; place-items: center; }
.jn-what-pic .jn-pic { position: relative; width: min(100%, 470px); }
.jn-what-pic .jn-pic img { object-fit: contain; }
.jn-blob-bg { position: absolute; width: 74%; aspect-ratio: 1; background: #E9ECEF; border-radius: 52% 48% 41% 59% / 46% 55% 45% 54%; animation: jn-morph 12s ease-in-out infinite; }
.jn-white .jn-blob-bg, .jn-what-wrap:not(.jn-grey) .jn-blob-bg { background: var(--jn-grey); }
@keyframes jn-morph { 33% { border-radius: 41% 59% 55% 45% / 58% 42% 58% 42%; } 66% { border-radius: 60% 40% 48% 52% / 41% 61% 39% 59%; } }
.jn-float { animation: jn-float2 6s ease-in-out infinite; }
@keyframes jn-float2 { 50% { transform: translateY(-14px); } }
.jn-what-text { display: grid; justify-items: start; gap: 18px; }
.jn-what-text p { max-width: 430px; color: var(--jn-muted); line-height: 2; }

/* Photo band */
.jn-photo { position: relative; display: grid; place-items: center; min-height: clamp(340px, 45cqi, 600px); overflow: hidden; isolation: isolate; color: #fff; text-align: center; }
.jn-photo-pic { position: absolute; inset: 0; z-index: -2; }
.jn-photo-pic img { width: 100%; height: 100%; object-fit: cover; animation: jn-zoom 18s ease-in-out infinite alternate; }
@keyframes jn-zoom { to { transform: scale(1.08); } }
.jn-photo::after { content: ""; position: absolute; inset: 0; z-index: -1; background: rgb(16 22 56 / .42); }
.jn-photo-text { display: grid; justify-items: center; gap: 14px; padding: 40px 20px; }
.jn-photo-text small { font-size: 12px; font-weight: 700; }
.jn-photo-text h2 { max-width: 15em; font-size: clamp(26px, 3.4cqi, 46px); font-weight: 800; line-height: 1.35; }

/* Clients */
.jn-clients { padding-block: 80px; }
.jn-clients-head { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; margin-bottom: 44px; }
.jn-clients-head > div { display: grid; gap: 10px; }
.jn-clients-head p { color: var(--jn-muted); line-height: 2; font-size: 14px; }
.jn-logos { display: flex; flex-wrap: wrap; justify-content: space-around; align-items: center; gap: 30px; }
.jn-logos span { display: grid; place-items: center; width: 110px; height: 70px; }
.jn-logos img { max-width: 100%; max-height: 64px; object-fit: contain; transition: transform .4s cubic-bezier(.2, .9, .3, 1.5); }
.jn-logos span:hover img { transform: scale(1.12) rotate(-3deg); }
.jn-logo-add { border: 1px dashed var(--jn-line); border-radius: 12px; color: var(--jn-muted); font-size: 24px; cursor: pointer; }

/* Testimonials beside a photo */
.jn-quotes { display: grid; grid-template-columns: 1fr 1fr; min-height: clamp(460px, 52cqi, 680px); }
.jn-quotes-text { position: relative; display: grid; justify-items: center; align-content: center; gap: 14px; padding: 60px clamp(24px, 6cqi, 90px); background: var(--jn-navy); color: #fff; text-align: center; }
.jn-quotes-text h2 { font-size: clamp(26px, 3cqi, 40px); font-weight: 800; }
.jn-quote-mark { width: 30px; height: 30px; fill: #fff; stroke: none; }
.jn-quote-stack { display: grid; }
.jn-quote { grid-area: 1 / 1; display: grid; justify-items: center; gap: 14px; opacity: 0; visibility: hidden; transform: translateY(12px); transition: opacity .6s, transform .6s, visibility .6s; }
.jn-quote:only-child, ${[1, 2, 3, 4, 5, 6].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-quote-stack .jn-quote:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; transform: none; }
.jn-quote blockquote { max-width: 440px; font-size: 15px; line-height: 2; }
.jn-face { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: #fff; overflow: hidden; color: var(--jn-ink); font-weight: 800; }
.jn-face img { width: 100%; height: 100%; object-fit: cover; }
.jn-quote figcaption { font-weight: 700; }
.jn-qdots { display: flex; gap: 10px; }
.jn-qdots label { width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%; cursor: pointer; transition: background .3s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-qdots label:nth-child(${n})`).join(", ")} { background: var(--jn-blue); border-color: var(--jn-blue); }
.jn-quotes-pic { position: relative; display: block; overflow: hidden; }
.jn-quotes-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.jn-play { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: 74px; height: 74px; translate: -50% -50%; border-radius: 50%; background: #fff; color: var(--jn-ink); }
.jn-play .jn-ico { fill: currentColor; stroke: none; width: 26px; height: 26px; }
.jn-play::before, .jn-play::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid #fff; animation: jn-pulse 2.4s ease-out infinite; }
.jn-play::after { animation-delay: 1.2s; }
@keyframes jn-pulse { from { transform: scale(1); opacity: .9; } to { transform: scale(1.9); opacity: 0; } }

/* Latest news: three picture tiles; the title slides up over a soft veil */
.jn-tiles { display: grid; grid-template-columns: repeat(3, 1fr); }
.jn-tile-in { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.jn-tile-in img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, .9, .3, 1); }
.jn-tile:hover .jn-tile-in img { transform: scale(1.08); }
.jn-tile-text { position: absolute; inset: auto 0 0; display: grid; gap: 6px; padding: 60px 24px 22px; background: linear-gradient(transparent, rgb(16 22 56 / .82)); color: #fff; opacity: 0; transform: translateY(20px); transition: opacity .45s, transform .45s; }
.jn-tile:hover .jn-tile-text, .jn-tile:focus-visible .jn-tile-text { opacity: 1; transform: none; }
.jn-tile-text small { font-size: 12px; opacity: .85; }
.jn-tile-text b { font-size: 17px; line-height: 1.6; }

/* Newsletter: a huge faded word behind a one-line form */
.jn-news { position: relative; overflow: hidden; padding-block: 100px; background: #EEF0F2; }
.jn-news-word { position: absolute; inset: 0; display: grid; place-items: center; font-size: clamp(90px, 16cqi, 230px); font-weight: 900; color: rgb(255 255 255 / .8); line-height: 1; pointer-events: none; white-space: nowrap; }
.jn-news-in { position: relative; display: grid; justify-items: center; gap: 12px; }
.jn-news-form { display: flex; width: min(100%, 560px); border-bottom: 1px solid var(--jn-ink); }
.jn-news-form input { flex: 1; min-width: 0; height: 50px; border: none; background: none; font: inherit; outline: none; }
.jn-news-form button { display: inline-flex; align-items: center; gap: 6px; padding: 0 4px; border: none; background: none; font-weight: 700; }
.jn-news-form button .jn-ico { width: 18px; height: 18px; transition: transform .3s; }
.jn-news-form button:hover .jn-ico { transform: translateY(-3px) rotate(-8deg); }
.jn-news small { color: var(--jn-muted); font-size: 12px; }

/* Footer */
.jn-foot { padding-block: 80px 26px; background: var(--jn-navy); color: #fff; }
.jn-foot h2 { max-width: 13em; margin-bottom: 50px; font-size: clamp(26px, 3cqi, 40px); font-weight: 800; line-height: 1.4; }
.jn-foot-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid rgb(255 255 255 / .14); }
.jn-foot-cols > div { display: grid; align-content: start; gap: 12px; font-size: 14px; }
.jn-foot-cols h4 { margin-bottom: 6px; font-size: 16px; font-weight: 700; }
.jn-foot-cols p { line-height: 1.9; opacity: .85; white-space: pre-line; }
.jn-foot-cols a { opacity: .85; transition: opacity .2s, color .2s; justify-self: start; }
.jn-foot-cols a:hover { opacity: 1; color: var(--jn-blue); }
.jn-u { text-decoration: underline !important; text-underline-offset: 5px; }
.jn-strong { font-weight: 800; opacity: 1 !important; font-size: 16px; }
.jn-foot-socials { display: flex; flex-wrap: wrap; gap: 8px; }
.jn-foot-socials a { width: 38px !important; height: 38px !important; border-radius: 50%; background: rgb(255 255 255 / .08); opacity: 1 !important; }
.jn-foot-socials a:hover { background: var(--jn-blue); color: #fff !important; transform: translateY(-3px); }
.jn-foot-socials .p-ico { width: 16px; height: 16px; }
.jn-foot-end { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 24px; font-size: 13px; opacity: .9; }
.jn-trust { display: flex; gap: 14px; }
.jn-trust a, .jn-trust span { display: contents; }
.jn-trust img { height: 22px; width: auto; filter: brightness(0) invert(1); opacity: .8; }
.jn-top { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: rgb(255 255 255 / .1); transition: background .2s, transform .3s; }
.jn-top:hover { background: var(--jn-blue); transform: translateY(-4px); }

/* Inner pages */
.jn-band { display: grid; justify-items: center; gap: 10px; padding-block: 70px 50px; background: var(--jn-grey); text-align: center; }
.jn-band h1 { font-size: clamp(32px, 3.8cqi, 50px); font-weight: 800; }
.jn-band-arrow { width: 22px; height: 22px; animation: jn-bob 1.8s ease-in-out infinite; }
@keyframes jn-bob { 50% { transform: translateY(6px); } }
.jn-inner { padding-bottom: 70px; }
.jn-inner > .jn-band:first-child, .jn-inner > div > .jn-band:first-child { margin-inline: calc(50% - 50cqi); margin-bottom: 50px; }
.jn-notice { padding: 30px; border-radius: 18px; background: var(--jn-grey); color: var(--jn-muted); text-align: center; }
.jn-box { padding: 26px; border-radius: 22px; background: #fff; box-shadow: 0 20px 40px -32px rgb(24 35 82 / .5); border: 1px solid var(--jn-line); box-sizing: border-box; }

/* Team */
.jn-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; }
.jn-team.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.jn-member { display: grid; gap: 12px; }
.jn-member-pic { display: block; aspect-ratio: 520 / 634; border-radius: 18px; overflow: hidden; cursor: zoom-in; }
.jn-member-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.2, .9, .3, 1); }
.jn-member:hover .jn-member-pic img { transform: scale(1.06); }
.jn-member figcaption { display: grid; gap: 2px; }
.jn-member b { font-size: 16px; }
.jn-member small { color: var(--jn-muted); font-size: 13px; }
.jn-member-add { place-items: center; min-height: 200px; border: 1px dashed var(--jn-line); border-radius: 18px; color: var(--jn-muted); cursor: pointer; }
.jn-team-top { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; padding-block: 70px; }
.jn-team-top > div:first-child { display: grid; gap: 16px; }
.jn-team-top p { color: var(--jn-muted); line-height: 2; }
.jn-bars { display: grid; gap: 26px; }
.jn-bar span { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
.jn-bar i { position: relative; display: block; height: 4px; border-radius: 4px; background: var(--jn-line); overflow: hidden; }
.jn-bar i::after { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: var(--w); border-radius: inherit; background: var(--jn-blue); animation: jn-fill 1.6s .2s cubic-bezier(.2, .9, .3, 1) both; }
@keyframes jn-fill { from { width: 0; } }

/* Care section (about us) with a spinning round badge */
.jn-care { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; padding-block: 90px; }
.jn-care-a { position: relative; align-self: start; }
.jn-care-pic { aspect-ratio: 654 / 624; border-radius: 22px; overflow: hidden; }
.jn-care-b { display: grid; justify-items: start; align-content: start; gap: 18px; }
.jn-care-b p { max-width: 440px; color: var(--jn-muted); line-height: 2; }
.jn-care-pic2 { width: 100%; aspect-ratio: 606 / 450; margin-top: 40px; border-radius: 22px; overflow: hidden; }
.jn-spin { position: absolute; bottom: -40px; inset-inline-end: -40px; width: 130px; height: 130px; }
.jn-spin > svg { width: 100%; height: 100%; animation: jn-rotate 14s linear infinite; font-size: 12px; font-weight: 700; fill: var(--jn-ink); }
.jn-spin i { position: absolute; inset: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--jn-yellow); }
.jn-spin i svg { width: 60%; fill: none; stroke: var(--jn-ink); stroke-width: 3; stroke-linecap: round; }
@keyframes jn-rotate { to { transform: rotate(360deg); } }
.jn-qrow { display: grid; grid-template-columns: 1fr 1.6fr; gap: 50px; align-items: center; }
.jn-qrow-faces { display: flex; gap: 18px; }
.jn-qrow-faces label { display: grid; justify-items: center; gap: 6px; cursor: pointer; opacity: .45; transition: opacity .3s, transform .3s; font-size: 12px; }
.jn-qrow-faces .jn-face { width: 58px; height: 58px; box-shadow: 0 0 0 2px #fff; }
${[1, 2, 3, 4, 5, 6].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-qrow-faces label:nth-child(${n})`).join(", ")}, .jn-qrow-faces label:only-child { opacity: 1; transform: translateY(-4px); }
.jn-qrow-text { display: grid; }
.jn-qrow-text blockquote { grid-area: 1 / 1; font-size: 17px; line-height: 2; opacity: 0; visibility: hidden; transition: opacity .5s, visibility .5s; }
.jn-qrow-text blockquote:only-child, ${[1, 2, 3, 4, 5, 6].map((n) => `.jn-dot:nth-of-type(${n}):checked ~ .jn-qrow-text blockquote:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }

/* Services */
.jn-services { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px; padding-block: 70px; }
.jn-service { display: grid; justify-items: center; gap: 8px; padding: 34px 20px; border-radius: 22px; background: #fff; box-shadow: 0 20px 40px -34px rgb(24 35 82 / .6); text-align: center; transition: transform .4s cubic-bezier(.2, .9, .3, 1.3), box-shadow .4s; }
.jn-service:hover { transform: translateY(-8px); box-shadow: 0 30px 50px -30px rgb(24 35 82 / .5); }
.jn-service-ico { display: grid; place-items: center; width: 90px; height: 90px; margin-bottom: 8px; }
.jn-service-ico img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform .5s cubic-bezier(.2, .9, .3, 1.6); }
.jn-service:hover .jn-service-ico img { transform: scale(1.12) rotate(-6deg); }
.jn-service b { font-size: 16px; }
.jn-service small { color: var(--jn-muted); font-size: 13px; }
.jn-cat { display: grid; gap: 6px; justify-items: center; text-align: center; }
.jn-cat-pic { display: block; width: 100%; aspect-ratio: 528 / 354; border-radius: 18px; overflow: hidden; }
.jn-cat-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s; }
.jn-cat:hover .jn-cat-pic img { transform: scale(1.06); }
.jn-cat b { margin-top: 10px; font-size: 17px; }
.jn-cat small { color: var(--jn-muted); }
.jn-cat > .jn-ico { width: 18px; height: 18px; color: var(--jn-blue); transition: transform .3s; }
.jn-cat:hover > .jn-ico { transform: translateX(-6px); }
.jn-feats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding-block: 40px; border-top: 1px solid var(--jn-line); }
.jn-feats span { display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 14px; }
.jn-feats .jn-ico { width: 28px; height: 28px; color: var(--jn-blue); }

/* Contact */
.jn-contact { display: grid; grid-template-columns: 1fr 1fr; min-height: 560px; }
.jn-contact-pic { position: relative; display: block; overflow: hidden; background: var(--jn-navy); }
.jn-contact-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.jn-contact-form { display: grid; align-content: center; gap: 16px; padding: 60px clamp(24px, 6cqi, 90px); }
.jn-contact-form h1 { font-size: clamp(28px, 3.2cqi, 42px); font-weight: 800; line-height: 1.35; }
.jn-contact-form form { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; margin-top: 10px; }
.jn-contact-form label { display: flex; align-items: flex-start; gap: 10px; border-bottom: 1px solid var(--jn-line); transition: border-color .3s; }
.jn-contact-form label:focus-within { border-color: var(--jn-blue); }
.jn-contact-form label .jn-ico { width: 18px; height: 18px; margin-top: 13px; color: var(--jn-muted); }
.jn-contact-form .full { grid-column: 1 / -1; }
.jn-contact-form input, .jn-contact-form textarea { flex: 1; min-width: 0; padding: 12px 0; border: none; background: none; font: inherit; outline: none; resize: vertical; }
.jn-contact-form .jn-btn { justify-self: start; }
.jn-map { height: 400px; }
.jn-map iframe { width: 100%; height: 100%; border: none; filter: saturate(.85); }
.jn-contact-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 30px; align-items: center; padding-block: 34px; font-size: 14px; }
.jn-contact-row p { white-space: pre-line; color: var(--jn-muted); line-height: 1.9; }
.jn-contact-row > div { display: grid; gap: 4px; color: var(--jn-muted); }
.jn-social-round { display: flex; flex-wrap: wrap; gap: 8px; }
.jn-social-round a { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--jn-grey); transition: background .2s, color .2s; }
.jn-social-round a:hover { background: var(--jn-blue); color: #fff !important; }
.jn-social-round .p-ico { width: 15px; height: 15px; }

/* Questions */
.jn-faq { display: grid; gap: 4px; max-width: 760px; padding-block: 60px 80px; }
.jn-qa { border-bottom: 1px solid var(--jn-line); }
.jn-qa summary { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0; list-style: none; cursor: pointer; font-weight: 700; font-size: 16px; }
.jn-qa summary::-webkit-details-marker { display: none; }
.jn-qa summary i { position: relative; flex: none; width: 14px; height: 14px; }
.jn-qa summary i::before, .jn-qa summary i::after { content: ""; position: absolute; top: 6px; inset-inline: 0; height: 2px; border-radius: 2px; background: currentColor; transition: transform .3s; }
.jn-qa summary i::after { transform: rotate(90deg); }
.jn-qa[open] summary i::after { transform: rotate(0); }
.jn-qa[open] summary { color: var(--jn-blue); }
.jn-qa p { padding-bottom: 22px; color: var(--jn-muted); line-height: 2; animation: jn-open .4s ease both; }
@keyframes jn-open { from { opacity: 0; transform: translateY(-6px); } }
.jn-faq-pic { display: block; height: clamp(260px, 30cqi, 440px); overflow: hidden; }
.jn-faq-pic img { width: 100%; height: 100%; object-fit: cover; }

/* Shop page */
.jn-shop { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 40px; align-items: start; padding-block: 50px 80px; }
.jn-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px; color: var(--jn-muted); font-size: 14px; }
.jn-toolbar a { color: var(--jn-blue); }
.jn-sort { position: relative; }
.jn-sort summary { display: flex; align-items: center; gap: 6px; list-style: none; cursor: pointer; color: var(--jn-ink); }
.jn-sort summary::-webkit-details-marker { display: none; }
.jn-sort summary .jn-ico { width: 16px; height: 16px; }
.jn-sort > div { position: absolute; top: calc(100% + 8px); inset-inline-end: 0; z-index: 20; display: grid; min-width: 170px; padding: 8px; background: #fff; border-radius: 14px; box-shadow: 0 20px 40px -18px rgb(24 35 82 / .35); }
.jn-sort button { width: 100%; padding: 9px 12px; border: none; border-radius: 8px; background: none; text-align: start; }
.jn-sort button:hover, .jn-sort button[aria-current] { background: var(--jn-grey); color: var(--jn-blue); }
.jn-side { position: sticky; top: 20px; display: grid; gap: 0; padding: 28px; border-radius: 22px; background: #fff; box-shadow: 0 24px 50px -36px rgb(24 35 82 / .55); }
.jn-widget { display: grid; gap: 14px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--jn-line); font-size: 14px; }
.jn-side-lg > .jn-widget:last-child, .jn-filter-sm .jn-widget:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.jn-widget h3 { font-size: 17px; font-weight: 700; }
.jn-widget a { color: var(--jn-blue); }
.jn-side-search { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; border: 1px solid var(--jn-line); border-radius: 999px; }
.jn-side-search .jn-ico { width: 17px; height: 17px; color: var(--jn-muted); }
.jn-side-search input { flex: 1; min-width: 0; border: none; background: none; font: inherit; outline: none; }
.jn-cats { display: grid; gap: 10px; margin: 0; padding-inline-start: 18px; }
.jn-cats a { color: var(--jn-ink) !important; transition: color .2s; }
.jn-cats a:hover, .jn-cats a[aria-current="page"] { color: var(--jn-blue) !important; }
.jn-cats small { color: var(--jn-muted); }
.jn-minmax { display: flex; align-items: flex-end; gap: 8px; }
.jn-minmax label { flex: 1; display: grid; gap: 4px; }
.jn-minmax small { color: var(--jn-muted); font-size: 11px; }
.jn-minmax input { width: 100%; height: 40px; box-sizing: border-box; padding: 0 12px; border: 1px solid var(--jn-line); border-radius: 12px; font: inherit; }
.jn-minmax i { padding-bottom: 10px; font-style: normal; }
.jn-range { position: relative; height: 18px; }
.jn-range input { position: absolute; inset: 0; width: 100%; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.jn-range input:first-child { background: linear-gradient(var(--jn-yellow), var(--jn-yellow)) center / 100% 4px no-repeat; }
.jn-range input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--jn-yellow); }
.jn-range input::-moz-range-thumb { width: 14px; height: 14px; border: none; border-radius: 50%; background: var(--jn-yellow); }
.jn-range-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.jn-range-foot small { color: var(--jn-muted); font-size: 12px; }
.jn-range-foot button { height: 38px; padding: 0 22px; border: none; border-radius: 999px; background: var(--jn-blue); color: #fff; font-weight: 700; font-size: 13px; transition: transform .3s; }
.jn-range-foot button:hover { transform: translateY(-2px); }
.jn-checks label { display: flex; align-items: center; gap: 10px; }
.jn-checks input { width: 16px; height: 16px; accent-color: var(--jn-blue); }
.jn-checks .jn-btn { justify-self: start; }
.jn-filter-sm { display: none; }

/* Product page */
.jn-product { display: grid; grid-template-columns: 1.1fr 1fr; gap: 50px; align-items: start; padding-block: 50px; }
.jn-gallery { display: flex; gap: 16px; }
.jn-thumbs { display: grid; align-content: start; gap: 12px; }
.jn-thumb { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px -18px rgb(24 35 82 / .6); cursor: pointer; transition: box-shadow .2s, transform .2s; }
.jn-thumb:hover { transform: translateY(-2px); }
.jn-thumb input { position: absolute; opacity: 0; pointer-events: none; }
.jn-thumb img { width: 78%; height: 78%; object-fit: contain; }
.jn-thumb:has(input:checked) { box-shadow: 0 0 0 2px var(--jn-blue); }
.jn-gallery-main { position: relative; flex: 1; display: grid; border-radius: 22px; background: #fff; box-shadow: 0 24px 50px -36px rgb(24 35 82 / .55); }
.jn-gal { grid-area: 1 / 1; display: grid; place-items: center; aspect-ratio: 1; cursor: zoom-in; }
.jn-gal span { display: contents; }
.jn-gal img { width: 80%; height: 80%; object-fit: contain; transition: transform .6s; }
.jn-gal:hover img { transform: scale(1.04); }
.jn-gallery:has(.jn-thumbs) .jn-gal { visibility: hidden; }
${[1, 2, 3, 4, 5, 6].map((n) => `.jn-gallery:has(.jn-thumb:nth-child(${n}) input:checked) .jn-gal:nth-child(${n})`).join(", ")} { visibility: visible; animation: jn-fade .5s ease both; }
@keyframes jn-fade { from { opacity: 0; } }
.jn-zoom { position: absolute; top: 18px; inset-inline-end: 18px; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--jn-grey); pointer-events: none; }
.jn-zoom .jn-ico { width: 18px; height: 18px; }
.jn-pinfo { display: grid; gap: 16px; align-content: start; }
.jn-pinfo h1 { font-size: clamp(26px, 2.8cqi, 36px); font-weight: 800; }
.jn-pinfo .jn-price { color: var(--jn-blue); font-size: 20px; }
.jn-pinfo .jn-price b { font-weight: 700; }
.jn-pinfo > p { line-height: 2; font-size: 14px; }
.jn-buy { display: grid; gap: 12px; }
.jn-buy-row { display: flex; align-items: center; gap: 12px; }
.jn-qty input { width: 90px; height: 46px; box-sizing: border-box; padding: 0 12px; border: 1px solid var(--jn-line); border-radius: 999px; font: inherit; text-align: center; }
.jn-meta { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; margin: 6px 0 0; font-size: 14px; }
.jn-meta dt { font-weight: 700; }
.jn-meta dd { margin: 0; color: var(--jn-muted); }
.jn-meta a:hover { color: var(--jn-blue); }
.jn-tabs > input { position: absolute; opacity: 0; pointer-events: none; }
.jn-tab-heads { display: flex; gap: 6px; }
.jn-tab-heads label { padding: 14px 30px; border-radius: 16px 16px 0 0; background: #fff; box-shadow: inset 0 -1px var(--jn-line); font-size: 13px; font-weight: 700; cursor: pointer; transition: box-shadow .3s; }
#jn-tab-1:checked ~ .jn-tab-heads label[for="jn-tab-1"], #jn-tab-2:checked ~ .jn-tab-heads label[for="jn-tab-2"] { box-shadow: inset 0 3px var(--jn-ink), 0 10px 30px -24px rgb(24 35 82 / .6); }
.jn-tab { display: none; padding-block: 30px; }
#jn-tab-1:checked ~ .jn-tab-desc, #jn-tab-2:checked ~ .jn-tab-rev { display: grid; gap: 16px; animation: jn-fade .4s ease both; }
.jn-tab-desc p { max-width: 860px; color: var(--jn-muted); line-height: 2; }

/* Blog (Grogin's shape, Juno's look) */
.jn-blog { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 50px; align-items: start; }
.jn-posts { display: grid; gap: 54px; }
.jn-post { display: grid; justify-items: start; gap: 12px; }
.jn-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 840 / 560; border-radius: 22px; overflow: hidden; background: var(--jn-grey); }
.jn-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.jn-post-pic > span { display: contents; }
.jn-post:hover .jn-post-pic img { transform: scale(1.04); }
.jn-post-cat { position: absolute; top: 16px; inset-inline-start: 16px; padding: 4px 12px; border-radius: 999px; background: var(--jn-blue); color: #fff; font-size: 11px; font-style: normal; font-weight: 700; }
.jn-post h2, .jn-post h1 { font-size: clamp(22px, 2.4cqi, 30px); font-weight: 800; line-height: 1.5; }
.jn-post h2:hover { color: var(--jn-blue); }
.jn-post-meta { color: var(--jn-muted); font-size: 13px; }
.jn-post > p { color: var(--jn-muted); line-height: 2; }
.jn-post-text { display: grid; gap: 14px; color: #474B6B; line-height: 2.1; font-size: 16px; }
.jn-blog-side { position: sticky; top: 20px; padding: 28px; border-radius: 22px; background: #fff; box-shadow: 0 24px 50px -36px rgb(24 35 82 / .55); }
.jn-blog-side .jn-widget:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.jn-mini-post { display: flex; align-items: center; gap: 12px; }
.jn-mini-pic { width: 56px; height: 56px; flex: none; border-radius: 14px; overflow: hidden; background: var(--jn-grey); }
.jn-mini-pic img { width: 100%; height: 100%; object-fit: cover; }
.jn-mini-post span:last-child { display: grid; gap: 4px; }
.jn-mini-post b { font-size: 13px; line-height: 1.6; color: var(--jn-ink); }
.jn-mini-post small { color: var(--jn-muted); font-size: 11px; }
.jn-mini-post:hover b { color: var(--jn-blue); }
.jn-social-big { display: flex; flex-wrap: wrap; gap: 8px; }
.jn-social-big a { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--jn-blue); color: #fff !important; }
.jn-social-big .p-ico { width: 16px; height: 16px; }

/* Cart, checkout and the rest */
.jn-empty { display: grid; justify-items: center; gap: 20px; padding-block: 40px 20px; text-align: center; }
.jn-empty-ico { width: 100px; height: 100px; stroke-width: 1.4; color: var(--jn-blue); animation: jn-float2 4s ease-in-out infinite; }
.jn-empty p { color: var(--jn-muted); font-size: 16px; }
.jn-cart { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 26px; align-items: start; }
.jn-lines { padding: 0; }
.jn-line { display: grid; grid-template-columns: 80px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px 22px; border-top: 1px solid var(--jn-line); }
.jn-line:first-child { border-top: none; }
.jn-line-pic img { width: 80px; height: 80px; object-fit: contain; }
.jn-line-info { display: grid; gap: 4px; }
.jn-line-info small { color: var(--jn-muted); }
.jn-stepper { display: flex; align-items: center; gap: 10px; padding: 4px; border: 1px solid var(--jn-line); border-radius: 999px; }
.jn-stepper button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; background: var(--jn-grey); }
.jn-stepper .jn-ico { width: 14px; height: 14px; }
.jn-line-total { min-width: 110px; text-align: end; }
.jn-remove { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: none; border-radius: 50%; background: none; color: var(--jn-muted); }
.jn-remove:hover { color: #E5484D; background: #FEF2F2; }
.jn-sum { display: grid; gap: 14px; }
.jn-sum h2, .jn-checkout h2 { font-size: 18px; font-weight: 800; }
.jn-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: 14px; }
.jn-sum dd { margin: 0; font-weight: 600; }
.jn-sum .total { padding-top: 12px; border-top: 1px solid var(--jn-line); font-size: 16px; font-weight: 800; }
.jn-sum > small { color: var(--jn-green); }
.jn-minus { color: var(--jn-green); }
.jn-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 14px; }
.jn-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.jn-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.jn-checkout h2, .jn-checkout .full, .jn-checkout .jn-error { grid-column: 1 / -1; }
.jn-checkout label { display: grid; gap: 6px; font-size: 14px; }
.jn-checkout input, .jn-checkout textarea { padding: 11px 14px; border: 1px solid var(--jn-line); border-radius: 14px; font: inherit; }
.jn-trap { position: absolute; left: -9999px; }
.jn-error { padding: 10px 14px; border-radius: 12px; background: #FEF2F2; color: #DC2626; }
.jn-pay { padding: 12px 14px; border-radius: 14px; background: var(--jn-grey); font-size: 13px; line-height: 1.8; }
.jn-thanks { display: grid; justify-items: center; gap: 14px; max-width: 520px; margin: 40px auto; text-align: center; }
.jn-done { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; background: #DCFCE7; color: var(--jn-green); animation: jn-pop .6s cubic-bezier(.2, .9, .3, 1.6) both; }
@keyframes jn-pop { from { transform: scale(.3); opacity: 0; } }
.jn-done .jn-ico { width: 32px; height: 32px; stroke-width: 2.4; }
.jn-search { display: flex; align-items: center; height: 54px; border-radius: 999px; background: var(--jn-grey); overflow: hidden; }
.jn-search input { flex: 1; min-width: 0; height: 100%; padding: 0 22px; border: none; background: none; font: inherit; outline: none; }
.jn-search button { display: grid; place-items: center; width: 60px; height: 100%; border: none; background: var(--jn-blue); color: #fff; }
.jn-search-big { max-width: 640px; margin-bottom: 30px; }

/* Reveal on scroll: sections rise and fade in as they enter the screen (browsers with scroll timelines) */
@supports (animation-timeline: view()) {
  .jn-rise { animation: jn-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 70%; }
  @keyframes jn-rise { from { opacity: 0; transform: translateY(38px); } }
  .jn-card.jn-rise { animation-range: entry calc(var(--i, 0) * 4%) entry calc(60% + var(--i, 0) * 6%); }
}

@container (max-width: 1050px) {
  .jn-grid.four, .jn-team.four { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .jn-services { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .jn-foot-cols { grid-template-columns: 1fr 1fr; }
  .jn-shop, .jn-blog { grid-template-columns: 1fr; }
  .jn-side, .jn-blog-side { position: static; }
  .jn-side-lg { display: none; }
  .jn-filter-sm { display: block; }
  .jn-filter-sm summary { padding: 4px 0 16px; list-style: none; cursor: pointer; font-weight: 700; }
  .jn-filter-sm summary::-webkit-details-marker { display: none; }
  .jn-side { order: -1; padding: 18px 22px; }
  .jn-shop > div { order: 1; }
  .jn-cart { grid-template-columns: 1fr; }
}
@container (max-width: 820px) {
  .jn { font-size: 14px; }
  .jn-wrap { padding-inline: 16px; }
  .jn-head-top { grid-template-columns: auto 1fr; min-height: 70px; }
  .jn-head-top .jn-logo { order: -1; }
  .jn-head-top .jn-logo img, .jn-head-in .jn-logo img { height: 42px; }
  .jn-head-call, .jn-head-row, .jn-hide-sm, .jn-head .jn-nav { display: none; }
  .jn-sm-tools { display: flex; justify-self: end; align-items: center; gap: 4px; }
  .jn-head-in { min-height: 70px; }
  .jn-head-icons { gap: 4px; }
  .jn-slide { height: 360px; }
  .jn-say { translate: 0 30px; width: 230px; }
  .jn-slide-pic img { object-position: 35% center; }
  .jn-bear { width: 74px; inset-inline-end: 4%; }
  .jn-sec, .jn-clients { padding-block: 56px; }
  .jn-title { margin-bottom: 28px; }
  .jn-grid { gap: 18px 14px; }
  .jn-grid.four, .jn-grid.three, .jn-grid.two, .jn-team, .jn-team.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .jn-card-acts { opacity: 1; transform: none; bottom: 10px; }
  .jn-round { width: 34px; height: 34px; }
  .jn-card-name { font-size: 14px; margin-top: 8px; }
  .jn-what, .jn-clients-head, .jn-quotes, .jn-care, .jn-qrow, .jn-team-top, .jn-contact, .jn-product, .jn-contact-row { grid-template-columns: 1fr; gap: 30px; }
  .jn-what-text, .jn-care-b { justify-items: center; text-align: center; }
  .jn-what-pic .jn-pic { width: 82%; }
  .jn-quotes-pic { min-height: 280px; }
  .jn-quotes-text { padding: 50px 22px; }
  .jn-tiles { grid-template-columns: 1fr; gap: 12px; }
  .jn-tile-in { aspect-ratio: 16 / 10; border-radius: 18px; }
  .jn-tile-text { opacity: 1; transform: none; }
  .jn-logos { gap: 16px; }
  .jn-logos span { width: 80px; }
  .jn-care { padding-block: 56px; }
  .jn-spin { width: 100px; height: 100px; inset-inline-end: 10px; bottom: -30px; }
  .jn-spin i { inset: 24px; }
  .jn-qrow-faces { justify-content: center; }
  .jn-qrow-text blockquote { text-align: center; }
  .jn-services { gap: 14px; padding-block: 40px; }
  .jn-service { padding: 24px 12px; }
  .jn-service-ico { width: 70px; height: 70px; }
  .jn-feats { grid-template-columns: 1fr 1fr; }
  .jn-contact-pic { min-height: 320px; }
  .jn-contact-form { padding: 40px 18px; }
  .jn-contact-form form { grid-template-columns: 1fr; }
  .jn-map { height: 300px; }
  .jn-gallery { flex-direction: column-reverse; }
  .jn-thumbs { display: flex; }
  .jn-tab-heads label { padding: 12px 18px; }
  .jn-news { padding-block: 50px; }
  .jn-foot { padding-block: 56px 90px; }
  .jn-foot-cols { grid-template-columns: 1fr; gap: 26px; }
  .jn-foot-end { flex-wrap: wrap; }
  .jn-line { grid-template-columns: 64px minmax(0, 1fr) auto; }
  .jn-line-pic img { width: 64px; height: 64px; }
  .jn-line-total { grid-column: 2; text-align: start; min-width: 0; }
  .jn-checkout { grid-template-columns: 1fr; }
  .jn-band { padding-block: 46px 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .jn *, .jn *::before, .jn *::after { animation: none !important; transition: none !important; }
  .jn-auto:checked ~ .jn-slides > .jn-slide:first-child, .jn-auto:checked ~ .jn-slides > .jn-slide:first-child .jn-say > * { opacity: 1; visibility: visible; }
}
`;
