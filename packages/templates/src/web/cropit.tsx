/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Crop It": a photographer's studio site rebuilt from the Crop It reference, in Persian. Hero slider,
// the photographer, eight photo categories, an Instagram row, work experience and skills, a "work with
// me" band, reviews and partner logos; pages: our services (specialities, services, price plans),
// about us (mission tabs, team), gallery (filtered by category), blog with posts, contact.
// Price plans open a booking form; every form is saved in the owner's inbox. No scripts: the sliders,
// tabs and the gallery filter use radios, the side menu and search use <details>.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { formatYearMonth, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { mapEmbed } from "./golsara";

export const CROPIT_BLOCKS = [
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "me", label: "معرفی عکاس" },
  { key: "cats", label: "دسته‌های عکس" },
  { key: "instagram", label: "ردیف اینستاگرام" },
  { key: "cv", label: "سوابق و مهارت‌ها" },
  { key: "work", label: "نوار «با من کار کنید»" },
  { key: "quotes", label: "نظر مشتری‌ها" },
  { key: "logos", label: "لوگوی همکاران" },
  { key: "newsletter", label: "خبرنامه‌ی پایین صفحه" },
] as const;

export const CROPIT_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const plansOf = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && pageOn(data, "/blog");

export function cropitPages(data: ResumeData): string[] {
  const blog = hasBlog(data) ? ["/blog", ...livePosts(data.site?.shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", "/services", ...(pageOn(data, "/about") ? ["/about"] : []), "/gallery", ...blog, "/contact"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };
/** Pages whose top is a big photo under a see-through header. */
const PHOTO_TOP = ["/", "/services", "/about"];

export function CropitSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = cropitPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : page === "/services" ? <Services {...view} />
    : page === "/about" ? <About {...view} />
    : page === "/gallery" ? <Gallery {...view} />
    : kind === "blog" ? (id ? <Post {...view} id={id} /> : <Blog {...view} />)
    : <Contact {...view} />;
  return (
    <WebPage ctx={ctx} className={`cr${PHOTO_TOP.includes(page) ? " cr-over" : ""}`} css={partsCss + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const day = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(d) : undefined;
};

/** The three short dashes of the reference, under titles and before small headings. */
const Dash = ({ className = "" }: { className?: string }) => <i className={`cr-dash ${className}`} aria-hidden="true" />;

function Title({ children, sub, light }: { children: ReactNode; sub?: ReactNode; light?: boolean }) {
  return (
    <div className={`cr-title${light ? " light" : ""}`}>
      <h2>{children}</h2>
      <Dash />
      {sub}
    </div>
  );
}

function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`cr-pic ${className ?? ""}`} {...ed(path, "image", label)}>
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

const ICONS: Record<string, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M6 6l12 12M18 6L6 18",
  prev: "M9 4l8 8-8 8",
  next: "M15 4l-8 8 8 8",
  chev: "M15 6l-6 6 6 6",
  insta: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01",
  quote: "M4 17h5l2-4V7H5v6h3zM13 17h5l2-4V7h-6v6h3z",
};
function Svg({ name, className = "cr-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Line icons of the six services (used in order, when a service has no icon picture of its own). */
const SERVICE_ICONS = [
  "M3 12V5h7l10 10-7 7zM7.5 8.5h.01",
  "M19 3c-6 3-10 8-12 13l1 1c5-2 10-6 13-12zM7 16c-2 0-3 2-3 5 3 0 5-1 5-3",
  "M4 7h4l2-2h4l2 2h4v12H4zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  "M3 4h18v12H3zM9 20h6M12 16v4",
  "M4 9h11v9H4zM15 12l5-3v9l-5-3M7 9a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM12.5 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
  "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
];

/**
 * Radios for a set of slides, tabs or filters, with the rules that show the chosen one written next
 * to them (they depend on the number of items). "show" is the CSS for the chosen item.
 */
function radioRules(id: string, n: number, show: (k: number) => string) {
  return Array.from({ length: n }, (_, k) => show(k)).join("\n");
}

/* ───────────── Header and footer ───────────── */

function menuItems(view: View) {
  const data = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    { to: "/services", label: "خدمات ما" },
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    { to: "/gallery", label: "گالری" },
    ...(hasBlog(data) ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس" },
  ];
}
const isCurrent = (view: View, to: string) => (to === "/" ? view.page === "/" : view.page.startsWith(to));

function Logo({ view, light }: { view: View; light?: boolean }) {
  const b = view.ctx.data.basics;
  const site = view.ctx.data.site;
  const dark = safeUrl(b.avatarUrl);
  const white = safeUrl(site?.signatureImage) ?? dark;
  const src = light ? white : dark;
  return (
    <PageLink to="/" link={view.link} className="cr-logo">
      {src ? (
        <img src={src} alt={b.fullName} {...ed(light ? "site.signatureImage" : "basics.avatarUrl", "image", light ? "لوگوی روشن (روی عکس)" : "لوگو")} />
      ) : (
        <b {...ed("basics.fullName", "text", "نام")}>{b.fullName}</b>
      )}
    </PageLink>
  );
}

function Header(view: View) {
  const { ctx, link, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const over = PHOTO_TOP.includes(view.page);
  const nav = menuItems(view).map((m) => (
    <PageLink key={m.to} to={m.to} link={link} current={isCurrent(view, m.to)}>
      {m.label}
    </PageLink>
  ));
  return (
    <header className="cr-head">
      <div className="cr-head-in">
        <Logo view={view} light={over} />
        <nav className="cr-nav">{nav}</nav>
        <div className="cr-tools">
          {hasBlog(ctx.data) && (
            <details className="cr-search">
              <summary aria-label="جستجو">
                <Svg name="search" />
              </summary>
              <form method="get" action={link("/blog")}>
                <input name="q" placeholder="جستجو در مطالب…" aria-label="جستجو در مطالب" />
                <button type="submit" aria-label="جستجو">
                  <Svg name="search" />
                </button>
              </form>
            </details>
          )}
          {/* Side menu: the pages on a phone; on a wide screen the contacts and the socials. */}
          <details className="cr-side">
            <summary aria-label="منو">
              <Svg name="menu" />
            </summary>
            <div className="cr-side-panel">
              <Svg name="close" className="cr-ico cr-side-x" />
              <Logo view={view} />
              <nav className="cr-side-nav">{nav}</nav>
              <div className="cr-side-info">
                <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
                  <p {...ed("site.address", "text", "نشانی")}>{site?.address}</p>
                </Opt>
                {b.phone && (
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                    {b.phone}
                  </a>
                )}
                {b.email && (
                  <a href={`mailto:${b.email}`} dir="ltr">
                    {b.email}
                  </a>
                )}
                <Socials ctx={ctx} editing={editing} className="cr-side-socials" />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const thumbs = instaOf(ctx.data).slice(0, 6);
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  return (
    <footer className="cr-foot">
      <div className="cr-wrap cr-foot-cols">
        <div>
          <h4>
            <Dash /> راه‌های تماس
          </h4>
          <dl className="cr-foot-info">
            <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
              <div>
                <dt>نشانی:</dt>
                <dd {...ed("site.address", "text", "نشانی")}>{site?.address}</dd>
              </div>
            </Opt>
            {b.phone && (
              <div>
                <dt>تلفن:</dt>
                <dd>
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                    {b.phone}
                  </a>
                </dd>
              </div>
            )}
            {b.email && (
              <div>
                <dt>ایمیل:</dt>
                <dd>
                  <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                    {b.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div>
          <h4>
            <Dash /> گالری
          </h4>
          <div className="cr-foot-gal">
            {thumbs.map((g) => (
              <ZoomOpen key={g.id} id={g.id} className="cr-foot-thumb">
                <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
              </ZoomOpen>
            ))}
          </div>
        </div>
        <div>
          <h4>
            <Dash /> لینک‌ها
          </h4>
          <nav className="cr-foot-links">
            {menuItems(view).map((m) => (
              <PageLink key={m.to} to={m.to} link={link}>
                <Svg name="chev" /> {m.label}
              </PageLink>
            ))}
            {pages.map((p) => (
              <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
                <Svg name="chev" /> {p.title}
              </PageLink>
            ))}
          </nav>
        </div>
        <div>
          {blockOn(ctx.data, "newsletter") && (
            <>
              <h4>
                <Dash /> در تماس بمانید
              </h4>
              <form method="post" action={link("/_form")} className="cr-news">
                <FormMeta kind="newsletter" back={view.page} />
                <input name="email" type="email" required placeholder="ایمیل خود را بنویسید" aria-label="ایمیل" dir="auto" />
                <button type="submit">عضویت</button>
              </form>
            </>
          )}
          <h5>ما را دنبال کنید:</h5>
          <Socials ctx={ctx} editing={editing} className="cr-foot-socials" />
        </div>
      </div>
      <div className="cr-foot-end">
        © {fa(new Date().getFullYear())} {b.fullName}
      </div>
    </footer>
  );
}

/* ───────────── Shared sections ───────────── */

type Photo = NonNullable<ResumeData["site"]>["gallery"][number];
/** Photos without a category make the Instagram row and the footer thumbnails. */
const instaOf = (data: ResumeData) => (data.site?.gallery ?? []).filter((g) => safeUrl(g.image) && !g.description?.trim());
/** Gallery photos: those with a category (the photo's "description" holds the category name). */
const galleryOf = (data: ResumeData) => (data.site?.gallery ?? []).filter((g) => safeUrl(g.image) && g.description?.trim());

/** A big photo with a title and a button; the home page shows several (a slider). */
type Slide = { id: string; image?: string; title?: string; text?: string; imagePath: string; titlePath: string; textPath?: string; button?: string; to?: string };
function PhotoTop({ view, slides }: { view: View; slides: Slide[] }) {
  const id = "cr-hero";
  const n = slides.length;
  const rules = radioRules(id, n, (k) => `#${id}-${k}:checked ~ .cr-slides .cr-slide:nth-child(${k + 1}) { opacity: 1; visibility: visible; z-index: 1; } #${id}-${k}:checked ~ .cr-slide-nav .cr-nav-${k} { display: grid; }`);
  return (
    <section className={`cr-hero${n > 1 ? " is-slider" : ""}`}>
      {n > 1 && <style dangerouslySetInnerHTML={{ __html: rules }} />}
      {n > 1 && slides.map((_, k) => <input key={k} type="radio" name={id} id={`${id}-${k}`} defaultChecked={k === 0} className="cr-radio" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      <div className="cr-slides">
        {slides.map((s) => {
          const url = safeUrl(s.image);
          return (
            <div key={s.id} className="cr-slide">
              <span className="cr-slide-pic" {...ed(s.imagePath, "image", "عکس")}>
                {url && <img src={url} alt="" />}
              </span>
              <div className="cr-wrap cr-slide-text">
                {s.title && <h1 {...ed(s.titlePath, "text", "تیتر")}>{s.title}</h1>}
                {s.text && s.textPath && <p {...ed(s.textPath, "text", "متن زیر تیتر")}>{s.text}</p>}
                {s.button && (
                  <PageLink to={s.to ?? "/about"} link={view.link} className="cr-btn">
                    {s.button}
                  </PageLink>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="cr-slide-nav">
          {slides.map((_, k) => (
            <span key={k} className={`cr-nav-${k}`}>
              <label htmlFor={`${id}-${(k - 1 + n) % n}`} className="cr-arrow prev" aria-label="قبلی">
                <Svg name="prev" />
              </label>
              <label htmlFor={`${id}-${(k + 1) % n}`} className="cr-arrow next" aria-label="بعدی">
                <Svg name="next" />
              </label>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Instagram({ view }: { view: View }) {
  const pics = instaOf(view.ctx.data).slice(0, 4);
  const insta = view.ctx.data.basics.links.find((l) => l.type === "instagram");
  const href = safeUrl(insta?.url);
  if (!pics.length && !view.editing) return null;
  return (
    <section className="cr-insta">
      <div className="cr-insta-bar">
        <h2>
          <Dash /> اینستاگرام من
        </h2>
        {href && (
          <a href={href} {...outside(href)} className="cr-follow">
            <Svg name="insta" /> دنبال کنید
          </a>
        )}
      </div>
      <div className="cr-insta-row">
        {pics.map((g) => (
          <ZoomOpen key={g.id} id={g.id} className="cr-insta-pic">
            <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس")} />
          </ZoomOpen>
        ))}
        {view.editing && pics.length < 4 && (
          <span className="cr-insta-pic cr-add" {...ed("site.gallery", "newimage", "افزودن عکس")}>
            +
          </span>
        )}
      </div>
    </section>
  );
}

/** Work experience (dates and titles from the resume) beside the skills as bars. */
function Cv({ view }: { view: View }) {
  const { ctx } = view;
  const data = ctx.data;
  const jobs = data.experience.slice(0, 6);
  const skills = data.skills.slice(0, 6);
  if (!jobs.length && !skills.length) return null;
  return (
    <section className="cr-sec cr-wrap cr-cv">
      {jobs.length > 0 && (
        <div>
          <h2 className="cr-h2">
            <Dash /> سوابق کاری
          </h2>
          <ul className="cr-jobs">
            {jobs.map((j) => {
              const at = item("experience", j.id);
              return (
                <li key={j.id}>
                  <b>{formatYearMonth(j.period.start, data.locale, ctx.theme.display.dateFormat)}</b> – <em {...ed(`${at}.position`, "text", "عنوان")}>{j.position}</em>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {skills.length > 0 && (
        <div>
          <h2 className="cr-h2">
            <Dash /> مهارت‌های من
          </h2>
          <ul className="cr-bars">
            {skills.map((s) => {
              const pct = (s.level ?? 4) * 20 - (s.level === 5 ? 5 : 0);
              return (
                <li key={s.id}>
                  <span style={{ "--w": `${pct}%` } as CSSProperties}>
                    <b {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>{s.name}</b>
                    <small>{fa(pct)}٪</small>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

/** "Ready to start? Work with me" band over a photo. */
function WorkBand({ view, title }: { view: View; title: string }) {
  const { shop, link, editing } = view;
  const url = safeUrl(shop.newImage);
  return (
    <section className="cr-work">
      <span className="cr-work-pic" {...ed("site.shop.newImage", "image", "عکس پشت نوار")}>
        {url && <img src={url} alt="" loading="lazy" />}
      </span>
      <div className="cr-wrap cr-work-text">
        <small>آماده‌اید شروع کنیم؟</small>
        <h2>{title}</h2>
        <Dash />
        <Opt value={shop.newText} editing={editing} edit={ed("site.shop.newText", "text", "متن")}>
          <p {...ed("site.shop.newText", "text", "متن")}>{shop.newText}</p>
        </Opt>
        <PageLink to="/contact" link={link} className="cr-btn light">
          رزرو جلسه
        </PageLink>
      </div>
    </section>
  );
}

function Quotes({ view }: { view: View }) {
  const quotes = (view.ctx.data.site?.testimonials ?? []).filter((t) => !t.hidden).slice(0, 6);
  if (!quotes.length) return null;
  const id = "cr-qt";
  const n = quotes.length;
  const rules = radioRules(id, n, (k) => `#${id}-${k}:checked ~ .cr-quotes-view .cr-quote:nth-child(${k + 1}) { display: grid; } #${id}-${k}:checked ~ .cr-quote-nav .cr-qnav-${k} { display: contents; } #${id}-${k}:checked ~ .cr-dots label:nth-child(${k + 1}) { background: currentColor; }`);
  return (
    <section className="cr-sec cr-wrap cr-quotes">
      <Title>نظر مشتری‌ها</Title>
      <style dangerouslySetInnerHTML={{ __html: rules }} />
      {quotes.map((_, k) => (
        <input key={k} type="radio" name={id} id={`${id}-${k}`} defaultChecked={k === 0} className="cr-radio" aria-label={`نظر ${fa(k + 1)}`} />
      ))}
      <div className="cr-quotes-view">
        {quotes.map((t) => {
          const at = item("site.testimonials", t.id);
          const face = safeUrl(t.image);
          return (
            <figure key={t.id} className="cr-quote">
              <span className="cr-face" {...ed(`${at}.image`, "image", "عکس")}>
                {face && <img src={face} alt={t.name} loading="lazy" />}
              </span>
              <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>
                <Svg name="quote" className="cr-ico cr-q1" />
                {t.text}
                <Svg name="quote" className="cr-ico cr-q2" />
              </blockquote>
              <figcaption>
                <b {...ed(`${at}.name`, "text", "نام")}>{t.name}</b>
                {t.role && <small {...ed(`${at}.role`, "text", "سمت")}>{t.role}</small>}
              </figcaption>
            </figure>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <div className="cr-quote-nav">
            {quotes.map((_, k) => (
              <span key={k} className={`cr-qnav-${k}`}>
                <label htmlFor={`${id}-${(k - 1 + n) % n}`} className="cr-qarrow prev" aria-label="قبلی">
                  <Svg name="prev" />
                </label>
                <label htmlFor={`${id}-${(k + 1) % n}`} className="cr-qarrow next" aria-label="بعدی">
                  <Svg name="next" />
                </label>
              </span>
            ))}
          </div>
          <div className="cr-dots">
            {quotes.map((_, k) => (
              <label key={k} htmlFor={`${id}-${k}`} aria-label={`نظر ${fa(k + 1)}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Logos({ view }: { view: View }) {
  const logos = (view.ctx.data.site?.clients ?? []).filter((c) => safeUrl(c.image)).slice(0, 8);
  if (!logos.length) return null;
  return (
    <section className="cr-wrap cr-logos">
      {logos.map((c) => (
        <span key={c.id} className="cr-logo-item" title={c.name} {...ed(`${item("site.clients", c.id)}.image`, "image", "لوگو")}>
          <img src={safeUrl(c.image)} alt={c.name} loading="lazy" />
        </span>
      ))}
    </section>
  );
}

/** The six services with line icons, in a grid with thin lines between them. */
function ServicesGrid({ view }: { view: View }) {
  const items = (view.shop.perks ?? []).slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="cr-sec cr-wrap">
      <Title>خدمات ما</Title>
      <div className="cr-services">
        {items.map((x, k) => {
          const at = item("site.shop.perks", x.id);
          const icon = safeUrl(x.image);
          return (
            <article key={x.id} className="cr-service">
              {icon ? (
                <img src={icon} alt="" className="cr-service-ico" {...ed(`${at}.image`, "image", "آیکون")} />
              ) : (
                <svg viewBox="0 0 24 24" className="cr-service-ico" aria-hidden="true">
                  <path d={SERVICE_ICONS[k % SERVICE_ICONS.length]} />
                </svg>
              )}
              <h3 {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</h3>
              {x.text && <p {...ed(`${at}.text`, "text", "متن")}>{x.text}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, shop, editing, link } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const slides = (shop.slides ?? []).filter((s) => safeUrl(s.image));
  const cats = shop.categories.filter((c) => safeUrl(c.image)).slice(0, 8);
  return (
    <>
      {on("hero") && slides.length > 0 && (
        <PhotoTop
          view={view}
          slides={slides.map((s) => {
            const at = item("site.shop.slides", s.id);
            return { id: s.id, image: s.image, title: s.title, text: s.text, imagePath: `${at}.image`, titlePath: `${at}.title`, textPath: `${at}.text`, button: "بیشتر بدانید" };
          })}
        />
      )}

      {on("me") && (
        <section className="cr-grey">
          <div className="cr-wrap cr-me">
            <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس عکاس" className="cr-me-pic" />
            <div className="cr-me-text">
              <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "خط بالای نام")}>
                <small {...ed("site.aboutCaption", "text", "خط بالای نام")}>{site?.aboutCaption}</small>
              </Opt>
              <h2 {...ed("basics.fullName", "text", "نام")}>{data.basics.fullName}</h2>
              <Dash />
              <Opt value={data.basics.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی")}>
                <div className="cr-body" {...ed("basics.summary", "multiline", "معرفی")}>
                  <Para text={data.basics.summary} />
                </div>
              </Opt>
              <PageLink to={pageOn(data, "/about") ? "/about" : "/services"} link={link} className="cr-btn">
                همه چیز درباره‌ی من
              </PageLink>
            </div>
          </div>
        </section>
      )}

      {on("cats") && cats.length > 0 && (
        <section className="cr-wrap cr-cats">
          {cats.map((c) => (
            <PageLink key={c.id} to="/gallery" link={link} className="cr-cat">
              <span className="cr-cat-pic" {...ed(`${item("site.shop.categories", c.id)}.image`, "image", "عکس دسته")}>
                <img src={safeUrl(c.image)} alt="" loading="lazy" />
              </span>
              <b>{c.name}</b>
            </PageLink>
          ))}
        </section>
      )}

      {on("instagram") && <Instagram view={view} />}
      {on("cv") && <Cv view={view} />}
      {on("work") && <WorkBand view={view} title="با من کار کنید" />}
      {on("quotes") && <Quotes view={view} />}
      {on("logos") && <Logos view={view} />}
    </>
  );
}

/* ───────────── Services ───────────── */

function Services(view: View) {
  const { shop, editing } = view;
  const cats = shop.categories.filter((c) => safeUrl(c.image) && c.text).slice(0, 3);
  const plans = plansOf(shop).slice(0, 3);
  const bg = safeUrl(shop.lookImage);
  return (
    <>
      <PhotoTop view={view} slides={[{ id: "sv", image: shop.trendImage, title: shop.bestTitle, imagePath: "site.shop.trendImage", titlePath: "site.shop.bestTitle", button: "رزرو جلسه", to: "/contact" }]} />
      {cats.length > 0 && (
        <section className="cr-sec cr-wrap">
          <Title>تخصص‌های ما</Title>
          <div className="cr-specs">
            {cats.map((c) => {
              const at = item("site.shop.categories", c.id);
              return (
                <article key={c.id} className="cr-spec">
                  <Pic src={c.image} path={`${at}.image`} label="عکس" className="cr-spec-pic" />
                  <h3>{c.name}</h3>
                  {c.text && (
                    <div className="cr-spec-text" {...ed(`${at}.text`, "multiline", "متن")}>
                      <Para text={c.text} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      <ServicesGrid view={view} />
      {plans.length > 0 && (
        <section className="cr-plans-block">
          <span className="cr-plans-bg" {...ed("site.shop.lookImage", "image", "عکس پشت قیمت‌ها")}>
            {bg && <img src={bg} alt="" loading="lazy" />}
          </span>
          <div className="cr-wrap cr-plans">
            {plans.map((p, k) => (
              <Plan key={p.id} view={view} p={p} k={k} />
            ))}
          </div>
        </section>
      )}
      {editing && plans.length === 0 && <p className="cr-wrap cr-hint">پکیج‌های عکاسی (قیمت‌ها) را در پنل مدیریت، بخش «پکیج‌ها» اضافه کنید.</p>}
      <Quotes view={view} />
      <WorkBand view={view} title="با ما کار کنید" />
    </>
  );
}

function Plan({ view, p, k }: { view: View; p: Product; k: number }) {
  const lines = (p.description ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <article className={`cr-plan tone-${k % 3}`} data-product={p.id}>
      <div className="cr-plan-head">
        <h3>{p.name}</h3>
        {/* The number big, the unit small under it (a full price in tomans is long). */}
        <b>{fa(Math.round((p.salePrice ?? p.price) / 1000))}</b>
        <small>هزار تومان</small>
      </div>
      <ul>
        {lines.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <PageLink to={`/contact`} link={(path) => `${view.link(path)}?plan=${encodeURIComponent(p.id)}#cr-form`} className="cr-btn">
        سفارش این پکیج
      </PageLink>
    </article>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, shop, editing, link } = view;
  const site = ctx.data.site;
  const tabs = [
    { key: "a", label: "ماموریت", title: site?.aboutTitle, text: site?.aboutText, path: "site.aboutTitle", textPath: "site.aboutText" },
    { key: "b", label: "اصول", title: site?.styleTitle, text: site?.styleText, path: "site.styleTitle", textPath: "site.styleText" },
    { key: "c", label: "فلسفه", title: shop.promoTitle, text: shop.promoText, path: "site.shop.promoTitle", textPath: "site.shop.promoText" },
  ].filter((t) => t.title || t.text || editing);
  // The first tile is the team's title; six faces fill the rest (two beside it, four under it).
  const team = (shop.banners ?? []).filter((x) => !x.hidden && safeUrl(x.image)).slice(0, 7);
  const [lead, ...members] = team;
  return (
    <>
      <PhotoTop view={view} slides={[{ id: "ab", image: shop.discoverImage, title: shop.discoverTitle, imagePath: "site.shop.discoverImage", titlePath: "site.shop.discoverTitle", button: "دیدن گالری", to: "/gallery" }]} />
      <section className="cr-grey">
        <div className="cr-wrap cr-me cr-tabs">
          <Pic src={site?.accentImage} path="site.accentImage" label="عکس کنار متن" className="cr-me-pic" />
          <div className="cr-me-text">
            {tabs.map((t, k) => (
              <input key={t.key} type="radio" name="cr-tab" id={`cr-tab-${t.key}`} defaultChecked={k === 0} className="cr-radio" />
            ))}
            <div className="cr-tab-heads">
              {tabs.map((t) => (
                <label key={t.key} htmlFor={`cr-tab-${t.key}`}>
                  {t.label}
                </label>
              ))}
            </div>
            {tabs.map((t) => (
              <div key={t.key} className={`cr-tab tab-${t.key}`}>
                <h2 {...ed(t.path, "text", "تیتر")}>{t.title}</h2>
                <Dash />
                <div className="cr-body" {...ed(t.textPath, "multiline", "متن")}>
                  <Para text={t.text} />
                </div>
                <PageLink to="/services" link={link} className="cr-btn">
                  خدمات ما
                </PageLink>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ServicesGrid view={view} />
      {lead && (
        <section className="cr-team">
          <figure className="cr-team-lead">
            <Pic src={lead.image} path={`${item("site.shop.banners", lead.id)}.image`} label="عکس" className="cr-team-pic" />
            <figcaption>
              <h2 {...ed(`${item("site.shop.banners", lead.id)}.title`, "text", "تیتر")}>{lead.title}</h2>
              {lead.text && <p {...ed(`${item("site.shop.banners", lead.id)}.text`, "text", "متن")}>{lead.text}</p>}
            </figcaption>
          </figure>
          {members.map((m) => {
            const at = item("site.shop.banners", m.id);
            return (
              <figure key={m.id} className="cr-member">
                <Pic src={m.image} path={`${at}.image`} label="عکس عضو تیم" className="cr-team-pic" />
                <figcaption>
                  <b {...ed(`${at}.title`, "text", "نام")}>{m.title}</b>
                  {m.kicker && <small {...ed(`${at}.kicker`, "text", "سمت")}>{m.kicker}</small>}
                </figcaption>
              </figure>
            );
          })}
        </section>
      )}
      <Cv view={view} />
      <Instagram view={view} />
      <Quotes view={view} />
      <WorkBand view={view} title="با ما کار کنید" />
    </>
  );
}

/* ───────────── Gallery ───────────── */

function Gallery(view: View) {
  const photos = galleryOf(view.ctx.data);
  const names = [...new Set(photos.map((g) => g.description!.trim()))].slice(0, 8);
  // Filter radios: "all", then one per category; the photos of other categories hide.
  const rules = names
    .map((n, k) => `#cr-f-${k + 1}:checked ~ .cr-gal-grid .cr-gal:not(:has([data-cat="${k + 1}"])) { display: none; } #cr-f-${k + 1}:checked ~ .cr-filters label[for="cr-f-${k + 1}"] { color: var(--cr-ink); border-color: currentColor; }`)
    .join("\n");
  return (
    <>
      <section className="cr-wrap cr-page-head">
        <h1>گالری</h1>
        <Dash />
      </section>
      <section className="cr-gallery">
        <style dangerouslySetInnerHTML={{ __html: rules + `\n#cr-f-0:checked ~ .cr-filters label[for="cr-f-0"] { color: var(--cr-ink); border-color: currentColor; }` }} />
        {["all", ...names].map((n, k) => (
          <input key={n} type="radio" name="cr-filter" id={`cr-f-${k}`} defaultChecked={k === 0} className="cr-radio" />
        ))}
        <div className="cr-filters">
          {["همه", ...names].map((n, k) => (
            <label key={n} htmlFor={`cr-f-${k}`}>
              {n}
            </label>
          ))}
        </div>
        <div className="cr-gal-grid">
          {photos.map((g) => (
            <ZoomOpen key={g.id} id={g.id} className="cr-gal">
              <span data-cat={names.indexOf(g.description!.trim()) + 1} className="cr-gal-in">
                <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس")} />
                <b>{g.title}</b>
              </span>
            </ZoomOpen>
          ))}
          {view.editing && (
            <span className="cr-gal cr-add" {...ed("site.gallery", "newimage", "افزودن عکس")}>
              +
            </span>
          )}
        </div>
        {view.editing && <p className="cr-wrap cr-hint">دسته‌ی هر عکس را در «توضیح» آن بنویسید (مثلاً «پرتره»)؛ عکس بدون دسته در ردیف اینستاگرام می‌آید.</p>}
      </section>
    </>
  );
}

/* ───────────── Blog ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];
const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 260 ? `${p.text.slice(0, 260).trim()}…` : p.text);
const PER_PAGE = 6;

function Meta({ p }: { p: PostT }) {
  return <small className="cr-meta">{[p.author && `نویسنده: ${p.author}`, p.category, day(p.date)].filter(Boolean).join(" · ")}</small>;
}

function Blog(view: View) {
  const { shop, link, visitor } = view;
  const all = livePosts(shop);
  const cats = [...new Set(all.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c)))];
  const cat = visitor.query.cat;
  const q = (visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const list = all.filter((p) => (!cat || p.category === cat) && words.every((w) => `${p.title} ${p.text}`.includes(w)));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const at = Math.min(pages, Math.max(1, Number(visitor.query.p) || 1));
  const shown = list.slice((at - 1) * PER_PAGE, at * PER_PAGE);
  const href = (c?: string, p?: number) => {
    const params = new URLSearchParams();
    if (c) params.set("cat", c);
    if (q) params.set("q", q);
    if (p && p > 1) params.set("p", String(p));
    const s = params.toString();
    return `${link("/blog")}${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <section className="cr-wrap cr-page-head">
        <h1>بلاگ</h1>
        <Dash />
        {q && <p className="cr-muted">نتیجه‌ی جستجوی «{q}»</p>}
      </section>
      <section className="cr-wrap cr-blog">
        {cats.length > 0 && (
          <nav className="cr-filters">
            <a href={href()} aria-current={!cat ? "page" : undefined}>
              همه‌ی مطالب
            </a>
            {cats.map((c) => (
              <a key={c} href={href(c)} aria-current={cat === c ? "page" : undefined}>
                {c}
              </a>
            ))}
          </nav>
        )}
        {shown.length === 0 ? (
          <p className="cr-muted cr-empty">مطلبی پیدا نشد.</p>
        ) : (
          <div className="cr-posts">
            {shown.map((p) => {
              const img = safeUrl(p.image);
              return (
                <article key={p.id} className="cr-post">
                  <PageLink to={`/blog/${p.id}`} link={link} className="cr-post-pic">
                    {img && <img src={img} alt={p.title} loading="lazy" />}
                  </PageLink>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <h2>{p.title}</h2>
                  </PageLink>
                  <Meta p={p} />
                  <p>{excerptOf(p)}</p>
                  <PageLink to={`/blog/${p.id}`} link={link} className="cr-btn line">
                    ادامه‌ی مطلب
                  </PageLink>
                </article>
              );
            })}
          </div>
        )}
        {pages > 1 && (
          <nav className="cr-pager">
            {Array.from({ length: pages }, (_, k) => (
              <a key={k} href={href(cat, k + 1)} aria-current={at === k + 1 ? "page" : undefined}>
                {fa(k + 1)}
              </a>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const p = livePosts(view.shop).find((x) => x.id === view.id)!;
  const img = safeUrl(p.image);
  return (
    <>
      <section className="cr-wrap cr-page-head left">
        <h1>
          <Dash /> مطلب بلاگ
        </h1>
      </section>
      <article className="cr-wrap cr-article">
        {img && <img className="cr-article-pic" src={img} alt={p.title} />}
        <h2>{p.title}</h2>
        <Meta p={p} />
        <div className="cr-body">
          <Para text={p.text} />
        </div>
        <section className="cr-comment">
          <h3>
            <Dash /> نظر بگذارید
          </h3>
          <p className="cr-muted">نظرتان پس از بررسی به دست ما می‌رسد.</p>
          <form method="post" action={view.link("/_form")} className="cr-form">
            <FormMeta kind="contact" back={view.page} />
            <input type="hidden" name="subject" value={`نظر برای مطلب «${p.title}»`} />
            <label>
              نام
              <input name="name" required />
            </label>
            <label>
              ایمیل
              <input name="email" type="email" dir="auto" />
            </label>
            <label className="full">
              نظر شما
              <textarea name="body" rows={5} required />
            </label>
            <button type="submit" className="cr-btn">
              ارسال
            </button>
          </form>
        </section>
        <PageLink to="/blog" link={view.link} className="cr-btn line">
          بازگشت به بلاگ
        </PageLink>
      </article>
    </>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, shop, editing, visitor, link } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const plans = plansOf(shop);
  // Arriving from "order this plan": the form books a session for that plan.
  const plan = plans.find((x) => x.id === visitor.query.plan);
  return (
    <>
      <section className="cr-wrap cr-page-head">
        <h1>تماس</h1>
        <Dash />
      </section>
      <div className="cr-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
        {embed ? <iframe src={embed} title="نقشه‌ی استودیو" loading="lazy" referrerPolicy="no-referrer" /> : <span>برای نمایش نقشه، لینک مکان استودیو را بگذارید.</span>}
      </div>
      <section className="cr-sec cr-wrap cr-contact">
        <div className="cr-contact-info">
          <h3>
            <Dash /> راه‌های تماس
          </h3>
          <dl className="cr-foot-info">
            <div>
              <dt>نشانی:</dt>
              <dd {...ed("site.address", "text", "نشانی")}>{site?.address}</dd>
            </div>
            {b.phone && (
              <div>
                <dt>تلفن:</dt>
                <dd>
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                    {b.phone}
                  </a>
                </dd>
              </div>
            )}
            {b.email && (
              <div>
                <dt>ایمیل:</dt>
                <dd>
                  <a href={`mailto:${b.email}`} dir="ltr">
                    {b.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <h3>
            <Dash /> ما را دنبال کنید
          </h3>
          <Socials ctx={ctx} editing={editing} className="cr-contact-socials" />
        </div>
        <div className="cr-contact-form" id="cr-form">
          <h2>{plan ? `رزرو «${plan.name}»` : "خوشحال می‌شویم از شما بشنویم"}</h2>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
            <div className="cr-body" {...ed("site.contactText", "multiline", "متن")}>
              <Para text={site?.contactText} />
            </div>
          </Opt>
          <form method="post" action={link("/_form")} className="cr-form">
            <FormMeta kind={plan ? "booking" : "contact"} back="/contact" />
            {plans.length > 0 && (
              <label className="full">
                پکیج عکاسی {plan ? "" : "(اختیاری)"}
                <select name="service" defaultValue={plan?.name ?? ""}>
                  <option value="">— بدون پکیج، فقط پیام —</option>
                  {plans.map((x) => (
                    <option key={x.id} value={x.name}>
                      {x.name} – {formatToman(x.salePrice ?? x.price, ctx.data.locale)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              نام *
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              ایمیل
              <input name="email" type="email" dir="auto" autoComplete="email" />
            </label>
            <label>
              تلفن {plan ? "*" : ""}
              <input name="phone" inputMode="tel" dir="ltr" autoComplete="tel" required={Boolean(plan)} />
            </label>
            {plan && (
              <label>
                تاریخ پیشنهادی
                <input type="date" name="date" dir="ltr" />
              </label>
            )}
            <label className="full">
              پیام
              <textarea name="body" rows={5} required={!plan} />
            </label>
            <button type="submit" className="cr-btn">
              ارسال
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

/* ───────────── Example content (from the Crop It reference, in Persian) ───────────── */

export function cropitSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`cr-${n}`);
  const png = (n: string) => sampleImage(`cr-${n}`, "png");
  const plan = (id: string, name: string, price: number, photos: string): Product => ({
    id,
    name,
    price,
    images: [],
    description: ["حداکثر یک نفر", "۶ تا ۷ ساعت عکاسی در استودیو", "۲ بار تعویض لباس", `${photos} عکس`, "عکس‌های مخصوص وب", "گواهی پایان دوره"].join("\n"),
  });
  const job = (id: string, start: string, position: string) => ({ id, company: "استودیو کراپ ایت", position, period: { start, current: false }, highlights: [] });
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "جنیفر لایت",
      jobTitle: "عکاس",
      avatarUrl: png("logo"),
      email: "studio@example.com",
      phone: "021 0000 0000",
      summary: "بیش از ده سال است که با دوربینم داستان آدم‌ها را تعریف می‌کنم؛ از پرتره و مد تا طبیعت و سفر. برای من هر عکس لحظه‌ای است که دیگر تکرار نمی‌شود، پس با دقت، حوصله و نوری که به چهره‌ی شما بیاید ثبتش می‌کنم.\nدر استودیو یا هر جای دیگری که دوست دارید، کنارتان هستم تا عکسی داشته باشید که سال‌ها نگاهش کنید.",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
      ],
    },
    experience: [
      job("e1", "2016-05", "برنده‌ی جشنواره‌ی مدرسه‌ی عکاسی ۲۰۱۶"),
      job("e2", "2015-07", "نامزد جایزه‌ی «عکاس سال»"),
      job("e3", "2014-11", "پانصدمین هنرجوی مدرسه‌ی عکاسی ما"),
      job("e4", "2013-12", "برنده‌ی رقابت «نبرد عکاسان»"),
      job("e5", "2012-09", "دوره‌ی تازه‌ی «زاویه‌ی عکس»"),
      job("e6", "2011-01", "قیمت‌های تازه برای دوره‌ها"),
    ],
    skills: [
      { id: "k1", name: "مد و فشن", level: 5 },
      { id: "k2", name: "پرتره", level: 5 },
      { id: "k3", name: "طبیعت", level: 4 },
      { id: "k4", name: "عکاسی صنعتی", level: 4 },
      { id: "k5", name: "تصویرسازی", level: 3 },
    ],
    site: {
      ...base.site,
      aboutCaption: "چند کلمه درباره‌ی من",
      aboutImage: img("me"),
      aboutTitle: "ماموریت ما",
      aboutText: "ماموریت ما ثبت لحظه‌هایی است که ارزش ماندن دارند. هر جلسه‌ی عکاسی را با گفت‌وگو شروع می‌کنیم تا بفهمیم چه می‌خواهید، بعد نور، مکان و لباس را با هم انتخاب می‌کنیم.\nنتیجه عکس‌هایی است که شبیه خودتان است؛ طبیعی، گرم و ماندگار.",
      styleTitle: "اصول ما",
      styleText: "صداقت در قیمت، احترام به وقت شما و حفظ حریم خصوصی؛ عکس‌های شما بدون اجازه‌ی خودتان هیچ‌جا منتشر نمی‌شود.\nهمه‌ی عکس‌ها را خودمان روتوش می‌کنیم و تا راضی نباشید کار را تمام‌شده نمی‌دانیم.",
      contactText: "برای رزرو جلسه‌ی عکاسی، همکاری یا هر پرسشی پیام بگذارید؛ در کمتر از یک روز کاری پاسخ می‌دهیم.",
      accentImage: img("cat8"),
      signatureImage: png("logo-light"),
      address: "تهران، خیابان شریعتی، بالاتر از پل رومی، پلاک ۲۴",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7700&mlon=51.4400",
      gallery: [
        { id: "g1", title: "مرد با پیراهن گل‌دار", description: "مد و فشن", image: img("ig3") },
        { id: "g2", title: "نور طلایی", description: "پرتره", image: img("hero2") },
        { id: "g3", title: "در جنگل", description: "طبیعت", image: img("cat7") },
        { id: "g4", title: "دو دوست", description: "آدم‌ها", image: img("ig1") },
        { id: "g5", title: "کنار دیوار", description: "مد و فشن", image: img("hero1") },
        { id: "g6", title: "لباس قرمز", description: "پرتره", image: img("ig5") },
        { id: "g7", title: "خیابان", description: "شهر", image: img("hero3") },
        { id: "g8", title: "نگاه", description: "آدم‌ها", image: img("hero4") },
        { id: "i1", title: "", image: img("ig3") },
        { id: "i2", title: "", image: img("ig7") },
        { id: "i3", title: "", image: img("ig4") },
        { id: "i4", title: "", image: img("ig1") },
        { id: "i5", title: "", image: img("ig2") },
        { id: "i6", title: "", image: img("ig6") },
      ],
      testimonials: [
        { id: "t1", name: "سارا محمدی", role: "مدل", image: img("rev1"), text: "جلسه‌ی عکاسی با جنیفر یکی از بهترین تجربه‌هایم بود؛ آن‌قدر راحت بودم که اصلاً متوجه دوربین نشدم و عکس‌ها از چیزی که فکر می‌کردم هم بهتر شد." },
        { id: "t2", name: "نگار احمدی", role: "طراح لباس", image: img("rev2"), text: "برای کاتالوگ مجموعه‌ی جدیدمان با این استودیو کار کردیم؛ دقیق، خوش‌قول و خلاق. حتماً دوباره همکاری می‌کنیم." },
        { id: "t3", name: "علی رضایی", role: "بازیگر", image: img("rev3"), text: "عکس‌های پرتره‌ام را این‌جا گرفتم؛ نورپردازی عالی و روتوشی که طبیعی ماند. ممنون از همه‌ی تیم." },
      ],
      clients: ["evanto", "shutterstock", "jquery", "unyson"].map((n, k) => ({ id: `c${k + 1}`, name: n, image: png(`p-${n}`) })),
      shop: {
        slides: [
          { id: "s1", title: "بهترین عکاس شما هستم", text: "عکس‌هایی زیبا و ماندگار برای شما", image: img("hero1") },
          { id: "s2", title: "پرتره‌هایی که شبیه خودتان است", text: "نور، رنگ و حسی که در یاد می‌ماند", image: img("hero2") },
          { id: "s3", title: "داستان شما در یک قاب", text: "از استودیو تا خیابان، هر جا که بخواهید", image: img("hero3") },
        ],
        discoverTitle: "بگذارید از خودمان بگوییم",
        discoverImage: img("hero4"),
        bestTitle: "خدمات بی‌نقص ما",
        trendImage: img("hero5"),
        promoTitle: "درباره‌ی استودیوی ما",
        promoText: "استودیوی ما از یک اتاق کوچک و یک دوربین قدیمی شروع شد؛ امروز تیمی از عکاسان، طراحان نور و روتوش‌کاران کنار هم کار می‌کنند.\nهنوز هم مثل روز اول، هر عکس را با عشق می‌گیریم.",
        newImage: img("work"),
        newText: "بیشتر با ما آشنا شوید!",
        lookImage: img("cat6"),
        categories: [
          { id: "c1", name: "مد و فشن", image: img("cat1"), text: "عکاسی کاتالوگ، لوک‌بوک و کمپین برندهای لباس؛ با طراحی نور و صحنه‌ی مخصوص هر مجموعه." },
          { id: "c2", name: "پرتره", image: img("cat2") },
          { id: "c3", name: "آدم‌ها", image: img("cat3"), text: "عکس‌های خانوادگی، دوستانه و دونفره؛ طبیعی و پر از حس، در استودیو یا فضای باز." },
          { id: "c4", name: "طبیعت", image: img("cat4"), text: "منظره، سفر و طبیعت؛ از کوه و جنگل تا دریا، در بهترین نور روز." },
          { id: "c5", name: "زیبایی", image: img("cat5") },
          { id: "c6", name: "شهر", image: img("cat6") },
          { id: "c7", name: "سبک زندگی", image: img("cat7") },
          { id: "c8", name: "محصول", image: img("cat8") },
        ],
        perks: [
          { id: "v1", title: "برندینگ", text: "طراحی هویت تصویری برند شما؛ از عکس محصول تا عکس‌های شبکه‌های اجتماعی." },
          { id: "v2", title: "طراحی و اسکیس", text: "پیش از عکاسی، صحنه و ژست‌ها را با هم طراحی می‌کنیم تا نتیجه دقیق باشد." },
          { id: "v3", title: "عکاسی", text: "عکاسی پرتره، مد، خانوادگی و صنعتی با تجهیزات حرفه‌ای." },
          { id: "v4", title: "روتوش", text: "روتوش طبیعی و دقیق؛ پوست، رنگ و نور، بی‌آن‌که عکس مصنوعی شود." },
          { id: "v5", title: "فیلم", text: "فیلم‌های کوتاه تبلیغاتی، پشت صحنه و ویدیوهای شبکه‌های اجتماعی." },
          { id: "v6", title: "موسیقی متن", text: "انتخاب و تنظیم موسیقی مناسب برای فیلم‌ها و اسلایدشوهای شما." },
        ],
        banners: [
          { id: "tm0", title: "تیم ما", text: "تهران، خیابان شریعتی، پلاک ۲۴ · ۰۲۱ ۰۰۰۰ ۰۰۰۰", image: img("cat3") },
          { id: "tm1", title: "آرش کریمی", kicker: "عکاس", image: img("ig2") },
          { id: "tm2", title: "مینا صادقی", kicker: "طراح نور", image: img("cat5") },
          { id: "tm3", title: "رضا نوری", kicker: "روتوش‌کار", image: img("ig5") },
          { id: "tm4", title: "لیلا رحیمی", kicker: "گریمور", image: img("cat2") },
          { id: "tm5", title: "سامان ملکی", kicker: "فیلم‌بردار", image: img("ig4") },
          { id: "tm6", title: "نیلوفر امینی", kicker: "طراح لباس", image: img("hero2") },
        ],
        products: [plan("pl1", "پکیج خلاقانه", 2900000, "۵۲۰"), plan("pl2", "پکیج حرفه‌ای", 3900000, "۳۲۰"), plan("pl3", "پکیج ویژه", 5200000, "۵۲۰")],
        posts: [
          { id: "b1", title: "به رؤیایمان ایمان داریم", image: img("hero1"), date: "2026-10-16", author: "جنیفر", category: "آدم‌ها", text: "هر جلسه‌ی عکاسی برای ما یک قصه است. پیش از شروع، با شما درباره‌ی حس و حالی که دوست دارید حرف می‌زنیم و بعد نور و لوکیشن را انتخاب می‌کنیم.\nدر این مطلب از پشت صحنه‌ی یکی از جلسه‌های اخیرمان می‌گوییم و چند نکته برای این‌که جلوی دوربین راحت‌تر باشید." },
          { id: "b2", title: "نور طبیعی یا نور استودیو؟", image: img("ig2"), date: "2026-09-28", author: "جنیفر", category: "مد و فشن", text: "نور طبیعی گرم و نرم است و حس زندگی دارد؛ نور استودیو کنترل‌شده و دقیق. انتخاب میان این دو به سبک عکسی که می‌خواهید بستگی دارد.\nدر این یادداشت تفاوت‌ها و کاربرد هرکدام را با چند نمونه توضیح داده‌ایم." },
          { id: "b3", title: "برای عکاسی پرتره چه بپوشیم؟", image: img("ig5"), date: "2026-09-02", author: "جنیفر", category: "پرتره", text: "رنگ‌های ساده و یک‌دست، پارچه‌های بی‌چروک و لباسی که در آن راحت باشید، بهترین انتخاب‌اند. از طرح‌های خیلی شلوغ پرهیز کنید." },
        ],
        faq: [],
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.cr {
  --cr-ink: #333;
  --cr-dark: #2F2C2A;
  --cr-btn: #3A3A3A;
  --cr-grey: #EDEDED;
  --cr-muted: #777;
  --cr-line: #D9D9D9;
  background: #fff;
  color: var(--cr-ink);
  font-size: 15px;
}
.cr :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; color: inherit; outline-offset: 2px; }
.cr a { color: inherit; text-decoration: none; }
.cr h1, .cr h2, .cr h3, .cr h4, .cr h5, .cr p, .cr figure, .cr blockquote, .cr ul, .cr dl, .cr dd { margin: 0; }
.cr-ico { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.cr-wrap { box-sizing: border-box; width: 100%; max-width: 1830px; margin-inline: auto; padding-inline: clamp(18px, 2.4cqi, 45px); }
.cr-sec { padding-block: 90px; }
.cr-grey { background: var(--cr-grey); padding-block: 45px; }
.cr-muted { color: var(--cr-muted); }
.cr-hint { padding-block: 20px; color: var(--cr-muted); text-align: center; }
.cr-radio { position: absolute; opacity: 0; pointer-events: none; }
.cr-pic { display: block; overflow: hidden; }
.cr-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cr-add { display: grid; place-items: center; border: 1px dashed var(--cr-line); color: var(--cr-muted); font-size: 30px; cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* The three short dashes */
.cr-dash { display: inline-block; width: 30px; height: 4px; background: linear-gradient(90deg, currentColor 0 7px, transparent 7px 11.5px, currentColor 11.5px 18.5px, transparent 18.5px 23px, currentColor 23px); vertical-align: middle; }
.cr-title { display: grid; justify-items: center; gap: 12px; margin-bottom: 50px; text-align: center; }
.cr-title h2, .cr-page-head h1 { font-family: var(--font-heading); font-size: clamp(30px, 2.8cqi, 52px); font-weight: 900; line-height: 1.2; }
.cr-title.light { color: #fff; }
.cr-h2 { display: flex; align-items: center; gap: 14px; font-family: var(--font-heading); font-size: clamp(28px, 2.6cqi, 46px); font-weight: 900; }
.cr-body { color: #555; font-size: 16px; line-height: 2; }
.cr-body p + p { margin-top: 12px; }

/* Buttons: dark grey, white letters */
.cr-btn { display: inline-flex; align-items: center; justify-content: center; height: 58px; padding: 0 30px; background: var(--cr-btn); color: #fff !important; font-size: 15px; font-weight: 800; border: 1px solid var(--cr-btn); cursor: pointer; transition: background .3s, color .3s; }
.cr-btn:hover { background: #fff; color: var(--cr-btn) !important; }
.cr-btn.light { background: #fff; border-color: #fff; color: var(--cr-ink) !important; }
.cr-btn.light:hover { background: transparent; color: #fff !important; }
.cr-btn.line { height: 46px; padding: 0 22px; background: transparent; color: var(--cr-ink) !important; border-color: var(--cr-ink); font-size: 13px; }
.cr-btn.line:hover { background: var(--cr-ink); color: #fff !important; }

/* Header: logo, pages, search and the side menu; over the photo on the photo pages */
.cr-head { position: relative; z-index: 30; background: #fff; border-bottom: 1px solid #eee; }
.cr-over .cr-head { position: absolute; inset-inline: 0; top: 0; background: transparent; border: 0; color: #fff; }
.cr-head-in { display: flex; align-items: center; gap: 30px; min-height: 120px; padding-inline: clamp(18px, 4.3cqi, 82px); }
.cr-logo { display: flex; margin-inline-end: auto; }
.cr-logo img { display: block; height: clamp(48px, 4.5cqi, 86px); width: auto; }
.cr-logo b { font-family: var(--font-heading); font-size: 30px; font-weight: 900; }
.cr-nav { display: flex; gap: clamp(26px, 3.6cqi, 74px); font-size: 16px; font-weight: 800; }
.cr-nav a { position: relative; padding: 8px 0; }
.cr-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 4px; background: linear-gradient(90deg, currentColor 0 7px, transparent 7px 11.5px, currentColor 11.5px 18.5px, transparent 18.5px 23px, currentColor 23px 30px, transparent 30px); background-repeat: no-repeat; background-position: center; opacity: 0; transition: opacity .3s; }
.cr-nav a:hover::after, .cr-nav a[aria-current="page"]::after { opacity: 1; }
.cr-tools { display: flex; align-items: center; gap: 22px; margin-inline-start: clamp(10px, 3cqi, 60px); }
.cr-tools summary { display: grid; place-items: center; list-style: none; cursor: pointer; }
.cr-tools summary::-webkit-details-marker { display: none; }
.cr-tools .cr-ico { width: 30px; height: 30px; stroke-width: 2.2; }
.cr-search { position: relative; }
.cr-search form { position: absolute; top: calc(100% + 22px); inset-inline-end: -10px; display: flex; width: 320px; background: #fff; color: var(--cr-ink); box-shadow: 0 20px 40px -20px rgb(0 0 0 / .4); }
.cr-search input { flex: 1; padding: 14px 16px; font: inherit; }
.cr-search button { display: grid; place-items: center; width: 52px; border: 0; background: var(--cr-btn); color: #fff; cursor: pointer; }
.cr-search button .cr-ico { width: 20px; height: 20px; }
.cr-side-panel { position: fixed; inset-block: 0; inset-inline-end: 0; z-index: 80; pointer-events: none; display: grid; align-content: start; gap: 30px; width: min(380px, 88vw); padding: 80px 34px 40px; overflow-y: auto; background: #fff; color: var(--cr-ink); box-shadow: -30px 0 60px -30px rgb(0 0 0 / .5); animation: cr-side .35s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes cr-side { from { transform: translateX(-100%); } }
/* Open: the summary becomes the dark layer under the panel; a click on it (or on the panel's ×) closes. */
.cr-side-panel > * { pointer-events: auto; }
.cr-side[open] summary { position: fixed; inset: 0; z-index: 70; background: rgb(0 0 0 / .45); cursor: default; }
.cr-side[open] summary .cr-ico { display: none; }
.cr-side-x { position: absolute; top: 28px; inset-inline-start: 24px; width: 26px !important; height: 26px !important; pointer-events: none !important; cursor: pointer; }
.cr-side-panel .cr-logo { justify-content: center; }
.cr-side-nav { display: none; }
.cr-side-info { display: grid; gap: 12px; color: var(--cr-muted); font-size: 14px; line-height: 1.9; }
.cr-side-socials { margin-top: 10px; }
.cr-side-socials a { color: var(--cr-ink) !important; }

/* Photo top: a slide (or several) with the title on the photo */
.cr-hero { position: relative; overflow: hidden; height: clamp(520px, 41.6cqi, 800px); color: #fff; background: #222; }
.cr-slides, .cr-slide { position: absolute; inset: 0; }
.cr-hero.is-slider .cr-slide { opacity: 0; visibility: hidden; transition: opacity .9s ease, visibility .9s; }
.cr-slide-pic { position: absolute; inset: 0; }
.cr-slide-pic img { width: 100%; height: 100%; object-fit: cover; animation: cr-zoom 14s ease-out both; }
@keyframes cr-zoom { from { transform: scale(1.08); } }
.cr-slide::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(0 0 0 / .05), rgb(0 0 0 / .35)); pointer-events: none; }
.cr-slide-text { position: relative; z-index: 1; display: grid; align-content: center; justify-items: start; gap: 22px; height: 100%; padding-top: 90px; padding-inline: clamp(90px, 6cqi, 120px); }
.cr-slide-text h1 { max-width: 9em; font-family: var(--font-heading); font-size: clamp(38px, 4.8cqi, 92px); font-weight: 900; line-height: 1.12; text-shadow: 0 2px 24px rgb(0 0 0 / .25); }
.cr-slide-text p { font-size: clamp(16px, 1.4cqi, 26px); font-style: italic; }
.cr-slide-text .cr-btn { margin-top: 12px; height: 70px; padding: 0 30px; font-size: 18px; border: 0; }
.cr-hero:not(.is-slider) .cr-slide-text { justify-items: center; text-align: center; }
.cr-hero:not(.is-slider) .cr-slide-text h1 { max-width: 12em; }
.cr-slide-nav span { display: none; }
.cr-arrow { position: absolute; top: 50%; z-index: 3; display: grid; place-items: center; width: 50px; height: 50px; margin-top: -25px; color: #fff; cursor: pointer; }
.cr-arrow .cr-ico { width: 40px; height: 40px; stroke-width: 1.4; }
.cr-arrow.prev { inset-inline-start: 24px; }
.cr-arrow.next { inset-inline-end: 24px; }

/* The photographer: photo and a white box with the text */
.cr-me { display: grid; grid-template-columns: 1fr 1fr; gap: 45px; }
.cr-me-pic { min-height: 620px; height: 100%; }
.cr-me-text { display: grid; align-content: center; justify-items: center; gap: 24px; padding: 80px clamp(24px, 3cqi, 60px); background: #fff; text-align: center; }
.cr-me-text > small { font-size: 22px; font-weight: 800; }
.cr-me-text h2 { font-family: var(--font-heading); font-size: clamp(40px, 4.4cqi, 84px); font-weight: 900; line-height: 1.15; }
.cr-me-text .cr-body { max-width: 780px; font-size: 18px; line-height: 2.1; }
.cr-me-text .cr-btn { margin-top: 16px; }

/* Eight categories with the name on the photo */
.cr-cats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 45px; padding-block: 45px; }
.cr .cr-cat { position: relative; display: block; aspect-ratio: 424 / 280; overflow: hidden; color: #fff; }
.cr-cat-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, .8, .2, 1); }
.cr-cat:hover .cr-cat-pic img { transform: scale(1.07); }
.cr-cat b { position: absolute; inset-inline-end: 20px; bottom: 14px; font-family: var(--font-heading); font-size: clamp(24px, 2.6cqi, 52px); font-weight: 900; text-shadow: 0 2px 14px rgb(0 0 0 / .35); }

/* Instagram row */
.cr-insta { background: var(--cr-dark); color: #fff; }
.cr-insta-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 40px clamp(18px, 2.4cqi, 45px); }
.cr-insta-bar h2 { display: flex; align-items: center; gap: 16px; font-family: var(--font-heading); font-size: clamp(28px, 3.4cqi, 66px); font-weight: 900; line-height: 1; }
.cr .cr-follow { display: inline-flex; align-items: center; gap: 14px; height: 66px; padding: 0 30px; background: rgb(255 255 255 / .08); font-size: 16px; font-weight: 800; transition: background .3s; }
.cr-follow:hover { background: rgb(255 255 255 / .18); }
.cr-insta-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cr-insta-pic { display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.cr-insta-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s, filter .4s; }
.cr-insta-pic:hover img { transform: scale(1.06); filter: brightness(.85); }

/* Work experience and skills */
.cr-cv { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; padding-inline: clamp(18px, 4.3cqi, 82px); }
.cr-jobs { display: grid; gap: 22px; margin-top: 36px; padding: 0; list-style: none; font-size: 19px; }
.cr-jobs b { font-weight: 800; }
.cr-jobs em { color: #555; }
.cr-bars { display: grid; gap: 30px; max-width: 700px; margin-top: 40px; padding: 0; list-style: none; }
.cr-bars li { height: 44px; background: #eee; }
.cr-bars span { display: flex; justify-content: space-between; align-items: center; width: var(--w); height: 100%; padding: 0 18px; box-sizing: border-box; background: var(--cr-dark); color: #fff; font-size: 15px; animation: cr-bar 1.6s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes cr-bar { from { width: 0; } }
.cr-bars b { font-weight: 600; }

/* "Work with me" band */
.cr-work { position: relative; overflow: hidden; color: #fff; isolation: isolate; }
.cr-work-pic { position: absolute; inset: 0; z-index: -1; }
.cr-work-pic img { width: 100%; height: 100%; object-fit: cover; }
.cr-work::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgb(0 0 0 / .05), rgb(0 0 0 / .45)); }
.cr-work-text { display: grid; justify-items: start; gap: 20px; padding-block: 160px; padding-inline: clamp(24px, 4.3cqi, 82px); }
.cr-work-text small { font-size: 22px; font-weight: 800; }
.cr-work-text h2 { font-family: var(--font-heading); font-size: clamp(38px, 4.8cqi, 92px); font-weight: 900; line-height: 1.1; }
.cr-work-text p { font-size: 22px; font-style: italic; }

/* Reviews: one at a time */
.cr-quotes { display: grid; justify-items: center; position: relative; }
.cr-quotes-view { width: 100%; max-width: 1150px; }
.cr-quote { display: none; justify-items: center; gap: 30px; margin: 0; text-align: center; }
.cr-face { display: block; width: 132px; height: 132px; overflow: hidden; }
.cr-face img { width: 100%; height: 100%; object-fit: cover; }
.cr-quote blockquote { position: relative; margin: 0; padding: 0 70px; color: #555; font-size: 18px; font-style: italic; line-height: 2.4; }
.cr-q1, .cr-q2 { position: absolute; width: 44px !important; height: 44px !important; fill: var(--cr-ink); stroke: none; }
.cr-q1 { top: -20px; inset-inline-start: 0; }
.cr-q2 { bottom: -20px; inset-inline-end: 0; }
.cr-quote figcaption { display: grid; gap: 14px; }
.cr-quote figcaption b { font-size: 22px; font-weight: 800; }
.cr-quote figcaption small { color: var(--cr-muted); }
.cr-quote-nav span { display: none; }
.cr-qarrow { position: absolute; top: 46%; display: grid; place-items: center; width: 50px; height: 50px; cursor: pointer; }
.cr-qarrow .cr-ico { width: 40px; height: 40px; stroke-width: 1.3; }
.cr-qarrow.prev { inset-inline-start: clamp(10px, 4cqi, 90px); }
.cr-qarrow.next { inset-inline-end: clamp(10px, 4cqi, 90px); }
.cr-dots { display: flex; gap: 14px; margin-top: 40px; color: var(--cr-ink); }
.cr-dots label { width: 11px; height: 11px; border: 2px solid currentColor; box-sizing: border-box; cursor: pointer; }

/* Partner logos */
.cr-logos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: center; justify-items: center; gap: 40px; padding-block: 40px 110px; }
.cr-logo-item img { max-width: 100%; max-height: 60px; opacity: .55; filter: grayscale(1); transition: opacity .3s; }
.cr-logo-item:hover img { opacity: 1; }

/* Services: icons in a grid with thin lines between them */
.cr-services { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 1760px; margin-inline: auto; }
.cr-service { display: grid; justify-items: center; align-content: start; gap: 16px; padding: 48px clamp(18px, 3cqi, 80px); text-align: center; border-color: #C9C9C9; border-style: solid; border-width: 0; }
.cr-service:nth-child(3n + 2) { border-inline-width: 1px; }
.cr-service:nth-child(-n + 3) { border-bottom-width: 1px; }
.cr-service-ico { width: 60px; height: 60px; fill: none; stroke: var(--cr-ink); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; object-fit: contain; }
.cr-service h3 { font-family: var(--font-heading); font-size: clamp(22px, 2cqi, 40px); font-weight: 900; }
.cr-service p { max-width: 430px; color: #555; font-size: 16px; line-height: 2; }

/* Specialities */
.cr-specs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 45px; }
.cr-spec { display: grid; justify-items: center; gap: 18px; text-align: center; }
.cr-spec-pic { width: 100%; aspect-ratio: 556 / 340; }
.cr-spec h3 { margin-top: 14px; font-size: 22px; font-weight: 800; }
.cr-spec-text { color: #555; font-size: 16px; font-style: italic; line-height: 2.1; }

/* Price plans over a city photo */
.cr-plans-block { position: relative; isolation: isolate; padding-block: 52px; }
.cr-plans-bg { position: absolute; inset: 0; z-index: -1; }
.cr-plans-bg img { width: 100%; height: 100%; object-fit: cover; }
.cr-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 45px; }
.cr-plan { display: grid; align-content: start; justify-items: center; background: #fff; padding-bottom: 36px; text-align: center; transition: transform .4s, box-shadow .4s; }
.cr-plan:hover { transform: translateY(-8px); box-shadow: 0 30px 50px -30px rgb(0 0 0 / .5); }
.cr-plan-head { display: grid; gap: 20px; width: 100%; padding: 80px 20px 50px; color: #fff; background: #6A6A6A; }
.cr-plan.tone-1 .cr-plan-head { background: #444; }
.cr-plan.tone-2 .cr-plan-head { background: #2B2B2B; }
.cr-plan-head h3 { font-size: 24px; font-weight: 800; }
.cr-plan-head small { margin-top: -8px; font-size: 15px; opacity: .85; }
.cr-plan-head b { font-family: var(--font-heading); font-size: clamp(40px, 4.4cqi, 84px); font-weight: 900; line-height: 1; }
.cr-plan ul { display: grid; width: min(256px, 80%); margin: 20px 0 30px; padding: 0; list-style: none; }
.cr-plan li { padding-block: 16px; border-bottom: 1px solid #CFCFCF; font-size: 16px; }
.cr-plan li:last-child { border: 0; }
.cr-plan .cr-btn { height: 66px; padding: 0 32px; }

/* About: mission, principles, philosophy tabs */
.cr-tab-heads { display: flex; justify-content: center; gap: 52px; font-size: 20px; font-weight: 800; }
.cr-tab-heads label { position: relative; padding-bottom: 16px; color: #777; cursor: pointer; transition: color .3s; }
.cr-tab-heads label::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 4px; background: repeating-linear-gradient(90deg, var(--cr-ink) 0 7px, transparent 7px 11px); opacity: 0; transition: opacity .3s; }
.cr-tab { display: none; justify-items: center; gap: 24px; }
#cr-tab-a:checked ~ .tab-a, #cr-tab-b:checked ~ .tab-b, #cr-tab-c:checked ~ .tab-c { display: grid; animation: cr-fade .5s ease both; }
#cr-tab-a:checked ~ .cr-tab-heads label[for="cr-tab-a"], #cr-tab-b:checked ~ .cr-tab-heads label[for="cr-tab-b"], #cr-tab-c:checked ~ .cr-tab-heads label[for="cr-tab-c"] { color: #000; }
#cr-tab-a:checked ~ .cr-tab-heads label[for="cr-tab-a"]::after, #cr-tab-b:checked ~ .cr-tab-heads label[for="cr-tab-b"]::after, #cr-tab-c:checked ~ .cr-tab-heads label[for="cr-tab-c"]::after { opacity: 1; }
@keyframes cr-fade { from { opacity: 0; transform: translateY(10px); } }
.cr-tab h2 { margin-top: 40px; font-family: var(--font-heading); font-size: clamp(40px, 4.4cqi, 84px); font-weight: 900; line-height: 1.15; }
.cr-tab .cr-body { max-width: 780px; font-size: 18px; }
.cr-tab .cr-btn { margin-top: 30px; }

/* Team: a big tile with the title, then the faces */
.cr-team { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cr-team figure { position: relative; margin: 0; overflow: hidden; }
.cr-team-lead { grid-column: span 2; color: #fff; }
.cr-team-pic { width: 100%; aspect-ratio: 480 / 700; }
.cr-team-lead .cr-team-pic { aspect-ratio: 960 / 700; height: 100%; }
.cr-team-lead::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / .2); }
.cr-team-lead figcaption { position: absolute; inset: 0; z-index: 1; display: grid; place-content: center; justify-items: center; gap: 12px; text-align: center; }
.cr-team-lead h2 { font-family: var(--font-heading); font-size: clamp(40px, 5cqi, 96px); font-weight: 900; line-height: 1.1; }
.cr-member figcaption { position: absolute; inset-inline: 0; bottom: 0; display: grid; gap: 4px; padding: 60px 24px 22px; background: linear-gradient(transparent, rgb(0 0 0 / .7)); color: #fff; opacity: 0; transform: translateY(14px); transition: opacity .4s, transform .4s; }
.cr-member:hover figcaption { opacity: 1; transform: none; }
.cr-member figcaption b { font-size: 20px; }
.cr-member figcaption small { opacity: .85; }
.cr-member .cr-team-pic img { transition: transform 1s; }
.cr-member:hover .cr-team-pic img { transform: scale(1.05); }

/* Inner page title */
.cr-page-head { display: grid; justify-items: center; gap: 12px; padding-block: 70px 40px; text-align: center; }
.cr-page-head.left { justify-items: start; text-align: start; }
.cr-page-head.left h1 { display: flex; align-items: center; gap: 14px; font-size: clamp(26px, 2.2cqi, 40px); }

/* Gallery with category filter */
.cr-filters { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 44px; margin-bottom: 40px; padding-inline: 18px; font-size: 16px; font-weight: 700; }
.cr-filters label, .cr-filters a { padding-bottom: 8px; border-bottom: 3px dashed transparent; color: #777; cursor: pointer; transition: color .3s; }
.cr-filters label:hover, .cr-filters a:hover, .cr-filters a[aria-current="page"] { color: var(--cr-ink); border-color: currentColor; }
.cr-gal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cr-gal { display: block; position: relative; overflow: hidden; cursor: zoom-in; }
.cr-gal-in { display: block; aspect-ratio: 960 / 700; }
.cr-gal img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s, filter .4s; }
.cr-gal b { position: absolute; inset-inline: 0; bottom: 0; padding: 40px 24px 18px; background: linear-gradient(transparent, rgb(0 0 0 / .6)); color: #fff; font-size: 18px; opacity: 0; transition: opacity .4s; }
.cr-gal:hover img { transform: scale(1.05); }
.cr-gal:hover b { opacity: 1; }
.cr-gal.cr-add { aspect-ratio: 960 / 700; }

/* Blog */
.cr-blog { padding-bottom: 100px; }
.cr-posts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 50px 40px; }
.cr-post { display: grid; justify-items: start; align-content: start; gap: 14px; }
.cr-post-pic { display: block; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; }
.cr-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s; }
.cr-post:hover .cr-post-pic img { transform: scale(1.05); }
.cr-post h2 { margin-top: 6px; font-size: 22px; font-weight: 800; line-height: 1.5; }
.cr-post p { color: #555; line-height: 2; }
.cr-meta { color: var(--cr-muted); font-size: 13px; }
.cr-pager { display: flex; justify-content: center; gap: 8px; margin-top: 60px; }
.cr-pager a { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--cr-line); }
.cr-pager a[aria-current="page"] { background: #C0392B; border-color: #C0392B; color: #fff; }
.cr-empty { padding: 40px; text-align: center; }
.cr-article { display: grid; justify-items: start; gap: 18px; max-width: 1100px; padding-bottom: 100px; }
.cr-article-pic { display: block; width: 100%; max-height: 640px; object-fit: cover; }
.cr-article h2 { font-size: clamp(24px, 2.2cqi, 38px); font-weight: 900; }
.cr-comment { display: grid; gap: 14px; width: 100%; margin-top: 40px; padding-top: 40px; border-top: 1px solid #eee; }
.cr-comment h3 { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 800; }

/* Forms: labelled lines */
.cr-form { display: grid; grid-template-columns: 1fr 1fr; gap: 26px 30px; width: 100%; }
.cr-form label { display: grid; gap: 8px; font-size: 13px; font-weight: 800; }
.cr-form .full { grid-column: 1 / -1; }
.cr-form input, .cr-form select { padding: 10px 0; border-bottom: 1px solid #BDBDBD; font: inherit; font-weight: 400; }
.cr-form textarea { padding: 12px; border: 1px solid #BDBDBD; font: inherit; font-weight: 400; resize: vertical; }
.cr-form input:focus, .cr-form select:focus, .cr-form textarea:focus { outline: none; border-color: var(--cr-ink); }
.cr-form .cr-btn { justify-self: end; height: 52px; }

/* Contact */
.cr-map { display: grid; place-items: center; height: clamp(300px, 26cqi, 480px); background: #E4E4E4; color: var(--cr-muted); }
.cr-map iframe { width: 100%; height: 100%; border: 0; filter: grayscale(.4); }
.cr-contact { display: grid; grid-template-columns: 1fr 1.6fr; gap: clamp(40px, 6cqi, 120px); max-width: 1400px; }
.cr-contact-info { display: grid; align-content: start; gap: 26px; }
.cr-contact-info h3 { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; }
.cr-contact-info .cr-foot-info dt { color: var(--cr-ink); }
.cr-contact-info .cr-foot-info dd { color: #555; }
.cr-contact-info .cr-foot-info > div { border-color: #E2E2E2; }
.cr-contact-socials a { color: var(--cr-ink) !important; }
.cr-contact-form { display: grid; gap: 20px; }
.cr-contact-form h2 { font-family: var(--font-heading); font-size: clamp(26px, 2.4cqi, 44px); font-weight: 900; }

/* Footer: dark, four columns */
.cr-foot { background: var(--cr-dark); color: #fff; }
.cr-foot-cols { display: grid; grid-template-columns: 1fr 1fr .8fr 1.2fr; gap: 50px; padding-block: 70px 60px; max-width: 1760px; }
.cr-foot h4 { display: flex; align-items: center; gap: 12px; margin-bottom: 34px; font-size: 22px; font-weight: 800; }
.cr-foot h5 { margin: 34px 0 18px; font-size: 16px; font-weight: 800; }
.cr-foot-info { display: grid; gap: 0; }
.cr-foot-info > div { display: grid; gap: 6px; padding-block: 16px; border-bottom: 1px solid rgb(255 255 255 / .25); }
.cr-foot-info dt { font-weight: 800; font-size: 15px; }
.cr-foot-info dd { font-size: 15px; opacity: .9; }
.cr-foot-gal { display: grid; grid-template-columns: repeat(3, 100px); gap: 46px; }
.cr-foot-thumb { display: block; width: 100px; height: 100px; overflow: hidden; cursor: zoom-in; }
.cr-foot-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.cr-foot-thumb:hover img { transform: scale(1.1); }
.cr-foot-links { display: grid; gap: 14px; font-size: 16px; font-weight: 800; }
.cr-foot-links a { display: flex; align-items: center; gap: 12px; transition: opacity .3s; }
.cr-foot-links a:hover { opacity: .7; }
.cr-foot-links .cr-ico { width: 14px; height: 14px; }
.cr-news { display: flex; gap: 20px; align-items: end; }
.cr-news input { flex: 1; min-width: 0; padding: 12px 0; border-bottom: 2px solid #fff; color: #fff; font: inherit; font-style: italic; }
.cr-news input::placeholder { color: rgb(255 255 255 / .8); }
.cr-news button { height: 66px; padding: 0 28px; border: 0; background: #423F3D; color: #fff; font: inherit; font-weight: 800; cursor: pointer; transition: background .3s; }
.cr-news button:hover { background: #57534F; }
.cr-foot-socials a { color: #BDBDBD !important; background: none !important; }
.cr-foot-socials a:hover { color: #fff !important; }
.cr-foot-end { padding: 14px; background: #111; color: rgb(255 255 255 / .6); font-size: 13px; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .cr *, .cr *::before, .cr *::after { animation: none !important; transition: none !important; }
}

@container (max-width: 1100px) {
  .cr-nav { gap: 22px; font-size: 14px; }
  .cr-cats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
  .cr-foot-cols { grid-template-columns: 1fr 1fr; }
  .cr-posts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cr-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 820px) {
  .cr { font-size: 14px; }
  .cr-sec { padding-block: 60px; }
  .cr-head-in { min-height: 76px; gap: 14px; }
  .cr-logo img { height: 44px; }
  .cr-nav { display: none; }
  .cr-side-nav { display: grid; gap: 4px; font-weight: 800; }
  .cr-side-nav a { padding: 12px 4px; border-bottom: 1px solid #eee; }
  .cr-side-nav a[aria-current="page"] { color: #C0392B; }
  .cr-search form { inset-inline-end: -60px; width: min(320px, 86vw); }
  .cr-hero { height: 420px; }
  .cr-slide-text { padding-top: 70px; padding-inline: 22px; }
  .cr-arrow { display: none; }
  .cr-me, .cr-cv, .cr-specs, .cr-plans, .cr-contact, .cr-form { grid-template-columns: 1fr; }
  .cr-me { gap: 18px; }
  .cr-me-pic { min-height: 320px; }
  .cr-me-text { padding: 40px 18px; }
  .cr-tab-heads { gap: 26px; font-size: 16px; white-space: nowrap; }
  .cr-slide-text .cr-btn { height: 54px; font-size: 15px; }
  .cr-cats { grid-template-columns: 1fr; gap: 14px; }
  .cr-insta-bar h2 { font-size: 22px; }
  .cr-follow { height: 44px; padding: 0 14px; font-size: 13px; }
  .cr-insta-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cr-jobs { font-size: 15px; }
  .cr-work-text { padding-block: 90px; }
  .cr-quote blockquote { padding: 0 34px; font-size: 15px; }
  .cr-q1, .cr-q2 { width: 28px !important; height: 28px !important; }
  .cr-qarrow { display: none; }
  .cr-logos { grid-template-columns: 1fr; gap: 24px; padding-bottom: 60px; }
  .cr-services { grid-template-columns: 1fr; }
  .cr-service { border-width: 0 !important; border-bottom-width: 1px !important; }
  .cr-service:last-child { border-bottom-width: 0 !important; }
  .cr-team { grid-template-columns: 1fr; }
  .cr-team-lead { grid-column: auto; }
  .cr-team-pic { aspect-ratio: 4 / 4.4; }
  .cr-member figcaption { opacity: 1; transform: none; }
  .cr-gal-grid { grid-template-columns: 1fr; }
  .cr-posts { grid-template-columns: 1fr; }
  .cr-foot-cols { grid-template-columns: 1fr; gap: 36px; }
  .cr-foot-gal { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .cr-foot-thumb { width: 100%; height: auto; aspect-ratio: 1; }
  .cr-form .cr-btn { justify-self: stretch; }
}
`;
