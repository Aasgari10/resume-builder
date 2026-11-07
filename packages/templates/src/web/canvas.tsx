/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Canvas": a bold, poster-like single page. A giant name fills the top, a band of skills
// scrolls by, works are big numbered rows, and the page ends with the email address set in
// huge type. Paper-colored background, near-black ink, the primary color as the highlight.
// Every section can be switched off (site.hiddenBlocks).

import type { CSSProperties } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatNumber, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Certificates, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, paragraphs, partsCss, type View } from "./parts";
import { describeSkills } from "./vcard";

export const CANVAS_BLOCKS = [
  { key: "marquee", label: "نوار متحرک مهارت‌ها" },
  { key: "about", label: "درباره‌ی من" },
  { key: "works", label: "نمونه‌کارها" },
  { key: "services", label: "خدمات" },
  { key: "certificates", label: "مدارک" },
  { key: "contact", label: "تماس" },
] as const;

export const canvasPages = () => ["/"];

export function CanvasPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing) };
  const on = (key: string) => blockOn(ctx.data, key);
  const hasCerts = Boolean(ctx.data.site?.gallery.some((g) => safeUrl(g.image)));
  return (
    <WebPage ctx={ctx} className="cv" css={partsCss + css}>
      <Top {...view} />
      <Hero {...view} />
      {on("marquee") && <Marquee {...view} />}
      {on("about") && <About {...view} />}
      {on("works") && <Works {...view} />}
      {on("services") && <Services {...view} />}
      {on("certificates") && (hasCerts || view.editing) && (
        <section className="cv-sec cv-reveal" id="certificates">
          <Head n="۰۴" title="مدارک" />
          <Certificates ctx={ctx} editing={view.editing} className="cv-certs" />
        </section>
      )}
      {on("contact") && <Contact {...view} />}
    </WebPage>
  );
}

function Top({ ctx, link }: View) {
  const email = ctx.data.basics.email?.trim();
  return (
    <header className="cv-top">
      <PageLink to="/" link={link} className="cv-brand">
        {ctx.data.basics.fullName.trim().split(/\s+/)[0]}
        <i>.</i>
      </PageLink>
      <nav>
        <a href="#works">کارها</a>
        <a href="#about">درباره</a>
        <a href={email ? `mailto:${email}` : "#contact"} className="cv-pill">
          بیایید حرف بزنیم
        </a>
      </nav>
    </header>
  );
}

function Hero({ ctx, editing }: View) {
  const b = ctx.data.basics;
  const words = b.fullName.trim().split(/\s+/);
  const photo = safeUrl(ctx.data.site?.aboutImage || b.avatarUrl);
  const tagline = ctx.data.site?.tagline?.trim() || "";
  return (
    <section className="cv-hero">
      <h1 className="cv-name" {...ed("basics.fullName", "text", "نام")}>
        {words.map((w, k) => (
          <span key={k} className="cv-line">
            <span style={{ "--d": `${k * 0.12}s` } as CSSProperties}>{w}</span>
          </span>
        ))}
      </h1>
      <div className="cv-hero-foot">
        <div className="cv-face" {...ed("site.aboutImage", "image", "عکس من")}>
          {photo && <img src={photo} alt={b.fullName} />}
        </div>
        <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
          <strong className="cv-job" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
            {b.jobTitle}
          </strong>
        </Opt>
        <Opt value={tagline} editing={editing} edit={ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
          <p className="cv-tag" {...ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
            {tagline}
          </p>
        </Opt>
        <a href="#works" className="cv-down" aria-label="کارها">
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}

function Marquee({ ctx }: View) {
  const names = ctx.data.skills.filter((s) => s.name.trim()).map((s) => s.name);
  if (names.length === 0) return null;
  const row = [...names, ...names];
  return (
    <div className="cv-band" aria-hidden="true">
      <div className="cv-track">
        {[...row, ...row].map((n, k) => (
          <span key={k}>
            {n} <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

function Head({ n, title }: { n: string; title: string }) {
  return (
    <div className="cv-head">
      <small>({n})</small>
      <h2>{title}</h2>
    </div>
  );
}

function About({ ctx, editing }: View) {
  const site = ctx.data.site;
  const text = site?.aboutText?.trim() || ctx.data.basics.summary?.trim() || "";
  return (
    <section className="cv-sec cv-reveal" id="about">
      <Head n="۰۱" title="درباره" />
      <div className="cv-about">
        <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر درباره‌ی من")}>
          <p className="cv-big" {...ed("site.aboutTitle", "text", "تیتر درباره‌ی من")}>
            {site?.aboutTitle}
          </p>
        </Opt>
        <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          <div className="cv-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            {paragraphs(text).map((p, k) => (
              <p key={k}>{p}</p>
            ))}
          </div>
        </Opt>
      </div>
    </section>
  );
}

function Works({ ctx, editing }: View) {
  const items = ctx.data.projects.filter((p) => p.title.trim());
  if (items.length === 0) return null;
  return (
    <section className="cv-sec cv-reveal" id="works">
      <Head n="۰۲" title="کارهای منتخب" />
      <div className="cv-works">
        {items.map((p, k) => {
          const at = item("projects", p.id);
          const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
          const img = safeUrl(p.images[0]);
          return (
            <a key={p.id} href={href ?? "#"} {...outside(href)} className="cv-work">
              <small className="cv-no">{formatNumber(k + 1, ctx.data.locale).padStart(2, "۰")}</small>
              <span className="cv-work-text">
                <strong {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</strong>
                <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "دسته")}>
                  <small {...ed(`${at}.role`, "text", "دسته")}>{p.role}</small>
                </Opt>
              </span>
              <span className="cv-thumb" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
                {img && <img src={img} alt={p.title} loading="lazy" />}
              </span>
              <span className="cv-arrow">
                <Icon name="arrow" />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function Services({ ctx }: View) {
  const items = ctx.data.skills.filter((s) => s.name.trim() && s.description?.trim()).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className="cv-sec cv-dark cv-reveal" id="services">
      <Head n="۰۳" title="چه کاری از من برمی‌آید" />
      <div className="cv-services">
        {items.map((s, k) => (
          <div key={s.id}>
            <small>{formatNumber(k + 1, ctx.data.locale).padStart(2, "۰")}</small>
            <strong {...ed(`${item("skills", s.id)}.name`, "text", "عنوان خدمت")}>{s.name}</strong>
            <p {...ed(`${item("skills", s.id)}.description`, "multiline", "توضیح خدمت")}>{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact({ ctx, editing }: View) {
  const email = ctx.data.basics.email?.trim();
  return (
    <footer className="cv-contact cv-reveal" id="contact">
      <small>پروژه‌ای در ذهن دارید؟</small>
      <Opt value={email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
        <a href={`mailto:${email}`} className="cv-mail" dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
          {email}
        </a>
      </Opt>
      <div className="cv-foot">
        <Socials ctx={ctx} editing={editing} className="cv-socials" />
        <span>
          © {ctx.data.basics.fullName} — {ctx.data.basics.location}
        </span>
      </div>
    </footer>
  );
}

/* ───────────── Example content ───────────── */

export function canvasSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  return {
    ...base,
    skills: describeSkills(base.skills, locale),
    projects: base.projects.map((p, k) => ({ ...p, images: [sampleImage(`grid-p${k + 1}`)] })),
    site: { ...base.site, gallery: base.site?.gallery ?? [], aboutImage: sampleImage("about") },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.cv { --cv-paper: #F1ECE3; --cv-ink: #141414; --cv-mute: #6E6A63; --cv-line: rgb(20 20 20 / .14);
  background: var(--cv-paper); color: var(--cv-ink); min-height: 100%; overflow: hidden; }
.cv a { color: inherit; }
.cv-top { display: flex; justify-content: space-between; align-items: center; padding: 22px clamp(16px, 4cqi, 56px); }
.cv-brand { font-size: 1.4em; font-weight: 900; }
.cv-brand i { font-style: normal; color: var(--color-primary); }
.cv-top nav { display: flex; align-items: center; gap: clamp(12px, 3cqi, 30px); font-size: .92em; }
.cv-pill { padding: 10px 18px; border-radius: 999px; background: var(--cv-ink); color: var(--cv-paper) !important; transition: background .25s; }
.cv-pill:hover { background: var(--color-primary); }

.cv-hero { padding: clamp(10px, 3cqi, 40px) clamp(16px, 4cqi, 56px) clamp(30px, 6cqi, 80px); }
.cv-name { display: grid; font-size: clamp(64px, 15.5cqi, 230px); font-weight: 900; line-height: .98; letter-spacing: -.03em; }
.cv-line { display: block; overflow: hidden; padding-bottom: .06em; }
.cv-line > span { display: inline-block; animation: cv-up 1s var(--d) cubic-bezier(.2, 1, .25, 1) both; }
.cv-line:nth-child(even) { text-align: end; }
@keyframes cv-up { from { transform: translateY(105%) rotate(2deg); } }
.cv-hero-foot { display: grid; grid-template-columns: auto auto 1fr auto; gap: 18px 24px; align-items: center; margin-top: clamp(20px, 4cqi, 40px); padding-top: 22px; border-top: 1px solid var(--cv-line); animation: cv-fade 1s .5s ease both; }
@keyframes cv-fade { from { opacity: 0; transform: translateY(16px); } }
.cv-face { width: 74px; height: 74px; border-radius: 50%; overflow: hidden; background: var(--color-primary); }
.cv-face img { width: 100%; height: 100%; object-fit: cover; }
.cv-job { font-size: 1.15em; }
.cv-tag { color: var(--cv-mute); max-width: 32em; line-height: 1.9; }
.cv-down { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--cv-ink); transition: background .25s, color .25s, transform .4s; }
.cv-down .p-ico { transform: rotate(90deg); }
.cv[dir="rtl"] .cv-down .p-ico { transform: rotate(180deg); }
.cv-down:hover { background: var(--cv-ink); color: var(--cv-paper); transform: rotate(-45deg); }

.cv-band { background: var(--cv-ink); color: var(--cv-paper); padding: 18px 0; overflow: hidden; rotate: -1.5deg; margin: 10px -20px; }
.cv-track { display: flex; width: max-content; gap: 34px; font-size: clamp(1.4em, 3.4cqi, 2.4em); font-weight: 800; white-space: nowrap; animation: cv-slide 30s linear infinite; }
.cv-track i { font-style: normal; color: var(--color-primary); margin-inline-start: 28px; }
.cv[dir="rtl"] .cv-track { animation-name: cv-slide-rtl; }
@keyframes cv-slide { to { transform: translateX(-50%); } }
@keyframes cv-slide-rtl { to { transform: translateX(50%); } }

.cv-sec { padding: clamp(50px, 9cqi, 120px) clamp(16px, 4cqi, 56px); }
.cv-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: clamp(26px, 5cqi, 56px); padding-bottom: 18px; border-bottom: 1px solid var(--cv-line); }
.cv-head small { color: var(--color-primary); font-weight: 700; }
.cv-head h2 { font-size: clamp(1.8em, 5cqi, 3.6em); font-weight: 900; letter-spacing: -.02em; }
.cv-about { display: grid; grid-template-columns: 1.3fr 1fr; gap: clamp(24px, 6cqi, 80px); align-items: start; }
.cv-big { font-size: clamp(1.5em, 3.6cqi, 2.6em); font-weight: 800; line-height: 1.5; }
.cv-text { display: grid; gap: 16px; color: #3B3833; line-height: 2.1; }

.cv-works { display: grid; border-top: 1px solid var(--cv-line); }
.cv-work { position: relative; display: grid; grid-template-columns: 70px 1fr auto 60px; align-items: center; gap: 20px; padding: clamp(18px, 3cqi, 30px) 8px; border-bottom: 1px solid var(--cv-line); transition: padding .4s ease, background .4s; }
.cv-work::before { content: ""; position: absolute; inset: 0; background: var(--cv-ink); transform: scaleY(0); transform-origin: bottom; transition: transform .45s cubic-bezier(.2, 1, .3, 1); z-index: 0; }
.cv-work > * { position: relative; z-index: 1; transition: color .3s; }
.cv-work:hover::before { transform: none; }
.cv-work:hover > * { color: var(--cv-paper); }
.cv-work:hover { padding-inline: 24px; }
.cv-no { color: var(--cv-mute); font-weight: 700; }
.cv-work-text { display: grid; gap: 4px; }
.cv-work-text strong { font-size: clamp(1.4em, 4cqi, 3em); font-weight: 800; letter-spacing: -.02em; line-height: 1.25; }
.cv-work-text small { color: var(--cv-mute); }
.cv-work:hover .cv-work-text small, .cv-work:hover .cv-no { color: #B9B3A8; }
.cv-thumb { width: clamp(90px, 16cqi, 200px); aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: var(--color-primary-soft); rotate: 3deg; transition: rotate .4s, scale .4s; }
.cv-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cv-work:hover .cv-thumb { rotate: -3deg; scale: 1.08; }
.cv-arrow { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; border: 1px solid currentColor; }
.cv[dir="rtl"] .cv-arrow .p-ico { transform: scaleX(-1); }
.cv-work:hover .cv-arrow { background: var(--color-primary); border-color: var(--color-primary); }

.cv-dark { background: var(--cv-ink); color: var(--cv-paper); }
.cv-dark .cv-head { border-color: rgb(255 255 255 / .15); }
.cv-services { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 clamp(24px, 5cqi, 70px); }
.cv-services > div { display: grid; grid-template-columns: 50px 1fr; gap: 6px 14px; padding: 28px 0; border-bottom: 1px solid rgb(255 255 255 / .15); }
.cv-services small { grid-row: span 2; color: var(--color-primary-on-dark); font-weight: 700; }
.cv-services strong { font-size: 1.5em; font-weight: 800; }
.cv-services p { color: #BDB7AC; line-height: 2; font-size: .93em; }

.cv-certs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px 22px; }
.cv-certs .p-cert-pic { aspect-ratio: 4 / 3; border-radius: 14px; background: #E6DFD3; padding: 14px; }
.cv-certs .p-cert-pic img { object-fit: contain; filter: saturate(.9); }
.cv-certs .p-cert:nth-child(odd) .p-cert-pic { rotate: -1deg; } .cv-certs .p-cert:nth-child(even) .p-cert-pic { rotate: 1deg; }
.cv-certs .p-cert-pic { transition: rotate .4s; } .cv-certs .p-cert:hover .p-cert-pic { rotate: 0deg; }

.cv-contact { display: grid; justify-items: center; gap: 18px; padding: clamp(60px, 10cqi, 140px) clamp(16px, 4cqi, 56px) 30px; text-align: center; background: var(--color-primary); color: #fff; }
.cv-contact > small { font-size: 1.1em; opacity: .85; }
.cv-mail { font-size: clamp(1.8em, 7.6cqi, 6em); font-weight: 900; letter-spacing: -.03em; line-height: 1.1; overflow-wrap: anywhere; background: linear-gradient(currentColor, currentColor) 0 100% / 0 3px no-repeat; transition: background-size .5s; }
.cv-mail:hover { background-size: 100% 3px; }
.cv-foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; width: 100%; margin-top: clamp(40px, 8cqi, 100px); padding-top: 22px; border-top: 1px solid rgb(255 255 255 / .3); font-size: .85em; }
.cv-socials a { background: rgb(255 255 255 / .15); }
.cv-socials a:hover { background: #fff; color: var(--color-primary); }

/* Sections fade and grow in as they scroll into view (where supported). */
@supports (animation-timeline: view()) {
  .cv-reveal > * { animation: cv-grow linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
  @keyframes cv-grow { from { opacity: 0; transform: scale(.92) translateY(50px); } }
}

@container (max-width: 760px) {
  .cv-hero-foot { grid-template-columns: auto 1fr; }
  .cv-tag { grid-column: 1 / -1; }
  .cv-down { display: none; }
  .cv-about, .cv-services { grid-template-columns: 1fr; }
  .cv-work { grid-template-columns: 40px 1fr auto; }
  .cv-arrow { display: none; }
  .cv-certs { grid-template-columns: 1fr 1fr; }
  .cv-top nav a:not(.cv-pill) { display: none; }
}
@container (max-width: 480px) {
  .cv-certs { grid-template-columns: 1fr; }
  .cv-thumb { width: 80px; }
}
@media (prefers-reduced-motion: reduce) {
  .cv-line > span, .cv-hero-foot, .cv-track, .cv-reveal > * { animation: none !important; }
}
`;
