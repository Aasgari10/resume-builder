/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Zarin": a gold and jewellery shop, after the Alukas reference: white pages, light geometric
// headings, square product pictures on pale grey, a three-picture banner, a pink strip to find the
// shop, a pale-blue "fine craft" card and a pale-pink "since" band. Gold pieces are priced from the
// day's gold rate (weight, karat, wage; see goldQuote in @rb/schema), which the top strip shows and
// the product page breaks down in its "price breakup" tab.
// The page works without scripts: cart and wishlist buttons are small forms the server answers,
// the gallery and the product tabs are radio buttons, menus are details elements.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, goldQuote, priceCart, unitPrice, withGoldPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, saleProducts, shopkitCss, SORTS, SpecsTable, Stars, timeLeft, filterProducts } from "./shopkit";
import { mapEmbed } from "./golsara";

export const ZARIN_BLOCKS = [
  { key: "collections", label: "دسته‌ها با عکس" },
  { key: "new", label: "کالکشن جدید (محصولات)" },
  { key: "sale", label: "حراج ویژه (کالاهای تخفیف‌دار)" },
  { key: "store", label: "نوار «فروشگاه ما را پیدا کنید»" },
  { key: "edit", label: "سه عکس با متن" },
  { key: "craft", label: "بخش «ساخت دست» با دو عکس" },
  { key: "why", label: "چرا ما؟" },
  { key: "since", label: "معرفی فروشگاه با امضا" },
  { key: "brands", label: "آرم برندها" },
  { key: "instagram", label: "عکس‌های اینستاگرام" },
  { key: "newsletter", label: "خبرنامه" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const ZARIN_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

/** Every page this shop has: the fixed shop pages, one per category, product and blog post. */
export function zarinPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const own = ZARIN_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p));
  const posts = pageOn(data, "/blog") ? livePosts(shop).map((p) => `/blog/${p.id}`) : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", "/shop", ...own, "/contact", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), ...posts, "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...info];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function ZarinShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = zarinPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
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
  else if (kind === "contact") body = <Contact {...view} />;
  else
    body = (
      <>
        <Trail view={view} items={[{ label: "اطلاعات" }]} />
        <div className="zr-wrap zr-sec">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`zr${page === "/" ? " zr-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className="zr-main" key={page}>
        {body}
      </main>
      {blockOn(ctx.data, "newsletter") && <Newsletter view={view} />}
      <Footer {...view} />
      <PhoneBar {...view} />
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
};
const PERK_ICONS = ["truck", "shield", "card", "undo", "gem", "gift"];
const ABOUT_ICONS = ["smile", "rocket", "heart", "gem", "shield", "gift"];

function Svg({ name, className = "zr-ico" }: { name: string; className?: string }) {
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
    <form method="post" action={view.link("/_cart")} className="zr-act">
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
    <span className="zr-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

/** "۳٫۲ گرم · ۱۸ عیار" under a gold piece's name. */
function GoldLine({ p }: { p: Product }) {
  if (!p.gold) return null;
  return (
    <small className="zr-goldline">
      {faDec(p.gold.weight)} گرم · {fa(p.gold.karat)} عیار
    </small>
  );
}

function Badge({ p }: { p: Product }) {
  const soldOut = p.stock === 0;
  if (soldOut) return <span className="zr-badge out">ناموجود</span>;
  return (
    <span className="zr-badges">
      {onSale(p) && <span className="zr-badge off">{fa(percentOff(p))}٪ تخفیف</span>}
      {p.badge && <span className="zr-badge hot">{p.badge}</span>}
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
    <article className={`zr-card${row ? " zr-row" : ""}`} style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="zr-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="zr-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
            {hover && <img src={hover} alt="" loading="lazy" className="zr-img-2" />}
          </span>
        </PageLink>
        <Badge p={p} />
        <div className="zr-card-acts">
          <Act view={view} op="wish" id={p.id} className={`zr-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="zr-round" label="دیدن محصول">
            <Svg name="eye" />
          </PageLink>
          {!soldOut && !hasChoices(p) && (
            <Act view={view} op="add" id={p.id} className="zr-round" label="افزودن به سبد خرید">
              <Svg name="bag" />
            </Act>
          )}
        </div>
      </div>
      <div className="zr-card-text">
        {cat && <small className="zr-card-cat">{cat}</small>}
        <PageLink to={productPath(p)} link={view.link} className="zr-card-name">
          <span>{p.name}</span>
        </PageLink>
        <GoldLine p={p} />
        <Price view={view} p={p} />
        {row && (
          <>
            {p.description && <p className="zr-card-desc">{p.description.slice(0, 160)}</p>}
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="zr-btn small ghost">
                  انتخاب گزینه‌ها
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="zr-btn small ghost" label="افزودن به سبد خرید">
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
    <span className={`zr-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A centred heading with an optional line of text under it. */
function Head({ view, title, titlePath, text, textPath, fallback }: { view: View; title?: string; titlePath: string; text?: string; textPath?: string; fallback?: string }) {
  return (
    <div className="zr-head-c">
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
    <div className="zr-wrap zr-trail-row">
      <nav className="zr-trail" aria-label="مسیر صفحه">
        <PageLink to="/" link={view.link}>
          خانه
        </PageLink>
        {items.map((t, k) => (
          <span key={k}>
            <Svg name="left" className="zr-ico zr-sep" />
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
    <section className="zr-banner" {...ed("site.shop.heroImage", "image", "عکس بالای صفحه‌ی فروشگاه")}>
      {img && <img src={img} alt="" />}
      <div>
        <h1>{title}</h1>
        <nav className="zr-trail" aria-label="مسیر صفحه">
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
    <div className="zr-wrap zr-empty">
      <p className="zr-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="zr-btn">
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

function Logo({ view, className = "zr-logo" }: { view: View; className?: string }) {
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

/** Today's gold rate, as the strip at the top shows it. */
function RateNote({ view }: { view: View }) {
  const r = view.shop.goldRate;
  if (!r?.rate) return null;
  return (
    <span className="zr-rate">
      <Svg name="gem" className="zr-ico" />
      نرخ هر گرم طلای ۱۸ عیار: <b>{money(view, r.rate)}</b>
      {r.updatedAt && <small>({faDate(r.updatedAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })})</small>}
    </span>
  );
}

function TopStrip(view: View) {
  const { shop, link } = view;
  const note = shop.announcements?.[0];
  return (
    <>
      {view.page === "/" && note && (
        <div className="zr-announce">
          <span {...ed("site.shop.announcements", "lines", "نوار اطلاعیه‌ی بالای صفحه")}>{note}</span>
        </div>
      )}
      <div className="zr-top">
        <div className="zr-wrap zr-top-in">
          <div className="zr-top-start">
            <RateNote view={view} />
            {view.page !== "/" && note && <span className="zr-top-note">{note}</span>}
          </div>
          <nav className="zr-top-links">
            <PageLink to="/contact" link={link}>
              نشانی فروشگاه
            </PageLink>
            <PageLink to="/account" link={link}>
              پیگیری سفارش
            </PageLink>
            {(shop.faq ?? []).length > 0 && (
              <PageLink to="/faq" link={link}>
                سؤالات متداول
              </PageLink>
            )}
            <PageLink to="/support" link={link}>
              پشتیبانی
            </PageLink>
          </nav>
        </div>
      </div>
    </>
  );
}

function Nav({ view, className }: { view: View; className: string }) {
  const cats = (view.shop.categories ?? []).filter((c) => visible(view.shop).some((p) => p.categoryId === c.id));
  return (
    <nav className={className}>
      {menu(view).map((m) => (
        <span key={m.to} className={`zr-nav-item${m.cats && cats.length ? " has-sub" : ""}`}>
          <PageLink to={m.to} link={view.link} current={isHere(view, m.to)}>
            {m.label}
            {m.cats && cats.length > 0 && <Svg name="down" className="zr-ico zr-caret" />}
          </PageLink>
          {m.cats && cats.length > 0 && (
            <span className="zr-sub">
              {cats.map((c) => (
                <PageLink key={c.id} to={`/category/${c.id}`} link={view.link}>
                  {c.name}
                </PageLink>
              ))}
            </span>
          )}
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
    <div className="zr-icons">
      {search && (
        <PageLink to="/search" link={link} className="zr-icon zr-icon-search">
          <Svg name="search" />
          <span className="sr-only">جست‌وجو</span>
        </PageLink>
      )}
      <PageLink to="/account" link={link} className="zr-icon zr-icon-user">
        <Svg name="user" />
        <span className="sr-only">{visitor.customer ? `حساب ${visitor.customer.name}` : "ورود / ثبت‌نام"}</span>
      </PageLink>
      <PageLink to="/wishlist" link={link} className="zr-icon zr-icon-wish">
        <Svg name="heart" />
        <i>{fa(wishes)}</i>
        <span className="sr-only">علاقه‌مندی‌ها</span>
      </PageLink>
      <PageLink to="/cart" link={link} className="zr-icon">
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
    <details className="zr-menu">
      <summary className="zr-icon zr-burger" aria-label="منو">
        <Svg name="menu" />
      </summary>
      <div className="zr-drawer">
        <div className="zr-drawer-head">
          <Logo view={view} />
          <Svg name="close" className="zr-ico zr-x" />
        </div>
        <form method="get" action={link("/search")} className="zr-drawer-search">
          <input name="q" placeholder="جست‌وجوی محصول" aria-label="جست‌وجوی محصول" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        <Nav view={view} className="zr-drawer-nav" />
        <hr />
        <PageLink to="/wishlist" link={link}>
          علاقه‌مندی‌ها
        </PageLink>
        <PageLink to="/account" link={link}>
          حساب من
        </PageLink>
        <RateNote view={view} />
      </div>
    </details>
  );
}

function Header(view: View) {
  const { link, ctx, shop } = view;
  const home = view.page === "/";
  const phone = ctx.data.basics.phone;
  const cats = (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id));
  return (
    <>
      <TopStrip {...view} />
      <header className={`zr-head ${home ? "zr-head-home" : "zr-head-inner"}`}>
        {home ? (
          <div className="zr-wrap zr-head-in">
            <Drawer view={view} />
            <Logo view={view} />
            <Nav view={view} className="zr-nav" />
            <Icons view={view} search />
          </div>
        ) : (
          <>
            <div className="zr-wrap zr-head-in">
              <Drawer view={view} />
              <form method="get" action={link("/search")} className="zr-head-search">
                <input name="q" placeholder="جست‌وجوی محصول" aria-label="جست‌وجوی محصول" defaultValue={view.page === "/search" ? view.visitor.query.q : undefined} />
                <button type="submit" aria-label="جست‌وجو">
                  <Svg name="search" />
                </button>
              </form>
              <Logo view={view} />
              <Icons view={view} />
            </div>
            <div className="zr-wrap zr-head-row2">
              {cats.length > 0 ? (
                <details className="zr-browse">
                  <summary>
                    دسته‌بندی محصولات <Svg name="down" className="zr-ico zr-caret" />
                  </summary>
                  <div>
                    {cats.map((c) => (
                      <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
                        {c.name}
                      </PageLink>
                    ))}
                  </div>
                </details>
              ) : (
                <span />
              )}
              <Nav view={view} className="zr-nav" />
              <div className="zr-head-contact">
                {phone && (
                  <a href={telHref(phone)} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                    <Svg name="phone" /> {phone}
                  </a>
                )}
                <PageLink to="/contact" link={link}>
                  <Svg name="pin" /> فروشگاه ما
                </PageLink>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
}

function Newsletter({ view }: { view: View }) {
  const { shop, editing } = view;
  const home = view.page === "/";
  return (
    <section className={`zr-news ${home ? "is-home" : ""}`}>
      <div className="zr-wrap">
        <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>
          <h2 {...ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>{shop.newsletterTitle}</h2>
        </Opt>
        <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن خبرنامه")}>
          <p {...ed("site.shop.newsletterText", "text", "متن خبرنامه")}>{shop.newsletterText}</p>
        </Opt>
        <form method="post" action={view.link("/_form")} className="zr-news-form">
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
    <footer className="zr-foot">
      <div className="zr-wrap zr-foot-cols">
        <div className="zr-foot-brand">
          <Logo view={view} />
          <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "زیر نام")}>
            <small {...ed("basics.jobTitle", "text", "زیر نام")}>{b.jobTitle}</small>
          </Opt>
        </div>
        <div>
          <h3>درباره‌ی {b.fullName}</h3>
          {pageOn(ctx.data, "/about") && (
            <PageLink to="/about" link={link}>
              درباره‌ی ما
            </PageLink>
          )}
          {pageOn(ctx.data, "/blog") && (
            <PageLink to="/blog" link={link}>
              بلاگ
            </PageLink>
          )}
          <PageLink to="/contact" link={link}>
            تماس با ما
          </PageLink>
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </div>
        <div>
          <h3>خرید</h3>
          <PageLink to="/shop" link={link}>
            همه‌ی محصولات
          </PageLink>
          {saleProducts(visible(shop)).length > 0 && (
            <PageLink to="/shop?sale=1" link={link}>
              حراج ویژه
            </PageLink>
          )}
          <PageLink to="/account" link={link}>
            حساب کاربری و سفارش‌ها
          </PageLink>
          <PageLink to="/support" link={link}>
            پشتیبانی
          </PageLink>
          {(shop.faq ?? []).length > 0 && (
            <PageLink to="/faq" link={link}>
              سؤالات متداول
            </PageLink>
          )}
        </div>
        <div className="zr-foot-store">
          <h3>اطلاعات فروشگاه</h3>
          {b.phone && (
            <a href={telHref(b.phone)} className="zr-foot-phone">
              <Svg name="headset" />
              <span>
                <small>سؤالی دارید؟</small>
                <b dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                  {b.phone}
                </b>
              </span>
            </a>
          )}
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p>
              <b>نشانی: </b>
              <span {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</span>
            </p>
          </Opt>
          <Opt value={b.email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
            <p>
              <b>ایمیل: </b>
              <span dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </span>
            </p>
          </Opt>
        </div>
        <div>
          <h3>ما را دنبال کنید</h3>
          <Socials ctx={ctx} editing={editing} className="zr-socials" />
        </div>
      </div>
      <div className="zr-wrap zr-foot-bottom">
        <small>© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
      </div>
    </footer>
  );
}

/** The bar at the bottom of phone screens, as in the reference: home, search, wishlist, account. */
function PhoneBar(view: View) {
  const { link, visitor } = view;
  return (
    <nav className="zr-phonebar" aria-label="میان‌برها">
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

/* ───────────── Home ───────────── */

/** One of the picture banners: a small line, a heading, a line of text and a framed button over the picture. */
function PicBanner({ view, b, k, to, className, button = "خرید کنید" }: { view: View; b: NonNullable<Shop["banners"]>[number]; k: number; to: string; className?: string; button?: string }) {
  const at = item("site.shop.banners", b.id);
  return (
    <div className={`zr-pb ${className ?? ""}`} style={{ "--i": k } as CSSProperties}>
      <span className="zr-pb-pic" {...ed(`${at}.image`, "image", "عکس بنر")}>
        {safeUrl(b.image) && <img src={safeUrl(b.image)} alt="" loading={k > 1 ? "lazy" : undefined} />}
      </span>
      <div className="zr-pb-text">
        <Opt value={b.kicker} editing={view.editing} edit={ed(`${at}.kicker`, "text", "خط کوچک")}>
          <small {...ed(`${at}.kicker`, "text", "خط کوچک")}>{b.kicker}</small>
        </Opt>
        <Opt value={b.title} editing={view.editing} edit={ed(`${at}.title`, "text", "تیتر بنر")}>
          <h2 {...ed(`${at}.title`, "text", "تیتر بنر")}>{b.title}</h2>
        </Opt>
        <Opt value={b.text} editing={view.editing} edit={ed(`${at}.text`, "text", "متن بنر")}>
          <p {...ed(`${at}.text`, "text", "متن بنر")}>{b.text}</p>
        </Opt>
        <BannerLink view={view} b={b} to={to} className="zr-btn small ghost">
          {button}
        </BannerLink>
      </div>
    </div>
  );
}

/** A banner's own link when the owner set one (another site or page), otherwise the page given. */
function BannerLink({ view, b, to, className, children }: { view: View; b: NonNullable<Shop["banners"]>[number]; to: string; className?: string; children: ReactNode }) {
  const href = safeUrl(b.link);
  return href ? (
    <a href={href} {...outside(href)} className={className}>
      {children}
    </a>
  ) : (
    <PageLink to={to} link={view.link} className={className}>
      {children}
    </PageLink>
  );
}

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const banners = (shop.banners ?? []).filter((b) => !b.hidden);
  const hero = banners.slice(0, 3);
  const edits = banners.slice(3, 6);
  const cats = (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const fresh = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 8);
  const sale = saleProducts(products).slice(0, 8);
  const brands = (shop.trustLogos ?? []).filter((l) => safeUrl(l.image));
  const insta = (site?.gallery ?? []).filter((g) => safeUrl(g.image)).slice(0, 6);
  // Banners without a link of their own open a category: the hero ones the first three, the others the next three.
  const catPath = (k: number) => (cats[k] ? `/category/${cats[k]!.id}` : "/shop");
  const igLink = data.basics.links.find((l) => l.type === "instagram");
  const igHref = safeUrl(igLink?.url);
  const igHandle = igHref ? `@${igHref.replace(/\/+$/, "").split("/").pop()}` : undefined;
  return (
    <>
      {hero.length > 0 && (
        <section className={`zr-wrap zr-hero zr-hero-${hero.length}`}>
          {hero.map((b, k) => (
            <PicBanner key={b.id} view={view} b={b} k={k} to={catPath(k)} className={k === 0 ? "big" : ""} />
          ))}
        </section>
      )}

      {on("collections") && cats.length > 0 && (
        <section className="zr-wrap zr-sec">
          <Head view={view} title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" fallback="دسته‌های ما" />
          <div className="zr-cats">
            {cats.slice(0, 6).map((c) => {
              const img = safeUrl(c.image) ?? pic(products.find((p) => p.categoryId === c.id)!);
              return (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} className="zr-cat">
                  <span className="zr-cat-pic">{img && <img src={img} alt="" loading="lazy" />}</span>
                  <b>{c.name}</b>
                </PageLink>
              );
            })}
          </div>
        </section>
      )}

      {on("new") && fresh.length > 0 && (
        <section className="zr-wrap zr-sec zr-sec-tight">
          <Head view={view} title={shop.newTitle} titlePath="site.shop.newTitle" text={shop.newText} textPath="site.shop.newText" fallback="کالکشن جدید" />
          <div className="zr-slide-row">
            {fresh.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("sale") && sale.length > 0 && (
        <section className="zr-wrap zr-sec zr-sec-tight">
          <div className="zr-sale-head">
            <h2 {...ed("site.shop.discountTitle", "text", "تیتر حراج")}>{shop.discountTitle?.trim() || "حراج ویژه"}</h2>
            <SaleClock p={sale[0]!} />
            <PageLink to="/shop?sale=1" link={link} className="zr-more">
              همه‌ی حراجی‌ها <Svg name="left" />
            </PageLink>
          </div>
          <div className="zr-slide-row">
            {sale.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("store") && (
        <section className="zr-wrap">
          <div className="zr-store">
            <Svg name="store" />
            <span {...ed("site.shop.bestTitle", "text", "متن نوار")}>{shop.bestTitle || "فروشگاه ما را از نزدیک ببینید"}</span>
            <PageLink to="/contact" link={link} className="zr-btn tiny ghost">
              مسیریابی
            </PageLink>
          </div>
        </section>
      )}

      {on("edit") && edits.length > 0 && (
        <section className="zr-wrap zr-sec">
          <Head view={view} title={shop.heroTitle} titlePath="site.shop.heroTitle" fallback="ساخته‌شده با دقت، برای همیشه" />
          <div className="zr-edits">
            {edits.map((b, k) => {
              const at = item("site.shop.banners", b.id);
              return (
                <article key={b.id} className="zr-edit">
                  <span className="zr-edit-pic" {...ed(`${at}.image`, "image", "عکس")}>
                    {safeUrl(b.image) && <img src={safeUrl(b.image)} alt="" loading="lazy" />}
                  </span>
                  <h3 {...ed(`${at}.title`, "text", "تیتر")}>{b.title}</h3>
                  <Opt value={b.text} editing={editing} edit={ed(`${at}.text`, "text", "متن")}>
                    <p {...ed(`${at}.text`, "text", "متن")}>{b.text}</p>
                  </Opt>
                  <BannerLink view={view} b={b} to={catPath(k + 3)} className="zr-under">
                    {b.kicker || "دیدن کالکشن"}
                  </BannerLink>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {on("craft") && (
        <section className="zr-wrap zr-sec zr-craft">
          <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس اول" className="zr-craft-1" />
          <Pic src={shop.trendImage} path="site.shop.trendImage" label="عکس دوم" className="zr-craft-2" />
          <div className="zr-craft-card">
            <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "تیتر")}>
              <h2 {...ed("site.shop.lookTitle", "text", "تیتر")}>{shop.lookTitle}</h2>
            </Opt>
            <Opt value={shop.lookText} editing={editing} edit={ed("site.shop.lookText", "multiline", "متن")}>
              <p {...ed("site.shop.lookText", "multiline", "متن")}>{shop.lookText}</p>
            </Opt>
            <PageLink to="/shop" link={link} className="zr-btn tiny">
              دیدن محصولات
            </PageLink>
          </div>
        </section>
      )}

      {on("why") && (shop.promoTitle || shop.promoText || editing) && (
        <section className="zr-wrap zr-sec zr-why">
          <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "تیتر")}>
            <h2 {...ed("site.shop.promoTitle", "text", "تیتر")}>{shop.promoTitle}</h2>
          </Opt>
          <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "multiline", "متن")}>
            <p {...ed("site.shop.promoText", "multiline", "متن")}>{shop.promoText}</p>
          </Opt>
          {pageOn(data, "/about") && (
            <PageLink to="/about" link={link} className="zr-under">
              داستان ما را بخوانید
            </PageLink>
          )}
        </section>
      )}

      {on("since") && (
        <section className="zr-since">
          <div className="zr-wrap zr-since-in">
            <Pic src={site?.accentImage} path="site.accentImage" label="عکس" className="zr-since-pic" />
            <div className="zr-since-text">
              <Opt value={site?.styleTitle} editing={editing} edit={ed("site.styleTitle", "multiline", "تیتر")}>
                <h2 {...ed("site.styleTitle", "multiline", "تیتر")}>{site?.styleTitle}</h2>
              </Opt>
              <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن")}>
                <p {...ed("site.styleText", "multiline", "متن")}>{site?.styleText}</p>
              </Opt>
              <Opt value={site?.signatureImage} editing={editing} edit={ed("site.signatureImage", "image", "امضا")}>
                <img src={safeUrl(site?.signatureImage)} alt="" className="zr-sign" {...ed("site.signatureImage", "image", "امضا")} />
              </Opt>
              <PageLink to="/shop" link={link} className="zr-btn small ghost">
                دیدن کالکشن‌ها
              </PageLink>
            </div>
          </div>
        </section>
      )}

      {on("brands") && brands.length > 0 && (
        <section className="zr-brands">
          <div className="zr-wrap">
            {brands.map((l) => {
              const href = safeUrl(l.link);
              const img = <img src={safeUrl(l.image)} alt={l.title ?? ""} loading="lazy" />;
              return href ? (
                <a key={l.id} href={href} {...outside(href)} title={l.title}>
                  {img}
                </a>
              ) : (
                <span key={l.id} title={l.title}>
                  {img}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {on("instagram") && (insta.length > 0 || editing) && (
        <section className="zr-wrap zr-sec zr-insta">
          <div className="zr-head-c">
            <h2>ما را در اینستاگرام دنبال کنید</h2>
            {igHandle && (
              <a href={igHref} {...outside(igHref)} dir="ltr">
                {igHandle}
              </a>
            )}
          </div>
          <div className="zr-insta-row">
            {insta.map((g) => (
              <ZoomOpen key={g.id} id={g.id} className="zr-insta-pic">
                <span {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس اینستاگرام")}>
                  <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                </span>
              </ZoomOpen>
            ))}
            {editing && insta.length < 6 && (
              <span className="zr-add" {...ed("site.gallery", "newimage", "افزودن عکس اینستاگرام")}>
                + افزودن عکس
              </span>
            )}
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
    <span className="zr-clock">
      <Svg name="clock" /> {text} تا پایان حراج
    </span>
  );
}

/* ───────────── All products / a category ───────────── */

const PER_PAGE = 12;
const WEIGHTS: [string, string, number, number][] = [
  ["1", "تا ۲ گرم", 0, 2],
  ["2", "۲ تا ۵ گرم", 2, 5],
  ["3", "۵ تا ۱۰ گرم", 5, 10],
  ["4", "بیشتر از ۱۰ گرم", 10, Infinity],
];
const VIEWS: [string, string, string][] = [
  ["list", "list", "نمایش فهرستی"],
  ["2", "grid2", "دو ستونه"],
  ["3", "grid3", "سه ستونه"],
  ["4", "grid4", "چهار ستونه"],
];
const sizesOf = (p: Product) => (p.options ?? []).find((o) => /سایز|اندازه|طول/.test(o.name))?.values.map((v) => v.label) ?? p.sizes ?? [];

/** The shop's own filters on top of the shared ones: karat, weight and size. */
function goldFilter(list: Product[], q: Record<string, string>) {
  const karats = ["18", "21", "24"].filter((k) => q[`k${k}`]);
  const w = WEIGHTS.find(([k]) => k === q.w);
  return list.filter(
    (p) =>
      (!karats.length || (p.gold && karats.includes(String(p.gold.karat)))) &&
      (!w || (p.gold && p.gold.weight >= w[2] && p.gold.weight < w[3])) &&
      (!q.size || sizesOf(p).includes(q.size)),
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
  const list = goldFilter(base.list, q);
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
      <section className="zr-wrap zr-plp">
        <div className="zr-plp-main">
          <div className="zr-plp-bar">
            <label htmlFor="zr-ftog" className="zr-ftog-btn">
              <Svg name="list" /> فیلترها
            </label>
            <small>
              {fa(from)}–{fa(from ? from + shown.length - 1 : 0)} از {fa(list.length)} محصول
            </small>
            <SortMenu view={view} here={here} />
            <div className="zr-views">
              {VIEWS.map(([k, icon, label]) => (
                <a key={k} href={`${link(here)}${qsOf(q, { view: k === "3" ? undefined : k, p: undefined })}`} aria-current={mode === k || undefined} title={label} aria-label={label}>
                  <Svg name={icon} />
                </a>
              ))}
            </div>
          </div>
          {shown.length ? (
            <div className={`zr-grid zr-cols-${mode}`}>
              {shown.map((p, k) => (
                <ProductCard key={p.id} view={view} p={p} i={k} row={mode === "list"} />
              ))}
            </div>
          ) : (
            <p className="zr-notice">{base.active || list.length !== base.list.length ? "محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید." : "هنوز محصولی اضافه نشده است."}</p>
          )}
          {pages > 1 && (
            <nav className="zr-pager" aria-label="صفحه‌ها">
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
        <input type="checkbox" id="zr-ftog" className="zr-ftog" aria-label="نمایش فیلترها" />
        <Sidebar view={view} here={here} cats={cats} cat={cat} />
      </section>
    </>
  );
}

function SideBox({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="zr-side-box" open={open}>
      <summary>
        {title}
        <Svg name="up" className="zr-ico zr-caret" />
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
  const karats = [18, 21, 24].map((k) => [k, inCat.filter((p) => p.gold?.karat === k).length] as const).filter(([, n]) => n);
  const weights = WEIGHTS.map((w) => [w, inCat.filter((p) => p.gold && p.gold.weight >= w[2] && p.gold.weight < w[3]).length] as const).filter(([, n]) => n);
  const sizes = [...new Set(inCat.flatMap(sizesOf))];
  return (
    <aside className="zr-side">
      <SideBox title="دسته‌ها">
        <nav className="zr-side-cats">
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
      <form method="get" action={link(here)} className="zr-facets">
        <Keep query={q} skip={["k18", "k21", "k24", "w", "size", "sale", "stock", "p"]} />
        {karats.length > 0 && (
          <SideBox title="عیار">
            {karats.map(([k, n]) => (
              <label key={k} className="zr-check">
                <input type="checkbox" name={`k${k}`} value="1" defaultChecked={Boolean(q[`k${k}`])} />
                <span>{fa(k)} عیار</span>
                <small>{fa(n)}</small>
              </label>
            ))}
          </SideBox>
        )}
        {weights.length > 0 && (
          <SideBox title="وزن">
            <label className="zr-check">
              <input type="radio" name="w" value="" defaultChecked={!q.w} />
              <span>همه</span>
            </label>
            {weights.map(([w, n]) => (
              <label key={w[0]} className="zr-check">
                <input type="radio" name="w" value={w[0]} defaultChecked={q.w === w[0]} />
                <span>{w[1]}</span>
                <small>{fa(n)}</small>
              </label>
            ))}
          </SideBox>
        )}
        {sizes.length > 0 && (
          <SideBox title="سایز">
            <div className="zr-sizes">
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
          <label className="zr-check">
            <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} />
            <span>تخفیف‌دارها</span>
          </label>
          <label className="zr-check">
            <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} />
            <span>کالاهای موجود</span>
          </label>
        </SideBox>
        <div className="zr-facets-foot">
          <button type="submit" className="zr-btn small">
            اعمال فیلترها
          </button>
          <a href={link(here)} className="zr-under">
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
    <details className="zr-sort">
      <summary>
        مرتب‌سازی: <b>{now[1]}</b>
        <Svg name="down" className="zr-ico zr-caret" />
      </summary>
      <div className="zr-sort-list">
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
  const step = 500000;
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
    <SideBox title="فیلتر قیمت">
      <form method="get" action={view.link(here)} className="zr-price-filter">
        <Keep query={q} skip={["min", "max", "p"]} />
        <div className="zr-range">
          <input type="range" name="min" min={lo} max={hi} step={step} defaultValue={min} aria-label="کمترین قیمت" />
          <input type="range" name="max" min={lo} max={hi} step={step} defaultValue={max} aria-label="بیشترین قیمت" />
        </div>
        <div className="zr-range-foot">
          <button type="submit" className="zr-btn tiny">
            فیلتر
          </button>
          <small>
            {money(view, min)} — {money(view, max)}
          </small>
        </div>
      </form>
    </SideBox>
  );
}

/* ───────────── Product ───────────── */

/** "Arrives between ۲۸ آبان and ۲ آذر": three to seven days from today, in the Persian calendar. */
function deliveryWindow() {
  const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
  const f = (iso: string) => faDate(iso, { day: "numeric", month: "long" });
  return `${f(day(3))} تا ${f(day(7))}`;
}

function PriceBreakup({ view, p }: { view: View; p: Product }) {
  const rate = view.shop.goldRate;
  if (!p.gold || !rate?.rate)
    return (
      <p className="zr-muted">
        قیمت این محصول ثابت است: <b>{money(view, unitPrice(p))}</b>
      </p>
    );
  const g = p.gold;
  const sale = g.saleWage !== undefined && g.saleWage < g.wage && onSale(p);
  const q = goldQuote(g, rate, sale ? g.saleWage : g.wage);
  const rows: [string, string][] = [
    [`نرخ هر گرم طلای ${fa(g.karat)} عیار`, money(view, q.rate)],
    ["وزن", `${faDec(g.weight)} گرم`],
    ["ارزش طلا", money(view, q.gold)],
    [`اجرت ساخت (${faDec(sale ? g.saleWage! : g.wage)}٪${sale ? `، به‌جای ${faDec(g.wage)}٪` : ""})`, money(view, q.wage)],
    [`سود فروشنده (${faDec(rate.profit)}٪)`, money(view, q.profit)],
    [`مالیات بر ارزش افزوده (${faDec(rate.tax)}٪ اجرت و سود)`, money(view, q.tax)],
    ...(q.stone ? ([["سنگ و متعلقات", money(view, q.stone)]] as [string, string][]) : []),
  ];
  return (
    <div className="zr-breakup">
      <table>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th>{a}</th>
              <td>{b}</td>
            </tr>
          ))}
          <tr className="total">
            <th>قیمت نهایی</th>
            <td>{money(view, q.total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="zr-muted">
        قیمت با نرخ طلای {rate.updatedAt ? faDate(rate.updatedAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "امروز"} حساب شده و با تغییر نرخ روز به‌روز می‌شود.
      </p>
    </div>
  );
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
    { id: "price", label: "ریز قیمت" },
    { id: "reviews", label: `نظرها${rating?.count ? ` (${fa(rating.count)})` : ""}` },
  ];
  return (
    <>
      <Trail view={view} items={[{ label: "فروشگاه", to: "/shop" }, ...(cat ? [{ label: cat.name, to: `/category/${cat.id}` }] : []), { label: p.name }]}>
        <span className="zr-prevnext">
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
      <section className="zr-wrap zr-product" data-product={p.id}>
        <div className={`zr-gallery zr-n${Math.min(imgs.length, 6)}`}>
          {imgs.length > 1 && imgs.slice(0, 6).map((_, i) => <input key={i} type="radio" name="zr-g" id={`zr-g-${i}`} className="zr-g" defaultChecked={i === 0} aria-label={`عکس ${fa(i + 1)}`} />)}
          <div className="zr-thumbs">
            {imgs.length > 1 &&
              imgs.slice(0, 6).map((src, i) => (
                <label key={i} htmlFor={`zr-g-${i}`}>
                  <img src={src} alt="" loading="lazy" />
                </label>
              ))}
          </div>
          <div className="zr-mainpic">
            {(imgs.length ? imgs.slice(0, 6) : [undefined]).map((src, i) =>
              src ? (
                <ZoomOpen key={i} id={`${p.id}-${i}`} className="zr-big">
                  <img src={src} alt={p.name} />
                  <span className="zr-zoom-ico">
                    <Svg name="expand" />
                  </span>
                </ZoomOpen>
              ) : (
                <span key={i} className="zr-big" />
              ),
            )}
            <Badge p={p} />
          </div>
        </div>
        <div className="zr-info">
          <h1>{p.name}</h1>
          {rating?.count ? (
            <a href="#zr-tab-reviews" className="zr-rating">
              <Stars value={rating.avg} /> <small>({fa(rating.count)} نظر)</small>
            </a>
          ) : null}
          <div className="zr-info-price">
            <Price view={view} p={p} />
            {onSale(p) && !soldOut && <span className="zr-save">{fa(percentOff(p))}٪ تخفیف</span>}
          </div>
          <SaleClock p={p} />
          {p.description && <p className="zr-desc">{p.description.split("\n")[0]}</p>}
          <p className="zr-avail">
            وضعیت: {soldOut ? <b className="out">ناموجود</b> : <b className="in">{p.stock !== undefined && p.stock <= 3 ? `فقط ${fa(p.stock)} عدد موجود است` : "موجود"}</b>}
          </p>
          {p.gold && (
            <div className="zr-goldbox">
              <h3>مشخصات طلا</h3>
              <dl>
                <dt>وزن</dt>
                <dd>{faDec(p.gold.weight)} گرم</dd>
                <dt>عیار</dt>
                <dd>{fa(p.gold.karat)}</dd>
                <dt>اجرت ساخت</dt>
                <dd>{faDec(p.gold.wage)}٪</dd>
              </dl>
              <a href="#zr-tab-price" className="zr-under">
                ریز قیمت
              </a>
            </div>
          )}
          {soldOut ? (
            <p className="zr-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="zr-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <OptionPicker p={p} />
              <div className="zr-buy-row">
                <label className="zr-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" name="back" value="/cart" className="zr-btn">
                  افزودن به سبد خرید
                </button>
              </div>
              <button type="submit" name="back" value="/checkout" className="zr-btn grey wide">
                خرید فوری
              </button>
            </form>
          )}
          <div className="zr-links">
            <Act view={view} op="wish" id={p.id} className="zr-linkbtn" label="علاقه‌مندی">
              <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            </Act>
            {hasReturns && (
              <PageLink to={`/page/${hasReturns.slug}`} link={link} className="zr-linkbtn">
                <Svg name="undo" /> {hasReturns.title}
              </PageLink>
            )}
            <PageLink to="/contact" link={link} className="zr-linkbtn">
              <Svg name="question" /> سؤال درباره‌ی این محصول
            </PageLink>
          </div>
          <p className="zr-eta">
            <Svg name="truck" /> زمان تقریبی تحویل: <b>{deliveryWindow()}</b>
          </p>
          {perks.length > 0 && (
            <ul className="zr-perks">
              {perks.map((x, i) => (
                <li key={x.id}>
                  {safeUrl(x.image) ? <img src={safeUrl(x.image)} alt="" /> : <Svg name={PERK_ICONS[i % PERK_ICONS.length]!} />}
                  <span>{x.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="zr-meta">
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
      <section className="zr-wrap zr-tabs">
        {tabs.map((t, i) => (
          <input key={t.id} type="radio" name="zr-tab" id={`zr-tab-${t.id}`} className="zr-tab-in" defaultChecked={i === 0} />
        ))}
        <div className="zr-tab-labels" role="tablist">
          {tabs.map((t) => (
            <label key={t.id} htmlFor={`zr-tab-${t.id}`} role="tab">
              {t.label}
            </label>
          ))}
        </div>
        <div className="zr-tab-panels">
          <div className="zr-tab-panel">
            <div className="zr-tab-desc">
              <div className="zr-text">
                <Para text={p.description} />
              </div>
              {imgs[1] && <img src={imgs[1]} alt="" loading="lazy" />}
            </div>
          </div>
          <div className="zr-tab-panel">
            <SpecsTable p={p} className="zr-specs" />
            {!(p.specs ?? []).length && !p.gold && <p className="zr-muted">مشخصاتی برای این محصول ثبت نشده است.</p>}
          </div>
          <div className="zr-tab-panel">
            <PriceBreakup view={view} p={p} />
          </div>
          <div className="zr-tab-panel">
            <Reviews p={p} link={link} page={view.page} visitor={visitor} />
          </div>
        </div>
      </section>
      {related.length + more.length > 0 && (
        <section className="zr-wrap zr-sec">
          <Head view={view} title="محصولات مرتبط" titlePath="site.shop.products" />
          <div className="zr-slide-row">
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
    <p className="zr-meta zr-share">
      اشتراک‌گذاری:
      <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
        <Icon name="telegram" className="zr-ico" />
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
        <Icon name="whatsapp" className="zr-ico" />
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
      <section className="zr-wrap zr-about-top">
        <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر صفحه")}>
          <h1 {...ed("site.aboutTitle", "text", "تیتر صفحه")}>{site?.aboutTitle}</h1>
        </Opt>
        <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط زیر تیتر")}>
          <p {...ed("site.shop.heroKicker", "text", "خط زیر تیتر")}>{shop.heroKicker}</p>
        </Opt>
      </section>
      <section className="zr-about-pics">
        <Pic src={site?.heroImage} path="site.heroImage" label="عکس اول" />
        <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس دوم" />
      </section>
      <section className="zr-wrap zr-sec zr-story">
        <h2>
          <span {...ed("site.shop.showcaseText", "text", "تیتر")}>{shop.showcaseText || "داستان ما"}</span>
          <i aria-hidden="true" />
        </h2>
        <div>
          <Opt value={shop.discoverTitle} editing={editing} edit={ed("site.shop.discoverTitle", "multiline", "جمله‌ی اول")}>
            <p className="zr-story-lead" {...ed("site.shop.discoverTitle", "multiline", "جمله‌ی اول")}>
              {shop.discoverTitle}
            </p>
          </Opt>
          <div className="zr-text" {...ed("site.aboutText", "multiline", "متن داستان")}>
            <Para text={site?.aboutText} />
          </div>
          <Opt value={site?.signatureImage} editing={editing} edit={ed("site.signatureImage", "image", "امضا")}>
            <img src={safeUrl(site?.signatureImage)} alt="" className="zr-sign" {...ed("site.signatureImage", "image", "امضا")} />
          </Opt>
        </div>
      </section>
      {stats.length > 0 && (
        <section className="zr-mission">
          <Pic src={shop.discoverImage} path="site.shop.discoverImage" label="عکس" className="zr-mission-pic" />
          <div className="zr-mission-text">
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
        <section className="zr-wrap zr-sec">
          <Head view={view} title={shop.promoTitle} titlePath="site.shop.promoTitle" fallback="چرا ما را انتخاب می‌کنند" />
          <div className="zr-values">
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
        <section className="zr-wrap zr-sec zr-sec-line">
          <Head view={view} title={shop.bestText} titlePath="site.shop.bestText" fallback="تیم ما" />
          <div className="zr-team">
            {team.map((m) => (
              <figure key={m.id}>
                <span className="zr-team-pic">{safeUrl(m.image) && <img src={safeUrl(m.image)} alt={m.name} loading="lazy" />}</span>
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
    <section className={`zr-quotes zr-q${n}`}>
      {n > 1 && quotes.slice(0, n).map((t, k) => <input key={t.id} type="radio" name="zr-q" id={`zr-q-${k}`} className="zr-q-in" defaultChecked={k === 0} aria-label={`نظر ${fa(k + 1)}`} />)}
      <div className="zr-wrap zr-q-list">
        {quotes.slice(0, n).map((t, k) => {
          const at = item("site.testimonials", t.id);
          return (
            <figure key={t.id} className="zr-q-item">
              <div>
                <small>{view.ctx.data.basics.fullName}، انتخاب ما</small>
                <span className="zr-stars" aria-label={`${fa(t.rating ?? 5)} ستاره`}>
                  {"★".repeat(t.rating ?? 5)}
                </span>
                <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                <figcaption {...ed(`${at}.name`, "text", "نام")}>— {t.name}</figcaption>
                {n > 1 && (
                  <span className="zr-q-arrows">
                    <label htmlFor={`zr-q-${(k + n - 1) % n}`} aria-label="قبلی">
                      <Svg name="right" />
                    </label>
                    <label htmlFor={`zr-q-${(k + 1) % n}`} aria-label="بعدی">
                      <Svg name="left" />
                    </label>
                  </span>
                )}
              </div>
              <span className="zr-q-pic" {...ed(`${at}.image`, "image", "عکس")}>
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
    <aside className="zr-side zr-blog-side">
      <form method="get" action={link("/search")} className="zr-side-search">
        <input name="q" placeholder="جست‌وجو..." aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      <SideBox title="تازه‌ترین مطالب">
        {posts.slice(0, 3).map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={link} className="zr-mini">
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
          <div className="zr-tags">
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
      <section className="zr-wrap">
        <h1 className="zr-page-title">بلاگ</h1>
      </section>
      <section className="zr-wrap zr-blog">
        <div className="zr-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="zr-post-card">
                <PageLink to={`/blog/${p.id}`} link={link} className="zr-post-pic">
                  {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
                  {p.category && <span className="zr-badge dark">{p.category}</span>}
                </PageLink>
                <small className="zr-post-meta">
                  {p.author && `${p.author} · `}
                  {p.date && faDate(p.date)}
                </small>
                <h2>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <span {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</span>
                  </PageLink>
                </h2>
                <p>{p.excerpt || p.text.slice(0, 200)}</p>
                <PageLink to={`/blog/${p.id}`} link={link} className="zr-btn tiny ghost">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
          {!posts.length && <p className="zr-notice">هنوز مطلبی نوشته نشده است.</p>}
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
      <section className="zr-wrap zr-blog">
        <article className="zr-article">
          {p.category && <span className="zr-badge dark">{p.category}</span>}
          <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
          <small className="zr-post-meta">
            {p.author && `${p.author} · `}
            {p.date && faDate(p.date)}
          </small>
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" className="zr-article-pic" {...ed(`${at}.image`, "image", "عکس")} />}
          <div className="zr-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          <nav className="zr-post-nav">
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
            <div className="zr-related">
              <h2>شاید این‌ها را هم دوست داشته باشید</h2>
              <div>
                {related.map((r) => (
                  <PageLink key={r.id} to={`/blog/${r.id}`} link={link} className="zr-rel">
                    <span>
                      {safeUrl(r.image) && <img src={safeUrl(r.image)} alt="" loading="lazy" />}
                      {r.category && <i className="zr-badge dark">{r.category}</i>}
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
      <section className="zr-wrap zr-about-top">
        <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر")}>
          <h1 {...ed("site.contactTitle", "text", "تیتر")}>{site?.contactTitle}</h1>
        </Opt>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
          <p {...ed("site.contactText", "multiline", "متن")}>{site?.contactText}</p>
        </Opt>
      </section>
      <section className="zr-wrap zr-contact">
        <div className="zr-contact-info">
          {rows.map((r) => (
            <Opt key={r.path} value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
              <div className="zr-contact-item">
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
          <Socials ctx={ctx} editing={editing} className="zr-socials" />
        </div>
        <form method="post" action={view.link("/_form")} className="zr-message">
          <FormMeta kind="contact" back={view.page} />
          <h2>برای ما پیام بگذارید</h2>
          <input name="name" placeholder="نام شما" aria-label="نام شما" />
          <input name="phone" placeholder="شماره‌ی تماس" aria-label="شماره‌ی تماس" dir="ltr" inputMode="tel" />
          <textarea name="body" required rows={5} placeholder="پیام شما" aria-label="پیام شما" />
          <button type="submit" className="zr-btn">
            ارسال پیام
          </button>
        </form>
      </section>
      <section className="zr-wrap zr-sec zr-sec-tight">
        {embed ? (
          <div className="zr-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
            <iframe src={embed} title="نقشه‌ی محل فروشگاه" loading="lazy" referrerPolicy="no-referrer" />
            <a href={map} {...outside(map)} className="zr-btn small">
              مسیریابی
            </a>
          </div>
        ) : (
          <Opt value={map} editing={editing} edit={ed("site.mapUrl", "url", "لینک نقشه")}>
            <a href={map ?? "#"} {...outside(map)} className="zr-map-link" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان یا بلد)")}>
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
      <h1 className="zr-wrap zr-page-title">سبد خرید</h1>
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="zr-wrap zr-cart">
          <div className="zr-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="zr-line">
                <PageLink to={productPath(l.product)} link={link} className="zr-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="zr-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  <GoldLine p={l.product} />
                  {l.size && <small>{l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="zr-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="zr-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="zr-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="zr-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="zr-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="zr-btn wide">
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
      <h1 className="zr-wrap zr-page-title">علاقه‌مندی‌ها</h1>
      {items.length === 0 ? (
        <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <section className="zr-wrap zr-sec zr-sec-tight">
          <div className="zr-grid zr-cols-4">
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
      <section className="zr-wrap zr-search">
        <form method="get" action={view.link("/search")} className="zr-search-box">
          <input name="q" defaultValue={q} placeholder="انگشتر، گردنبند، دستبند..." aria-label="جست‌وجو" />
          <button type="submit" aria-label="جست‌وجو">
            <Svg name="search" />
          </button>
        </form>
        {active &&
          (found.length ? (
            <>
              <p className="zr-muted">{fa(found.length)} محصول پیدا شد.</p>
              <div className="zr-grid zr-cols-4">
                {found.map((p, k) => (
                  <ProductCard key={p.id} view={view} p={p} i={k} />
                ))}
              </div>
            </>
          ) : (
            <p className="zr-notice">{q ? <>محصولی با «{q}» پیدا نشد.</> : "محصولی با این فیلترها وجود ندارد."}</p>
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
      <h1 className="zr-wrap zr-page-title">ثبت سفارش</h1>
      <section className="zr-wrap zr-cart">
        <form method="post" action={link("/_order")} className="zr-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="zr-error">{error}</p>}
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
          <input name="website" tabIndex={-1} autoComplete="off" className="zr-trap" aria-hidden="true" />
          <button type="submit" className="zr-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="zr-sum">
          <h2>سفارش شما</h2>
          <ul className="zr-sum-lines">
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
                <dd className="zr-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.goldRate?.rate ? <small>قیمت طلاها با نرخ روز حساب شده و هنگام تأیید سفارش با شما هماهنگ می‌شود.</small> : null}
          {shop.paymentNote && (
            <p className="zr-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
      <section className="zr-wrap zr-sec zr-sec-tight">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="zr-wrap zr-thanks">
      <span className="zr-done" aria-hidden="true">
        ✓
      </span>
      <h1>ممنون از خرید شما!</h1>
      {code && (
        <p>
          کد پیگیری سفارش: <b dir="ltr">{code}</b>
        </p>
      )}
      {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
      {shop.paymentNote && <p className="zr-pay">{shop.paymentNote}</p>}
      <PageLink to="/shop" link={view.link} className="zr-btn">
        بازگشت به فروشگاه
      </PageLink>
    </section>
  );
}

/* ───────────── Example content ───────────── */

export function zarinSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`zr-${n}`);
  const png = (n: string) => sampleImage(`zr-${n}`, "png");
  const soon = (days: number) => new Date(Date.now() + days * 86400000 + 5 * 3600000).toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  // A sample rate; the owner types the day's rate in the panel.
  const goldRate = { rate: 7_300_000, profit: 7, tax: 10, updatedAt: new Date(Date.now() - 2 * 3600000).toISOString() };
  const cats = [
    { id: "c1", name: "گردنبند", image: img("p3a") },
    { id: "c2", name: "انگشتر", image: img("cat-rings") },
    { id: "c3", name: "دستبند", image: img("cat-bracelets") },
    { id: "c4", name: "گوشواره", image: img("cat-earrings") },
    { id: "c5", name: "آویز", image: img("cat-charms") },
    { id: "c6", name: "ایده‌های هدیه", image: img("cat-gifts") },
  ];
  const ring = [{ name: "سایز", values: ["۵۰", "۵۲", "۵۴", "۵۶"].map((label) => ({ label })) }];
  const specs = (color: string, karat = 18) => [
    { label: "جنس", value: `طلای ${new Intl.NumberFormat("fa-IR").format(karat)} عیار` },
    { label: "رنگ", value: color },
    { label: "ضمانت", value: "ضمانت اصالت و بازخرید" },
  ];
  const text = (what: string) =>
    `${what} با طلای ۱۸ عیار و پرداخت دستی در کارگاه خودمان ساخته شده و برای استفاده‌ی هر روزه مناسب است.\nهمه‌ی قطعه‌ها با فاکتور رسمی، کارت ضمانت اصالت و جعبه‌ی هدیه ارسال می‌شوند. اگر سایز یا رنگ دیگری می‌خواهید، در توضیحات سفارش بنویسید یا با ما تماس بگیرید.`;
  type G = { weight: number; karat?: number; wage: number; stone?: number; saleWage?: number };
  const gold = (g: G) => ({ karat: 18, ...g });
  const raw: Product[] = [
    { id: "z1", name: "گوشواره قلب «نور»", categoryId: "c4", price: 0, images: [img("p1a"), img("p1b"), img("p1c"), img("p1d")], featured: true, gold: gold({ weight: 2.8, wage: 18, stone: 650_000, saleWage: 12 }), saleEndsAt: soon(3), description: text("این گوشواره‌ی قلبی نگین‌دار"), specs: specs("رزگلد") },
    { id: "z2", name: "گوشواره حلقه‌ای «ماه»", categoryId: "c4", price: 0, images: [img("p2a"), img("p2b")], featured: true, badge: "پرفروش", gold: gold({ weight: 3.6, wage: 15 }), description: text("گوشواره‌ی حلقه‌ای ساده"), specs: specs("زرد") },
    { id: "z3", name: "گردنبند گره‌ی عشق", categoryId: "c1", price: 0, images: [img("p3a"), img("p3b"), img("p3c")], featured: true, gold: gold({ weight: 4.2, wage: 20 }), description: text("این گردنبند با آویز گره‌ای"), specs: specs("سفید") },
    { id: "z4", name: "انگشتر شاخه‌ی نگین‌دار", categoryId: "c2", price: 0, images: [img("p4a"), img("p4b")], featured: true, options: ring, gold: gold({ weight: 2.1, wage: 22, stone: 1_800_000, saleWage: 15 }), saleEndsAt: soon(5), description: text("انگشتر ظریف شاخه‌ای"), specs: specs("رزگلد") },
    { id: "z5", name: "دستبند میناکاری «فیروزه»", categoryId: "c3", price: 0, images: [img("p5a"), img("p5b")], stock: 0, gold: gold({ weight: 6.5, wage: 25, stone: 900_000 }), description: text("دستبند با نقش میناکاری"), specs: specs("زرد") },
    { id: "z6", name: "آویز قلب", categoryId: "c5", price: 0, images: [img("p6a"), img("p6b")], badge: "جدید", gold: gold({ weight: 1.6, wage: 16 }), description: text("آویز قلب کوچک"), specs: specs("سفید و زرد") },
    { id: "z7", name: "انگشتر چهاربرگ", categoryId: "c2", price: 0, images: [img("p7a"), img("p7b")], options: ring, gold: gold({ weight: 3, wage: 18 }), description: text("انگشتر با نقش برگ"), specs: specs("سفید") },
    { id: "z8", name: "گردنبند مهره‌ی طلا", categoryId: "c1", price: 0, images: [img("p8a"), img("p8b")], gold: gold({ weight: 5.4, wage: 14, karat: 21 }), description: text("گردنبند زنجیر ماری با یک مهره‌ی طلا"), specs: specs("سفید و زرد", 21) },
    { id: "z9", name: "انگشتر تک‌نگین «پیمان»", categoryId: "c2", price: 0, images: [img("p9a"), img("p9b")], badge: "ویژه", options: ring, gold: gold({ weight: 3.3, wage: 20, stone: 4_500_000, saleWage: 14 }), saleEndsAt: soon(2), description: text("انگشتر نامزدی تک‌نگین"), specs: specs("زرد") },
    { id: "z10", name: "گردنبند زنجیر حلقه‌ای", categoryId: "c1", price: 0, images: [img("p10a"), img("p10b")], stock: 2, gold: gold({ weight: 7.8, wage: 12 }), description: text("زنجیر حلقه‌ای درشت"), specs: specs("رزگلد") },
    { id: "z11", name: "دستبند النگویی رزگلد", categoryId: "c3", price: 0, images: [img("p11a"), img("p11b")], gold: gold({ weight: 8.9, wage: 13 }), description: text("دستبند النگویی با قفل مهره‌ای"), specs: specs("رزگلد") },
    { id: "z12", name: "انگشتر موج", categoryId: "c2", price: 0, images: [img("p12a"), img("p12b")], badge: "پرفروش", options: ring, gold: gold({ weight: 4.4, wage: 19 }), description: text("انگشتر موج‌دار"), specs: specs("زرد") },
    { id: "z13", name: "گوشواره کندویی", categoryId: "c4", price: 0, images: [img("p13a"), img("p13b")], gold: gold({ weight: 3.1, wage: 21 }), description: text("گوشواره‌ی قلبی با بافت کندویی"), specs: specs("زرد") },
    { id: "z14", name: "دستبند رزگلد ساده", categoryId: "c3", price: 0, images: [img("p14a"), img("p14b")], gold: gold({ weight: 3.9, wage: 15 }), description: text("دستبند ساده‌ی رزگلد"), specs: specs("رزگلد") },
    { id: "z15", name: "گردنبند زنجیر ونیزی", categoryId: "c1", price: 0, images: [img("p15a"), img("p15b")], gold: gold({ weight: 6.1, wage: 11, karat: 21 }), description: text("زنجیر ونیزی ظریف"), specs: specs("زرد", 21) },
    { id: "z16", name: "انگشتر رز سلطنتی", categoryId: "c2", price: 0, images: [img("p16a"), img("p16b")], options: ring, gold: gold({ weight: 5.2, wage: 23, stone: 2_200_000 }), description: text("انگشتر رز با نگین‌های ریز"), specs: specs("رزگلد") },
    { id: "z17", name: "انگشتر نگین آبی", categoryId: "c6", price: 0, images: [img("p17a"), img("p17b"), img("p17c"), img("p17d")], options: ring, gold: gold({ weight: 2.6, wage: 20, stone: 3_200_000 }), description: text("انگشتر با نگین آبی"), specs: specs("سفید") },
    { id: "z18", name: "آویز «لاو»", categoryId: "c6", price: 0, images: [img("p18a"), img("p18b")], gold: gold({ weight: 1.9, wage: 17 }), description: text("آویز کوچک با طرح قلب"), specs: specs("زرد") },
  ];
  const products = raw.map((p) => withGoldPrice(p, goldRate));
  const post = (t: string) =>
    `${t}\n\nانتخاب زیورآلات طلا فقط به قیمت و وزن نیست؛ رنگ پوست، سبک لباس و موقعیت هم مهم است. طلای زرد با رنگ‌های گرم و لباس‌های ساده بهتر دیده می‌شود و رزگلد کنار رنگ‌های روشن و پاستلی می‌درخشد.\n\nبرای استفاده‌ی هر روزه، قطعه‌های سبک و ساده را انتخاب کنید و برای مراسم، یک قطعه‌ی شاخص کافی است. ترکیب چند لایه گردنبند با طول‌های مختلف هم یکی از ترندهای این فصل است.\n\nطلا را دور از عطر، کرم و مواد شوینده نگه دارید و هر چند وقت یک‌بار با آب ولرم و صابون ملایم بشویید تا درخشش اولش را حفظ کند.`;
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "زرین",
      jobTitle: "طلا و جواهر",
      avatarUrl: sampleImage("zr-logo-temp", "svg"),
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان ولیعصر، پلاک ۱۲۰",
      summary: "گالری طلا و جواهر زرین؛ زیورآلات طلای ۱۸ عیار با ضمانت اصالت، ساخت دست استادکاران ایرانی.",
      links: [
        { id: "zl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "zl2", type: "telegram", url: "https://t.me/example" },
        { id: "zl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "zl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "zl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      address: "تهران، خیابان ولیعصر، پلاک ۱۲۰",
      contactNote: "شنبه تا پنجشنبه، ۱۰ صبح تا ۹ شب",
      contactTitle: "تماس با ما",
      contactText: "برای سفارش ساخت، سایز کردن انگشتر یا هر سؤالی پیام بگذارید یا سری به فروشگاه بزنید؛ همان روز پاسخ می‌دهیم.",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.75750&mlon=51.40970#map=16/35.75750/51.40970",
      styleTitle: "سلام، ما زرین هستیم\nاز سال ۱۳۷۷",
      styleText: "از سال ۱۳۷۷ طلا و جواهر را با وسواس انتخاب و با دست می‌سازیم. هر قطعه‌ی زرین با فاکتور رسمی، ضمانت اصالت و امکان بازخرید به دست شما می‌رسد.",
      accentImage: img("since"),
      signatureImage: png("signature"),
      heroImage: img("about-1"),
      aboutImage: img("about-2"),
      aboutTitle: "درباره‌ی گالری زرین",
      aboutText:
        "در کارگاه کوچکمان، هر قطعه را از طراحی تا پرداخت نهایی خودمان می‌سازیم. طلا را فقط از منابع معتبر می‌خریم و عیار هر قطعه را پیش از فروش آزمایش می‌کنیم.\n\nامروز زرین یک فروشگاه حضوری و یک فروشگاه اینترنتی دارد و زیورآلاتش را به سراسر ایران می‌فرستد؛ اما هنوز هم مثل روز اول، هر سفارش را با همان دقت آماده می‌کنیم.",
      gallery: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `zi${n}`, title: "زرین در اینستاگرام", image: img(`ig${n}`) })),
      testimonials: [
        { id: "zt1", name: "مریم احمدی", text: "کیفیت ساخت و طراحی عالی است؛ انگشترم را هر روز دستم می‌کنم و هنوز مثل روز اول می‌درخشد.", image: img("about-quote"), rating: 5 },
        { id: "zt2", name: "سارا کریمی", text: "ریز قیمت هر قطعه روشن است و بسته‌بندی هدیه هم خیلی شیک بود. حتماً دوباره خرید می‌کنم.", image: img("edit-2"), rating: 5 },
      ],
      clients: [
        { id: "zm1", name: "نیما برومند", text: "مؤسس و طراح", image: img("team-1") },
        { id: "zm2", name: "کیانا امیری", text: "مدیر فروش", image: img("team-2") },
        { id: "zm3", name: "آرش دلاوری", text: "استادکار کارگاه", image: img("team-3") },
        { id: "zm4", name: "پویا مرادی", text: "مدیر محصول", image: img("team-4") },
      ],
      shop: {
        categories: cats,
        products,
        goldRate,
        announcements: ["حراج پاییزه: تا ۴۰٪ تخفیف اجرت روی کالاهای منتخب"],
        heroImage: img("shop-top"),
        heroKicker: "زیورآلاتی که با دقت انتخاب و با عشق ساخته می‌شوند.",
        heroTitle: "طراحی در تهران، ساخت دست استادکاران ایرانی",
        banners: [
          { id: "zb1", kicker: "گردنبند و", title: "زیورآلات ظریف", text: "کالکشن تازه‌ی پاییز برای هر روز", image: img("hero-1") },
          { id: "zb2", kicker: "تازه رسیده", title: "انگشترهای روزمره", image: img("hero-2") },
          { id: "zb3", kicker: "دستبند و", title: "آویزهای جذاب", image: img("hero-3") },
          { id: "zb4", kicker: "دیدن گوشواره‌ها", title: "گوشواره‌های روزمره", text: "تازه‌ترین طرح‌ها برای هر روز هفته.", image: img("edit-3") },
          { id: "zb5", kicker: "دیدن آویزها", title: "آویزهای ظریف", text: "درخششی ظریف کنار گردنبندهای ساده.", image: img("edit-1") },
          { id: "zb6", kicker: "دیدن هدیه‌ها", title: "ایده‌های هدیه", text: "طراحی ماندگار برای لحظه‌های خاص.", image: img("edit-2") },
        ],
        showcaseTitle: "دسته‌های ما",
        showcaseText: "داستان ما",
        newTitle: "کالکشن جدید",
        newText: "تازه‌ترین طراحی‌های کارگاه زرین را ببینید.",
        discountTitle: "حراج ویژه‌ی اجرت",
        bestTitle: "فروشگاه حضوری ما را از نزدیک ببینید",
        bestText: "تیم زرین",
        lookTitle: "ساخت دست",
        lookText: "همه‌ی قطعه‌ها در کارگاه خودمان و با دست ساخته می‌شوند؛ از ذوب طلا تا پرداخت نهایی، هر مرحله را استادکاران باتجربه انجام می‌دهند.",
        lookImage: img("craft-1"),
        trendImage: img("craft-2"),
        promoTitle: "چرا زرین؟",
        promoText: "از سال ۱۳۷۷ طلا را با عیار تضمین‌شده، اجرت منصفانه و ریز قیمت شفاف می‌فروشیم. هر قطعه فاکتور رسمی و کارت ضمانت دارد و هر وقت بخواهید، به نرخ روز بازخرید می‌شود.",
        discoverTitle: "از یک کارگاه کوچک در بازار تهران شروع کردیم؛ با این باور که طلا باید هم زیبا باشد، هم قیمتش روشن.",
        discoverImage: img("about-mission"),
        newsletterTitle: "عضو شوید و ۱۰٪ تخفیف اجرت بگیرید",
        newsletterText: "از کالکشن‌های تازه، حراج‌ها و تغییر نرخ طلا زودتر از همه باخبر شوید.",
        stats: [
          { id: "zs1", value: "", label: "مأموریت ما", text: "زیورآلات طلای باکیفیت با قیمت شفاف و منصفانه، تا خرید طلا برای همه ساده و مطمئن باشد." },
          { id: "zs2", value: "", label: "چشم‌انداز ما", text: "اینکه هر قطعه‌ی زرین سال‌ها بماند و از نسلی به نسل بعد برسد." },
        ],
        perks: [
          { id: "zk1", title: "ارسال بیمه‌شده", text: "ارسال رایگان و بیمه‌شده برای خریدهای بالای ۳۰ میلیون تومان." },
          { id: "zk2", title: "ضمانت اصالت", text: "فاکتور رسمی و کارت ضمانت برای هر قطعه." },
          { id: "zk3", title: "پرداخت مطمئن", text: "پرداخت پس از تأیید تلفنی سفارش." },
          { id: "zk4", title: "۷ روز مهلت تعویض", text: "تا هفت روز بعد از تحویل، سایز یا مدل را عوض کنید." },
        ],
        trustLogos: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `zr${n}`, image: png(`brand-${n}`), title: "برند همکار" })),
        coupons: [
          { id: "zq1", code: "ZARIN10", percent: 10, maxDiscount: 2_000_000, active: true },
          { id: "zq2", code: "HEDIYE", amount: 500_000, minTotal: 20_000_000, categoryIds: ["c6"], active: true },
        ],
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "zf1", q: "قیمت‌ها چطور حساب می‌شوند؟", a: "قیمت هر قطعه از وزن × نرخ روز طلا، به‌اضافه‌ی اجرت، سود فروشنده و مالیات بر ارزش افزوده (فقط روی اجرت و سود) حساب می‌شود. ریز قیمت در صفحه‌ی هر محصول هست." },
          { id: "zf2", q: "امکان بازخرید دارید؟", a: "بله، همه‌ی قطعه‌های زرین با فاکتور به نرخ روز بازخرید می‌شوند." },
          { id: "zf3", q: "سایز انگشتر را چطور انتخاب کنم؟", a: "سایز را در صفحه‌ی محصول انتخاب کنید؛ اگر مطمئن نیستید، تا ۷ روز بعد از تحویل رایگان عوض می‌کنیم." },
        ],
        pages: [
          { id: "zp1", slug: "returns", title: "ارسال و مرجوعی", text: "سفارش‌ها پس از تأیید تلفنی، بیمه‌شده و با پست پیشتاز ارسال می‌شوند.\n\nتا ۷ روز بعد از تحویل، قطعه‌ی سالم و بدون استفاده را با فاکتور تعویض می‌کنیم." },
          { id: "zp2", slug: "terms", title: "قوانین و مقررات", text: "قیمت نهایی هر سفارش با نرخ طلای روز تأیید سفارش حساب می‌شود و پیش از پرداخت به شما اعلام می‌شود." },
        ],
        posts: [
          { id: "zw1", title: "راهنمای خرید هدیه‌ی طلا", image: img("post1"), date: ago(3), author: "تیم زرین", category: "هدیه", excerpt: "برای تولد، سالگرد یا نامزدی چه قطعه‌ای بخریم؟ چند پیشنهاد ساده برای انتخاب هدیه‌ی طلا.", text: post("برای تولد، سالگرد یا نامزدی چه قطعه‌ای بخریم؟") },
          { id: "zw2", title: "چند انگشتر را با هم دست کنیم؟", image: img("post2"), date: ago(10), author: "تیم زرین", category: "استایل", text: post("ست کردن چند انگشتر کنار هم، اگر درست انجام شود، جذاب‌ترین ترند امسال است.") },
          { id: "zw3", title: "طلای زرد یا رزگلد؟", image: img("post3"), date: ago(18), author: "تیم زرین", category: "راهنما", text: post("تفاوت طلای زرد، سفید و رزگلد فقط در رنگ نیست.") },
          { id: "zw4", title: "نگهداری از زیورآلات طلا", image: img("post4"), date: ago(30), author: "تیم زرین", category: "راهنما", text: post("طلا ماندگار است، اما درخشش آن به نگهداری درست بستگی دارد.") },
        ],
        shippingFee: 150_000,
        freeShippingFrom: 30_000_000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش، برای تأیید نرخ روز و هماهنگی ارسال با شما تماس می‌گیریم و شماره‌ی کارت را اعلام می‌کنیم.",
        orderNote: "سفارش شما ثبت شد؛ به‌زودی برای تأیید قیمت با نرخ روز و هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.zr { --zr-ink: var(--color-text); --zr-muted: var(--color-muted); --zr-line: #E9E9E9; --zr-soft: #F5F5F5; --zr-pink: #F8EBEF; --zr-lilac: #F6E8F4; --zr-blue: #D8EDF5; --zr-sand: #F5ECE9;
  --zr-hot: #E5484D; --zr-off: #F0883E; --zr-acc: var(--color-primary);
  --zr-wrap: min(1370px, 100% - 2 * clamp(14px, 3cqi, 40px));
  --sk-accent: #111; --sk-card: var(--color-bg); --sk-line: var(--zr-line); --sk-soft: var(--zr-soft); --sk-muted: var(--zr-muted); --sk-card-radius: 0; --sk-radius: 0;
  background: var(--color-bg); color: var(--zr-ink); min-height: 100%; font-size: 14px; font-weight: 300; line-height: 1.8; }
.zr a { color: inherit; text-decoration: none; }
.zr button { font: inherit; color: inherit; }
.zr b, .zr strong, .zr h3 { font-weight: 600; }
.zr h1, .zr h2 { font-weight: 400; letter-spacing: 0; line-height: 1.5; }
.zr .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.zr-wrap { width: var(--zr-wrap); margin-inline: auto; }
.zr-ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.zr-act { display: contents; }
.zr-sec { padding-block: clamp(40px, 5.5cqi, 80px); }
.zr-sec-tight { padding-top: 10px; }
.zr-sec-line { border-top: 1px solid var(--zr-line); }
.zr-muted { color: var(--zr-muted); }
.zr-notice { padding: 18px 24px; border-inline-start: 3px solid var(--zr-ink); background: var(--zr-soft); }
.zr-error { padding: 12px 16px; background: #FDECEC; color: #C62A2F; }
.zr-text { display: grid; gap: 14px; color: var(--zr-muted); line-height: 2.1; }
.zr-pic { position: relative; display: block; overflow: hidden; background: var(--zr-soft); }
.zr-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.zr-add { display: grid; place-items: center; min-height: 80px; border: 1px dashed var(--zr-line); color: var(--zr-muted); cursor: pointer; }
.zr-main > * { animation: zr-in .6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes zr-in { from { opacity: 0; transform: translateY(14px); } }

/* Buttons: black, a framed light one, a grey wide one; small sizes */
.zr-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 28px; border: 1px solid #111; background: #111; color: #fff !important; font-size: .86em; font-weight: 500; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.zr-btn:hover { background: var(--zr-acc); border-color: var(--zr-acc); }
.zr-btn.ghost { background: transparent; color: #111 !important; }
.zr-btn.ghost:hover { background: #111; color: #fff !important; border-color: #111; }
.zr-btn.grey { background: var(--zr-soft); border-color: var(--zr-soft); color: #111 !important; }
.zr-btn.grey:hover { background: #111; border-color: #111; color: #fff !important; }
.zr-btn.small { min-height: 36px; padding: 0 18px; font-size: .8em; }
.zr-btn.tiny { min-height: 30px; padding: 0 14px; font-size: .76em; }
.zr-btn.wide, .zr-btn.full { width: 100%; }
.zr-under { display: inline-block; padding-bottom: 2px; border: 0; border-bottom: 1px solid currentColor; background: none; font-size: .8em; font-weight: 500; cursor: pointer; }
.zr-under:hover { color: var(--zr-acc); }
.zr-more { display: inline-flex; align-items: center; gap: 4px; font-size: .86em; }
.zr-more .zr-ico { width: 16px; height: 16px; }

/* Headings of sections */
.zr-head-c { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(22px, 3cqi, 36px); text-align: center; }
.zr-head-c h2 { font-size: clamp(1.5em, 2.2cqi, 2.05em); }
.zr-head-c p, .zr-head-c a { color: var(--zr-muted); font-size: .92em; }

/* Top strips */
.zr-announce { padding: 6px 12px; background: var(--zr-pink); color: #111; text-align: center; font-size: .82em; font-weight: 400; }
.zr-top { background: #111; color: #fff; font-size: .78em; }
.zr-home .zr-top { background: var(--color-bg); color: var(--zr-ink); border-bottom: 1px solid var(--zr-line); }
.zr-top-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 34px; }
.zr-top-start { display: flex; align-items: center; gap: 22px; }
.zr-top-note { opacity: .9; }
.zr-rate { display: inline-flex; align-items: center; gap: 6px; }
.zr-rate .zr-ico { width: 15px; height: 15px; color: #C9A45C; }
.zr-rate small { opacity: .65; font-size: .92em; }
.zr-top-links { display: flex; gap: 18px; }
.zr-top-links a:hover { opacity: .7; }

/* Header */
.zr-head { position: sticky; top: 0; z-index: 30; background: var(--color-bg); }
.zr-head-home { border-bottom: 1px solid transparent; }
.zr-head-in { display: flex; align-items: center; gap: 28px; min-height: 76px; }
.zr-logo { display: inline-flex; align-items: center; flex: none; }
.zr-logo img { display: block; width: auto; height: 22px; }
.zr-logo b { font-size: 1.7em; font-weight: 400; letter-spacing: .02em; }
.zr-nav { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); margin-inline: auto; font-size: .86em; font-weight: 500; }
.zr-nav-item { position: relative; }
.zr-nav-item > a { display: inline-flex; align-items: center; gap: 3px; padding: 26px 0; transition: color .2s; }
.zr-nav-item > a::after { content: ""; position: absolute; inset-inline: 0; bottom: 20px; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.zr-nav-item > a:hover::after, .zr-nav-item > a[aria-current="page"]::after { transform: scaleX(1); }
.zr-caret { width: 12px; height: 12px; stroke-width: 1.6; }
.zr-sub { position: absolute; top: 100%; inset-inline-start: -18px; z-index: 5; display: grid; min-width: 200px; padding: 12px 0; background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.zr-nav-item:hover .zr-sub, .zr-nav-item:focus-within .zr-sub { opacity: 1; visibility: visible; transform: none; }
.zr-sub a { padding: 7px 20px; font-weight: 400; }
.zr-sub a:hover { color: var(--zr-acc); }
.zr-icons { display: flex; align-items: center; gap: 18px; }
.zr-icon { position: relative; display: inline-flex; align-items: center; transition: color .2s; }
.zr-icon:hover { color: var(--zr-acc); }
.zr-icon > i { position: absolute; top: -7px; inset-inline-end: -9px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px; background: #111; color: #fff; font-size: 10px; font-style: normal; font-weight: 500; line-height: 16px; text-align: center; }
.zr-head-inner .zr-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 80px; }
.zr-head-inner .zr-icons { justify-self: end; }
.zr-head-search { display: flex; width: min(340px, 100%); border: 1px solid var(--zr-line); }
.zr-head-search input, .zr-side-search input, .zr-drawer-search input { flex: 1; min-width: 0; padding: 9px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: .9em; }
.zr-head-search input:focus, .zr-side-search input:focus, .zr-drawer-search input:focus { outline: none; }
.zr-head-search button, .zr-side-search button, .zr-drawer-search button { display: grid; place-items: center; padding-inline: 12px; border: 0; background: none; cursor: pointer; }
.zr-head-search .zr-ico { width: 17px; height: 17px; }
.zr-head-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--zr-line); }
.zr-head-row2 .zr-nav { margin: 0; }
.zr-head-row2 .zr-nav-item > a { padding: 14px 0; }
.zr-head-row2 .zr-nav-item > a::after { bottom: 9px; }
.zr-browse { position: relative; font-size: .84em; font-weight: 600; }
.zr-browse > summary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 0; cursor: pointer; list-style: none; }
.zr-browse > summary::-webkit-details-marker { display: none; }
.zr-browse > div { position: absolute; top: 100%; inset-inline-start: 0; z-index: 6; display: grid; min-width: 230px; padding: 8px 0; border: 1px solid var(--zr-line); background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); }
.zr-browse > div a { padding: 8px 18px; font-weight: 400; }
.zr-browse > div a:hover { background: var(--zr-soft); }
.zr-head-contact { display: flex; justify-content: flex-end; gap: 22px; font-size: .84em; }
.zr-head-contact a { display: inline-flex; align-items: center; gap: 6px; }
.zr-head-contact .zr-ico { width: 17px; height: 17px; }
.zr-menu { display: none; }
.zr-menu > summary { list-style: none; cursor: pointer; }
.zr-menu > summary::-webkit-details-marker { display: none; }
.zr-menu[open]::before { content: ""; position: fixed; inset: 0; z-index: 100; background: rgb(0 0 0 / .4); }
.zr-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 4px; width: min(340px, 86%); height: 100vh; padding: 18px 22px 90px; overflow-y: auto; background: var(--color-bg); box-shadow: 0 0 40px rgb(0 0 0 / .2); animation: zr-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes zr-drawer { from { transform: translateX(100%); } }
.zr-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.zr-drawer-search { display: flex; margin-bottom: 8px; border: 1px solid var(--zr-line); }
.zr-drawer-nav { display: grid; }
.zr-drawer-nav .zr-nav-item > a { width: 100%; padding: 11px 0; border-bottom: 1px solid var(--zr-line); }
.zr-drawer-nav .zr-nav-item > a::after, .zr-drawer-nav .zr-caret { display: none; }
.zr-drawer-nav .zr-sub { position: static; display: grid; min-width: 0; padding: 0 14px 6px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
.zr-drawer-nav .zr-sub a { padding: 6px 0; font-size: .92em; color: var(--zr-muted); }
.zr-drawer > a { padding: 10px 0; }
.zr-drawer hr { width: 100%; margin: 8px 0; border: 0; border-top: 1px solid var(--zr-line); }
.zr-drawer .zr-rate { margin-top: 12px; font-size: .82em; }

/* Home: three picture banners */
.zr-hero { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 20px; padding-top: 6px; aspect-ratio: 1370 / 770; }
.zr-hero-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; aspect-ratio: 1370 / 560; }
.zr-hero-2 { grid-template-rows: 1fr; aspect-ratio: 1370 / 560; }
.zr-pb { position: relative; overflow: hidden; background: var(--zr-soft); }
.zr-pb.big { grid-row: span 2; }
.zr-hero-2 .zr-pb.big { grid-row: auto; }
.zr-pb-pic, .zr-pb-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.zr-pb-pic img { object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.zr-pb:hover .zr-pb-pic img { transform: scale(1.04); }
.zr-pb-text { position: relative; display: grid; justify-items: start; gap: 4px; width: min(300px, 70%); margin-inline-start: auto; padding: clamp(18px, 2.6cqi, 40px); }
.zr-pb-text small { font-size: clamp(.95em, 1.3cqi, 1.25em); font-weight: 300; }
.zr-pb-text h2 { font-size: clamp(1.25em, 2.2cqi, 2.1em); line-height: 1.35; }
.zr-pb-text p { color: #555; font-size: .82em; line-height: 1.7; }
.zr-pb-text .zr-btn { margin-top: 14px; }

/* Home: categories, product row, sale head, store strip */
.zr-cats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; }
.zr-cat { display: grid; justify-items: center; gap: 14px; text-align: center; }
.zr-cat-pic { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: var(--zr-soft); }
.zr-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.zr-cat:hover .zr-cat-pic img { transform: scale(1.08); }
.zr-cat b { font-size: .82em; font-weight: 500; }
.zr-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 20px) / 4); gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: thin; }
.zr-slide-row > * { scroll-snap-align: start; }
.zr-sale-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-bottom: 22px; }
.zr-sale-head h2 { font-size: clamp(1.4em, 2cqi, 1.9em); }
.zr-sale-head .zr-more { margin-inline-start: auto; }
.zr-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--zr-hot); font-size: .82em; font-weight: 500; }
.zr-clock .zr-ico { width: 15px; height: 15px; }
.zr-store { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px 18px; min-height: 64px; padding: 10px 16px; background: var(--zr-lilac); font-size: 1.05em; }
.zr-store > .zr-ico { width: 22px; height: 22px; }

/* Home: three tall pictures with text */
.zr-edits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.zr-edit { display: grid; justify-items: center; gap: 4px; text-align: center; }
.zr-edit-pic { position: relative; display: block; width: 100%; aspect-ratio: 436 / 550; margin-bottom: 14px; overflow: hidden; background: var(--zr-soft); }
.zr-edit-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, 1, .3, 1); }
.zr-edit:hover .zr-edit-pic img { transform: scale(1.05); }
.zr-edit h3 { font-size: 1.25em; font-weight: 400; }
.zr-edit p { color: var(--zr-muted); font-size: .86em; }
.zr-edit .zr-under { margin-top: 8px; }

/* Home: two pictures and the pale-blue card over them */
.zr-craft { position: relative; display: grid; grid-template-columns: 1fr 1fr 1.05fr; align-items: center; }
.zr-craft-1, .zr-craft-2 { aspect-ratio: 490 / 510; }
.zr-craft-2 { margin-inline-end: -8%; }
.zr-craft-card { position: relative; z-index: 1; display: grid; justify-items: center; gap: 12px; padding: clamp(26px, 4cqi, 60px) clamp(20px, 3cqi, 46px); background: var(--zr-blue); text-align: center; }
.zr-craft-card h2 { font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.zr-craft-card p { color: #555; font-size: .9em; line-height: 1.9; }
.zr-why { display: grid; justify-items: center; gap: 14px; width: min(760px, var(--zr-wrap)); padding-top: 0; text-align: center; }
.zr-why h2 { font-size: clamp(1.5em, 2.2cqi, 2em); }
.zr-why p { color: var(--zr-muted); line-height: 2; }

/* Home: the pale band with a picture, a heading, a signature and a button */
.zr-since { background: var(--zr-sand); }
.zr-since-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: clamp(26px, 5cqi, 80px); padding-block: clamp(36px, 5cqi, 70px); }
.zr-since-pic { aspect-ratio: 685 / 400; }
.zr-since-text { display: grid; justify-items: start; gap: 14px; max-width: 520px; }
.zr-since-text h2 { font-size: clamp(1.5em, 2.3cqi, 2.1em); white-space: pre-line; line-height: 1.45; }
.zr-since-text p { color: #555; line-height: 2; }
.zr-sign { display: block; width: 120px; height: auto; }

/* Home: brands and Instagram */
.zr-brands { border-block: 1px solid var(--zr-line); }
.zr-brands .zr-wrap { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); align-items: center; justify-items: center; gap: 20px; min-height: 120px; }
.zr-brands img { max-width: 120px; max-height: 40px; opacity: .65; filter: grayscale(1); transition: opacity .3s; }
.zr-brands a:hover img, .zr-brands span:hover img { opacity: 1; }
.zr-insta-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.zr-insta-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.zr-insta-pic span, .zr-insta-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.zr-insta-pic img { object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.zr-insta-pic:hover img { transform: scale(1.08); }

/* Product cards: a square picture on pale grey (the second picture on hover), badges, side buttons */
.zr-card { display: grid; gap: 4px; align-content: start; text-align: center; animation: zr-in .6s calc(var(--i) * 50ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.zr-card-pic { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--zr-soft); }
.zr-img, .zr-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.zr-img img { object-fit: cover; mix-blend-mode: multiply; transition: opacity .5s, transform .9s cubic-bezier(.2, 1, .3, 1); }
.zr-img .zr-img-2 { opacity: 0; }
.zr-card:hover .zr-img .zr-img-2 { opacity: 1; }
.zr-card:hover .zr-img img { transform: scale(1.04); }
.zr-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 2.6em; color: var(--zr-muted); }
.zr-badges { position: absolute; top: 12px; inset-inline-start: 12px; display: grid; justify-items: start; gap: 5px; pointer-events: none; }
.zr-badge { display: inline-block; padding: 1px 8px; background: var(--zr-hot); color: #fff; font-size: .7em; font-weight: 500; line-height: 1.9; }
.zr-badge.off { background: var(--zr-off); }
.zr-badge.out { position: absolute; top: 12px; inset-inline-start: 12px; background: #8A8A8A; }
.zr-badge.dark { background: #111; }
.zr-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2; display: grid; gap: 6px; opacity: 0; transform: translateX(-10px); transition: opacity .3s, transform .3s; }
.zr-card:hover .zr-card-acts, .zr-card-acts:focus-within { opacity: 1; transform: none; }
.zr-round { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 4px 14px -6px rgb(0 0 0 / .3); cursor: pointer; transition: background .2s, color .2s; }
.zr-round:hover, .zr-round.on { background: #111; color: #fff !important; }
.zr-round .zr-ico { width: 17px; height: 17px; }
.zr-card-text { display: grid; justify-items: center; gap: 2px; padding-top: 10px; }
.zr-card-cat { color: #999; font-size: .72em; }
.zr-card-name { font-size: .92em; font-weight: 400; }
.zr-card-name:hover { color: var(--zr-acc); }
.zr-goldline { color: var(--zr-muted); font-size: .76em; }
.zr-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; font-size: .9em; }
.zr-price b { font-weight: 500; }
.zr-price s { color: #A0A0A0; font-size: .86em; }
.zr-card-desc { color: var(--zr-muted); font-size: .86em; line-height: 1.9; }

/* Shop: picture band, bar, grid modes, side column, pages */
.zr-banner { position: relative; display: grid; place-items: center; min-height: clamp(150px, 15cqi, 230px); overflow: hidden; background: #D6D6D6; text-align: center; }
.zr-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.zr-banner > div { position: relative; display: grid; justify-items: center; gap: 2px; padding: 20px; }
.zr-banner h1 { font-size: clamp(1.8em, 3cqi, 2.6em); }
.zr-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--zr-muted); font-size: .8em; }
.zr-trail a:hover { color: var(--zr-ink); }
.zr-trail i { margin-inline: 6px; font-style: normal; opacity: .6; }
.zr-trail b { color: var(--zr-ink); font-weight: 400; }
.zr-sep { width: 12px; height: 12px; margin-inline: 4px; opacity: .6; }
.zr-trail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 16px; }
.zr-prevnext { display: flex; gap: 6px; }
.zr-prevnext .zr-ico { width: 18px; height: 18px; }
.zr-plp { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: clamp(24px, 3cqi, 40px); align-items: start; padding-block: 26px clamp(40px, 5cqi, 70px); }
.zr-plp-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; font-size: .86em; }
.zr-plp-bar > small { margin-inline-end: auto; color: var(--zr-muted); font-size: 1em; }
.zr-views { display: flex; gap: 6px; }
.zr-views a { display: grid; place-items: center; width: 30px; height: 30px; color: #B5B5B5; }
.zr-views a[aria-current], .zr-views a:hover { color: #111; }
.zr-views .zr-ico { width: 18px; height: 18px; }
.zr-sort { position: relative; }
.zr-sort > summary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: var(--zr-muted); cursor: pointer; list-style: none; }
.zr-sort > summary::-webkit-details-marker { display: none; }
.zr-sort > summary b { color: var(--zr-ink); font-weight: 400; }
.zr-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 170px; border: 1px solid var(--zr-line); background: var(--color-bg); box-shadow: 0 12px 24px -16px rgb(0 0 0 / .3); }
.zr-sort-list button { width: 100%; padding: 8px 14px; border: 0; background: none; text-align: start; cursor: pointer; }
.zr-sort-list button:hover, .zr-sort-list button[aria-current] { background: var(--zr-soft); }
.zr-grid { display: grid; gap: 34px 20px; }
.zr-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.zr-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.zr-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.zr-cols-list { grid-template-columns: 1fr; gap: 24px; }
.zr-row { grid-template-columns: 180px minmax(0, 1fr); gap: 24px; text-align: start; }
.zr-row .zr-card-text { justify-items: start; align-content: center; padding: 0; gap: 4px; }
.zr-row .zr-price { justify-content: flex-start; }
.zr-row .zr-btn { margin-top: 10px; }
.zr-pager { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.zr-pager a { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid transparent; font-size: .9em; }
.zr-pager a[aria-current] { border-color: #111; }
.zr-pager .zr-ico { width: 16px; height: 16px; }
.zr-side { display: grid; gap: 0; align-content: start; }
.zr-side-box { padding-block: 16px; border-bottom: 1px solid var(--zr-line); }
.zr-side-box > summary { display: flex; align-items: center; justify-content: space-between; font-size: 1.05em; font-weight: 400; cursor: pointer; list-style: none; }
.zr-side-box > summary::-webkit-details-marker { display: none; }
.zr-side-box:not([open]) .zr-caret { transform: rotate(180deg); }
.zr-side-box > div { display: grid; gap: 8px; padding-top: 14px; }
.zr-side-cats { display: grid; gap: 6px; font-size: .9em; }
.zr-side-cats a { display: flex; justify-content: space-between; color: #555; }
.zr-side-cats a:hover, .zr-side-cats a[aria-current] { color: var(--zr-ink); font-weight: 500; }
.zr-side-cats small, .zr-check small { color: #AAA; }
.zr-check { display: flex; align-items: center; gap: 10px; font-size: .9em; color: #555; cursor: pointer; }
.zr-check span { flex: 1; }
.zr-check input { width: 15px; height: 15px; margin: 0; accent-color: #111; }
.zr-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.zr-sizes label { cursor: pointer; }
.zr-sizes input { position: absolute; opacity: 0; }
.zr-sizes span { display: grid; place-items: center; min-width: 38px; height: 34px; padding: 0 8px; border: 1px solid var(--zr-line); font-size: .86em; }
.zr-sizes input:checked + span { border-color: #111; background: #111; color: #fff; }
.zr-facets-foot { display: flex; align-items: center; gap: 16px; padding-top: 18px; }
.zr-range { position: relative; height: 18px; }
.zr-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: #111; }
.zr-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.zr-range input::-webkit-slider-thumb { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.zr-range input::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; }
.zr-range input::-webkit-slider-runnable-track { background: none; }
.zr-range input::-moz-range-track { background: none; }
.zr-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.zr-range-foot small { font-size: .8em; color: #555; }
.zr-side-search { display: flex; border: 1px solid var(--zr-line); margin-bottom: 4px; }

/* Product page */
.zr-product { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(26px, 4cqi, 60px); padding-bottom: clamp(30px, 4cqi, 56px); }
.zr-gallery { position: relative; display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.zr-gallery.zr-n0, .zr-gallery.zr-n1 { grid-template-columns: 1fr; }
.zr-g { position: absolute; opacity: 0; pointer-events: none; }
.zr-thumbs { display: grid; gap: 10px; }
.zr-thumbs label { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border: 1px solid transparent; background: var(--zr-soft); cursor: pointer; transition: border-color .2s; }
.zr-thumbs img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.zr-mainpic { position: relative; display: grid; background: var(--zr-soft); }
.zr-big { grid-area: 1 / 1; position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.zr-big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.zr-gallery:not(.zr-n0):not(.zr-n1) .zr-big { visibility: hidden; opacity: 0; transition: opacity .4s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.zr-g:nth-of-type(${n}):checked ~ .zr-mainpic > .zr-big:nth-child(${n})`).join(", ")} { visibility: visible !important; opacity: 1 !important; }
${[1, 2, 3, 4, 5, 6].map((n) => `.zr-g:nth-of-type(${n}):checked ~ .zr-thumbs > label:nth-child(${n})`).join(", ")} { border-color: #111; }
.zr-zoom-ico { position: absolute; top: 14px; inset-inline-end: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.zr-zoom-ico .zr-ico { width: 16px; height: 16px; }
.zr-mainpic .zr-badges, .zr-mainpic .zr-badge.out { z-index: 1; }
.zr-info { display: grid; gap: 12px; align-content: start; }
.zr-info h1 { font-size: clamp(1.5em, 2.1cqi, 2em); line-height: 1.5; }
.zr-rating { display: inline-flex; align-items: center; gap: 6px; font-size: .86em; color: var(--zr-muted); }
.zr-info-price { display: flex; align-items: center; gap: 12px; }
.zr-info-price .zr-price { font-size: 1.35em; }
.zr-save { padding: 1px 8px; background: var(--zr-off); color: #fff; font-size: .78em; }
.zr-desc { color: var(--zr-muted); line-height: 2; }
.zr-avail { font-size: .9em; }
.zr-avail .in { color: #16A34A; font-weight: 500; }
.zr-avail .out { color: var(--zr-hot); font-weight: 500; }
.zr-goldbox { display: grid; gap: 8px; padding: 16px 18px; border: 1px solid var(--zr-line); background: #FCFAF6; }
.zr-goldbox h3 { font-size: .95em; }
.zr-goldbox dl { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 10px; row-gap: 0; margin: 0; font-size: .88em; }
.zr-goldbox dt { grid-row: 1; color: var(--zr-muted); }
.zr-goldbox dd { grid-row: 2; margin: 0 0 0 24px; font-weight: 500; }
.zr-goldbox .zr-under { justify-self: start; }
.zr-buy { display: grid; gap: 10px; }
.zr-buy-row { display: flex; gap: 10px; }
.zr-buy-row .zr-btn { flex: 1; }
.zr-qty input { width: 90px; height: 44px; padding: 0 10px; border: 1px solid var(--zr-line); background: var(--color-bg); color: inherit; font: inherit; text-align: center; }
.zr-links { display: flex; flex-wrap: wrap; gap: 8px 22px; padding-top: 6px; }
.zr-linkbtn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; font-size: .86em; cursor: pointer; }
.zr-linkbtn:hover { color: var(--zr-acc); }
.zr-linkbtn .zr-ico, .zr-eta .zr-ico { width: 17px; height: 17px; }
.zr-eta { display: flex; align-items: center; gap: 8px; font-size: .86em; color: #555; }
.zr-eta b { font-weight: 500; color: var(--zr-ink); }
.zr-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 6px 0 0; padding: 16px 10px; list-style: none; border: 1px solid var(--zr-line); text-align: center; }
.zr-perks li { display: grid; justify-items: center; gap: 6px; font-size: .78em; color: #555; }
.zr-perks .zr-ico, .zr-perks img { width: 26px; height: 26px; stroke-width: 1.2; object-fit: contain; }
.zr-meta { display: flex; align-items: center; gap: 6px; color: var(--zr-muted); font-size: .86em; }
.zr-meta a:hover { color: var(--zr-ink); }
.zr-share .zr-ico { width: 17px; height: 17px; }
.zr-tabs { display: grid; padding-block: 10px clamp(30px, 4cqi, 60px); border-top: 1px solid var(--zr-line); }
.zr-tab-in { position: absolute; opacity: 0; pointer-events: none; }
.zr-tab-labels { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px clamp(18px, 3cqi, 44px); margin-bottom: 26px; }
.zr-tab-labels label { position: relative; padding: 14px 0 8px; color: var(--zr-muted); font-size: 1.02em; cursor: pointer; }
.zr-tab-labels label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: #111; transform: scaleX(0); transition: transform .3s; }
.zr-tab-panel { display: none; }
${[1, 2, 3, 4].map((n) => `.zr-tab-in:nth-of-type(${n}):checked ~ .zr-tab-panels > .zr-tab-panel:nth-child(${n})`).join(", ")} { display: block; animation: zr-in .4s ease both; }
${[1, 2, 3, 4].map((n) => `.zr-tab-in:nth-of-type(${n}):checked ~ .zr-tab-labels > label:nth-child(${n})`).join(", ")} { color: var(--zr-ink); }
${[1, 2, 3, 4].map((n) => `.zr-tab-in:nth-of-type(${n}):checked ~ .zr-tab-labels > label:nth-child(${n})::after`).join(", ")} { transform: scaleX(1); }
.zr-tab-desc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.zr-tab-desc img { width: 100%; max-height: 460px; aspect-ratio: 4 / 3; object-fit: cover; background: var(--zr-soft); }
.zr-specs { width: min(720px, 100%); margin-inline: auto; }
.zr-breakup { display: grid; gap: 12px; width: min(620px, 100%); margin-inline: auto; }
.zr-breakup table { width: 100%; border-collapse: collapse; font-size: .92em; }
.zr-breakup th, .zr-breakup td { padding: 11px 14px; border-bottom: 1px solid var(--zr-line); text-align: start; font-weight: 400; }
.zr-breakup td { text-align: end; white-space: nowrap; }
.zr-breakup tr:nth-child(odd) { background: #FAFAFA; }
.zr-breakup .total th, .zr-breakup .total td { border-bottom: 0; background: #111; color: #fff; font-weight: 500; }
.zr-breakup p { font-size: .84em; }
.zr-tab-panels .sk-reviews { width: min(860px, 100%); margin-inline: auto; }

/* About */
.zr-about-top { display: grid; justify-items: center; gap: 6px; padding-block: clamp(20px, 3cqi, 40px) clamp(26px, 3cqi, 44px); text-align: center; }
.zr-about-top h1, .zr-page-title { font-size: clamp(1.8em, 2.8cqi, 2.5em); }
.zr-page-title { padding-block: 6px 18px; }
.zr-about-top p { max-width: 40em; color: var(--zr-muted); }
.zr-about-pics { display: grid; grid-template-columns: 1fr 1fr; }
.zr-about-pics > .zr-pic { aspect-ratio: 960 / 687; }
.zr-story { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 2fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.zr-story h2 { display: flex; align-items: center; gap: 16px; font-size: clamp(1.5em, 2.3cqi, 2.1em); }
.zr-story h2 i { width: 70px; height: 1px; background: currentColor; }
.zr-story > div { display: grid; gap: 16px; }
.zr-story-lead { font-size: 1.15em; font-weight: 500; line-height: 1.9; white-space: pre-line; }
.zr-mission { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; width: var(--zr-wrap); margin-inline: auto; }
.zr-mission-pic { aspect-ratio: 960 / 540; }
.zr-mission-text { display: grid; align-content: center; gap: 30px; padding: clamp(24px, 4cqi, 60px); background: var(--zr-soft); }
.zr-mission-text h3 { margin-bottom: 8px; font-size: 1.25em; font-weight: 400; }
.zr-mission-text p { color: var(--zr-muted); font-size: .9em; line-height: 2; }
.zr-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 26px; text-align: center; }
.zr-values > div { display: grid; justify-items: center; gap: 8px; }
.zr-values .zr-ico, .zr-values img { width: 34px; height: 34px; stroke-width: 1.2; object-fit: contain; }
.zr-values h3 { font-size: 1.05em; font-weight: 500; }
.zr-values p { max-width: 24em; color: var(--zr-muted); font-size: .86em; line-height: 1.9; }
.zr-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.zr-team figure { display: grid; gap: 10px; margin: 0; }
.zr-team-pic { position: relative; display: block; aspect-ratio: 435 / 488; overflow: hidden; background: var(--zr-soft); }
.zr-team-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.zr-team figure:hover img { transform: scale(1.05); }
.zr-team figcaption { display: grid; }
.zr-team b { font-weight: 500; }
.zr-team small { color: var(--zr-muted); }
.zr-quotes { position: relative; background: var(--zr-pink); }
.zr-q-in { position: absolute; opacity: 0; pointer-events: none; }
.zr-q-list { display: grid; padding-block: clamp(30px, 4cqi, 60px); }
.zr-q-item { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) 240px; align-items: center; gap: clamp(20px, 4cqi, 60px); margin: 0; }
.zr-q2 .zr-q-item, .zr-q3 .zr-q-item, .zr-q4 .zr-q-item, .zr-q5 .zr-q-item { visibility: hidden; opacity: 0; transition: opacity .5s; }
${[1, 2, 3, 4, 5].map((n) => `.zr-q-in:nth-of-type(${n}):checked ~ .zr-q-list > .zr-q-item:nth-child(${n})`).join(", ")} { visibility: visible; opacity: 1; }
.zr-q-item > div { display: grid; justify-items: start; gap: 10px; }
.zr-q-item small { font-size: .8em; color: #555; }
.zr-stars { color: #F2994A; letter-spacing: 2px; }
.zr-q-item blockquote { margin: 0; font-size: clamp(1.1em, 1.6cqi, 1.45em); line-height: 1.8; }
.zr-q-item figcaption { font-size: .86em; font-weight: 500; }
.zr-q-arrows { display: flex; gap: 14px; margin-top: 10px; }
.zr-q-arrows label { cursor: pointer; }
.zr-q-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.zr-q-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Blog */
.zr-blog { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: clamp(24px, 4cqi, 56px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.zr-posts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.zr-post-card { display: grid; gap: 8px; align-content: start; justify-items: start; }
.zr-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--zr-soft); }
.zr-post-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.zr-post-card:hover .zr-post-pic img { transform: scale(1.05); }
.zr-post-pic .zr-badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.zr-post-meta { color: #999; font-size: .76em; }
.zr-post-card h2 { font-size: 1.2em; line-height: 1.6; }
.zr-post-card h2 a:hover { color: var(--zr-acc); }
.zr-post-card p { color: var(--zr-muted); font-size: .9em; line-height: 1.9; }
.zr-mini { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: center; }
.zr-mini > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--zr-soft); }
.zr-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.zr-mini > span:last-child { display: grid; gap: 2px; font-size: .86em; }
.zr-mini b { font-weight: 500; }
.zr-mini small { color: #999; }
.zr-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.zr-tags span { padding: 3px 10px; border: 1px solid var(--zr-line); font-size: .8em; }
.zr-article { display: grid; gap: 14px; align-content: start; justify-items: start; }
.zr-article h1 { font-size: clamp(1.6em, 2.6cqi, 2.3em); }
.zr-article-pic { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.zr-article .zr-text { color: #555; }
.zr-post-nav { display: flex; justify-content: space-between; gap: 20px; width: 100%; padding-block: 18px; border-block: 1px solid var(--zr-line); }
.zr-post-nav a { display: grid; gap: 2px; max-width: 46%; }
.zr-post-nav a:last-child { text-align: end; }
.zr-post-nav small { color: #999; font-size: .78em; }
.zr-post-nav b { font-weight: 400; }
.zr-related { display: grid; gap: 14px; width: 100%; }
.zr-related h2 { font-size: 1.2em; }
.zr-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.zr-rel { display: grid; gap: 8px; }
.zr-rel > span { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--zr-soft); }
.zr-rel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.zr-rel .zr-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-style: normal; }
.zr-rel b { font-weight: 400; }

/* Contact */
.zr-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.zr-contact-info { display: grid; gap: 20px; }
.zr-contact-item { display: flex; align-items: flex-start; gap: 14px; }
.zr-contact-item > .zr-ico { width: 24px; height: 24px; margin-top: 4px; }
.zr-contact-item span { display: grid; }
.zr-contact-item small { color: var(--zr-muted); }
.zr-contact-item b, .zr-contact-item a { font-weight: 500; }
.zr-message { display: grid; gap: 12px; padding: clamp(20px, 3cqi, 36px); background: var(--zr-soft); }
.zr-message h2 { font-size: 1.4em; }
.zr-message input, .zr-message textarea, .zr-checkout input, .zr-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--zr-line); background: var(--color-bg); color: inherit; font: inherit; }
.zr-message input:focus, .zr-message textarea:focus, .zr-checkout input:focus, .zr-checkout textarea:focus { outline: none; border-color: #111; }
.zr-message .zr-btn { justify-self: start; }
.zr-map { position: relative; aspect-ratio: 3 / 1; border: 1px solid var(--zr-line); background: var(--zr-soft); }
.zr-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.zr-map .zr-btn { position: absolute; bottom: 14px; inset-inline-start: 14px; }
.zr-map-link { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 20px; border: 1px dashed var(--zr-line); }

/* Cart, checkout, search, thanks */
.zr-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.zr-lines { display: grid; border-top: 1px solid var(--zr-line); }
.zr-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--zr-line); }
.zr-line-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--zr-soft); }
.zr-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.zr-line-info { display: grid; gap: 2px; }
.zr-line-info b { font-weight: 500; }
.zr-line-info small { color: var(--zr-muted); }
.zr-stepper { display: flex; align-items: center; border: 1px solid var(--zr-line); }
.zr-stepper button { width: 34px; height: 34px; border: 0; background: none; font-size: 1.1em; cursor: pointer; }
.zr-stepper span { min-width: 24px; text-align: center; }
.zr-line-total { min-width: 8em; text-align: end; font-weight: 500; }
.zr-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--zr-muted) !important; cursor: pointer; }
.zr-remove:hover { color: var(--zr-hot) !important; }
.zr-sum { position: sticky; top: 140px; display: grid; gap: 14px; padding: 24px; background: var(--zr-soft); }
.zr-sum h2 { font-size: 1.25em; }
.zr-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; }
.zr-sum dd { margin: 0; text-align: end; }
.zr-sum .total { padding-top: 12px; border-top: 1px solid #DDD; font-weight: 600; }
.zr-sum small { color: var(--zr-muted); }
.zr-off { color: #15803D; }
.zr-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: .9em; }
.zr-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.zr-pay { padding: 12px 14px; border: 1px dashed #CCC; background: var(--color-bg); font-size: .86em; line-height: 1.9; }
.zr-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.zr-checkout h2, .zr-checkout .full, .zr-checkout .zr-error { grid-column: 1 / -1; }
.zr-checkout h2 { font-size: 1.25em; }
.zr-checkout label { display: grid; gap: 6px; font-size: .9em; font-weight: 500; }
.zr-trap { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.zr-empty { display: grid; justify-items: start; gap: 24px; padding-bottom: clamp(40px, 5cqi, 70px); }
.zr-empty .zr-notice { justify-self: stretch; }
.zr-search { display: grid; gap: 26px; padding-bottom: clamp(40px, 5cqi, 70px); }
.zr-search-box { display: flex; width: min(560px, 100%); margin-inline: auto; border: 1px solid #111; }
.zr-search-box input { flex: 1; min-width: 0; padding: 16px 20px; border: 0; background: none; color: inherit; font: inherit; }
.zr-search-box input:focus { outline: none; }
.zr-search-box button { width: 60px; border: 0; background: none; cursor: pointer; }
.zr-search .zr-muted { text-align: center; }
.zr-thanks { display: grid; justify-items: center; gap: 14px; padding-block: clamp(40px, 6cqi, 90px); text-align: center; }
.zr-thanks p { max-width: 36em; line-height: 2; }
.zr-done { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #E8F6EC; color: #16A34A; font-size: 2em; }

/* Newsletter and footer */
.zr-news { padding-block: clamp(36px, 5cqi, 64px); background: var(--zr-soft); text-align: center; }
.zr-news.is-home { background: var(--color-bg); }
.zr-news .zr-wrap { display: grid; justify-items: center; gap: 6px; }
.zr-news h2 { font-size: clamp(1.4em, 2.1cqi, 1.9em); }
.zr-news p { color: var(--zr-muted); font-size: .88em; }
.zr-news-form { display: flex; gap: 8px; width: min(480px, 100%); margin-top: 14px; }
.zr-news-form input { flex: 1; min-width: 0; padding: 10px 14px; border: 1px solid #111; background: var(--color-bg); color: inherit; font: inherit; font-size: .9em; }
.zr-news-form button { padding: 0 24px; border: 1px solid #111; background: #111; color: #fff; font-size: .82em; cursor: pointer; transition: background .2s; }
.zr-news-form button:hover { background: var(--zr-acc); border-color: var(--zr-acc); }
.zr-foot { padding-top: clamp(40px, 5cqi, 64px); border-top: 1px solid var(--zr-line); background: #FAFAFA; font-size: .88em; }
.zr-foot-cols { display: grid; grid-template-columns: 1.3fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-bottom: 36px; }
.zr-foot-cols > div { display: grid; align-content: start; gap: 8px; }
.zr-foot-cols h3 { margin-bottom: 6px; font-size: 1.05em; font-weight: 500; }
.zr-foot-cols a { color: #666; }
.zr-foot-cols a:hover { color: #111; }
.zr-foot-brand small { color: var(--zr-muted); }
.zr-foot-brand .zr-logo img { height: 24px; }
.zr-foot-phone { display: flex; align-items: center; gap: 10px; color: #111 !important; }
.zr-foot-phone .zr-ico { width: 34px; height: 34px; padding: 7px; border-radius: 50%; background: #E9E9E9; }
.zr-foot-phone span { display: grid; line-height: 1.5; }
.zr-foot-phone small { color: var(--zr-muted); }
.zr-foot-phone b { font-size: 1.15em; font-weight: 500; }
.zr-foot-store p { color: #666; }
.zr-foot-store p b { color: #111; }
.zr-socials { gap: 4px; }
.zr-socials a { width: 32px; height: 32px; border: 0; color: #111; }
.zr-socials a:hover { background: #111; color: #fff; }
.zr-foot-bottom { display: grid; justify-items: center; gap: 10px; padding-block: 18px 24px; border-top: 1px solid var(--zr-line); color: var(--zr-muted); text-align: center; }
.zr-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.zr-trust img { height: 44px; width: auto; }
.zr-phonebar { display: none; }
.zr-ftog, .zr-ftog-btn { display: none; }

/* Tablets */
@container (max-width: 1100px) {
  .zr-nav { gap: 16px; font-size: .82em; }
  .zr-head-contact a:last-child { display: none; }
  .zr-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .zr-slide-row { grid-auto-columns: calc((100% - 2 * 20px) / 3); }
  .zr-plp { grid-template-columns: minmax(0, 1fr) 230px; }
  .zr-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .zr-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .zr-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .zr-top-links { display: none; }
  .zr-top-in { justify-content: center; }
  .zr-menu { display: block; }
  .zr-nav, .zr-head-row2, .zr-head-search, .zr-icon-user, .zr-icon-search, .zr-icon-wish { display: none !important; }
  .zr-head-in, .zr-head-inner .zr-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 60px; gap: 10px; }
  .zr-logo { justify-self: center; }
  .zr-icons { justify-self: end; }
  .zr-head-home { border-bottom-color: var(--zr-line); }
  .zr-hero { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; aspect-ratio: auto; }
  .zr-pb.big { grid-column: 1 / -1; grid-row: auto; aspect-ratio: 1 / 1.05; }
  .zr-pb:not(.big) { aspect-ratio: 1 / 1.1; }
  .zr-pb-text { width: 80%; }
  .zr-craft { grid-template-columns: 1fr 1fr; }
  .zr-craft-2 { margin: 0; }
  .zr-craft-card { grid-column: 1 / -1; margin: -40px 8% 0; }
  .zr-since-in { grid-template-columns: 1fr; }
  .zr-plp { grid-template-columns: 1fr; }
  .zr-side { order: -1; display: none; grid-template-columns: 1fr 1fr; column-gap: 20px; margin-bottom: 10px; padding: 4px 16px 16px; border: 1px solid var(--zr-line); }
  .zr-ftog:checked + .zr-side { display: grid; }
  .zr-ftog-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #111; cursor: pointer; }
  .zr-ftog-btn .zr-ico { width: 16px; height: 16px; }
  .zr-plp-main { order: 1; }
  .zr-side .zr-side-box { padding-block: 10px; }
  .zr-side-box:not([open]) > div { display: none; }
  .zr-facets { display: contents; }
  .zr-facets-foot { grid-column: 1 / -1; }
  .zr-product { grid-template-columns: 1fr; }
  .zr-tab-desc { display: grid; grid-template-columns: 1fr; }
  .zr-blog, .zr-contact, .zr-cart { grid-template-columns: 1fr; }
  .zr-sum { position: static; }
  .zr-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .zr-story { grid-template-columns: 1fr; }
  .zr-mission { grid-template-columns: 1fr; }
  .zr-brands .zr-wrap { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-block: 20px; }
  .zr-insta-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  /* Phones: the bar of shortcuts at the bottom */
  .zr-phonebar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--zr-line); background: var(--color-bg); }
  .zr-phonebar a { position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0 6px; font-size: .7em; }
  .zr-phonebar a[aria-current] { color: var(--zr-acc); }
  .zr-phonebar .zr-ico { width: 20px; height: 20px; }
  .zr-phonebar i { position: absolute; top: 3px; left: calc(50% + 6px); min-width: 15px; height: 15px; border-radius: 99px; background: #111; color: #fff; font-size: 9px; font-style: normal; line-height: 15px; text-align: center; }
}
@container (max-width: 600px) {
  .zr { font-size: 13.5px; }
  .zr-rate small { display: none; }
  .zr-hero { gap: 10px; }
  .zr-pb-text { padding: 14px; width: 92%; }
  .zr-pb-text h2 { font-size: 1.15em; }
  .zr-pb-text p { display: none; }
  .zr-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .zr-slide-row { grid-auto-columns: calc((100% - 12px) / 2); gap: 12px; }
  .zr-cols-2, .zr-cols-3, .zr-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  .zr-row { grid-template-columns: 110px minmax(0, 1fr); gap: 14px; }
  .zr-card-acts { opacity: 1; transform: none; }
  .zr-round { width: 30px; height: 30px; }
  .zr-plp-bar { flex-wrap: wrap; gap: 8px; }
  .zr-plp-bar > small { flex-basis: 100%; order: 3; }
  .zr-hero { grid-template-columns: 1fr; }
  .zr-pb.big, .zr-pb:not(.big) { aspect-ratio: 1 / .9; }
  .zr-views { margin-inline-start: auto; }
  .zr-side { grid-template-columns: 1fr; }
  .zr-edits { grid-template-columns: 1fr; width: min(380px, 100%); margin-inline: auto; }
  .zr-craft-card { margin-inline: 4%; }
  .zr-gallery { grid-template-columns: 1fr; }
  .zr-thumbs { order: 2; grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .zr-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .zr-buy-row .zr-btn { padding-inline: 12px; }
  .zr-posts, .zr-related > div { grid-template-columns: 1fr; }
  .zr-q-item { grid-template-columns: 1fr; }
  .zr-q-pic { width: 160px; order: -1; }
  .zr-line { grid-template-columns: 72px minmax(0, 1fr) auto; gap: 10px; }
  .zr-line .zr-stepper { grid-column: 2; justify-self: start; }
  .zr-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; }
  .zr-checkout { grid-template-columns: 1fr; }
  .zr-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px; }
  .zr-news-form { flex-direction: column; }
  .zr-news-form button { min-height: 42px; }
  .zr-map { aspect-ratio: 1.3; }
  .zr-trail-row { padding-block: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .zr-main > *, .zr-card, .zr-drawer { animation: none !important; }
}
`;
