/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Boutique": an online clothing shop. Home page with a hero, categories, product grids, a look
// book, newest trends, customer words and shop perks; plus the shop pages: all products, a
// category, a product, cart, wishlist, search, checkout and the order confirmation.
// The page works without scripts: cart and wishlist buttons are small forms the server answers
// (see apps/api/src/routes/shop.ts); in the editor the preview answers them itself.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Icon, Opt, PageLink, Socials, blockOn, ed, item, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, FilterForm, filterProducts, hasChoices, InfoLinks, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SpecsTable, timeLeft } from "./shopkit";

export const BOUTIQUE_BLOCKS = [
  { key: "announcements", label: "نوار اطلاعیه‌ی بالا" },
  { key: "categories", label: "دسته‌ها و پیشنهاد ویژه" },
  { key: "products", label: "محصولات صفحه‌ی اول" },
  { key: "sale", label: "حراج (کالاهای تخفیف‌دار)" },
  { key: "band", label: "نوار متحرک" },
  { key: "look", label: "بخش «کمد لباست را تازه کن»" },
  { key: "brands", label: "کادرهای دسته‌ها" },
  { key: "trends", label: "جدیدترین‌ها" },
  { key: "testimonials", label: "نظر مشتری‌ها" },
  { key: "perks", label: "مزیت‌های فروشگاه" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());

/** Every page this shop has: the fixed shop pages, one per category and one per product. */
export function boutiquePages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  return ["/", "/shop", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...infoPages(shop)];
}

type BView = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function BoutiqueShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = boutiquePages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: BView = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
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
  else
    body = (
      <div className="bq-wrap">
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className="bq" css={partsCss + shopkitCss + css}>
      {blockOn(ctx.data, "announcements") && <Announcements {...view} />}
      <Header {...view} />
      <main className="bq-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      <Floating />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  // Header icons, drawn like the reference: a shopping bag, a thick magnifier, heart, person.
  bag: "M6.2 7.5h11.6l1.2 13.5H5z M9 10.5V6.8a3 3 0 0 1 6 0v3.7",
  search: "M10.6 3.6a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M15.8 15.8 20.6 20.6 M7.4 9.6a3.4 3.4 0 0 1 3.2-2.9",
  heart: "M12 20.2s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z",
  user: "M12 3.6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4.6 21v-.6a5.2 5.2 0 0 1 5.2-5.2h4.4a5.2 5.2 0 0 1 5.2 5.2v.6z",
  close: "M6 6l12 12M18 6 6 18",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  tag: "M3 12V4h8l10 10-8 8z M8 8.5v.01",
  chat: "M4 5h16v11H9l-5 4z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  store: "M4 10l2-6h12l2 6 M4 10h16v10H4z M9 20v-5h6v5",
  chevron: "M15 5l-7 7 7 7",
  right: "M8.5 3.5 17 12l-8.5 8.5",
  left: "M15.5 3.5 7 12l8.5 8.5",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  bolt: "M13 2 5 13.5h6L10 22l9-12.5h-6z",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2",
  filter: "M4 6h16 M7 12h10 M10 18h4",
};
const PERK_ICONS = ["store", "tag", "chat", "shield"];

function Svg({ name, className = "bq-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

/** The wide three-line menu icon of the reference. */
const MenuLines = () => (
  <svg viewBox="0 0 44 24" className="bq-ico bq-burger-ico" aria-hidden="true">
    <path d="M1 5h42M1 12h42M1 19h42" />
  </svg>
);

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

/** Text that keeps sliding sideways; it stops while the pointer is over it. Two copies make the loop seamless. */
function Marquee({ className, items, edit }: { className: string; items: ReactNode[]; edit?: Record<string, string> }) {
  // Enough repeats that one copy is wider than a large screen.
  const reps = Math.max(2, Math.ceil(6 / Math.max(items.length, 1)));
  const copy = Array.from({ length: reps }, (_, r) => items.map((it, k) => <span key={`${r}-${k}`}>{it}</span>));
  return (
    <div className={`bq-marq ${className}`} {...edit}>
      <div className="bq-marq-track">
        <div className="bq-marq-copy">{copy}</div>
        <div className="bq-marq-copy" aria-hidden="true">
          {copy}
        </div>
      </div>
    </div>
  );
}

const money = (view: BView, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const P = (id: string) => item("site.shop.products", id);

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: BView; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="bq-act">
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

function Price({ view, p }: { view: BView; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="bq-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function ProductCard({ view, p, i = 0 }: { view: BView; p: Product; i?: number }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  return (
    <article className="bq-card" style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="bq-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="bq-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
          </span>
        </PageLink>
        {(p.badge || soldOut) && <span className="bq-badge">{soldOut ? "ناموجود" : p.badge}</span>}
        {!soldOut && onSale(p) && <span className="bq-pct">{fa(percentOff(p))}٪</span>}
        <div className="bq-card-acts">
          <Act view={view} op="wish" id={p.id} className={`bq-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          {!soldOut &&
            (hasChoices(p) ? (
              <PageLink to={productPath(p)} link={view.link} className="bq-round" current={false}>
                <Svg name="bag" />
              </PageLink>
            ) : (
              <Act view={view} op="add" id={p.id} className="bq-round" label="افزودن به سبد خرید">
                <Svg name="bag" />
              </Act>
            ))}
        </div>
      </div>
      <PageLink to={productPath(p)} link={view.link} className="bq-card-name">
        <span>{p.name}</span>
      </PageLink>
      <Price view={view} p={p} />
    </article>
  );
}

/** Time left of a sale, as "۲ روز و ۵ ساعت" (or minutes in its last hour). */
function SaleClock({ p }: { p: Product }) {
  if (!p.saleEndsAt || !onSale(p)) return null;
  const { d, h, m } = timeLeft(p.saleEndsAt);
  const text = d ? `${fa(d)} روز${h ? ` و ${fa(h)} ساعت` : ""}` : h ? `${fa(h)} ساعت${m ? ` و ${fa(m)} دقیقه` : ""}` : `${fa(Math.max(1, m))} دقیقه`;
  return (
    <span className="bq-clock" title="زمان باقی‌مانده تا پایان حراج">
      <Svg name="clock" /> {text} تا پایان حراج
    </span>
  );
}

/** The home page's sale: products with a discount, ending soonest first; hidden when there are none. */
function SaleRow({ view }: { view: BView }) {
  const list = saleProducts(visible(view.shop)).slice(0, 8);
  if (!list.length) return null;
  const top = Math.max(...list.map(percentOff));
  return (
    <section className="bq-sale">
      <div className="bq-wrap">
        <div className="bq-sale-head">
          <div>
            <span className="bq-sale-kicker">تا {fa(top)}٪ تخفیف</span>
            <h2 {...ed("site.shop.discountTitle", "text", "عنوان بخش حراج")}>{view.shop.discountTitle?.trim() || "حراج فصل"}</h2>
          </div>
          <form method="get" action={view.link("/shop")}>
            <input type="hidden" name="sale" value="1" />
            <button type="submit" className="bq-link">
              همه‌ی حراجی‌ها <Svg name="left" />
            </button>
          </form>
        </div>
        <div className="bq-sale-row">
          {list.map((p, k) => (
            <div key={p.id} className="bq-sale-item">
              <ProductCard view={view} p={p} i={k} />
              <SaleClock p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Title({ title, text, path, editKind = "text" }: { title?: string; text?: string; path?: string; editKind?: "text" | "multiline" }) {
  return (
    <div className="bq-title">
      <h2 {...(path ? ed(path, editKind, "عنوان") : {})}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

/** The top of inner pages: a light band with the "home / page" trail and the page name. */
function Banner({ view, title, trail, note }: { view: BView; title: string; trail?: { label: string; to?: string }[]; note?: string }) {
  return (
    <section className="bq-banner">
      <div className="bq-wrap">
        <nav className="bq-trail" aria-label="مسیر صفحه">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          {(trail ?? [{ label: title }]).map((t, k) => (
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
        <h1>
          {title}
          {note && <small>{note}</small>}
        </h1>
      </div>
    </section>
  );
}

function Empty({ view, text }: { view: BView; text: string }) {
  return (
    <div className="bq-wrap bq-empty">
      <p className="bq-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="bq-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Frame: top strip, header, footer ───────────── */

function Announcements({ shop, link }: BView) {
  const items = (shop.announcements ?? []).filter((a) => a.trim());
  if (!items.length) return null;
  return (
    <Marquee
      className="bq-ann"
      edit={ed("site.shop.announcements", "lines", "اطلاعیه‌ها (هر خط یکی)")}
      items={items.map((a) => (
        <>
          {a}{" "}
          <PageLink to="/shop" link={link}>
            خرید کنید
          </PageLink>
          <i aria-hidden="true" />
        </>
      ))}
    />
  );
}

function Header(view: BView) {
  const { ctx, link, visitor, shop, editing } = view;
  const b = ctx.data.basics;
  const count = priceCart(shop, visitor.cart).count;
  const allCats = (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id));
  const cats = allCats.slice(0, 4);
  const wishes = visitor.wishlist.filter((id) => visible(shop).some((p) => p.id === id)).length;
  return (
    <>
      <div className="bq-info bq-wrap">
        <Opt value={ctx.data.site?.tagline} editing={editing} edit={ed("site.tagline", "text", "شعار فروشگاه")}>
          <span {...ed("site.tagline", "text", "شعار فروشگاه")}>{ctx.data.site?.tagline}</span>
        </Opt>
        <PageLink to="/shop" link={link} className="bq-strong">
          مشاهده‌ی محصولات
        </PageLink>
        <span className="bq-info-end">
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
        </span>
      </div>
      <header className="bq-head bq-wrap">
        <PageLink to="/" link={link} className="bq-logo">
          <span {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</span>
          <i>.</i>
        </PageLink>
        <nav className="bq-nav">
          <PageLink to="/" link={link} current={view.page === "/"}>
            خانه
          </PageLink>
          <PageLink to="/shop" link={link} current={view.page === "/shop"}>
            فروشگاه
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
              {c.name}
            </PageLink>
          ))}
        </nav>
        <div className="bq-icons">
          <PageLink to="/cart" link={link} className="bq-icon">
            <Svg name="bag" />
            {count > 0 && <b>{fa(count)}</b>}
            <span className="sr-only">سبد خرید</span>
          </PageLink>
          <PageLink to="/search" link={link} className="bq-icon">
            <Svg name="search" className="bq-ico bq-thick" />
            <span className="sr-only">جست‌وجو</span>
          </PageLink>
          <PageLink to="/wishlist" link={link} className="bq-icon">
            <Svg name="heart" />
            {wishes > 0 && <b>{fa(wishes)}</b>}
            <span className="sr-only">علاقه‌مندی‌ها</span>
          </PageLink>
          <PageLink to="/account" link={link} className="bq-icon">
            <Svg name="user" />
            <span className="sr-only">{visitor.customer ? `حساب ${visitor.customer.name}` : "ورود / ثبت‌نام"}</span>
          </PageLink>
          {/* The menu opens without scripts: a details element whose summary turns into the close button. */}
          <details className="bq-menu">
            <summary className="bq-icon bq-burger" aria-label="منو">
              <MenuLines />
              <Svg name="close" className="bq-ico bq-x" />
            </summary>
            <nav className="bq-drawer">
              <PageLink to="/" link={link} className="bq-logo">
                {b.fullName}
                <i>.</i>
              </PageLink>
              <PageLink to="/" link={link} current={view.page === "/"}>
                خانه
              </PageLink>
              <PageLink to="/shop" link={link} current={view.page === "/shop"}>
                همه‌ی محصولات
              </PageLink>
              {allCats.map((c) => (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
                  {c.name}
                </PageLink>
              ))}
              <hr />
              <PageLink to="/cart" link={link} current={view.page === "/cart"}>
                سبد خرید{count > 0 && ` (${fa(count)})`}
              </PageLink>
              <PageLink to="/wishlist" link={link} current={view.page === "/wishlist"}>
                علاقه‌مندی‌ها
              </PageLink>
              <PageLink to="/search" link={link} current={view.page === "/search"}>
                جست‌وجو
              </PageLink>
              <PageLink to="/support" link={link} current={view.page.startsWith("/support")}>
                پشتیبانی
              </PageLink>
              <PageLink to="/account" link={link} current={view.page === "/account"}>
                حساب من
              </PageLink>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

function Footer({ ctx, link, editing, shop }: BView) {
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const rows: { icon: string; label: string; value?: string; path: string; href?: string }[] = [
    { icon: "pin", label: "نشانی", value: site?.address || b.location, path: "site.address" },
    { icon: "mail", label: "ایمیل", value: b.email, path: "basics.email", href: b.email ? `mailto:${b.email}` : undefined },
    { icon: "phone", label: "تماس", value: b.phone, path: "basics.phone", href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined },
  ];
  return (
    <footer className="bq-foot" id="bq-contact">
      <div className="bq-wrap">
        <PageLink to="/" link={link} className="bq-logo">
          {b.fullName}
          <i>.</i>
        </PageLink>
        <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
          <p className="bq-foot-text" {...ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
            {b.summary}
          </p>
        </Opt>
        <div className="bq-foot-rows">
          {rows.map((r) => (
            <div key={r.path}>
              <span className="bq-circle">
                <Icon name={r.icon} />
              </span>
              <span>
                <small>{r.label}</small>
                <Opt value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
                  {r.href ? (
                    <a href={r.href} dir="auto" {...ed(r.path, "text", r.label)}>
                      {r.value}
                    </a>
                  ) : (
                    <b {...ed(r.path, "text", r.label)}>{r.value}</b>
                  )}
                </Opt>
              </span>
            </div>
          ))}
        </div>
        <nav className="bq-foot-nav">
          <PageLink to="/" link={link}>
            خانه
          </PageLink>
          <PageLink to="/shop" link={link}>
            فروشگاه
          </PageLink>
          <PageLink to="/cart" link={link}>
            سبد خرید
          </PageLink>
          <PageLink to="/wishlist" link={link}>
            علاقه‌مندی‌ها
          </PageLink>
          <InfoLinks shop={shop} link={link} />
        </nav>
        <Socials ctx={ctx} editing={editing} className="bq-foot-socials" />
        <small className="bq-copy">© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
      </div>
    </footer>
  );
}

function Floating() {
  return (
    <div className="bq-float">
      <a href="#" className="bq-top" aria-label="بالای صفحه">
        <Svg name="chevron" />
      </a>
    </div>
  );
}

/* ───────────── Home ───────────── */

/** Home page slider. It works without scripts: hidden radio buttons pick the slide, the arrows are their labels. */
function Hero({ shop, link, editing }: BView) {
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  return (
    <section className={`bq-hero bq-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="bq-hero" id={`bq-hero-${k}`} className="bq-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {/* Checked until an arrow is used: the slides then turn by themselves (paused under the pointer). */}
      {n > 1 && <input type="radio" name="bq-hero" className="bq-dot bq-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="bq-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className="bq-slide">
              <span className="bq-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
              </span>
              <div className="bq-slide-text">
                <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                  <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                </Opt>
                <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "multiline", "متن اسلاید")}>
                  <p {...ed(at(s.id, "text"), "multiline", "متن اسلاید")}>{s.text}</p>
                </Opt>
                <PageLink to="/shop" link={link} className="bq-btn">
                  مشاهده‌ی مجموعه
                </PageLink>
                {n > 1 && (
                  <div className="bq-arrows">
                    <label htmlFor={`bq-hero-${(k + n - 1) % n}`} title="اسلاید قبلی">
                      <Svg name="right" />
                    </label>
                    <label htmlFor={`bq-hero-${(k + 1) % n}`} title="اسلاید بعدی">
                      <Svg name="left" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Look book: a big photo with points on it; picking a point shows that product in the card (no scripts: radio buttons). */
function Look({ view, fallback }: { view: BView; fallback: Product }) {
  const { shop, link, editing } = view;
  const products = visible(shop);
  const spots = (shop.lookSpots ?? [])
    .map((sp) => ({ ...sp, product: products.find((p) => p.id === sp.productId) }))
    .filter((sp): sp is typeof sp & { product: Product } => Boolean(sp.product));
  const cards = spots.length ? spots.map((sp) => sp.product) : [fallback];
  const many = spots.length > 1;
  return (
    <section className="bq-look">
      <div className="bq-look-in">
        <div className="bq-look-text">
          <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "عنوان بخش")}>
            <h2 {...ed("site.shop.lookTitle", "text", "عنوان بخش")}>{shop.lookTitle}</h2>
          </Opt>
          <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "text", "متن زیر عنوان")}>
            <p {...ed("site.shop.lookText", "text", "متن زیر عنوان")}>{shop.lookText}</p>
          </Opt>
          <div className="bq-look-cards">
            {cards.map((p, k) => (
              <PageLink key={`${p.id}-${k}`} to={productPath(p)} link={link} className="bq-look-card" product={p.id}>
                <span className="bq-look-card-pic">{pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}</span>
                <b>{p.name}</b>
                <Price view={view} p={p} />
              </PageLink>
            ))}
          </div>
        </div>
        <div className="bq-look-pic">
          <span className="bq-look-frame">
            <span className="bq-look-img" {...ed("site.shop.lookImage", "image", "عکس بزرگ")}>
              {safeUrl(shop.lookImage) && <img src={safeUrl(shop.lookImage)} alt="" loading="lazy" />}
            </span>
            {many &&
              spots.map((sp, k) => (
                // The radio button sits inside the point itself: picking it never scrolls the page.
                <label key={sp.id} className="bq-spot" style={{ left: `${sp.x}%`, top: `${sp.y}%` }} title={sp.product.name}>
                  <input type="radio" name="bq-look" defaultChecked={k === 0} aria-label={sp.product.name} />
                  <i />
                </label>
              ))}
          </span>
        </div>
      </div>
    </section>
  );
}

function Home(view: BView) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = (shop.categories ?? []).map((c) => ({ ...c, count: products.filter((p) => p.categoryId === c.id).length })).filter((c) => c.count > 0);
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const trendPics = featured.length ? featured : products.slice(0, 3);
  const look = products.find((p) => p.id === shop.lookProductId) ?? products.find((p) => p.featured) ?? products[0];
  const testimonials = (data.site?.testimonials ?? []).filter((t) => !t.hidden);
  // The card with a picture is the first category that has its own picture.
  const picCat = cats.find((c) => safeUrl(c.image)) ?? cats[0];
  const discover = products.filter((p) => !p.featured).slice(0, 6);
  return (
    <>
      <Hero {...view} />

      {on("categories") && cats.length > 0 && (
        <section className="bq-wrap bq-cats">
          <div className="bq-new">
            <span className="bq-cover" {...ed("site.shop.newImage", "image", "عکس کارت تازه‌ها")}>
              {safeUrl(shop.newImage) && <img src={safeUrl(shop.newImage)} alt="" loading="lazy" />}
            </span>
            <div className="bq-new-text">
              <Opt value={shop.newTitle} editing={editing} edit={ed("site.shop.newTitle", "text", "عنوان کارت")}>
                <h2 {...ed("site.shop.newTitle", "text", "عنوان کارت")}>{shop.newTitle}</h2>
              </Opt>
              <Opt value={shop.newText} editing={editing} edit={ed("site.shop.newText", "multiline", "متن کارت")}>
                <p {...ed("site.shop.newText", "multiline", "متن کارت")}>{shop.newText}</p>
              </Opt>
              <ul className="bq-dots">
                {cats.map((c) => (
                  <li key={c.id}>
                    <PageLink to={`/category/${c.id}`} link={link}>
                      <span {...ed(`${item("site.shop.categories", c.id)}.name`, "text", "نام دسته")}>{c.name}</span>
                      <sup>{fa(c.count)}</sup>
                    </PageLink>
                  </li>
                ))}
              </ul>
              <PageLink to="/shop" link={link} className="bq-btn">
                مشاهده‌ی همه‌ی مجموعه‌ها
              </PageLink>
            </div>
          </div>
          <div className="bq-cats-side">
            <div className="bq-promo">
              <small>
                <Svg name="bolt" className="bq-ico bq-bolt" /> پیشنهاد ویژه
              </small>
              <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "متن پیشنهاد ویژه")}>
                <h3 {...ed("site.shop.promoTitle", "text", "متن پیشنهاد ویژه")}>{shop.promoTitle}</h3>
              </Opt>
              <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "توضیح پیشنهاد")}>
                <p {...ed("site.shop.promoText", "text", "توضیح پیشنهاد")}>{shop.promoText}</p>
              </Opt>
              <PageLink to="/shop" link={link} className="bq-promo-logo">
                <b>{data.basics.fullName}</b>
                <i aria-hidden="true" />
              </PageLink>
              <span className="bq-promo-mark" aria-hidden="true">
                {data.basics.fullName}
              </span>
            </div>
            {picCat && (
              <PageLink to={`/category/${picCat.id}`} link={link} className="bq-picard">
                <span className="bq-cover" {...ed(`${item("site.shop.categories", picCat.id)}.image`, "image", "عکس دسته")}>
                  {safeUrl(picCat.image) && <img src={safeUrl(picCat.image)} alt="" loading="lazy" />}
                </span>
                <span className="bq-picard-text">
                  <h3>{picCat.name}</h3>
                  <small>(+{fa(picCat.count)} محصول متنوع)</small>
                </span>
              </PageLink>
            )}
            <div className="bq-discover">
              <span className="bq-discover-pic" {...ed("site.shop.discoverImage", "image", "عکس کارت")}>
                {safeUrl(shop.discoverImage) && <img src={safeUrl(shop.discoverImage)} alt="" loading="lazy" />}
              </span>
              <div className="bq-discover-text">
                <Opt value={shop.discoverTitle} editing={editing} edit={ed("site.shop.discoverTitle", "text", "عنوان کارت")}>
                  <h3 {...ed("site.shop.discoverTitle", "text", "عنوان کارت")}>{shop.discoverTitle}</h3>
                </Opt>
                <ul className="bq-dots two">
                  {(discover.length ? discover : products.slice(0, 6)).map((p) => (
                    <li key={p.id}>
                      <PageLink to={productPath(p)} link={link}>
                        {p.name}
                      </PageLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {on("products") && products.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="لباس‌های روزمره" text="تکه‌هایی که هر روز می‌پوشید؛ راحت، شیک و با قیمت منصفانه." />
          <div className="bq-grid">
            {products.slice(0, 8).map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("sale") && <SaleRow view={view} />}

      {on("band") && (shop.bandItems ?? []).some((t) => t.trim()) && (
        <Marquee
          className="bq-band"
          edit={ed("site.shop.bandItems", "lines", "متن‌های نوار متحرک (هر خط یکی)")}
          items={(shop.bandItems ?? [])
            .filter((t) => t.trim())
            .map((t) => (
              <>
                {t}
                <i aria-hidden="true">◐</i>
              </>
            ))}
        />
      )}

      {on("look") && look && <Look view={view} fallback={look} />}

      {on("brands") && cats.length > 0 && (
        <section className="bq-wrap bq-brands">
          {cats.slice(0, 3).map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
              <b>{c.name}</b>
              <small>({new Intl.NumberFormat("fa-IR").format(c.count)} محصول)</small>
            </PageLink>
          ))}
        </section>
      )}

      {on("trends") && trendPics.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="جدیدترین‌ها" text="تازه‌ترین انتخاب‌های این فصل را از دست ندهید." />
          <div className="bq-trends">
            <span className="bq-trends-pic" {...ed("site.shop.trendImage", "image", "عکس جدیدترین‌ها")}>
              {safeUrl(shop.trendImage) && <img src={safeUrl(shop.trendImage)} alt="" loading="lazy" />}
            </span>
            <div className="bq-trends-list">
              {trendPics.map((p) => (
                <div key={p.id} className="bq-row">
                  <PageLink to={productPath(p)} link={view.link} className="bq-row-pic">
                    <span>{pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}</span>
                  </PageLink>
                  <div>
                    <PageLink to={productPath(p)} link={view.link} className="bq-row-name">
                      <span>{p.name}</span>
                    </PageLink>
                    <Price view={view} p={p} />
                  </div>
                  <PageLink to={productPath(p)} link={view.link} className="bq-under">
                    انتخاب گزینه‌ها
                  </PageLink>
                </div>
              ))}
              <PageLink to="/shop" link={link} className="bq-bar">
                همه‌ی جدیدترین‌ها را ببینید
              </PageLink>
            </div>
          </div>
        </section>
      )}

      {on("testimonials") && testimonials.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="مشتری‌ها چه می‌گویند" text="نظر چند نفر از کسانی که از ما خرید کرده‌اند." />
          <div className="bq-quotes">
            {testimonials.slice(0, 2).map((t, k) => {
              const at = item("site.testimonials", t.id);
              const prod = products[(k * 3 + 2) % Math.max(products.length, 1)];
              return (
                <div key={t.id} className="bq-quote">
                  <div className="bq-quote-box">
                    <span className="bq-stars" aria-label="۵ ستاره">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Svg key={s} name="star" className="bq-star" />
                      ))}
                    </span>
                    <Opt value={t.role} editing={editing} edit={ed(`${at}.role`, "text", "عنوان نظر")}>
                      <h3 {...ed(`${at}.role`, "text", "عنوان نظر")}>«{t.role}»</h3>
                    </Opt>
                    <p {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</p>
                    <b {...ed(`${at}.name`, "text", "نام مشتری")}>– {t.name}</b>
                  </div>
                  {prod && (
                    <PageLink to={productPath(prod)} link={link} className="bq-mini">
                      <span>{pic(prod) && <img src={pic(prod)} alt="" loading="lazy" />}</span>
                      <span>
                        <b>{prod.name}</b>
                        <Price view={view} p={prod} />
                      </span>
                    </PageLink>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {on("perks") && (shop.perks ?? []).length > 0 && (
        <section className="bq-wrap bq-perks">
          {(shop.perks ?? []).map((x, k) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id}>
                <span className="bq-perk-ico">
                  <Svg name={PERK_ICONS[k % 4]!} />
                </span>
                <h3 {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</h3>
                <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح")}>
                  <p {...ed(`${at}.text`, "text", "توضیح")}>{x.text}</p>
                </Opt>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

/* ───────────── All products / a category ───────────── */

function Listing(view: BView & { categoryId?: string }) {
  const { shop, link, categoryId, visitor } = view;
  const { list, cats, cat, active } = filterProducts(visible(shop), shop.categories ?? [], visitor.query, categoryId);
  const title = cat?.name ?? "فروشگاه";
  const here = categoryId ? `/category/${categoryId}` : "/shop";
  return (
    <>
      <Banner view={view} title={title} trail={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : undefined} note={`${fa(list.length)} محصول`} />
      <section className="bq-wrap bq-plp">
        <div className="bq-plp-bar">
        <nav className="bq-chips" aria-label="دسته‌ها">
          <PageLink to="/shop" link={link} current={!cat}>
            همه
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
              {c.name}
            </PageLink>
          ))}
        </nav>
        <Filters view={view} here={here} cats={cats} fixedCategory={Boolean(categoryId)} active={active} count={list.length} />
        </div>
        {list.length ? (
          <div className="bq-grid">
            {list.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        ) : (
          <p className="bq-notice">{active ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
        )}
      </section>
    </>
  );
}

/** The "filter and sort" bar: opens a panel with the shared filter form (no script). */
function Filters({ view, here, cats, fixedCategory, active, count }: { view: BView; here: string; cats: Shop["categories"]; fixedCategory?: boolean; active: boolean; count: number }) {
  return (
    <details className="bq-filter" open={active || undefined}>
      <summary>
        <span>
          <Svg name="filter" /> فیلتر و مرتب‌سازی{active && <i className="bq-filter-on" aria-label="فیلتر فعال است" />}
        </span>
        <small>{fa(count)} محصول</small>
      </summary>
      <FilterForm link={view.link} here={here} query={view.visitor.query} cats={cats} fixedCategory={fixedCategory} className="bq-filter-form" submitClass="bq-btn" resetClass="bq-link" />
    </details>
  );
}

/* ───────────── Product ───────────── */

function ProductPage(view: BView & { id: string }) {
  const { shop, link, visitor, editing } = view;
  const p = visible(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = visible(shop)
    .filter((x) => x.id !== p.id && (!cat || x.categoryId === cat.id))
    .slice(0, 4);
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  return (
    <>
      <section className="bq-wrap bq-product" data-product={p.id}>
        <div className="bq-gallery">
          {(imgs.length ? imgs : [undefined]).map((src, k) =>
            src ? (
              <ZoomOpen key={k} id={`${p.id}-${k}`} className={`bq-gal${k === 0 ? " first" : ""}`}>
                <span>
                  <img src={src} alt={p.name} />
                </span>
              </ZoomOpen>
            ) : (
              <span key={k} className="bq-gal first" />
            ),
          )}
        </div>
        <div className="bq-info-col">
          <nav className="bq-trail dark">
            <PageLink to="/" link={link}>
              خانه
            </PageLink>
            <i>/</i>
            <PageLink to={cat ? `/category/${cat.id}` : "/shop"} link={link}>
              {cat?.name ?? "فروشگاه"}
            </PageLink>
          </nav>
          <h1>{p.name}</h1>
          <Price view={view} p={p} />
          {onSale(p) && p.stock !== 0 && (
            <span className="bq-save">
              <b>{fa(percentOff(p))}٪ تخفیف</b> · {money(view, p.price - unitPrice(p))} صرفه‌جویی
            </span>
          )}
          <SaleClock p={p} />
          {p.description && (
            <p className="bq-desc">
              {p.description}
            </p>
          )}
          {soldOut ? (
            <p className="bq-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="bq-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value="/cart" />
              <OptionPicker p={p} />
              <div className="bq-buy-row">
                <label className="bq-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" className="bq-btn">
                  افزودن به سبد خرید
                </button>
              </div>
            </form>
          )}
          <Act view={view} op="wish" id={p.id} className="bq-under" label="علاقه‌مندی">
            <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
          </Act>
          <ul className="bq-assure">
            <li>
              <Svg name="truck" /> ارسال به سراسر کشور
            </li>
            <li>
              <Svg name="shield" /> ضمانت اصل بودن کالا
            </li>
          </ul>
        </div>
      </section>
      <section className="bq-wrap bq-sec bq-about">
        <SpecsTable p={p} className="bq-specs" />
        <Reviews p={p} link={link} page={view.page} visitor={visitor} />
      </section>
      {related.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="محصولات مشابه" />
          <div className="bq-grid">
            {related.map((x, k) => (
              <ProductCard key={x.id} view={view} p={x} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Cart, wishlist, search ───────────── */

function Cart(view: BView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <>
      <Banner view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="bq-wrap bq-cart">
          <div className="bq-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="bq-line">
                <PageLink to={productPath(l.product)} link={link} className="bq-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="bq-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && <small>سایز: {l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="bq-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{new Intl.NumberFormat("fa-IR").format(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="bq-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="bq-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="bq-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="bq-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? (
              <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small>
            ) : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="bq-btn wide">
              ادامه و ثبت سفارش
            </PageLink>
          </aside>
        </section>
      )}
    </>
  );
}

function Wishlist(view: BView) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <>
      <Banner view={view} title="علاقه‌مندی‌ها" />
      {items.length === 0 ? (
        <>
          <h2 className="bq-wrap bq-big">فهرست علاقه‌مندی‌ها</h2>
          <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
        </>
      ) : (
        <section className="bq-wrap bq-sec">
          <h2 className="bq-big">فهرست علاقه‌مندی‌ها</h2>
          <div className="bq-grid">
            {items.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Search(view: BView) {
  const q = (view.visitor.query.q ?? "").trim();
  const { list: found, cats, active } = filterProducts(visible(view.shop), view.shop.categories ?? [], view.visitor.query);
  const words = active ? [q || " "] : [];
  return (
    <section className="bq-wrap bq-search">
      <form method="get" action={view.link("/search")} className="bq-search-box">
        <input name="q" defaultValue={q} placeholder="چه چیزی می‌خواهید؟" aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <Filters view={view} here="/search" cats={cats} active={active} count={found.length} />
      {words.length > 0 &&
        (found.length ? (
          <div className="bq-grid">
            {found.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        ) : (
          <p className="bq-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
        ))}
    </section>
  );
}

/* ───────────── Checkout and confirmation ───────────── */

function Checkout(view: BView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const error = visitor.query.error;
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  if (cart.lines.length === 0)
    return (
      <>
        <Banner view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </>
    );
  return (
    <>
      <Banner view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <section className="bq-wrap bq-cart">
        <form method="post" action={link("/_order")} className="bq-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="bq-error">{error}</p>}
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
          <input name="website" tabIndex={-1} autoComplete="off" className="bq-trap" aria-hidden="true" />
          <button type="submit" className="bq-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="bq-sum">
          <h2>سفارش شما</h2>
          <ul className="bq-sum-lines">
            {cart.lines.map((l) => (
              <li key={l.id + (l.size ?? "")}>
                <span>
                  {l.product.name}
                  {l.size && ` (${l.size})`} × {new Intl.NumberFormat("fa-IR").format(l.qty)}
                </span>
                <b>{money(view, l.total)}</b>
              </li>
            ))}
          </ul>
          <dl>
            {cart.discount > 0 && (
              <>
                <dt>کد تخفیف «{cart.coupon}»</dt>
                <dd className="bq-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && <p className="bq-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>{shop.paymentNote}</p>}
        </aside>
      </section>
    </>
  );
}

function Account(view: BView) {
  return (
    <>
      <Banner view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <section className="bq-wrap bq-sec">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: BView) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <>
      <Banner view={view} title="سفارش ثبت شد" />
      <section className="bq-wrap bq-thanks">
        <span className="bq-check" aria-hidden="true">
          ✓
        </span>
        <h2>ممنون از خرید شما!</h2>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="bq-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="bq-btn">
          بازگشت به فروشگاه
        </PageLink>
      </section>
    </>
  );
}

/* ───────────── Example content ───────────── */

export function boutiqueSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`shop-${n}`);
  const cats = [
    { id: "c1", name: "کت و کاپشن" },
    { id: "c2", name: "تاپ و بلوز" },
    { id: "c3", name: "دامن و شلوار" },
    { id: "c4", name: "لباس مجلسی" },
    { id: "c5", name: "کیف و کفش" },
  ];
  const d = "پارچه‌ی باکیفیت، دوخت تمیز و قالب استاندارد. برای انتخاب سایز، جدول سایز را در توضیحات ببینید یا از ما بپرسید.";
  const products: Product[] = [
    {
      id: "s1",
      name: "کت جلیقه‌ای کمربنددار",
      categoryId: "c1",
      price: 2450000,
      salePrice: 1890000,
      // The sample's sale runs a few days from whenever the sample is made.
      saleEndsAt: new Date(Date.now() + 3 * 86400000 + 5 * 3600000).toISOString(),
      badge: "حراج",
      sizes: ["S", "M", "L"],
      images: [img("p1")],
      description: d,
      specs: [
        { label: "جنس", value: "پشم و پلی‌استر" },
        { label: "آستر", value: "ساتن" },
        { label: "کشور سازنده", value: "ایران" },
        { label: "نگهداری", value: "خشک‌شویی" },
      ],
    },
    { id: "s2", name: "پیراهن کوتاه سرمه‌ای", categoryId: "c4", price: 1980000, salePrice: 1490000, badge: "حراج", sizes: ["S", "M", "L"], images: [img("p2")], description: d },
    { id: "s3", name: "سرهمی براق مهمانی", categoryId: "c4", price: 2650000, sizes: ["S", "M"], images: [img("p3")], description: d },
    { id: "s4", name: "تاپ مشکی و ژاکت", categoryId: "c2", price: 1350000, images: [img("p4")], description: d },
    { id: "s5", name: "پالتو خزدار کرم", categoryId: "c1", price: 4200000, badge: "جدید", sizes: ["M", "L", "XL"], images: [img("p5")], description: d },
    { id: "s6", name: "تاپ کبریتی کرم", categoryId: "c2", price: 690000, images: [img("p6")], description: d },
    { id: "s7", name: "کت تک بژ", categoryId: "c1", price: 3100000, sizes: ["S", "M", "L"], images: [img("p11"), img("p7")], description: d },
    { id: "s8", name: "دامن جین کلوش", categoryId: "c3", price: 980000, featured: true, images: [img("p8")], description: d },
    { id: "s9", name: "بوت چرم قهوه‌ای", categoryId: "c5", price: 2900000, featured: true, sizes: ["37", "38", "39", "40"], images: [img("p9")], description: d },
    { id: "s10", name: "کت جین کلاسیک", categoryId: "c1", price: 1750000, featured: true, images: [img("p10")], description: d },
    { id: "s11", name: "ست کت و شلوار بژ", categoryId: "c1", price: 4850000, salePrice: 4390000, sizes: ["S", "M", "L"], images: [img("p7"), img("p11")], description: d },
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "کوشا",
      jobTitle: "فروشگاه لباس زنانه",
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان ولیعصر، پلاک ۵۸",
      summary: "لباس‌های روزمره و مجلسی زنانه با دوخت خوب و قیمت منصفانه؛ ارسال سریع به سراسر کشور.",
      links: [
        { id: "bl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "bl2", type: "telegram", url: "https://t.me/example" },
        { id: "bl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "bl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "bl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      gallery: [],
      tagline: "استایل‌های ضروری با قیمت‌های استثنایی",
      accentImage: img("banner"),
      address: "تهران، خیابان ولیعصر، پلاک ۵۸",
      testimonials: [
        { id: "bt1", name: "لیلا، شیراز", role: "خوش‌دوخت و زیبا", text: "جنس پارچه دقیقاً همان بود که در عکس دیدم و سایزش هم کاملاً اندازه شد. بسته‌بندی هم خیلی مرتب بود." },
        { id: "bt2", name: "سارا، تبریز", role: "حتماً پیشنهادش می‌کنم", text: "دو روزه به دستم رسید و وقتی سؤالی داشتم خیلی زود جواب دادند. باز هم از همین فروشگاه خرید می‌کنم." },
      ],
      shop: {
        categories: cats.map((c) => ({ ...c, image: c.id === "c5" ? img("bag") : "" })),
        products,
        announcements: ["تا ۴۰٪ تخفیف تابستانه", "ارسال رایگان خریدهای بالای ۲ میلیون تومان", "حراج ویژه‌ی ۲۴ ساعته"],
        slides: [
          { id: "h1", title: "استایل‌های امروزی برای خانم‌های خوش‌پوش", text: "مجموعه‌ی تازه‌ی فصل با رنگ‌های ملایم و طراحی ساده؛ برای کار، دورهمی و هر روز.", image: img("p3") },
          { id: "h2", title: "لباس‌های مجلسی که دیده می‌شوند", text: "پیراهن‌ها و سرهمی‌های تازه برای شب‌های خاص؛ با دوخت تمیز و پارچه‌ی خوش‌دست.", image: img("p2") },
          { id: "h3", title: "گرم و شیک در روزهای سرد", text: "پالتوها و کت‌های پاییزی را ببینید؛ ارسال رایگان برای خریدهای بالای ۲ میلیون تومان.", image: img("p5") },
        ],
        newTitle: "تازه‌ها",
        newText: "هر هفته لباس‌های تازه به فروشگاه اضافه می‌شود؛ دسته‌ی دلخواهتان را انتخاب کنید.",
        newImage: img("arrivals"),
        discoverTitle: "پوشاک زنانه را کشف کنید",
        discoverImage: img("p6"),
        promoTitle: "۱۵٪ تخفیف ویژه‌ی تعطیلات را همین امروز بگیرید",
        lookTitle: "کمد لباست را تازه کن",
        lookText: "یک ترکیب آماده برای روزهای کاری و دورهمی‌ها.",
        lookImage: img("look"),
        lookProductId: "s7",
        lookSpots: [
          { id: "k1", productId: "s7", x: 32, y: 37.5 },
          { id: "k2", productId: "s11", x: 48.5, y: 67.7 },
        ],
        trendImage: img("trend"),
        bandItems: ["استایل برای هر سفر", "خوش‌پوش، بدون زحمت", "استایل مناسب خودت را پیدا کن"],
        perks: [
          { id: "k1", title: "تحویل حضوری", text: "سفارش را از فروشگاه تحویل بگیرید." },
          { id: "k2", title: "قیمت منصفانه", text: "کیفیت خوب با قیمتی که ارزشش را دارد." },
          { id: "k3", title: "پشتیبانی همه‌روزه", text: "هر روز هفته پاسخگوی سؤال‌های شما هستیم." },
          { id: "k4", title: "خرید مطمئن", text: "تا ۷ روز امکان تعویض کالا." },
        ],
        shippingFee: 80000,
        freeShippingFrom: 2000000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش، با شما تماس می‌گیریم و شماره‌ی کارت را اعلام می‌کنیم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.bq { --bq-ink: var(--color-text); --bq-line: var(--color-line); --bq-dark: #0B0B0C; --sk-accent: var(--bq-dark); --sk-card: var(--color-bg); --sk-line: var(--bq-line); --sk-soft: var(--bq-soft); --sk-muted: var(--color-muted); --sk-card-radius: 0; --bq-red: var(--color-primary); --bq-soft: color-mix(in srgb, var(--color-text) 5%, var(--color-bg)); --bq-wrap: min(1480px, 100% - 2 * clamp(14px, 3cqi, 44px));
  background: var(--color-bg); color: var(--color-text); min-height: 100%; }
.bq a { color: inherit; }
.bq button { font: inherit; color: inherit; }
.bq .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.bq-wrap { width: var(--bq-wrap); margin-inline: auto; }
.bq-ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.bq-act { display: contents; }
.bq-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--bq-dark); color: #fff !important; font-weight: 700; font-size: .92em; cursor: pointer; transition: transform .2s, background .2s; }
.bq-btn:hover { background: var(--bq-red); transform: translateY(-2px); }
.bq-btn.wide, .bq-btn.full { width: 100%; }
.bq-under { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: none; text-decoration: underline; text-underline-offset: 5px; font-size: .86em; cursor: pointer; }
.bq-notice { padding: 22px 30px; border-top: 3px solid var(--bq-red); background: var(--color-soft); }
.bq-error { padding: 12px 16px; border-radius: 10px; background: color-mix(in srgb, #E5484D 12%, var(--color-bg)); color: #C62A2F; }
.bq-sec { padding-block: clamp(40px, 6cqi, 80px); }
.bq-title { display: grid; justify-items: center; gap: 10px; margin-bottom: clamp(24px, 4cqi, 44px); text-align: center; }
.bq-title h2 { font-size: clamp(1.7em, 3.6cqi, 2.5em); font-weight: 600; }
.bq-title p { max-width: 34em; color: var(--color-muted); line-height: 1.9; }

/* Sliding text (top strip and the dark band); it stops under the pointer */
.bq-marq { overflow: hidden; direction: ltr; }
.bq-marq-track { display: flex; width: max-content; animation: bq-marq var(--bq-speed, 50s) linear infinite; }
.bq-marq:hover .bq-marq-track, .bq-marq:focus-within .bq-marq-track { animation-play-state: paused; }
.bq-marq-copy { display: flex; flex: none; }
.bq-marq-copy > span { display: inline-flex; align-items: center; direction: rtl; white-space: nowrap; }
/* Persian reads right to left, so the text moves to the right. */
@keyframes bq-marq { from { transform: translateX(-50%); } to { transform: none; } }

/* Top strip, info line and header */
.bq-ann { --bq-speed: 45s; padding: 10px 0; background: var(--bq-dark); color: #E7E7E7; font-size: .86em; }
.bq-ann .bq-marq-copy > span { gap: 8px; }
.bq-ann a { color: #fff; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
.bq-ann i { width: 60px; height: 1px; margin-inline: 36px; background: #5A5A5A; }
.bq-info { display: flex; align-items: center; justify-content: center; gap: 10px 14px; flex-wrap: wrap; padding: 12px 0; border-bottom: 1px solid var(--bq-line); color: var(--color-muted); font-size: .9em; }
.bq-strong { color: var(--bq-ink); font-weight: 600; }
.bq-info-end { margin-inline-start: auto; display: flex; gap: 20px; color: var(--bq-ink); }
.bq-head { display: flex; align-items: center; gap: 24px; padding: 22px 0; }
.bq-logo { font-size: 2.3em; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.bq-logo i { font-style: normal; color: var(--bq-red); }
.bq-nav { display: flex; gap: clamp(14px, 2.4cqi, 30px); margin-inline: auto; font-weight: 500; }
.bq-nav a { position: relative; padding: 6px 0; }
.bq-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; background: var(--bq-red); transform: scaleX(0); transition: transform .25s; }
.bq-nav a:hover::after, .bq-nav a[aria-current="page"]::after { transform: none; }
.bq-icons { display: flex; align-items: center; gap: clamp(14px, 1.8cqi, 26px); }
.bq-icon { position: relative; display: grid; place-items: center; height: 34px; min-width: 30px; cursor: pointer; }
.bq-icon .bq-ico { width: 27px; height: 27px; stroke-width: 1.8; }
.bq-icon .bq-thick { stroke-width: 2.4; }
.bq-icon b { position: absolute; top: -5px; inset-inline-end: -8px; min-width: 19px; height: 19px; padding: 0 5px; display: grid; place-items: center; border-radius: 999px; background: var(--bq-red); color: #fff; font-size: 11px; font-weight: 700; line-height: 1; }
.bq-icon:hover { color: var(--bq-red); }
.bq-menu > summary { list-style: none; }
.bq-menu > summary::-webkit-details-marker { display: none; }
.bq-burger .bq-burger-ico { width: 50px; height: 26px; stroke-width: 1.5; }
.bq-burger .bq-x { display: none; }
.bq-menu[open] > summary { position: fixed; top: 22px; inset-inline-start: 22px; z-index: 102; width: 44px; height: 44px; border-radius: 50%; background: var(--bq-red); color: #fff; }
.bq-menu[open] .bq-burger-ico { display: none; }
.bq-menu[open] .bq-x { display: block; width: 22px; height: 22px; stroke-width: 2; }
.bq-menu[open]::before { content: ""; position: fixed; inset: 0; z-index: 100; background: rgb(0 0 0 / .45); }
.bq-drawer { position: fixed; top: 0; inset-inline-end: 0; z-index: 101; display: flex; flex-direction: column; gap: 4px; width: min(360px, 86%); height: 100vh; padding: 28px 30px; overflow-y: auto; background: var(--color-bg); color: var(--bq-ink); box-shadow: 0 0 40px rgb(0 0 0 / .25); animation: bq-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes bq-drawer { from { transform: translateX(-100%); } }
.bq-drawer .bq-logo { margin-bottom: 22px; font-size: 2em; }
.bq-drawer a:not(.bq-logo) { padding: 11px 0; border-bottom: 1px solid var(--bq-line); font-weight: 500; }
.bq-drawer a[aria-current="page"], .bq-drawer a:hover { color: var(--bq-red); }
.bq-drawer hr { margin: 14px 0; border: none; }

/* Slider: hidden radio buttons pick the slide, the arrows are their labels */
.bq-hero { --bq-hero-h: clamp(440px, 36cqi, 660px); position: relative; background: var(--bq-soft); overflow: hidden; }
/* Hidden radios sit in the middle of the slider, which is on screen whenever its arrows are clicked, so picking one never scrolls. */
.bq-dot { position: absolute; top: 50%; left: 50%; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.bq h1, .bq h2, .bq h3 { line-height: 1.45; letter-spacing: normal; }
.bq-slides { display: grid; }
.bq-slide { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); height: var(--bq-hero-h); opacity: 0; visibility: hidden; transition: opacity .7s, visibility .7s; }
.bq-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.bq-dot:nth-of-type(${n}):checked ~ .bq-slides > .bq-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
/* Turning by itself: each slide shows for 6 seconds of a loop of all of them. */
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes bq-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.12).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.bq-n${n} .bq-auto:checked ~ .bq-slides > .bq-slide { animation: bq-cycle${n} ${n * 6}s infinite both; }
${Array.from({ length: n }, (_, k) => `.bq-n${n} .bq-auto:checked ~ .bq-slides > .bq-slide:nth-child(${k + 1}) { animation-delay: ${k * 6 - 0.4}s; }`).join("\n")}`;
  })
  .join("\n")}
.bq-hero:hover .bq-slide, .bq-hero:focus-within .bq-slide { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .bq-auto:checked ~ .bq-slides > .bq-slide { animation: none !important; } .bq-auto:checked ~ .bq-slides > .bq-slide:first-child { opacity: 1; visibility: visible; } }
.bq-slide-pic { position: relative; display: flex; justify-content: center; align-items: flex-end; min-height: 0; }
/* The picture is never stretched past its own size, and its edges fade into the background. */
.bq-slide-pic img { display: block; height: 100%; max-width: 100%; object-fit: contain; object-position: bottom; -webkit-mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); }
.bq-slide-text { display: grid; align-content: center; justify-items: start; gap: clamp(14px, 1.6cqi, 22px); padding: 30px clamp(20px, 5cqi, 80px) 30px 20px; }
.bq-slide-text h1, .bq-slide-text h2 { max-width: 14em; font-size: clamp(1.8em, 3.1cqi, 3.1em); font-weight: 600; line-height: 1.45; }
.bq-slide-text p { max-width: 30em; color: var(--color-muted); line-height: 1.95; }
.bq-slide > * { transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.bq-slide:not(:only-child) .bq-slide-text { transform: translateY(24px); }
${[1, 2, 3, 4, 5].map((n) => `.bq-dot:nth-of-type(${n}):checked ~ .bq-slides > .bq-slide:nth-child(${n}) .bq-slide-text`).join(", ")} { transform: none; }
.bq-arrows { display: flex; gap: 18px; margin-top: 8px; }
.bq-arrows label { display: grid; place-items: center; width: 40px; height: 40px; cursor: pointer; transition: color .2s, transform .2s; }
.bq-arrows label:hover { color: var(--bq-red); transform: scale(1.1); }
.bq-arrows .bq-ico { width: 34px; height: 34px; stroke-width: 1.3; }
.bq-dot:focus-visible ~ .bq-slides .bq-arrows label { outline: 1px dashed currentColor; }

/* Collections: a tall card beside three stacked ones, as in the reference */
.bq-cats { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(12px, 1.3cqi, 20px); padding-block: clamp(40px, 5cqi, 70px) 0; }
.bq-cover { position: absolute; inset: 0; overflow: hidden; }
.bq-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.bq-new, .bq-promo, .bq-picard, .bq-discover { position: relative; overflow: hidden; background: var(--bq-soft); color: #111; }
.bq-new .bq-cover img { object-position: left center; }
.bq-new:hover .bq-cover img, .bq-picard:hover .bq-cover img { transform: scale(1.04); }
.bq-new-text { position: relative; display: grid; justify-items: start; align-content: start; gap: 14px; width: 66%; padding: 11% 7% 7%; }
.bq-cats h2 { font-size: clamp(1.5em, 2.4cqi, 2.3em); font-weight: 500; }
.bq-new-text > p { max-width: 24em; color: #555; font-size: .92em; line-height: 1.9; }
.bq-dots { list-style: none; margin: 14px 0 22px; padding: 0; display: grid; gap: clamp(12px, 1.6cqi, 22px); font-size: clamp(1em, 1.2cqi, 1.15em); }
.bq-dots.two { grid-template-columns: 1fr 1fr; gap: 14px 24px; margin: 0; }
.bq-dots a { display: inline-flex; align-items: flex-start; gap: 5px; }
.bq-dots a::before { content: ""; width: 6px; height: 6px; margin: .7em 0 0 10px; border-radius: 50%; background: var(--bq-red); flex: none; }
.bq-dots a:hover { color: var(--bq-red); }
.bq-dots sup { font-size: .68em; }
.bq-cats-side { display: grid; gap: clamp(12px, 1.3cqi, 20px); }
.bq-promo { display: grid; align-content: center; justify-items: start; gap: 14px; aspect-ratio: 690 / 386; padding: 6% 7%; background: #0A0A0A; color: #fff; }
.bq-promo small { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border: 1px solid #5A5A5A; border-radius: 999px; font-size: .82em; font-weight: 600; }
.bq-bolt { width: 15px; height: 15px; fill: #F5C518; stroke: none; }
.bq-promo h3 { position: relative; max-width: 17em; color: #C9C9C9; font-size: clamp(1.25em, 2cqi, 2em); font-weight: 500; line-height: 1.5; }
.bq-promo p { color: #9A9A9A; font-size: .9em; }
.bq-promo-logo { position: relative; display: inline-flex; align-items: center; gap: 12px; font-size: clamp(1.3em, 1.8cqi, 1.8em); }
.bq-promo-logo b { text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
.bq-promo-logo i { position: relative; width: 22px; height: 22px; border: 2px solid var(--bq-red); border-radius: 4px; }
.bq-promo-logo i::after { content: ""; position: absolute; inset: 3px -7px -7px 3px; border: 2px solid var(--bq-red); border-radius: 4px; }
.bq-promo-mark { position: absolute; inset-inline-start: -2%; bottom: -14%; color: #1C1C1C; font-size: clamp(5em, 11cqi, 10em); font-weight: 800; line-height: 1; transform: rotate(-8deg); pointer-events: none; }
.bq-picard { display: grid; align-items: center; aspect-ratio: 690 / 359; }
.bq-picard .bq-cover img { object-position: left center; }
.bq-picard-text { position: relative; display: grid; gap: 6px; padding-inline: 7%; }
.bq-picard h3, .bq-discover h3 { font-size: clamp(1.3em, 2cqi, 2em); font-weight: 500; line-height: 1.5; }
.bq-picard small { font-size: .9em; letter-spacing: .02em; }
.bq-discover { display: grid; align-items: center; aspect-ratio: 690 / 425; background: #F2F2F2; }
.bq-discover-pic { position: absolute; inset-block: 0; inset-inline-end: 0; width: 34%; display: flex; justify-content: flex-end; }
.bq-discover-pic img { height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: bottom; -webkit-mask-image: linear-gradient(to left, #000 70%, transparent); mask-image: linear-gradient(to left, #000 70%, transparent); }
.bq-discover-text { position: relative; display: grid; gap: clamp(16px, 2.2cqi, 30px); width: 70%; padding-inline: 7% 0; }
.bq-dots.two li { min-width: 0; }
.bq-dots.two a { max-width: 100%; }
.bq-dots.two a span, .bq-dots.two a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Product cards */
.bq-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px 22px; }
.bq-card { display: grid; gap: 8px; align-content: start; animation: bq-up .7s calc(var(--i) * 60ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.bq-card-pic { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.bq-img, .bq-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-img img { object-fit: cover; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.bq-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; color: var(--color-muted); }
.bq-card:hover .bq-img img { transform: scale(1.06); }
.bq-badge { position: absolute; top: 12px; inset-inline-start: 12px; padding: 3px 12px; border-radius: 999px; background: #fff; color: #111; font-size: .78em; }
.bq-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; display: grid; gap: 8px; opacity: 0; transform: translateX(10px); transition: opacity .3s, transform .3s; }
.bq-card:hover .bq-card-acts, .bq-card-acts:focus-within { opacity: 1; transform: none; }
.bq-round { width: 40px; height: 40px; display: grid; place-items: center; border: none; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 6px 16px -8px rgb(0 0 0 / .4); cursor: pointer; transition: background .2s, color .2s; }
.bq-round:hover, .bq-round.on { background: var(--bq-red); color: #fff !important; }
.bq-round .bq-ico { width: 19px; height: 19px; }
.bq-card-name { margin-top: 6px; font-weight: 500; }
.bq-card-name:hover { color: var(--bq-red); }
.bq-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-size: .92em; }
.bq-price b { font-weight: 700; }
.bq-price s { color: var(--color-muted); font-size: .9em; }

/* Moving band */
.bq-band { --bq-speed: 60s; padding: clamp(12px, 1.3cqi, 18px) 0; background: var(--bq-dark); color: #fff; font-size: clamp(1.05em, 1.6cqi, 1.5em); font-weight: 500; }
.bq-band .bq-marq-copy > span { gap: clamp(26px, 3.4cqi, 54px); padding-inline-end: clamp(26px, 3.4cqi, 54px); }
.bq-band i { font-style: normal; opacity: .85; }

/* Look book: a product card beside a big photo with points; the photo keeps its own size and blends into the background */
/* The background follows the photo's own light: lighter on its outer side, darker towards the card. */
.bq-look { position: relative; background: linear-gradient(90deg, #F4F4F4 14%, #E5E5E5 48%, #ECECEC); color: #111; }
.bq-look-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); height: clamp(540px, 50cqi, 800px); }
.bq-look-text { display: grid; align-content: center; justify-items: center; gap: 10px; padding: clamp(24px, 3cqi, 46px) 20px; text-align: center; }
.bq-look-text h2 { font-size: clamp(1.7em, 3cqi, 2.9em); font-weight: 500; }
.bq-look-text > p { color: #555; }
.bq-look-cards { display: grid; width: min(300px, 70%); margin-top: clamp(8px, 1.4cqi, 20px); }
.bq-look-card { grid-area: 1 / 1; display: grid; justify-items: center; gap: 6px; }
.bq-look-card-pic { position: relative; width: 100%; aspect-ratio: 373 / 475; overflow: hidden; background: #F2F2F2; }
.bq-look-card-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .7s; }
.bq-look-card:hover img { transform: scale(1.05); }
.bq-look-card b { margin-top: 8px; font-size: 1.1em; font-weight: 500; }
${[1, 2, 3, 4].map((n) => `.bq-look:has(.bq-spot:nth-of-type(${n}) input:not(:checked)) .bq-look-card:nth-child(${n})`).join(", ")} { opacity: 0; visibility: hidden; transform: translateY(14px); }
.bq-look-card { transition: opacity .5s, visibility .5s, transform .6s cubic-bezier(.2, 1, .3, 1); }
/* The picture sits towards the card (as in the reference) and is never stretched past its size. */
.bq-look-pic { position: relative; min-height: 0; }
/* Pinned to the side next to the card, at the full height of the section. */
.bq-look-frame { position: absolute; inset-block: 0; right: 3%; display: block; max-width: 97%; }
.bq-look-img { display: block; height: 100%; }
.bq-look-frame img { display: block; height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: bottom; -webkit-mask-image: linear-gradient(to right, transparent, #000 4%, #000 90%, transparent); mask-image: linear-gradient(to right, transparent, #000 4%, #000 90%, transparent); }
.bq-spot { position: absolute; width: 52px; height: 52px; margin: -26px 0 0 -26px; display: grid; place-items: center; border: 1px solid rgb(255 255 255 / .9); border-radius: 50%; cursor: pointer; transition: transform .3s, background .3s; }
.bq-spot i { width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgb(0 0 0 / .3); }
.bq-spot::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid #fff; animation: bq-pulse 2.2s ease-out infinite; }
@keyframes bq-pulse { from { transform: scale(1); opacity: .9; } to { transform: scale(1.7); opacity: 0; } }
.bq-spot:hover { transform: scale(1.12); background: rgb(255 255 255 / .2); }
.bq-spot input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.bq-spot:has(input:checked) { background: rgb(255 255 255 / .28); }
.bq-spot:has(input:checked) i { background: var(--bq-red); }
.bq-spot:has(input:focus-visible) { outline: 2px solid #fff; outline-offset: 3px; }

/* Category boxes */
.bq-brands { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; padding-block: clamp(40px, 6cqi, 70px) 0; }
.bq-brands a { display: grid; justify-items: center; gap: 6px; padding: 30px 14px; border: 1px solid var(--bq-line); transition: border-color .3s, transform .3s; }
.bq-brands a:hover { border-color: var(--bq-ink); transform: translateY(-3px); }
.bq-brands b { font-size: 1.5em; font-weight: 800; letter-spacing: .06em; }
.bq-brands small { color: var(--color-muted); }

/* Newest trends */
.bq-trends { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: clamp(20px, 3cqi, 40px); align-items: start; }
.bq-trends-pic { position: relative; aspect-ratio: 567 / 704; max-height: 704px; overflow: hidden; background: #F2F2F2; }
.bq-trends-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.bq-trends-list { display: grid; gap: 18px; align-content: start; }
.bq-row { display: grid; grid-template-columns: 140px 1fr auto; align-items: center; gap: 22px; }
.bq-row-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--color-soft); }
.bq-row-pic span, .bq-row-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-row-pic img { object-fit: cover; transition: transform .5s; }
.bq-row:hover .bq-row-pic img { transform: scale(1.06); }
.bq-row-name { display: block; margin-bottom: 6px; font-weight: 500; }
.bq-bar { display: block; padding: 15px; border-radius: 999px; background: var(--bq-dark); color: #fff !important; text-align: center; font-weight: 700; }

/* Testimonials */
.bq-quotes { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
.bq-quote { display: grid; gap: 0; border: 1px solid var(--bq-line); }
.bq-quote-box { display: grid; justify-items: center; gap: 12px; padding: 34px 30px; text-align: center; }
.bq-stars { display: flex; gap: 4px; color: #F5A524; }
.bq-star { width: 16px; height: 16px; fill: currentColor; stroke: none; }
.bq-quote h3 { font-size: 1.3em; font-weight: 500; }
.bq-quote p { color: var(--color-muted); line-height: 1.95; }
.bq-mini { display: flex; align-items: center; gap: 18px; padding: 18px 30px; border-top: 1px solid var(--bq-line); }
.bq-mini > span:first-child { position: relative; width: 90px; height: 90px; flex: none; overflow: hidden; background: var(--color-soft); }
.bq-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-mini > span:last-child { display: grid; gap: 6px; }

/* Perks */
.bq-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px; padding-block: clamp(40px, 6cqi, 80px); text-align: center; }
.bq-perks > div { display: grid; justify-items: center; align-content: start; gap: 10px; }
.bq-perk-ico { width: 74px; height: 74px; display: grid; place-items: center; border-radius: 50%; background: var(--color-soft); transition: background .3s, color .3s; }
.bq-perk-ico .bq-ico { width: 32px; height: 32px; stroke-width: 1.4; }
.bq-perks > div:hover .bq-perk-ico { background: var(--bq-red); color: #fff; }
.bq-perks h3 { font-size: 1.1em; font-weight: 600; }
.bq-perks p { max-width: 16em; color: var(--color-muted); font-size: .88em; line-height: 1.8; }

/* Footer and floating buttons */
.bq-foot { margin-top: clamp(20px, 3cqi, 40px); padding: clamp(46px, 6cqi, 80px) 0 26px; background: var(--bq-dark); color: #fff; text-align: center; }
.bq-foot .bq-wrap { display: grid; justify-items: center; gap: 26px; }
.bq-foot-text { max-width: 36em; color: #CFCFCF; line-height: 2; }
.bq-foot-rows { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; padding-block: 26px; border-block: 1px solid #262626; text-align: start; }
.bq-foot-rows > div { display: flex; align-items: center; justify-content: center; gap: 16px; }
.bq-foot-rows small { display: block; margin-bottom: 4px; color: #BDBDBD; }
.bq-circle { width: 70px; height: 70px; flex: none; display: grid; place-items: center; border: 1px solid #4A4A4A; border-radius: 50%; }
.bq-circle .p-ico { width: 28px; height: 28px; }
.bq-foot-nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 40px; font-weight: 600; }
.bq-foot-nav a:hover { color: var(--bq-red); }
.bq-foot-socials a { border: 1px solid #4A4A4A; color: #fff; }
.bq-foot-socials a:hover { background: #fff; color: #111; }
.bq-copy { justify-self: stretch; text-align: start; color: #BDBDBD; }
.bq-off { color: #15803D; }
.bq-float { position: sticky; bottom: 18px; z-index: 20; display: flex; justify-content: flex-end; width: var(--bq-wrap); margin: -68px auto 18px; pointer-events: none; }
.bq-float > * { pointer-events: auto; }
.bq-top { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; background: #fff; color: #111; box-shadow: 0 8px 20px -10px rgb(0 0 0 / .4); }
.bq-top .bq-ico { transform: rotate(90deg); }

/* Inner pages */
.bq-banner { padding-block: clamp(16px, 2.2cqi, 26px); border-bottom: 1px solid var(--bq-line); background: var(--bq-soft); }
.bq-banner .bq-wrap { display: grid; gap: 6px; }
.bq-banner h1 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; font-size: clamp(1.35em, 2.4cqi, 1.9em); font-weight: 600; letter-spacing: -.01em; }
.bq-banner h1 small { color: var(--color-muted); font-size: .5em; font-weight: 400; letter-spacing: 0; }
.bq-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--color-muted); font-size: .85em; }
.bq-trail a { color: inherit; transition: color .2s; }
.bq-trail a:hover { color: var(--bq-ink); }
.bq-trail i { font-style: normal; margin-inline: 8px; opacity: .5; }
.bq-trail b { color: var(--bq-ink); font-weight: 600; }
.bq-trail.dark { justify-content: flex-start; color: var(--color-muted); font-weight: 400; font-size: .9em; }
.bq-empty { display: grid; justify-items: start; gap: 30px; padding-block: clamp(40px, 6cqi, 80px); }
.bq-empty .bq-notice { justify-self: stretch; }
.bq-big { padding-top: clamp(30px, 5cqi, 60px); font-size: clamp(1.8em, 4cqi, 2.8em); font-weight: 500; }
.bq-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.bq-chips a { padding: 7px 16px; border: 1px solid var(--bq-line); border-radius: 999px; font-size: .9em; white-space: nowrap; transition: background .2s, color .2s, border-color .2s; }
/* Shop listing: categories and the filter button share one slim row right above the products */
.bq-plp { padding-block: 14px clamp(40px, 6cqi, 80px); }
.bq-plp-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px 16px; margin-bottom: 20px; }
.bq-plp-bar .bq-chips { flex-wrap: nowrap; overflow-x: auto; margin: 0; padding-block: 2px; scrollbar-width: none; }
.bq-plp-bar .bq-chips::-webkit-scrollbar { display: none; }
.bq-plp-bar .bq-filter { margin: 0; border-radius: 999px; }
.bq-plp-bar .bq-filter > summary { padding: 7px 16px; font-size: .9em; }
.bq-plp-bar .bq-filter > summary small { display: none; }
.bq-plp-bar .bq-filter[open] { grid-column: 1 / -1; border-radius: 0; }
.bq-plp-bar .bq-filter[open] > summary small { display: inline; }
.bq-chips a:hover { border-color: var(--bq-ink); }
.bq-chips a[aria-current="page"] { background: var(--bq-dark); border-color: var(--bq-dark); color: #fff; }

.bq-product { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(24px, 5cqi, 70px); padding-block: clamp(30px, 5cqi, 60px); }
.bq-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.bq-gal { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); cursor: zoom-in; }
.bq-gal.first { grid-column: 1 / -1; }
.bq-gal span, .bq-gal img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-gal img { object-fit: cover; }
.bq-info-col { display: grid; align-content: start; gap: 18px; position: sticky; top: 20px; align-self: start; }
.bq-info-col h1 { font-size: clamp(1.6em, 3.4cqi, 2.4em); font-weight: 600; }
.bq-info-col > .bq-price { font-size: 1.25em; }
.bq-desc { color: var(--color-muted); line-height: 2; }
.bq-buy { display: grid; gap: 18px; padding-block: 18px; border-block: 1px solid var(--bq-line); }
.bq-sizes { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; border: none; }
.bq-sizes legend { margin-bottom: 10px; font-weight: 600; }
.bq-sizes label { cursor: pointer; }
.bq-sizes input { position: absolute; opacity: 0; }
.bq-sizes span { display: grid; place-items: center; min-width: 48px; height: 44px; padding: 0 10px; border: 1px solid var(--bq-line); border-radius: 10px; transition: background .2s, color .2s, border-color .2s; }
.bq-sizes input:checked + span { background: var(--bq-dark); border-color: var(--bq-dark); color: #fff; }
.bq-sizes input:focus-visible + span { outline: 2px solid var(--bq-red); }
.bq-buy-row { display: flex; gap: 12px; }
.bq-qty input { width: 80px; height: 100%; padding: 0 12px; border: 1px solid var(--bq-line); border-radius: 999px; background: var(--color-bg); color: var(--bq-ink); font: inherit; text-align: center; }
.bq-buy-row .bq-btn { flex: 1; }
.bq-assure { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; color: var(--color-muted); font-size: .9em; }
.bq-assure li { display: flex; align-items: center; gap: 10px; }

.bq-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-block: clamp(30px, 5cqi, 60px); }
.bq-lines { display: grid; border-top: 1px solid var(--bq-line); }
.bq-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--bq-line); }
.bq-line-pic { position: relative; display: block; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.bq-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-line-info { display: grid; gap: 4px; }
.bq-line-info small { color: var(--color-muted); }
.bq-stepper { display: flex; align-items: center; border: 1px solid var(--bq-line); border-radius: 999px; }
.bq-stepper button { width: 36px; height: 36px; border: none; background: none; font-size: 1.2em; cursor: pointer; }
.bq-stepper span { min-width: 24px; text-align: center; }
.bq-line-total { min-width: 8em; text-align: end; }
.bq-remove { width: 36px; height: 36px; display: grid; place-items: center; border: none; border-radius: 50%; background: none; color: var(--color-muted) !important; cursor: pointer; }
.bq-remove:hover { background: var(--color-soft); color: #C62A2F !important; }
.bq-sum { display: grid; gap: 16px; padding: 26px; background: var(--color-soft); position: sticky; top: 20px; }
.bq-sum h2 { font-size: 1.3em; font-weight: 600; }
.bq-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 0; }
.bq-sum dd { margin: 0; text-align: end; }
.bq-sum .total { padding-top: 12px; border-top: 1px solid var(--bq-line); font-weight: 700; font-size: 1.05em; }
.bq-sum small { color: var(--color-muted); }
.bq-sum-lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: .9em; }
.bq-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.bq-pay { padding: 14px 16px; border-radius: 12px; background: var(--color-bg); border: 1px dashed var(--bq-line); font-size: .88em; line-height: 1.9; }
.bq-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-content: start; }
.bq-checkout h2, .bq-checkout .full, .bq-checkout .bq-error { grid-column: 1 / -1; }
.bq-checkout h2 { font-size: 1.3em; font-weight: 600; }
.bq-checkout label { display: grid; gap: 8px; font-size: .9em; font-weight: 600; }
.bq-checkout input, .bq-checkout textarea { width: 100%; padding: 13px 16px; border: 1px solid var(--bq-line); border-radius: 12px; background: var(--color-bg); color: var(--bq-ink); font: inherit; font-weight: 400; transition: border-color .2s; }
.bq-checkout input:focus, .bq-checkout textarea:focus { outline: none; border-color: var(--bq-ink); }
.bq-trap { position: absolute; inset-inline-start: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.bq-thanks { display: grid; justify-items: center; gap: 16px; padding-block: clamp(40px, 6cqi, 80px); text-align: center; }
.bq-thanks p { max-width: 34em; line-height: 2; }
.bq-check { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, #16A34A 15%, var(--color-bg)); color: #16A34A; font-size: 2.2em; animation: bq-pop .7s cubic-bezier(.2, 1.5, .4, 1) backwards; }
@keyframes bq-pop { from { transform: scale(.3); opacity: 0; } }
.bq-search { display: grid; gap: 40px; padding-block: clamp(50px, 8cqi, 110px); }
.bq-search-box { display: flex; width: min(460px, 100%); margin-inline: auto; border: 1px solid var(--bq-line); }
.bq-search-box input { flex: 1; min-width: 0; padding: 20px 24px; border: none; background: var(--color-bg); color: var(--bq-ink); font: inherit; }
.bq-search-box input:focus { outline: none; }
.bq-search-box button { width: 64px; border: none; background: none; cursor: pointer; }

.bq-main > * { animation: bq-up .7s cubic-bezier(.2, 1, .3, 1) backwards; }

/* Sale: percent tag, sale row, time left, savings */
.bq-pct { position: absolute; bottom: 12px; inset-inline-start: 12px; padding: 3px 9px; border-radius: 999px; background: var(--bq-red); color: #fff; font-size: .74em; font-weight: 700; }
.bq-card-acts { z-index: 2; }
.bq-sale { padding-block: clamp(36px, 5cqi, 64px); background: var(--bq-soft); }
.bq-sale-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: clamp(18px, 3cqi, 30px); }
.bq-sale-kicker { display: inline-block; margin-bottom: 8px; padding: 4px 12px; border-radius: 999px; background: var(--bq-red); color: #fff; font-size: .8em; font-weight: 700; }
.bq-sale-head h2 { font-size: clamp(1.6em, 3.4cqi, 2.4em); font-weight: 600; }
.bq-sale-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(220px, calc((100% - 3 * 22px) / 4)); gap: 22px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: thin; }
.bq-sale-item { display: grid; gap: 8px; align-content: start; scroll-snap-align: start; }
.bq-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--bq-red); font-size: .8em; font-weight: 600; }
.bq-clock .bq-ico { width: 15px; height: 15px; }
.bq-save { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-self: start; padding: 5px 12px; border-radius: 999px; background: color-mix(in srgb, var(--bq-red) 10%, var(--color-bg)); color: var(--bq-red); font-size: .85em; }
.bq-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; border: 0; border-bottom: 1px solid currentColor; background: none; color: inherit; font: inherit; font-size: .9em; font-weight: 600; cursor: pointer; }
.bq-link .bq-ico { width: 16px; height: 16px; }
/* Filters: a bar that opens the filter form */
.bq-filter { margin: -14px 0 28px; border: 1px solid var(--bq-line); }
.bq-filter > summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 18px; cursor: pointer; list-style: none; font-weight: 600; }
.bq-filter > summary::-webkit-details-marker { display: none; }
.bq-filter > summary > span { display: inline-flex; align-items: center; gap: 8px; }
.bq-filter > summary small { color: var(--color-muted); font-weight: 400; }
.bq-filter[open] > summary { border-bottom: 1px solid var(--bq-line); }
.bq-filter-on { width: 8px; height: 8px; border-radius: 50%; background: var(--bq-red); }
.bq-filter-form { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; padding: 18px; }
.bq-filter-form input:not([type=checkbox]), .bq-filter-form select { border-radius: 0; }
.bq-filter-form .bq-btn { padding: 12px 22px; }
.bq-search .bq-filter { width: min(900px, 100%); margin: 22px auto 30px; }
.bq-about { display: grid; gap: clamp(28px, 4cqi, 48px); }
.bq-specs { width: min(760px, 100%); }
@container (max-width: 1100px) {
  .bq-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .bq-nav { display: none; }
  .bq-icons { margin-inline-start: auto; }
  .bq-slide-text h1, .bq-slide-text h2 { font-size: clamp(1.6em, 3.6cqi, 2.4em); }
}
@container (max-width: 820px) {
  .bq-cats { grid-template-columns: 1fr; }
  .bq-new { min-height: 640px; }
  .bq-look, .bq-trends, .bq-product, .bq-cart, .bq-quotes { grid-template-columns: 1fr; }
  .bq-look-in { grid-template-columns: 1fr; height: auto; }
  .bq-look-pic { height: 480px; }
  .bq-look { background: #EDEDED; }
  .bq-look-frame { inset-inline: 0; width: fit-content; margin-inline: auto; }
  .bq-trends-pic { max-height: 520px; }
  .bq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
  .bq-perks { grid-template-columns: 1fr 1fr; }
  .bq-foot-rows { grid-template-columns: 1fr; }
  .bq-foot-rows > div { justify-content: flex-start; }
  .bq-info { justify-content: center; }
  .bq-info-end { display: none; }
  .bq-info-col, .bq-sum { position: static; }
  .bq-card-acts { opacity: 1; transform: none; }
}
/* Phones, as in the reference: the slide picture sits behind centred text, only the bag and menu stay in the header */
@container (max-width: 820px) {
  .bq-filter-form { grid-template-columns: 1fr 1fr; }
  .bq-sale-row { grid-auto-columns: minmax(200px, 44%); }
}
@container (max-width: 600px) {
  .bq-filter-form { grid-template-columns: 1fr; }
  .bq-sale-row { grid-auto-columns: 62%; gap: 14px; }
  .bq-sale-head { align-items: flex-start; flex-direction: column; }
  .bq-hero { --bq-hero-h: clamp(380px, 112cqi, 460px); }
  .bq-slide { grid-template-columns: 1fr; }
  .bq-slide-pic { position: absolute; inset: 0; }
  .bq-slide-pic img { opacity: .55; -webkit-mask-image: none; mask-image: none; }
  .bq-slide-text { position: relative; justify-items: center; padding: 30px 18px; text-align: center; }
  .bq-slide-text p { color: var(--bq-ink); font-size: .9em; }
  .bq-icons > a:not(:first-child) { display: none; }
  .bq-info > :not(:first-child):not(.bq-strong) { display: none; }
  .bq-head { padding: 14px 0; }
  .bq-burger .bq-burger-ico { width: 40px; }
  .bq-cats { gap: 12px; }
  .bq-new { min-height: 0; }
  .bq-new-text { width: 72%; padding: 9% 6% 9%; }
  .bq-new .bq-cover img { object-position: 0% center; }
  .bq-promo { aspect-ratio: auto; padding: 28px 22px; }
  .bq-picard { aspect-ratio: auto; min-height: 150px; }
  .bq-discover { aspect-ratio: auto; min-height: 210px; padding-block: 28px; }
  .bq-discover-text { width: 70%; }
  .bq-dots.two { grid-template-columns: 1fr; gap: 10px; }
  .bq-look-cards { width: min(260px, 72%); }
  .bq-look-pic { height: 420px; }
  .bq-brands { grid-template-columns: 1fr; gap: 12px; }
  .bq-brands a { padding: 18px 12px; }
  .bq-new .bq-btn { padding: 13px 22px; white-space: nowrap; }
  .bq-row { grid-template-columns: 90px 1fr; }
  .bq-row .bq-under { grid-column: 2; justify-self: start; }
  .bq-line { grid-template-columns: 72px minmax(0, 1fr) auto; }
  .bq-line .bq-stepper { grid-column: 2; }
  .bq-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; justify-self: end; }
  .bq-checkout { grid-template-columns: 1fr; }
  .bq-ann i { width: 30px; margin-inline: 20px; }
  .bq-logo { font-size: 1.9em; }
  .bq-menu[open] > summary { top: 14px; inset-inline-start: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .bq-card, .bq-check, .bq-main > *, .bq-drawer { animation: none !important; }
  .bq-marq-track { animation: none; }
  .bq-slide, .bq-slide > *, .bq-look-card { transition: none !important; }
  .bq-spot::after { animation: none; }
}
`;
