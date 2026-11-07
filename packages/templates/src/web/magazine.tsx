/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Magazine": an editorial, multi-page portfolio that reads like the cover story of a magazine.
// Masthead with the name, a large photo beside the lead text, numbered selected works and thin
// rules between everything. Pages: home, about (with the resume), works and certificates.

import type { CSSProperties } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatNumber, formatPeriod, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Certificates, Icon, Opt, PageLink, Socials, ToPage, blockOn, ed, item, outside, pagesOf, paragraphs, partsCss, type View } from "./parts";
import { describeSkills } from "./vcard";

export const MAGAZINE_OPTIONAL_PAGES = [
  { path: "/about", label: "درباره و رزومه" },
  { path: "/works", label: "نمونه‌کارها" },
  { path: "/gallery", label: "مدارک" },
] as const;

export const MAGAZINE_BLOCKS = [
  { key: "works", label: "کارهای برگزیده (صفحه‌ی اصلی)" },
  { key: "services", label: "خدمات (صفحه‌ی اصلی)" },
  { key: "quote", label: "جمله‌ی بزرگ (صفحه‌ی اصلی)" },
] as const;

export const magazinePages = (data: ResumeData) => pagesOf(data, MAGAZINE_OPTIONAL_PAGES);

const MENU: Record<string, string> = { "/": "صفحه‌ی اول", "/about": "درباره", "/works": "کارها", "/gallery": "مدارک" };

type MView = View & { pages: string[] };
const num = (n: number, locale: ResumeData["locale"]) => formatNumber(n, locale).padStart(2, locale === "fa" ? "۰" : "0");

export function MagazinePortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const pages = magazinePages(ctx.data);
  const view: MView = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing), pages };
  const page = pages.includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  return (
    <WebPage ctx={ctx} className="mg" css={partsCss + css}>
      <Masthead {...view} page={page} />
      <main className="mg-main" key={page}>
        {page === "/about" ? (
          <About {...view} />
        ) : page === "/works" ? (
          <AllWorks {...view} />
        ) : page === "/gallery" ? (
          <section>
            <h1 className="mg-page-title">مدارک و گواهی‌ها</h1>
            <Certificates ctx={ctx} editing={view.editing} className="mg-certs" />
          </section>
        ) : (
          <Home {...view} />
        )}
      </main>
      <footer className="mg-foot">
        <strong>{ctx.data.basics.fullName}</strong>
        <Socials ctx={ctx} editing={view.editing} className="mg-socials" />
        <small>© همه‌ی حقوق محفوظ است</small>
      </footer>
    </WebPage>
  );
}

function Masthead({ ctx, link, pages, page }: MView & { page: string }) {
  const b = ctx.data.basics;
  return (
    <header className="mg-head">
      <div className="mg-meta">
        <span>{b.location}</span>
        <span>نمونه‌کار و رزومه</span>
        <span>{b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}</span>
      </div>
      <PageLink to="/" link={link} className="mg-title">
        <span {...ed("basics.fullName", "text", "نام")}>{b.fullName}</span>
      </PageLink>
      <nav className="mg-nav">
        {pages.map((p) => (
          <PageLink key={p} to={p} link={link} current={p === page}>
            {MENU[p]}
          </PageLink>
        ))}
      </nav>
    </header>
  );
}

function Home(view: MView) {
  const { ctx, editing, link, pages } = view;
  const { data } = ctx;
  const site = data.site;
  const photo = safeUrl(site?.heroImage || site?.aboutImage || data.basics.avatarUrl);
  const text = site?.aboutText?.trim() || data.basics.summary?.trim() || "";
  const first = paragraphs(text)[0] ?? "";
  const works = data.projects.filter((p) => p.title.trim()).slice(0, 3);
  const services = data.skills.filter((s) => s.name.trim() && s.description?.trim()).slice(0, 3);
  return (
    <>
      <section className="mg-cover">
        <figure className="mg-hero" {...ed("site.heroImage", "image", "تصویر اصلی")}>
          {photo && <img src={photo} alt={data.basics.fullName} />}
          <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "زیرنویس تصویر")}>
            <figcaption {...ed("site.aboutCaption", "text", "زیرنویس تصویر")}>{site?.aboutCaption}</figcaption>
          </Opt>
        </figure>
        <article className="mg-lead">
          <Opt value={data.basics.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
            <small className="mg-kicker" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
              {data.basics.jobTitle}
            </small>
          </Opt>
          <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر اصلی")}>
            <h1 {...ed("site.aboutTitle", "text", "تیتر اصلی")}>{site?.aboutTitle}</h1>
          </Opt>
          <Opt value={site?.tagline} editing={editing} edit={ed("site.tagline", "multiline", "جمله‌ی زیر تیتر")}>
            <p className="mg-dek" {...ed("site.tagline", "multiline", "جمله‌ی زیر تیتر")}>
              {site?.tagline}
            </p>
          </Opt>
          <Opt value={first} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            <p className="mg-drop" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
              {first}
            </p>
          </Opt>
          <ToPage pages={pages} to="/about" link={link} className="mg-more">
            ادامه‌ی مطلب <Icon name="arrow" />
          </ToPage>
        </article>
      </section>

      {blockOn(data, "quote") && site?.bandText?.trim() && (
        <blockquote className="mg-quote" {...ed("site.bandText", "text", "جمله‌ی بزرگ")}>
          «{site.bandText}»
        </blockquote>
      )}

      {blockOn(data, "works") && works.length > 0 && (
        <section className="mg-sec">
          <div className="mg-sec-head">
            <h2>کارهای برگزیده</h2>
            <ToPage pages={pages} to="/works" link={link} className="mg-more">
              همه‌ی کارها <Icon name="arrow" />
            </ToPage>
          </div>
          <div className="mg-three">
            {works.map((p, k) => (
              <Work key={p.id} p={p} k={k} view={view} />
            ))}
          </div>
        </section>
      )}

      {blockOn(data, "services") && services.length > 0 && (
        <section className="mg-sec">
          <div className="mg-sec-head">
            <h2>در این شماره: خدمات</h2>
          </div>
          <div className="mg-three mg-cols">
            {services.map((s, k) => (
              <div key={s.id} className="mg-col">
                <small>{num(k + 1, data.locale)}</small>
                <h3 {...ed(`${item("skills", s.id)}.name`, "text", "عنوان خدمت")}>{s.name}</h3>
                <p {...ed(`${item("skills", s.id)}.description`, "multiline", "توضیح خدمت")}>{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Work({ p, k, view, wide }: { p: ResumeData["projects"][number]; k: number; view: View; wide?: boolean }) {
  const { ctx, editing } = view;
  const at = item("projects", p.id);
  const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
  const img = safeUrl(p.images[0]);
  return (
    <a href={href ?? "#"} {...outside(href)} className={`mg-work${wide ? " wide" : ""}`} style={{ "--i": k } as CSSProperties}>
      <span className="mg-pic" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
        {img && <img src={img} alt={p.title} loading="lazy" />}
      </span>
      <span className="mg-work-text">
        <small>
          {num(k + 1, ctx.data.locale)}
          <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "دسته")}>
            <span {...ed(`${at}.role`, "text", "دسته")}> — {p.role}</span>
          </Opt>
        </small>
        <strong {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</strong>
        {wide && (
          <Opt value={p.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح پروژه")}>
            <p {...ed(`${at}.description`, "multiline", "توضیح پروژه")}>{p.description}</p>
          </Opt>
        )}
      </span>
    </a>
  );
}

function AllWorks(view: MView) {
  const items = view.ctx.data.projects.filter((p) => p.title.trim());
  return (
    <section>
      <h1 className="mg-page-title">همه‌ی کارها</h1>
      <div className="mg-all">
        {items.map((p, k) => (
          <Work key={p.id} p={p} k={k} view={view} wide />
        ))}
      </div>
    </section>
  );
}

function About({ ctx, editing }: MView) {
  const { data } = ctx;
  const fmt = ctx.theme.display.dateFormat;
  const text = data.site?.aboutText?.trim() || data.basics.summary?.trim() || "";
  const photo = safeUrl(data.basics.avatarUrl);
  return (
    <section>
      <h1 className="mg-page-title">درباره‌ی من</h1>
      <div className="mg-about">
        <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          <div className="mg-columns" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            {paragraphs(text).map((p, k) => (
              <p key={k} className={k === 0 ? "mg-drop" : undefined}>
                {p}
              </p>
            ))}
          </div>
        </Opt>
        <aside className="mg-cv">
          <div className="mg-portrait" {...ed("basics.avatarUrl", "image", "عکس پروفایل")}>
            {photo && <img src={photo} alt={data.basics.fullName} />}
          </div>
          {data.experience.length > 0 && <h3>سوابق کاری</h3>}
          {data.experience.map((x) => {
            const at = item("experience", x.id);
            return (
              <div key={x.id} className="mg-entry">
                <strong {...ed(`${at}.position`, "text", "سمت")}>{x.position}</strong>
                <span {...ed(`${at}.company`, "text", "شرکت")}>{x.company}</span>
                <small {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
              </div>
            );
          })}
          {data.education.length > 0 && <h3>تحصیلات</h3>}
          {data.education.map((x) => {
            const at = item("education", x.id);
            return (
              <div key={x.id} className="mg-entry">
                <strong {...ed(`${at}.institution`, "text", "دانشگاه")}>{x.institution}</strong>
                <span {...ed(`${at}.degree`, "text", "مقطع")}>{[x.degree, x.field].filter(Boolean).join("، ")}</span>
                <small {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
              </div>
            );
          })}
          {data.skills.length > 0 && <h3>مهارت‌ها</h3>}
          <p className="mg-skills">
            {data.skills
              .filter((s) => s.name.trim())
              .map((s) => (
                <span key={s.id} {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>
                  {s.name}
                </span>
              ))}
          </p>
        </aside>
      </div>
    </section>
  );
}

export function magazineSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  return {
    ...base,
    skills: describeSkills(base.skills, locale),
    projects: base.projects.map((p, k) => ({ ...p, images: [sampleImage(`grid-p${k + 3}`)] })),
    site: {
      ...base.site,
      gallery: base.site?.gallery ?? [],
      heroImage: sampleImage("about"),
      bandText: locale === "fa" ? "سادگی، نهایت پیچیدگی است." : "Simplicity is the ultimate sophistication.",
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.mg { --mg-paper: #FBFAF6; --mg-ink: #111111; --mg-mute: #6F6B64; --mg-rule: #111111; --mg-line: #DDD8CE;
  background: var(--mg-paper); color: var(--mg-ink); min-height: 100%; }
.mg a { color: inherit; }
.mg-head, .mg-main, .mg-foot { width: min(1200px, 100% - 2 * clamp(16px, 4cqi, 48px)); margin: 0 auto; }
.mg-head { padding-top: 18px; text-align: center; }
.mg-meta { display: flex; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--mg-line); color: var(--mg-mute); font-size: .76em; }
.mg-meta span:last-child { direction: ltr; }
.mg-title { display: block; padding: clamp(10px, 2cqi, 22px) 0; font-size: clamp(2.6em, 10cqi, 7.4em); font-weight: 900; letter-spacing: -.03em; line-height: 1.15; animation: mg-in 1s cubic-bezier(.2, 1, .3, 1) both; }
@keyframes mg-in { from { opacity: 0; transform: scale(.94); letter-spacing: .02em; } }
.mg-nav { display: flex; justify-content: center; gap: clamp(16px, 4cqi, 44px); padding: 12px 0; border-top: 3px solid var(--mg-rule); border-bottom: 1px solid var(--mg-rule); font-size: .9em; font-weight: 600; }
.mg-nav a { position: relative; padding: 2px 0; }
.mg-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: -2px; height: 2px; background: var(--color-primary); transform: scaleX(0); transition: transform .3s; }
.mg-nav a:hover::after, .mg-nav a[aria-current="page"]::after { transform: none; }

.mg-main { padding: clamp(28px, 5cqi, 56px) 0; }
.mg-main > * { animation: mg-up .9s cubic-bezier(.2, 1, .3, 1) backwards; }
.mg-main > :nth-child(2) { animation-delay: .12s; } .mg-main > :nth-child(n+3) { animation-delay: .24s; }
@keyframes mg-up { from { opacity: 0; transform: translateY(24px) scale(.98); } }
.mg-cover { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: clamp(22px, 4cqi, 52px); align-items: start; }
.mg-hero { margin: 0; display: grid; gap: 8px; }
.mg-hero img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; filter: grayscale(.15) contrast(1.05); animation: mg-reveal 1.4s cubic-bezier(.2, 1, .3, 1) both; }
@keyframes mg-reveal { from { clip-path: inset(0 0 100% 0); } }
.mg-hero figcaption { color: var(--mg-mute); font-size: .78em; font-style: italic; }
.mg-lead { display: grid; gap: 16px; align-content: start; padding-top: 6px; }
.mg-kicker { color: var(--color-primary); font-weight: 700; letter-spacing: .04em; font-size: .82em; }
.mg-lead h1 { font-size: clamp(1.8em, 4.4cqi, 3.2em); font-weight: 900; line-height: 1.35; letter-spacing: -.02em; }
.mg-dek { font-size: 1.12em; line-height: 1.9; color: #3A3732; padding-bottom: 16px; border-bottom: 1px solid var(--mg-line); }
.mg-drop { line-height: 2.1; }
/* A colored square opens the lead (a Persian drop cap would break the joined letters). */
.mg-drop::before { content: ""; display: inline-block; width: .7em; height: .7em; margin-inline-end: 10px; background: var(--color-primary); vertical-align: -.05em; }
.mg-more { display: inline-flex; align-items: center; gap: 6px; justify-self: start; font-weight: 700; font-size: .9em; border-bottom: 2px solid var(--mg-ink); padding-bottom: 2px; transition: color .2s, border-color .2s; }
.mg-more:hover { color: var(--color-primary); border-color: var(--color-primary); }
.mg-more .p-ico { width: 16px; height: 16px; }
.mg[dir="rtl"] .mg-more .p-ico { transform: scaleX(-1); }

.mg-quote { margin: clamp(40px, 7cqi, 80px) 0; padding: clamp(22px, 4cqi, 40px) 0; border-block: 1px solid var(--mg-rule); text-align: center; font-size: clamp(1.6em, 5cqi, 3.4em); font-weight: 800; line-height: 1.4; }
.mg-sec { margin-top: clamp(36px, 6cqi, 70px); }
.mg-sec-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding-bottom: 12px; margin-bottom: 22px; border-bottom: 3px solid var(--mg-rule); }
.mg-sec-head h2 { font-size: 1.4em; font-weight: 900; }
.mg-three { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(18px, 3cqi, 34px); }
.mg-work { display: grid; gap: 12px; align-content: start; }
.mg-pic { display: block; aspect-ratio: 4 / 3; overflow: hidden; background: var(--mg-line); }
.mg-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.mg-work:hover .mg-pic img { transform: scale(1.06); }
.mg-work-text { display: grid; gap: 4px; }
.mg-work-text small { color: var(--mg-mute); font-size: .78em; }
.mg-work-text strong { font-size: 1.25em; font-weight: 800; line-height: 1.45; }
.mg-work:hover strong { color: var(--color-primary); }
.mg-work-text p { color: #3A3732; line-height: 1.95; font-size: .93em; }
.mg-cols .mg-col { display: grid; gap: 8px; align-content: start; padding-inline-start: clamp(14px, 2cqi, 24px); border-inline-start: 1px solid var(--mg-line); }
.mg-cols .mg-col:first-child { border: none; padding: 0; }
.mg-col small { color: var(--color-primary); font-weight: 800; }
.mg-col h3 { font-size: 1.2em; font-weight: 800; }
.mg-col p { color: #3A3732; line-height: 2; font-size: .92em; }

.mg-page-title { padding-bottom: 16px; margin-bottom: clamp(24px, 4cqi, 40px); border-bottom: 3px solid var(--mg-rule); font-size: clamp(2em, 6cqi, 4em); font-weight: 900; letter-spacing: -.02em; }
.mg-all { display: grid; gap: clamp(30px, 5cqi, 56px); }
.mg-work.wide { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: clamp(18px, 4cqi, 44px); align-items: center; padding-bottom: clamp(30px, 5cqi, 56px); border-bottom: 1px solid var(--mg-line); }
.mg-work.wide:nth-child(even) .mg-pic { order: 2; }
.mg-work.wide strong { font-size: clamp(1.4em, 3.6cqi, 2.4em); }
.mg-about { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: clamp(24px, 5cqi, 60px); align-items: start; }
.mg-columns { columns: 2 260px; column-gap: 36px; column-rule: 1px solid var(--mg-line); }
.mg-columns p { margin-bottom: 16px; line-height: 2.1; text-align: justify; }
.mg-cv { display: grid; gap: 12px; padding-inline-start: clamp(16px, 3cqi, 30px); border-inline-start: 3px solid var(--mg-rule); }
.mg-portrait { aspect-ratio: 1; overflow: hidden; background: var(--mg-line); margin-bottom: 8px; }
.mg-portrait img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); transition: filter .5s; }
.mg-portrait:hover img { filter: none; }
.mg-cv h3 { margin-top: 14px; padding-bottom: 6px; border-bottom: 1px solid var(--mg-rule); font-size: .85em; font-weight: 900; letter-spacing: .06em; }
.mg-entry { display: grid; gap: 2px; }
.mg-entry span { font-size: .9em; }
.mg-entry small { color: var(--mg-mute); font-size: .78em; }
.mg-skills { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .9em; }
.mg-skills span::before { content: "■ "; color: var(--color-primary); font-size: .6em; vertical-align: middle; }
.mg-certs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px 26px; }
.mg-certs .p-cert-pic { aspect-ratio: 4 / 3; padding: 14px; background: #EFEBE2; }
.mg-certs .p-cert-pic img { object-fit: contain; box-shadow: 0 10px 20px -12px rgb(0 0 0 / .5); }
.mg-certs .p-cert-text { padding-top: 10px; border-top: 1px solid var(--mg-rule); }
.mg-certs .p-cert-text small { color: var(--mg-mute); }

.mg-foot { display: grid; justify-items: center; gap: 14px; padding: 30px 0 40px; border-top: 3px solid var(--mg-rule); text-align: center; }
.mg-foot strong { font-size: 1.4em; font-weight: 900; }
.mg-socials a { color: var(--mg-ink); box-shadow: inset 0 0 0 1px var(--mg-line); }
.mg-socials a:hover { background: var(--mg-ink); color: var(--mg-paper); }
.mg-foot small { color: var(--mg-mute); }

@supports (animation-timeline: view()) {
  .mg-sec, .mg-quote, .mg-work.wide { animation: mg-up linear both; animation-timeline: view(); animation-range: entry 0% entry 50%; }
}
@container (max-width: 820px) {
  .mg-cover, .mg-about, .mg-work.wide { grid-template-columns: 1fr; }
  .mg-work.wide:nth-child(even) .mg-pic { order: 0; }
  .mg-three, .mg-certs { grid-template-columns: 1fr 1fr; }
  .mg-cols { grid-template-columns: 1fr; }
  .mg-cols .mg-col { border: none; padding: 0; }
  .mg-meta span:nth-child(2) { display: none; }
}
@container (max-width: 520px) {
  .mg-three, .mg-certs { grid-template-columns: 1fr; }
  .mg-hero img { aspect-ratio: 4 / 4; }
}
@media (prefers-reduced-motion: reduce) {
  .mg-title, .mg-main > *, .mg-hero img, .mg-sec, .mg-quote, .mg-work.wide { animation: none !important; }
}
`;
