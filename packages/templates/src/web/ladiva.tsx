/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "La Diva": a women's beauty salon rebuilt from the La Diva reference, in Persian. Two-photo hero with
// a round "services" badge, a quick booking strip, the salon's story, services (each a category of the
// shop whose items are its price list), numbers, a price guide, reviews, gallery, questions, products
// sold online, two banners, blog and an Instagram strip; pages: services and one page per service,
// shop (the categories marked "sold online"), about us, booking, blog and contact. The cart, checkout
// and account pages are the shared light shop pages (kafeShop.tsx) in this template's colours.
// Published pages run without scripts: the phone menu is a <details>, the questions too.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { InfoPage, infoPages, onSale, shopkitCss } from "./shopkit";
import { AccountView, AddedToast, BagLink, CartView, CheckoutView, KIcon, ProductCard, ProductView, ShopList, ThanksView, kafeShopCss, soldCategories, soldProducts } from "./kafeShop";
import { mapEmbed } from "./golsara";

export const LADIVA_BLOCKS = [
  { key: "hero", label: "عکس‌های بالای صفحه" },
  { key: "booking", label: "نوار رزرو سریع" },
  { key: "intro", label: "جمله‌ی خوشامد" },
  { key: "space", label: "معرفی سالن" },
  { key: "services", label: "خدمات (اسلایدر)" },
  { key: "packages", label: "پکیج‌ها (کادر سبز)" },
  { key: "stats", label: "اعداد" },
  { key: "prices", label: "راهنمای قیمت" },
  { key: "quotes", label: "نظر مشتری‌ها" },
  { key: "gallery", label: "گالری" },
  { key: "faq", label: "پرسش‌های پرتکرار" },
  { key: "quality", label: "محصولات باکیفیت (سه آیکون)" },
  { key: "products", label: "محصولات" },
  { key: "rating", label: "جمله‌ی امتیاز" },
  { key: "video", label: "نوار ویدیو" },
  { key: "logos", label: "لوگوی رسانه‌ها" },
  { key: "banners", label: "دو بنر" },
  { key: "blog", label: "بلاگ" },
] as const;

export const LADIVA_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const live = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
/** Services: the categories that are not sold online and have at least one priced item. */
const servicesOf = (shop: Shop | undefined) => {
  const items = live(shop);
  return (shop?.categories ?? []).filter((c) => !c.sell && items.some((p) => p.categoryId === c.id));
};
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && pageOn(data, "/blog");

export function ladivaPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const sold = soldProducts(shop);
  const shopPages = sold.length
    ? ["/shop", ...soldCategories(shop).filter((c) => sold.some((p) => p.categoryId === c.id)).map((c) => `/category/${c.id}`), ...sold.map((p) => `/product/${p.id}`), "/cart", "/checkout", "/thanks", "/account", ...infoPages(shop).filter((p) => p !== "/contact")]
    : [];
  const blog = hasBlog(data) ? ["/blog", ...livePosts(shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", "/services", ...servicesOf(shop).map((c) => `/services/${c.id}`), ...(pageOn(data, "/about") ? ["/about"] : []), "/appointment", ...blog, "/contact", ...shopPages];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

export function LadivaSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = ladivaPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : kind === "services" ? (id ? <Service {...view} id={id} /> : <Services {...view} />)
    : page === "/about" ? <About {...view} />
    : page === "/appointment" ? <Appointment {...view} />
    : page === "/contact" ? <Contact {...view} />
    : kind === "blog" ? (id ? <Post {...view} id={id} /> : <Blog {...view} />)
    : page === "/shop" ? <ShopList {...view} />
    : kind === "category" ? <ShopList {...view} categoryId={id} />
    : kind === "product" ? <ProductView {...view} id={id!} />
    : page === "/cart" ? <CartView {...view} />
    : page === "/checkout" ? <CheckoutView {...view} />
    : page === "/thanks" ? <ThanksView {...view} />
    : page === "/account" ? <AccountView {...view} />
    : (
      <div className="kf-wrap kf-inner">
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className={`ld kf-look${page === "/" ? " ld-home" : ""}`} css={partsCss + shopkitCss + kafeShopCss + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
      <AddedToast view={view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const day = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(d) : undefined;
};

/** A title whose words between *stars* are written in the flowing script, as in the reference. */
function Fancy({ text }: { text?: string }) {
  return (
    <>
      {(text ?? "").split(/(\*[^*]+\*)/).map((part, k) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <em key={k} className="ld-script">
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`ld-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

const Para = ({ text }: { text?: string }) => (
  <>
    {(text ?? "")
      .split(/\n\s*\n|\n/)
      .filter((x) => x.trim())
      .map((x, k) => (
        <p key={k}>{x}</p>
      ))}
  </>
);

/** Small capital line over a title. */
const Kicker = ({ children }: { children: ReactNode }) => <small className="ld-kicker">{children}</small>;

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="ld-stars" aria-label={`${fa(n)} ستاره`}>
      {"★★★★★".slice(0, n)}
    </span>
  );
}

const ICONS: Record<string, string> = {
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  arrow: "M19 12H5M11 6l-6 6 6 6",
  down: "M6 9l6 6 6-6",
  play: "M8 5v14l11-7z",
};
function Svg({ name, className = "ld-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Line icons for the three marks of the "quality products" block: leaf, no-drop, globe. */
const MARKS = [
  "M20 34V18M20 22c-6 0-10-4-10-11 7 0 10 4 10 11zM20 26c0-7 4-11 11-11 0 7-4 11-11 11z",
  "M20 6c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17zM8 8l24 24",
  "M20 34a14 14 0 1 0 0-28 14 14 0 0 0 0 28zM6 20h28M20 6c4 4 6 9 6 14s-2 10-6 14M20 6c-4 4-6 9-6 14s2 10 6 14",
];

/** Lowest price of a service's items ("from ..."). */
const fromPrice = (shop: Shop, catId: string) => {
  const prices = live(shop)
    .filter((p) => p.categoryId === catId)
    .map((p) => p.salePrice ?? p.price)
    .filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : undefined;
};

/**
 * A slider without scripts: one radio per position, arrows are labels for the radios before and after,
 * dots below. "show" cards are in view on a wide screen, one on a phone; the rules for this slider are
 * written next to it, since they depend on the number of cards.
 */
function Slider({ id, items, show = 3, dots, className }: { id: string; items: ReactNode[]; show?: number; dots?: boolean; className?: string }) {
  const n = items.length;
  const wideMax = Math.max(0, n - show);
  const phoneMax = Math.max(0, n - 1);
  const rules = items
    .map((_, k) => {
      const at = `#${id}-${k}:checked ~`;
      return [
        `${at} .ld-sl-view .ld-sl-track { --s: ${Math.min(k, wideMax)}; }`,
        k > 0 ? `${at} .ld-sl-nav .ld-sl-prev-${k} { display: grid; }` : "",
        k < wideMax ? `${at} .ld-sl-nav .ld-sl-next-${k} { display: grid; }` : "",
        `${at} .ld-sl-dots label:nth-child(${k + 1}) { background: currentColor; }`,
        `@container (max-width: 820px) { ${at} .ld-sl-view .ld-sl-track { --s: ${Math.min(k, phoneMax)}; } ${k < phoneMax && k >= wideMax ? `${at} .ld-sl-nav .ld-sl-next-${k} { display: grid; }` : ""} }`,
      ].join(" ");
    })
    .join("\n");
  return (
    <div className={`ld-sl ${className ?? ""}`} style={{ "--show": show } as CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: rules }} />
      {items.map((_, k) => (
        <input key={k} type="radio" name={id} id={`${id}-${k}`} defaultChecked={k === 0} className="ld-sl-radio" aria-label={`اسلاید ${fa(k + 1)}`} />
      ))}
      <div className="ld-sl-view">
        <div className="ld-sl-track">
          {items.map((x, k) => (
            <div key={k} className="ld-sl-cell">
              {x}
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div className="ld-sl-nav">
          {items.map((_, k) => (
            <span key={k}>
              {k > 0 && (
                <label htmlFor={`${id}-${k - 1}`} className={`ld-sl-arrow ld-sl-prev ld-sl-prev-${k}`} aria-label="قبلی">
                  <Svg name="arrow" />
                </label>
              )}
              {k < phoneMax && (
                <label htmlFor={`${id}-${k + 1}`} className={`ld-sl-arrow ld-sl-next ld-sl-next-${k}`} aria-label="بعدی">
                  <Svg name="arrow" />
                </label>
              )}
            </span>
          ))}
        </div>
      )}
      {dots && n > show && (
        <div className="ld-sl-dots">
          {items.map((_, k) => (
            <label key={k} htmlFor={`${id}-${k}`} aria-label={`اسلاید ${fa(k + 1)}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── Header and footer ───────────── */

function menuItems(view: View) {
  const data = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    { to: "/services", label: "خدمات" },
    ...(soldProducts(view.shop).length ? [{ to: "/shop", label: "فروشگاه" }] : []),
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    ...(hasBlog(data) ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
}
const isCurrent = (view: View, to: string) =>
  to === "/" ? view.page === "/"
  : to === "/shop" ? ["/shop", "/category/", "/product/"].some((x) => view.page.startsWith(x))
  : view.page.startsWith(to);

function Logo({ view, light }: { view: View; light?: boolean }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className={`ld-logo${light ? " light" : ""}`}>
      {logo ? (
        <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} />
      ) : (
        <>
          <b {...ed("basics.fullName", "text", "نام سالن")}>{b.fullName}</b>
          <small {...ed("basics.jobTitle", "text", "زیر نام")}>{b.jobTitle}</small>
        </>
      )}
    </PageLink>
  );
}

function Header(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const items = menuItems(view);
  const services = servicesOf(shop);
  // "Services" opens a list of every service (a hover panel on wide screens, a sub-list in the phone menu).
  const nav = (phone: boolean) =>
    items.map((m) =>
      m.to === "/services" && services.length > 0 ? (
        <div key={m.to} className="ld-drop">
          <PageLink to={m.to} link={link} current={isCurrent(view, m.to)}>
            {m.label}
            {!phone && <Svg name="down" className="ld-ico ld-drop-ico" />}
          </PageLink>
          <div className="ld-drop-list">
            {services.map((c) => (
              <PageLink key={c.id} to={`/services/${c.id}`} link={link} current={view.page === `/services/${c.id}`}>
                {c.name}
              </PageLink>
            ))}
          </div>
        </div>
      ) : (
        <PageLink key={m.to} to={m.to} link={link} current={isCurrent(view, m.to)}>
          {m.label}
        </PageLink>
      ),
    );
  const sells = soldProducts(shop).length > 0;
  return (
    <header className="ld-head">
      <div className="ld-top">
        <div className="ld-wrap ld-top-in">
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <span>
              <Svg name="pin" /> <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </span>
          </Opt>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
            <span>
              <Svg name="clock" /> <span {...ed("site.contactNote", "multiline", "ساعات کاری")}>{(site?.contactNote ?? "").split("\n").join(" · ")}</span>
            </span>
          </Opt>
          <span className="ld-top-end">
            {b.phone && (
              <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                <Svg name="phone" /> {b.phone}
              </a>
            )}
            <Socials ctx={ctx} editing={editing} className="ld-top-socials" />
          </span>
        </div>
      </div>
      <div className="ld-bar">
        <div className="ld-wrap ld-bar-in">
          <details className="ld-burger">
            <summary aria-label="منو">
              <span />
            </summary>
            <nav className="ld-drawer">
              {nav(true)}
              <PageLink to="/appointment" link={link}>
                رزرو نوبت
              </PageLink>
            </nav>
          </details>
          <nav className="ld-nav">{nav(false)}</nav>
          <Logo view={view} />
          <div className="ld-tools">
            {sells && (
              <>
                <PageLink to="/account" link={link} className="kf-bag" current={view.page === "/account"}>
                  <KIcon name="user" />
                  <span className="sr-only">حساب کاربری</span>
                </PageLink>
                <BagLink view={view} />
              </>
            )}
            <PageLink to="/appointment" link={link} className="ld-btn line ld-book" current={view.page === "/appointment"}>
              رزرو نوبت
            </PageLink>
          </div>
        </div>
      </div>
    </header>
  );
}

/** The booking form of the footer, the booking page and the services: the request opens an email to the salon. */
function BookingForm({ view, className, full, button = "ثبت درخواست نوبت" }: { view: View; className?: string; full?: boolean; button?: string }) {
  const b = view.ctx.data.basics;
  const services = servicesOf(view.shop);
  return (
    <form method="post" action={view.link("/_form")} className={`ld-form ${className ?? ""}`}>
<FormMeta kind="booking" back={view.page} />
      {full && (
        <label className="ld-field ld-full">
          <span>خدمت</span>
          <select name="service" defaultValue="">
            <option value="" disabled>
              انتخاب خدمت
            </option>
            {services.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}
      <label className="ld-field">
        <span>نام شما</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label className="ld-field">
        <span>شماره‌ی تماس</span>
        <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" />
      </label>
      {full ? (
        <>
          <label className="ld-field">
            <span>تاریخ</span>
            <input type="date" name="date" dir="ltr" required />
          </label>
          <label className="ld-field">
            <span>ساعت</span>
            <input type="time" name="time" dir="ltr" required />
          </label>
        </>
      ) : (
        <label className="ld-field ld-full">
          <span>خدمت</span>
          <select name="service" defaultValue="">
            <option value="" disabled>
              انتخاب خدمت
            </option>
            {services.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      )}
      <label className="ld-field ld-full">
        <span>توضیحات (اختیاری)</span>
        <textarea name="body" rows={2} />
      </label>
      <button type="submit" className="ld-btn">
        {button}
      </button>
    </form>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  // Photos without a caption make the strip above the footer (the reference's Instagram row).
  const strip = (site?.gallery ?? []).filter((g) => safeUrl(g.image) && !g.title.trim()).slice(0, 6);
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  return (
    <footer className="ld-foot">
      {strip.length > 0 && (
        <div className="ld-strip">
          {strip.map((g) => (
            <ZoomOpen key={g.id} id={g.id} className="ld-strip-pic">
              <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس")} />
            </ZoomOpen>
          ))}
        </div>
      )}
      <div className="ld-foot-in">
        <div className="ld-foot-main">
          <div className="ld-foot-cols">
            <div>
              <Logo view={view} />
            </div>
            <div>
              <Kicker>صفحه‌ها</Kicker>
              <nav className="ld-foot-links">
                {menuItems(view)
                  .slice(1)
                  .map((m) => (
                    <PageLink key={m.to} to={m.to} link={link}>
                      {m.label}
                    </PageLink>
                  ))}
                <PageLink to="/appointment" link={link}>
                  رزرو نوبت
                </PageLink>
                {pages.map((p) => (
                  <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
                    {p.title}
                  </PageLink>
                ))}
              </nav>
            </div>
            <div className="ld-foot-contact">
              <Kicker>راه‌های تماس</Kicker>
              <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
                <p {...ed("site.address", "text", "نشانی")}>{site?.address}</p>
              </Opt>
              <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
                <p {...ed("site.contactNote", "multiline", "ساعات کاری")}>{site?.contactNote}</p>
              </Opt>
              {b.phone && (
                <a className="ld-foot-phone" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                  <Svg name="phone" /> {b.phone}
                </a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} dir="ltr">
                  {b.email}
                </a>
              )}
            </div>
          </div>
          {blockOn(ctx.data, "newsletter") && (
            <div className="ld-news">
              <h3>از تازه‌ها باخبر شوید</h3>
              <form method="post" action={view.link("/_form")}>
<FormMeta kind="newsletter" back={view.page} />
                <input name="email" type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
                <button type="submit" className="ld-btn line">
                  عضویت
                </button>
              </form>
            </div>
          )}
          <div className="ld-foot-end">
            <small>
              © {fa(new Date().getFullYear())} {b.fullName}. همه‌ی حقوق محفوظ است.
            </small>
            <Socials ctx={ctx} editing={editing} className="ld-foot-socials" />
          </div>
        </div>
        <div className="ld-foot-book">
          <h3>
            <Fancy text="رزرو *نوبت*" />
          </h3>
          <BookingForm view={view} className="ld-form-light" />
        </div>
      </div>
    </footer>
  );
}

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, shop, editing, link } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const services = servicesOf(shop);
  const gallery = (site?.gallery ?? []).filter((g) => safeUrl(g.image) && g.title.trim()).slice(0, 8);
  const quotes = (site?.testimonials ?? []).filter((t) => !t.hidden).slice(0, 8);
  const logos = (site?.clients ?? []).filter((c) => safeUrl(c.image)).slice(0, 10);
  const video = (shop.slides ?? [])[0];
  const marks = (shop.bandItems ?? []).slice(0, 3);
  const faq = (shop.faq ?? []).filter((f) => f.q.trim() && f.a.trim()).slice(0, 6);
  const products = soldProducts(shop).slice(0, 4);
  const banners = (shop.banners ?? []).filter((x) => !x.hidden).slice(0, 2);
  const posts = hasBlog(data) ? livePosts(shop).slice(0, 3) : [];
  const stats = (shop.stats ?? []).slice(0, 2);
  const priced = services.slice(0, 2);
  const hero1 = safeUrl(shop.heroImage);
  const hero2 = safeUrl(site?.heroImage);
  return (
    <>
      {on("hero") && (
        <section className="ld-hero">
          <span className="ld-hero-pic" {...ed("site.shop.heroImage", "image", "عکس راست")}>
            {hero1 && <img src={hero1} alt="" />}
          </span>
          <span className="ld-hero-pic" {...ed("site.heroImage", "image", "عکس چپ")}>
            {hero2 && <img src={hero2} alt="" />}
          </span>
          <div className="ld-hero-text">
            <Opt value={shop.heroTitle} editing={editing} edit={ed("site.shop.heroTitle", "text", "تیتر (کلمه‌ی بین دو * با خط دست‌نویس)")}>
              <h1 {...ed("site.shop.heroTitle", "text", "تیتر (کلمه‌ی بین دو * با خط دست‌نویس)")}>
                <Fancy text={shop.heroTitle} />
              </h1>
            </Opt>
            <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "text", "متن زیر تیتر")}>
              <p {...ed("site.shop.heroText", "text", "متن زیر تیتر")}>{shop.heroText}</p>
            </Opt>
            <PageLink to="/services" link={link} className="ld-round">
              منوی
              <br />
              خدمات ما
            </PageLink>
          </div>
        </section>
      )}

      {on("booking") && servicesOf(shop).length > 0 && (
        <section className="ld-quick">
          <div className="ld-wrap">
            <BookingForm view={view} className="ld-form-row" button="رزرو نوبت" />
          </div>
        </section>
      )}

      {on("intro") && (
        <section className="ld-sec ld-wrap ld-intro">
          <Opt value={site?.tagline} editing={editing} edit={ed("site.tagline", "text", "جمله‌ی خوشامد")}>
            <p className="ld-rise" {...ed("site.tagline", "text", "جمله‌ی خوشامد")}>
              {site?.tagline}
            </p>
          </Opt>
        </section>
      )}

      {on("space") && <SpaceBlock view={view} />}

      {on("services") && services.length > 0 && (
        <section className="ld-sec ld-blush">
          <div className="ld-wrap">
            <div className="ld-head-row">
              <div>
                <Kicker>خدمات ما</Kicker>
                <h2 className="ld-title" {...ed("site.shop.newTitle", "text", "تیتر خدمات")}>
                  <Fancy text={shop.newTitle} />
                </h2>
              </div>
              <PageLink to="/services" link={link} className="ld-round small">
                همه‌ی
                <br />
                خدمات
              </PageLink>
            </div>
            <Slider id="ld-sv" items={services.map((c, k) => <ServiceCard key={c.id} view={view} c={c} i={k} />)} show={3} />
          </div>
        </section>
      )}

      {on("packages") && (
        <section className="ld-wrap ld-packages">
          <div className="ld-pack-text ld-rise">
            <h2 className="ld-title" {...ed("site.shop.promoTitle", "text", "تیتر (کلمه‌ی بین دو * با خط دست‌نویس)")}>
              <Fancy text={shop.promoTitle} />
            </h2>
            <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "multiline", "متن")}>
              <p {...ed("site.shop.promoText", "multiline", "متن")}>{shop.promoText}</p>
            </Opt>
            <PageLink to="/services" link={link} className="ld-btn light">
              مشاهده‌ی پکیج‌ها
            </PageLink>
          </div>
          <Pic src={shop.newImage} path="site.shop.newImage" label="عکس پکیج‌ها" className="ld-pack-pic" />
        </section>
      )}

      {on("stats") && (
        <section className="ld-split ld-stats-block">
          <Pic src={site?.accentImage} path="site.accentImage" label="عکس کنار اعداد" className="ld-split-pic" />
          <div className="ld-split-text ld-rise">
            <Kicker>فراتر از یک آرایش ساده</Kicker>
            <h2 className="ld-title" {...ed("site.styleTitle", "text", "تیتر")}>
              <Fancy text={site?.styleTitle} />
            </h2>
            <div className="ld-stats">
              {stats.map((s) => {
                const at = item("site.shop.stats", s.id);
                return (
                  <div key={s.id} className="ld-stat">
                    <b {...ed(`${at}.value`, "text", "عدد")}>{s.value}</b>
                    <div>
                      <h3 {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</h3>
                      {s.text && <p {...ed(`${at}.text`, "text", "متن")}>{s.text}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {on("prices") && priced.length > 0 && (
        <section className="ld-sec ld-wrap">
          <div className="ld-center-head">
            <h2 className="ld-title" {...ed("site.shop.bestTitle", "text", "تیتر راهنمای قیمت")}>
              <Fancy text={shop.bestTitle} />
            </h2>
            <Opt value={shop.bestText} editing={editing} edit={ed("site.shop.bestText", "text", "متن")}>
              <p {...ed("site.shop.bestText", "text", "متن")}>{shop.bestText}</p>
            </Opt>
          </div>
          <div className="ld-prices">
            {priced.map((c, k) => (
              <PriceCard key={c.id} view={view} c={c} green={k === 1} />
            ))}
          </div>
          <div className="ld-center">
            <PageLink to="/services" link={link} className="ld-btn line">
              راهنمای کامل قیمت‌ها
            </PageLink>
          </div>
        </section>
      )}

      {on("video") && video && safeUrl(video.image) && (
        <section className="ld-video">
          <Pic src={video.image} path={`${item("site.shop.slides", video.id)}.image`} label="عکس نوار ویدیو" className="ld-video-pic" />
          {safeUrl(video.text) ? (
            <a href={safeUrl(video.text)} {...outside(safeUrl(video.text))} className="ld-play" aria-label="پخش ویدیو">
              <Svg name="play" />
            </a>
          ) : (
            <span className="ld-play" aria-hidden="true" {...ed(`${item("site.shop.slides", video.id)}.text`, "url", "لینک ویدیو")}>
              <Svg name="play" />
            </span>
          )}
        </section>
      )}

      {on("quotes") && quotes.length > 0 && (
        <section className="ld-sec ld-rose">
          <div className="ld-wrap">
            <div className="ld-center-head light">
              <h2 className="ld-title">
                <Fancy text="نظر *مشتری‌ها*" />
              </h2>
              <p>ببینید مشتری‌های راضی ما چه می‌گویند</p>
            </div>
            <Slider
              id="ld-qt"
              dots
              className="ld-quotes"
              items={quotes.map((t) => {
                const at = item("site.testimonials", t.id);
                const face = safeUrl(t.image);
                return (
                  <figure key={t.id} className="ld-quote ld-rise">
                    <Stars n={t.rating ?? 5} />
                    <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                    <span className="ld-face" {...ed(`${at}.image`, "image", "عکس")}>
                      {face && <img src={face} alt={t.name} loading="lazy" />}
                    </span>
                    <figcaption {...ed(`${at}.name`, "text", "نام")}>{t.name}</figcaption>
                  </figure>
                );
              })}
            />
          </div>
        </section>
      )}

      {on("gallery") && (gallery.length > 0 || editing) && (
        <section className="ld-sec">
          <div className="ld-wrap ld-center-head">
            <Kicker>گالری عکس</Kicker>
            <h2 className="ld-title" {...ed("site.shop.discountTitle", "text", "تیتر گالری")}>
              <Fancy text={shop.discountTitle} />
            </h2>
          </div>
          <Slider id="ld-gl" show={5} className="ld-gal-slider" items={gallery.map((g) => (
            <ZoomOpen key={g.id} id={g.id} className="ld-gal">
              <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس گالری")} />
              {g.title && <span {...ed(`${item("site.gallery", g.id)}.title`, "text", "متن روی عکس")}>{g.title}</span>}
            </ZoomOpen>
          ))} />
        </section>
      )}

      {on("faq") && faq.length > 0 && (
        <section className="ld-sec ld-wrap ld-faq-block">
          <div className="ld-center-head">
            <h2 className="ld-title">
              <Fancy text="پرسش‌های شما، *پاسخ ما*" />
            </h2>
          </div>
          <Faq items={faq} />
          <div className="ld-center ld-faq-more">
            <p>پاسخ سؤالتان را پیدا نکردید؟</p>
            <PageLink to="/contact" link={link} className="ld-btn line">
              تماس با ما
            </PageLink>
          </div>
        </section>
      )}

      {on("quality") && (
        <section className="ld-split ld-quality">
          <div className="ld-split-text ld-rise">
            <h2 className="ld-title" {...ed("site.contactTitle", "text", "تیتر (کلمه‌ی بین دو * با خط دست‌نویس)")}>
              <Fancy text={site?.contactTitle} />
            </h2>
            <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن")}>
              <div className="ld-body" {...ed("site.styleText", "multiline", "متن")}>
                <Para text={site?.styleText} />
              </div>
            </Opt>
            {marks.length > 0 && (
              <ul className="ld-marks">
                {marks.map((m, k) => (
                  <li key={k}>
                    <svg viewBox="0 0 40 40" aria-hidden="true">
                      <path d={MARKS[k % MARKS.length]} />
                    </svg>
                    <span {...ed(`site.shop.bandItems[${k}]`, "text", "عنوان")}>{m}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Pic src={site?.signatureImage} path="site.signatureImage" label="عکس کنار متن" className="ld-split-pic" />
        </section>
      )}

      {on("products") && products.length > 0 && (
        <section className="ld-sec ld-wrap">
          <div className="ld-head-row">
            <div>
              <h2 className="ld-title" {...ed("site.shop.showcaseTitle", "text", "تیتر محصولات")}>
                <Fancy text={shop.showcaseTitle} />
              </h2>
              <Opt value={shop.showcaseText} editing={editing} edit={ed("site.shop.showcaseText", "text", "متن")}>
                <p className="ld-lead" {...ed("site.shop.showcaseText", "text", "متن")}>
                  {shop.showcaseText}
                </p>
              </Opt>
            </div>
            <PageLink to="/shop" link={link} className="ld-round small">
              همه‌ی
              <br />
              محصولات
            </PageLink>
          </div>
          <div className="kf-grid">
            {products.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("rating") && (
        <section className="ld-sec ld-wrap ld-rating">
          <Stars n={5} />
          <Opt value={site?.bandText} editing={editing} edit={ed("site.bandText", "text", "جمله‌ی بزرگ")}>
            <blockquote className="ld-rise" {...ed("site.bandText", "text", "جمله‌ی بزرگ")}>
              «{site?.bandText}»
            </blockquote>
          </Opt>
          <Opt value={shop.discoverTitle} editing={editing} edit={ed("site.shop.discoverTitle", "text", "خط امتیاز")}>
            <p {...ed("site.shop.discoverTitle", "text", "خط امتیاز")}>{shop.discoverTitle}</p>
          </Opt>
          <PageLink to="/appointment" link={link} className="ld-btn line">
            رزرو نوبت
          </PageLink>
        </section>
      )}

      {on("logos") && logos.length > 0 && (
        <section className="ld-wrap ld-logos-block">
          <Kicker>رسانه‌هایی که درباره‌ی ما نوشته‌اند</Kicker>
          <div className="ld-logos">
            {logos.map((c) => (
              <span key={c.id} className="ld-logo-item" title={c.name} {...ed(`${item("site.clients", c.id)}.image`, "image", "لوگو")}>
                <img src={safeUrl(c.image)} alt={c.name} loading="lazy" />
              </span>
            ))}
          </div>
        </section>
      )}

      {on("banners") && banners.length > 0 && (
        <section className="ld-wrap ld-banners">
          {banners.map((x, k) => {
            const at = item("site.shop.banners", x.id);
            // Without a link of its own, the first banner opens the contact page, the second the shop.
            const href = safeUrl(x.link) ?? (k === 0 ? "/contact" : soldProducts(shop).length ? "/shop" : "/services");
            const inner = (
              <>
                <Pic src={x.image} path={`${at}.image`} label="عکس بنر" className="ld-banner-pic" />
                <span className="ld-banner-text">
                  <b {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</b>
                  <span className="ld-btn light">{x.kicker || "بیشتر"}</span>
                </span>
              </>
            );
            return href?.startsWith("/") ? (
              <PageLink key={x.id} to={href} link={link} className="ld-banner">
                {inner}
              </PageLink>
            ) : (
              <a key={x.id} href={href ?? "#"} {...outside(href)} className="ld-banner">
                {inner}
              </a>
            );
          })}
        </section>
      )}

      {on("blog") && posts.length > 0 && (
        <section className="ld-sec ld-wrap">
          <div className="ld-center-head">
            <Kicker>از بلاگ ما</Kicker>
            <h2 className="ld-title">
              <Fancy text="داستان‌های *الهام‌بخش*" />
            </h2>
          </div>
          <div className="ld-posts">
            {posts.map((p) => (
              <PostCard key={p.id} view={view} p={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** Text with a title, beside two tilted photos (the salon's story). */
function SpaceBlock({ view, title, button = true }: { view: View; title?: ReactNode; button?: boolean }) {
  const { ctx, shop, editing, link } = view;
  const site = ctx.data.site;
  return (
    <section className="ld-sec ld-wrap ld-space">
      <div className="ld-tilt ld-rise">
        <Pic src={shop.lookImage} path="site.shop.lookImage" label="عکس بزرگ" className="ld-tilt-a" />
        <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس کوچک" className="ld-tilt-b" />
      </div>
      <div className="ld-space-text ld-rise">
        <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "خط بالای تیتر")}>
          <Kicker>
            <span {...ed("site.aboutCaption", "text", "خط بالای تیتر")}>{site?.aboutCaption}</span>
          </Kicker>
        </Opt>
        {title ?? (
          <h2 className="ld-title" {...ed("site.aboutTitle", "text", "تیتر (کلمه‌ی بین دو * با خط دست‌نویس)")}>
            <Fancy text={site?.aboutTitle} />
          </h2>
        )}
        <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن")}>
          <div className="ld-body" {...ed("site.aboutText", "multiline", "متن")}>
            <Para text={site?.aboutText} />
          </div>
        </Opt>
        {button && (
          <PageLink to={pageOn(ctx.data, "/about") ? "/about" : "/services"} link={link} className="ld-btn line">
            بیشتر درباره‌ی ما
          </PageLink>
        )}
      </div>
    </section>
  );
}

function ServiceCard({ view, c, i }: { view: View; c: Shop["categories"][number]; i: number }) {
  const from = fromPrice(view.shop, c.id);
  const img = safeUrl(c.image);
  return (
    <PageLink to={`/services/${c.id}`} link={view.link} className="ld-service ld-rise">
      <span className="ld-service-pic" style={{ "--i": i % 3 } as CSSProperties} {...ed(`${item("site.shop.categories", c.id)}.image`, "image", "عکس خدمت")}>
        {img && <img src={img} alt={c.name} loading="lazy" />}
      </span>
      {from !== undefined && <span className="ld-from">از {money(view, from)}</span>}
      <span className="ld-service-text">
        <b>{c.name}</b>
        {c.text && <small>{c.text.split("\n")[0]}</small>}
        <span className="ld-btn light">جزئیات</span>
      </span>
    </PageLink>
  );
}

/** A service's price list beside its picture. */
function PriceCard({ view, c, green }: { view: View; c: Shop["categories"][number]; green?: boolean }) {
  const items = live(view.shop)
    .filter((p) => p.categoryId === c.id)
    .slice(0, 6);
  return (
    <article className={`ld-price-card ld-rise${green ? " green" : ""}`}>
      <Pic src={c.image} path={`${item("site.shop.categories", c.id)}.image`} label="عکس خدمت" className="ld-price-pic" />
      <div className="ld-price-list">
        <h3>{c.name}</h3>
        <PriceRows view={view} items={items} />
      </div>
    </article>
  );
}

function PriceRows({ view, items }: { view: View; items: Product[] }) {
  return (
    <ul className="ld-rows">
      {items.map((p) => (
        <li key={p.id} data-product={p.id}>
          <span>{p.name}</span>
          <i aria-hidden="true" />
          <b>{p.price > 0 ? (onSale(p) ? money(view, p.salePrice!) : money(view, p.price)) : "تماس بگیرید"}</b>
        </li>
      ))}
    </ul>
  );
}

function Gallery({ view, items }: { view: View; items: NonNullable<ResumeData["site"]>["gallery"] }) {
  return (
    <div className="ld-gallery">
      {items.map((g) => (
        <ZoomOpen key={g.id} id={g.id} className="ld-gal ld-rise">
          <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس گالری")} />
          {g.title && <span>{g.title}</span>}
        </ZoomOpen>
      ))}
      {view.editing && items.length < 5 && (
        <span className="ld-gal ld-add" {...ed("site.gallery", "newimage", "افزودن عکس")}>
          +
        </span>
      )}
    </div>
  );
}

function Faq({ items }: { items: NonNullable<Shop["faq"]> }) {
  return (
    <div className="ld-faq">
      {items.map((f, k) => (
        <details key={f.id} open={k === 0}>
          <summary>
            {f.q}
            <i aria-hidden="true">
              <Svg name="down" />
            </i>
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ───────────── Services ───────────── */

function Services(view: View) {
  const services = servicesOf(view.shop);
  return (
    <>
      <PageTop view={view} kicker="خدمات ما" title="طیفی از خدمات *زیبایی* باکیفیت" text="از مو و ناخن تا میکاپ و ابرو؛ هر خدمت را با بهترین مواد و به دست متخصص‌های با تجربه انجام می‌دهیم." />
      <section className="ld-sec ld-wrap">
        <div className="ld-services">
          {services.map((c, k) => (
            <ServiceCard key={c.id} view={view} c={c} i={k} />
          ))}
        </div>
      </section>
      <section className="ld-sec ld-blush">
        <div className="ld-wrap">
          <div className="ld-center-head">
            <h2 className="ld-title">
              <Fancy text="راهنمای *قیمت*" />
            </h2>
            <p>قیمت‌ها ثابت و شفاف است؛ برای خدمات ترکیبی با ما تماس بگیرید.</p>
          </div>
          <div className="ld-prices">
            {services.map((c, k) => (
              <PriceCard key={c.id} view={view} c={c} green={k % 4 === 1 || k % 4 === 2} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Service(view: View & { id: string }) {
  const { shop, link } = view;
  const services = servicesOf(shop);
  const c = services.find((x) => x.id === view.id)!;
  const items = live(shop).filter((p) => p.categoryId === c.id);
  const faq = (shop.faq ?? []).filter((f) => f.q.trim() && f.a.trim()).slice(0, 4);
  const at = item("site.shop.categories", c.id);
  return (
    <section className="ld-wrap ld-inner ld-service-page">
      <aside className="ld-side">
        <nav className="ld-side-list">
          <h3>خدمات ما</h3>
          {services.map((x) => (
            <PageLink key={x.id} to={`/services/${x.id}`} link={link} current={x.id === c.id}>
              {x.name}
              <Svg name="arrow" />
            </PageLink>
          ))}
        </nav>
        <div className="ld-side-book">
          <h3>درخواست مشاوره</h3>
          <BookingForm view={view} button="رزرو نوبت" />
        </div>
      </aside>
      <article className="ld-service-main">
        <h1 className="ld-title">{c.name}</h1>
        <Pic src={c.image} path={`${at}.image`} label="عکس خدمت" className="ld-service-cover" />
        <h2 className="ld-sub">درباره‌ی {c.name}</h2>
        {c.text ? (
          <div className="ld-body" {...ed(`${at}.text`, "multiline", "توضیح خدمت")}>
            <Para text={c.text} />
          </div>
        ) : (
          view.editing && <p className="ld-muted">توضیح این خدمت را در پنل، بخش دسته‌ها بنویسید.</p>
        )}
        <h2 className="ld-sub">قیمت‌ها</h2>
        <PriceRows view={view} items={items} />
        {faq.length > 0 && (
          <>
            <h2 className="ld-sub">پرسش‌های پرتکرار</h2>
            <Faq items={faq} />
          </>
        )}
      </article>
    </section>
  );
}

/* ───────────── About, booking, contact ───────────── */

/** Top of an inner page: a blush panel with the title beside a photo. */
function PageTop({ view, kicker, title, text, src, path, label }: { view: View; kicker?: string; title: string; text?: string; src?: string; path?: string; label?: string }) {
  const url = safeUrl(src ?? view.shop.discoverImage);
  return (
    <section className="ld-top-split">
      <span className="ld-top-pic" {...ed(path ?? "site.shop.discoverImage", "image", label ?? "عکس بالای صفحه")}>
        {url && <img src={url} alt="" />}
      </span>
      <div className="ld-top-text ld-rise">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1 className="ld-title">
          <Fancy text={title} />
        </h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  );
}

function About(view: View) {
  const { ctx, editing } = view;
  const site = ctx.data.site;
  const gallery = (site?.gallery ?? []).filter((g) => safeUrl(g.image) && g.title.trim()).slice(0, 5);
  return (
    <>
      <PageTop view={view} kicker="درباره‌ی ما" title="چرا *ما* بهترینیم؟" text={site?.contactText} src={site?.signatureImage} path="site.signatureImage" />
      <SpaceBlock view={view} button={false} />
      <section className="ld-split ld-about-more">
        <div className="ld-split-text ld-rise">
          <h2 className="ld-title" {...ed("site.contactTitle", "text", "تیتر")}>
            <Fancy text={site?.contactTitle} />
          </h2>
          <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن")}>
            <div className="ld-body" {...ed("site.styleText", "multiline", "متن")}>
              <Para text={site?.styleText} />
            </div>
          </Opt>
        </div>
        <Pic src={site?.accentImage} path="site.accentImage" label="عکس کنار متن" className="ld-split-pic" />
      </section>
      {gallery.length > 0 && (
        <section className="ld-sec">
          <div className="ld-wrap ld-center-head">
            <Kicker>گالری عکس</Kicker>
            <h2 className="ld-title">
              <Fancy text={view.shop.discountTitle} />
            </h2>
          </div>
          <Gallery view={view} items={gallery} />
        </section>
      )}
      <section className="ld-sec ld-wrap">
        <div className="ld-book-card">
          <Kicker>رزرو آنلاین</Kicker>
          <h2 className="ld-title">قدم بعدی را بردارید و نوبت بگیرید</h2>
          <p>رزرو نوبت فقط چند دقیقه طول می‌کشد.</p>
          <BookingForm view={view} full className="ld-form-wide" />
        </div>
      </section>
    </>
  );
}

function Appointment(view: View) {
  const { ctx } = view;
  const site = ctx.data.site;
  const pic = safeUrl(view.shop.trendImage);
  return (
    <section className="ld-wrap ld-inner">
      <div className="ld-appt">
        <div className="ld-appt-form ld-rise">
          <h1 className="ld-title">
            <Fancy text="ثبت *نوبت*" />
          </h1>
          <p>رزرو نوبت فقط چند دقیقه طول می‌کشد؛ پس از بررسی برای تأیید با شما تماس می‌گیریم.</p>
          <BookingForm view={view} full className="ld-form-wide" />
          {site?.contactNote && <p className="ld-muted ld-appt-hours">ساعات کاری: {site.contactNote.split("\n").join(" · ")}</p>}
        </div>
        <span className="ld-appt-pic" {...ed("site.shop.trendImage", "image", "عکس کنار فرم")}>
          {pic && <img src={pic} alt="" />}
        </span>
      </div>
    </section>
  );
}

function Contact(view: View) {
  const { ctx, shop, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const places = (shop.perks ?? []).slice(0, 4);
  return (
    <>
      <PageTop view={view} title="به‌راحتی با ما *در تماس* باشید" text="آنلاین، تلفنی یا با یک سر زدن به سالن؛ هر طور که راحت‌ترید." src={site?.accentImage} path="site.accentImage" />
      <section className="ld-sec ld-wrap ld-contact">
        <div className="ld-rise">
          <h2 className="ld-title">اطلاعات تماس</h2>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
            <div className="ld-body" {...ed("site.contactText", "multiline", "متن")}>
              <Para text={site?.contactText} />
            </div>
          </Opt>
          <dl className="ld-info">
            <div>
              <dt>نشانی</dt>
              <dd {...ed("site.address", "text", "نشانی")}>{site?.address}</dd>
            </div>
            <div>
              <dt>ساعات کاری</dt>
              <dd {...ed("site.contactNote", "multiline", "ساعات کاری")}>{site?.contactNote}</dd>
            </div>
            {b.phone && (
              <div>
                <dt>تلفن</dt>
                <dd>
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                    {b.phone}
                  </a>
                </dd>
              </div>
            )}
            {b.email && (
              <div>
                <dt>ایمیل</dt>
                <dd>
                  <a href={`mailto:${b.email}`} dir="ltr">
                    {b.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="ld-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          {embed ? <iframe src={embed} title="نقشه‌ی سالن" loading="lazy" referrerPolicy="no-referrer" /> : <span>برای نمایش نقشه، لینک مکان سالن را بگذارید.</span>}
        </div>
      </section>
      {places.length > 0 && (
        <section className="ld-sec ld-wrap ld-places-block">
          <div className="ld-center-head">
            <h2 className="ld-title">همه‌ی شعبه‌ها</h2>
          </div>
          <div className="ld-places">
            {places.map((x) => {
              const at = item("site.shop.perks", x.id);
              return (
                <article key={x.id} className="ld-place ld-rise">
                  <Pic src={x.image} path={`${at}.image`} label="عکس شعبه" className="ld-place-pic" />
                  <h3 {...ed(`${at}.title`, "text", "نام شعبه")}>{x.title}</h3>
                  {x.text && <p {...ed(`${at}.text`, "text", "نشانی و ساعت")}>{x.text}</p>}
                  {map && (
                    <a href={map} {...outside(map)} className="ld-link">
                      مسیریابی <Svg name="arrow" />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      <section className="ld-sec ld-wrap ld-ask">
        <Pic src={shop.trendImage} path="site.shop.trendImage" label="عکس کنار فرم" className="ld-ask-pic" />
        <div className="ld-rise">
          <h2 className="ld-title">
            <Fancy text="سؤالی *دارید*؟" />
          </h2>
          <p className="ld-body">سؤالتان را بنویسید؛ با کمال میل راهنمایی‌تان می‌کنیم.</p>
          <form method="post" action={view.link("/_form")} className="ld-form ld-form-wide">
<FormMeta kind="contact" back={view.page} />
              <label className="ld-field">
                <span>نام شما</span>
                <input name="name" />
              </label>
              <label className="ld-field">
                <span>ایمیل شما</span>
                <input name="email" type="email" dir="ltr" />
              </label>
              <label className="ld-field ld-full">
                <span>پیام شما</span>
                <textarea name="body" rows={3} required />
              </label>
              <button type="submit" className="ld-btn">
                ارسال پیام
              </button>
            </form>
        </div>
      </section>
    </>
  );
}

/* ───────────── Blog ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];
const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 220 ? `${p.text.slice(0, 220).trim()}…` : p.text);

function PostCard({ view, p }: { view: View; p: PostT }) {
  const img = safeUrl(p.image);
  return (
    <article className="ld-post ld-rise">
      <PageLink to={`/blog/${p.id}`} link={view.link} className="ld-post-pic">
        {img && <img src={img} alt={p.title} loading="lazy" />}
      </PageLink>
      {p.category && <Kicker>{p.category}</Kicker>}
      <PageLink to={`/blog/${p.id}`} link={view.link}>
        <h3>{p.title}</h3>
      </PageLink>
      <PageLink to={`/blog/${p.id}`} link={view.link} className="ld-btn line">
        ادامه‌ی مطلب
      </PageLink>
    </article>
  );
}

function Blog(view: View) {
  const posts = livePosts(view.shop);
  return (
    <section className="ld-wrap ld-inner">
      <div className="ld-center-head">
        <Kicker>بلاگ</Kicker>
        <h1 className="ld-title">
          <Fancy text="داستان‌های *الهام‌بخش*" />
        </h1>
      </div>
      <div className="ld-blog">
        {posts.map((p) => {
          const img = safeUrl(p.image);
          return (
            <article key={p.id} className="ld-blog-item ld-rise">
              <PageLink to={`/blog/${p.id}`} link={view.link} className="ld-post-pic">
                {img && <img src={img} alt={p.title} loading="lazy" />}
              </PageLink>
              <div>
                <small className="ld-meta">{[day(p.date), p.category].filter(Boolean).join(" · ")}</small>
                <PageLink to={`/blog/${p.id}`} link={view.link}>
                  <h2>{p.title}</h2>
                </PageLink>
                <p>{excerptOf(p)}</p>
                <PageLink to={`/blog/${p.id}`} link={view.link} className="ld-btn line">
                  ادامه‌ی مطلب
                </PageLink>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Post(view: View & { id: string }) {
  const p = livePosts(view.shop).find((x) => x.id === view.id)!;
  const img = safeUrl(p.image);
  const others = livePosts(view.shop)
    .filter((x) => x.id !== p.id)
    .slice(0, 3);
  return (
    <>
      <article className="ld-wrap ld-inner ld-article">
        <header>
          <small className="ld-meta">{[day(p.date), p.author, p.category].filter(Boolean).join(" · ")}</small>
          <h1 className="ld-title">{p.title}</h1>
        </header>
        {img && <img className="ld-article-pic" src={img} alt={p.title} />}
        <div className="ld-body">
          <Para text={p.text} />
        </div>
        <PageLink to="/blog" link={view.link} className="ld-btn line">
          بازگشت به بلاگ
        </PageLink>
      </article>
      {others.length > 0 && (
        <section className="ld-sec ld-wrap">
          <div className="ld-center-head">
            <h2 className="ld-title">مطالب دیگر</h2>
          </div>
          <div className="ld-posts">
            {others.map((x) => (
              <PostCard key={x.id} view={view} p={x} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Example content (from the La Diva reference, in Persian) ───────────── */

export function ladivaSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`ld-${n}`);
  const item = (id: string, categoryId: string, name: string, price: number, description?: string, extra: Partial<Product> = {}): Product => ({ id, name, categoryId, price, images: [], description, ...extra });
  const polish = (id: string, code: string, price: number, extra: Partial<Product> = {}): Product => ({
    id,
    name: `لاک ژل‌افکت ${code}`,
    categoryId: "pl",
    price,
    images: [img(`polish-${code}`)],
    description: "لاک با ماندگاری بالا و براقیت ژل، بدون نیاز به دستگاه یو‌وی.\nدر دو لایه بزنید و پس از خشک شدن، یک لایه براق‌کننده رویش بکشید؛ تا ده روز بدون پریدگی می‌ماند.",
    ...extra,
  });
  const products: Product[] = [
    item("h1", "hs", "کوتاهی و حالت‌دهی", 650000),
    item("h2", "hs", "براشینگ", 420000),
    item("h3", "hs", "شینیون مجلسی", 1800000),
    item("h4", "hs", "کراتینه‌ی مو", 3500000),
    item("h5", "hs", "ماسک و مراقبت مو", 550000),
    item("c1", "hc", "رنگ ریشه", 900000),
    item("c2", "hc", "رنگ کامل", 1600000),
    item("c3", "hc", "هایلایت و بالیاژ", 3200000),
    item("c4", "hc", "آمبره", 2800000),
    item("n1", "nl", "مانیکور امضای لا دیوا", 450000),
    item("n2", "nl", "مانیکور ارگانیک", 520000),
    item("n3", "nl", "مانیکور ژل", 600000),
    item("n4", "nl", "کاشت ناخن", 950000),
    item("n5", "nl", "مانیکور و ماساژ اسپا", 750000),
    item("m1", "mk", "میکاپ روزانه", 900000),
    item("m2", "mk", "میکاپ مجلسی", 2200000),
    item("m3", "mk", "میکاپ و شینیون عروس", 9500000),
    item("b1", "br", "اصلاح و فرم ابرو", 250000),
    item("b2", "br", "لیفت مژه", 850000),
    item("b3", "br", "اکستنشن مژه", 1400000),
    item("e1", "mn", "کوتاهی آقایان", 380000),
    item("e2", "mn", "اصلاح ریش", 220000),
    item("e3", "mn", "مانیکور آقایان", 350000),
    polish("pl1", "165", 1490000, { salePrice: 1090000 }),
    polish("pl2", "570", 1490000, { salePrice: 1290000 }),
    polish("pl3", "680", 1490000, { stock: 0 }),
    polish("pl4", "768", 1490000),
    polish("pl5", "782", 1490000),
    polish("pl6", "883", 1490000),
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "لا دیوا",
      jobTitle: "سالن زیبایی",
      avatarUrl: "",
      email: "info@example.com",
      phone: "021 0000 0000",
      summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
      ],
    },
    site: {
      ...base.site,
      tagline: "ما این‌جاییم تا به شما خدمت کنیم؛ همان‌طور که شما زیبایی‌تان را به ما می‌سپارید. بیایید با هم، تصویری را که در ذهن دارید به واقعیت تبدیل کنیم.",
      aboutCaption: "فضایی برای شما",
      aboutTitle: "مراقبت‌های زیبایی *مخصوص* شما",
      aboutText: "بیایید سفری به سوی آرامش و خودباوری را آغاز کنیم. شما سزاوار بهترین حس و بهترین ظاهر هستید و ما با خدماتی متنوع در کنارتان هستیم؛ از مراقبت مو تا ناخن و میکاپ، همه را این‌جا انجام می‌دهیم.\nاین فضا را با فکر شما ساخته‌ایم تا آرام و دلنشین باشد؛ زمانی که این‌جا می‌گذرانید، زمان استراحت است.",
      aboutImage: img("i2"),
      styleTitle: "هیچ چیز مثل یک *مانیکور* تازه حالتان را خوب نمی‌کند",
      styleText: "تیم ما از آرایشگران و متخصص‌هایی تشکیل شده که سال‌ها تجربه دارند و هر سال در دوره‌های تازه شرکت می‌کنند.\nما فقط از محصولات معتبر، ارگانیک و بی‌خطر استفاده می‌کنیم و همه‌ی وسایل پس از هر مشتری استریل می‌شوند؛ چون سلامت شما برایمان از هر چیزی مهم‌تر است.",
      contactTitle: "فقط از محصولات باکیفیتی استفاده می‌کنیم که به آن‌ها *اعتماد* دارید",
      bandText: "سالن زیبایی بهتری از این در شهر پیدا نمی‌کنید.",
      clients: Array.from({ length: 10 }, (_, k) => ({ id: `lg${k + 1}`, name: `رسانه‌ی ${k + 1}`, image: sampleImage(`ld-logo${k + 1}`, "png") })),
      contactText: "این‌جاییم تا به شما خدمت کنیم؛ همان‌طور که شما زیبایی‌تان را به ما می‌سپارید. بیایید با هم تصویری را که در ذهن دارید به واقعیت تبدیل کنیم.",
      heroImage: img("hero2"),
      accentImage: img("p4"),
      signatureImage: img("s6"),
      address: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۴۵",
      contactNote: "شنبه تا پنجشنبه: ۹ تا ۲۰\nجمعه: تعطیل",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7300&mlon=51.4100",
      gallery: [
        { id: "g1", title: "رنگ مو", image: img("g1") },
        { id: "g2", title: "طراحی ناخن", image: img("g2") },
        { id: "g3", title: "حالت‌دهی مو", image: img("g3") },
        { id: "g4", title: "میکاپ", image: img("g4") },
        { id: "g5", title: "کاشت ناخن", image: img("g5") },
        { id: "g6", title: "شینیون توسط سارا", image: img("p1") },
        { id: "g7", title: "رنگ مو توسط نگار", image: img("p2") },
        { id: "i1", title: "", image: img("i1") },
        { id: "i2", title: "", image: img("i2") },
        { id: "i3", title: "", image: img("i3") },
        { id: "i4", title: "", image: img("i4") },
        { id: "i5", title: "", image: img("i5") },
        { id: "i6", title: "", image: img("i6") },
      ],
      testimonials: [
        { id: "t1", name: "سینا ل.", image: img("av1"), text: "عاشق این سالن شدم! پدیکور لوکسشان فوق‌العاده است؛ لاکی که زدند تقریباً شش هفته ماند و هنوز براق است." },
        { id: "t2", name: "آمنه ر.", image: img("av2"), text: "تصادفی پیدایش کردم و چه خوب که آمدم. برخوردشان گرم است و کیفیت کارشان بی‌نظیر؛ روی شکل ناخن خیلی وسواس دارم و راضی بیرون آمدم." },
        { id: "t3", name: "مهسا ک.", image: img("av3"), text: "اگر می‌شد صد ستاره می‌دادم! بهداشت را کامل رعایت می‌کنند و ناخن ژلم سه هفته بی‌نقص ماند." },
        { id: "t4", name: "هانیه ج.", image: img("av1"), text: "سالن زیبا و دلنشینی است و حال‌وهوای آرامی دارد. هایلایتم دقیقاً همان شد که می‌خواستم." },
        { id: "t5", name: "نازنین م.", image: img("av2"), text: "میکاپ عروسی‌ام را این‌جا انجام دادم؛ تا آخر شب بی‌نقص ماند و همه از عکس‌ها تعریف کردند." },
      ],
      shop: {
        heroTitle: "زیبایی شما،\n*از* سر تا پا",
        heroText: "خدماتی متنوع برای این‌که مو، ناخن، میکاپ، ابرو و مژه‌تان بی‌نقص باشد.",
        heroImage: img("hero1"),
        newTitle: "طیفی از خدمات *زیبایی* باکیفیت",
        bestTitle: "راهنمای قیمت",
        promoTitle: "پکیج‌های زیبایی *همه‌کاره*",
        promoText: "این فضا را با فکر شما ساخته‌ایم تا آرام و دلنشین باشد. با پکیج‌های ما مو، ناخن و پوستتان را در یک روز به ما بسپارید و فقط استراحت کنید.",
        newImage: img("home5"),
        discoverTitle: "امتیاز ۴٫۸ بر اساس بیش از ۱۰۰۰ نظر",
        bandItems: ["ارگانیک", "بدون مواد سمی", "سازگار با طبیعت"],
        slides: [{ id: "vd1", title: "ویدیوی سالن", image: img("wide"), text: "" }],
        bestText: "قیمت‌های ثابت و شفاف برای همه‌ی خدمات زیبایی ما",
        discountTitle: "زیبایی شما *اولویت* ماست",
        showcaseTitle: "محصولات *حرفه‌ای*",
        showcaseText: "محصولات مورد علاقه‌تان را از فروشگاه آنلاین ما بخرید.",
        lookImage: img("home6"),
        discoverImage: img("s4"),
        trendImage: img("p3"),
        stats: [
          { id: "st1", value: "۵٬۰۰۰+", label: "مشتری راضی در سال", text: "متخصص‌های ما با خدمات متنوع کاری می‌کنند که حس و ظاهرتان عالی باشد." },
          { id: "st2", value: "۱۳۲۵", label: "طرح ناخن منحصربه‌فرد", text: "هر طرحی که دوست دارید را می‌توانیم اجرا کنیم یا طرحی تازه برایتان بسازیم." },
        ],
        banners: [
          { id: "bn1", image: img("salon"), title: "شعبه‌های ما", kicker: "برنامه‌ی بازدید" },
          { id: "bn2", image: img("gift"), title: "کارت هدیه و محصولات", kicker: "خرید آنلاین" },
        ],
        perks: [
          { id: "pk1", title: "شعبه‌ی ولیعصر", text: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۴۵ · شنبه تا پنجشنبه ۹ تا ۲۰", image: img("salon") },
          { id: "pk2", title: "شعبه‌ی سعادت‌آباد", text: "تهران، سعادت‌آباد، میدان کاج، خیابان سرو غربی، پلاک ۱۲ · همه‌روزه ۱۰ تا ۲۱", image: img("s5") },
        ],
        categories: [
          { id: "hs", name: "حالت‌دهی مو", image: img("s1"), text: "از کوتاهی‌های کلاسیک تا مدل‌های امروزی؛ آرایشگران ما با توجه به فرم صورت، جنس مو و سبک زندگی‌تان بهترین مدل را پیشنهاد می‌دهند.\nدر جلسه‌ی مشاوره درباره‌ی مدلی که در ذهن دارید صحبت می‌کنیم تا نتیجه دقیقاً همان چیزی باشد که می‌خواهید." },
          { id: "hc", name: "رنگ مو", image: img("s6"), text: "رنگ، هایلایت و بالیاژ با رنگ‌های بدون آمونیاک که به مو آسیب کمتری می‌زنند؛ همراه با مراقبت بعد از رنگ برای ماندگاری بیشتر." },
          { id: "nl", name: "ناخن", image: img("s3"), text: "مانیکور، پدیکور، ژل و کاشت ناخن با ابزار استریل و محصولات ارگانیک؛ از طرح‌های ساده تا هنری‌ترین طراحی‌ها." },
          { id: "mk", name: "میکاپ", image: img("s4"), text: "میکاپ روزانه، مجلسی و عروس با محصولات معتبر و ماندگار، متناسب با رنگ پوست و حال‌وهوای مراسم شما." },
          { id: "br", name: "ابرو و مژه", image: img("s2"), text: "فرم‌دهی ابرو، لیفت و اکستنشن مژه برای نگاهی گیراتر؛ همه به دست متخصص‌های ابرو و مژه‌ی ما." },
          { id: "mn", name: "خدمات آقایان", image: img("s5"), text: "کوتاهی، اصلاح ریش و مراقبت پوست و ناخن آقایان در فضایی آرام و جداگانه." },
          { id: "pl", name: "لاک ناخن", image: "", sell: true },
        ],
        products,
        faq: [
          { id: "f1", q: "ناخن ژل چقدر ماندگار است؟", a: "معمولاً دو تا سه هفته؛ بسته به رشد ناخن و مراقبتی که در خانه دارید." },
          { id: "f2", q: "چه روش‌هایی برای پرداخت دارید؟", a: "پرداخت با کارت در سالن، کارت به کارت و برای رزروهای بزرگ، بیعانه." },
          { id: "f3", q: "اگر ناخنم شکست چه کنم؟", a: "تا یک هفته بعد از کاشت، ترمیم یک ناخن رایگان است؛ کافی است نوبت بگیرید." },
          { id: "f4", q: "کارت هدیه می‌فروشید؟", a: "بله؛ کارت هدیه را می‌توانید در سالن یا از فروشگاه آنلاین بخرید." },
          { id: "f5", q: "چطور نوبت بگیرم؟", a: "از صفحه‌ی «رزرو نوبت» فرم را پر کنید یا با شماره‌ی سالن تماس بگیرید." },
        ],
        posts: [
          { id: "p1", title: "چطور برای رنگ کردن مو در آرایشگاه آماده شویم", image: img("blog1"), date: "2026-10-20", category: "نکته‌ها و ترفندها", author: "تیم لا دیوا", text: "قبل از رنگ کردن مو چند کار ساده نتیجه را خیلی بهتر می‌کند. دو روز قبل مو را نشویید تا چربی طبیعی پوست سر از آن محافظت کند.\nعکس رنگی که دوست دارید همراه بیاورید و درباره‌ی رنگ‌های قبلی مو صادقانه بگویید؛ این کار به آرایشگر کمک می‌کند بهترین فرمول را انتخاب کند.\nبعد از رنگ هم تا ۴۸ ساعت مو را نشویید و از شامپوهای مخصوص موی رنگ‌شده استفاده کنید." },
          { id: "p2", title: "شش دلیل برای مانیکور منظم در سالن", image: img("blog2"), date: "2026-10-02", category: "اخبار", author: "تیم لا دیوا", text: "مانیکور فقط زیبایی نیست؛ مراقبت از سلامت ناخن و پوست دست هم هست. در سالن، کوتیکول‌ها با ابزار استریل مرتب می‌شوند و ناخن فرم درستی پیدا می‌کند.\nماساژ دست گردش خون را بهتر می‌کند و نیم ساعت آرامش، بهترین هدیه به خودتان است." },
          { id: "p3", title: "مزایا و معایب اکستنشن مژه", image: img("g4"), date: "2026-09-14", category: "زیبایی", author: "تیم لا دیوا", text: "اکستنشن مژه صبح‌ها وقت شما را آزاد می‌کند و نگاهتان را بدون ریمل گیرا می‌کند؛ اما نیاز به ترمیم هر سه تا چهار هفته دارد.\nاگر حساسیت چشمی دارید، اول با متخصص ما مشورت کنید." },
        ],
        shippingFee: 50000,
        freeShippingFrom: 3000000,
        coupons: [{ id: "cp1", code: "DIVA10", percent: 10, maxDiscount: 300000, active: true }],
        paymentNote: "پرداخت در محل هنگام تحویل، یا کارت به کارت پس از تماس ما.",
        orderNote: "سفارش شما ثبت شد؛ به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Kafe Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
@font-face { font-family: "Ld Nastaliq"; src: url("/_assets/fonts/golsara-nastaliq.woff") format("woff"); font-display: swap; }
.ld {
  --ld-rose: var(--color-primary);
  --ld-blush: #EFE4E2;
  --ld-cream: #F8F3EE;
  --ld-green: #66705F;
  --ld-ink: #2F2A28;
  --ld-muted: #77706C;
  --ld-line: #E6DCD6;
  --ld-head: "Kafe Markazi", var(--font-heading), serif;
  /* the shared shop pages read these */
  --kf-tan: var(--ld-rose);
  --kf-paper: var(--ld-cream);
  --kf-ink: var(--ld-ink);
  --kf-muted: var(--ld-muted);
  --kf-head: var(--ld-head);
  background: #fff;
  color: var(--ld-ink);
  font-size: 15px;
}
.ld :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; color: inherit; outline-offset: 2px; }
.ld a { color: inherit; text-decoration: none; }
.ld h1, .ld h2, .ld h3, .ld h4, .ld p, .ld figure, .ld blockquote, .ld ul, .ld dl, .ld dd { margin: 0; }
.ld-ico { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ld-wrap, .kf-wrap { box-sizing: border-box; width: 100%; max-width: 1240px; margin-inline: auto; padding-inline: 24px; }
.ld-sec { padding-block: 110px; }
.ld-inner { padding-block: 70px 110px; }
.ld-blush { background: var(--ld-blush); }
.ld-rose { background: var(--ld-rose); color: #fff; }
.ld-muted { color: var(--ld-muted); }
.ld-center { display: flex; justify-content: center; margin-top: 50px; }
.ld-pic { display: block; overflow: hidden; }
.ld-pic img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, .8, .2, 1); }
.ld-add { display: grid; place-items: center; border: 1px dashed currentColor; color: var(--ld-muted); font-size: 28px; cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Type: thin serif titles, a flowing script for the accent words, small spaced kickers */
.ld-title { font-family: var(--ld-head); font-size: clamp(34px, 4.2cqi, 58px); font-weight: 400; line-height: 1.2; }
.ld-script { color: var(--ld-rose); font-family: "Ld Nastaliq", var(--ld-head); font-style: normal; font-weight: 400; font-size: .92em; line-height: 1; }
.ld-rose .ld-script, .ld-hero .ld-script, .ld-foot-book .ld-script { color: inherit; }
.ld-kicker { display: block; color: var(--ld-muted); font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.ld-body { color: var(--ld-muted); font-size: 15px; line-height: 2.1; }
.ld-body p + p { margin-top: 14px; }
.ld-lead { margin-top: 12px; color: var(--ld-muted); }
.ld-center-head { display: grid; justify-items: center; gap: 12px; margin-bottom: 56px; text-align: center; }
.ld-center-head p { color: var(--ld-muted); }
.ld-center-head.light p { color: rgb(255 255 255 / .85); }
.ld-head-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; margin-bottom: 50px; }
.ld-head-row .ld-title { margin-top: 10px; max-width: 14em; }

/* Buttons: thin outline with small spaced letters, or a rose fill */
.ld-btn, .kf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 30px; border: 1px solid var(--ld-rose); background: var(--ld-rose); color: #fff !important; font: inherit; font-size: 12px; font-weight: 600; letter-spacing: .04em; cursor: pointer; transition: background .3s, color .3s, border-color .3s; }
.ld-btn:hover, .kf-btn:hover { background: transparent; color: var(--ld-rose) !important; }
.ld-btn.line { border-color: var(--ld-ink); background: transparent; color: var(--ld-ink) !important; }
.ld-btn.line:hover { border-color: var(--ld-rose); background: var(--ld-rose); color: #fff !important; }
.ld-btn.light { height: 42px; border-color: #fff; background: #fff; color: var(--ld-ink) !important; }
.ld .ld-round { display: grid; place-items: center; width: 130px; height: 130px; border-radius: 50%; background: var(--ld-cream); color: var(--ld-ink); font-size: 12px; font-weight: 600; line-height: 1.8; text-align: center; transition: transform .5s cubic-bezier(.2, .8, .2, 1.3), background .3s; }
.ld .ld-round:hover { transform: scale(1.06); background: #fff; }
.ld .ld-round.small { flex: none; width: 112px; height: 112px; border: 1px solid var(--ld-ink); background: transparent; }

/* Header: a blush strip with address, hours, phone; then menu, the name in the middle, bag and booking */
.ld-head { position: relative; z-index: 30; }
.ld-top { background: var(--ld-blush); font-size: 12px; }
.ld-top-in { display: flex; align-items: center; gap: 26px; min-height: 42px; }
.ld-top-in > span { display: inline-flex; align-items: center; gap: 6px; }
.ld-top .ld-ico { width: 15px; height: 15px; }
.ld-top-end { margin-inline-start: auto; display: flex; align-items: center; gap: 16px !important; }
.ld-top-end a { display: inline-flex; align-items: center; gap: 6px; }
.ld-top-socials { gap: 2px !important; }
.ld-top-socials a { width: 28px !important; height: 28px !important; background: none !important; color: var(--ld-ink) !important; }
.ld-top-socials .p-ico { width: 14px; height: 14px; }
.ld-bar { background: #fff; border-bottom: 1px solid var(--ld-line); }
.ld-home .ld-bar { position: absolute; inset-inline: 0; background: transparent; border-color: rgb(255 255 255 / .25); color: #fff; }
.ld-bar-in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; min-height: 92px; }
.ld-nav { display: flex; gap: 30px; font-size: 14px; }
.ld-nav a { position: relative; padding: 6px 0; }
.ld-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: currentColor; transform: scaleX(0); transition: transform .3s; }
.ld-nav a:hover::after, .ld-nav a[aria-current="page"]::after { transform: scaleX(1); }
.ld-logo { display: grid; justify-items: center; line-height: 1; }
.ld-logo img { display: block; height: 52px; width: auto; }
.ld-logo { gap: 6px; }
.ld-logo b { display: block; height: 46px; overflow: visible; font-family: "Ld Nastaliq", var(--ld-head); font-size: 34px; font-weight: 400; line-height: 1.35; }
.ld-logo small { position: relative; padding-top: 6px; border-top: 1px solid currentColor; font-size: 10px; letter-spacing: .25em; line-height: 1; opacity: .85; }
.ld-tools { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.ld-book { height: 42px; margin-inline-start: 10px; padding: 0 22px; }
.ld-home .ld-book { border-color: #fff; color: #fff !important; }
.ld-home .ld-book:hover { background: #fff; color: var(--ld-ink) !important; }
.ld-burger { display: none; }

/* Hero: two photos side by side, the title over both, a round badge */
.ld-hero { position: relative; display: grid; grid-template-columns: 1fr 1fr; min-height: clamp(560px, 56cqi, 860px); color: #fff; isolation: isolate; }
.ld-hero-pic { display: block; overflow: hidden; }
.ld-hero-pic img { display: block; width: 100%; height: 100%; object-fit: cover; animation: ld-zoom 1.8s cubic-bezier(.2, .8, .2, 1) both; }
.ld-hero::after { content: ""; position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse at center, rgb(0 0 0 / .32), rgb(0 0 0 / .1) 70%), linear-gradient(rgb(0 0 0 / .3), transparent 30%); pointer-events: none; }
@keyframes ld-zoom { from { transform: scale(1.08); } }
.ld-hero-text { position: absolute; inset: 0; z-index: 1; display: grid; place-content: center; justify-items: center; gap: 20px; padding: 120px 24px 40px; text-align: center; }
.ld-hero h1 { white-space: pre-line; font-family: var(--ld-head); font-size: clamp(54px, 8.6cqi, 124px); font-weight: 400; line-height: 1.02; text-shadow: 0 2px 30px rgb(0 0 0 / .2); animation: ld-up 1.1s .2s cubic-bezier(.2, .8, .2, 1) both; }
.ld-hero p { max-width: 460px; margin-top: 6px; font-size: 16px; line-height: 2; text-shadow: 0 1px 12px rgb(0 0 0 / .45); animation: ld-up 1.1s .35s cubic-bezier(.2, .8, .2, 1) both; }
.ld-hero .ld-round { margin-top: 10px; animation: ld-up 1.1s .5s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes ld-up { from { opacity: 0; transform: translateY(26px); } }

/* Quick booking strip under the hero */
.ld-quick { position: relative; z-index: 2; margin-top: -60px; }
.ld-quick .ld-wrap { max-width: 1100px; }
.ld-form-row { grid-template-columns: 1fr 1fr 1fr 220px !important; align-items: end; gap: 30px !important; padding: 36px 40px; background: var(--ld-cream); box-shadow: 0 30px 60px -40px rgb(0 0 0 / .45); }
.ld-form-row > .ld-btn { border-color: var(--ld-ink); background: transparent; color: var(--ld-ink) !important; }
.ld-form-row > .ld-btn:hover { background: var(--ld-ink); color: #fff !important; }
.ld-form-row .ld-field:has(textarea) { display: none; }
.ld-form-row .ld-full { grid-column: auto; }
.ld-form-row > .ld-btn { justify-self: stretch; }

/* Forms: labelled fields on a single line */
.ld-form { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.ld-field { display: grid; gap: 6px; font-size: 13px; color: var(--ld-muted); }
.ld-field input, .ld-field select, .ld-field textarea { width: 100%; padding: 8px 0; border-bottom: 1px solid #CFC3BC; color: var(--ld-ink); font: inherit; font-size: 15px; transition: border-color .3s; }
.ld-field input:focus, .ld-field select:focus, .ld-field textarea:focus { outline: none; border-color: var(--ld-rose); }
.ld-field textarea { resize: vertical; }
.ld-full { grid-column: 1 / -1; }
.ld-form > .ld-btn { justify-self: start; }
.ld-form-light .ld-field { color: rgb(255 255 255 / .85); }
.ld-form-light .ld-field input, .ld-form-light .ld-field select, .ld-form-light .ld-field textarea { border-color: rgb(255 255 255 / .55); color: #fff; }
.ld-form-light select option { color: var(--ld-ink); }
.ld-form-light .ld-btn { border-color: #fff; background: #fff; color: var(--ld-ink) !important; }
.ld-form-light .ld-btn:hover { background: transparent; color: #fff !important; }

/* Intro sentence */
.ld-intro p { max-width: 920px; margin-inline: auto; font-family: var(--ld-head); font-size: clamp(26px, 3.2cqi, 42px); line-height: 1.5; text-align: center; }

/* The salon's story: tilted photos beside the text */
.ld-space { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.ld-tilt { position: relative; padding-bottom: 18%; }
.ld-tilt-a { width: 78%; aspect-ratio: 4 / 5; transform: rotate(-4deg); box-shadow: 0 30px 50px -30px rgb(0 0 0 / .4); }
.ld-tilt-b { position: absolute; inset-inline-end: 0; bottom: 0; width: 46%; aspect-ratio: 5 / 4; border: 8px solid #fff; transform: rotate(5deg); box-shadow: 0 30px 50px -26px rgb(0 0 0 / .45); }
.ld-space-text { display: grid; justify-items: start; gap: 22px; }

/* Services: picture cards with the lowest price, the name and a button */
.ld-services { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
.ld .ld-service { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; color: #fff; }
.ld-service-pic { position: absolute; inset: 0; }
.ld-service-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, .8, .2, 1); }
.ld .ld-service::after { content: ""; position: absolute; inset: 0; background: linear-gradient(transparent 30%, rgb(0 0 0 / .75)); }
.ld-service:hover .ld-service-pic img { transform: scale(1.07); }
.ld-from { position: absolute; top: 18px; inset-inline-start: 18px; z-index: 1; padding: 4px 12px; border-radius: 20px; background: var(--ld-green); font-size: 11px; font-weight: 700; }
.ld-service-text { position: absolute; inset-inline: 24px; bottom: 24px; z-index: 1; display: grid; justify-items: start; gap: 10px; }
.ld-service-text b { font-family: var(--ld-head); font-size: 36px; font-weight: 400; line-height: 1.2; }
.ld-service-text small { font-size: 14px; line-height: 1.8; opacity: .9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ld-service-text .ld-btn { height: 44px; padding: 0 24px; border-color: #fff; background: transparent; color: #fff !important; }
.ld-service:hover .ld-btn { background: #fff; color: var(--ld-ink) !important; }

/* Photo beside text (numbers, about) */
.ld-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 640px; }
.ld-split-pic { min-height: 420px; }
.ld-split-text { display: grid; align-content: center; justify-items: start; gap: 26px; padding: 80px clamp(24px, 6cqi, 90px); background: var(--ld-blush); }
.ld-split-text .ld-title { max-width: 12em; }
.ld-stats { display: grid; gap: 30px; margin-top: 10px; }
.ld-stat { display: grid; grid-template-columns: 150px 1fr; gap: 20px; align-items: start; }
.ld-stat b { font-family: var(--ld-head); font-size: 44px; font-weight: 400; line-height: 1; }
.ld-stat h3 { font-size: 16px; font-weight: 600; }
.ld-stat p { margin-top: 8px; color: var(--ld-muted); font-size: 14px; line-height: 1.9; }

/* Price guide: a picture and a list per service */
.ld-prices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px; }
.ld-price-card { display: grid; grid-template-columns: 1fr 2fr; min-height: 380px; }
.ld-price-pic { height: 100%; }
.ld-price-list { display: grid; align-content: center; gap: 24px; padding: 36px 34px; background: var(--ld-cream); }
.ld-price-card.green .ld-price-list { background: var(--ld-green); color: #fff; }
.ld-price-list h3 { font-family: var(--ld-head); font-size: 38px; font-weight: 400; }
.ld-rows { display: grid; padding: 0; list-style: none; }
.ld-rows li { display: flex; align-items: baseline; gap: 10px; padding-block: 12px; border-bottom: 1px solid rgb(0 0 0 / .08); font-size: 14px; }
.ld-price-card.green .ld-rows li { border-color: rgb(255 255 255 / .18); }
.ld-rows i { flex: 1; }
.ld-rows b { font-weight: 600; white-space: nowrap; }

/* Reviews on rose */
.ld-quote { display: grid; justify-items: center; align-content: start; gap: 18px; padding: 10px 34px; text-align: center; }
.ld-stars { color: #fff; font-size: 16px; letter-spacing: 3px; }
.ld-quote blockquote { margin: 0; font-size: 15px; line-height: 2; }
.ld-face { display: block; width: 66px; height: 66px; border: 2px solid #fff; border-radius: 50%; overflow: hidden; }
.ld-face img { width: 100%; height: 100%; object-fit: cover; }
.ld-quote figcaption { font-size: 12px; font-weight: 700; letter-spacing: .06em; }

/* Gallery: tall photos in a row */
.ld-gallery { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; padding-inline: 14px; }
.ld-gal { position: relative; display: block; aspect-ratio: 5 / 7; overflow: hidden; cursor: zoom-in; }
.ld-gal img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(.2, .8, .2, 1); }
.ld-gal:hover img { transform: scale(1.06); }
.ld-gal span { position: absolute; inset-inline: 16px; bottom: 14px; color: #fff; font-size: 13px; text-shadow: 0 1px 10px rgb(0 0 0 / .5); }

/* Questions */
.ld-faq { display: grid; max-width: 820px; margin-inline: auto; }
.ld-faq details { border-bottom: 1px solid var(--ld-line); }
.ld-faq summary { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 0; font-size: 17px; list-style: none; cursor: pointer; }
.ld-faq summary::-webkit-details-marker { display: none; }
.ld-faq summary i { display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--ld-green); color: #fff; transition: transform .3s; }
.ld-faq summary .ld-ico { width: 14px; height: 14px; stroke-width: 2; }
.ld-faq details[open] summary i { transform: rotate(180deg); background: var(--ld-rose); }
.ld-faq details p { padding-bottom: 20px; color: var(--ld-muted); line-height: 2; }
.ld-faq-more { display: grid; justify-items: center; gap: 16px; color: var(--ld-muted); }

/* Two banners */
.ld-banners { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; padding-bottom: 110px; }
.ld .ld-banner { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; color: #fff; }
.ld-banner-pic { position: absolute; inset: 0; }
.ld-banner-pic img { transition: transform 1.2s cubic-bezier(.2, .8, .2, 1); }
.ld-banner:hover .ld-banner-pic img { transform: scale(1.06); }
.ld .ld-banner::after { content: ""; position: absolute; inset: 0; background: rgb(30 20 20 / .42); }
.ld-banner-text { position: absolute; inset: 0; z-index: 1; display: grid; place-content: center; justify-items: center; gap: 20px; }
.ld-banner-text b { font-family: var(--ld-head); font-size: clamp(34px, 4.2cqi, 58px); font-weight: 400; text-shadow: 0 2px 20px rgb(0 0 0 / .35); }

/* Blog cards */
.ld-posts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; }
.ld-post { display: grid; justify-items: center; align-content: start; gap: 14px; text-align: center; }
.ld-post-pic { display: block; width: 100%; aspect-ratio: 4 / 5; overflow: hidden; }
.ld-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(.2, .8, .2, 1); }
.ld-post:hover .ld-post-pic img, .ld-blog-item:hover .ld-post-pic img { transform: scale(1.05); }
.ld-post .ld-kicker { margin-top: 8px; }
.ld-post h3 { font-family: var(--ld-head); font-size: 24px; font-weight: 400; line-height: 1.5; }

/* Inner page top: blush panel and a photo */
.ld-top-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 460px; background: var(--ld-blush); }
.ld-top-pic { display: block; overflow: hidden; order: 2; }
.ld-top-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ld-top-text { display: grid; align-content: center; justify-items: start; gap: 20px; padding: 70px clamp(24px, 7cqi, 110px); }
.ld-top-text p { max-width: 460px; color: var(--ld-muted); line-height: 2; }

/* Service page: list and consultation on the side */
.ld-service-page { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 60px; align-items: start; }
.ld-side { display: grid; gap: 26px; position: sticky; top: 24px; }
.ld-side-list { display: grid; padding: 26px; background: var(--ld-green); color: #fff; }
.ld-side-list h3 { margin-bottom: 14px; font-family: var(--ld-head); font-size: 26px; font-weight: 400; text-align: center; }
.ld-side-list a { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgb(255 255 255 / .2); font-size: 14px; }
.ld-side-list a[aria-current="page"], .ld-side-list a:hover { color: #F4D9DF; }
.ld-side-list .ld-ico { width: 15px; height: 15px; }
.ld-side-book { display: grid; gap: 18px; padding: 26px; border: 1px solid var(--ld-line); }
.ld-side-book h3 { font-family: var(--ld-head); font-size: 22px; font-weight: 400; text-align: center; }
.ld-side-book .ld-form { grid-template-columns: 1fr; }
.ld-side-book .ld-btn { justify-self: stretch; }
.ld-service-main { display: grid; gap: 26px; }
.ld-service-cover { aspect-ratio: 16 / 10; }
.ld-sub { margin-top: 16px; font-family: var(--ld-head); font-size: 32px; font-weight: 400; }

/* About: a second split and the booking card */
.ld-about-more .ld-split-text { background: var(--ld-cream); }
.ld-book-card { display: grid; justify-items: center; gap: 14px; max-width: 860px; margin-inline: auto; padding: 60px clamp(24px, 6cqi, 80px); border: 1px solid var(--ld-line); text-align: center; }
.ld-book-card .ld-title { font-size: clamp(28px, 3cqi, 40px); }
.ld-book-card > p { color: var(--ld-muted); }
.ld-form-wide { width: 100%; margin-top: 16px; text-align: start; }

/* Booking page */
.ld-appt { display: grid; grid-template-columns: 1.2fr 1fr; background: var(--ld-cream); }
.ld-appt-form { display: grid; align-content: center; gap: 16px; padding: 60px clamp(24px, 6cqi, 80px); }
.ld-appt-form > p { color: var(--ld-muted); }
.ld-appt-hours { font-size: 13px; }
.ld-appt-pic { display: block; min-height: 560px; overflow: hidden; }
.ld-appt-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* Contact */
.ld-contact { display: grid; grid-template-columns: 1fr 1.3fr; gap: 60px; align-items: start; }
.ld-contact > div:first-child { display: grid; gap: 22px; }
.ld-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.ld-info dt { margin-bottom: 4px; color: var(--ld-muted); font-size: 11px; letter-spacing: .06em; }
.ld-info dd { font-size: 14px; line-height: 1.9; white-space: pre-line; }
.ld-map { display: grid; place-items: center; min-height: 380px; background: var(--ld-cream); color: var(--ld-muted); font-size: 13px; }
.ld-map iframe { width: 100%; height: 100%; min-height: 380px; border: 0; }
.ld-places-block { padding-top: 0; }
.ld-places { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px; }
.ld-place { display: grid; gap: 12px; }
.ld-place-pic { aspect-ratio: 16 / 10; }
.ld-place h3 { margin-top: 8px; font-family: var(--ld-head); font-size: 28px; font-weight: 400; }
.ld-place p { color: var(--ld-muted); font-size: 14px; line-height: 1.9; }
.ld-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
.ld-ask { display: grid; grid-template-columns: 1fr 1.2fr; gap: 70px; align-items: center; padding-top: 0; }
.ld-ask > div { display: grid; gap: 18px; }
.ld-ask-pic { aspect-ratio: 4 / 5; }

/* Blog pages */
.ld-blog { display: grid; gap: 60px; max-width: 1000px; margin-inline: auto; }
.ld-blog-item { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; align-items: center; }
.ld-blog-item > div { display: grid; justify-items: start; gap: 16px; }
.ld-blog-item h2 { font-family: var(--ld-head); font-size: 32px; font-weight: 400; line-height: 1.4; }
.ld-blog-item p { color: var(--ld-muted); line-height: 2; }
.ld-meta { color: var(--ld-muted); font-size: 12px; }
.ld-article { display: grid; justify-items: start; gap: 30px; max-width: 860px; }
.ld-article header { display: grid; gap: 12px; }
.ld-article-pic { display: block; width: 100%; max-height: 560px; object-fit: cover; }

/* Footer: Instagram strip; links and contacts on cream; booking on rose */
.ld-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; padding: 8px; }
.ld-strip-pic { display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.ld-strip-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s; }
.ld-strip-pic:hover img { transform: scale(1.08); }
.ld-foot-in { display: grid; grid-template-columns: minmax(0, 2.3fr) minmax(0, 1fr); }
.ld-foot-main { display: grid; align-content: space-between; gap: 50px; padding: 70px clamp(24px, 5cqi, 80px) 40px; background: var(--ld-cream); }
.ld-foot-cols { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 40px; }
.ld-foot-cols .ld-logo { justify-items: start; }
.ld-foot-cols .ld-kicker { margin-bottom: 18px; }
.ld-foot-links { display: grid; gap: 12px; font-size: 15px; }
.ld-foot-links a:hover, .ld-foot-contact a:hover { color: var(--ld-rose); }
.ld-foot-contact { display: grid; align-content: start; gap: 12px; font-size: 15px; line-height: 1.9; }
.ld-foot-contact p { white-space: pre-line; }
.ld-foot-phone { display: inline-flex; align-items: center; gap: 8px; font-size: 18px; }
.ld-news { display: grid; gap: 16px; }
.ld-news h3 { font-family: var(--ld-head); font-size: 28px; font-weight: 400; }
.ld-news form { display: flex; gap: 16px; max-width: 520px; }
.ld-news input { flex: 1; padding: 8px 0; border-bottom: 1px solid #CFC3BC; font: inherit; }
.ld-news .ld-btn { height: 42px; padding: 0 22px; }
.ld-foot-end { display: flex; justify-content: space-between; align-items: center; gap: 20px; color: var(--ld-muted); font-size: 12px; }
.ld-foot-socials a { background: none !important; color: var(--ld-ink) !important; }
.ld-foot-book { display: grid; align-content: start; gap: 30px; padding: 70px clamp(24px, 3.4cqi, 50px); background: var(--ld-rose); color: #fff; }
.ld-foot-book h3 { font-family: var(--ld-head); font-size: clamp(34px, 3.4cqi, 46px); font-weight: 400; line-height: 1.2; }
.ld-foot-book .ld-form { grid-template-columns: 1fr; }

/* The shared shop pages in this template's look */
.kf-look .kf-card-name, .kf-look .kf-shead h1, .kf-look .kf-pinfo h1 { font-weight: 400; }
.kf-look .kf-card-pic { background: #fff; border: 1px solid var(--ld-line); }
.kf-look .kf-card-pic img { width: 70%; height: 86%; }
.kf-look .kf-gal-p { background: #fff; border: 1px solid var(--ld-line); }
.kf-look .kf-tag { border-radius: 20px; background: var(--ld-green); font-size: 11px; }
.kf-look .kf-tag.dark { background: var(--ld-rose); }
.kf-look .sk-stars svg.on, .kf-look .sk-stars svg.half { fill: var(--ld-rose); color: var(--ld-rose); }
.ld-stars { color: var(--ld-rose); }
.ld-rose .ld-stars { color: #fff; }

/* Slider (radios, no scripts) */
.ld-sl { position: relative; }
.ld-sl-radio { position: absolute; opacity: 0; pointer-events: none; }
.ld-sl-view { overflow: hidden; }
.ld-sl-track { --s: 0; --gap: 26px; display: flex; gap: var(--gap); transform: translateX(calc(var(--s) * (100% + var(--gap)) / var(--show))); transition: transform .7s cubic-bezier(.2, .8, .2, 1); }
.ld-sl-cell { flex: 0 0 calc((100% - (var(--show) - 1) * var(--gap)) / var(--show)); min-width: 0; }
.ld-sl-nav label { display: none; }
.ld-sl-arrow { position: absolute; top: 50%; z-index: 3; place-items: center; width: 50px; height: 50px; margin-top: -25px; border-radius: 50%; background: var(--ld-rose); color: #fff; cursor: pointer; box-shadow: 0 10px 24px -10px rgb(0 0 0 / .4); transition: transform .3s; }
.ld-sl-arrow:hover { transform: scale(1.08); }
.ld-sl-prev { inset-inline-start: -22px; }
.ld-sl-next { inset-inline-end: -22px; }
.ld-sl-prev .ld-ico { transform: scaleX(-1); }
.ld-sl-dots { display: flex; justify-content: center; gap: 10px; margin-top: 40px; }
.ld-sl-dots label { width: 9px; height: 9px; border: 1px solid currentColor; border-radius: 50%; cursor: pointer; }
.ld-quotes .ld-sl-cell + .ld-sl-cell .ld-quote { border-inline-start: 1px solid rgb(255 255 255 / .3); }
.ld-quotes .ld-sl-arrow { display: none !important; }
.ld-gal-slider { padding-inline: 14px; }
.ld-gal-slider .ld-sl-track { --gap: 14px; }
.ld-gal-slider .ld-sl-prev { inset-inline-start: 30px; }
.ld-gal-slider .ld-sl-next { inset-inline-end: 30px; }

/* Header: the services list under "services" */
.ld-drop { position: relative; }
.ld-drop > a { display: inline-flex; align-items: center; gap: 4px; }
.ld-drop-ico { width: 14px; height: 14px; }
.ld-drop-list { position: absolute; top: 100%; inset-inline-start: -20px; z-index: 40; display: grid; min-width: 220px; padding: 14px 0; background: #fff; color: var(--ld-ink); box-shadow: 0 24px 50px -24px rgb(0 0 0 / .35); opacity: 0; visibility: hidden; transform: translateY(10px); transition: opacity .25s, transform .25s, visibility .25s; }
.ld-drop:hover .ld-drop-list, .ld-drop:focus-within .ld-drop-list { opacity: 1; visibility: visible; transform: none; }
.ld-nav .ld-drop-list a { padding: 9px 24px; font-size: 14px; }
.ld-nav .ld-drop-list a::after { display: none; }
.ld-nav .ld-drop-list a:hover, .ld-nav .ld-drop-list a[aria-current="page"] { color: var(--ld-rose); }

/* Packages: a green panel beside a photo */
.ld-packages { display: grid; grid-template-columns: 1fr 1fr; padding-block: 110px 0; }
.ld-pack-text { display: grid; align-content: center; justify-items: start; gap: 24px; padding: 70px clamp(24px, 5cqi, 80px); background: var(--ld-green); color: #fff; }
.ld-pack-text p { line-height: 2; opacity: .92; }
.ld-pack-pic { min-height: 520px; }

/* Video band */
.ld-video { position: relative; display: grid; place-items: center; margin-top: 110px; }
.ld-video-pic { width: 100%; height: clamp(320px, 38cqi, 560px); }
.ld .ld-play { position: absolute; display: grid; place-items: center; width: 96px; height: 96px; border: 1px solid #fff; border-radius: 50%; background: rgb(255 255 255 / .18); color: #fff; backdrop-filter: blur(4px); transition: transform .4s, background .3s; }
.ld .ld-play:hover { transform: scale(1.08); background: rgb(255 255 255 / .3); }
.ld-play .ld-ico { width: 30px; height: 30px; fill: currentColor; stroke: none; }
.ld-video + .ld-rose { margin-top: 0; }

/* "Quality products" with three line icons */
.ld-quality { margin-top: 0; }
.ld-quality .ld-split-text { background: var(--ld-blush); }
.ld-marks { display: flex; flex-wrap: wrap; gap: 40px; margin-top: 10px; padding: 0; list-style: none; }
.ld-marks li { display: grid; justify-items: center; gap: 10px; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.ld-marks svg { width: 44px; height: 44px; fill: none; stroke: var(--ld-ink); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }

/* Big rating line */
.ld-rating { display: grid; justify-items: center; gap: 24px; text-align: center; }
.ld-rating .ld-stars { color: var(--ld-ink); font-size: 22px; }
.ld-rating blockquote { max-width: 16em; margin: 0; font-family: var(--ld-head); font-size: clamp(30px, 4cqi, 52px); line-height: 1.4; }
.ld-rating p { color: var(--ld-muted); }

/* Press logos */
.ld-logos-block { display: grid; justify-items: center; gap: 30px; padding-bottom: 110px; }
.ld-logos { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 40px 50px; align-items: center; width: 100%; }
.ld-logo-item { display: grid; place-items: center; }
.ld-logo-item img { max-width: 100%; max-height: 56px; opacity: .85; transition: opacity .3s; }
.ld-logo-item:hover img { opacity: 1; }

/* Gentle reveal while scrolling, where supported */
@supports (animation-timeline: view()) {
  .ld-rise { animation: ld-up linear both; animation-timeline: view(); animation-range: entry 0% cover 22%; }
}
@media (prefers-reduced-motion: reduce) {
  .ld *, .ld *::before, .ld *::after { animation: none !important; transition: none !important; }
}

@container (max-width: 1100px) {
  .ld-nav { gap: 18px; font-size: 13px; }
  .ld-top-in > span:nth-child(2) { display: none; }
  .ld-services { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ld-prices { grid-template-columns: 1fr; }
  .ld-gallery { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ld-gallery > :nth-child(n + 4) { display: none; }
  .ld-foot-in { grid-template-columns: 1fr; }
  .ld-service-page { grid-template-columns: 1fr; }
  .ld-side { position: static; order: 2; }
}
@container (max-width: 820px) {
  .ld { font-size: 14px; }
  .ld-wrap, .kf-wrap { padding-inline: 18px; }
  .ld-sec { padding-block: 70px; }
  .ld-top { display: none; }
  .ld-bar-in { min-height: 70px; grid-template-columns: auto 1fr auto; }
  .ld-nav, .ld-book { display: none; }
  .ld-logo { justify-self: center; }
  .ld-logo b { height: 40px; font-size: 30px; }
  .ld-burger { display: block; }
  .ld-burger summary { display: grid; place-items: center; width: 40px; height: 40px; list-style: none; cursor: pointer; }
  .ld-burger summary::-webkit-details-marker { display: none; }
  .ld-burger summary span, .ld-burger summary span::before, .ld-burger summary span::after { position: relative; display: block; width: 24px; height: 1.5px; background: currentColor; transition: transform .3s, background .3s; }
  .ld-burger summary span::before, .ld-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .ld-burger summary span::before { top: -7px; }
  .ld-burger summary span::after { top: 7px; }
  .ld-burger[open] summary span { background: transparent; }
  .ld-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .ld-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .ld-bar-in { position: relative; }
  .ld-drawer { position: absolute; inset-inline: 0; top: 100%; z-index: 2; display: grid; padding: 8px 18px 20px; background: #fff; color: var(--ld-ink); border-bottom: 1px solid var(--ld-line); }
  .ld-drawer a { padding: 14px 4px; border-top: 1px solid var(--ld-line); }
  .ld-drawer a[aria-current="page"] { color: var(--ld-rose); }
  .ld-hero { grid-template-columns: 1fr; min-height: 640px; }
  .ld-hero-pic + .ld-hero-pic { display: none; }
  .ld-hero-text { padding-top: 90px; }
  .ld-form-row { grid-template-columns: 1fr !important; }
  .ld-form-row .ld-btn { justify-self: stretch; }
  .ld .ld-round { width: 116px; height: 116px; }
  .ld-form { grid-template-columns: 1fr; }
  .ld-space, .ld-split, .ld-top-split, .ld-contact, .ld-ask, .ld-appt, .ld-blog-item { grid-template-columns: 1fr; gap: 40px; }
  .ld-split { min-height: 0; }
  .ld-split-text, .ld-top-text { padding: 56px 18px; }
  .ld-top-pic { order: 0; aspect-ratio: 4 / 3; }
  .ld-head-row { align-items: center; }
  .ld-head-row .ld-round { display: none; }
  .ld-services { grid-template-columns: 1fr; }
  .ld-price-card { grid-template-columns: 1fr; }
  .ld-price-pic { aspect-ratio: 16 / 10; }
  .ld-price-list { padding: 28px 20px; }
  .ld-stat { grid-template-columns: 1fr; gap: 10px; }
  .ld-sl { --show: 1 !important; }
  .ld-sl-prev { inset-inline-start: 6px; }
  .ld-sl-next { inset-inline-end: 6px; }
  .ld-quotes .ld-sl-cell + .ld-sl-cell .ld-quote { border: 0; }
  .ld-gal-slider .ld-sl-cell { flex-basis: 78%; }
  .ld-quick { margin-top: 0; }
  .ld-quick .ld-wrap { padding: 0; }
  .ld-form-row { padding: 30px 18px; box-shadow: none; }
  .ld-packages { grid-template-columns: 1fr; padding-top: 70px; }
  .ld-pack-pic { min-height: 340px; }
  .ld-video { margin-top: 70px; }
  .ld-play { width: 72px; height: 72px; }
  .ld-logos { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
  .ld-logos-block { padding-bottom: 70px; }
  .ld-marks { gap: 26px; }
  .ld-drop-list { display: none; }
  .ld-drawer .ld-drop { display: grid; }
  .ld-drawer .ld-drop-list { position: static; display: grid; min-width: 0; padding: 0 0 8px; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
  .ld-drawer .ld-drop-list a { padding: 9px 20px; border: 0; color: var(--ld-muted); font-size: 13px; }
  .ld-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ld-gallery > :nth-child(n + 4) { display: block; }
  .ld-gallery > :nth-child(n + 5) { display: none; }
  .ld-banners, .ld-posts, .ld-places { grid-template-columns: 1fr; }
  .ld-banners { padding-bottom: 70px; }
  .ld-info { grid-template-columns: 1fr; }
  .ld-appt-pic { min-height: 320px; }
  .ld-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ld-foot-cols { grid-template-columns: 1fr; text-align: center; }
  .ld-foot-cols .ld-logo { justify-items: center; }
  .ld-foot-links { justify-items: center; }
  .ld-foot-contact { justify-items: center; }
  .ld-news { justify-items: center; text-align: center; }
  .ld-news form { flex-direction: column; width: 100%; }
  .ld-foot-end { flex-direction: column; }
}
`;
