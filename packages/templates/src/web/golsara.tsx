/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Golsara": a flower shop. Soft pink and gold, light headings, a big framed hero, and the pages
// about us, our services, gallery and contact besides the shop pages: all products, a category,
// a product, cart, wishlist, search, checkout and the order confirmation.
// The page works without scripts: cart and wishlist buttons are small forms the server answers
// (see apps/api/src/routes/shop.ts); in the editor the preview answers them itself.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, FilterForm, filterProducts, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SORTS, SpecsTable, timeLeft } from "./shopkit";

export const GOLSARA_BLOCKS = [
  { key: "intro", label: "معرفی فروشگاه با دو عکس" },
  { key: "fresh", label: "معرفی محصولات" },
  { key: "products", label: "محصولات صفحه‌ی اول" },
  { key: "sale", label: "حراج (کالاهای تخفیف‌دار)" },
  { key: "touch", label: "نشانی، تلفن و ساعت کاری" },
  { key: "newsletter", label: "خبرنامه‌ی پایین صفحه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const GOLSARA_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/services", label: "صفحه‌ی خدمات ما" },
  { path: "/gallery", label: "صفحه‌ی گالری" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());

/** Every page this shop has: the fixed shop pages, one per category and one per product. */
export function golsaraPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const own = GOLSARA_OPTIONAL_PAGES.map((p) => p.path).filter((p) => !(data.site?.hiddenPages ?? []).includes(p));
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", "/shop", ...own, "/contact", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...info];
}

type GView = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function GolsaraShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = golsaraPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: GView = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
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
  else if (kind === "services") body = <Services {...view} />;
  else if (kind === "gallery") body = <Gallery {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else
    body = (
      <div className="gs-wrap">
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className="gs" css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className="gs-main" key={page}>
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
  down: "M7 10l5 5 5-5",
};
const PERK_ICONS = ["store", "tag", "chat", "shield"];

function Svg({ name, className = "gs-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

/** The wide three-line menu icon of the reference. */
const MenuLines = () => (
  <svg viewBox="0 0 44 24" className="gs-ico gs-burger-ico" aria-hidden="true">
    <path d="M1 5h42M1 12h42M1 19h42" />
  </svg>
);

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

const money = (view: GView, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const P = (id: string) => item("site.shop.products", id);

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: GView; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="gs-act">
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

function Price({ view, p }: { view: GView; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="gs-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function ProductCard({ view, p, i = 0 }: { view: GView; p: Product; i?: number }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  const cat = view.shop.categories?.find((c) => c.id === p.categoryId)?.name;
  return (
    <article className="gs-card" style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="gs-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="gs-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
          </span>
        </PageLink>
        {(p.badge || soldOut) && <span className="gs-badge">{soldOut ? "ناموجود" : p.badge}</span>}
        {!soldOut && onSale(p) && <span className="gs-pct">{fa(percentOff(p))}٪</span>}
        <div className="gs-card-acts">
          <Act view={view} op="wish" id={p.id} className={`gs-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
        </div>
      </div>
      {cat && <small className="gs-card-cat">{cat}</small>}
      <PageLink to={productPath(p)} link={view.link} className="gs-card-name">
        <span>{p.name}</span>
      </PageLink>
      <Price view={view} p={p} />
      {!soldOut &&
        (hasChoices(p) ? (
          <PageLink to={productPath(p)} link={view.link} className="gs-add-cart" current={false}>
            انتخاب و خرید
          </PageLink>
        ) : (
          <Act view={view} op="add" id={p.id} className="gs-add-cart" label="افزودن به سبد خرید">
            افزودن به سبد
          </Act>
        ))}
    </article>
  );
}

/** Time left of a sale, as "۲ روز و ۵ ساعت" (or minutes in its last hour). */
function SaleClock({ p }: { p: Product }) {
  if (!p.saleEndsAt || !onSale(p)) return null;
  const { d, h, m } = timeLeft(p.saleEndsAt);
  const text = d ? `${fa(d)} روز${h ? ` و ${fa(h)} ساعت` : ""}` : h ? `${fa(h)} ساعت${m ? ` و ${fa(m)} دقیقه` : ""}` : `${fa(Math.max(1, m))} دقیقه`;
  return (
    <span className="gs-clock" title="زمان باقی‌مانده تا پایان حراج">
      <Svg name="clock" /> {text} تا پایان حراج
    </span>
  );
}

/** The home page's sale: products with a discount, ending soonest first; hidden when there are none. */
function SaleRow({ view }: { view: GView }) {
  const list = saleProducts(visible(view.shop)).slice(0, 8);
  if (!list.length) return null;
  const top = Math.max(...list.map(percentOff));
  return (
    <section className="gs-sale">
      <div className="gs-wrap">
        <div className="gs-sale-head">
          <div>
            <span className="gs-sale-kicker">تا {fa(top)}٪ تخفیف</span>
            <h2 {...ed("site.shop.discountTitle", "text", "عنوان بخش حراج")}>{view.shop.discountTitle?.trim() || "حراج فصل"}</h2>
          </div>
          <form method="get" action={view.link("/shop")}>
            <input type="hidden" name="sale" value="1" />
            <button type="submit" className="gs-link">
              همه‌ی حراجی‌ها <Svg name="left" />
            </button>
          </form>
        </div>
        <div className="gs-sale-row">
          {list.map((p, k) => (
            <div key={p.id} className="gs-sale-item">
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
    <div className="gs-title">
      <h2 {...(path ? ed(path, editKind, "عنوان") : {})}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

/** The top of inner pages: the page name in large light letters with the "home / page" trail under it. */
function Banner({ view, title, trail, note }: { view: GView; title: string; trail?: { label: string; to?: string }[]; note?: string }) {
  return (
    <section className="gs-banner">
      <div className="gs-wrap">
        <h1>{title}</h1>
        <nav className="gs-trail" aria-label="مسیر صفحه">
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
          {note && <small>{note}</small>}
        </nav>
      </div>
    </section>
  );
}

/** The small gold line above section headings («ساخته‌شده با عشق»); one text for every section. */
function Kicker({ shop, editing }: { shop: Shop; editing: boolean }) {
  return (
    <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط کوچک بالای تیترها")}>
      <span className="gs-kicker" {...ed("site.shop.heroKicker", "text", "خط کوچک بالای تیترها")}>
        {shop.heroKicker}
      </span>
    </Opt>
  );
}

/** A picture the owner can change by clicking it in the editor. */
function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`gs-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A heading block: the gold kicker, a light heading, a line of text and an optional button. */
function Lead({ view, title, titlePath, text, textPath, button, to }: { view: GView; title?: string; titlePath: string; text?: string; textPath: string; button?: string; to?: string }) {
  const { editing, shop, link } = view;
  return (
    <div className="gs-lead">
      <Kicker shop={shop} editing={editing} />
      <Opt value={title} editing={editing} edit={ed(titlePath, "text", "تیتر")}>
        <h2 {...ed(titlePath, "text", "تیتر")}>{title}</h2>
      </Opt>
      <Opt value={text} editing={editing} edit={ed(textPath, "multiline", "متن")}>
        <p {...ed(textPath, "multiline", "متن")}>{text}</p>
      </Opt>
      {button && to && (
        <PageLink to={to} link={link} className="gs-btn">
          {button}
        </PageLink>
      )}
    </div>
  );
}

function Empty({ view, text }: { view: GView; text: string }) {
  return (
    <div className="gs-wrap gs-empty">
      <p className="gs-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="gs-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Frame: top strip, header, footer ───────────── */

/** Menu items: the fixed pages, without the ones the owner switched off. */
function menu(view: GView) {
  const hidden = view.ctx.data.site?.hiddenPages ?? [];
  return [
    { to: "/", label: "خانه" },
    { to: "/shop", label: "فروشگاه" },
    { to: "/about", label: "درباره‌ی ما" },
    { to: "/services", label: "خدمات ما" },
    { to: "/gallery", label: "گالری" },
    { to: "/contact", label: "تماس با ما" },
  ].filter((m) => !hidden.includes(m.to));
}

const isHere = (view: GView, to: string) => (to === "/shop" ? view.page === "/shop" || view.page.startsWith("/category/") : view.page === to);

function Logo({ view }: { view: GView }) {
  const b = view.ctx.data.basics;
  return (
    <PageLink to="/" link={view.link} className="gs-logo">
      <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</b>
      <Opt value={b.jobTitle} editing={view.editing} edit={ed("basics.jobTitle", "text", "زیر نام")}>
        <small {...ed("basics.jobTitle", "text", "زیر نام")}>{b.jobTitle}</small>
      </Opt>
    </PageLink>
  );
}

function Header(view: GView) {
  const { link, visitor, shop } = view;
  const count = priceCart(shop, visitor.cart).count;
  const items = menu(view);
  return (
    <header className="gs-head">
      <div className="gs-wrap gs-head-in">
        <Logo view={view} />
        <nav className="gs-nav">
          {items.map((m) => (
            <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
              {m.label}
            </PageLink>
          ))}
        </nav>
        <div className="gs-icons">
          <PageLink to="/cart" link={link} className="gs-icon">
            <Svg name="bag" />
            <b>{fa(count)}</b>
            <span className="sr-only">سبد خرید</span>
          </PageLink>
          <PageLink to="/search" link={link} className="gs-icon">
            <Svg name="search" />
            <span className="sr-only">جست‌وجو</span>
          </PageLink>
          <PageLink to="/account" link={link} className="gs-icon">
            <Svg name="user" />
            <span className="sr-only">{visitor.customer ? `حساب ${visitor.customer.name}` : "ورود / ثبت‌نام"}</span>
          </PageLink>
          {/* The menu opens without scripts: a details element whose summary turns into the close button. */}
          <details className="gs-menu">
            <summary className="gs-icon gs-burger" aria-label="منو">
              <MenuLines />
              <Svg name="close" className="gs-ico gs-x" />
            </summary>
            <nav className="gs-drawer">
              {items.map((m) => (
                <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
                  {m.label}
                </PageLink>
              ))}
              <hr />
              <PageLink to="/wishlist" link={link} current={view.page === "/wishlist"}>
                علاقه‌مندی‌ها
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
      </div>
    </header>
  );
}

function Footer(view: GView) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  return (
    <footer className="gs-foot">
      <div className="gs-wrap">
        <Logo view={view} />
        <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
          <p className="gs-foot-text" {...ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
            {b.summary}
          </p>
        </Opt>
        {blockOn(ctx.data, "newsletter") && (
          <form method="post" action={link("/_form")} className="gs-news">
            <FormMeta kind="newsletter" back={view.page} />
            <input name="email" type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
            <button type="submit">عضویت</button>
          </form>
        )}
        <Socials ctx={ctx} editing={editing} className="gs-foot-socials" />
        <small className="gs-copy">
          <PageLink to="/support" link={link}>
            پشتیبانی
          </PageLink>
          {(shop.faq ?? []).length > 0 && (
            <PageLink to="/faq" link={link}>
              سؤالات متداول
            </PageLink>
          )}
          <span>© همه‌ی حقوق برای {b.fullName} محفوظ است.</span>
        </small>
      </div>
    </footer>
  );
}

function Floating() {
  return (
    <div className="gs-float">
      <a href="#" className="gs-top" aria-label="بالای صفحه">
        <Svg name="chevron" />
      </a>
    </div>
  );
}

/* ───────────── Home ───────────── */

/** Home page slider. It works without scripts: hidden radio buttons pick the slide, the arrows are their labels. */
function Hero({ shop, link, editing }: GView) {
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  return (
    <section className={`gs-hero gs-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="gs-hero" id={`gs-hero-${k}`} className="gs-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {/* Checked until an arrow is used: the slides then turn by themselves (paused under the pointer). */}
      {n > 1 && <input type="radio" name="gs-hero" className="gs-dot gs-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="gs-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className="gs-slide">
              <span className="gs-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
              </span>
              <div className="gs-slide-text">
                <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                  <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                </Opt>
                <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "multiline", "متن اسلاید")}>
                  <p {...ed(at(s.id, "text"), "multiline", "متن اسلاید")}>{s.text}</p>
                </Opt>
                <PageLink to="/shop" link={link} className="gs-btn">
                  سفارش گل
                </PageLink>
                {n > 1 && (
                  <div className="gs-arrows">
                    <label htmlFor={`gs-hero-${(k + n - 1) % n}`} title="اسلاید قبلی">
                      <Svg name="right" />
                    </label>
                    <label htmlFor={`gs-hero-${(k + 1) % n}`} title="اسلاید بعدی">
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

function Home(view: GView) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  // Chosen products first, then the rest, eight in all.
  const picks = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 8);
  const b = data.basics;
  const boxes: { label: string; value?: string; path: string; href?: string }[] = [
    { label: "نشانی", value: site?.address || b.location, path: "site.address" },
    { label: "تلفن", value: b.phone, path: "basics.phone", href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined },
    { label: "ساعت کاری", value: site?.contactNote, path: "site.contactNote" },
  ];
  return (
    <>
      <Hero {...view} />

      {on("intro") && (
        <section className="gs-wrap gs-intro">
          <div className="gs-intro-text">
            <Opt value={site?.styleTitle} editing={editing} edit={ed("site.styleTitle", "text", "تیتر معرفی")}>
              <h2 {...ed("site.styleTitle", "text", "تیتر معرفی")}>{site?.styleTitle}</h2>
            </Opt>
            <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "text", "خط زیر تیتر")}>
              <p {...ed("site.styleText", "text", "خط زیر تیتر")}>{site?.styleText}</p>
            </Opt>
            <PageLink to={(site?.hiddenPages ?? []).includes("/services") ? "/shop" : "/services"} link={link} className="gs-btn">
              کارهای ما
            </PageLink>
          </div>
          <Pic src={site?.heroImage} path="site.heroImage" label="عکس بزرگ معرفی" className="gs-intro-big" />
          <Pic src={site?.accentImage} path="site.accentImage" label="عکس کوچک معرفی" className="gs-intro-small" />
        </section>
      )}

      {on("fresh") && (
        <section className="gs-soft">
          <div className="gs-wrap gs-sec">
            <Lead view={view} title={shop.newTitle} titlePath="site.shop.newTitle" text={shop.newText} textPath="site.shop.newText" button="خرید گل" to="/shop" />
          </div>
        </section>
      )}

      {on("products") && picks.length > 0 && (
        <section className="gs-wrap gs-sec gs-home-grid">
          <div className="gs-grid">
            {picks.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("sale") && <SaleRow view={view} />}

      {on("touch") && (
        <section className="gs-wrap gs-sec gs-touch">
          <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر تماس")}>
            <h2 className="gs-h" {...ed("site.contactTitle", "text", "تیتر تماس")}>
              {site?.contactTitle}
            </h2>
          </Opt>
          <div className="gs-touch-row">
            {boxes.map((x) => (
              <Opt key={x.path} value={x.value} editing={editing} edit={ed(x.path, "text", x.label)}>
                <div className="gs-touch-box">
                  <h3>{x.label}</h3>
                  {x.href ? (
                    <a href={x.href} dir="auto" {...ed(x.path, "text", x.label)}>
                      {x.value}
                    </a>
                  ) : (
                    <p {...ed(x.path, "text", x.label)}>{x.value}</p>
                  )}
                </div>
              </Opt>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── About us, services, gallery, contact ───────────── */

function About(view: GView) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  return (
    <>
      <section className="gs-soft gs-about-top">
        <div className="gs-wrap gs-trio">
          <Pic src={shop.newImage} path="site.shop.newImage" label="عکس راست" />
          <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس وسط" className="gs-trio-mid" />
          <Pic src={site?.signatureImage} path="site.signatureImage" label="عکس چپ" />
        </div>
        <div className="gs-wrap gs-sec">
          <Lead view={view} title={site?.aboutTitle} titlePath="site.aboutTitle" text={site?.aboutText} textPath="site.aboutText" button="خرید گل" to="/shop" />
        </div>
      </section>
      <section className="gs-wrap gs-sec gs-story">
        <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس عریض" className="gs-story-pic" />
        <Lead view={view} title={shop.lookTitle} titlePath="site.shop.lookTitle" text={shop.lookText} textPath="site.shop.lookText" button="تماس با ما" to="/contact" />
      </section>
    </>
  );
}

function Services(view: GView) {
  const { ctx, shop, editing } = view;
  const perks = shop.perks ?? [];
  const half = Math.ceil(perks.length / 2);
  const Perk = ({ k }: { k: number }) => {
    const x = perks[k]!;
    const at = item("site.shop.perks", x.id);
    return (
      <div className="gs-perk">
        <span className="gs-perk-ico">
          <Svg name={PERK_ICONS[k % PERK_ICONS.length]!} />
        </span>
        <h3 {...ed(`${at}.title`, "text", "عنوان مزیت")}>{x.title}</h3>
        <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح مزیت")}>
          <p {...ed(`${at}.text`, "text", "توضیح مزیت")}>{x.text}</p>
        </Opt>
      </div>
    );
  };
  return (
    <>
      <section className="gs-soft">
        <div className="gs-wrap gs-svc-top">
          <Pic src={shop.discoverImage} path="site.shop.discoverImage" label="عکس بالای صفحه" />
          <Opt value={shop.discoverTitle} editing={editing} edit={ed("site.shop.discoverTitle", "multiline", "تیتر بالای صفحه")}>
            <h1 className="gs-h gs-lines" {...ed("site.shop.discoverTitle", "multiline", "تیتر بالای صفحه")}>
              {shop.discoverTitle}
            </h1>
          </Opt>
        </div>
      </section>
      <section className="gs-wrap gs-sec">
        <Lead view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" text={shop.promoText} textPath="site.shop.promoText" />
        <div className="gs-perks">
          <div className="gs-perk-col">
            {perks.slice(0, half).map((x, k) => (
              <Perk key={x.id} k={k} />
            ))}
          </div>
          <Pic src={shop.trendImage} path="site.shop.trendImage" label="عکس وسط" className="gs-perks-pic" />
          <div className="gs-perk-col">
            {perks.slice(half).map((x, k) => (
              <Perk key={x.id} k={k + half} />
            ))}
          </div>
        </div>
      </section>
      <section className="gs-wrap gs-sec">
        <Lead view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" text={shop.showcaseText} textPath="site.shop.showcaseText" />
        <MessageForm view={view} />
      </section>
    </>
  );
}

function Gallery(view: GView) {
  const { ctx, link, editing } = view;
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <>
      <Banner view={view} title="گالری" />
      <section className="gs-wrap gs-sec gs-album">
        {items.map((g) => {
          const at = item("site.gallery", g.id);
          return (
            <article key={g.id} className="gs-alb">
              <ZoomOpen id={g.id} className="gs-alb-pic">
                <span {...ed(`${at}.image`, "image", "عکس")}>
                  <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                </span>
              </ZoomOpen>
              <div className="gs-alb-text">
                <h2 {...ed(`${at}.title`, "text", "عنوان")}>{g.title}</h2>
                <Opt value={g.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح")}>
                  <p {...ed(`${at}.description`, "multiline", "توضیح")}>{g.description}</p>
                </Opt>
                <PageLink to="/shop" link={link} className="gs-btn">
                  دیدن محصولات
                </PageLink>
              </div>
            </article>
          );
        })}
        {editing && (
          <span className="gs-add" {...ed("site.gallery", "newimage", "افزودن عکس به گالری")}>
            + افزودن عکس
          </span>
        )}
      </section>
    </>
  );
}

/** A message to the shop, saved for the owner's inbox in the panel. */
function MessageForm({ view }: { view: GView }) {
  return (
    <form method="post" action={view.link("/_form")} className="gs-message">
      <FormMeta kind="contact" back={view.page} />
      <input name="name" placeholder="نام شما" aria-label="نام شما" />
      <textarea name="body" required rows={6} placeholder="پیام شما" aria-label="پیام شما" />
      <button type="submit" className="gs-btn">
        ارسال پیام
      </button>
    </form>
  );
}

/**
 * An OpenStreetMap view around the position in a map link: Google Maps ("@35.7,51.4" or "q=35.7,51.4"),
 * OpenStreetMap ("mlat=…&mlon=…"), Neshan or Balad ("35.7,51.4" in the address). None: no map.
 */
export function mapEmbed(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const m = url.match(/mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/) ?? url.match(/[@=/,]?(-?\d{1,2}\.\d{3,})[,/](-?\d{1,3}\.\d{3,})/);
  if (!m) return undefined;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return undefined;
  const d = 0.006;
  const box = [lon - d, lat - d / 2, lon + d, lat + d / 2].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${lat},${lon}`;
}

function Contact(view: GView) {
  const { ctx, shop, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const rows: { icon: string; label: string; value?: string; path: string; href?: string }[] = [
    { icon: "phone", label: "تلفن", value: b.phone, path: "basics.phone", href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined },
    { icon: "clock", label: "ساعت کاری", value: site?.contactNote, path: "site.contactNote" },
    { icon: "pin", label: "نشانی", value: site?.address || b.location, path: "site.address" },
  ];
  return (
    <>
      <Banner view={view} title="تماس با ما" />
      <section className="gs-wrap gs-sec">
        <div className="gs-contact-row">
          {rows.map((r) => (
            <Opt key={r.path} value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
              <div className="gs-contact-item">
                {r.icon === "clock" ? <Svg name="clock" /> : <Icon name={r.icon} className="gs-ico" />}
                <small>{r.label}</small>
                {r.href ? (
                  <a href={r.href} dir="auto" {...ed(r.path, "text", r.label)}>
                    {r.value}
                  </a>
                ) : (
                  <span {...ed(r.path, "text", r.label)}>{r.value}</span>
                )}
              </div>
            </Opt>
          ))}
        </div>
        {mapEmbed(map) ? (
          <div className="gs-map-frame" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
            <iframe src={mapEmbed(map)} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
            <a href={map} {...outside(map)} className="gs-btn small">
              مسیریابی
            </a>
          </div>
        ) : (
        <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
          <a href={map ?? "#"} {...outside(map)} className="gs-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
            <Icon name="pin" className="gs-ico" />
            <span>مسیریابی روی نقشه</span>
          </a>
        </Opt>
        )}
      </section>
      <section className="gs-wrap gs-sec gs-contact-form">
        <Opt value={shop.bestTitle} editing={editing} edit={ed("site.shop.bestTitle", "text", "تیتر فرم")}>
          <h2 className="gs-h" {...ed("site.shop.bestTitle", "text", "تیتر فرم")}>
            {shop.bestTitle}
          </h2>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
          <p className="gs-muted" {...ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
            {site?.contactText}
          </p>
        </Opt>
        <MessageForm view={view} />
      </section>
    </>
  );
}

/* ───────────── All products / a category ───────────── */

function Listing(view: GView & { categoryId?: string }) {
  const { shop, link, categoryId, visitor } = view;
  const { list, cats, cat, active } = filterProducts(visible(shop), shop.categories ?? [], visitor.query, categoryId);
  const title = cat?.name ?? "فروشگاه";
  const here = categoryId ? `/category/${categoryId}` : "/shop";
  const popular = visible(shop).filter((p) => p.featured).slice(0, 3);
  return (
    <>
      <Banner view={view} title={title} trail={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : undefined} />
      <section className="gs-wrap gs-plp">
        <div className="gs-plp-main">
          <div className="gs-plp-head">
            <h2 className="gs-h">{title}</h2>
            <small>{fa(list.length)} محصول</small>
            <SortMenu view={view} here={here} />
          </div>
          {list.length ? (
            <div className="gs-grid gs-grid3">
              {list.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} />
              ))}
            </div>
          ) : (
            <p className="gs-notice">{active ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
        </div>
        <aside className="gs-side">
          <form method="get" action={link("/search")} className="gs-side-search">
            <input name="q" placeholder="جست‌وجوی محصول..." aria-label="جست‌وجوی محصول" />
            <button type="submit" aria-label="جست‌وجو">
              <Svg name="search" />
            </button>
          </form>
          <div className="gs-side-box">
            <h3>دسته‌ها</h3>
            <nav className="gs-side-cats">
              <PageLink to="/shop" link={link} current={!cat}>
                همه‌ی گل‌ها
              </PageLink>
              {cats.map((c) => (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
                  {c.name}
                </PageLink>
              ))}
            </nav>
          </div>
          <PriceFilter view={view} here={here} />
          <form method="get" action={link(here)} className="gs-side-box gs-checks">
            <h3>فقط</h3>
            {Object.entries(visitor.query)
              .filter(([k, v]) => v && !["sale", "stock"].includes(k))
              .map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <label>
              <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(visitor.query.sale)} /> تخفیف‌دارها
            </label>
            <label>
              <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(visitor.query.stock)} /> کالاهای موجود
            </label>
            <button type="submit" className="gs-btn small">
              اعمال
            </button>
          </form>
          {popular.length > 0 && (
            <div className="gs-side-box">
              <h3>پرطرفدارها</h3>
              {popular.map((p) => (
                <PageLink key={p.id} to={productPath(p)} link={link} className="gs-pop">
                  <span className="gs-pop-pic">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
                  <span>
                    {p.name}
                    <Price view={view} p={p} />
                  </span>
                </PageLink>
              ))}
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

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

/** "Sort: newest ▾": opens a short list; each choice is a tiny form, so no script is needed. */
function SortMenu({ view, here }: { view: GView; here: string }) {
  const q = view.visitor.query;
  const now = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  return (
    <details className="gs-sort">
      <summary>
        مرتب‌سازی: {now[1]}
        <Svg name="down" />
      </summary>
      <div className="gs-sort-list">
        {SORTS.map(([k, label]) => (
          <form key={k} method="get" action={view.link(here)}>
            <Keep query={q} skip={["sort"]} />
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

/** Price filter of the side column: two handles on one line (plain range inputs) and a filter button. */
function PriceFilter({ view, here }: { view: GView; here: string }) {
  const prices = visible(view.shop).map(unitPrice);
  if (!prices.length) return null;
  const step = 50000;
  const lo = Math.floor(Math.min(...prices) / step) * step;
  const hi = Math.max(lo + step, Math.ceil(Math.max(...prices) / step) * step);
  const q = view.visitor.query;
  const read = (v: string | undefined, d: number) => {
    const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
    return n ? Math.min(hi, Math.max(lo, n)) : d;
  };
  const min = read(q.min, lo);
  const max = read(q.max, hi);
  return (
    <form method="get" action={view.link(here)} className="gs-side-box gs-price-filter">
      <h3>فیلتر بر اساس قیمت</h3>
      <Keep query={q} skip={["min", "max"]} />
      <div className="gs-range">
        <input type="range" name="min" min={lo} max={hi} step={step} defaultValue={min} aria-label="کمترین قیمت" />
        <input type="range" name="max" min={lo} max={hi} step={step} defaultValue={max} aria-label="بیشترین قیمت" />
      </div>
      <div className="gs-range-foot">
        <small>
          قیمت: {money(view, min)} تا {money(view, max)}
        </small>
        <button type="submit" className="gs-btn small">
          فیلتر
        </button>
      </div>
    </form>
  );
}

/** The "filter and sort" bar of the search page: opens a panel with the shared filter form (no script). */
function Filters({ view, here, cats, fixedCategory, active, count }: { view: GView; here: string; cats: Shop["categories"]; fixedCategory?: boolean; active: boolean; count: number }) {
  return (
    <details className="gs-filter" open={active || undefined}>
      <summary>
        <span>
          <Svg name="filter" /> فیلتر و مرتب‌سازی{active && <i className="gs-filter-on" aria-label="فیلتر فعال است" />}
        </span>
        <small>{fa(count)} محصول</small>
      </summary>
      <FilterForm link={view.link} here={here} query={view.visitor.query} cats={cats} fixedCategory={fixedCategory} className="gs-filter-form" submitClass="gs-btn" resetClass="gs-link" />
    </details>
  );
}

/* ───────────── Product ───────────── */

function ProductPage(view: GView & { id: string }) {
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
      <section className="gs-wrap gs-product" data-product={p.id}>
        <div className="gs-gallery">
          {(imgs.length ? imgs : [undefined]).map((src, k) =>
            src ? (
              <ZoomOpen key={k} id={`${p.id}-${k}`} className={`gs-gal${k === 0 ? " first" : ""}`}>
                <span>
                  <img src={src} alt={p.name} />
                </span>
              </ZoomOpen>
            ) : (
              <span key={k} className="gs-gal first" />
            ),
          )}
        </div>
        <div className="gs-info-col">
          <nav className="gs-trail dark">
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
            <span className="gs-save">
              <b>{fa(percentOff(p))}٪ تخفیف</b> · {money(view, p.price - unitPrice(p))} صرفه‌جویی
            </span>
          )}
          <SaleClock p={p} />
          {p.description && (
            <p className="gs-desc">
              {p.description}
            </p>
          )}
          {soldOut ? (
            <p className="gs-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="gs-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value="/cart" />
              <OptionPicker p={p} />
              <div className="gs-buy-row">
                <label className="gs-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" className="gs-btn">
                  افزودن به سبد خرید
                </button>
              </div>
            </form>
          )}
          <Act view={view} op="wish" id={p.id} className="gs-under" label="علاقه‌مندی">
            <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
          </Act>
          <ul className="gs-assure">
            <li>
              <Svg name="truck" /> ارسال به سراسر کشور
            </li>
            <li>
              <Svg name="shield" /> ضمانت اصل بودن کالا
            </li>
          </ul>
        </div>
      </section>
      <section className="gs-wrap gs-sec gs-about">
        <SpecsTable p={p} className="gs-specs" />
        <Reviews p={p} link={link} page={view.page} visitor={visitor} />
      </section>
      {related.length > 0 && (
        <section className="gs-wrap gs-sec">
          <Title title="محصولات مشابه" />
          <div className="gs-grid">
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

function Cart(view: GView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <>
      <Banner view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="gs-wrap gs-cart">
          <div className="gs-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="gs-line">
                <PageLink to={productPath(l.product)} link={link} className="gs-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="gs-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && <small>سایز: {l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="gs-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{new Intl.NumberFormat("fa-IR").format(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="gs-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="gs-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="gs-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="gs-off">− {money(view, cart.discount)}</dd>
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
            <PageLink to="/checkout" link={link} className="gs-btn wide">
              ادامه و ثبت سفارش
            </PageLink>
          </aside>
        </section>
      )}
    </>
  );
}

function Wishlist(view: GView) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <>
      <Banner view={view} title="علاقه‌مندی‌ها" />
      {items.length === 0 ? (
        <>
          <h2 className="gs-wrap gs-big">فهرست علاقه‌مندی‌ها</h2>
          <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
        </>
      ) : (
        <section className="gs-wrap gs-sec">
          <h2 className="gs-big">فهرست علاقه‌مندی‌ها</h2>
          <div className="gs-grid">
            {items.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Search(view: GView) {
  const q = (view.visitor.query.q ?? "").trim();
  const { list: found, cats, active } = filterProducts(visible(view.shop), view.shop.categories ?? [], view.visitor.query);
  const words = active ? [q || " "] : [];
  return (
    <section className="gs-wrap gs-search">
      <form method="get" action={view.link("/search")} className="gs-search-box">
        <input name="q" defaultValue={q} placeholder="چه چیزی می‌خواهید؟" aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <Filters view={view} here="/search" cats={cats} active={active} count={found.length} />
      {words.length > 0 &&
        (found.length ? (
          <div className="gs-grid">
            {found.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        ) : (
          <p className="gs-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
        ))}
    </section>
  );
}

/* ───────────── Checkout and confirmation ───────────── */

function Checkout(view: GView) {
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
      <section className="gs-wrap gs-cart">
        <form method="post" action={link("/_order")} className="gs-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="gs-error">{error}</p>}
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
          <input name="website" tabIndex={-1} autoComplete="off" className="gs-trap" aria-hidden="true" />
          <button type="submit" className="gs-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="gs-sum">
          <h2>سفارش شما</h2>
          <ul className="gs-sum-lines">
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
                <dd className="gs-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && <p className="gs-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>{shop.paymentNote}</p>}
        </aside>
      </section>
    </>
  );
}

function Account(view: GView) {
  return (
    <>
      <Banner view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <section className="gs-wrap gs-sec">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: GView) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <>
      <Banner view={view} title="سفارش ثبت شد" />
      <section className="gs-wrap gs-thanks">
        <span className="gs-check" aria-hidden="true">
          ✓
        </span>
        <h2>ممنون از خرید شما!</h2>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="gs-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="gs-btn">
          بازگشت به فروشگاه
        </PageLink>
      </section>
    </>
  );
}

/* ───────────── Example content ───────────── */

export function golsaraSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`gs-${n}`);
  const cats = [
    { id: "c1", name: "دسته‌گل" },
    { id: "c2", name: "باکس گل" },
    { id: "c3", name: "رز" },
    { id: "c4", name: "لاله" },
    { id: "c5", name: "گل‌های ترکیبی" },
  ];
  const d = "گل‌ها همان روز سفارش از بازار گل تهیه و با دقت بسته‌بندی می‌شوند. اگر رنگ یا گل خاصی مدنظرتان است، در توضیحات سفارش بنویسید.";
  const care = [
    { label: "ماندگاری", value: "۵ تا ۷ روز" },
    { label: "نگهداری", value: "دور از آفتاب مستقیم و بخاری" },
    { label: "آب", value: "هر دو روز یک‌بار عوض شود" },
  ];
  const soon = (days: number) => new Date(Date.now() + days * 86400000 + 4 * 3600000).toISOString();
  const products: Product[] = [
    { id: "g1", name: "دسته‌گل لاله‌ی هلویی", categoryId: "c4", price: 1650000, salePrice: 1290000, saleEndsAt: soon(2), badge: "حراج", featured: true, images: [img("p1")], description: d, specs: care },
    { id: "g2", name: "دسته‌گل بهاری ساده", categoryId: "c5", price: 1450000, featured: true, images: [img("p2")], description: d, specs: care },
    { id: "g3", name: "باکس رز قرمز", categoryId: "c2", price: 2350000, featured: true, images: [img("p3")], description: d, specs: care },
    { id: "g4", name: "دسته‌گل لطیف صورتی", categoryId: "c5", price: 2650000, salePrice: 2090000, saleEndsAt: soon(4), badge: "حراج", featured: true, images: [img("p4")], description: d, specs: care },
    { id: "g5", name: "باکس رز سفید", categoryId: "c2", price: 2900000, images: [img("p5")], description: d, specs: care },
    { id: "g6", name: "دسته‌گل لاله‌ی بنفش", categoryId: "c4", price: 1890000, images: [img("p6")], description: d, specs: care },
    { id: "g7", name: "باکس رز صورتی کوچک", categoryId: "c2", price: 1590000, images: [img("p7")], description: d, specs: care },
    { id: "g8", name: "دسته‌گل رز «دلبر»", categoryId: "c3", price: 1990000, images: [img("p8")], description: d, specs: care },
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "گل‌سرا",
      jobTitle: "گل‌فروشی از ۱۳۸۰",
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان شریعتی، پلاک ۱۲۰",
      summary: "گل‌ها مردم را شادتر می‌کنند؛ آفتاب و داروی جان‌اند. دسته‌گل و باکس گل تازه با ارسال همان‌روز در تهران.",
      links: [
        { id: "gl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "gl2", type: "telegram", url: "https://t.me/example" },
        { id: "gl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "gl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "gl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      address: "تهران، خیابان شریعتی، پلاک ۱۲۰",
      contactNote: "هر روز، ۸ صبح تا ۹ شب",
      contactTitle: "با ما در تماس باشید",
      contactText: "برای سفارش‌های خاص، تزیین مراسم یا هر سؤالی پیام بگذارید؛ همان روز پاسخ می‌دهیم.",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.77380&mlon=51.44370#map=16/35.77380/51.44370",
      styleTitle: "گل‌فروشی همیشگی شما",
      styleText: "ساختن زیبایی از سال ۱۳۸۰",
      heroImage: img("bride"),
      accentImage: img("front"),
      aboutTitle: "در همه‌ی زمینه‌های گل‌آرایی کنار شما هستیم",
      aboutText:
        "زیبایی‌های این دنیا را گاهی فراموش می‌کنیم: گل‌ها، درخت‌ها، پرنده‌ها و ابرها. ما گل‌سرا را ساختیم تا بهترین گل‌ها و هدیه‌ها را با خدمتی صمیمی و سریع به دستتان برسانیم.",
      aboutImage: img("shop"),
      signatureImage: img("shelf2"),
      gallery: [
        { id: "ga1", title: "گل‌های تازه‌ی هر روز", image: img("gal1"), description: "هر صبح گل‌ها را تازه از بازار گل می‌آوریم تا دسته‌گل شما روزها شاداب بماند." },
        { id: "ga2", title: "گل‌آرایی با سلیقه", image: img("gal2"), description: "هر دسته‌گل را با دست و با توجه به سلیقه و مناسبت شما می‌چینیم." },
        { id: "ga3", title: "ترکیب‌های تازه و خاص", image: img("gal3"), description: "ترکیب‌های فصلی با رنگ‌های ملایم برای هدیه‌هایی که به یاد می‌مانند." },
      ],
      shop: {
        categories: cats.map((c) => ({ ...c, image: "" })),
        products,
        heroKicker: "ساخته‌شده با عشق",
        slides: [
          { id: "h1", title: "وقتی کلمه‌ها کافی نیستند", text: "دسته‌گل‌های آماده و سفارشی", image: img("hero") },
          { id: "h2", title: "گل تازه، همان روز", text: "ارسال در کمتر از سه ساعت در تهران", image: img("gal3") },
        ],
        newTitle: "طراوت بهار را به خانه‌تان بیاورید",
        newText: "زیبایی‌های این دنیا را گاهی فراموش می‌کنیم: گل‌ها، درخت‌ها و ابرها. چون هر روز می‌بینیمشان، کمتر نگاهشان می‌کنیم.",
        newImage: img("shelf1"),
        discoverTitle: "گل‌آرایی با\nدانش، علاقه، دل\nو جان",
        discoverImage: img("lily"),
        promoTitle: "کیفیت را تضمین می‌کنیم",
        promoText: "از انتخاب گل تا تحویل، هر مرحله را با دقت انجام می‌دهیم.",
        lookTitle: "دنبال چیزی خاص هستید؟ با ما تماس بگیرید",
        lookText: "گل‌آرایی مراسم، باکس‌های هدیه، گل خشک و مصنوعی و سبدهای خوراکی؛ هر چه بخواهید با کیفیت و خدمت صمیمی آماده می‌کنیم.",
        lookImage: img("story"),
        trendImage: img("vase"),
        showcaseTitle: "سؤالی دارید؟ با ما حرف بزنید",
        showcaseText: "پیامتان را بنویسید؛ در ساعت کاری همان روز پاسخ می‌دهیم.",
        bestTitle: "بیایید صحبت کنیم",
        discountTitle: "حراج گل",
        perks: [
          { id: "k1", title: "تضمین تازگی", text: "اگر گل تازه نبود، رایگان عوضش می‌کنیم." },
          { id: "k2", title: "کیفیت", text: "بهترین گل‌های بازار، با بسته‌بندی تمیز." },
          { id: "k3", title: "تجربه", text: "بیش از بیست سال گل‌آرایی." },
          { id: "k4", title: "حرفه‌ای", text: "گل‌آرایی مراسم و سفارش‌های سازمانی." },
        ],
        coupons: [
          { id: "q1", code: "GOL10", percent: 10, maxDiscount: 300000, active: true },
          { id: "q2", code: "ROSE", amount: 150000, minTotal: 1500000, categoryIds: ["c3", "c2"], active: true },
        ],
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "f1", q: "گل‌ها چقدر ماندگارند؟", a: "بیشتر دسته‌گل‌ها با نگهداری درست ۵ تا ۷ روز شاداب می‌مانند." },
          { id: "f2", q: "ارسال همان‌روز دارید؟", a: "بله، سفارش‌هایی که تا ساعت ۶ عصر ثبت شوند همان روز در تهران تحویل می‌شوند." },
          { id: "f3", q: "می‌توانم کارت پیام اضافه کنم؟", a: "بله، متن کارت را در توضیحات سفارش بنویسید؛ رایگان است." },
        ],
        pages: [
          { id: "pg1", slug: "terms", title: "قوانین و مقررات", text: "سفارش پس از تأیید تلفنی آماده می‌شود. در صورت نبودن گل انتخابی، با هماهنگی شما گل مشابه جایگزین می‌شود." },
        ],
        shippingFee: 90000,
        freeShippingFrom: 2500000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش، با شما تماس می‌گیریم و شماره‌ی کارت را اعلام می‌کنیم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی زمان ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.gs { --gs-ink: var(--color-text); --gs-line: var(--color-line); --gs-dark: #0B0B0C; --sk-accent: var(--gs-dark); --sk-card: var(--color-bg); --sk-line: var(--gs-line); --sk-soft: var(--gs-soft); --sk-muted: var(--color-muted); --sk-card-radius: 0; --gs-red: var(--color-primary); --gs-soft: color-mix(in srgb, var(--color-text) 5%, var(--color-bg)); --gs-wrap: min(1480px, 100% - 2 * clamp(14px, 3cqi, 44px));
  background: var(--color-bg); color: var(--color-text); min-height: 100%; }
.gs a { color: inherit; }
.gs button { font: inherit; color: inherit; }
.gs .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.gs-wrap { width: var(--gs-wrap); margin-inline: auto; }
.gs-ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.gs-act { display: contents; }
.gs-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--gs-dark); color: #fff !important; font-weight: 700; font-size: .92em; cursor: pointer; transition: transform .2s, background .2s; }
.gs-btn:hover { background: var(--gs-red); transform: translateY(-2px); }
.gs-btn.wide, .gs-btn.full { width: 100%; }
.gs-under { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: none; text-decoration: underline; text-underline-offset: 5px; font-size: .86em; cursor: pointer; }
.gs-notice { padding: 22px 30px; border-top: 3px solid var(--gs-red); background: var(--color-soft); }
.gs-error { padding: 12px 16px; border-radius: 10px; background: color-mix(in srgb, #E5484D 12%, var(--color-bg)); color: #C62A2F; }
.gs-sec { padding-block: clamp(40px, 6cqi, 80px); }
.gs-title { display: grid; justify-items: center; gap: 10px; margin-bottom: clamp(24px, 4cqi, 44px); text-align: center; }
.gs-title h2 { font-size: clamp(1.7em, 3.6cqi, 2.5em); font-weight: 600; }
.gs-title p { max-width: 34em; color: var(--color-muted); line-height: 1.9; }


/* Menu that opens without scripts (details element) */
.gs-menu > summary { list-style: none; }
.gs-menu > summary::-webkit-details-marker { display: none; }
.gs-burger .gs-burger-ico { width: 50px; height: 26px; stroke-width: 1.5; }
.gs-burger .gs-x { display: none; }
.gs-menu[open] > summary { position: fixed; top: 22px; inset-inline-start: 22px; z-index: 102; width: 44px; height: 44px; border-radius: 50%; background: var(--gs-red); color: #fff; }
.gs-menu[open] .gs-burger-ico { display: none; }
.gs-menu[open] .gs-x { display: block; width: 22px; height: 22px; stroke-width: 2; }
.gs-menu[open]::before { content: ""; position: fixed; inset: 0; z-index: 100; background: rgb(0 0 0 / .45); }
.gs-drawer { position: fixed; top: 0; inset-inline-end: 0; z-index: 101; display: flex; flex-direction: column; gap: 4px; width: min(360px, 86%); height: 100vh; padding: 28px 30px; overflow-y: auto; background: var(--color-bg); color: var(--gs-ink); box-shadow: 0 0 40px rgb(0 0 0 / .25); animation: gs-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes gs-drawer { from { transform: translateX(-100%); } }
.gs-drawer .gs-logo { margin-bottom: 22px; font-size: 2em; }
.gs-drawer a:not(.gs-logo) { padding: 11px 0; border-bottom: 1px solid var(--gs-line); font-weight: 500; }
.gs-drawer a[aria-current="page"], .gs-drawer a:hover { color: var(--gs-red); }
.gs-drawer hr { margin: 14px 0; border: none; }

/* Slider: hidden radio buttons pick the slide, the arrows are their labels */
.gs-hero { --gs-hero-h: clamp(440px, 36cqi, 660px); position: relative; background: var(--gs-soft); overflow: hidden; }
/* Hidden radios sit in the middle of the slider, which is on screen whenever its arrows are clicked, so picking one never scrolls. */
.gs-dot { position: absolute; top: 50%; left: 50%; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.gs h1, .gs h2, .gs h3 { line-height: 1.45; letter-spacing: normal; }
.gs-slides { display: grid; }
.gs-slide { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); height: var(--gs-hero-h); opacity: 0; visibility: hidden; transition: opacity .7s, visibility .7s; }
.gs-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.gs-dot:nth-of-type(${n}):checked ~ .gs-slides > .gs-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
/* Turning by itself: each slide shows for 6 seconds of a loop of all of them. */
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes gs-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.12).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.gs-n${n} .gs-auto:checked ~ .gs-slides > .gs-slide { animation: gs-cycle${n} ${n * 6}s infinite both; }
${Array.from({ length: n }, (_, k) => `.gs-n${n} .gs-auto:checked ~ .gs-slides > .gs-slide:nth-child(${k + 1}) { animation-delay: ${k * 6 - 0.4}s; }`).join("\n")}`;
  })
  .join("\n")}
.gs-hero:hover .gs-slide, .gs-hero:focus-within .gs-slide { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) { .gs-auto:checked ~ .gs-slides > .gs-slide { animation: none !important; } .gs-auto:checked ~ .gs-slides > .gs-slide:first-child { opacity: 1; visibility: visible; } }
.gs-slide-pic { position: relative; display: flex; justify-content: center; align-items: flex-end; min-height: 0; }
/* The picture is never stretched past its own size, and its edges fade into the background. */
.gs-slide-pic img { display: block; height: 100%; max-width: 100%; object-fit: contain; object-position: bottom; -webkit-mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); }
.gs-slide-text { display: grid; align-content: center; justify-items: start; gap: clamp(14px, 1.6cqi, 22px); padding: 30px clamp(20px, 5cqi, 80px) 30px 20px; }
.gs-slide-text h1, .gs-slide-text h2 { max-width: 14em; font-size: clamp(1.8em, 3.1cqi, 3.1em); font-weight: 600; line-height: 1.45; }
.gs-slide-text p { max-width: 30em; color: var(--color-muted); line-height: 1.95; }
.gs-slide > * { transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.gs-slide:not(:only-child) .gs-slide-text { transform: translateY(24px); }
${[1, 2, 3, 4, 5].map((n) => `.gs-dot:nth-of-type(${n}):checked ~ .gs-slides > .gs-slide:nth-child(${n}) .gs-slide-text`).join(", ")} { transform: none; }
.gs-arrows { display: flex; gap: 18px; margin-top: 8px; }
.gs-arrows label { display: grid; place-items: center; width: 40px; height: 40px; cursor: pointer; transition: color .2s, transform .2s; }
.gs-arrows label:hover { color: var(--gs-red); transform: scale(1.1); }
.gs-arrows .gs-ico { width: 34px; height: 34px; stroke-width: 1.3; }
.gs-dot:focus-visible ~ .gs-slides .gs-arrows label { outline: 1px dashed currentColor; }

.gs-bolt { width: 15px; height: 15px; fill: #F5C518; stroke: none; }

/* Product cards */
.gs-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px 22px; }
.gs-card { display: grid; gap: 8px; align-content: start; animation: gs-up .7s calc(var(--i) * 60ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.gs-card-pic { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.gs-img, .gs-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.gs-img img { object-fit: cover; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.gs-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; color: var(--color-muted); }
.gs-card:hover .gs-img img { transform: scale(1.06); }
.gs-badge { position: absolute; top: 12px; inset-inline-start: 12px; padding: 3px 12px; border-radius: 999px; background: #fff; color: #111; font-size: .78em; }
.gs-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; display: grid; gap: 8px; opacity: 0; transform: translateX(10px); transition: opacity .3s, transform .3s; }
.gs-card:hover .gs-card-acts, .gs-card-acts:focus-within { opacity: 1; transform: none; }
.gs-round { width: 40px; height: 40px; display: grid; place-items: center; border: none; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 6px 16px -8px rgb(0 0 0 / .4); cursor: pointer; transition: background .2s, color .2s; }
.gs-round:hover, .gs-round.on { background: var(--gs-red); color: #fff !important; }
.gs-round .gs-ico { width: 19px; height: 19px; }
.gs-card-name { margin-top: 6px; font-weight: 500; }
.gs-card-name:hover { color: var(--gs-red); }
.gs-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-size: .92em; }
.gs-price b { font-weight: 700; }
.gs-price s { color: var(--color-muted); font-size: .9em; }


${[1, 2, 3, 4].map((n) => `.gs-look:has(.gs-spot:nth-of-type(${n}) input:not(:checked)) .gs-look-card:nth-child(${n})`).join(", ")} { opacity: 0; visibility: hidden; transform: translateY(14px); }
@keyframes gs-pulse { from { transform: scale(1); opacity: .9; } to { transform: scale(1.7); opacity: 0; } }


.gs-row { display: grid; grid-template-columns: 140px 1fr auto; align-items: center; gap: 22px; }
.gs-row-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--color-soft); }
.gs-row-pic span, .gs-row-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.gs-row-pic img { object-fit: cover; transition: transform .5s; }
.gs-row:hover .gs-row-pic img { transform: scale(1.06); }
.gs-row-name { display: block; margin-bottom: 6px; font-weight: 500; }
.gs-bar { display: block; padding: 15px; border-radius: 999px; background: var(--gs-dark); color: #fff !important; text-align: center; font-weight: 700; }

.gs-stars { display: flex; gap: 4px; color: #F5A524; }
.gs-star { width: 16px; height: 16px; fill: currentColor; stroke: none; }
.gs-mini { display: flex; align-items: center; gap: 18px; padding: 18px 30px; border-top: 1px solid var(--gs-line); }
.gs-mini > span:first-child { position: relative; width: 90px; height: 90px; flex: none; overflow: hidden; background: var(--color-soft); }
.gs-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gs-mini > span:last-child { display: grid; gap: 6px; }


/* Footer and floating buttons */
.gs-foot { margin-top: clamp(20px, 3cqi, 40px); padding: clamp(46px, 6cqi, 80px) 0 26px; background: var(--gs-dark); color: #fff; text-align: center; }
.gs-foot .gs-wrap { display: grid; justify-items: center; gap: 26px; }
.gs-foot-text { max-width: 36em; color: #CFCFCF; line-height: 2; }
.gs-foot-socials a { border: 1px solid #4A4A4A; color: #fff; }
.gs-foot-socials a:hover { background: #fff; color: #111; }
.gs-copy { justify-self: stretch; text-align: start; color: #BDBDBD; }
.gs-off { color: #15803D; }
.gs-float { position: sticky; bottom: 18px; z-index: 20; display: flex; justify-content: flex-end; width: var(--gs-wrap); margin: -68px auto 18px; pointer-events: none; }
.gs-float > * { pointer-events: auto; }
.gs-top { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; background: #fff; color: #111; box-shadow: 0 8px 20px -10px rgb(0 0 0 / .4); }
.gs-top .gs-ico { transform: rotate(90deg); }

/* Inner pages */
.gs-banner { padding-block: clamp(16px, 2.2cqi, 26px); border-bottom: 1px solid var(--gs-line); background: var(--gs-soft); }
.gs-banner .gs-wrap { display: grid; gap: 6px; }
.gs-banner h1 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; font-size: clamp(1.35em, 2.4cqi, 1.9em); font-weight: 600; letter-spacing: -.01em; }
.gs-banner h1 small { color: var(--color-muted); font-size: .5em; font-weight: 400; letter-spacing: 0; }
.gs-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--color-muted); font-size: .85em; }
.gs-trail a { color: inherit; transition: color .2s; }
.gs-trail a:hover { color: var(--gs-ink); }
.gs-trail i { font-style: normal; margin-inline: 8px; opacity: .5; }
.gs-trail b { color: var(--gs-ink); font-weight: 600; }
.gs-trail.dark { justify-content: flex-start; color: var(--color-muted); font-weight: 400; font-size: .9em; }
.gs-empty { display: grid; justify-items: start; gap: 30px; padding-block: clamp(40px, 6cqi, 80px); }
.gs-empty .gs-notice { justify-self: stretch; }
.gs-big { padding-top: clamp(30px, 5cqi, 60px); font-size: clamp(1.8em, 4cqi, 2.8em); font-weight: 500; }
.gs-plp { padding-block: 14px clamp(40px, 6cqi, 80px); }

.gs-product { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(24px, 5cqi, 70px); padding-block: clamp(30px, 5cqi, 60px); }
.gs-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.gs-gal { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); cursor: zoom-in; }
.gs-gal.first { grid-column: 1 / -1; }
.gs-gal span, .gs-gal img { position: absolute; inset: 0; width: 100%; height: 100%; }
.gs-gal img { object-fit: cover; }
.gs-desc { color: var(--color-muted); line-height: 2; }
.gs-buy { display: grid; gap: 18px; padding-block: 18px; border-block: 1px solid var(--gs-line); }
.gs-sizes { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; border: none; }
.gs-sizes legend { margin-bottom: 10px; font-weight: 600; }
.gs-sizes label { cursor: pointer; }
.gs-sizes input { position: absolute; opacity: 0; }
.gs-sizes span { display: grid; place-items: center; min-width: 48px; height: 44px; padding: 0 10px; border: 1px solid var(--gs-line); border-radius: 10px; transition: background .2s, color .2s, border-color .2s; }
.gs-sizes input:checked + span { background: var(--gs-dark); border-color: var(--gs-dark); color: #fff; }
.gs-sizes input:focus-visible + span { outline: 2px solid var(--gs-red); }
.gs-buy-row { display: flex; gap: 12px; }
.gs-qty input { width: 80px; height: 100%; padding: 0 12px; border: 1px solid var(--gs-line); border-radius: 999px; background: var(--color-bg); color: var(--gs-ink); font: inherit; text-align: center; }
.gs-buy-row .gs-btn { flex: 1; }
.gs-assure { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; color: var(--color-muted); font-size: .9em; }
.gs-assure li { display: flex; align-items: center; gap: 10px; }

.gs-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-block: clamp(30px, 5cqi, 60px); }
.gs-lines { display: grid; border-top: 1px solid var(--gs-line); }
.gs-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--gs-line); }
.gs-line-pic { position: relative; display: block; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.gs-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gs-line-info { display: grid; gap: 4px; }
.gs-line-info small { color: var(--color-muted); }
.gs-stepper { display: flex; align-items: center; border: 1px solid var(--gs-line); border-radius: 999px; }
.gs-stepper button { width: 36px; height: 36px; border: none; background: none; font-size: 1.2em; cursor: pointer; }
.gs-stepper span { min-width: 24px; text-align: center; }
.gs-line-total { min-width: 8em; text-align: end; }
.gs-remove { width: 36px; height: 36px; display: grid; place-items: center; border: none; border-radius: 50%; background: none; color: var(--color-muted) !important; cursor: pointer; }
.gs-remove:hover { background: var(--color-soft); color: #C62A2F !important; }
.gs-sum { display: grid; gap: 16px; padding: 26px; background: var(--color-soft); position: sticky; top: 20px; }
.gs-sum h2 { font-size: 1.3em; font-weight: 600; }
.gs-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 0; }
.gs-sum dd { margin: 0; text-align: end; }
.gs-sum .total { padding-top: 12px; border-top: 1px solid var(--gs-line); font-weight: 700; font-size: 1.05em; }
.gs-sum small { color: var(--color-muted); }
.gs-sum-lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: .9em; }
.gs-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.gs-pay { padding: 14px 16px; border-radius: 12px; background: var(--color-bg); border: 1px dashed var(--gs-line); font-size: .88em; line-height: 1.9; }
.gs-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-content: start; }
.gs-checkout h2, .gs-checkout .full, .gs-checkout .gs-error { grid-column: 1 / -1; }
.gs-checkout h2 { font-size: 1.3em; font-weight: 600; }
.gs-checkout label { display: grid; gap: 8px; font-size: .9em; font-weight: 600; }
.gs-checkout input, .gs-checkout textarea { width: 100%; padding: 13px 16px; border: 1px solid var(--gs-line); border-radius: 12px; background: var(--color-bg); color: var(--gs-ink); font: inherit; font-weight: 400; transition: border-color .2s; }
.gs-checkout input:focus, .gs-checkout textarea:focus { outline: none; border-color: var(--gs-ink); }
.gs-trap { position: absolute; inset-inline-start: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.gs-thanks { display: grid; justify-items: center; gap: 16px; padding-block: clamp(40px, 6cqi, 80px); text-align: center; }
.gs-thanks p { max-width: 34em; line-height: 2; }
.gs-check { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, #16A34A 15%, var(--color-bg)); color: #16A34A; font-size: 2.2em; animation: gs-pop .7s cubic-bezier(.2, 1.5, .4, 1) backwards; }
@keyframes gs-pop { from { transform: scale(.3); opacity: 0; } }
.gs-search { display: grid; gap: 40px; padding-block: clamp(50px, 8cqi, 110px); }
.gs-search-box { display: flex; width: min(460px, 100%); margin-inline: auto; border: 1px solid var(--gs-line); }
.gs-search-box input { flex: 1; min-width: 0; padding: 20px 24px; border: none; background: var(--color-bg); color: var(--gs-ink); font: inherit; }
.gs-search-box input:focus { outline: none; }
.gs-search-box button { width: 64px; border: none; background: none; cursor: pointer; }

.gs-main > * { animation: gs-up .7s cubic-bezier(.2, 1, .3, 1) backwards; }

/* Sale: percent tag, sale row, time left, savings */
.gs-pct { position: absolute; bottom: 12px; inset-inline-start: 12px; padding: 3px 9px; border-radius: 999px; background: var(--gs-red); color: #fff; font-size: .74em; font-weight: 700; }
.gs-card-acts { z-index: 2; }
.gs-sale { padding-block: clamp(36px, 5cqi, 64px); background: var(--gs-soft); }
.gs-sale-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: clamp(18px, 3cqi, 30px); }
.gs-sale-kicker { display: inline-block; margin-bottom: 8px; padding: 4px 12px; border-radius: 999px; background: var(--gs-red); color: #fff; font-size: .8em; font-weight: 700; }
.gs-sale-head h2 { font-size: clamp(1.6em, 3.4cqi, 2.4em); font-weight: 600; }
.gs-sale-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(220px, calc((100% - 3 * 22px) / 4)); gap: 22px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: thin; }
.gs-sale-item { display: grid; gap: 8px; align-content: start; scroll-snap-align: start; }
.gs-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--gs-red); font-size: .8em; font-weight: 600; }
.gs-clock .gs-ico { width: 15px; height: 15px; }
.gs-save { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-self: start; padding: 5px 12px; border-radius: 999px; background: color-mix(in srgb, var(--gs-red) 10%, var(--color-bg)); color: var(--gs-red); font-size: .85em; }
.gs-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; border: 0; border-bottom: 1px solid currentColor; background: none; color: inherit; font: inherit; font-size: .9em; font-weight: 600; cursor: pointer; }
.gs-link .gs-ico { width: 16px; height: 16px; }
/* Filters: a bar that opens the filter form */
.gs-filter { margin: -14px 0 28px; border: 1px solid var(--gs-line); }
.gs-filter > summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 18px; cursor: pointer; list-style: none; font-weight: 600; }
.gs-filter > summary::-webkit-details-marker { display: none; }
.gs-filter > summary > span { display: inline-flex; align-items: center; gap: 8px; }
.gs-filter > summary small { color: var(--color-muted); font-weight: 400; }
.gs-filter[open] > summary { border-bottom: 1px solid var(--gs-line); }
.gs-filter-on { width: 8px; height: 8px; border-radius: 50%; background: var(--gs-red); }
.gs-filter-form { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; padding: 18px; }
.gs-filter-form input:not([type=checkbox]), .gs-filter-form select { border-radius: 0; }
.gs-filter-form .gs-btn { padding: 12px 22px; }
.gs-search .gs-filter { width: min(900px, 100%); margin: 22px auto 30px; }
.gs-about { display: grid; gap: clamp(28px, 4cqi, 48px); }
.gs-specs { width: min(760px, 100%); }
@container (max-width: 1100px) {
  .gs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gs-nav { display: none; }
  .gs-icons { margin-inline-start: auto; }
  .gs-slide-text h1, .gs-slide-text h2 { font-size: clamp(1.6em, 3.6cqi, 2.4em); }
}
@container (max-width: 820px) {
  .gs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
  .gs-card-acts { opacity: 1; transform: none; }
}
/* Phones, as in the reference: the slide picture sits behind centred text, only the bag and menu stay in the header */
@container (max-width: 820px) {
  .gs-filter-form { grid-template-columns: 1fr 1fr; }
  .gs-sale-row { grid-auto-columns: minmax(200px, 44%); }
}
@container (max-width: 600px) {
  .gs-filter-form { grid-template-columns: 1fr; }
  .gs-sale-row { grid-auto-columns: 62%; gap: 14px; }
  .gs-sale-head { align-items: flex-start; flex-direction: column; }
  .gs-hero { --gs-hero-h: clamp(380px, 112cqi, 460px); }
  .gs-slide { grid-template-columns: 1fr; }
  .gs-slide-pic { position: absolute; inset: 0; }
  .gs-slide-pic img { opacity: .55; -webkit-mask-image: none; mask-image: none; }
  .gs-slide-text { position: relative; justify-items: center; padding: 30px 18px; text-align: center; }
  .gs-slide-text p { color: var(--gs-ink); font-size: .9em; }
  .gs-icons > a:not(:first-child) { display: none; }
  .gs-head { padding: 14px 0; }
  .gs-burger .gs-burger-ico { width: 40px; }
  .gs-row { grid-template-columns: 90px 1fr; }
  .gs-row .gs-under { grid-column: 2; justify-self: start; }
  .gs-line { grid-template-columns: 72px minmax(0, 1fr) auto; }
  .gs-line .gs-stepper { grid-column: 2; }
  .gs-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; justify-self: end; }
  .gs-checkout { grid-template-columns: 1fr; }
  .gs-logo { font-size: 1.9em; }
  .gs-menu[open] > summary { top: 14px; inset-inline-start: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .gs-card, .gs-check, .gs-main > *, .gs-drawer { animation: none !important; }
  .gs-slide, .gs-slide > *, .gs-look-card { transition: none !important; }
}

/* ───── Golsara look: soft pink and gold, Nastaliq headings, narrow centred content (as in the reference) ───── */
@font-face { font-family: "Golsara Nastaliq"; src: url("/_assets/fonts/golsara-nastaliq.woff") format("woff"); font-display: swap; }
.gs { --gs-red: var(--color-primary); --gs-dark: var(--color-text); --gs-soft: #FDF6F3; --gs-script: "Golsara Nastaliq", var(--font-heading); --sk-accent: var(--color-text);
  --gs-wrap: min(1140px, 100% - 2 * clamp(20px, 7cqi, 120px)); font-size: 14px; font-weight: 300; }
.gs h1, .gs h2 { font-family: var(--gs-script); font-weight: 400; line-height: 2; }
.gs h3, .gs b, .gs strong { font-weight: 600; }
.gs-h { font-size: clamp(1.6em, 2.6cqi, 2.1em); text-align: center; }
.gs-lines { white-space: pre-line; }
.gs-muted { color: var(--color-muted); line-height: 1.9; text-align: center; }
.gs-sec { padding-block: clamp(36px, 5cqi, 70px); }
.gs-btn { padding: 9px 24px; border: 1px solid var(--gs-ink); border-radius: 0; background: var(--color-bg); color: var(--gs-ink) !important; font-size: .82em; font-weight: 600; box-shadow: 2px 2px 0 var(--gs-ink); transition: transform .2s, box-shadow .2s, background .2s, color .2s; }
.gs-btn:hover { background: var(--gs-ink); color: var(--color-bg) !important; transform: translate(2px, 2px); box-shadow: 0 0 0 var(--gs-ink); }
.gs-btn.small { padding: 6px 16px; font-size: .78em; }
.gs-kicker { color: var(--gs-red); font-size: .82em; font-weight: 600; }
.gs-lead { display: grid; justify-items: center; gap: 12px; width: min(520px, 100%); margin-inline: auto; text-align: center; }
.gs-lead h2 { max-width: 11em; font-size: clamp(1.7em, 2.8cqi, 2.3em); line-height: 1.9; }
.gs-lead p { color: var(--color-muted); font-size: .95em; line-height: 1.9; }
.gs-lead .gs-btn { margin-top: 10px; }
.gs-soft { background: linear-gradient(180deg, var(--gs-soft), var(--color-bg)); }
.gs-pic { position: relative; display: block; overflow: hidden; background: var(--gs-soft); }
.gs-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gs-notice { border-top-color: var(--gs-red); }

/* Header: small Nastaliq logo, a centred menu (gold with a short centred line under the item) and small icons.
   It stays on top and gets lower as the page scrolls (where the browser supports scroll-driven animation). */
.gs-head { display: block; gap: 0; padding: 0; position: sticky; top: 0; z-index: 30; background: var(--color-bg); border-bottom: 1px solid var(--gs-line); }
.gs-head-in { display: flex; align-items: center; gap: 24px; padding: 14px 0; }
@supports (animation-timeline: scroll()) {
  .gs-head-in { animation: gs-shrink linear both; animation-timeline: scroll(root); animation-range: 0 140px; }
  .gs-head .gs-logo { animation: gs-logo linear both; animation-timeline: scroll(root); animation-range: 0 140px; }
}
@keyframes gs-shrink { to { padding-block: 6px; } }
@keyframes gs-logo { to { transform: scale(.82); } }
.gs-logo { display: grid; justify-items: center; font-size: 1em; font-weight: 400; letter-spacing: 0; line-height: 1; transform-origin: center; }
.gs-logo b { font-family: var(--gs-script); font-size: 1.85em; font-weight: 400; line-height: 1.5; }
.gs-logo small { margin-top: .9em; color: var(--gs-red); font-size: .62em; font-weight: 400; word-spacing: 2px; }
.gs-nav { display: flex; gap: clamp(14px, 2.2cqi, 28px); margin-inline: auto; font-size: .86em; font-weight: 700; }
.gs-nav a { position: relative; padding: 8px 0; color: var(--gs-ink); transition: color .25s; }
.gs-nav a::after { content: ""; position: absolute; inset: auto; left: 50%; bottom: 0; width: 16px; height: 2px; background: currentColor; transform: translateX(-50%) scaleX(0); transition: transform .25s; }
.gs-nav a:hover, .gs-nav a[aria-current="page"] { color: var(--gs-red); }
.gs-nav a:hover::after, .gs-nav a[aria-current="page"]::after { transform: translateX(-50%) scaleX(1); }
.gs-icons { display: flex; align-items: center; gap: 16px; }
.gs-icon { position: relative; display: inline-flex; align-items: center; gap: 4px; color: var(--gs-ink); transition: color .2s; }
.gs-icon:hover { color: var(--gs-red); }
.gs-icon .gs-ico { width: 17px; height: 17px; stroke-width: 1.6; }
.gs-icon b { position: static; min-width: 0; height: auto; padding: 0; border-radius: 0; background: none; color: inherit; font-size: .8em; font-weight: 400; }
.gs-menu { display: none; }
.gs-drawer .gs-logo { display: none; }

/* Hero: the photo's own wooden board is the text card. The card is sized and placed with the same
   scale as the photo (object-fit: cover of a 1920×1180 picture), so it lies exactly on the board. */
.gs-hero { --gs-hero-h: clamp(330px, calc(100cqi * 1180 / 1920), 760px); --gs-s: max(calc(100cqi / 1920), calc(var(--gs-hero-h) / 1180)); background: var(--gs-soft); }
.gs-slide { position: relative; display: grid; grid-template-columns: 1fr; place-items: center; }
.gs-slide-pic { position: absolute; inset: 0; display: block; }
.gs-slide-pic img { width: 100%; height: 100%; max-width: none; opacity: 1; object-fit: cover; object-position: center; -webkit-mask-image: none; mask-image: none; }
.gs-slide-text { position: relative; box-sizing: border-box; display: grid; align-content: center; justify-items: center; gap: calc(14 * var(--gs-s)); width: calc(592 * var(--gs-s)); height: calc(556 * var(--gs-s)); padding: calc(40 * var(--gs-s)); background: rgb(243 232 223 / .94); outline: 1px solid #4A403A; outline-offset: calc(-24 * var(--gs-s)); text-align: center; translate: calc(8 * var(--gs-s)) calc(24 * var(--gs-s)); transform: none !important; }
.gs-slide-text h1, .gs-slide-text h2 { max-width: 9em; font-size: max(13px, calc(46 * var(--gs-s))); line-height: 1.8; color: #3B3330; }
.gs-slide-text p { color: var(--gs-red); font-size: max(10px, calc(22 * var(--gs-s))); line-height: 1.6; }
.gs-slide-text .gs-btn { padding: calc(14 * var(--gs-s)) calc(36 * var(--gs-s)); font-size: max(9px, calc(20 * var(--gs-s))); }
.gs-arrows { position: static; margin: 0; }
.gs-arrows label { position: absolute; top: 50%; translate: 0 -50%; width: 40px; height: 40px; color: #fff; filter: drop-shadow(0 1px 4px rgb(0 0 0 / .35)); }
.gs-arrows label:first-child { right: calc(-1 * (50cqi - 50%) + 16px); }
.gs-arrows label:last-child { left: calc(-1 * (50cqi - 50%) + 16px); }
.gs-arrows label:hover { color: #fff; }
.gs-arrows .gs-ico { width: 26px; height: 26px; }

/* Home: introduction (text beside a tall photo and a smaller one set a little lower) */
.gs-intro { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, .76fr); align-items: center; gap: 6px; width: min(860px, var(--gs-wrap)); padding-block: clamp(40px, 6cqi, 80px); }
.gs-intro-text { display: grid; justify-items: center; gap: 12px; padding-inline: 16px; text-align: center; }
.gs-intro-text h2 { max-width: 8em; font-family: inherit; font-size: clamp(1.25em, 2cqi, 1.6em); font-weight: 700; line-height: 1.6; }
.gs-intro-text p { font-family: var(--gs-script); color: var(--gs-red); font-size: 1.05em; line-height: 2; }
.gs-intro-big { align-self: start; aspect-ratio: 258 / 355; }
.gs-intro-small { align-self: start; aspect-ratio: 196 / 276; margin-top: 15%; }
.gs-home-grid { width: min(720px, var(--gs-wrap)); padding-top: 10px; }

/* Product cards: square pictures; category, name, gold price and an "add to cart" line, all centred */
.gs-grid { gap: 36px 20px; }
.gs-grid3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gs-card { gap: 5px; justify-items: center; text-align: center; }
.gs-card-pic { width: 100%; aspect-ratio: 1; margin-bottom: 8px; }
.gs-card-cat { color: var(--color-muted); font-size: .76em; }
.gs-card-name { margin: 0; font-size: .82em; font-weight: 700; }
.gs-card-name:hover { color: var(--gs-red); }
.gs-price { justify-content: center; color: var(--gs-red); font-family: var(--gs-script); }
.gs-price b { font-weight: 400; }
.gs-add-cart { padding: 0; border: none; background: none; color: var(--gs-red) !important; font-family: var(--gs-script); font-size: .92em; cursor: pointer; opacity: .85; transition: opacity .2s; }
.gs-add-cart:hover { opacity: 1; text-decoration: underline; text-underline-offset: 6px; }
.gs-badge { top: 8px; inset-inline-start: 50%; translate: 50% 0; padding: 1px 8px; border: 1px solid var(--gs-ink); border-radius: 0; background: var(--color-bg); color: var(--gs-ink); font-size: .66em; font-weight: 700; }
.gs-pct { border-radius: 0; background: var(--gs-red); }
.gs-round { width: 34px; height: 34px; border-radius: 0; }
.gs-sale { background: var(--gs-soft); }
.gs-sale .gs-wrap { width: min(860px, var(--gs-wrap)); }
.gs-sale-kicker { border-radius: 0; background: var(--gs-red); }
.gs-sale-head h2 { font-size: 1.9em; }

/* Home: address, phone and hours; the middle box is framed */
.gs-touch { display: grid; gap: clamp(20px, 3cqi, 34px); width: min(720px, var(--gs-wrap)); }
.gs-touch .gs-h { font-size: clamp(1.7em, 3cqi, 2.3em); }
.gs-touch-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: center; gap: 16px; }
.gs-touch-box { display: grid; gap: 6px; padding: 20px 12px; text-align: center; }
.gs-touch-row > :nth-child(2) { border: 2px solid var(--gs-ink); }
.gs-touch-box h3 { font-size: .92em; font-weight: 700; }
.gs-touch-box p, .gs-touch-box a { color: var(--gs-ink); font-size: .86em; }

/* Inner pages: the name in Nastaliq with a small trail under it */
.gs-banner { padding: 22px 0 18px; border-bottom: 1px solid var(--gs-line); background: var(--color-bg); text-align: center; }
.gs-banner .gs-wrap { justify-items: center; gap: 0; }
.gs-banner h1 { display: block; font-size: clamp(1.6em, 2.6cqi, 2.1em); line-height: 1.9; }
.gs-trail { justify-content: center; font-size: .78em; }
.gs-trail a { font-weight: 600; color: var(--gs-ink); }
.gs-trail b { color: var(--gs-red); font-weight: 400; }
.gs-trail small { margin-inline-start: 12px; color: var(--color-muted); }

/* About us */
.gs-about-top { padding-bottom: 10px; }
.gs-trio { display: grid; grid-template-columns: 1fr 1.25fr 1fr; align-items: center; width: min(640px, var(--gs-wrap)); padding-top: clamp(26px, 4cqi, 50px); }
.gs-trio > .gs-pic { aspect-ratio: 3 / 4.2; box-shadow: 0 16px 30px -24px rgb(0 0 0 / .5); }
.gs-trio > .gs-trio-mid { z-index: 1; aspect-ratio: 3 / 4; margin-inline: -3%; }
.gs-story { display: grid; gap: clamp(26px, 4cqi, 46px); }
.gs-story-pic { width: min(720px, 100%); margin-inline: auto; aspect-ratio: 2.2 / 1; box-shadow: 0 24px 40px -30px rgb(0 0 0 / .6); }

/* Our services */
.gs-svc-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: clamp(20px, 6cqi, 70px); width: min(680px, var(--gs-wrap)); padding-block: clamp(30px, 5cqi, 56px); }
.gs-svc-top > .gs-pic { aspect-ratio: 337 / 288; }
.gs-svc-top h1 { font-size: clamp(1.4em, 2.4cqi, 1.9em); line-height: 1.9; text-align: start; }
.gs-perks { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: clamp(16px, 3cqi, 36px); width: min(680px, 100%); margin: clamp(26px, 4cqi, 46px) auto 0; }
.gs-perk-col { display: grid; gap: clamp(26px, 4cqi, 50px); }
.gs-perk { display: grid; justify-items: center; gap: 8px; text-align: center; }
.gs-perk-ico { color: var(--gs-ink); }
.gs-perk-ico .gs-ico { width: 30px; height: 30px; stroke-width: 1.2; }
.gs-perk h3 { font-size: .86em; font-weight: 700; }
.gs-perk p { color: var(--color-muted); font-size: .84em; line-height: 1.8; }
.gs-perks-pic { aspect-ratio: 142 / 197; }
.gs-message { display: grid; grid-template-columns: 1fr; gap: 14px; width: min(420px, 100%); margin: 24px auto 0; }
.gs-message input, .gs-message textarea { width: 100%; padding: 9px 12px; border: 1px solid #EEE7E3; background: var(--color-bg); color: var(--gs-ink); font: inherit; font-size: .88em; }
.gs-message input:focus, .gs-message textarea:focus { outline: none; border-color: var(--gs-red); }
.gs-message .gs-btn { justify-self: start; }

/* Gallery: a narrow column; picture and text change sides on every row; the picture opens large */
.gs-album { display: grid; gap: clamp(26px, 4cqi, 40px); width: min(660px, var(--gs-wrap)); padding-top: clamp(26px, 4cqi, 40px); }
.gs-alb { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); align-items: center; gap: clamp(20px, 5cqi, 56px); }
.gs-alb:nth-child(even) { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
.gs-alb:nth-child(even) .gs-alb-pic { order: 2; }
.gs-alb-pic { position: relative; display: block; overflow: hidden; background: var(--gs-soft); cursor: zoom-in; }
.gs-alb-pic span { display: block; }
.gs-alb-pic img { display: block; width: 100%; height: auto; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.gs-alb-pic:hover img { transform: scale(1.04); }
.gs-alb-text { display: grid; justify-items: center; gap: 14px; text-align: center; }
.gs-alb-text h2 { font-family: inherit; font-size: 1.15em; font-weight: 700; line-height: 1.7; }
.gs-alb-text p { color: var(--color-muted); font-size: .88em; line-height: 1.9; }
.gs-add { display: grid; place-items: center; padding: 26px; border: 1px dashed var(--gs-line); color: var(--color-muted); cursor: pointer; }

/* Contact */
.gs-contact-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: min(720px, 100%); margin-inline: auto; }
.gs-contact-item { display: grid; justify-items: center; gap: 8px; text-align: center; color: var(--color-muted); font-size: .9em; }
.gs-contact-item .gs-ico, .gs-contact-item .p-ico { width: 22px; height: 22px; color: var(--gs-red); stroke-width: 1.4; }
.gs-contact-item small { color: var(--gs-ink); font-weight: 700; }
.gs-map-frame { position: relative; width: min(720px, 100%); margin: clamp(26px, 4cqi, 40px) auto 0; aspect-ratio: 2.1 / 1; border: 1px solid var(--gs-line); background: var(--gs-soft); }
.gs-map-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.gs-map-frame .gs-btn { position: absolute; bottom: 12px; inset-inline-start: 12px; }
.gs-map { display: grid; place-items: center; gap: 10px; width: min(720px, 100%); margin: clamp(26px, 4cqi, 40px) auto 0; padding: clamp(36px, 6cqi, 70px) 20px; border: 1px solid var(--gs-line); background: repeating-linear-gradient(45deg, var(--gs-soft) 0 14px, var(--color-bg) 14px 28px); font-weight: 700; transition: border-color .2s; }
.gs-map:hover { border-color: var(--gs-red); color: var(--gs-red); }
.gs-map .gs-ico, .gs-map .p-ico { width: 30px; height: 30px; color: var(--gs-red); }
.gs-contact-form { display: grid; gap: 8px; padding-top: 0; }

/* Shop: products beside a narrow side column with search, categories, a price slider and popular flowers */
.gs-plp { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: clamp(24px, 4cqi, 46px); align-items: start; width: min(900px, var(--gs-wrap)); padding-block: clamp(26px, 4cqi, 50px); }
.gs-plp-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; margin-bottom: 20px; }
.gs-plp-head h2 { font-size: 1.9em; text-align: start; }
.gs-plp-head small { margin-inline-start: auto; color: var(--color-muted); font-size: .82em; }
.gs-sort { position: relative; flex-basis: 100%; font-size: .84em; }
.gs-sort > summary { display: inline-flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 180px; padding: 6px 10px; border: 1px solid #EEE7E3; color: var(--color-muted); cursor: pointer; list-style: none; }
.gs-sort > summary::-webkit-details-marker { display: none; }
.gs-sort .gs-ico { width: 14px; height: 14px; }
.gs-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 180px; border: 1px solid #EEE7E3; background: var(--color-bg); box-shadow: 0 10px 24px -14px rgb(0 0 0 / .3); }
.gs-sort-list button { width: 100%; padding: 8px 10px; border: none; background: none; text-align: start; cursor: pointer; }
.gs-sort-list button:hover, .gs-sort-list button[aria-current] { background: var(--gs-soft); color: var(--gs-red); }
.gs-side { display: grid; gap: 26px; }
.gs-side-search { display: flex; border: 1px solid #EEE7E3; }
.gs-side-search input { flex: 1; min-width: 0; padding: 7px 10px; border: none; background: none; color: var(--gs-ink); font: inherit; font-size: .84em; }
.gs-side-search input::placeholder { color: var(--gs-red); opacity: .7; }
.gs-side-search input:focus { outline: none; }
.gs-side-search button { padding-inline: 10px; border: none; background: none; cursor: pointer; }
.gs-side-search .gs-ico { width: 14px; height: 14px; }
.gs-side-box { display: grid; gap: 10px; padding-top: 22px; border-top: 1px solid var(--gs-line); }
.gs-side-box h3 { font-size: .84em; font-weight: 700; }
.gs-side-cats { display: grid; }
.gs-side-cats a { padding: 7px 0; border-bottom: 1px solid var(--gs-line); font-size: .84em; font-weight: 500; transition: color .2s; }
.gs-side-cats a:hover, .gs-side-cats a[aria-current="page"] { color: var(--gs-red); }
.gs-range { position: relative; height: 18px; margin-top: 4px; }
.gs-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: var(--gs-ink); }
.gs-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.gs-range input::-webkit-slider-thumb { width: 12px; height: 12px; border: none; border-radius: 50%; background: var(--gs-ink); cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.gs-range input::-moz-range-thumb { width: 12px; height: 12px; border: none; border-radius: 50%; background: var(--gs-ink); cursor: pointer; pointer-events: auto; }
.gs-range input::-webkit-slider-runnable-track { background: none; }
.gs-range input::-moz-range-track { background: none; }
.gs-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.gs-range-foot small { font-size: .78em; font-weight: 600; line-height: 1.7; }
.gs-checks label { display: flex; align-items: center; gap: 8px; font-size: .84em; }
.gs-checks .gs-btn { justify-self: start; }
.gs-pop { display: flex; align-items: center; gap: 10px; font-size: .8em; font-weight: 600; }
.gs-pop:hover { color: var(--gs-red); }
.gs-pop-pic { position: relative; width: 44px; height: 44px; flex: none; overflow: hidden; border-radius: 50%; background: var(--gs-soft); }
.gs-pop-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gs-pop > span:last-child { display: grid; gap: 0; }
.gs-pop .gs-price { justify-content: flex-start; font-size: .95em; }

/* Footer: pale pink, centred, newsletter and small social icons */
.gs-foot { margin-top: clamp(30px, 5cqi, 60px); padding: clamp(36px, 5cqi, 56px) 0 18px; border-top: 1px solid var(--gs-line); background: #FFFAF8; color: var(--gs-ink); text-align: center; }
.gs-foot .gs-wrap { gap: 16px; }
.gs-foot .gs-logo b { font-size: 2.6em; }
.gs-foot .gs-logo small { font-size: .7em; }
.gs-foot-text { max-width: 24em; color: var(--color-muted); font-size: .86em; line-height: 1.8; }
.gs-news { display: flex; gap: 6px; width: min(400px, 100%); }
.gs-news input { flex: 1; min-width: 0; padding: 7px 10px; border: 1px solid #EEE7E3; background: #fff; color: var(--gs-ink); font: inherit; font-size: .84em; }
.gs-news input:focus { outline: none; border-color: var(--gs-red); }
.gs-news button { padding: 6px 18px; border: 1px solid var(--gs-ink); background: var(--color-bg); font-size: .78em; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 var(--gs-ink); transition: background .2s, color .2s, box-shadow .2s, transform .2s; }
.gs-news button:hover { background: var(--gs-ink); color: var(--color-bg); box-shadow: none; transform: translate(2px, 2px); }
.gs-foot-socials { margin-top: 10px; gap: 6px; }
.gs-foot-socials a { width: 28px; height: 28px; border: none; color: var(--gs-ink); }
.gs-foot-socials a:hover { background: none; color: var(--gs-red); }
.gs-copy { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 10px; margin-top: 8px; color: var(--color-muted); font-size: .74em; }
.gs-copy a { color: var(--gs-ink); font-weight: 700; }
.gs-copy a:hover { color: var(--gs-red); }

@container (max-width: 1000px) {
  .gs-menu { display: block; }
  .gs-nav { display: none; }
}
/* Phones and tablets, as in the reference: logo on top, the icons under it, the menu drops down below the header */
@container (max-width: 820px) {
  .gs-head-in { display: grid; justify-items: center; gap: 4px; padding: 10px 0 8px; }
  .gs-icons { margin: 0; gap: 18px; }
  .gs-icons > a:not(:first-child) { display: inline-flex; }
  .gs-icons > a[href*="account"], .gs-icons > a[href$="/account"] { display: none; }
  .gs-menu { order: -1; }
  .gs-menu[open] > summary { position: static; width: auto; height: auto; border-radius: 0; background: none; color: var(--gs-ink); }
  .gs-menu[open]::before { display: none; }
  .gs-burger .gs-burger-ico { width: 22px; height: 16px; }
  .gs-drawer { position: absolute; top: 100%; inset-inline: 0; height: auto; width: auto; padding: 4px 0; background: #FCEDE8; animation: none; box-shadow: 0 10px 20px -16px rgb(0 0 0 / .4); }
  .gs-drawer a:not(.gs-logo) { padding: 9px clamp(20px, 7cqi, 60px); border-bottom: 0; font-size: .8em; font-weight: 700; }
  .gs-drawer a[aria-current="page"] { color: var(--gs-red); }
  .gs-drawer hr { margin: 4px 0; border-top: 1px solid rgb(0 0 0 / .06); }
  .gs-intro { grid-template-columns: 1fr 1fr; }
  .gs-intro-text { grid-column: 1 / -1; margin-bottom: 20px; }
  .gs-grid, .gs-grid3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gs-perks { grid-template-columns: 1fr 1fr; }
  .gs-perks-pic { grid-column: 1 / -1; order: -1; width: min(240px, 100%); justify-self: center; }
  .gs-plp { grid-template-columns: 1fr; }
  .gs-touch-row, .gs-contact-row { grid-template-columns: 1fr; width: min(320px, 100%); margin-inline: auto; }
  .gs-alb, .gs-alb:nth-child(even) { grid-template-columns: 1fr; width: min(340px, 100%); margin-inline: auto; }
  .gs-alb:nth-child(even) .gs-alb-pic { order: 0; }
  .gs-svc-top { grid-template-columns: 1fr; justify-items: center; }
  .gs-svc-top h1 { text-align: center; }
  .gs-map-frame { aspect-ratio: 1.4; }
}
@container (max-width: 600px) {
  .gs-grid, .gs-grid3 { grid-template-columns: minmax(0, 1fr); width: min(240px, 100%); margin-inline: auto; }
  .gs-sale-row { grid-auto-columns: 60%; }
  .gs-arrows label { display: none; }
  .gs-slide-text { padding: 8px; }
  .gs-foot .gs-logo b { font-size: 2.2em; }
  .gs-news { flex-direction: column; align-items: center; }
  .gs-news input { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .gs-head-in, .gs-head .gs-logo { animation: none !important; }
}
`;
