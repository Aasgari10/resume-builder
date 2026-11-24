/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Arka": an architecture and interior design studio:
// white and quiet, thin type, big photos. The home opens on a slideshow of projects picked by their
// year at the side, then a short text with two photos, the services band (hovering a column fades
// in its photo), news and the contact strip; the footer is light grey in five columns. Projects are
// the products (kind = category, facts = specs, steps = paragraphs of the text); clients sign in,
// book a consultation by day and hour, and track it. Hovers are slow and soft. Works without scripts.

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

export const ARKA_BLOCKS = [
  { key: "intro", label: "معرفی و دو عکس" },
  { key: "services", label: "نوار خدمات (چهار ستون)" },
  { key: "blog", label: "اخبار و ایده‌ها" },
  { key: "contact", label: "نوار تماس" },
] as const;

/** Pages the owner can switch off; their menu items go with them. */
export const ARKA_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/services", label: "صفحه‌ی خدمات" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

/** Goods of the shop: every product but the services and the plans. */
const visible = (shop: Shop | undefined) => {
  const not = new Set([shop?.showcaseCategoryId, shop?.plansCategoryId].filter(Boolean));
  return (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim() && !(p.categoryId && not.has(p.categoryId)));
};
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

/** Every page of the site: one per project and post, the consultation and the client pages. */
export function arkaPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const own = ARKA_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p));
  const posts = pageOn(data, "/blog") ? livePosts(shop).map((p) => `/blog/${p.id}`) : [];
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", ...own, "/projects", ...projectsOf(shop).map((p) => `/project/${p.id}`), "/contact", "/consult", ...posts, "/account", "/track", ...info];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function ArkaShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = arkaPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "projects") body = <ProjectsPage {...view} />;
  else if (kind === "project") body = <ProjectPage {...view} id={id!} />;
  else if (kind === "services") body = <ServicesPage {...view} />;
  else if (kind === "consult") body = <Consult {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "about") body = <About {...view} />;
  else if (kind === "blog") body = id ? <Post {...view} id={id} /> : <Blog {...view} />;
  else if (kind === "track") body = <Track {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else
    body = (
      <>
        <PageTop view={view} title="اطلاعات" />
        <div className="ak-wrap ak-sec">
          <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
        </div>
      </>
    );
  return (
    <WebPage ctx={ctx} className={`ak${page === "/" ? " ak-home" : ""}`} css={partsCss + shopkitCss + bookingCss + css}>
      <Header {...view} />
      <main className="ak-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      {!view.visitor.customer && <LoginPopup view={view} />}
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
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  paw: "M12 13c-3 0-6 3.5-6 6 0 1.5 1.5 2 3 1.5 1-.3 2-.8 3-.8s2 .5 3 .8c1.5.5 3 0 3-1.5 0-2.5-3-6-6-6z M5 8.5a2 2.5 0 1 0 0 .1 M9.5 5a2 2.5 0 1 0 0 .1 M14.5 5a2 2.5 0 1 0 0 .1 M19 8.5a2 2.5 0 1 0 0 .1",
  thumb: "M7 11v9H4v-9z M7 11l4-7c1.5 0 2.5 1 2.2 2.5L12.5 10H19c1.2 0 2 1 1.8 2.2l-1.3 6.3c-.2 1-1 1.5-2 1.5H7",
};
const PERK_ICONS = ["truck", "shield", "card", "undo", "gem", "gift"];

function Svg({ name, className = "ak-ico" }: { name: string; className?: string }) {
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
    <form method="post" action={view.link("/_cart")} className="ak-act">
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
    <span className="ak-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function Badge({ p }: { p: Product }) {
  const soldOut = p.stock === 0;
  if (soldOut) return <span className="ak-badge out">ناموجود</span>;
  return (
    <span className="ak-badges">
      {onSale(p) && <span className="ak-badge off">{fa(percentOff(p))}٪ تخفیف</span>}
      {p.badge && <span className="ak-badge hot">{p.badge}</span>}
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
    <article className={`ak-card${row ? " ak-row" : ""}`} style={{ "--i": i } as CSSProperties} data-product={p.id}>
      <div className="ak-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="ak-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
            {hover && <img src={hover} alt="" loading="lazy" className="ak-img-2" />}
          </span>
        </PageLink>
        <Badge p={p} />
        <div className="ak-card-acts">
          <Act view={view} op="wish" id={p.id} className={`ak-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          <PageLink to={productPath(p)} link={view.link} className="ak-round" label="دیدن محصول">
            <Svg name="eye" />
          </PageLink>
          {!soldOut && !hasChoices(p) && (
            <Act view={view} op="add" id={p.id} className="ak-round" label="افزودن به سبد خرید">
              <Svg name="bag" />
            </Act>
          )}
        </div>
      </div>
      <div className="ak-card-text">
        {cat && <small className="ak-card-cat">{cat}</small>}
        <PageLink to={productPath(p)} link={view.link} className="ak-card-name">
          <span>{p.name}</span>
        </PageLink>
                <Price view={view} p={p} />
        {row && (
          <>
            {p.description && <p className="ak-card-desc">{p.description.slice(0, 160)}</p>}
            {!soldOut &&
              (hasChoices(p) ? (
                <PageLink to={productPath(p)} link={view.link} className="ak-btn small ghost">
                  انتخاب گزینه‌ها
                </PageLink>
              ) : (
                <Act view={view} op="add" id={p.id} className="ak-btn small ghost" label="افزودن به سبد خرید">
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
    <span className={`ak-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** A centred heading with an optional line of text under it. */
function Head({ view, title, titlePath, text, textPath, fallback }: { view: View; title?: string; titlePath?: string; text?: string; textPath?: string; fallback?: string }) {
  // A heading without a path is fixed text (nothing to edit on the page).
  const edit = titlePath ? ed(titlePath, "text", "تیتر") : undefined;
  return (
    <div className="ak-head-c">
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
    <div className="ak-wrap ak-empty">
      <p className="ak-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="ak-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Studio data: projects, services, team ───────────── */

const allLive = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const specOf = (p: Product, label: string) => p.specs?.find((s) => s.label.trim() === label)?.value;
/** The projects: every visible product (a studio sells nothing; a product is a project). */
const projectsOf = (shop: Shop | undefined) => allLive(shop);
const teamOf = (data: ResumeData) => (data.site?.gallery ?? []).filter((g) => g.title.trim());
const cats = (shop: Shop) => (shop.categories ?? []).filter((c) => projectsOf(shop).some((p) => p.categoryId === c.id));
const yearOf = (p: Product) => specOf(p, "سال") ?? "";
/** A project's text: the first paragraph, then its steps (each paragraph: a title line and its text). */
function stepsOf(p: Product) {
  const parts = (p.description ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const [intro = "", ...rest] = parts;
  return { intro, steps: rest.map((x) => ({ title: x.split("\n")[0]!, text: x.split("\n").slice(1).join("\n") })) };
}
/** Pages whose top is a big photo (the header lies over it, in white). */
const onPhoto = (page: string) => page === "/" || page === "/about" || page === "/services" || page.startsWith("/project/") || /^\/blog\/./.test(page);

/* ───────────── Frame: header, contact strip, footer ───────────── */

type MenuItem = { to: string; label: string; sub?: { to: string; label: string }[] };
function menu(view: View): MenuItem[] {
  const data = view.ctx.data;
  const shop = view.shop;
  return [
    { to: "/", label: "خانه" },
    { to: "/projects", label: "پروژه‌ها", sub: cats(shop).length > 1 ? cats(shop).map((c) => ({ to: `/projects?cat=${c.id}`, label: c.name })) : undefined },
    ...(pageOn(data, "/services") ? [{ to: "/services", label: "خدمات" }] : []),
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    ...(pageOn(data, "/blog") && livePosts(shop).length > 0 ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
}

const isHere = (view: View, m: MenuItem) => {
  const p = view.page;
  if (m.to === "/") return p === "/";
  if (m.to === "/projects") return p === "/projects" || p.startsWith("/project/");
  return p === m.to || p.startsWith(`${m.to}/`);
};

function Logo({ view, className = "ak-logo" }: { view: View; className?: string }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className={className}>
      {logo ? <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} /> : <b {...ed("basics.fullName", "text", "نام")}>{b.fullName}</b>}
    </PageLink>
  );
}

function Nav({ view, className }: { view: View; className: string }) {
  return (
    <nav className={className}>
      {menu(view).map((m) => (
        <span key={m.label} className={`ak-nav-item${m.sub ? " has-sub" : ""}`}>
          <PageLink to={m.to} link={view.link} current={isHere(view, m)}>
            {m.label}
            {m.sub && <Svg name="down" className="ak-ico ak-caret" />}
          </PageLink>
          {m.sub && (
            <span className="ak-sub">
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

/** Client sign in and the consultation button: on phones too. */
function Actions({ view }: { view: View }) {
  const { link, visitor } = view;
  return (
    <div className="ak-actions">
      {visitor.customer ? (
        <PageLink to="/account" link={link} className="ak-client">
          <Svg name="user" />
          <span>{visitor.customer.name.split(" ")[0]}</span>
        </PageLink>
      ) : (
        <label htmlFor="ak-login" className="ak-client">
          <Svg name="lock" />
          <span>ورود مشتری</span>
        </label>
      )}
      <PageLink to="/consult" link={link} className="ak-btn ak-consult">
        رزرو مشاوره
      </PageLink>
    </div>
  );
}

/** The phone menu: logo and a round close, items that fold open, sign in, consultation, contact. */
function Drawer({ view }: { view: View }) {
  const { link, ctx } = view;
  const b = ctx.data.basics;
  return (
    <details className="ak-menu">
      <summary className="ak-burger" aria-label="منو">
        <Svg name="menu" className="ak-ico" />
      </summary>
      <div className="ak-drawer">
        <div className="ak-drawer-head">
          <Logo view={view} />
          <span className="ak-x" aria-hidden="true">
            <Svg name="close" />
          </span>
        </div>
        <nav className="ak-drawer-nav">
          {menu(view).map((m) =>
            m.sub ? (
              <details key={m.label} className="ak-fold" open={isHere(view, m)}>
                <summary>
                  {m.label}
                  <Svg name="down" className="ak-ico ak-caret" />
                </summary>
                <div>
                  <PageLink to={m.to} link={link}>
                    همه‌ی {m.label}
                  </PageLink>
                  {m.sub.map((x) => (
                    <PageLink key={x.to} to={x.to} link={link}>
                      {x.label}
                    </PageLink>
                  ))}
                </div>
              </details>
            ) : (
              <PageLink key={m.label} to={m.to} link={link} current={isHere(view, m)} className="ak-fold-link">
                {m.label}
              </PageLink>
            ),
          )}
        </nav>
        <PageLink to="/consult" link={link} className="ak-btn wide">
          رزرو جلسه‌ی مشاوره
        </PageLink>
        <PageLink to="/account" link={link} className="ak-btn wide ghost">
          {view.visitor.customer ? "حساب من" : "ورود مشتری / ثبت‌نام"}
        </PageLink>
        <div className="ak-drawer-info">
          {b.phone && (
            <a href={telHref(b.phone)} dir="ltr">
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr">
              {b.email}
            </a>
          )}
        </div>
        <Socials ctx={ctx} editing={false} className="ak-socials" />
      </div>
    </details>
  );
}

function Header(view: View) {
  return (
    <header className={`ak-head${onPhoto(view.page) ? " on-photo" : ""}`}>
      <div className="ak-head-row">
        <Logo view={view} />
        <Nav view={view} className="ak-nav" />
        <Actions view={view} />
        <Drawer view={view} />
      </div>
    </header>
  );
}

/** "Feel free to contact us": address, phone and email in three columns with line icons. */
function ContactStrip({ view }: { view: View }) {
  const { ctx, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  return (
    <section className="ak-wrap ak-sec ak-strip">
      <Kicker text="تماس" />
      <h2 className="ak-h2">با ما در تماس باشید</h2>
      <div className="ak-strip-cols">
        <div>
          <Svg name="pin" className="ak-ico ak-big-ico" />
          <Opt value={site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p {...ed("site.address", "text", "نشانی")}>{site?.address || b.location}</p>
          </Opt>
        </div>
        <div>
          <Svg name="phone" className="ak-ico ak-big-ico" />
          {b.phone && (
            <a href={telHref(b.phone)} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
        </div>
        <div>
          <Svg name="mail" className="ak-ico ak-big-ico" />
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
        </div>
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
    <footer className="ak-foot">
      <div className="ak-wrap ak-foot-cols">
        <div className="ak-foot-links">
          {menu(view)
            .filter((m) => m.to !== "/")
            .map((m) => (
              <PageLink key={m.to} to={m.to} link={link}>
                {m.label}
              </PageLink>
            ))}
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </div>
        <div>
          <h3>نشانی دفتر</h3>
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
        </div>
        <div>
          <h3>ساعت کاری</h3>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعت کاری (هر خط یک روز)")}>
            <div className="ak-hours" {...ed("site.contactNote", "multiline", "ساعت کاری (هر خط یک روز)")}>
              {(site?.contactNote ?? "").split("\n").map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </Opt>
        </div>
        <div>
          <h3>شبکه‌های اجتماعی</h3>
          <Socials ctx={ctx} editing={editing} className="ak-socials ak-foot-socials" />
        </div>
        <div>
          <h3>فلسفه‌ی ما</h3>
          <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "جمله‌ی کوتاه")}>
            <p className="ak-quote" {...ed("basics.summary", "multiline", "جمله‌ی کوتاه")}>
              «{b.summary}»
            </p>
          </Opt>
        </div>
      </div>
      <div className="ak-wrap ak-foot-bottom">
        <small>© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
        <a href="#" className="ak-top" aria-label="بالای صفحه">
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
      <input type="checkbox" id="ak-login" className="ak-pop-in" aria-hidden="true" tabIndex={-1} />
      <div className="ak-pop" role="dialog" aria-label="ورود یا ثبت‌نام">
        <label htmlFor="ak-login" className="ak-pop-shade" aria-label="بستن" />
        <div className="ak-pop-box">
          <label htmlFor="ak-login" className="ak-pop-x" aria-label="بستن">
            <Svg name="close" />
          </label>
          <input type="radio" name="ak-lt" id="ak-lt-1" className="ak-lt" defaultChecked />
          <input type="radio" name="ak-lt" id="ak-lt-2" className="ak-lt" />
          <div className="ak-lt-tabs">
            <label htmlFor="ak-lt-1">ورود</label>
            <label htmlFor="ak-lt-2">ثبت‌نام</label>
          </div>
          <form method="post" action={link("/_account")} className="ak-pop-form">
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
            <button type="submit" className="ak-btn wide">
              ورود
            </button>
            <small>
              رمز را فراموش کرده‌اید؟{" "}
              <PageLink to="/contact" link={link}>
                با ما تماس بگیرید
              </PageLink>
            </small>
          </form>
          <form method="post" action={link("/_account")} className="ak-pop-form">
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
            <button type="submit" className="ak-btn wide">
              ساخت حساب
            </button>
          </form>
        </div>
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
    <span className="ak-clock">
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

function SideBox({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="ak-side-box" open={open}>
      <summary>
        {title}
        <Svg name="up" className="ak-ico ak-caret" />
      </summary>
      <div>{children}</div>
    </details>
  );
}

/** "Sort: newest ▾": a short list; each choice is a tiny form, so no script is needed. */
function SortMenu({ view, here }: { view: View; here: string }) {
  const q = view.visitor.query;
  const now = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  return (
    <details className="ak-sort">
      <summary>
        مرتب‌سازی: <b>{now[1]}</b>
        <Svg name="down" className="ak-ico ak-caret" />
      </summary>
      <div className="ak-sort-list">
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
      <PriceFilterBox link={view.link} here={here} query={view.visitor.query} prices={prices} buttonClass="ak-btn tiny" />
    </SideBox>
  );
}

/* ───────────── Product ───────────── */

/** "Arrives between ۲۸ آبان and ۲ آذر": three to seven days from today, in the Persian calendar. */
function deliveryWindow() {
  const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
  return `از فردا، ${faDate(day(1), { weekday: "long", day: "numeric", month: "long" })}`;
}

/** Share links (Telegram and WhatsApp), with the page address the site is published at. */
function ShareRow({ view, p }: { view: View; p: Product }) {
  const own = view.ctx.data.basics.links;
  const has = (t: string) => own.some((l) => l.type === t);
  if (!has("telegram") && !has("whatsapp")) return null;
  return (
    <p className="ak-meta ak-share">
      اشتراک‌گذاری:
      <a href={`https://t.me/share/url?url=&text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
        <Icon name="telegram" className="ak-ico" />
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
        <Icon name="whatsapp" className="ak-ico" />
      </a>
    </p>
  );
}

/* ───────────── About, blog, contact ───────────── */

/* ───────────── Cart, wishlist, search, checkout ───────────── */

function Account(view: View) {
  return (
    <>
      <Trail view={view} items={[{ label: view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام" }]} />
      <section className="ak-wrap ak-sec ak-sec-tight">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
      </section>
    </>
  );
}

/* ───────────── Delivery days, custom cakes, gallery, tracking ───────────── */

/* ───────────── Pieces ───────────── */

/** The small grey word over a heading ("درباره‌ی ما"). */
const Kicker = ({ text }: { text: string }) => <small className="ak-kicker">{text}</small>;

/** A photo that grows a little, slowly, on hover. */
function Photo({ src, path, label, className = "" }: { src?: string; path?: string; label?: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`ak-photo ${className}`} {...(path ? ed(path, "image", label ?? "عکس") : {})}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

/** The home slides: a project each (radio buttons, no script), its year in the list at the side. */
function Slides({ view }: { view: View }) {
  const { shop, link } = view;
  const list = (projectsOf(shop).filter((p) => p.featured).length ? projectsOf(shop).filter((p) => p.featured) : projectsOf(shop)).slice(0, 7);
  if (!list.length) return null;
  return (
    <section className="ak-slides">
      {list.map((p, k) => (
        <input key={p.id} type="radio" name="ak-slide" id={`ak-s${k}`} className={`ak-slide-in s${k}`} defaultChecked={k === 0} />
      ))}
      {list.map((p, k) => (
        <article key={p.id} className={`ak-slide s${k}`}>
          {pic(p) && <img src={pic(p)} alt="" className="ak-slide-pic" />}
          <div className="ak-slide-text">
            {cats(shop).find((c) => c.id === p.categoryId) && <small>{cats(shop).find((c) => c.id === p.categoryId)!.name}</small>}
            <h2>{p.name}</h2>
            <p>{stepsOf(p).intro.slice(0, 150)}</p>
            <PageLink to={`/project/${p.id}`} link={link} className="ak-line-link light">
              دیدن پروژه
            </PageLink>
          </div>
        </article>
      ))}
      <nav className="ak-years" aria-label="پروژه‌ها">
        {list.map((p, k) => (
          <label key={p.id} htmlFor={`ak-s${k}`} className={`s${k}`}>
            {yearOf(p) || fa(k + 1)}
          </label>
        ))}
      </nav>
      <a href="#ak-intro" className="ak-down" aria-label="پایین">
        <Svg name="down" />
      </a>
    </section>
  );
}

/** "Good design is obvious": two lines, a short rule, the text and two photos at different heights. */
function Intro({ view }: { view: View }) {
  const { ctx, editing, link } = view;
  const site = ctx.data.site;
  return (
    <section className="ak-wrap ak-sec ak-intro" id="ak-intro">
      <div className="ak-intro-text">
        <h2 className="ak-h2 ak-ruled" {...ed("site.aboutTitle", "multiline", "تیتر")}>
          {site?.aboutTitle}
        </h2>
        <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن")}>
          <div className="ak-text" {...ed("site.aboutText", "multiline", "متن")}>
            <Para text={site?.aboutText} />
          </div>
        </Opt>
        <PageLink to="/about" link={link} className="ak-line-link">
          بیشتر بخوانید
        </PageLink>
      </div>
      <Photo src={site?.aboutImage} path="site.aboutImage" className="ak-intro-a" />
      <Photo src={site?.heroImage} path="site.heroImage" className="ak-intro-b" />
    </section>
  );
}

/**
 * The services band: four columns over one photo. Hovering a column fades in that service's photo
 * (slowly) and lifts its text and button; on phones each service is its own row with its photo.
 */
function Panorama({ view }: { view: View }) {
  const { shop, link, editing } = view;
  const list = (shop.banners ?? []).filter((b) => !b.hidden).slice(0, 4);
  if (!list.length && !editing) return null;
  return (
    <section className="ak-pano" style={{ "--n": Math.max(1, list.length) } as CSSProperties}>
      {list.map((b, k) => {
        const at = item("site.shop.banners", b.id);
        const url = safeUrl(b.link);
        return (
          <div key={b.id} className={`ak-pano-col${k === 0 ? " first" : ""}`}>
            {safeUrl(b.image) && <img src={safeUrl(b.image)} alt="" loading="lazy" className="ak-pano-pic" {...ed(`${at}.image`, "image", "عکس")} />}
            <div className="ak-pano-text">
              <h3 {...ed(`${at}.title`, "text", "عنوان")}>{b.title}</h3>
              <div className="ak-pano-more">
                <div>
                  {b.text && <p {...ed(`${at}.text`, "text", "متن")}>{b.text}</p>}
                  {url ? (
                    <a href={url} {...outside(url)} className="ak-btn ghost light small">
                      بیشتر بدانید
                    </a>
                  ) : (
                    <PageLink to="/services" link={link} className="ak-btn ghost light small">
                      بیشتر بدانید
                    </PageLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {editing && list.length < 4 && (
        <span className="ak-add" {...ed("site.shop.banners", "newimage", "افزودن خدمت")}>
          + خدمت
        </span>
      )}
    </section>
  );
}

/** Post cards: the photo grows slowly on hover. */
function PostCards({ view, list, className = "ak-posts" }: { view: View; list: NonNullable<Shop["posts"]>; className?: string }) {
  return (
    <div className={className}>
      {list.map((p) => (
        <article key={p.id} className="ak-post">
          <PageLink to={`/blog/${p.id}`} link={view.link} className="ak-photo ak-post-pic">
            {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
          </PageLink>
          <h3>
            <PageLink to={`/blog/${p.id}`} link={view.link}>
              {p.title}
            </PageLink>
          </h3>
          {p.date && <small>{faDate(p.date)}</small>}
        </article>
      ))}
    </div>
  );
}

function Home(view: View) {
  const { shop, ctx } = view;
  const on = (k: string) => blockOn(ctx.data, k);
  const posts = pageOn(ctx.data, "/blog") ? livePosts(shop).slice(0, 3) : [];
  return (
    <>
      <Slides view={view} />
      {on("intro") && <Intro view={view} />}
      {on("services") && <Panorama view={view} />}
      {on("blog") && posts.length > 0 && (
        <section className="ak-wrap ak-sec">
          <Kicker text="بلاگ" />
          <h2 className="ak-h2">اخبار و ایده‌ها</h2>
          <PostCards view={view} list={posts} />
        </section>
      )}
      {on("contact") && <ContactStrip view={view} />}
    </>
  );
}

/* ───────────── Inner pages ───────────── */

/** A page that opens on a big photo with its title over it. */
function PageHero({ img, path, title, titlePath, text, textPath, view }: { img?: string; path: string; title?: string; titlePath?: string; text?: string; textPath?: string; view: View }) {
  return (
    <section className="ak-hero">
      <span className="ak-hero-pic" {...ed(path, "image", "عکس بالای صفحه")}>
        {safeUrl(img) && <img src={safeUrl(img)} alt="" />}
      </span>
      <div className="ak-wrap ak-hero-in">
        <h1 {...(titlePath ? ed(titlePath, "text", "تیتر") : {})}>{title}</h1>
        {textPath && (
          <Opt value={text} editing={view.editing} edit={ed(textPath, "text", "متن")}>
            <p {...ed(textPath, "text", "متن")}>{text}</p>
          </Opt>
        )}
      </div>
    </section>
  );
}

/** A plain page top (pages without a big photo). */
function PageTop({ view, title, items }: { view: View; title: string; items?: { label: string; to?: string }[] }) {
  return (
    <section className="ak-wrap ak-pagetop">
      <nav className="ak-trail" aria-label="مسیر صفحه">
        <PageLink to="/" link={view.link}>
          خانه
        </PageLink>
        {(items ?? [{ label: title }]).map((t, k) => (
          <span key={k}>
            <span aria-hidden="true">/</span>
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
      <h1 className="ak-h1">{title}</h1>
    </section>
  );
}

function Trail({ view, items, children }: { view: View; items: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <>
      <PageTop view={view} title={items[items.length - 1]?.label ?? ""} items={items} />
      {children && <div className="ak-wrap ak-trail-row">{children}</div>}
    </>
  );
}

function Banner({ view, title, items }: { view: View; title: string; items: { label: string; to?: string }[] }) {
  return <PageTop view={view} title={title} items={items} />;
}

/** A section with a small word, a heading at one side and the text at the other. */
function Split({ view, kicker, title, titlePath, text, textPath }: { view: View; kicker: string; title?: string; titlePath: string; text?: string; textPath: string }) {
  return (
    <section className="ak-wrap ak-sec ak-split">
      <div>
        <Kicker text={kicker} />
        <h2 className="ak-h2" {...ed(titlePath, "text", "تیتر")}>
          {title}
        </h2>
      </div>
      <Opt value={text} editing={view.editing} edit={ed(textPath, "multiline", "متن")}>
        <div className="ak-text" {...ed(textPath, "multiline", "متن")}>
          <Para text={text} />
        </div>
      </Opt>
    </section>
  );
}

/** Awards and milestones: a line of years; picking one shows it (radio buttons). */
function Timeline({ view }: { view: View }) {
  const list = (view.shop.stats ?? []).filter((s) => s.value.trim() && s.label.trim());
  if (!list.length) return null;
  return (
    <section className="ak-wrap ak-sec ak-time">
      <Kicker text="افتخارات" />
      <h2 className="ak-h2">
        {list[list.length - 1]!.value} تا امروز
      </h2>
      <div className="ak-time-box">
        {list.map((s, k) => (
          <input key={s.id} type="radio" name="ak-year" id={`ak-y${k}`} className={`ak-year-in y${k}`} defaultChecked={k === list.length - 1} />
        ))}
        <div className="ak-time-line">
          {list.map((s, k) => (
            <label key={s.id} htmlFor={`ak-y${k}`} className={`y${k}`}>
              <i />
              {s.value}
            </label>
          ))}
        </div>
        {list.map((s, k) => {
          const at = item("site.shop.stats", s.id);
          return (
            <div key={s.id} className={`ak-time-item y${k}`}>
              <h3 {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</h3>
              {s.text && <p {...ed(`${at}.text`, "text", "متن")}>{s.text}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Team({ view }: { view: View }) {
  const list = teamOf(view.ctx.data);
  if (!list.length && !view.editing) return null;
  return (
    <section className="ak-wrap ak-sec">
      <Kicker text="تیم" />
      <h2 className="ak-h2">معماران و طراحان ما</h2>
      <div className="ak-team">
        {list.map((g) => {
          const at = item("site.gallery", g.id);
          return (
            <figure key={g.id} className="ak-member">
              <span className="ak-photo">
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
          <span className="ak-add" {...ed("site.gallery", "newimage", "افزودن عضو تیم")}>
            + عضو تیم
          </span>
        )}
      </div>
    </section>
  );
}

function About(view: View) {
  const { shop } = view;
  return (
    <>
      <PageHero view={view} img={shop.lookImage} path="site.shop.lookImage" title={shop.lookTitle} titlePath="site.shop.lookTitle" />
      <Split view={view} kicker="درباره‌ی ما" title={shop.promoTitle} titlePath="site.shop.promoTitle" text={shop.promoText} textPath="site.shop.promoText" />
      <figure className="ak-wrap ak-wide">
        <Photo src={shop.newImage} path="site.shop.newImage" />
        <Opt value={shop.newTitle} editing={view.editing} edit={ed("site.shop.newTitle", "text", "زیرنویس عکس")}>
          <figcaption {...ed("site.shop.newTitle", "text", "زیرنویس عکس")}>{shop.newTitle}</figcaption>
        </Opt>
      </figure>
      <Split view={view} kicker="رویکرد ما" title={shop.showcaseTitle} titlePath="site.shop.showcaseTitle" text={shop.showcaseText} textPath="site.shop.showcaseText" />
      <div className="ak-wrap ak-pair">
        <Photo src={shop.discoverImage} path="site.shop.discoverImage" />
        <Photo src={shop.trendImage} path="site.shop.trendImage" />
      </div>
      <Split view={view} kicker="فلسفه‌ی ما" title={shop.bestTitle} titlePath="site.shop.bestTitle" text={shop.bestText} textPath="site.shop.bestText" />
      <Team view={view} />
      <Timeline view={view} />
    </>
  );
}

/** How we work: numbered steps with a line after each number. */
function Steps({ view }: { view: View }) {
  const list = (view.shop.perks ?? []).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="ak-wrap ak-sec">
      <Kicker text="روند کار" />
      <h2 className="ak-h2">از ایده تا اجرا</h2>
      <ol className="ak-steps">
        {list.map((x, k) => {
          const at = item("site.shop.perks", x.id);
          return (
            <li key={x.id}>
              <b className="ak-num">{fa(k + 1).padStart(2, "۰")}</b>
              <h3 {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</h3>
              {x.text && <p {...ed(`${at}.text`, "text", "متن")}>{x.text}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ServicesPage(view: View) {
  const { shop } = view;
  return (
    <>
      <PageHero view={view} img={shop.heroImage} path="site.shop.heroImage" title={shop.heroTitle} titlePath="site.shop.heroTitle" text={shop.heroText} textPath="site.shop.heroText" />
      <Split view={view} kicker="خدمات ما" title={shop.discountTitle} titlePath="site.shop.discountTitle" text={shop.newsletterText} textPath="site.shop.newsletterText" />
      <Panorama view={view} />
      <Steps view={view} />
      <ContactStrip view={view} />
    </>
  );
}

/** Our projects: a short text with a photo beside it, the kinds as links, then two staggered columns. */
function ProjectsPage(view: View) {
  const { shop, link, visitor, editing } = view;
  const q = visitor.query;
  const kinds = cats(shop);
  const list = projectsOf(shop).filter((p) => !q.cat || p.categoryId === q.cat);
  return (
    <>
      <section className="ak-wrap ak-projects-top">
        <div>
          <Kicker text="پروژه‌ها" />
          <h1 className="ak-h2" {...ed("site.shop.discoverTitle", "text", "تیتر")}>
            {shop.discoverTitle}
          </h1>
          <Opt value={shop.newText} editing={editing} edit={ed("site.shop.newText", "multiline", "متن")}>
            <div className="ak-text" {...ed("site.shop.newText", "multiline", "متن")}>
              <Para text={shop.newText} />
            </div>
          </Opt>
        </div>
        <Photo src={shop.discoverImage} path="site.shop.discoverImage" className="ak-projects-pic" />
      </section>
      {kinds.length > 1 && (
        <nav className="ak-wrap ak-kinds" aria-label="نوع پروژه">
          <PageLink to="/projects" link={link} current={!q.cat}>
            همه
          </PageLink>
          {kinds.map((c) => (
            <PageLink key={c.id} to={`/projects?cat=${c.id}`} link={link} current={q.cat === c.id}>
              {c.name}
            </PageLink>
          ))}
        </nav>
      )}
      <section className="ak-wrap ak-sec ak-grid2">
        {list.map((p) => (
          <PageLink key={p.id} to={`/project/${p.id}`} link={link} className="ak-card">
            <span className="ak-photo">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
            <span className="ak-card-cap">
              <b>{p.name}</b>
              <small>{[cats(shop).find((c) => c.id === p.categoryId)?.name, yearOf(p)].filter(Boolean).join(" · ")}</small>
            </span>
          </PageLink>
        ))}
        {!list.length && <p className="ak-notice">پروژه‌ای در این دسته نیست.</p>}
      </section>
    </>
  );
}

/** A project: the photo with a box of facts, the story, then its steps beside the other photos. */
function ProjectPage(view: View & { id: string }) {
  const { shop, link } = view;
  const all = projectsOf(shop);
  const p = all.find((x) => x.id === view.id);
  if (!p) return <Empty view={view} text="این پروژه پیدا نشد." />;
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const { intro, steps } = stepsOf(p);
  const facts = (p.specs ?? []).filter((s) => s.value.trim()).slice(0, 4);
  const k = all.indexOf(p);
  const next = all[(k + 1) % all.length];
  return (
    <>
      <section className="ak-hero ak-project-hero">
        <span className="ak-hero-pic">{imgs[0] && <img src={imgs[0]} alt={p.name} />}</span>
        <div className="ak-wrap ak-hero-in">
          <div className="ak-fact-box">
            <h1>{p.name}</h1>
            <p>{intro.slice(0, 180)}</p>
            <dl>
              {facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section className="ak-wrap ak-sec ak-story">
        <p className="ak-lead">{intro}</p>
      </section>
      <section className="ak-wrap ak-zig">
        {imgs.slice(1).map((u, i) => {
          const s = steps[i];
          return (
            <div key={u + i} className={`ak-zig-row${i % 2 ? " flip" : ""}`}>
              <ZoomOpen id={`${p.id}-${i}`} className="ak-photo ak-zig-pic">
                <img src={u} alt="" loading="lazy" />
              </ZoomOpen>
              {s ? (
                <div className="ak-zig-text">
                  <b className="ak-num">{fa(i + 1).padStart(2, "۰")}</b>
                  <h3>{s.title}</h3>
                  {s.text && <p>{s.text}</p>}
                </div>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </section>
      <section className="ak-wrap ak-sec ak-next">
        <PageLink to="/consult" link={link} className="ak-btn">
          رزرو جلسه‌ی مشاوره برای پروژه‌ی شما
        </PageLink>
        {next && next.id !== p.id && (
          <PageLink to={`/project/${next.id}`} link={link} className="ak-line-link">
            پروژه‌ی بعدی: {next.name}
          </PageLink>
        )}
      </section>
    </>
  );
}

/** The blog: posts in three columns of different heights, straight under the header. */
function Blog(view: View) {
  const posts = livePosts(view.shop);
  return (
    <section className="ak-wrap ak-sec ak-blog-page">
      <h1 className="sr-only">بلاگ</h1>
      {posts.length ? <PostCards view={view} list={posts} className="ak-masonry" /> : <p className="ak-notice">هنوز مطلبی نوشته نشده است.</p>}
    </section>
  );
}

function Post(view: View & { id: string }) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  const p = posts.find((x) => x.id === view.id);
  if (!p) return <Blog {...view} />;
  const at = item("site.shop.posts", p.id);
  const related = posts.filter((x) => x.id !== p.id).slice(0, 2);
  const tags = [...new Set(posts.map((x) => x.category).filter(Boolean))] as string[];
  return (
    <>
      <section className="ak-hero ak-post-hero">
        <span className="ak-hero-pic" {...ed(`${at}.image`, "image", "عکس")}>
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" />}
        </span>
        <div className="ak-wrap ak-hero-in">
          {p.category && <small>{p.category}</small>}
          <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
          {p.date && <small>{faDate(p.date)}</small>}
        </div>
      </section>
      <section className="ak-wrap ak-sec ak-article">
        <article>
          <div className="ak-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          {p.author && <p className="ak-sign">{p.author}</p>}
          {related.length > 0 && (
            <div className="ak-related">
              <h2 className="ak-h3">مطالب مرتبط</h2>
              <PostCards view={view} list={related} className="ak-posts two" />
            </div>
          )}
        </article>
        <aside className="ak-aside">
          <h3>تازه‌ترین مطالب</h3>
          {posts
            .filter((x) => x.id !== p.id)
            .slice(0, 4)
            .map((x) => (
              <PageLink key={x.id} to={`/blog/${x.id}`} link={link}>
                {x.title}
              </PageLink>
            ))}
          {tags.length > 0 && (
            <>
              <h3>برچسب‌ها</h3>
              <div className="ak-tags">
                {tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </>
          )}
        </aside>
      </section>
    </>
  );
}

function Contact(view: View) {
  const { ctx, shop, link, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const some = projectsOf(shop).slice(0, 2);
  return (
    <section className="ak-wrap ak-sec ak-contact">
      <aside>
        <Kicker text="پروژه‌ها" />
        <h2 className="ak-h3">نمونه‌ی کارهای ما</h2>
        {some.map((p) => (
          <PageLink key={p.id} to={`/project/${p.id}`} link={link} className="ak-mini">
            <span className="ak-photo">{pic(p) && <img src={pic(p)} alt="" loading="lazy" />}</span>
            <b>{p.name}</b>
          </PageLink>
        ))}
      </aside>
      <div>
        <h1 className="ak-h1" {...ed("site.contactTitle", "text", "تیتر")}>
          {site?.contactTitle || "تماس با ما"}
        </h1>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
          <p className="ak-muted" {...ed("site.contactText", "multiline", "متن")}>
            {site?.contactText}
          </p>
        </Opt>
        <div className="ak-contact-info">
          <p>{site?.address || b.location}</p>
          {b.phone && (
            <a href={telHref(b.phone)} dir="ltr">
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr">
              {b.email}
            </a>
          )}
        </div>
        <form method="post" action={link("/_form")} className="ak-form">
          <FormMeta kind="contact" back="/contact" />
          <label>
            نام شما *
            <input name="name" required maxLength={80} autoComplete="name" />
          </label>
          <label>
            ایمیل یا شماره‌ی تماس *
            <input name="phone" required maxLength={80} dir="ltr" />
          </label>
          <label>
            پیام شما *
            <textarea name="body" required rows={5} maxLength={2000} placeholder="نوع پروژه، متراژ، محل و زمان تقریبی" />
          </label>
          <button type="submit" className="ak-btn">
            ارسال
          </button>
        </form>
      </div>
    </section>
  );
}

const consultSchedule = (): Schedule => ({ ...defaultSchedule(), days: [6, 0, 1, 2, 3], start: "10:00", end: "18:00", slot: 60, capacity: 1, ahead: 21 });

/** A consultation: a day and an hour from the studio's free times, then the person and the project. */
function Consult(view: View) {
  const { shop, link, visitor } = view;
  const s = shop.schedule ?? consultSchedule();
  const q = visitor.query;
  return (
    <>
      <PageTop view={view} title="رزرو جلسه‌ی مشاوره" />
      <section className="ak-wrap ak-sec ak-consult-page">
        <p className="ak-muted">یک روز و ساعت را انتخاب کنید؛ جلسه حضوری در دفتر یا تلفنی است و برای هماهنگی با شما تماس می‌گیریم.</p>
        <BookingPicker link={link} path="/consult" schedule={s} taken={visitor.taken ?? {}} query={q} button="ثبت درخواست مشاوره">
          <label className="half">
            نام و نام خانوادگی *
            <input name="name" required autoComplete="name" maxLength={80} defaultValue={q.name ?? visitor.customer?.name} />
          </label>
          <label className="half">
            شماره‌ی موبایل *
            <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" maxLength={20} defaultValue={q.phone ?? visitor.customer?.phone} />
          </label>
          <label>
            درباره‌ی پروژه
            <textarea name="body" rows={3} maxLength={1000} placeholder="نوع کار (معماری، داخلی، بازسازی)، متراژ و محل" />
          </label>
        </BookingPicker>
        <p className="ak-mine">
          <PageLink to="/track" link={link}>
            پیگیری درخواست با کد
          </PageLink>
        </p>
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری درخواست" />
      <section className="ak-wrap ak-sec">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

export function arkaSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`ar-${n}`);
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const cats = [
    { id: "a1", name: "مسکونی" },
    { id: "a2", name: "تجاری و اداری" },
    { id: "a3", name: "طراحی داخلی" },
  ];
  const steps = "طراحی مفهومی\nایده‌ی اصلی از گفت‌وگو با کارفرما و شناخت زمین شکل گرفت: نور جنوب، دید به حیاط و حریم خصوصی.\n\nتوسعه‌ی طرح\nنقشه‌ها، سازه و تأسیسات هماهنگ شد و مصالح با نمونه‌ی واقعی در کارگاه انتخاب شدند.\n\nاجرا\nاجرا زیر نظر مستقیم دفتر انجام شد و پروژه در زمان پیش‌بینی‌شده تحویل شد.";
  const project = (id: string, name: string, cat: string, pics: string[], year: string, place: string, area: string, client: string, intro: string, featured = false): Product => ({
    id,
    name,
    categoryId: cat,
    price: 0,
    images: pics.map(img),
    featured,
    description: `${intro}\n\n${steps}`,
    specs: [
      { label: "کارفرما", value: client },
      { label: "محل", value: place },
      { label: "سال", value: year },
      { label: "متراژ", value: area },
    ],
  });
  const projects: Product[] = [
    project("r1", "خانه‌ی مینیمال باغ", "a1", ["tree", "living", "chair", "sofa"], "۱۴۰۳", "لواسان", "۴۲۰ متر", "خانواده‌ی رحیمی", "خانه‌ای یک‌طبقه دور یک درخت کهن؛ دیوارهای شیشه‌ای حیاط را به داخل خانه می‌آورند.", true),
    project("r2", "ساختمان اداری آجر", "a2", ["brick", "slats", "facade"], "۱۴۰۲", "تهران، ونک", "۳٬۲۰۰ متر", "شرکت سازه‌گستر", "نمای آجری با لوورهای چوبی که نور تند غرب را می‌گیرد و از داخل دید را باز می‌گذارد.", true),
    project("r3", "خانه‌ی بلوک سفید", "a1", ["night", "white", "angles", "town"], "۱۴۰۱", "کرج", "۳۱۰ متر", "آقای کریمی", "حجم‌های سفید ساده که در شب با نور گرم پنجره‌ها شکل دیگری پیدا می‌کنند.", true),
    project("r4", "ویلای بتن و چوب", "a1", ["concrete", "exterior", "black2"], "۱۴۰۰", "نوشهر", "۲۸۰ متر", "خانم صادقی", "بتن نمایان و چوب گرم؛ ویلایی که با شیب زمین پایین می‌رود و رو به جنگل باز می‌شود.", true),
    project("r5", "مجموعه‌ی مسکونی بلوک‌ها", "a1", ["blocks", "red", "black"], "۱۳۹۹", "تهران، سعادت‌آباد", "۵٬۶۰۰ متر", "تعاونی مسکن پارس", "واحدهای آپارتمانی با بالکن‌های بیرون‌زده که هر کدام حیاط کوچکی در ارتفاع دارند.", true),
    project("r6", "کتابخانه و لابی", "a3", ["shelves", "atrium", "table"], "۱۳۹۸", "اصفهان", "۹۰۰ متر", "مرکز فرهنگی آینده", "طراحی داخلی لابی و کتابخانه با قفسه‌های چوبی بلند و نور سقفی.", false),
    project("r7", "پلکان مارپیچ", "a3", ["stairs", "sofa"], "۱۳۹۷", "شیراز", "۶۰ متر", "هتل نارنجستان", "پلکان مارپیچ با نرده‌ی چوبی که مرکز توجه لابی هتل شده است.", false),
  ];
  const post = (t: string) =>
    `${t}\n\nخوب طراحی کردن یعنی خوب گوش دادن: به کارفرما، به زمین و به نوری که در طول روز روی آن می‌افتد.\n\nمصالح را از نزدیک ببینید و لمس کنید؛ عکس هیچ‌وقت جای نمونه‌ی واقعی را نمی‌گیرد.`;
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "آرکا",
      jobTitle: "دفتر معماری و طراحی داخلی",
      // A placeholder logo, for now (the designer's comes later).
      avatarUrl: sampleImage("ar-logo-temp", "png"),
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان ولیعصر، پلاک ۱۰۰",
      summary: "ساختمان خوب درباره‌ی رؤیاست، درباره‌ی خیال؛ اما باید ساخته شود.",
      links: [
        { id: "ak1", type: "instagram", url: "https://instagram.com/example" },
        { id: "ak2", type: "telegram", url: "https://t.me/example" },
        { id: "ak3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "ak4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "ak5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    site: {
      ...base.site,
      address: "تهران، خیابان ولیعصر، پلاک ۱۰۰، طبقه‌ی پنجم",
      contactNote: "شنبه تا چهارشنبه: ۹ تا ۱۸\nپنجشنبه: ۹ تا ۱۳\nجمعه: تعطیل",
      contactTitle: "تماس با ما",
      contactText: "برای مشاوره، برآورد هزینه یا همکاری پیام بگذارید؛ در کمتر از یک روز کاری پاسخ می‌دهیم.",
      aboutTitle: "طراحی خوب پیداست.\nطراحی عالی دیده نمی‌شود.",
      aboutText: "در آرکا هر پروژه از یک گفت‌وگو شروع می‌شود. خانه، دفتر یا فضای تجاری شما باید پیش از هر چیز به زندگی روزمره‌تان پاسخ بدهد؛ زیبایی از دل همین پاسخ بیرون می‌آید.",
      aboutImage: img("brick"),
      heroImage: img("town"),
      gallery: [
        { id: "m1", title: "مهندس سارا تهرانی", image: img("concrete"), description: "معمار ارشد و مدیر دفتر" },
        { id: "m2", title: "مهندس امیر نوری", image: img("facade"), description: "طراح داخلی" },
        { id: "m3", title: "مهندس نگار مهدوی", image: img("atrium"), description: "مدیر اجرا" },
      ],
      shop: {
        categories: cats,
        products: projects,
        lookImage: img("stairs"),
        lookTitle: "زیبایی معماری این است که هر بار، زندگی از نو شروع می‌شود.",
        promoTitle: "معماری معنادار تقلید از گذشته نیست؛ بیان آن است.",
        promoText: "دفتر آرکا از سال ۱۳۸۴ ساختمان‌های مسکونی و اداری طراحی و اجرا می‌کند. هر ساختمان باید به اقلیم، زمین و آدم‌هایش احترام بگذارد؛ از اولین طرح تا تحویل کلید کنار شما هستیم.",
        newImage: img("tree"),
        newTitle: "خانه‌ی مینیمال باغ، لواسان",
        showcaseTitle: "طراحی خوب یعنی بیشتر شنیدن و کمتر کشیدن.",
        showcaseText: "پیش از اولین خط، زمین را می‌بینیم، نور را در ساعت‌های مختلف می‌سنجیم و با کسانی که آن‌جا زندگی خواهند کرد حرف می‌زنیم.\n\nنتیجه فضایی ساده است که سال‌ها درست کار می‌کند.",
        discoverImage: img("white"),
        trendImage: img("black2"),
        bestTitle: "ارزش‌های معماری همان ارزش‌های انسانی است.",
        bestText: "صداقت در مصالح، احترام به بودجه و زمان کارفرما و دوام ساختمان در گذر سال‌ها؛ اصولی که در هر پروژه به آن پایبندیم.",
        heroImage: img("blocks"),
        heroTitle: "خدمات ما",
        heroText: "از طراحی مفهومی تا اجرای کامل، و از معماری بیرون تا جزئیات داخلی.",
        discountTitle: "برای ساختن فضایی معنادار، معماری را بیان می‌کنیم، نه تقلید.",
        newsletterText: "معماران، طراحان داخلی و مهندسان اجرا با سال‌ها تجربه؛ پروژه را از ایده تا تحویل یک‌جا پیش می‌بریم و یک نفر همیشه پاسخ‌گوی شماست.",
        discoverTitle: "پروژه‌های ما نمونه‌ای از نگرش ما هستند، نه فقط طرح.",
        newText: "هر پروژه داستان خودش را دارد: زمین، کارفرما و محدودیت‌هایش. چند نمونه از کارهای سال‌های اخیر دفتر را این‌جا ببینید.",
        banners: [
          { id: "sv1", image: img("blocks"), title: "طراحی و برنامه‌ریزی", text: "مطالعه‌ی زمین، برنامه‌ی فیزیکی و طراحی مفهومی تا نقشه‌های اجرایی." },
          { id: "sv2", image: img("concrete"), title: "اجرا و نظارت", text: "مدیریت پیمان، نظارت عالیه و کنترل کیفیت تا تحویل کلید." },
          { id: "sv3", image: img("living"), title: "طراحی داخلی", text: "چیدمان، نورپردازی، مبلمان و جزئیات اجرایی فضاهای داخلی." },
          { id: "sv4", image: img("exterior"), title: "محوطه و منظر", text: "طراحی حیاط، باغ و فضای سبز هماهنگ با معماری." },
        ],
        perks: [
          { id: "st1", title: "گفت‌وگو و برآورد", text: "جلسه‌ی آشنایی، بازدید از زمین و برآورد اولیه‌ی هزینه و زمان." },
          { id: "st2", title: "طراحی", text: "طرح مفهومی، سه‌بعدی و نقشه‌های اجرایی با تأیید شما در هر مرحله." },
          { id: "st3", title: "اجرا", text: "اجرا یا نظارت بر اجرا تا تحویل نهایی و پشتیبانی پس از آن." },
        ],
        stats: [
          { id: "y1", value: "۱۳۸۴", label: "آغاز به کار دفتر", text: "دفتر با سه معمار و اولین پروژه‌ی مسکونی در تهران شروع به کار کرد." },
          { id: "y2", value: "۱۳۹۲", label: "جایزه‌ی معماری داخلی ایران", text: "رتبه‌ی دوم بخش ساختمان‌های مسکونی برای خانه‌ی حیاط‌دار شمیران." },
          { id: "y3", value: "۱۳۹۸", label: "بیستمین پروژه‌ی اداری", text: "تحویل ساختمان اداری آجر در ونک و آغاز بخش طراحی داخلی." },
          { id: "y4", value: "۱۴۰۳", label: "جایزه‌ی معمار", text: "تقدیر ویژه‌ی هیئت داوران برای خانه‌ی مینیمال باغ." },
        ],
        schedule: { ...consultSchedule(), closed: [] },
        faqTitle: "سؤالات متداول",
        pages: [{ id: "ap1", slug: "process", title: "روند همکاری", text: "پس از جلسه‌ی اول، پیشنهاد فنی و مالی برایتان فرستاده می‌شود.\n\nقرارداد بر اساس مراحل طراحی و اجرا بسته می‌شود." }],
        posts: [
          { id: "b1", title: "گیاهان آپارتمانی؛ حضوری الهام‌بخش در طراحی", image: img("living"), date: ago(5), author: "سارا تهرانی", category: "طراحی داخلی", text: post("گیاه در فضای داخلی فقط تزئین نیست؛ هوا، نور و حس فضا را تغییر می‌دهد.") },
          { id: "b2", title: "جوهره‌ی خانه‌ی مدرن را چطور به دست بیاوریم؟", image: img("white"), date: ago(12), author: "امیر نوری", category: "معماری", text: post("خانه‌ی مدرن با سادگی شروع می‌شود، نه با کم بودن وسایل.") },
          { id: "b3", title: "چوب بازیافتی در خانه‌ی امروز", image: img("shelves"), date: ago(20), author: "نگار مهدوی", category: "مصالح", text: post("چوب بازیافتی گرما و داستان می‌آورد و به محیط زیست هم کمک می‌کند.") },
          { id: "b4", title: "پلکان؛ مجسمه‌ای که از آن بالا می‌رویم", image: img("stairs"), date: ago(31), author: "سارا تهرانی", category: "معماری", text: post("پلکان خوب هم ایمن است و هم می‌تواند مرکز توجه فضا باشد.") },
          { id: "b5", title: "نور روز؛ ارزان‌ترین مصالح ساختمان", image: img("atrium"), date: ago(44), author: "امیر نوری", category: "معماری", text: post("جهت پنجره‌ها و عمق اتاق‌ها بیش از هر چراغی روی حس خانه اثر دارد.") },
          { id: "b6", title: "صندلی زرد؛ یک رنگ، یک اتاق", image: img("chair"), date: ago(57), author: "نگار مهدوی", category: "طراحی داخلی", text: post("یک رنگ پررنگ در فضایی آرام کافی است تا اتاق شخصیت پیدا کند.") },
        ],
        paymentNote: "",
        orderNote: "",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.ak { --ak-ink: var(--color-text); --ak-muted: var(--color-muted); --ak-line: #E9E9E9; --ak-soft: #F5F5F5; --ak-pink: #F8EBEF; --ak-lilac: #F6E8F4; --ak-blue: #D8EDF5; --ak-sand: #F5ECE9;
  --ak-hot: #E5484D; --ak-off: #F0883E; --ak-acc: var(--color-primary);
  --ak-wrap: min(1370px, 100% - 2 * clamp(14px, 3cqi, 40px));
  --sk-accent: #111; --sk-card: var(--color-bg); --sk-line: var(--ak-line); --sk-soft: var(--ak-soft); --sk-muted: var(--ak-muted); --sk-card-radius: 0; --sk-radius: 0;
  background: var(--color-bg); color: var(--ak-ink); min-height: 100%; font-size: 14px; font-weight: 300; line-height: 1.8; }
.ak a { color: inherit; text-decoration: none; }
.ak button { font: inherit; color: inherit; }
.ak .sk-btn { border-radius: 0; background: #111; color: #fff; }
.ak .sk-btn:hover { background: var(--ak-acc); }
.ak .sk-form input, .ak .sk-form textarea, .ak .sk-coupon input, .ak .sk-card { border-radius: 0; }
.ak b, .ak strong, .ak h3 { font-weight: 600; }
.ak h1, .ak h2 { font-weight: 400; letter-spacing: 0; line-height: 1.5; }
.ak .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ak-wrap { width: var(--ak-wrap); margin-inline: auto; }
.ak-ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.ak-act { display: contents; }
.ak-sec { padding-block: clamp(40px, 5.5cqi, 80px); }
.ak-sec-tight { padding-top: 10px; }
.ak-sec-line { border-top: 1px solid var(--ak-line); }
.ak-muted { color: var(--ak-muted); }
.ak-notice { padding: 18px 24px; border-inline-start: 3px solid var(--ak-ink); background: var(--ak-soft); }
.ak-error { padding: 12px 16px; background: #FDECEC; color: #C62A2F; }
.ak-text { display: grid; gap: 14px; color: var(--ak-muted); line-height: 2.1; }
.ak-pic { position: relative; display: block; overflow: hidden; background: var(--ak-soft); }
.ak-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ak-add { display: grid; place-items: center; min-height: 80px; border: 1px dashed var(--ak-line); color: var(--ak-muted); cursor: pointer; }
.ak-main > * { animation: ak-in .6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes ak-in { from { opacity: 0; transform: translateY(14px); } }

/* Buttons: black, a framed light one, a grey wide one; small sizes */
.ak-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 28px; border: 1px solid #111; background: #111; color: #fff !important; font-size: .86em; font-weight: 500; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.ak-btn:hover { background: var(--ak-acc); border-color: var(--ak-acc); }
.ak-btn.ghost { background: transparent; color: #111 !important; }
.ak-btn.ghost:hover { background: #111; color: #fff !important; border-color: #111; }
.ak-btn.grey { background: var(--ak-soft); border-color: var(--ak-soft); color: #111 !important; }
.ak-btn.grey:hover { background: #111; border-color: #111; color: #fff !important; }
.ak-btn.small { min-height: 36px; padding: 0 18px; font-size: .8em; }
.ak-btn.tiny { min-height: 30px; padding: 0 14px; font-size: .76em; }
.ak-btn.wide, .ak-btn.full { width: 100%; }
.ak-under { display: inline-block; padding-bottom: 2px; border: 0; border-bottom: 1px solid currentColor; background: none; font-size: .8em; font-weight: 500; cursor: pointer; }
.ak-under:hover { color: var(--ak-acc); }
.ak-more { display: inline-flex; align-items: center; gap: 4px; font-size: .86em; }
.ak-more .ak-ico { width: 16px; height: 16px; }

/* Headings of sections */
.ak-head-c { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(22px, 3cqi, 36px); text-align: center; }
.ak-head-c h2 { font-size: clamp(1.5em, 2.2cqi, 2.05em); }
.ak-head-c p, .ak-head-c a { color: var(--ak-muted); font-size: .92em; }

/* Header */
.ak-head { position: sticky; top: 0; z-index: 30; background: var(--color-bg); }
.ak-head-home { border-bottom: 1px solid transparent; }
.ak-head-in { display: flex; align-items: center; gap: 28px; min-height: 76px; }
.ak-logo { display: inline-flex; align-items: center; flex: none; }
.ak-logo img { display: block; width: auto; height: 22px; }
.ak-logo b { font-size: 1.7em; font-weight: 400; letter-spacing: .02em; }
.ak-nav { display: flex; align-items: center; gap: clamp(14px, 2cqi, 30px); margin-inline: auto; font-size: .86em; font-weight: 500; }
.ak-nav-item { position: relative; }
.ak-nav-item > a { display: inline-flex; align-items: center; gap: 3px; padding: 26px 0; transition: color .2s; }
.ak-nav-item > a::after { content: ""; position: absolute; inset-inline: 0; bottom: 20px; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.ak-nav-item > a:hover::after, .ak-nav-item > a[aria-current="page"]::after { transform: scaleX(1); }
.ak-caret { width: 12px; height: 12px; stroke-width: 1.6; }
.ak-sub { position: absolute; top: 100%; inset-inline-start: -18px; z-index: 5; display: grid; min-width: 200px; padding: 12px 0; background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.ak-nav-item:hover .ak-sub, .ak-nav-item:focus-within .ak-sub { opacity: 1; visibility: visible; transform: none; }
.ak-sub a { padding: 7px 20px; font-weight: 400; }
.ak-sub a:hover { color: var(--ak-acc); }
.ak-icons { display: flex; align-items: center; gap: 18px; }
.ak-icon { position: relative; display: inline-flex; align-items: center; transition: color .2s; }
.ak-icon:hover { color: var(--ak-acc); }
.ak-icon > i { position: absolute; top: -7px; inset-inline-end: -9px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px; background: #111; color: #fff; font-size: 10px; font-style: normal; font-weight: 500; line-height: 16px; text-align: center; }
.ak-head-inner .ak-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 80px; }
.ak-head-inner .ak-icons { justify-self: end; }
.ak-head-search { display: flex; width: min(340px, 100%); border: 1px solid var(--ak-line); }
.ak-head-search input, .ak-side-search input, .ak-drawer-search input { flex: 1; min-width: 0; padding: 9px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: .9em; }
.ak-head-search input:focus, .ak-side-search input:focus, .ak-drawer-search input:focus { outline: none; }
.ak-head-search button, .ak-side-search button, .ak-drawer-search button { display: grid; place-items: center; padding-inline: 12px; border: 0; background: none; cursor: pointer; }
.ak-head-search .ak-ico { width: 17px; height: 17px; }
.ak-head-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--ak-line); }
.ak-head-row2 .ak-nav { margin: 0; }
.ak-head-row2 .ak-nav-item > a { padding: 14px 0; }
.ak-head-row2 .ak-nav-item > a::after { bottom: 9px; }
.ak-browse { position: relative; font-size: .84em; font-weight: 600; }
.ak-browse > summary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 0; cursor: pointer; list-style: none; }
.ak-browse > summary::-webkit-details-marker { display: none; }
.ak-browse > div { position: absolute; top: 100%; inset-inline-start: 0; z-index: 6; display: grid; min-width: 230px; padding: 8px 0; border: 1px solid var(--ak-line); background: var(--color-bg); box-shadow: 0 14px 30px -18px rgb(0 0 0 / .35); }
.ak-browse > div a { padding: 8px 18px; font-weight: 400; }
.ak-browse > div a:hover { background: var(--ak-soft); }
.ak-head-contact { display: flex; justify-content: flex-end; gap: 22px; font-size: .84em; }
.ak-head-contact a { display: inline-flex; align-items: center; gap: 6px; }
.ak-head-contact .ak-ico { width: 17px; height: 17px; }
.ak-menu { display: none; }
.ak-menu > summary { list-style: none; cursor: pointer; }
.ak-menu > summary::-webkit-details-marker { display: none; }
.ak-burger .ak-x { display: none; }
.ak-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; width: auto; height: auto; background: rgb(0 0 0 / .4); }
.ak-menu[open] .ak-burger-ico { display: none; }
.ak-menu[open] .ak-x { position: absolute; top: 16px; inset-inline-end: 16px; display: block; width: 40px; height: 40px; padding: 9px; border-radius: 50%; background: #fff; color: #111; }
.ak-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 4px; width: min(340px, 86%); height: 100vh; padding: 18px 22px 90px; overflow-y: auto; background: var(--color-bg); box-shadow: 0 0 40px rgb(0 0 0 / .2); animation: ak-drawer .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes ak-drawer { from { transform: translateX(100%); } }
/* The open phone menu sits above everything of the page (the header is its own layer, under the bar of shortcuts otherwise). */
.ak-head:has(.ak-menu[open]) { z-index: 200; }
.ak:has(.ak-menu[open]) .ak-phonebar { visibility: hidden; }
.ak .ak-drawer .ak-nav-item > a { color: var(--ak-brown); padding: 12px 0; }
.ak .ak-drawer .ak-nav-item > a[aria-current="page"] { color: var(--ak-red); }
.ak .ak-drawer { color: var(--ak-brown); }
.ak .ak-menu[open] .ak-x { width: 42px; height: 42px; padding: 10px; color: #111; stroke-width: 2; }
.ak-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.ak .ak-drawer-head { margin: -18px -22px 10px; padding: 14px 22px; background: var(--ak-choc); }
.ak-drawer-search { display: flex; margin-bottom: 8px; border: 1px solid var(--ak-line); }
.ak-drawer-nav { display: grid; }
.ak-drawer-nav .ak-nav-item > a { width: 100%; padding: 11px 0; border-bottom: 1px solid var(--ak-line); }
.ak-drawer-nav .ak-nav-item > a::after, .ak-drawer-nav .ak-caret { display: none; }
.ak-drawer-nav .ak-sub { position: static; display: grid; min-width: 0; padding: 0 14px 6px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
.ak-drawer-nav .ak-sub a { padding: 6px 0; font-size: .92em; color: var(--ak-muted); }
.ak-drawer > a { padding: 10px 0; }
.ak-drawer hr { width: 100%; margin: 8px 0; border: 0; border-top: 1px solid var(--ak-line); }
.ak-drawer .ak-rate { margin-top: 12px; font-size: .82em; }

/* Home: categories, product row, sale head, store strip */
.ak-cats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; }
.ak-cat { display: grid; justify-items: center; gap: 14px; text-align: center; }
.ak-cat-pic { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; background: var(--ak-soft); }
.ak-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.ak-cat:hover .ak-cat-pic img { transform: scale(1.08); }
.ak-cat b { font-size: .82em; font-weight: 500; }
.ak-slide-row { display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 3 * 20px) / 4); gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: thin; }
.ak-slide-row > * { scroll-snap-align: start; }
.ak-sale-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-bottom: 22px; }
.ak-sale-head h2 { font-size: clamp(1.4em, 2cqi, 1.9em); }
.ak-sale-head .ak-more { margin-inline-start: auto; }
.ak-clock { display: inline-flex; align-items: center; gap: 6px; color: var(--ak-hot); font-size: .82em; font-weight: 500; }
.ak-clock .ak-ico { width: 15px; height: 15px; }
.ak-store { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px 18px; min-height: 64px; padding: 10px 16px; background: var(--ak-lilac); font-size: 1.05em; }
.ak-store > .ak-ico { width: 22px; height: 22px; }

/* Product cards: a square picture on pale grey (the second picture on hover), badges, side buttons */
.ak-card { display: grid; gap: 4px; align-content: start; text-align: center; animation: ak-in .6s calc(var(--i) * 50ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.ak-card-pic { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--ak-soft); }
.ak-img, .ak-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.ak-img img { object-fit: cover; mix-blend-mode: multiply; transition: opacity .5s, transform .9s cubic-bezier(.2, 1, .3, 1); }
.ak-img .ak-img-2 { opacity: 0; }
.ak-card:hover .ak-img .ak-img-2 { opacity: 1; }
.ak-card:hover .ak-img img { transform: scale(1.04); }
.ak-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 2.6em; color: var(--ak-muted); }
.ak-badges { position: absolute; top: 12px; inset-inline-start: 12px; display: grid; justify-items: start; gap: 5px; pointer-events: none; }
.ak-badge { display: inline-block; padding: 1px 8px; background: var(--ak-hot); color: #fff; font-size: .7em; font-weight: 500; line-height: 1.9; }
.ak-badge.off { background: var(--ak-off); }
.ak-badge.out { position: absolute; top: 12px; inset-inline-start: 12px; background: #8A8A8A; }
.ak-badge.dark { background: #111; }
.ak-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2; display: grid; gap: 6px; opacity: 0; transform: translateX(-10px); transition: opacity .3s, transform .3s; }
.ak-card:hover .ak-card-acts, .ak-card-acts:focus-within { opacity: 1; transform: none; }
.ak-round { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 4px 14px -6px rgb(0 0 0 / .3); cursor: pointer; transition: background .2s, color .2s; }
.ak-round:hover, .ak-round.on { background: #111; color: #fff !important; }
.ak-round .ak-ico { width: 17px; height: 17px; }
.ak-card-text { display: grid; justify-items: center; gap: 2px; padding-top: 10px; }
.ak-card-cat { color: #999; font-size: .72em; }
.ak-card-name { font-size: .92em; font-weight: 400; }
.ak-card-name:hover { color: var(--ak-acc); }
.ak-goldline { color: var(--ak-muted); font-size: .76em; }
.ak-price { display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 2px 8px; font-size: .9em; }
.ak-price b { font-weight: 500; }
.ak-price s { color: #A0A0A0; font-size: .86em; }
.ak-card-desc { color: var(--ak-muted); font-size: .86em; line-height: 1.9; }

/* Shop: picture band, bar, grid modes, side column, pages */
.ak-banner { position: relative; display: grid; place-items: center; min-height: clamp(150px, 15cqi, 230px); overflow: hidden; background: #D6D6D6; text-align: center; }
.ak-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ak-banner > div { position: relative; display: grid; justify-items: center; gap: 2px; padding: 20px; }
.ak-banner h1 { font-size: clamp(1.8em, 3cqi, 2.6em); }
.ak-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; color: var(--ak-muted); font-size: .8em; }
.ak-trail a:hover { color: var(--ak-ink); }
.ak-trail i { margin-inline: 6px; font-style: normal; opacity: .6; }
.ak-trail b { color: var(--ak-ink); font-weight: 400; }
.ak-sep { width: 12px; height: 12px; margin-inline: 4px; opacity: .6; }
.ak-trail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 16px; }
.ak-prevnext { display: flex; gap: 6px; }
.ak-prevnext .ak-ico { width: 18px; height: 18px; }
.ak-plp { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: clamp(24px, 3cqi, 40px); align-items: start; padding-block: 26px clamp(40px, 5cqi, 70px); }
.ak-plp-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; font-size: .86em; }
.ak-plp-bar > small { margin-inline-end: auto; color: var(--ak-muted); font-size: 1em; }
.ak-views { display: flex; gap: 6px; }
.ak-views a { display: grid; place-items: center; width: 30px; height: 30px; color: #B5B5B5; }
.ak-views a[aria-current], .ak-views a:hover { color: #111; }
.ak-views .ak-ico { width: 18px; height: 18px; }
.ak-sort { position: relative; }
.ak-sort > summary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: var(--ak-muted); cursor: pointer; list-style: none; }
.ak-sort > summary::-webkit-details-marker { display: none; }
.ak-sort > summary b { color: var(--ak-ink); font-weight: 400; }
.ak-sort-list { position: absolute; top: 100%; inset-inline-start: 0; z-index: 5; display: grid; min-width: 170px; border: 1px solid var(--ak-line); background: var(--color-bg); box-shadow: 0 12px 24px -16px rgb(0 0 0 / .3); }
.ak-sort-list button { width: 100%; padding: 8px 14px; border: 0; background: none; text-align: start; cursor: pointer; }
.ak-sort-list button:hover, .ak-sort-list button[aria-current] { background: var(--ak-soft); }
.ak-grid { display: grid; gap: 34px 20px; }
.ak-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ak-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ak-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.ak-cols-list { grid-template-columns: 1fr; gap: 24px; }
.ak-row { grid-template-columns: 180px minmax(0, 1fr); gap: 24px; text-align: start; }
.ak-row .ak-card-text { justify-items: start; align-content: center; padding: 0; gap: 4px; }
.ak-row .ak-price { justify-content: flex-start; }
.ak-row .ak-btn { margin-top: 10px; }
.ak-pager { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.ak-pager a { display: grid; place-items: center; min-width: 34px; height: 34px; border: 1px solid transparent; font-size: .9em; }
.ak-pager a[aria-current] { border-color: #111; }
.ak-pager .ak-ico { width: 16px; height: 16px; }
.ak-side { display: grid; gap: 0; align-content: start; }
.ak-plp > .ak-side { order: -1; }
.ak-side-box { padding-block: 16px; border-bottom: 1px solid var(--ak-line); }
.ak-side-box > summary { display: flex; align-items: center; justify-content: space-between; font-size: 1.05em; font-weight: 400; cursor: pointer; list-style: none; }
.ak-side-box > summary::-webkit-details-marker { display: none; }
.ak-side-box:not([open]) .ak-caret { transform: rotate(180deg); }
.ak-side-box > div { display: grid; gap: 8px; padding-top: 14px; }
.ak-side-cats { display: grid; gap: 6px; font-size: .9em; }
.ak-side-cats a { display: flex; justify-content: space-between; color: #555; }
.ak-side-cats a:hover, .ak-side-cats a[aria-current] { color: var(--ak-ink); font-weight: 500; }
.ak-side-cats small, .ak-check small { color: #AAA; }
.ak-check { display: flex; align-items: center; gap: 10px; font-size: .9em; color: #555; cursor: pointer; }
.ak-check span { flex: 1; }
.ak-check input { width: 15px; height: 15px; margin: 0; accent-color: #111; }
.ak-sizes { display: flex; flex-wrap: wrap; gap: 6px; }
.ak-sizes label { cursor: pointer; }
.ak-sizes input { position: absolute; opacity: 0; }
.ak-sizes span { display: grid; place-items: center; min-width: 38px; height: 34px; padding: 0 8px; border: 1px solid var(--ak-line); font-size: .86em; }
.ak-sizes input:checked + span { border-color: #111; background: #111; color: #fff; }
.ak-facets-foot { display: flex; align-items: center; gap: 16px; padding-top: 18px; }
.ak-range { position: relative; height: 18px; }
.ak-range::before { content: ""; position: absolute; inset-inline: 0; top: 50%; height: 2px; margin-top: -1px; background: #111; }
.ak-range input { position: absolute; inset: 0; width: 100%; height: 18px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.ak-range input::-webkit-slider-thumb { width: 14px; height: 14px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; -webkit-appearance: none; appearance: none; }
.ak-range input::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid #111; border-radius: 50%; background: #fff; cursor: pointer; pointer-events: auto; }
.ak-range input::-webkit-slider-runnable-track { background: none; }
.ak-range input::-moz-range-track { background: none; }
.ak-range-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.ak-range-foot small { font-size: .8em; color: #555; }
.ak-side-search { display: flex; border: 1px solid var(--ak-line); margin-bottom: 4px; }

/* Product page */
.ak-product { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(26px, 4cqi, 60px); padding-bottom: clamp(30px, 4cqi, 56px); }
.ak-gallery { position: relative; display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.ak-gallery.ak-n0, .ak-gallery.ak-n1 { grid-template-columns: 1fr; }
.ak-g { position: absolute; opacity: 0; pointer-events: none; }
.ak-thumbs { display: grid; gap: 10px; }
.ak-thumbs label { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border: 1px solid transparent; background: var(--ak-soft); cursor: pointer; transition: border-color .2s; }
.ak-thumbs img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.ak-mainpic { position: relative; display: grid; background: var(--ak-soft); }
.ak-big { grid-area: 1 / 1; position: relative; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.ak-big img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.ak-gallery:not(.ak-n0):not(.ak-n1) .ak-big { visibility: hidden; opacity: 0; transition: opacity .4s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.ak-g:nth-of-type(${n}):checked ~ .ak-mainpic > .ak-big:nth-child(${n})`).join(", ")} { visibility: visible !important; opacity: 1 !important; }
${[1, 2, 3, 4, 5, 6].map((n) => `.ak-g:nth-of-type(${n}):checked ~ .ak-thumbs > label:nth-child(${n})`).join(", ")} { border-color: #111; }
.ak-zoom-ico { position: absolute; top: 14px; inset-inline-end: 14px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.ak-zoom-ico .ak-ico { width: 16px; height: 16px; }
.ak-mainpic .ak-badges, .ak-mainpic .ak-badge.out { z-index: 1; }
.ak-info { display: grid; gap: 12px; align-content: start; }
.ak-info h1 { font-size: clamp(1.5em, 2.1cqi, 2em); line-height: 1.5; }
.ak-rating { display: inline-flex; align-items: center; gap: 6px; font-size: .86em; color: var(--ak-muted); }
.ak-info-price { display: flex; align-items: center; gap: 12px; }
.ak-info-price .ak-price { font-size: 1.35em; }
.ak-save { padding: 1px 8px; background: var(--ak-off); color: #fff; font-size: .78em; }
.ak-desc { color: var(--ak-muted); line-height: 2; }
.ak-avail { font-size: .9em; }
.ak-avail .in { color: #16A34A; font-weight: 500; }
.ak-avail .out { color: var(--ak-hot); font-weight: 500; }
.ak-goldbox { display: grid; gap: 8px; padding: 16px 18px; border: 1px solid var(--ak-line); background: #FCFAF6; }
.ak-goldbox h3 { font-size: .95em; }
.ak-goldbox dl { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 10px; row-gap: 0; margin: 0; font-size: .88em; }
.ak-goldbox dt { grid-row: 1; color: var(--ak-muted); }
.ak-goldbox dd { grid-row: 2; margin: 0 0 0 24px; font-weight: 500; }
.ak-goldbox .ak-under { justify-self: start; }
.ak-buy { display: grid; gap: 10px; }
.ak-buy-row { display: flex; gap: 10px; }
.ak-buy-row .ak-btn { flex: 1; }
.ak-qty input { width: 90px; height: 44px; padding: 0 10px; border: 1px solid var(--ak-line); background: var(--color-bg); color: inherit; font: inherit; text-align: center; }
.ak-links { display: flex; flex-wrap: wrap; gap: 8px 22px; padding-top: 6px; }
.ak-linkbtn { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; font-size: .86em; cursor: pointer; }
.ak-linkbtn:hover { color: var(--ak-acc); }
.ak-linkbtn .ak-ico, .ak-eta .ak-ico { width: 17px; height: 17px; }
.ak-eta { display: flex; align-items: center; gap: 8px; font-size: .86em; color: #555; }
.ak-eta b { font-weight: 500; color: var(--ak-ink); }
.ak-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 6px 0 0; padding: 16px 10px; list-style: none; border: 1px solid var(--ak-line); text-align: center; }
.ak-perks li { display: grid; justify-items: center; gap: 6px; font-size: .78em; color: #555; }
.ak-perks .ak-ico, .ak-perks img { width: 26px; height: 26px; stroke-width: 1.2; object-fit: contain; }
.ak-meta { display: flex; align-items: center; gap: 6px; color: var(--ak-muted); font-size: .86em; }
.ak-meta a:hover { color: var(--ak-ink); }
.ak-share .ak-ico { width: 17px; height: 17px; }
.ak-tabs { display: grid; padding-block: 10px clamp(30px, 4cqi, 60px); border-top: 1px solid var(--ak-line); }
.ak-tab-in { position: absolute; opacity: 0; pointer-events: none; }
.ak-tab-labels { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px clamp(18px, 3cqi, 44px); margin-bottom: 26px; }
.ak-tab-labels label { position: relative; padding: 14px 0 8px; color: var(--ak-muted); font-size: 1.02em; cursor: pointer; }
.ak-tab-labels label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: #111; transform: scaleX(0); transition: transform .3s; }
.ak-tab-panel { display: none; }
${[1, 2, 3, 4].map((n) => `.ak-tab-in:nth-of-type(${n}):checked ~ .ak-tab-panels > .ak-tab-panel:nth-child(${n})`).join(", ")} { display: block; animation: ak-in .4s ease both; }
${[1, 2, 3, 4].map((n) => `.ak-tab-in:nth-of-type(${n}):checked ~ .ak-tab-labels > label:nth-child(${n})`).join(", ")} { color: var(--ak-ink); }
${[1, 2, 3, 4].map((n) => `.ak-tab-in:nth-of-type(${n}):checked ~ .ak-tab-labels > label:nth-child(${n})::after`).join(", ")} { transform: scaleX(1); }
.ak-tab-desc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.ak-tab-desc img { width: 100%; max-height: 460px; aspect-ratio: 4 / 3; object-fit: cover; background: var(--ak-soft); }
.ak-specs { width: min(720px, 100%); margin-inline: auto; }
.ak-breakup { display: grid; gap: 12px; width: min(620px, 100%); margin-inline: auto; }
.ak-breakup table { width: 100%; border-collapse: collapse; font-size: .92em; }
.ak-breakup th, .ak-breakup td { padding: 11px 14px; border-bottom: 1px solid var(--ak-line); text-align: start; font-weight: 400; }
.ak-breakup td { text-align: end; white-space: nowrap; }
.ak-breakup tr:nth-child(odd) { background: #FAFAFA; }
.ak-breakup .total th, .ak-breakup .total td { border-bottom: 0; background: #111; color: #fff; font-weight: 500; }
.ak-breakup p { font-size: .84em; }
.ak-tab-panels .sk-reviews { width: min(860px, 100%); margin-inline: auto; }

/* About */
.ak-about-top { display: grid; justify-items: center; gap: 4px; padding-block: 0 clamp(18px, 2.4cqi, 32px); text-align: center; }
.ak-about-top h1, .ak-page-title { font-size: clamp(1.8em, 2.8cqi, 2.5em); }
.ak-page-title { padding-block: 6px 18px; }
.ak-about-top p { max-width: 40em; color: var(--ak-muted); }
.ak-about-pics { display: grid; grid-template-columns: 1fr 1fr; }
.ak-about-pics > .ak-pic { aspect-ratio: 960 / 687; }
.ak-story { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 2fr); gap: clamp(20px, 4cqi, 60px); align-items: start; }
.ak-story h2 { display: flex; align-items: center; gap: 16px; font-size: clamp(1.5em, 2.3cqi, 2.1em); }
.ak-story h2 i { width: 70px; height: 1px; background: currentColor; }
.ak-story > div { display: grid; gap: 16px; }
.ak-story-lead { font-size: 1.15em; font-weight: 500; line-height: 1.9; white-space: pre-line; }
.ak-mission { display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; width: var(--ak-wrap); margin-inline: auto; }
.ak-mission-pic { aspect-ratio: 960 / 540; }
.ak-mission-text { display: grid; align-content: center; gap: 30px; padding: clamp(24px, 4cqi, 60px); background: var(--ak-soft); }
.ak-mission-text h3 { margin-bottom: 8px; font-size: 1.25em; font-weight: 400; }
.ak-mission-text p { color: var(--ak-muted); font-size: .9em; line-height: 2; }
.ak-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 26px; text-align: center; }
.ak-values > div { display: grid; justify-items: center; gap: 8px; }
.ak-values .ak-ico, .ak-values img { width: 34px; height: 34px; stroke-width: 1.2; object-fit: contain; }
.ak-values h3 { font-size: 1.05em; font-weight: 500; }
.ak-values p { max-width: 24em; color: var(--ak-muted); font-size: .86em; line-height: 1.9; }
.ak-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.ak-team figure { display: grid; gap: 10px; margin: 0; }
.ak-team-pic { position: relative; display: block; aspect-ratio: 435 / 488; overflow: hidden; background: var(--ak-soft); }
.ak-team-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, 1, .3, 1); }
.ak-team figure:hover img { transform: scale(1.05); }
.ak-team figcaption { display: grid; }
.ak-team b { font-weight: 500; }
.ak-team small { color: var(--ak-muted); }
.ak-quotes { position: relative; background: var(--ak-pink); }
.ak-q-in { position: absolute; opacity: 0; pointer-events: none; }
.ak-q-list { display: grid; padding-block: clamp(30px, 4cqi, 60px); }
.ak-q-item { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) 240px; align-items: center; gap: clamp(20px, 4cqi, 60px); margin: 0; }
.ak-q2 .ak-q-item, .ak-q3 .ak-q-item, .ak-q4 .ak-q-item, .ak-q5 .ak-q-item { visibility: hidden; opacity: 0; transition: opacity .5s; }
${[1, 2, 3, 4, 5].map((n) => `.ak-q-in:nth-of-type(${n}):checked ~ .ak-q-list > .ak-q-item:nth-child(${n})`).join(", ")} { visibility: visible; opacity: 1; }
.ak-q-item > div { display: grid; justify-items: start; gap: 10px; }
.ak-q-item small { font-size: .8em; color: #555; }
.ak-stars { color: #F2994A; letter-spacing: 2px; }
.ak-q-item blockquote { margin: 0; font-size: clamp(1.1em, 1.6cqi, 1.45em); line-height: 1.8; }
.ak-q-item figcaption { font-size: .86em; font-weight: 500; }
.ak-q-arrows { display: flex; gap: 14px; margin-top: 10px; }
.ak-q-arrows label { cursor: pointer; }
.ak-q-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.ak-q-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Blog */
.ak-blog { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: clamp(24px, 4cqi, 56px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.ak-posts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.ak-post-card { display: grid; gap: 8px; align-content: start; justify-items: start; }
.ak-post-pic { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--ak-soft); }
.ak-post-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, 1, .3, 1); }
.ak-post-card:hover .ak-post-pic img { transform: scale(1.05); }
.ak-post-pic .ak-badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.ak-post-meta { color: #999; font-size: .76em; }
.ak-post-card h2 { font-size: 1.2em; line-height: 1.6; }
.ak-post-card h2 a:hover { color: var(--ak-acc); }
.ak-post-card p { color: var(--ak-muted); font-size: .9em; line-height: 1.9; }
.ak-mini { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: center; }
.ak-mini > span:first-child { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--ak-soft); }
.ak-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ak-mini > span:last-child { display: grid; gap: 2px; font-size: .86em; }
.ak-mini b { font-weight: 500; }
.ak-mini small { color: #999; }
.ak-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ak-tags span { padding: 3px 10px; border: 1px solid var(--ak-line); font-size: .8em; }
.ak-article { display: grid; gap: 14px; align-content: start; justify-items: start; }
.ak-article h1 { font-size: clamp(1.6em, 2.6cqi, 2.3em); }
.ak-article-pic { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.ak-article .ak-text { color: #555; }
.ak-post-nav { display: flex; justify-content: space-between; gap: 20px; width: 100%; padding-block: 18px; border-block: 1px solid var(--ak-line); }
.ak-post-nav a { display: grid; gap: 2px; max-width: 46%; }
.ak-post-nav a:last-child { text-align: end; }
.ak-post-nav small { color: #999; font-size: .78em; }
.ak-post-nav b { font-weight: 400; }
.ak-related { display: grid; gap: 14px; width: 100%; }
.ak-related h2 { font-size: 1.2em; }
.ak-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.ak-rel { display: grid; gap: 8px; }
.ak-rel > span { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; background: var(--ak-soft); }
.ak-rel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ak-rel .ak-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-style: normal; }
.ak-rel b { font-weight: 400; }

/* Contact */
.ak-contact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.ak-contact-info { display: grid; gap: 20px; }
.ak-contact-item { display: flex; align-items: flex-start; gap: 14px; }
.ak-contact-item > .ak-ico { width: 24px; height: 24px; margin-top: 4px; }
.ak-contact-item span { display: grid; }
.ak-contact-item small { color: var(--ak-muted); }
.ak-contact-item b, .ak-contact-item a { font-weight: 500; }
.ak-message { display: grid; gap: 12px; padding: clamp(20px, 3cqi, 36px); background: var(--ak-soft); }
.ak-message h2 { font-size: 1.4em; }
.ak-message input, .ak-message textarea, .ak-checkout input, .ak-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid var(--ak-line); background: var(--color-bg); color: inherit; font: inherit; }
.ak-message input:focus, .ak-message textarea:focus, .ak-checkout input:focus, .ak-checkout textarea:focus { outline: none; border-color: #111; }
.ak-message .ak-btn { justify-self: start; }
.ak-map { position: relative; aspect-ratio: 3 / 1; border: 1px solid var(--ak-line); background: var(--ak-soft); }
.ak-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.ak-map .ak-btn { position: absolute; bottom: 14px; inset-inline-start: 14px; }
.ak-map-link { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 50px 20px; border: 1px dashed var(--ak-line); }

/* Cart, checkout, search, thanks */
.ak-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-bottom: clamp(40px, 5cqi, 70px); }
.ak-lines { display: grid; border-top: 1px solid var(--ak-line); }
.ak-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--ak-line); }
.ak-line-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--ak-soft); }
.ak-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
.ak-line-info { display: grid; gap: 2px; }
.ak-line-info b { font-weight: 500; }
.ak-line-info small { color: var(--ak-muted); }
.ak-stepper { display: flex; align-items: center; border: 1px solid var(--ak-line); }
.ak-stepper button { width: 34px; height: 34px; border: 0; background: none; font-size: 1.1em; cursor: pointer; }
.ak-stepper span { min-width: 24px; text-align: center; }
.ak-line-total { min-width: 8em; text-align: end; font-weight: 500; }
.ak-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--ak-muted) !important; cursor: pointer; }
.ak-remove:hover { color: var(--ak-hot) !important; }
.ak-sum { position: sticky; top: 140px; display: grid; gap: 14px; padding: 24px; background: var(--ak-soft); }
.ak-sum h2 { font-size: 1.25em; }
.ak-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; }
.ak-sum dd { margin: 0; text-align: end; }
.ak-sum .total { padding-top: 12px; border-top: 1px solid #DDD; font-weight: 600; }
.ak-sum small { color: var(--ak-muted); }
.ak-off { color: #15803D; }
.ak-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: .9em; }
.ak-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.ak-pay { padding: 12px 14px; border: 1px dashed #CCC; background: var(--color-bg); font-size: .86em; line-height: 1.9; }
.ak-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.ak-checkout h2, .ak-checkout .full, .ak-checkout .ak-error { grid-column: 1 / -1; }
.ak-checkout h2 { font-size: 1.25em; }
.ak-checkout label { display: grid; gap: 6px; font-size: .9em; font-weight: 500; }
.ak-trap { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.ak-empty { display: grid; justify-items: start; gap: 24px; padding-bottom: clamp(40px, 5cqi, 70px); }
.ak-empty .ak-notice { justify-self: stretch; }
.ak-search { display: grid; gap: 26px; padding-bottom: clamp(40px, 5cqi, 70px); }
.ak-search-box { display: flex; width: min(560px, 100%); margin-inline: auto; border: 1px solid #111; }
.ak-search-box input { flex: 1; min-width: 0; padding: 16px 20px; border: 0; background: none; color: inherit; font: inherit; }
.ak-search-box input:focus { outline: none; }
.ak-search-box button { width: 60px; border: 0; background: none; cursor: pointer; }
.ak-search .ak-muted { text-align: center; }
.ak-thanks { display: grid; justify-items: center; gap: 14px; padding-block: clamp(40px, 6cqi, 90px); text-align: center; }
.ak-thanks p { max-width: 36em; line-height: 2; }
.ak-done { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #E8F6EC; color: #16A34A; font-size: 2em; }

/* Newsletter and footer */
.ak-news { padding-block: clamp(36px, 5cqi, 64px); background: var(--ak-soft); text-align: center; }
.ak-news.is-home { background: var(--color-bg); }
.ak-news .ak-wrap { display: grid; justify-items: center; gap: 6px; }
.ak-news h2 { font-size: clamp(1.4em, 2.1cqi, 1.9em); }
.ak-news p { color: var(--ak-muted); font-size: .88em; }
.ak-news-form { display: flex; gap: 8px; width: min(480px, 100%); margin-top: 14px; }
.ak-news-form input { flex: 1; min-width: 0; padding: 10px 14px; border: 1px solid #111; background: var(--color-bg); color: inherit; font: inherit; font-size: .9em; }
.ak-news-form button { padding: 0 24px; border: 1px solid #111; background: #111; color: #fff; font-size: .82em; cursor: pointer; transition: background .2s; }
.ak-news-form button:hover { background: var(--ak-acc); border-color: var(--ak-acc); }
.ak-foot { padding-top: clamp(40px, 5cqi, 64px); border-top: 1px solid var(--ak-line); background: #FAFAFA; font-size: .88em; }
.ak-foot-cols { display: grid; grid-template-columns: 1.3fr repeat(4, minmax(0, 1fr)); gap: 30px; padding-bottom: 36px; }
.ak-foot-cols > div { display: grid; align-content: start; gap: 8px; }
.ak-foot-cols h3 { margin-bottom: 6px; font-size: 1.05em; font-weight: 500; }
.ak-foot-cols a { color: #666; }
.ak-foot-cols a:hover { color: #111; }
.ak-foot-brand small { color: var(--ak-muted); }
.ak-foot-brand .ak-logo img { height: 24px; }
.ak-foot-phone { display: flex; align-items: center; gap: 10px; color: #111 !important; }
.ak-foot-phone .ak-ico { width: 34px; height: 34px; padding: 7px; border-radius: 50%; background: #E9E9E9; }
.ak-foot-phone span { display: grid; line-height: 1.5; }
.ak-foot-phone small { color: var(--ak-muted); }
.ak-foot-phone b { font-size: 1.15em; font-weight: 500; }
.ak-foot-store p { color: #666; }
.ak-foot-store p b { color: #111; }
.ak-socials { gap: 4px; }
.ak-socials a { width: 32px; height: 32px; border: 0; color: #111; }
.ak-socials a:hover { background: #111; color: #fff; }
.ak-foot-bottom { display: grid; justify-items: center; gap: 10px; padding-block: 18px 24px; border-top: 1px solid var(--ak-line); color: var(--ak-muted); text-align: center; }
.ak-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.ak-trust img { height: 44px; width: auto; }
.ak-phonebar { display: none; }
.ak-ftog, .ak-ftog-btn { display: none; }


/* Big menu under "shop" */
.ak-nav-item.has-mega { position: static; }
.ak-mega { position: absolute; inset-inline: 0; top: 100%; z-index: 6; border-top: 1px solid var(--ak-line); background: var(--color-bg); box-shadow: 0 20px 30px -24px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.ak-nav-item.has-mega:hover .ak-mega, .ak-nav-item.has-mega:focus-within .ak-mega { opacity: 1; visibility: visible; transform: none; }
.ak-mega-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 280px; gap: 30px; padding-block: 30px; }
.ak-mega-in > div { display: grid; align-content: start; gap: 10px; }
.ak-mega h4 { margin: 0 0 4px; font-size: 1em; font-weight: 600; }
.ak-mega h4.ak-mega-h2 { margin-top: 18px; }
.ak-mega-in > div a { color: #666; font-weight: 300; }
.ak-mega-in > div a:hover { color: #111; }
.ak-mega-card { position: relative; display: block; aspect-ratio: 305 / 400; overflow: hidden; background: var(--ak-soft); }
.ak-mega-pic, .ak-mega-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.ak-mega-pic img { object-fit: cover; }
.ak-mega-note { position: absolute; inset-inline: 12px; bottom: 12px; display: grid; justify-items: center; gap: 2px; padding: 14px 10px; background: #fff; text-align: center; }
.ak-mega-note b { font-size: 1.2em; font-weight: 400; }
.ak-mega-note small { color: #555; }
.ak-browse > summary { min-width: 270px; padding: 13px 18px; background: #111; color: #fff; justify-content: space-between; }
.ak-browse > div { min-width: 270px; padding: 0; border-top: 0; }
.ak-browse > div a { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid var(--ak-line); color: #555; }
.ak-browse > div a.strong { color: #111; font-weight: 500; }
.ak-browse > div a .ak-caret { opacity: .5; }
.ak-head-row2 { min-height: 46px; }

/* Phone menu: two tabs, menu and categories */
.ak-dtab { position: absolute; opacity: 0; pointer-events: none; }
.ak-dtabs { display: flex; gap: 22px; margin: 6px 0 8px; border-bottom: 1px solid var(--ak-line); }
.ak-dtabs label { padding: 8px 0; color: var(--ak-muted); cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; }
#ak-dtab-1:checked ~ .ak-dtabs label:first-child, #ak-dtab-2:checked ~ .ak-dtabs label:last-child { color: #111; border-color: #111; }
.ak-dpanel { display: none; }
#ak-dtab-1:checked ~ .ak-dpanel-1, #ak-dtab-2:checked ~ .ak-dpanel-2 { display: grid; }
.ak-dpanel > a { padding: 10px 0; border-bottom: 1px solid var(--ak-line); }
.ak-drawer-socials { margin-top: 14px; }

/* Sign-in window and side cart (hidden checkboxes open them) */
.ak-pop-in { position: fixed; opacity: 0; pointer-events: none; }
.ak-pop, .ak-mc { position: fixed; inset: 0; z-index: 120; display: none; }
#ak-login:checked + .ak-pop, .ak-mc-in:checked + .ak-mc { display: grid; }
.ak-pop { place-items: center; padding: 16px; }
.ak-pop-shade { position: absolute; inset: 0; background: rgb(0 0 0 / .45); cursor: pointer; }
.ak-pop-box { position: relative; display: grid; gap: 14px; width: min(440px, 100%); max-height: calc(100vh - 32px); overflow-y: auto; padding: 30px 28px; background: var(--color-bg); animation: ak-in .35s ease both; }
.ak-pop-x { position: absolute; top: 14px; inset-inline-end: 14px; cursor: pointer; }
.ak-lt { position: absolute; opacity: 0; pointer-events: none; }
.ak-lt-tabs { display: flex; justify-content: center; gap: 30px; }
.ak-lt-tabs label { font-size: 1.6em; font-weight: 300; color: #BBB; cursor: pointer; }
#ak-lt-1:checked ~ .ak-lt-tabs label:first-child, #ak-lt-2:checked ~ .ak-lt-tabs label:last-child { color: #111; }
.ak-pop-form { display: none; gap: 14px; }
#ak-lt-1:checked ~ .ak-pop-form:nth-of-type(1), #ak-lt-2:checked ~ .ak-pop-form:nth-of-type(2) { display: grid; }
.ak-pop-form label { display: grid; gap: 6px; font-size: .92em; font-weight: 500; }
.ak-pop-form label i { color: var(--ak-hot); font-style: normal; }
.ak-pop-form input { width: 100%; padding: 12px 14px; border: 1px solid var(--ak-line); background: var(--color-bg); color: inherit; font: inherit; }
.ak-pop-form input:focus { outline: none; border-color: #111; }
.ak-pop-form small { color: var(--ak-muted); text-align: center; }
.ak-pop-form small a { color: #111; text-decoration: underline; }
.ak-icon-user { cursor: pointer; }
.ak-mc-box { position: absolute; inset-block: 0; inset-inline-end: 0; display: grid; grid-template-rows: auto 1fr auto; width: min(400px, 92%); background: var(--color-bg); animation: ak-mc .35s cubic-bezier(.2, 1, .3, 1); }
@keyframes ak-mc { from { transform: translateX(-100%); } }
.ak-mc-box header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--ak-line); }
.ak-mc-box header h2 { font-size: 1.3em; }
.ak-mc-box header label { cursor: pointer; }
.ak-mc-lines { display: grid; align-content: start; gap: 4px; padding: 6px 22px; overflow-y: auto; }
.ak-mc-line { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--ak-line); }
.ak-mc-line > div { display: grid; justify-items: start; gap: 6px; }
.ak-mc-line small { color: var(--ak-muted); }
.ak-mc-box footer { display: grid; gap: 10px; padding: 18px 22px 22px; border-top: 1px solid var(--ak-line); }
.ak-mc-box footer p { display: flex; justify-content: space-between; font-size: 1.05em; }

/* Tablets */
@container (max-width: 1100px) {
  .ak-nav { gap: 16px; font-size: .82em; }
  .ak-head-contact a:last-child { display: none; }
  .ak-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ak-slide-row { grid-auto-columns: calc((100% - 2 * 20px) / 3); }
  .ak-plp { grid-template-columns: 230px minmax(0, 1fr); }
  .ak-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ak-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ak-foot-brand { grid-column: 1 / -1; }
}
@container (max-width: 900px) {
  .ak-menu { display: block; }
  .ak-nav, .ak-head-row2, .ak-head-search, .ak-icon-user, .ak-icon-search, .ak-icon-wish { display: none !important; }
  .ak-head-in, .ak-head-inner .ak-head-in { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 60px; gap: 10px; }
  .ak-logo { justify-self: center; }
  .ak-icons { justify-self: end; }
  .ak-head-home { border-bottom-color: var(--ak-line); }
  .ak-plp { grid-template-columns: 1fr; }
  .ak-side { order: -1; display: none; grid-template-columns: 1fr 1fr; column-gap: 20px; margin-bottom: 10px; padding: 4px 16px 16px; border: 1px solid var(--ak-line); }
  .ak-ftog:checked + .ak-side { display: grid; }
  .ak-ftog-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #111; cursor: pointer; }
  .ak-ftog-btn .ak-ico { width: 16px; height: 16px; }
  .ak-plp-main { order: 1; }
  .ak-side .ak-side-box { padding-block: 10px; }
  .ak-side-box:not([open]) > div { display: none; }
  .ak-facets { display: contents; }
  .ak-facets-foot { grid-column: 1 / -1; }
  .ak-product { grid-template-columns: 1fr; }
  .ak-tab-desc { display: grid; grid-template-columns: 1fr; }
  .ak-blog, .ak-contact, .ak-cart { grid-template-columns: 1fr; }
  .ak-sum { position: static; }
  .ak-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ak-story { grid-template-columns: 1fr; }
  .ak-mission { grid-template-columns: 1fr; }
  /* Phones: the bar of shortcuts at the bottom */
  .ak-phonebar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--ak-line); background: var(--color-bg); }
  .ak-phonebar a { position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0 6px; font-size: .7em; }
  .ak-phonebar a[aria-current] { color: var(--ak-acc); }
  .ak-phonebar .ak-ico { width: 20px; height: 20px; }
  .ak-phonebar i { position: absolute; top: 3px; left: calc(50% + 6px); min-width: 15px; height: 15px; border-radius: 99px; background: #111; color: #fff; font-size: 9px; font-style: normal; line-height: 15px; text-align: center; }
}
@container (max-width: 600px) {
  .ak { font-size: 13.5px; }
  .ak-cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .ak-slide-row { grid-auto-columns: calc((100% - 12px) / 2); gap: 12px; }
  .ak-cols-2, .ak-cols-3, .ak-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
  .ak-row { grid-template-columns: 110px minmax(0, 1fr); gap: 14px; }
  .ak-card-acts { opacity: 1; transform: none; }
  .ak-round { width: 30px; height: 30px; }
  .ak-plp-bar { flex-wrap: wrap; gap: 8px; }
  .ak-plp-bar > small { flex-basis: 100%; order: 3; }
  .ak-views { margin-inline-start: auto; }
  .ak-side { grid-template-columns: 1fr; }
  .ak-gallery { grid-template-columns: 1fr; }
  .ak-thumbs { order: 2; grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .ak-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ak-buy-row .ak-btn { padding-inline: 12px; }
  .ak-posts, .ak-related > div { grid-template-columns: 1fr; }
  .ak-q-item { grid-template-columns: 1fr; }
  .ak-q-pic { width: 160px; order: -1; }
  .ak-line { grid-template-columns: 72px minmax(0, 1fr) auto; gap: 10px; }
  .ak-line .ak-stepper { grid-column: 2; justify-self: start; }
  .ak-line-total { grid-column: 2 / -1; grid-row: 3; min-width: 0; }
  .ak-checkout { grid-template-columns: 1fr; }
  .ak-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px; }
  .ak-news-form { flex-direction: column; }
  .ak-news-form button { min-height: 42px; }
  .ak-map { aspect-ratio: 1.3; }
  .ak-trail-row { padding-block: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .ak-main > *, .ak-card, .ak-drawer { animation: none !important; }
}

/* ───── Arka look: white, quiet, thin type; every change is slow and soft ───── */
.ak { --ak-ink: #141414; --ak-muted: #777; --ak-line: #E6E6E6; --ak-soft: #F5F5F5; --ak-ease: cubic-bezier(.25, .1, .25, 1); --ak-slow: .9s;
  --ak-wrap: min(1180px, 100% - 2 * clamp(18px, 4cqi, 48px)); --sk-accent: var(--ak-ink); color: var(--ak-ink); font-weight: 300; overflow-x: clip; }
.ak-wrap { width: var(--ak-wrap); margin-inline: auto; }
.ak-sec { padding-block: clamp(50px, 7cqi, 110px); }
.ak h1, .ak h2, .ak h3 { font-weight: 400; letter-spacing: 0; }
.ak-h1 { font-size: clamp(1.8em, 3cqi, 2.6em); line-height: 1.4; }
.ak-h2 { font-size: clamp(1.4em, 2.2cqi, 2em); line-height: 1.55; white-space: pre-line; }
.ak-h3 { font-size: 1.25em; margin-bottom: 18px; }
.ak-kicker { display: block; margin-bottom: 10px; color: var(--ak-muted); font-size: .82em; }
.ak-ruled::after { content: ""; display: block; width: 70px; height: 1px; margin: 22px 10px 0; background: #999; }
.ak-text { color: #444; line-height: 2.1; }
.ak-text p + p { margin-top: 1em; }
.ak-muted { color: var(--ak-muted); line-height: 2; }
.ak-notice { color: var(--ak-muted); }
.ak-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 26px; border: 1px solid var(--ak-ink); background: var(--ak-ink); color: #fff !important; font-weight: 400; font-size: .9em; transition: background var(--ak-slow) var(--ak-ease), color var(--ak-slow) var(--ak-ease); }
.ak-btn:hover { background: #fff; color: var(--ak-ink) !important; }
.ak-btn.ghost { background: transparent; color: var(--ak-ink) !important; }
.ak-btn.ghost:hover { background: var(--ak-ink); color: #fff !important; }
.ak-btn.ghost.light { border-color: rgb(255 255 255 / .8); color: #fff !important; }
.ak-btn.ghost.light:hover { background: #fff; color: var(--ak-ink) !important; }
.ak-btn.small { min-height: 38px; padding: 0 20px; font-size: .85em; }
.ak-btn.wide { width: 100%; }
.ak .sk-btn { border-radius: 0; background: var(--ak-ink); }
.ak-line-link { display: inline-flex; align-items: center; gap: 14px; margin-top: 18px; font-size: .88em; font-weight: 500; }
.ak-line-link::after { content: ""; width: 60px; height: 1px; background: currentColor; transition: width var(--ak-slow) var(--ak-ease); }
.ak-line-link:hover::after { width: 100px; }
.ak-line-link.light { color: #fff; }
.ak-photo { position: relative; display: block; overflow: hidden; background: var(--ak-soft); }
.ak-photo img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 1.6s var(--ak-ease); }
.ak-photo:hover img, a:hover > .ak-photo img { transform: scale(1.04); }
.ak-add { display: grid; place-items: center; min-height: 120px; border: 1px dashed #bbb; color: var(--ak-muted); cursor: pointer; }
.ak-socials a { color: inherit; }

/* Header: white on plain pages, see-through over a big photo */
.ak-head { position: relative; z-index: 30; background: #fff; border-bottom: 1px solid var(--ak-line); }
.ak-head.on-photo { position: absolute; inset-inline: 0; top: 0; background: transparent; border: 0; color: #fff; }
.ak-head-row { display: flex; align-items: center; gap: clamp(16px, 3cqi, 46px); min-height: 84px; padding-inline: clamp(18px, 3.4cqi, 60px); }
.ak-logo img { display: block; height: 34px; width: auto; }
.ak-head.on-photo .ak-logo img { filter: brightness(0) invert(1); }
.ak-logo b { padding: 6px 14px; border: 1px solid currentColor; font-weight: 500; }
.ak-nav { display: flex; align-items: center; gap: clamp(16px, 2.4cqi, 36px); margin-inline-start: auto; font-size: .92em; font-weight: 400; }
.ak-nav-item > a { padding: 30px 0; color: inherit; }
.ak-nav-item > a::after { height: 1px; background: currentColor; }
.ak-caret { width: 12px; height: 12px; }
.ak-sub { min-width: 200px; padding: 12px 0; background: #fff; color: var(--ak-ink); box-shadow: 0 16px 40px -20px rgb(0 0 0 / .3); }
.ak-sub a { padding: 8px 22px; font-weight: 300; transition: padding var(--ak-slow) var(--ak-ease); }
.ak-sub a:hover { padding-inline-start: 28px; }
.ak-actions { display: flex; align-items: center; gap: 18px; }
.ak-client { display: inline-flex; align-items: center; gap: 6px; font-size: .9em; cursor: pointer; }
.ak-client .ak-ico, .ak-client svg { width: 17px; height: 17px; }
.ak-head.on-photo .ak-consult { background: transparent; border-color: rgb(255 255 255 / .8); }
.ak-head.on-photo .ak-consult:hover { background: #fff; color: var(--ak-ink) !important; }

/* Phone menu */
.ak-menu { display: none; }
.ak-burger { display: grid; place-items: center; width: 40px; height: 40px; cursor: pointer; list-style: none; }
.ak-burger::-webkit-details-marker { display: none; }
.ak-burger .ak-ico { width: 24px; height: 24px; }
.ak-menu[open] > summary { position: fixed; inset: 0; z-index: 100; display: block; width: auto; height: auto; background: rgb(0 0 0 / .4); }
.ak-menu[open] > summary .ak-ico { display: none; }
.ak-drawer { position: fixed; top: 0; inset-inline-start: 0; z-index: 101; display: grid; align-content: start; gap: 14px; width: min(340px, 86%); height: 100dvh; padding: 0 22px 40px; overflow-y: auto; background: #fff; color: var(--ak-ink); animation: ak-slide .5s var(--ak-ease); }
@keyframes ak-slide { from { transform: translateX(100%); } }
.ak-menu:not([open]) .ak-drawer { display: none; }
.ak-drawer-head { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between; margin: 0 -22px; padding: 16px 22px; background: #fff; border-bottom: 1px solid var(--ak-line); }
.ak-drawer-head .ak-logo img { filter: none !important; height: 28px; }
.ak-x { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #EEE; }
.ak-x .ak-ico, .ak-x svg { width: 16px; height: 16px; }
.ak-menu[open] .ak-drawer { pointer-events: none; }
.ak-menu[open] .ak-drawer > :not(.ak-drawer-head) { pointer-events: auto; }
.ak-drawer-nav { display: grid; }
.ak-fold { border-bottom: 1px solid var(--ak-line); }
.ak-fold > summary { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; cursor: pointer; list-style: none; }
.ak-fold > summary::-webkit-details-marker { display: none; }
.ak-fold[open] > summary .ak-caret { transform: rotate(180deg); }
.ak-caret { transition: transform .4s var(--ak-ease); }
.ak-fold > div { display: grid; padding: 0 12px 10px; }
.ak-fold > div a { padding: 7px 0; color: #666; }
.ak .ak-fold-link { padding: 14px 0; border-bottom: 1px solid var(--ak-line); }
.ak-fold-link[aria-current] { font-weight: 500; }
.ak-drawer-info { display: grid; gap: 6px; color: #666; font-size: .9em; }
.ak-drawer .ak-socials { justify-content: center; }

/* Home slides: radio buttons, the photos cross-fade slowly; the years pick them */
.ak-slides { position: relative; height: min(100vh, 62cqi + 240px); min-height: 520px; overflow: hidden; background: #111; color: #fff; }
.ak-slide-in { position: absolute; opacity: 0; pointer-events: none; }
.ak-slide { position: absolute; inset: 0; opacity: 0; visibility: hidden; transition: opacity 1.4s var(--ak-ease), visibility 1.4s; }
.ak-slide-pic { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.06); transition: transform 6s var(--ak-ease); }
.ak-slide::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to left, rgb(0 0 0 / .45), rgb(0 0 0 / .08) 55%, rgb(0 0 0 / .4)), linear-gradient(to bottom, rgb(0 0 0 / .35), transparent 30%); }
.ak-slide-text { position: absolute; z-index: 1; inset-inline-start: clamp(22px, 8cqi, 160px); top: 38%; display: grid; justify-items: start; gap: 8px; max-width: 30em; opacity: 0; transform: translateY(20px); transition: opacity 1s .5s var(--ak-ease), transform 1s .5s var(--ak-ease); }
.ak-slide-text small { opacity: .9; }
.ak-slide-text h2 { font-size: clamp(1.8em, 3.4cqi, 3em); line-height: 1.35; }
.ak-slide-text p { line-height: 2; opacity: .92; }
.ak-slide-in.s0:checked ~ .ak-slide.s0, .ak-slide-in.s1:checked ~ .ak-slide.s1, .ak-slide-in.s2:checked ~ .ak-slide.s2, .ak-slide-in.s3:checked ~ .ak-slide.s3, .ak-slide-in.s4:checked ~ .ak-slide.s4, .ak-slide-in.s5:checked ~ .ak-slide.s5, .ak-slide-in.s6:checked ~ .ak-slide.s6 { opacity: 1; visibility: visible; }
.ak-slide-in:checked ~ .ak-slide .ak-slide-pic { transform: none; }
.ak-slide-in.s0:checked ~ .ak-slide.s0 .ak-slide-text, .ak-slide-in.s1:checked ~ .ak-slide.s1 .ak-slide-text, .ak-slide-in.s2:checked ~ .ak-slide.s2 .ak-slide-text, .ak-slide-in.s3:checked ~ .ak-slide.s3 .ak-slide-text, .ak-slide-in.s4:checked ~ .ak-slide.s4 .ak-slide-text, .ak-slide-in.s5:checked ~ .ak-slide.s5 .ak-slide-text, .ak-slide-in.s6:checked ~ .ak-slide.s6 .ak-slide-text { opacity: 1; transform: none; }
.ak-years { position: absolute; z-index: 2; inset-inline-end: clamp(18px, 6cqi, 120px); top: 26%; display: grid; gap: 22px; padding-inline-start: 24px; border-inline-start: 1px solid rgb(255 255 255 / .3); }
.ak-years label { position: relative; color: rgb(255 255 255 / .6); text-shadow: 0 1px 6px rgb(0 0 0 / .5); cursor: pointer; transition: color .6s var(--ak-ease); }
.ak-years label:hover { color: #fff; }
.ak-years label::before { content: ""; position: absolute; inset-inline-start: -28px; top: 50%; width: 7px; height: 7px; margin-top: -3.5px; border-radius: 50%; background: #fff; opacity: 0; transition: opacity .6s; }
.ak-slide-in.s0:checked ~ .ak-years .s0, .ak-slide-in.s1:checked ~ .ak-years .s1, .ak-slide-in.s2:checked ~ .ak-years .s2, .ak-slide-in.s3:checked ~ .ak-years .s3, .ak-slide-in.s4:checked ~ .ak-years .s4, .ak-slide-in.s5:checked ~ .ak-years .s5, .ak-slide-in.s6:checked ~ .ak-years .s6 { color: #fff; }
.ak-slide-in.s0:checked ~ .ak-years .s0::before, .ak-slide-in.s1:checked ~ .ak-years .s1::before, .ak-slide-in.s2:checked ~ .ak-years .s2::before, .ak-slide-in.s3:checked ~ .ak-years .s3::before, .ak-slide-in.s4:checked ~ .ak-years .s4::before, .ak-slide-in.s5:checked ~ .ak-years .s5::before, .ak-slide-in.s6:checked ~ .ak-years .s6::before { opacity: 1; }
.ak-slide-in:focus-visible ~ .ak-years { outline: 1px solid #fff; outline-offset: 8px; }
.ak-down { position: absolute; z-index: 2; inset-inline-end: clamp(18px, 6cqi, 120px); bottom: 34px; color: #fff; animation: ak-bob 2.6s var(--ak-ease) infinite; }
.ak-down svg { width: 26px; height: 26px; }
@keyframes ak-bob { 50% { transform: translateY(8px); } }

/* Intro: text with a rule, a tall photo and a lower one at the edge */
.ak-intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .6fr) minmax(0, .5fr); gap: clamp(24px, 4cqi, 60px); align-items: start; }
.ak-intro-text { align-self: center; }
.ak-intro-text .ak-text { margin-top: 26px; }
.ak-intro-a { aspect-ratio: 3 / 4.15; }
.ak-intro-b { aspect-ratio: 1 / 1; margin-top: 45%; margin-inline-end: calc(-1 * clamp(18px, 4cqi, 48px)); }

/* Services band: hovering a column fades in its photo and lifts its text (slowly) */
.ak-pano { position: relative; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); min-height: clamp(420px, 42cqi, 660px); overflow: hidden; background: #222; color: #fff; }
.ak-pano-col { position: static; display: flex; align-items: flex-end; border-inline-start: 1px solid rgb(255 255 255 / .2); }
.ak-pano-col:first-child { border: 0; }
.ak-pano-pic { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; opacity: 0; transform: scale(1.05); transition: opacity 1.2s var(--ak-ease), transform 2.4s var(--ak-ease); }
.ak-pano::after { content: ""; position: absolute; inset: 0; z-index: 0; background: linear-gradient(to top, rgb(0 0 0 / .55), rgb(0 0 0 / .05) 60%); pointer-events: none; }
.ak-pano-col.first .ak-pano-pic { opacity: 1; transform: none; }
.ak-pano:hover .ak-pano-col.first:not(:hover) .ak-pano-pic { opacity: 0; }
.ak-pano-col:hover .ak-pano-pic { opacity: 1; transform: none; }
.ak-pano-text { position: relative; z-index: 1; display: grid; gap: 10px; width: 100%; padding: clamp(20px, 2.4cqi, 36px); }
.ak-pano-text h3 { font-size: 1.3em; }
.ak-pano-more { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .9s var(--ak-ease), opacity .9s var(--ak-ease); }
.ak-pano-more > div { display: grid; justify-items: start; gap: 14px; overflow: hidden; }
.ak-pano-more p { font-size: .9em; line-height: 2; opacity: .9; }
.ak-pano-col:hover .ak-pano-more, .ak-pano-col:focus-within .ak-pano-more { grid-template-rows: 1fr; opacity: 1; }

/* Posts */
.ak-posts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 3cqi, 40px); margin-top: 30px; }
.ak-posts.two { grid-template-columns: 1fr 1fr; }
.ak-post { display: grid; gap: 8px; align-content: start; text-align: center; }
.ak-post-pic { aspect-ratio: 3 / 2; }
.ak-post h3 { font-size: 1em; line-height: 1.8; }
.ak-post h3 a { transition: opacity .6s; }
.ak-post h3 a:hover { opacity: .6; }
.ak-post small { color: var(--ak-muted); }
.ak-masonry { columns: 3; column-gap: clamp(20px, 3cqi, 36px); }
.ak-masonry .ak-post { break-inside: avoid; margin-bottom: clamp(28px, 3.4cqi, 44px); text-align: start; }
.ak-masonry .ak-post:nth-child(3n + 1) .ak-post-pic { aspect-ratio: 4 / 5; }
.ak-masonry .ak-post:nth-child(3n + 2) .ak-post-pic { aspect-ratio: 1; }
.ak-blog-page { padding-top: clamp(30px, 4cqi, 60px); }

/* Contact strip */
.ak-strip { text-align: start; }
.ak-strip-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; margin-top: 40px; text-align: center; }
.ak-strip-cols > div { display: grid; justify-items: center; gap: 12px; color: #444; }
.ak-big-ico { width: 34px; height: 34px; stroke-width: 1.1; }

/* Footer: light grey, five columns */
.ak-foot { border: 0; background: var(--ak-soft); color: #555; font-size: .9em; }
.ak-foot-cols { display: grid; grid-template-columns: .7fr 1fr 1fr .8fr 1.1fr; gap: 30px; padding-block: clamp(50px, 6cqi, 80px) 40px; }
.ak-foot h3 { margin-bottom: 14px; color: var(--ak-ink); font-size: 1em; font-weight: 500; }
.ak-foot-cols > div { display: grid; align-content: start; gap: 6px; }
.ak-foot a { transition: color .5s; }
.ak-foot a:hover { color: var(--ak-ink); }
.ak-hours { display: grid; gap: 4px; }
.ak-foot-socials { flex-direction: column; align-items: flex-start; gap: 8px; }
.ak-quote { line-height: 2; font-style: normal; color: #333; }
.ak-foot-bottom { position: relative; display: flex; justify-content: center; padding-block: 18px; border-top: 1px solid #E2E2E2; }
.ak-top { position: absolute; inset-inline-end: 0; top: 50%; translate: 0 -50%; display: grid; place-items: center; width: 38px; height: 38px; background: #E6E6E6; }
.ak-top svg { width: 16px; height: 16px; }

/* Inner pages */
.ak-hero { position: relative; display: grid; align-items: center; min-height: clamp(460px, 50cqi, 760px); overflow: hidden; background: #222; color: #fff; }
.ak-hero-pic, .ak-hero-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.ak-hero-pic img { object-fit: cover; animation: ak-zoom 2.4s var(--ak-ease) both; }
@keyframes ak-zoom { from { transform: scale(1.08); } }
.ak-hero::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / .28); }
.ak-hero-in { position: relative; z-index: 1; display: grid; gap: 12px; padding-top: 90px; }
.ak-hero h1 { max-width: 18em; font-size: clamp(1.8em, 3.4cqi, 3em); line-height: 1.5; animation: ak-in 1.2s .2s var(--ak-ease) both; }
.ak-hero-in > p { max-width: 34em; line-height: 2; opacity: .92; animation: ak-in 1.2s .4s var(--ak-ease) both; }
@keyframes ak-in { from { opacity: 0; transform: translateY(18px); } }
.ak-pagetop { padding-block: clamp(36px, 5cqi, 70px) 0; }
.ak-trail { display: flex; flex-wrap: wrap; gap: 8px; color: var(--ak-muted); font-size: .85em; }
.ak-trail span { display: inline-flex; gap: 8px; }
.ak-pagetop .ak-h1 { margin-top: 10px; }
.ak-split { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(26px, 6cqi, 100px); }
.ak-wide { margin: 0 auto; }
.ak-wide .ak-photo { aspect-ratio: 16 / 9.5; }
.ak-wide figcaption { margin-top: 10px; color: var(--ak-muted); font-size: .82em; text-align: center; }
.ak-pair { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(20px, 4cqi, 60px); }
.ak-pair .ak-photo { aspect-ratio: 3 / 4.4; }
.ak-pair .ak-photo:last-child { margin-top: 12%; }
.ak-team { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 3cqi, 40px); margin-top: 30px; }
.ak-member { display: grid; gap: 10px; margin: 0; }
.ak-member .ak-photo { aspect-ratio: 4 / 5; }
.ak-member .ak-photo img { filter: grayscale(1); transition: filter 1.2s var(--ak-ease), transform 1.6s var(--ak-ease); }
.ak-member:hover .ak-photo img { filter: none; }
.ak-member figcaption { display: grid; }
.ak-member small { color: var(--ak-muted); }
.ak-time-in, .ak-year-in { position: absolute; opacity: 0; pointer-events: none; }
.ak-time-line { position: relative; display: flex; justify-content: space-between; gap: 10px; margin: 36px 0 30px; padding-top: 22px; border-top: 1px solid var(--ak-line); }
.ak-time-line label { position: relative; color: var(--ak-muted); font-size: .9em; cursor: pointer; transition: color .6s; }
.ak-time-line label i { position: absolute; top: -27px; inset-inline-start: 50%; width: 9px; height: 9px; margin-inline-start: -4.5px; border-radius: 50%; background: #CCC; transition: background .6s, transform .6s var(--ak-ease); }
.ak-time-item { display: none; max-width: 40em; }
.ak-time-item h3 { margin-bottom: 8px; font-size: 1.15em; }
.ak-time-item p { color: #555; line-height: 2; }
.ak-year-in.y0:checked ~ .ak-time-item.y0, .ak-year-in.y1:checked ~ .ak-time-item.y1, .ak-year-in.y2:checked ~ .ak-time-item.y2, .ak-year-in.y3:checked ~ .ak-time-item.y3, .ak-year-in.y4:checked ~ .ak-time-item.y4, .ak-year-in.y5:checked ~ .ak-time-item.y5 { display: block; animation: ak-in .8s var(--ak-ease); }
.ak-year-in.y0:checked ~ .ak-time-line .y0, .ak-year-in.y1:checked ~ .ak-time-line .y1, .ak-year-in.y2:checked ~ .ak-time-line .y2, .ak-year-in.y3:checked ~ .ak-time-line .y3, .ak-year-in.y4:checked ~ .ak-time-line .y4, .ak-year-in.y5:checked ~ .ak-time-line .y5 { color: var(--ak-ink); }
.ak-year-in.y0:checked ~ .ak-time-line .y0 i, .ak-year-in.y1:checked ~ .ak-time-line .y1 i, .ak-year-in.y2:checked ~ .ak-time-line .y2 i, .ak-year-in.y3:checked ~ .ak-time-line .y3 i, .ak-year-in.y4:checked ~ .ak-time-line .y4 i, .ak-year-in.y5:checked ~ .ak-time-line .y5 i { background: var(--ak-ink); transform: scale(1.4); }
.ak-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: clamp(20px, 4cqi, 50px); margin: 36px 0 0; padding: 0; list-style: none; }
.ak-steps li { display: grid; gap: 8px; align-content: start; }
.ak-num { display: flex; align-items: center; gap: 14px; font-size: 2em; font-weight: 300; }
.ak-num::after { content: ""; width: 50px; height: 1px; background: #999; }
.ak-steps h3 { font-size: 1.1em; }
.ak-steps p { color: #555; line-height: 2; font-size: .92em; }

/* Projects */
.ak-projects-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .8fr); gap: clamp(24px, 5cqi, 80px); align-items: center; padding-block: clamp(40px, 5cqi, 80px) 10px; }
.ak-projects-top .ak-text { margin-top: 16px; }
.ak-projects-pic { aspect-ratio: 4 / 3; }
.ak-kinds { display: flex; flex-wrap: wrap; gap: 6px 22px; margin-top: 30px; font-size: .92em; }
.ak-kinds a { padding-bottom: 4px; border-bottom: 1px solid transparent; color: var(--ak-muted); transition: color .6s, border-color .6s; }
.ak-kinds a:hover, .ak-kinds a[aria-current] { color: var(--ak-ink); border-color: var(--ak-ink); }
.ak-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 5cqi, 80px) clamp(22px, 4cqi, 60px); }
.ak-card { display: grid; gap: 14px; align-content: start; }
.ak-card:nth-child(even) { margin-top: 18%; }
.ak-card .ak-photo { aspect-ratio: 4 / 5; }
.ak-card:nth-child(4n + 2) .ak-photo, .ak-card:nth-child(4n + 3) .ak-photo { aspect-ratio: 1 / 1; }
.ak-card-cap { display: grid; gap: 2px; transition: transform .9s var(--ak-ease); }
.ak-card:hover .ak-card-cap { transform: translateX(-8px); }
.ak-card-cap b { font-weight: 400; font-size: 1.1em; }
.ak-card-cap small { color: var(--ak-muted); }
.ak-project-hero { align-items: end; }
.ak-fact-box { justify-self: end; display: grid; gap: 10px; width: min(460px, 100%); margin-bottom: clamp(30px, 6cqi, 90px); padding: clamp(22px, 3cqi, 36px); background: rgb(0 0 0 / .78); animation: ak-in 1.2s .3s var(--ak-ease) both; }
.ak-fact-box h1 { font-size: 1.6em; }
.ak-fact-box p { font-size: .9em; line-height: 2; opacity: .85; }
.ak-fact-box dl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin: 10px 0 0; }
.ak-fact-box dt { opacity: .6; font-size: .78em; }
.ak-fact-box dd { margin: 0; font-size: .9em; }
.ak-lead { max-width: 46em; color: #444; font-size: 1.15em; line-height: 2.1; }
.ak-zig { display: grid; gap: clamp(40px, 7cqi, 110px); }
.ak-zig-row { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: clamp(26px, 6cqi, 100px); align-items: center; }
.ak-zig-row.flip > :first-child { order: 2; }
.ak-zig-pic { display: block; aspect-ratio: 4 / 5; }
.ak-zig-text { display: grid; gap: 10px; }
.ak-zig-text h3 { font-size: 1.2em; }
.ak-zig-text p { color: #555; line-height: 2; }
.ak-next { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; }

/* Post */
.ak-post-hero .ak-hero-in { justify-items: center; text-align: center; }
.ak-article { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: clamp(30px, 6cqi, 90px); align-items: start; }
.ak-sign { margin-top: 20px; font-style: italic; color: var(--ak-muted); }
.ak-related { margin-top: 50px; padding-top: 40px; border-top: 1px solid var(--ak-line); }
.ak-aside { display: grid; gap: 8px; position: sticky; top: 24px; }
.ak-aside h3 { margin: 14px 0 6px; font-size: .95em; font-weight: 500; }
.ak-aside a { color: #555; font-size: .9em; line-height: 1.9; transition: color .5s; }
.ak-aside a:hover { color: var(--ak-ink); }
.ak-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ak-tags span { padding: 4px 10px; border: 1px solid var(--ak-line); font-size: .8em; }

/* Contact */
.ak-contact { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: clamp(30px, 6cqi, 90px); align-items: start; }
.ak-contact aside { display: grid; gap: 16px; }
.ak-mini { display: grid; gap: 8px; }
.ak-mini .ak-photo { aspect-ratio: 4 / 3; }
.ak-mini b { font-weight: 400; font-size: .92em; }
.ak-contact-info { display: grid; gap: 4px; margin: 18px 0 26px; color: #555; }
.ak-form { display: grid; gap: 18px; padding: clamp(22px, 3.4cqi, 44px); border: 1px solid var(--ak-ink); }
.ak-form label { display: grid; gap: 6px; font-size: .88em; }
.ak-form input, .ak-form textarea { width: 100%; padding: 10px 0; border: 0; border-bottom: 1px solid #CCC; background: transparent; font: inherit; color: inherit; transition: border-color .6s; }
.ak-form input:focus, .ak-form textarea:focus { outline: none; border-color: var(--ak-ink); }
.ak-form .ak-btn { justify-self: start; }
.ak-consult-page .ak-muted { margin-bottom: 26px; }
.ak .bk-cal-head { background: var(--ak-ink); }
.ak .bk-cal, .ak .bk-side { border-radius: 0; }
.ak .bk-btn, .ak .bk-day.picked, .ak .bk-times input:checked + span { background: var(--ak-ink); border-color: var(--ak-ink); color: #fff; }
.ak .bk-day.open::after { background: var(--ak-ink); }
.ak-mine { margin-top: 20px; text-align: center; }
.ak-mine a { border-bottom: 1px solid currentColor; }

@container (max-width: 1100px) {
  .ak-nav { gap: 16px; font-size: .88em; }
  .ak-client span { display: none; }
  .ak-intro { grid-template-columns: minmax(0, 1fr) minmax(0, .8fr); }
  .ak-intro-b { display: none; }
  .ak-foot-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@container (max-width: 900px) {
  .ak-nav, .ak-consult { display: none; }
  .ak-menu { display: block; }
  .ak-head-row { min-height: 66px; gap: 14px; }
  .ak-actions { margin-inline-start: auto; }
  .ak-client span { display: inline; }
  .ak-slides { height: 82vh; min-height: 480px; }
  .ak-slide-text { inset-inline: 22px; top: auto; bottom: 120px; }
  .ak-years { top: auto; bottom: 40px; inset-inline: 22px; display: flex; gap: 18px; padding: 14px 0 0; border: 0; border-top: 1px solid rgb(255 255 255 / .3); overflow-x: auto; scrollbar-width: none; }
  .ak-years::-webkit-scrollbar { display: none; }
  .ak-years label { flex: none; }
  .ak-years label::before { inset-inline-start: 50%; top: -18px; margin: 0 -3.5px 0 0; }
  .ak-down { display: none; }
  .ak-intro { grid-template-columns: 1fr; }
  .ak-intro-a { aspect-ratio: 4 / 3; }
  .ak-pano { grid-template-columns: 1fr; min-height: 0; }
  .ak-pano::after { display: none; }
  .ak-pano-col { position: relative; min-height: 280px; border: 0; border-top: 1px solid rgb(255 255 255 / .2); }
  .ak-pano-pic { opacity: 1 !important; transform: none !important; }
  .ak-pano-col::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(0 0 0 / .65), rgb(0 0 0 / .05)); }
  .ak-pano-more { grid-template-rows: 1fr; opacity: 1; }
  .ak-posts { grid-template-columns: 1fr 1fr; }
  .ak-masonry { columns: 2; }
  .ak-strip-cols { grid-template-columns: 1fr; gap: 26px; }
  .ak-split, .ak-projects-top, .ak-article, .ak-contact { grid-template-columns: 1fr; }
  .ak-aside { position: static; }
  .ak-contact aside { order: 2; grid-template-columns: 1fr 1fr; }
  .ak-contact aside > :is(small, h2) { grid-column: 1 / -1; }
  .ak-team { grid-template-columns: 1fr 1fr; }
  .ak-zig-row, .ak-zig-row.flip { grid-template-columns: 1fr; }
  .ak-zig-row.flip > :first-child { order: 0; }
  .ak-zig-pic { aspect-ratio: 4 / 3; }
  .ak-fact-box { justify-self: stretch; }
  .ak-foot-cols { grid-template-columns: 1fr 1fr; }
}
@container (max-width: 600px) {
  .ak-client span { display: none; }
  .ak-posts, .ak-posts.two { grid-template-columns: 1fr; }
  .ak-masonry { columns: 1; }
  .ak-masonry .ak-post .ak-post-pic { aspect-ratio: 3 / 2 !important; }
  .ak-grid2, .ak-pair { grid-template-columns: 1fr; }
  .ak-card:nth-child(even), .ak-pair .ak-photo:last-child { margin-top: 0; }
  .ak-card .ak-photo { aspect-ratio: 4 / 3 !important; }
  .ak-team { grid-template-columns: 1fr; max-width: 360px; margin-inline: auto; }
  .ak-time-line { overflow-x: auto; scrollbar-width: none; gap: 26px; justify-content: flex-start; }
  .ak-time-line::-webkit-scrollbar { display: none; }
  .ak-time-line label { flex: none; }
  .ak-fact-box dl { grid-template-columns: 1fr 1fr; }
  .ak-foot-cols { grid-template-columns: 1fr; text-align: center; }
  .ak-foot-cols > div { justify-items: center; }
  .ak-foot-socials { flex-direction: row; justify-content: center; }
  .ak-top { position: static; translate: none; margin-inline-start: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .ak *, .ak *::before, .ak *::after { transition-duration: .01s !important; animation: none !important; }
}
`;
