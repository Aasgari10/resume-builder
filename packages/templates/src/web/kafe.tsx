/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Kafe": a cafe site rebuilt from the Corretto reference, in Persian. Dark hero slider with a round
// badge, the cafe's offer, three stories, a badge band, numbers, favourites from the menu, a photo
// gallery, partner logos, a call to contact and a dark footer; pages: menu (the page the printed QR
// code opens), about us, what we offer, contact. No cart, orders or accounts: the menu is for reading.
// Published pages run without scripts: the slider and quotes use radios, the phone menu <details>.

import type { CSSProperties, ReactNode } from "react";
import { formatToman, unitPrice, type Product, type ResumeData, type Shop } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { onSale } from "./shopkit";
import { mapEmbed } from "./golsara";

export const KAFE_BLOCKS = [
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "offer", label: "پیشنهادهای ما (آیکون‌ها)" },
  { key: "stories", label: "سه کارت با عکس" },
  { key: "badge", label: "نوار عکس با نشان" },
  { key: "stats", label: "اعداد" },
  { key: "favorites", label: "دانه‌های قهوه (محصولات یک دسته)" },
  { key: "gallery", label: "گالری عکس" },
  { key: "logos", label: "آرم همکاران" },
  { key: "cta", label: "نوار دعوت به تماس" },
  { key: "newsletter", label: "خبرنامه‌ی پایین صفحه" },
] as const;

export const KAFE_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/offer", label: "صفحه‌ی آنچه ارائه می‌دهیم" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

export function kafePages(data: ResumeData): string[] {
  return ["/", "/menu", ...KAFE_OPTIONAL_PAGES.map((p) => p.path).filter((p) => pageOn(data, p)), "/contact"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string };

export function KafeSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = kafePages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page };
  const body: ReactNode =
    page === "/menu" ? <Menu {...view} /> : page === "/about" ? <About {...view} /> : page === "/offer" ? <Offer {...view} /> : page === "/contact" ? <Contact {...view} /> : <Home {...view} />;
  return (
    <WebPage ctx={ctx} className={`kf${page === "/" ? " kf-home" : ""}`} css={partsCss + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

/** The line – two beans – line ornament under every heading of the reference. */
const Beans = () => (
  <span className="kf-beans" aria-hidden="true">
    <svg viewBox="0 0 24 18">
      <path d="M7.5 2.2c2.6.8 3.9 3.8 2.8 6.6S6.2 13 3.6 12.2.8 8.4 1.9 5.6 4.9 1.4 7.5 2.2z M3.8 11.4c1.6-2.6 1.6-5.6 2.9-8.4" />
      <path d="M16.8 5.2c2.6.8 3.9 3.8 2.8 6.6s-4.1 4.2-6.7 3.4-3.9-3.8-2.8-6.6 4.1-4.2 6.7-3.4z M13.1 14.4c1.6-2.6 1.6-5.6 2.9-8.4" />
    </svg>
  </span>
);

function Title({ view, title, text, titlePath, textPath, light }: { view: View; title?: string; text?: string; titlePath?: string; textPath?: string; light?: boolean }) {
  return (
    <div className={`kf-title${light ? " kf-on-dark" : ""}`}>
      <Opt value={title} editing={view.editing} edit={ed(titlePath ?? "", "text", "تیتر")}>
        <h2 {...(titlePath ? ed(titlePath, "text", "تیتر") : {})}>{title}</h2>
      </Opt>
      <Beans />
      <Opt value={text} editing={view.editing} edit={ed(textPath ?? "", "multiline", "متن زیر تیتر")}>
        <p {...(textPath ? ed(textPath, "multiline", "متن زیر تیتر") : {})}>{text}</p>
      </Opt>
    </div>
  );
}

/** A picture the owner can change by clicking it in the editor. */
function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`kf-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="kf-price">
      {onSale(p) && <s>{money(view, p.price)}</s>}
      <b>{money(view, now)}</b>
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

/* ───────────── Header and footer ───────────── */

function menuItems(view: View) {
  const data = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    { to: "/menu", label: "منو" },
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    ...(pageOn(data, "/offer") ? [{ to: "/offer", label: "آنچه ارائه می‌دهیم" }] : []),
    { to: "/contact", label: "تماس با ما" },
  ];
}

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className="kf-logo">
      {logo ? <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} /> : <b {...ed("basics.fullName", "text", "نام کافه")}>{b.fullName}</b>}
    </PageLink>
  );
}

function Header(view: View) {
  const items = menuItems(view);
  const nav = (
    <>
      {items.map((m) => (
        <PageLink key={m.to} to={m.to} link={view.link} current={view.page === m.to}>
          {m.label}
        </PageLink>
      ))}
    </>
  );
  return (
    <header className="kf-head">
      <div className="kf-wrap kf-head-in">
        <Logo view={view} />
        <nav className="kf-nav">{nav}</nav>
        {/* Phone menu without scripts: a details element whose summary turns into the close button. */}
        <details className="kf-burger">
          <summary aria-label="منو">
            <span />
          </summary>
          <nav className="kf-drawer">{nav}</nav>
        </details>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const bg = safeUrl(shop.discoverImage);
  return (
    <footer className="kf-foot">
      <span className="kf-foot-bg" {...ed("site.shop.discoverImage", "image", "عکس پشت پایین صفحه")}>
        {bg && <img src={bg} alt="" loading="lazy" />}
      </span>
      <div className="kf-wrap kf-foot-in">
        <Logo view={view} />
        <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "جمله‌ی پایین صفحه")}>
          <p className="kf-foot-quote" {...ed("basics.summary", "multiline", "جمله‌ی پایین صفحه")}>
            «{b.summary}»
          </p>
        </Opt>
        <h4>شعبه‌ها</h4>
        <Opt value={site?.address} editing={editing} edit={ed("site.address", "multiline", "نشانی شعبه‌ها")}>
          <p className="kf-foot-stores" {...ed("site.address", "multiline", "نشانی شعبه‌ها")}>
            {site?.address}
          </p>
        </Opt>
        {blockOn(ctx.data, "newsletter") && b.email && (
          <>
            <h4>خبرها به تازگی قهوه‌ی ما</h4>
            {/* No server mailbox yet: joining opens an email to the cafe with the visitor's address. */}
            <form method="get" action={`mailto:${b.email}`} className="kf-news">
              <input type="hidden" name="subject" value="عضویت در خبرنامه" />
              <input name="body" type="email" required placeholder="ایمیل شما..." aria-label="ایمیل" dir="ltr" />
              <button type="submit" aria-label="عضویت">
                <svg viewBox="0 0 24 24" className="kf-ico">
                  <path d="M3.5 6h17v12h-17z M3.5 7l8.5 6.2L20.5 7" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
      <div className="kf-foot-end">
        <div className="kf-wrap kf-foot-end-in">
          <small>
            © {fa(new Date().getFullYear())} {b.fullName}. همه‌ی حقوق محفوظ است.
          </small>
          <nav>
            {menuItems(view).map((m) => (
              <PageLink key={m.to} to={m.to} link={link}>
                {m.label}
              </PageLink>
            ))}
          </nav>
          <Socials ctx={ctx} editing={editing} className="kf-socials" />
        </div>
      </div>
    </footer>
  );
}

/* ───────────── Home ───────────── */

function Hero({ view }: { view: View }) {
  const { shop, link, editing } = view;
  const own = (shop.slides ?? []).length > 0;
  const slides = own ? shop.slides! : [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage }];
  const at = (id: string, f: string) => (own ? `${item("site.shop.slides", id)}.${f}` : `site.shop.hero${f.charAt(0).toUpperCase()}${f.slice(1)}`);
  const n = slides.length;
  const badge = safeUrl(shop.newImage);
  return (
    <section className={`kf-hero kf-n${n}`}>
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="kf-hero" id={`kf-hero-${k}`} className="kf-dot" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      {n > 1 && <input type="radio" name="kf-hero" className="kf-dot kf-auto" defaultChecked aria-label="نمایش خودکار اسلایدها" />}
      <div className="kf-slides">
        {slides.map((s, k) => {
          const img = safeUrl(s.image);
          const H = k === 0 ? "h1" : "h2";
          return (
            <div key={s.id} className="kf-slide">
              <span className="kf-slide-pic" {...ed(at(s.id, "image"), "image", "عکس اسلاید")}>
                {img && <img src={img} alt="" loading={k ? "lazy" : undefined} />}
              </span>
              <div className="kf-slide-text">
                <span className="kf-hero-badge" {...ed("site.shop.newImage", "image", "نشان بالای تیتر")}>
                  {badge && <img src={badge} alt="" />}
                </span>
                <Opt value={s.title} editing={editing} edit={ed(at(s.id, "title"), "text", "تیتر اسلاید")}>
                  <H {...ed(at(s.id, "title"), "text", "تیتر اسلاید")}>{s.title}</H>
                </Opt>
                <Beans />
                <Opt value={s.text} editing={editing} edit={ed(at(s.id, "text"), "multiline", "متن اسلاید")}>
                  <p {...ed(at(s.id, "text"), "multiline", "متن اسلاید")}>{s.text}</p>
                </Opt>
                <PageLink to="/menu" link={link} className="kf-btn line">
                  دیدن منو
                </PageLink>
              </div>
              {n > 1 && (
                <>
                  <label htmlFor={`kf-hero-${(k + n - 1) % n}`} className="kf-arrow prev" title="اسلاید قبلی">
                    <svg viewBox="0 0 24 24" className="kf-ico">
                      <path d="M9 4l8 8-8 8" />
                    </svg>
                  </label>
                  <label htmlFor={`kf-hero-${(k + 1) % n}`} className="kf-arrow next" title="اسلاید بعدی">
                    <svg viewBox="0 0 24 24" className="kf-ico">
                      <path d="M15 4l-8 8 8 8" />
                    </svg>
                  </label>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Four line-drawn icons with a title and a line each (the shop's features). */
function OfferIcons({ view }: { view: View }) {
  const perks = (view.shop.perks ?? []).filter((x) => x.title.trim());
  if (!perks.length) return null;
  return (
    <div className="kf-icons">
      {perks.map((x, k) => {
        const at = item("site.shop.perks", x.id);
        return (
          <div key={x.id} className="kf-icon-card kf-rise" style={{ "--i": k } as CSSProperties}>
            <Pic src={x.image} path={`${at}.image`} label="آیکون" className="kf-icon-pic" />
            <b {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</b>
            <Opt value={x.text} editing={view.editing} edit={ed(`${at}.text`, "text", "توضیح")}>
              <small {...ed(`${at}.text`, "text", "توضیح")}>{x.text}</small>
            </Opt>
          </div>
        );
      })}
    </div>
  );
}

function Stats({ view }: { view: View }) {
  const list = (view.shop.stats ?? []).filter((x) => x.value.trim());
  if (!list.length) return null;
  return (
    <section className="kf-sec kf-wrap kf-stats">
      {list.map((x, k) => {
        const at = item("site.shop.stats", x.id);
        return (
          <div key={x.id} className="kf-rise" style={{ "--i": k } as CSSProperties}>
            <b {...ed(`${at}.value`, "text", "عدد")}>{x.value}</b>
            <span {...ed(`${at}.label`, "text", "عنوان")}>{x.label}</span>
            <Opt value={x.text} editing={view.editing} edit={ed(`${at}.text`, "text", "توضیح")}>
              <small {...ed(`${at}.text`, "text", "توضیح")}>{x.text}</small>
            </Opt>
          </div>
        );
      })}
    </section>
  );
}

function Logos({ view }: { view: View }) {
  const list = (view.ctx.data.site?.clients ?? []).filter((c) => safeUrl(c.image));
  if (!list.length && !view.editing) return null;
  return (
    <section className="kf-wrap kf-logos">
      {list.map((c) => (
        <span key={c.id} title={c.name} {...ed(`${item("site.clients", c.id)}.image`, "image", `آرم ${c.name}`)}>
          <img src={safeUrl(c.image)} alt={c.name} loading="lazy" />
        </span>
      ))}
      {view.editing && (
        <span className="kf-add" {...ed("site.clients", "newimage", "افزودن آرم")}>
          +
        </span>
      )}
    </section>
  );
}

function Cta({ view }: { view: View }) {
  const site = view.ctx.data.site;
  if (!blockOn(view.ctx.data, "cta")) return null;
  return (
    <section className="kf-paper">
      <div className="kf-wrap kf-cta">
        <Opt value={site?.bandText} editing={view.editing} edit={ed("site.bandText", "text", "متن نوار تماس")}>
          <p {...ed("site.bandText", "text", "متن نوار تماس")}>{site?.bandText}</p>
        </Opt>
        <PageLink to="/contact" link={view.link} className="kf-btn">
          تماس با ما
        </PageLink>
      </div>
    </section>
  );
}

function Home(view: View) {
  const { ctx, shop, editing, link } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const stories = (shop.banners ?? []).filter((x) => !x.hidden).slice(0, 3);
  const products = visible(shop);
  // The reference's "online coffee shop": the products of one chosen category (packs of beans).
  const packCat = shop.categories.find((c) => c.id === shop.showcaseCategoryId);
  const favorites = (packCat ? products.filter((p) => p.categoryId === packCat.id) : products.filter((p) => p.featured)).slice(0, 4);
  const gallery = (data.site?.gallery ?? []).filter((g) => safeUrl(g.image)).slice(0, 8);
  const band = safeUrl(shop.lookImage);
  const badge2 = safeUrl(shop.trendImage);
  return (
    <>
      {on("hero") && <Hero view={view} />}

      {on("offer") && (
        <section className="kf-sec kf-wrap">
          <Title view={view} title={shop.newTitle} text={shop.newText} titlePath="site.shop.newTitle" textPath="site.shop.newText" />
          <OfferIcons view={view} />
        </section>
      )}

      {on("stories") && stories.length > 0 && (
        <section className="kf-paper kf-sec">
          <div className="kf-wrap">
            <Title view={view} title={shop.bestTitle} text={shop.bestText} titlePath="site.shop.bestTitle" textPath="site.shop.bestText" />
            <div className="kf-stories">
              {stories.map((x, k) => {
                const at = item("site.shop.banners", x.id);
                return (
                  <article key={x.id} className="kf-story kf-rise" style={{ "--i": k } as CSSProperties}>
                    <Pic src={x.image} path={`${at}.image`} label="عکس کارت" className="kf-story-pic" />
                    <h3 {...ed(`${at}.title`, "text", "عنوان کارت")}>{x.title}</h3>
                    <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "متن کارت")}>
                      <p {...ed(`${at}.text`, "text", "متن کارت")}>{x.text}</p>
                    </Opt>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {on("badge") && (
        <section className="kf-band">
          <span className="kf-band-pic" {...ed("site.shop.lookImage", "image", "عکس پشت نوار")}>
            {band && <img src={band} alt="" loading="lazy" />}
          </span>
          <span className="kf-band-badge" {...ed("site.shop.trendImage", "image", "نشان وسط نوار")}>
            {badge2 && <img src={badge2} alt="" loading="lazy" />}
          </span>
        </section>
      )}

      {on("stats") && <Stats view={view} />}

      {on("favorites") && favorites.length > 0 && (
        <section className="kf-paper kf-sec">
          <div className="kf-wrap">
            <Title view={view} title={shop.showcaseTitle} text={shop.showcaseText} titlePath="site.shop.showcaseTitle" textPath="site.shop.showcaseText" />
            <div className="kf-favs">
              {favorites.map((p, k) => (
                <PageLink key={p.id} to="/menu" link={link} className="kf-fav kf-rise" product={p.id}>
                  <span className="kf-fav-pic" style={{ "--i": k } as CSSProperties} {...ed(`${item("site.shop.products", p.id)}.images[0]`, "image", "عکس")}>
                    {safeUrl(p.images[0]) && <img src={safeUrl(p.images[0])} alt={p.name} loading="lazy" />}
                  </span>
                  <b>{p.name}</b>
                  <Price view={view} p={p} />
                </PageLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {on("gallery") && (gallery.length > 0 || editing) && (
        <section className="kf-sec">
          <div className="kf-wrap">
            <Title view={view} title={shop.discountTitle} text={shop.promoText} titlePath="site.shop.discountTitle" textPath="site.shop.promoText" />
          </div>
          <div className="kf-gallery">
            {gallery.map((g) => (
              <ZoomOpen key={g.id} id={g.id} className="kf-gal">
                <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس گالری")} />
              </ZoomOpen>
            ))}
            {editing && gallery.length < 8 && (
              <span className="kf-gal kf-add" {...ed("site.gallery", "newimage", "افزودن عکس")}>
                +
              </span>
            )}
          </div>
        </section>
      )}

      {on("logos") && <Logos view={view} />}
      <Cta view={view} />
    </>
  );
}

/* ───────────── Menu (the page the QR code opens) ───────────── */

function Menu(view: View) {
  const { shop, editing } = view;
  const products = visible(shop);
  const cats = (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const loose = products.filter((p) => !cats.some((c) => c.id === p.categoryId));
  const groups = [...cats.map((c) => ({ id: c.id, name: c.name, list: products.filter((p) => p.categoryId === c.id) })), ...(loose.length ? [{ id: "other", name: "سایر", list: loose }] : [])];
  if (!groups.length) return <p className="kf-wrap kf-sec kf-empty">منو هنوز خالی است؛ از پنل مدیریت آیتم‌های منو را اضافه کنید.</p>;
  return (
    <>
      {groups.length > 1 && (
        <nav className="kf-jump" aria-label="دسته‌های منو">
          <div className="kf-wrap">
            {groups.map((g) => (
              <a key={g.id} href={`#kf-cat-${g.id}`}>
                {g.name}
              </a>
            ))}
          </div>
        </nav>
      )}
      {groups.map((g, gi) => (
        <section key={g.id} id={`kf-cat-${g.id}`} className={`kf-sec${gi % 2 ? " kf-paper" : ""}`}>
          <div className="kf-wrap">
            <div className="kf-title">
              <h2>{g.name}</h2>
              <Beans />
            </div>
            <div className="kf-menu">
              {g.list.map((p) => {
                const out = p.stock === 0;
                const img = safeUrl(p.images[0]);
                return (
                  <article key={p.id} className={`kf-dish${out ? " kf-out" : ""}`} data-product={p.id}>
                    <span className="kf-dish-pic">{img ? <img src={img} alt="" loading="lazy" /> : <i>{p.name.charAt(0)}</i>}</span>
                    <div>
                      <div className="kf-dish-line">
                        <b>{p.name}</b>
                        {p.badge && <em className="kf-tag">{p.badge}</em>}
                        <i className="kf-dots" aria-hidden="true" />
                        {out ? <span className="kf-soldout">تمام شد</span> : <Price view={view} p={p} />}
                      </div>
                      {p.description && <p>{p.description.split("\n")[0]}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}
      {editing && <p className="kf-wrap kf-hint">آیتم‌ها، قیمت‌ها و دسته‌های منو از دکمه‌ی «مدیریت» در نوار بالا تغییر می‌کنند.</p>}
    </>
  );
}

/* ───────────── About, what we offer, contact ───────────── */

function Quotes({ view }: { view: View }) {
  const list = (view.ctx.data.site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  if (!list.length) return null;
  const bg = safeUrl(view.shop.heroImage);
  return (
    <section className="kf-quotes">
      <span className="kf-quotes-bg" {...ed("site.shop.heroImage", "image", "عکس پشت نظرات")}>
        {bg && <img src={bg} alt="" loading="lazy" />}
      </span>
      <div className="kf-wrap kf-quotes-in">
        <div className="kf-title kf-on-dark">
          <h2>نظرات مهمانان</h2>
          <Beans />
        </div>
        {list.length > 1 && list.map((t, k) => <input key={t.id} type="radio" name="kf-quote" id={`kf-quote-${k}`} className="kf-dot" defaultChecked={k === 0} aria-label={t.name} />)}
        <div className="kf-quote-stack">
          {list.map((t) => {
            const at = item("site.testimonials", t.id);
            return (
              <figure key={t.id} className="kf-quote">
                <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                <figcaption>
                  <b {...ed(`${at}.name`, "text", "نام")}>{t.name}</b>
                  {t.role && <span {...ed(`${at}.role`, "text", "توضیح")}>، {t.role}</span>}
                </figcaption>
              </figure>
            );
          })}
        </div>
        {list.length > 1 && (
          <div className="kf-qdots">
            {list.map((t, k) => (
              <label key={t.id} htmlFor={`kf-quote-${k}`} title={t.name} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function About(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  return (
    <>
      <section className="kf-sec kf-wrap kf-about">
        <Pic src={site?.signatureImage} path="site.signatureImage" label="نقش بالای تیتر" className="kf-branch" />
        <Title view={view} title={site?.aboutTitle} text={site?.aboutText} titlePath="site.aboutTitle" textPath="site.aboutText" />
        <div className="kf-about-cards">
          <div className="kf-rise">
            <Pic src={site?.heroImage} path="site.heroImage" label="عکس اول" className="kf-about-pic" />
            <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن زیر عکس اول")}>
              <div {...ed("site.styleText", "multiline", "متن زیر عکس اول")}>
                <Para text={site?.styleText} />
              </div>
            </Opt>
          </div>
          <div className="kf-rise" style={{ "--i": 1 } as CSSProperties}>
            <Pic src={site?.accentImage} path="site.accentImage" label="عکس دوم" className="kf-about-pic" />
            <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "multiline", "متن زیر عکس دوم")}>
              <div {...ed("site.shop.heroText", "multiline", "متن زیر عکس دوم")}>
                <Para text={shop.heroText} />
              </div>
            </Opt>
          </div>
        </div>
      </section>
      <Quotes view={view} />
      <Stats view={view} />
      <Cta view={view} />
    </>
  );
}

function Offer(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const b = ctx.data.basics;
  const pics = (shop.banners ?? []).filter((x) => !x.hidden).slice(3, 7);
  const pic = (k: number) => {
    const x = pics[k];
    return x ? <Pic src={x.image} path={`${item("site.shop.banners", x.id)}.image`} label="عکس" className="kf-tile kf-tile-pic" /> : <span className="kf-tile kf-tile-pic" />;
  };
  const text = (title: string, body: ReactNode) => (
    <div className="kf-tile kf-tile-text">
      <h3>{title}</h3>
      {body}
    </div>
  );
  return (
    <>
      <section className="kf-sec kf-wrap">
        <Title view={view} title={shop.newTitle} text={shop.newText} titlePath="site.shop.newTitle" textPath="site.shop.newText" />
        <OfferIcons view={view} />
      </section>
      <section className="kf-tiles">
        {pic(0)}
        {text(
          "ساعات کاری",
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
            <p {...ed("site.contactNote", "multiline", "ساعات کاری")}>{site?.contactNote}</p>
          </Opt>,
        )}
        {pic(1)}
        {text(
          "قهوه‌ی ما از کجاست",
          <Opt value={shop.paymentNote} editing={editing} edit={ed("site.shop.paymentNote", "multiline", "منبع قهوه")}>
            <p {...ed("site.shop.paymentNote", "multiline", "منبع قهوه")}>{shop.paymentNote}</p>
          </Opt>,
        )}
        {text(
          "رزرو میز",
          <>
            <Opt value={shop.orderNote} editing={editing} edit={ed("site.shop.orderNote", "multiline", "متن رزرو")}>
              <p {...ed("site.shop.orderNote", "multiline", "متن رزرو")}>{shop.orderNote}</p>
            </Opt>
            {b.phone && (
              <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </a>
            )}
          </>,
        )}
        {pic(2)}
        {text(
          "شعبه‌ها",
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "multiline", "نشانی شعبه‌ها")}>
            <p {...ed("site.address", "multiline", "نشانی شعبه‌ها")}>{site?.address}</p>
          </Opt>,
        )}
        {pic(3)}
      </section>
      <Logos view={view} />
    </>
  );
}

function Contact(view: View) {
  const { ctx, shop, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const points = (shop.bandItems ?? []).filter((x) => x.trim());
  return (
    <>
      <section className="kf-sec kf-wrap kf-contact">
        <div className="kf-rise">
          <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>
            <h1 {...ed("site.contactTitle", "text", "تیتر صفحه‌ی تماس")}>{site?.contactTitle}</h1>
          </Opt>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
            <p {...ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>{site?.contactText}</p>
          </Opt>
          {points.length > 0 && (
            <ul>
              {points.map((x, k) => (
                <li key={k} {...ed(`site.shop.bandItems[${k}]`, "text", "نکته")}>
                  {x}
                </li>
              ))}
            </ul>
          )}
          <Socials ctx={ctx} editing={editing} className="kf-contact-socials" />
        </div>
        {b.email ? (
          // No server mailbox yet: sending opens an email to the cafe.
          <form method="get" action={`mailto:${b.email}`} className="kf-form kf-rise">
            <input name="cc" placeholder="نام شما" aria-label="نام شما" />
            <input name="bcc" type="email" placeholder="ایمیل شما" aria-label="ایمیل شما" dir="auto" />
            <input name="subject" placeholder="موضوع" aria-label="موضوع" className="kf-full" />
            <textarea name="body" required rows={5} placeholder="پیام شما..." aria-label="پیام شما" className="kf-full" />
            <button type="submit" className="kf-btn">
              ارسال پیام
            </button>
          </form>
        ) : (
          <p className="kf-empty">برای فعال شدن فرم، ایمیل کافه را وارد کنید.</p>
        )}
      </section>
      <section className="kf-wrap kf-where">
        <div className="kf-where-text kf-rise">
          <h2>نشانی و راه‌های ارتباط</h2>
          <Beans />
          <dl>
            <dt>نشانی</dt>
            <Opt value={site?.address} editing={editing} edit={ed("site.address", "multiline", "نشانی")}>
              <dd {...ed("site.address", "multiline", "نشانی")}>{site?.address}</dd>
            </Opt>
            <dt>ساعات کاری</dt>
            <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
              <dd {...ed("site.contactNote", "multiline", "ساعات کاری")}>{site?.contactNote}</dd>
            </Opt>
            <dt>تلفن و ایمیل</dt>
            <dd>
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
            </dd>
          </dl>
          {map && (
            <a href={map} {...outside(map)} className="kf-btn">
              مسیریابی
            </a>
          )}
        </div>
        <div className="kf-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          {embed ? <iframe src={embed} title="نقشه‌ی کافه" loading="lazy" referrerPolicy="no-referrer" /> : <span>برای نمایش نقشه، لینک مکان کافه را بگذارید.</span>}
        </div>
      </section>
    </>
  );
}

/* ───────────── Example content (from the Corretto reference, in Persian) ───────────── */

export function kafeSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`kf-${n}`);
  const png = (n: string) => sampleImage(`kf-${n}`, "png");
  const cup = (k: number) => png(`cup${k}`);
  const dish = (id: string, categoryId: string, name: string, price: number, k: number, extra: Partial<Product> = {}): Product => ({
    id,
    name,
    categoryId,
    price,
    images: [cup(k)],
    description: "قهوه‌ی تازه‌دم با شیر بخارداده",
    ...extra,
  });
  const products: Product[] = [
    dish("m1", "c1", "کافه لاته", 145000, 1, { featured: true, description: "اسپرسو با شیر بخارداده و کمی کف" }),
    dish("m2", "c1", "کاپوچینو", 135000, 2, { featured: true, description: "اسپرسو، شیر داغ و کف فراوان با پودر دارچین" }),
    dish("m3", "c1", "موکا", 160000, 3, { featured: true, salePrice: 140000, description: "اسپرسو، شکلات تلخ و شیر" }),
    dish("m4", "c1", "اسپرسو", 90000, 4, { featured: true, description: "یک شات اسپرسوی دوبل از دانه‌ی عربیکا" }),
    dish("m5", "c1", "آمریکانو", 95000, 5, { description: "اسپرسو با آب داغ؛ ملایم و خوش‌عطر" }),
    dish("m6", "c2", "آیس کافی", 150000, 2, { description: "قهوه‌ی سرد با یخ و شیر", badge: "خنک" }),
    dish("m7", "c2", "آیس لاته", 155000, 1, { description: "اسپرسو، شیر سرد و یخ" }),
    dish("m8", "c2", "آیس موکا", 170000, 3, { description: "اسپرسو، شکلات، شیر سرد و یخ" }),
    dish("m9", "c2", "کلد برو", 165000, 5, { description: "قهوه‌ی دم‌شده در آب سرد به مدت ۱۲ ساعت", stock: 0 }),
    dish("m10", "c2", "فراپه", 180000, 4, { description: "قهوه، شیر و یخ خردشده با خامه" }),
    dish("m11", "c3", "کروسان کره‌ای", 120000, 3, { description: "کروسان تازه با کره‌ی فرانسوی" }),
    dish("m12", "c3", "چیزکیک", 185000, 2, { description: "چیزکیک نیویورکی با سس توت‌فرنگی" }),
    ...(["اتیوپی", "کنیا", "کلمبیا", "گواتمالا"] as const).map((n, k) => ({ id: `b${k + 1}`, name: `قهوه‌ی ${n}`, categoryId: "c4", price: [650000, 780000, 910000, 1050000][k]!, images: [png(`pack${k + 1}`)], description: "۲۵۰ گرم دانه‌ی تازه‌برشته" })),
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "Corretto",
      jobTitle: "کافه و رستوران",
      avatarUrl: png("logo"),
      email: "info@example.com",
      phone: "021 0000 0000",
      summary: "قهوه‌ی خوب بهانه است؛ آمده‌ایم تا لحظه‌های آرام و گفت‌وگوهای خوب را کنار هم بسازیم.",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
      ],
    },
    site: {
      ...base.site,
      aboutTitle: "درباره‌ی کورتو",
      aboutText: "از سال ۱۳۸۰ قهوه را با عشق دم می‌کنیم. دانه‌ها را خودمان برشته می‌کنیم و هر فنجان را با دقت آماده می‌کنیم تا طعمی ماندگار داشته باشد.",
      styleText: "باریستاهای ما هر روز دانه‌ی تازه آسیاب می‌کنند و با روش‌های مختلف دم‌آوری، از اسپرسو تا دمی، بهترین طعم هر دانه را بیرون می‌کشند.\nهر فنجان پیش از سرو چشیده می‌شود.",
      signatureImage: png("branch"),
      heroImage: img("about1"),
      accentImage: img("about2"),
      contactNote: "شنبه تا چهارشنبه: ۹ تا ۲۳\nپنجشنبه و جمعه: ۱۰ تا ۱\nروزهای تعطیل رسمی: بسته",
      address: "تهران، خیابان ولیعصر، پلاک ۱۲۳\nتهران، خیابان شریعتی، پلاک ۴۵",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7000&mlon=51.4000",
      bandText: "میز دلخواهتان را رزرو کنید یا برای مهمانی‌ها با ما هماهنگ کنید",
      contactTitle: "با ما در تماس باشید",
      contactText: "برای رزرو، برگزاری جشن یا هر پرسشی پیام بگذارید؛ در کوتاه‌ترین زمان پاسخ می‌دهیم.",
      gallery: [1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ id: `gl${k}`, title: "کافه", image: img(`g${k}`) })),
      clients: [1, 2, 3, 4].map((k) => ({ id: `lg${k}`, name: "همکار", image: png(`logo${k}`) })),
      testimonials: [
        { id: "q1", name: "سارا محمدی", role: "مهمان همیشگی", text: "فضای آرام، موسیقی خوب و لاته‌ای که هیچ‌جا مثلش را پیدا نکردم. هر هفته دست‌کم یک بار این‌جا هستم و هر بار با لبخند پذیرایی می‌شوم." },
        { id: "q2", name: "علی رضایی", role: "عاشق قهوه", text: "دانه‌های تازه‌برشته و باریستاهایی که حوصله دارند درباره‌ی قهوه توضیح بدهند؛ برای من بهترین کافه‌ی شهر است." },
        { id: "q3", name: "مریم کریمی", role: "مهمان", text: "جشن تولد دخترم را این‌جا گرفتیم؛ همه‌چیز عالی و دقیق بود. ممنون از تیم خوب کافه." },
      ],
      shop: {
        slides: [
          { id: "s1", title: "کارخانه‌ی قهوه", text: "دانه‌های تازه‌برشته، فنجان‌های گرم و لحظه‌هایی که دلتان می‌خواهد طولانی‌تر شوند.", image: img("hero") },
          { id: "s2", title: "طعم واقعی قهوه", text: "از اسپرسوی غلیظ تا دمی ملایم؛ هر فنجان را با دقت برایتان آماده می‌کنیم.", image: img("g5") },
        ],
        newImage: png("badge"),
        newTitle: "پیشنهادهای خوشمزه‌ی ما",
        newText: "هر روز صبح دانه‌ها را تازه آسیاب می‌کنیم و کیک‌ها را تازه می‌پزیم؛ از اسپرسوی غلیظ تا شیرینی‌های خانگی، همه‌چیز برای یک لحظه‌ی خوب آماده است.",
        perks: [
          { id: "p1", title: "انواع قهوه", text: "از اسپرسو تا دمی، با دانه‌های تازه.", image: png("icon1") },
          { id: "p2", title: "دانه‌های متنوع", text: "عربیکا و روبوستا از بهترین مزرعه‌ها.", image: png("icon2") },
          { id: "p3", title: "قهوه و شیرینی", text: "کیک و کروسان تازه، هر روز.", image: png("icon3") },
          { id: "p4", title: "قهوه‌ی بیرون‌بر", text: "فنجان همراه برای مسیرهای شما.", image: png("icon4") },
        ],
        bestTitle: "قصه‌های قهوه",
        bestText: "کمی درباره‌ی روش‌هایی که قهوه‌ی شما را با آن‌ها آماده می‌کنیم؛ از دمای آب و درجه‌ی آسیاب تا زمان دم کشیدن هر فنجان.",
        banners: [
          { id: "b1", image: img("story1"), title: "اسپرسوی دقیق", text: "دما، فشار و زمان؛ سه چیزی که یک اسپرسوی خوب را می‌سازند و باریستاهای ما هر روز تمرینشان می‌کنند." },
          { id: "b2", image: img("story2"), title: "فرنچ‌پرس", text: "دمی آرام و پرطعم برای کسانی که قهوه را با حوصله و در گفت‌وگو با دوستان می‌نوشند." },
          { id: "b3", image: img("story3"), title: "قهوه‌ی ترک", text: "قهوه‌ی ریزآسیاب در قهوه‌جوش مسی؛ غلیظ، معطر و با همان کفی که دوست دارید." },
          { id: "b4", image: img("tile1") },
          { id: "b5", image: img("tile2") },
          { id: "b6", image: img("tile3") },
          { id: "b7", image: img("tile4") },
        ],
        lookImage: "",
        trendImage: png("badge2"),
        stats: [
          { id: "t1", value: "۲۵۰", label: "نوع قهوه", text: "از مزرعه‌های مختلف دنیا" },
          { id: "t2", value: "۱۲۳", label: "ساعت آزمایش", text: "برای هر ترکیب تازه" },
          { id: "t3", value: "۳۲۱", label: "مهمان هر روز", text: "که با لبخند می‌روند" },
          { id: "t4", value: "۲۲۰", label: "برند قهوه", text: "که با آن‌ها کار کرده‌ایم" },
        ],
        showcaseTitle: "دانه‌های قهوه‌ی ما",
        showcaseText: "دانه‌هایی که خودمان برشته می‌کنیم، در بسته‌های ۲۵۰ گرمی؛ برای این‌که طعم قهوه‌ی کافه را در خانه هم داشته باشید.",
        discountTitle: "گالری ما",
        promoText: "گوشه‌ای از روزهای کافه، فنجان‌ها و آدم‌هایش؛ لحظه‌هایی که هر روز در کنار مهمانانمان می‌سازیم و دوستشان داریم.",
        heroImage: img("foot"),
        heroText: "فضای کافه را برای گفت‌وگو، کار و استراحت ساخته‌ایم؛ نور گرم، صندلی‌های راحت و اینترنت پرسرعت.\nبرای جمع‌های دوستانه هم میزهای بزرگ داریم.",
        discoverImage: img("foot"),
        paymentNote: "برزیل، کلمبیا، اتیوپی، کنیا و کاستاریکا",
        orderNote: "برای رزرو میز تماس بگیرید:",
        bandItems: ["رزرو میز برای جمع‌های دوستانه", "برگزاری جشن تولد و دورهمی", "سفارش کیک و قهوه برای جلسه‌ها", "کارگاه آموزش قهوه"],
        categories: [
          { id: "c1", name: "نوشیدنی‌های گرم", image: "" },
          { id: "c2", name: "نوشیدنی‌های سرد", image: "" },
          { id: "c3", name: "کیک و شیرینی", image: "" },
          { id: "c4", name: "دانه‌ی قهوه", image: "" },
        ],
        showcaseCategoryId: "c4",
        products,
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Kafe Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.kf {
  --kf-tan: var(--color-primary);
  --kf-paper: #F4E8DC;
  --kf-ink: #232227;
  --kf-muted: #77737A;
  --kf-dark: #121212;
  --kf-head: "Kafe Markazi", var(--font-heading), serif;
  background: #fff;
  color: var(--kf-ink);
  font-size: 15px;
}
.kf :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; outline-offset: 2px; }
.kf a { color: inherit; text-decoration: none; }
.kf h1, .kf h2, .kf h3, .kf h4, .kf p, .kf figure, .kf blockquote, .kf ul { margin: 0; }
.kf-ico { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.kf-wrap { box-sizing: border-box; width: 100%; max-width: 1200px; margin-inline: auto; padding-inline: 24px; }
.kf-sec { padding-block: 100px; }
.kf-paper { background: var(--kf-paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .42 0 0 0 0 .3 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.kf-pic { display: block; overflow: hidden; }
.kf-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.kf-add { display: grid; place-items: center; border: 1px dashed currentColor; color: var(--kf-muted); font-size: 28px; cursor: pointer; }
.kf-empty, .kf-hint { color: var(--kf-muted); text-align: center; }
.kf-hint { padding-block: 0 40px; font-size: 13px; }

/* Buttons: square, small letters, a tan fill (or a thin white line on dark) */
.kf-btn { display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 30px; border: 1px solid var(--kf-tan); background: var(--kf-tan); color: #fff !important; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .3s, color .3s; }
.kf-btn:hover { background: transparent; color: var(--kf-tan) !important; }
.kf-btn.line { height: 52px; padding: 0 38px; border-color: #fff; background: transparent; }
.kf-btn.line:hover { background: #fff; color: var(--kf-dark) !important; }

/* Titles with the bean ornament */
.kf-title { display: grid; justify-items: center; gap: 14px; margin-bottom: 64px; text-align: center; }
.kf-title h2 { font-family: var(--kf-head); font-size: clamp(32px, 3.4cqi, 46px); font-weight: 500; line-height: 1.3; color: var(--kf-ink); }
.kf-title p { max-width: 520px; color: var(--kf-muted); font-size: 15px; line-height: 2; }
.kf-on-dark h2, .kf-on-dark p { color: #fff; }
.kf-beans { display: flex; align-items: center; gap: 12px; color: var(--kf-tan); }
.kf-beans::before, .kf-beans::after { content: ""; width: 54px; height: 1px; background: currentColor; opacity: .7; }
.kf-beans svg { width: 24px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.3; }

/* Header: over the hero on the home page, a dark bar on the others */
.kf-head { --kf-head-bg: var(--kf-dark); position: sticky; top: 0; z-index: 30; background: var(--kf-head-bg); }
.kf-home .kf-head { --kf-head-bg: transparent; margin-bottom: -104px; }
/* While scrolling down the header slips away, then slides back in from the top on a dark bar
   (scroll-driven: no script; where unsupported it simply stays at the top of the page). */
@supports (animation-timeline: scroll()) {
  .kf-head { animation: kf-head linear both; animation-timeline: scroll(); animation-range: 0 560px; }
  @keyframes kf-head {
    0% { transform: none; opacity: 1; background: var(--kf-head-bg); box-shadow: none; }
    22%, 55% { transform: translateY(-100%); opacity: 0; background: rgb(18 18 18 / .97); }
    100% { transform: none; opacity: 1; background: rgb(18 18 18 / .97); box-shadow: 0 10px 30px -18px rgb(0 0 0 / .6); }
  }
  .kf-head .kf-head-in { animation: kf-head-in linear both; animation-timeline: scroll(); animation-range: 0 560px; }
  @keyframes kf-head-in { 0%, 55% { min-height: 104px; } 100% { min-height: 78px; } }
}
.kf-head-in { display: flex; flex-direction: row-reverse; align-items: center; justify-content: space-between; gap: 30px; min-height: 104px; }
.kf-logo img { display: block; height: 56px; width: auto; }
.kf-logo b { font-family: var(--kf-head); font-size: 30px; color: #fff; }
.kf-nav { display: flex; gap: 38px; }
.kf-nav a { position: relative; padding: 8px 0; color: #fff; font-size: 14px; font-weight: 600; }
.kf-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; background: #fff; transform: scaleX(0); transition: transform .35s; }
.kf-nav a:hover::after, .kf-nav a[aria-current="page"]::after { transform: scaleX(1); }
.kf-burger { display: none; }

/* Hero slider */
.kf-hero { position: relative; overflow: hidden; background: #1E1A17; color: #fff; }
.kf-dot { position: absolute; top: 50%; left: 50%; width: 1px !important; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.kf-slides { display: grid; }
.kf-slide { grid-area: 1 / 1; position: relative; display: grid; place-items: center; min-height: clamp(560px, 46cqi, 740px); opacity: 0; visibility: hidden; transition: opacity 1s, visibility 1s; }
.kf-slide:only-child, ${[1, 2, 3, 4, 5].map((n) => `.kf-dot:nth-of-type(${n}):checked ~ .kf-slides > .kf-slide:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; }
${[2, 3, 4, 5]
  .map((n) => {
    const show = 100 / n;
    return `@keyframes kf-cycle${n} { 0% { opacity: 0; visibility: visible; } ${(show * 0.12).toFixed(2)}% { opacity: 1; visibility: visible; } ${(show * 0.9).toFixed(2)}% { opacity: 1; visibility: visible; } ${show.toFixed(2)}%, 100% { opacity: 0; visibility: hidden; } }
.kf-n${n} .kf-auto:checked ~ .kf-slides > .kf-slide { animation: kf-cycle${n} ${n * 7}s infinite both; }
${Array.from({ length: n }, (_, k) => `.kf-n${n} .kf-auto:checked ~ .kf-slides > .kf-slide:nth-child(${k + 1}) { animation-delay: ${k * 7 - 0.5}s; }`).join("\n")}`;
  })
  .join("\n")}
.kf-hero:hover .kf-slide, .kf-hero:focus-within .kf-slide { animation-play-state: paused !important; }
/* The picture keeps to the left (as in the reference) and fades into the dark wood on the right. */
.kf-slide-pic { position: absolute; inset-block: 0; left: 0; width: min(100%, max(50%, 760px)); overflow: hidden; -webkit-mask-image: linear-gradient(to right, #000 55%, transparent 98%); mask-image: linear-gradient(to right, #000 55%, transparent 98%); }
.kf-slide-pic img { width: 100%; height: 100%; object-fit: cover; object-position: left center; transform-origin: 30% 50%; animation: kf-zoom 20s ease-in-out infinite alternate; }
/* A very slow zoom (the "Ken Burns" look) so the picture feels alive. */
@keyframes kf-zoom { from { transform: scale(1); } to { transform: scale(1.15); } }
.kf-band-pic img { animation: kf-zoom 40s ease-in-out infinite alternate; }
/* Dark stone texture drawn by the browser (sharp at any size), shared with the badge band. */
.kf-slide::before { content: ""; position: absolute; inset: 0; background-color: #241E1B; background-image: radial-gradient(ellipse at 50% 40%, transparent 30%, rgb(0 0 0 / .45)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2800' height='1000'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.008 .02' numOctaves='3' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .16 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E"); }
.kf-slide-pic::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / .18); }
.kf-slide { justify-items: start; }
.kf-slide-text { position: relative; display: grid; justify-items: center; gap: 18px; width: min(640px, 100%); box-sizing: border-box; margin-inline-start: clamp(20px, 11cqi, 230px); padding: 120px 24px 70px; text-align: center; }
.kf-hero-badge img { display: block; width: 116px; height: auto; }
.kf-slide-text h1, .kf-slide-text h2 { font-family: var(--kf-head); font-size: clamp(42px, 5.6cqi, 78px); font-weight: 500; line-height: 1.15; }
.kf-slide-text .kf-beans { color: #fff; }
.kf-slide-text p { color: rgb(255 255 255 / .9); font-size: 16px; line-height: 2; }
.kf-slide-text .kf-btn { margin-top: 18px; }
.kf-slide .kf-slide-text > * { opacity: 0; transform: translateY(24px); transition: opacity .8s, transform .9s cubic-bezier(.2, .8, .2, 1); }
.kf-slide:only-child .kf-slide-text > *, .kf-auto:checked ~ .kf-slides .kf-slide-text > *, ${[1, 2, 3, 4, 5].map((n) => `.kf-dot:nth-of-type(${n}):checked ~ .kf-slides > .kf-slide:nth-child(${n}) .kf-slide-text > *`).join(", ")} { opacity: 1; transform: none; }
.kf-slide-text > :nth-child(2) { transition-delay: .15s; }
.kf-slide-text > :nth-child(4) { transition-delay: .3s; }
.kf-slide-text > :nth-child(5) { transition-delay: .45s; }
.kf-arrow { position: absolute; top: 50%; translate: 0 -50%; z-index: 2; display: grid; place-items: center; width: 54px; height: 54px; color: #fff; cursor: pointer; opacity: .8; transition: opacity .3s, transform .3s; }
.kf-arrow .kf-ico { width: 34px; height: 34px; stroke-width: 1.2; }
.kf-arrow:hover { opacity: 1; }
.kf-arrow.prev { inset-inline-start: 28px; }
.kf-arrow.next { inset-inline-end: 28px; }
.kf-arrow.prev:hover { transform: translateX(4px); }
.kf-arrow.next:hover { transform: translateX(-4px); }

/* Offer icons */
.kf-icons { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; }
.kf-icon-card { display: grid; justify-items: center; gap: 12px; text-align: center; }
.kf-icon-pic { width: 110px; height: 110px; margin-bottom: 8px; }
.kf-icon-pic img { object-fit: contain; transition: transform .6s cubic-bezier(.2, .8, .2, 1.4); }
.kf-icon-card:hover .kf-icon-pic img { transform: translateY(-6px) rotate(-4deg); }
.kf-icon-card b { font-family: var(--kf-head); font-size: 22px; font-weight: 500; }
.kf-icon-card small { max-width: 220px; color: var(--kf-muted); font-size: 14px; line-height: 1.9; }

/* Three stories */
.kf-stories { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.kf-story { display: grid; gap: 14px; align-content: start; }
.kf-story-pic { aspect-ratio: 530 / 420; }
.kf-story-pic img { transition: transform 1s cubic-bezier(.2, .8, .2, 1); }
.kf-story:hover .kf-story-pic img { transform: scale(1.06); }
.kf-story h3 { margin-top: 14px; font-family: var(--kf-head); font-size: 24px; font-weight: 500; }
.kf-story p { color: var(--kf-muted); font-size: 14px; line-height: 1.9; }

/* Badge band */
.kf-band { position: relative; display: grid; place-items: center; min-height: clamp(360px, 36cqi, 520px); overflow: hidden; isolation: isolate; background-color: #241E1B; background-image: radial-gradient(ellipse at 50% 40%, transparent 30%, rgb(0 0 0 / .45)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2800' height='1000'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.008 .02' numOctaves='3' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .16 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E"); }
.kf-band-pic { position: absolute; inset: 0; z-index: -1; }
.kf-band-pic img { width: 100%; height: 100%; object-fit: cover; }
.kf-band-badge img { display: block; width: clamp(180px, 15cqi, 250px); height: auto; transition: transform .8s cubic-bezier(.2, .8, .2, 1.3); }
.kf-band:hover .kf-band-badge img { transform: scale(1.06) rotate(-3deg); }

/* Numbers */
.kf-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; text-align: center; }
.kf-stats > div { display: grid; justify-items: center; gap: 8px; }
.kf-stats b { font-family: var(--kf-head); font-size: clamp(46px, 4.6cqi, 64px); font-weight: 500; line-height: 1.1; color: var(--kf-tan); }
.kf-stats span { font-family: var(--kf-head); font-size: 20px; }
.kf-stats small { max-width: 220px; color: var(--kf-muted); font-size: 13px; line-height: 1.8; }

/* Favourites */
.kf-favs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; }
.kf-fav { display: grid; justify-items: center; gap: 8px; text-align: center; }
.kf-fav-pic { display: flex; align-items: center; justify-content: center; width: 100%; height: 280px; }
.kf-fav-pic img { display: block; width: auto; height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 22px 22px rgb(70 45 20 / .25)); transition: transform .7s cubic-bezier(.2, .8, .2, 1.3); }
.kf-fav:hover .kf-fav-pic img { transform: translateY(-10px); }
.kf-fav b { margin-top: 14px; font-family: var(--kf-head); font-size: 22px; font-weight: 500; }
.kf-price { display: inline-flex; gap: 8px; align-items: baseline; color: var(--kf-tan); font-size: 15px; white-space: nowrap; }
.kf-price s { color: var(--kf-muted); font-size: 13px; }
.kf-price b { font-weight: 600; }

/* Gallery: edge to edge, the picture zooms and dims a little on hover */
.kf-gallery { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding-inline: 4px; }
.kf-gal { position: relative; display: block; aspect-ratio: 457 / 435; overflow: hidden; cursor: zoom-in; }
.kf-gal img { width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2, .8, .2, 1), filter .5s; }
.kf-gal:hover img { transform: scale(1.08); filter: brightness(.85); }

/* Logos and call to contact */
.kf-logos { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-around; gap: 30px; padding-block: 90px 100px; }
.kf-logos span { display: grid; place-items: center; width: 170px; height: 120px; }
.kf-logos img { max-width: 100%; max-height: 100%; object-fit: contain; opacity: .85; transition: opacity .3s, transform .4s; }
.kf-logos span:hover img { opacity: 1; transform: scale(1.08); }
.kf-cta { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding-block: 64px; }
.kf-cta p { font-family: var(--kf-head); font-size: clamp(20px, 2cqi, 26px); line-height: 1.5; }

/* Footer: a dark photo behind a centred column, then a black bar */
.kf-foot { position: relative; isolation: isolate; color: #fff; background: var(--kf-dark); text-align: center; }
.kf-foot-bg { position: absolute; inset: 0 0 auto; height: calc(100% - 92px); z-index: -1; }
.kf-foot-bg img { width: 100%; height: 100%; object-fit: cover; opacity: .42; }
.kf-foot-in { display: grid; justify-items: center; gap: 14px; padding-block: 120px 110px; }
.kf-foot-in .kf-logo img { height: 64px; margin-bottom: 16px; }
.kf-foot-quote { max-width: 560px; margin-bottom: 26px; color: rgb(255 255 255 / .85); font-size: 15px; line-height: 2; }
.kf-foot h4 { margin-top: 14px; font-family: var(--kf-head); font-size: 22px; font-weight: 500; }
.kf-foot-stores { color: rgb(255 255 255 / .8); font-size: 14px; line-height: 1.9; white-space: pre-line; }
.kf-news { display: flex; width: min(100%, 360px); margin-top: 6px; }
.kf-news input[type="email"] { flex: 1; min-width: 0; height: 46px; padding: 0 16px; border: 1px solid rgb(255 255 255 / .3); background: transparent; color: #fff; font: inherit; font-size: 13px; }
.kf-news input::placeholder { color: rgb(255 255 255 / .6); }
.kf-news button { display: grid; place-items: center; width: 52px; border: none; background: #fff; color: var(--kf-dark); cursor: pointer; transition: background .3s, color .3s; }
.kf-news button:hover { background: var(--kf-tan); color: #fff; }
.kf-foot-end { background: #0b0b0b; }
.kf-foot-end-in { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 92px; font-size: 13px; }
.kf-foot-end small { color: rgb(255 255 255 / .7); text-align: start; }
.kf-foot-end nav { display: flex; gap: 26px; }
.kf-foot-end nav a { transition: color .2s; }
.kf-foot-end nav a:hover { color: var(--kf-tan); }
.kf-socials { display: flex; gap: 4px; }
.kf-socials a { display: grid; place-items: center; width: 34px; height: 34px; color: #fff; transition: color .2s, transform .3s; }
.kf-socials a:hover { color: var(--kf-tan); transform: translateY(-3px); }
.kf-socials .p-ico { width: 16px; height: 16px; }

/* Menu: two columns of round pictures, a name with a dotted leader and the price */
.kf-jump { position: sticky; top: 0; z-index: 20; background: #fff; border-bottom: 1px solid #EEE7DE; }
.kf-jump .kf-wrap { display: flex; justify-content: center; gap: 8px; padding-block: 14px; overflow-x: auto; scrollbar-width: none; }
.kf-jump a { flex: none; padding: 8px 18px; border: 1px solid #E7DCCF; font-size: 14px; transition: background .2s, color .2s, border-color .2s; }
.kf-jump a:hover { background: var(--kf-tan); border-color: var(--kf-tan); color: #fff; }
section[id^="kf-cat-"] { scroll-margin-top: 70px; }
.kf-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 34px 60px; }
.kf-dish { display: flex; align-items: center; gap: 22px; }
.kf-dish-pic { display: grid; place-items: center; flex: none; width: 76px; height: 76px; border-radius: 50%; overflow: hidden; background: var(--kf-paper); transition: transform .5s cubic-bezier(.2, .8, .2, 1.4); }
.kf-dish:hover .kf-dish-pic { transform: rotate(-12deg) scale(1.06); }
.kf-dish-pic img { width: 100%; height: 100%; object-fit: cover; }
.kf-dish-pic i { font-style: normal; font-family: var(--kf-head); font-size: 28px; color: var(--kf-tan); }
.kf-dish > div { flex: 1; min-width: 0; display: grid; gap: 6px; }
.kf-dish-line { display: flex; align-items: baseline; gap: 10px; }
.kf-dish-line b { font-family: var(--kf-head); font-size: 22px; font-weight: 500; }
.kf-dots { flex: 1; min-width: 20px; border-bottom: 1px dotted #C9BBAA; transform: translateY(-5px); }
.kf-dish p { color: var(--kf-muted); font-size: 13px; }
.kf-tag { padding: 1px 8px; background: var(--kf-tan); color: #fff; font-size: 11px; font-style: normal; }
.kf-out { opacity: .55; }
.kf-soldout { color: #B4483B; font-size: 13px; font-weight: 700; }

/* About */
.kf-about { display: grid; justify-items: center; }
.kf-branch { width: 170px; height: auto; margin-bottom: 10px; }
.kf-branch img { object-fit: contain; height: auto; }
.kf-about .kf-title { margin-bottom: 56px; }
.kf-about .kf-title p { max-width: 640px; }
.kf-about-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 46px; width: 100%; }
.kf-about-cards > div { display: grid; gap: 20px; align-content: start; color: var(--kf-muted); font-size: 14px; line-height: 2; }
.kf-about-cards > div > div { display: grid; gap: 10px; }
.kf-about-pic { aspect-ratio: 800 / 541; }
.kf-about-pic img { transition: transform 1.2s cubic-bezier(.2, .8, .2, 1); }
.kf-about-cards > div:hover .kf-about-pic img { transform: scale(1.05); }
.kf-quotes { position: relative; isolation: isolate; overflow: hidden; padding-block: 110px; background: var(--kf-dark); color: #fff; text-align: center; }
.kf-quotes-bg { position: absolute; inset: 0; z-index: -1; }
.kf-quotes-bg img { width: 100%; height: 100%; object-fit: cover; opacity: .35; }
.kf-quotes-in { display: grid; justify-items: center; }
.kf-quotes .kf-title { margin-bottom: 40px; }
.kf-quote-stack { display: grid; max-width: 760px; }
.kf-quote { grid-area: 1 / 1; display: grid; gap: 22px; opacity: 0; visibility: hidden; transform: translateY(14px); transition: opacity .7s, transform .7s, visibility .7s; }
.kf-quote:only-child, ${[1, 2, 3, 4, 5, 6].map((n) => `.kf-dot:nth-of-type(${n}):checked ~ .kf-quote-stack .kf-quote:nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; transform: none; }
.kf-quote blockquote { font-size: 17px; line-height: 2.1; }
.kf-quote figcaption { font-size: 14px; color: rgb(255 255 255 / .8); }
.kf-quote figcaption b { color: #fff; }
.kf-qdots { display: flex; gap: 10px; margin-top: 34px; }
.kf-qdots label { width: 9px; height: 9px; border-radius: 50%; background: rgb(255 255 255 / .35); cursor: pointer; transition: background .3s, transform .3s; }
${[1, 2, 3, 4, 5, 6].map((n) => `.kf-dot:nth-of-type(${n}):checked ~ .kf-qdots label:nth-child(${n})`).join(", ")} { background: #fff; transform: scale(1.3); }

/* What we offer: photo and text tiles in a 4 × 2 grid */
.kf-tiles { display: grid; grid-template-columns: repeat(4, 1fr); }
.kf-tile { aspect-ratio: 1; }
.kf-tile-pic { position: relative; background: var(--kf-paper); }
.kf-tile-pic img { transition: transform 1s cubic-bezier(.2, .8, .2, 1); }
.kf-tile-pic:hover img { transform: scale(1.07); }
.kf-tile-text { display: grid; align-content: center; justify-items: center; gap: 18px; padding: 24px; background: #FDF3E6; text-align: center; font-size: 14px; line-height: 2; color: var(--kf-muted); }
.kf-tile-text h3 { font-family: var(--kf-head); font-size: 26px; font-weight: 500; color: var(--kf-ink); }
.kf-tile-text p { white-space: pre-line; }
.kf-tile-text a { color: var(--kf-ink); font-weight: 600; }

/* Contact */
.kf-contact { display: grid; grid-template-columns: 1fr 1.15fr; gap: 70px; align-items: start; }
.kf-contact > div { display: grid; gap: 22px; }
.kf-contact h1 { font-family: var(--kf-head); font-size: clamp(30px, 3cqi, 40px); font-weight: 500; }
.kf-contact p { color: var(--kf-muted); line-height: 2; }
.kf-contact ul { display: grid; gap: 10px; padding-inline-start: 20px; color: var(--kf-muted); font-size: 14px; }
.kf-contact li::marker { color: var(--kf-tan); }
.kf-contact-socials { display: flex; gap: 6px; }
.kf-contact-socials a { display: grid; place-items: center; width: 34px; height: 34px; color: var(--kf-muted); transition: color .2s; }
.kf-contact-socials a:hover { color: var(--kf-tan); }
.kf-contact-socials .p-ico { width: 15px; height: 15px; }
.kf-form { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.kf-form input, .kf-form textarea { width: 100%; box-sizing: border-box; height: 54px; padding: 0 18px; border: 1px solid #DDD4C8; background: #fff; font: inherit; font-size: 14px; transition: border-color .3s; }
.kf-form textarea { height: auto; min-height: 140px; padding-block: 14px; resize: vertical; }
.kf-form input:focus, .kf-form textarea:focus { outline: none; border-color: var(--kf-tan); }
.kf-full { grid-column: 1 / -1; }
.kf-form .kf-btn { justify-self: start; }
.kf-where { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: stretch; padding-bottom: 100px; }
.kf-where-text { display: grid; align-content: center; justify-items: start; gap: 16px; padding: 34px 38px; background: var(--kf-paper); }
.kf-where-text h2 { font-family: var(--kf-head); font-size: clamp(26px, 2.6cqi, 34px); font-weight: 500; }
.kf-where-text .kf-beans::before { display: none; }
.kf-where-text dl { display: grid; grid-template-columns: auto 1fr; gap: 14px 26px; margin: 4px 0 8px; font-size: 14px; line-height: 1.9; }
.kf-where-text dt { font-family: var(--kf-head); font-size: 18px; color: var(--kf-ink); }
.kf-where-text dd { display: grid; margin: 0; color: var(--kf-muted); white-space: pre-line; }
.kf-where-text dd a:hover { color: var(--kf-tan); }
.kf-map { display: grid; place-items: center; min-height: 340px; border: 1px solid #E6DCCF; background: var(--kf-paper); color: var(--kf-muted); font-size: 13px; text-align: center; overflow: hidden; }
.kf-map iframe { width: 100%; height: 100%; border: 0; filter: sepia(.35) saturate(.7); }

/* Reveal on scroll where the browser supports scroll timelines */
@supports (animation-timeline: view()) {
  .kf-rise { animation: kf-rise linear both; animation-timeline: view(); animation-range: entry calc(var(--i, 0) * 5%) entry calc(65% + var(--i, 0) * 5%); }
  @keyframes kf-rise { from { opacity: 0; transform: translateY(36px); } }
}

@container (max-width: 1000px) {
  .kf-icons, .kf-stats, .kf-favs { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 50px; }
  .kf-tiles { grid-template-columns: repeat(2, 1fr); }
  .kf-contact { grid-template-columns: 1fr; gap: 46px; }
  .kf-where { grid-template-columns: 1fr; }
  .kf-map { min-height: 300px; }
}
@container (max-width: 760px) {
  .kf { font-size: 14px; }
  .kf-wrap { padding-inline: 18px; }
  .kf-sec { padding-block: 64px; }
  .kf-title { margin-bottom: 40px; }
  .kf-head-in { min-height: 76px; }
  .kf-home .kf-head { margin-bottom: -76px; }
  .kf-logo img { height: 44px; }
  .kf-nav { display: none; }
  .kf-burger { display: block; }
  .kf-burger summary { display: grid; place-items: center; width: 40px; height: 40px; list-style: none; cursor: pointer; }
  .kf-burger summary::-webkit-details-marker { display: none; }
  .kf-burger summary span, .kf-burger summary span::before, .kf-burger summary span::after { position: relative; display: block; width: 24px; height: 2px; background: #fff; transition: transform .3s, background .3s; }
  .kf-burger summary span::before, .kf-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .kf-burger summary span::before { top: -7px; }
  .kf-burger summary span::after { top: 7px; }
  .kf-burger[open] summary span { background: transparent; }
  .kf-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .kf-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .kf-drawer { position: absolute; inset-inline: 0; top: 100%; display: grid; padding: 8px 18px 18px; background: var(--kf-dark); animation: kf-drop .35s ease both; }
  @keyframes kf-drop { from { opacity: 0; transform: translateY(-10px); } }
  .kf-drawer a { padding: 13px 4px; border-top: 1px solid rgb(255 255 255 / .08); color: #fff; font-weight: 600; }
  .kf-drawer a[aria-current="page"] { color: var(--kf-tan); }
  .kf-head-in { position: relative; }
  .kf-slide { min-height: 560px; }
  .kf-slide { justify-items: center; }
  .kf-slide-text { margin-inline: auto; }
  .kf-slide-pic { width: 100%; -webkit-mask-image: none; mask-image: none; opacity: .55; }
  .kf-slide-text { padding-top: 110px; }
  .kf-hero-badge img { width: 88px; }
  .kf-arrow { display: none; }
  .kf-stories, .kf-about-cards, .kf-menu { grid-template-columns: 1fr; }
  .kf-icons, .kf-stats { gap: 40px 16px; }
  .kf-favs { gap: 30px 16px; }
  .kf-fav b, .kf-icon-card b { font-size: 19px; }
  .kf-gallery { grid-template-columns: repeat(2, 1fr); }
  .kf-logos { grid-template-columns: repeat(2, 1fr); padding-block: 50px; }
  .kf-logos span { width: 130px; height: 90px; }
  .kf-cta { flex-direction: column; text-align: center; padding-block: 50px; }
  .kf-tiles { grid-template-columns: 1fr 1fr; }
  .kf-tile-text { padding: 16px; font-size: 13px; }
  .kf-tile-text h3 { font-size: 21px; }
  .kf-menu { gap: 26px; }
  .kf-dish { gap: 14px; }
  .kf-dish-pic { width: 62px; height: 62px; }
  .kf-dish-line b { font-size: 19px; }
  .kf-jump .kf-wrap { justify-content: flex-start; }
  .kf-form { grid-template-columns: 1fr; }
  .kf-foot-end-in { flex-direction: column; justify-content: center; padding-block: 24px; text-align: center; }
  .kf-foot-end nav { flex-wrap: wrap; justify-content: center; gap: 16px; }
  .kf-foot-end small { text-align: center; }
  .kf-foot-bg { height: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .kf *, .kf *::before, .kf *::after { animation: none !important; transition: none !important; }
  .kf-auto:checked ~ .kf-slides > .kf-slide:first-child { opacity: 1; visibility: visible; }
}
`;
