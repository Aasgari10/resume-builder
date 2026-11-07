/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Code": a dark single page for developers. A fixed column on one side holds the name, a short
// line, the section menu and social links; the other side scrolls through about, experience,
// projects, education and certificates. A soft glow in the primary color sits behind it all.
// Every section can be switched off (site.hiddenBlocks).

import type { CSSProperties } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatPeriod, safeUrl } from "../format";
import { sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Certificates, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, paragraphs, partsCss, type View } from "./parts";

export const CODE_BLOCKS = [
  { key: "about", label: "درباره" },
  { key: "experience", label: "سوابق کاری" },
  { key: "projects", label: "پروژه‌ها" },
  { key: "education", label: "تحصیلات" },
  { key: "certificates", label: "مدارک" },
] as const;

const MENU: Record<string, string> = { about: "درباره", experience: "سوابق", projects: "پروژه‌ها", education: "تحصیلات", certificates: "مدارک" };

export const codePages = () => ["/"];

export function CodePortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing) };
  const { data } = ctx;
  const hasCerts = Boolean(data.site?.gallery.some((g) => safeUrl(g.image)));
  const shown = CODE_BLOCKS.map((b) => b.key).filter(
    (k) =>
      blockOn(data, k) &&
      (k !== "certificates" || hasCerts || view.editing) &&
      (k !== "experience" || data.experience.length > 0) &&
      (k !== "education" || data.education.length > 0) &&
      (k !== "projects" || data.projects.length > 0),
  );
  return (
    <WebPage ctx={ctx} className="cd" css={partsCss + css}>
      <div className="cd-glow" aria-hidden="true" />
      <div className="cd-wrap">
        <Side {...view} sections={shown} />
        <main className="cd-main">
          {shown.includes("about") && <About {...view} />}
          {shown.includes("experience") && <Experience {...view} />}
          {shown.includes("projects") && <Projects {...view} />}
          {shown.includes("education") && <Education {...view} />}
          {shown.includes("certificates") && (
            <section className="cd-sec" id="certificates">
              <h2 className="cd-h2">مدارک</h2>
              <Certificates ctx={ctx} editing={view.editing} className="cd-certs" />
            </section>
          )}
          <p className="cd-note">
            ساخته‌شده با عشق و چای؛ {data.basics.fullName}، {data.basics.location}
          </p>
        </main>
      </div>
    </WebPage>
  );
}

function Side({ ctx, editing, link, sections }: View & { sections: string[] }) {
  const b = ctx.data.basics;
  const tagline = ctx.data.site?.tagline?.trim() || "";
  return (
    <header className="cd-side">
      <div>
        <h1>
          <PageLink to="/" link={link}>
            <span {...ed("basics.fullName", "text", "نام")}>{b.fullName}</span>
          </PageLink>
        </h1>
        <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
          <h2 className="cd-job" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
            {b.jobTitle}
          </h2>
        </Opt>
        <Opt value={tagline} editing={editing} edit={ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
          <p className="cd-tag" {...ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
            {tagline}
          </p>
        </Opt>
        <nav className="cd-nav">
          {sections.map((s, k) => (
            <a key={s} href={`#${s}`} style={{ "--i": k } as CSSProperties}>
              <i />
              {MENU[s]}
            </a>
          ))}
        </nav>
      </div>
      <Socials ctx={ctx} editing={editing} className="cd-socials" />
    </header>
  );
}

function About({ ctx, editing }: View) {
  const text = ctx.data.site?.aboutText?.trim() || ctx.data.basics.summary?.trim() || "";
  return (
    <section className="cd-sec" id="about">
      <h2 className="cd-h2">درباره</h2>
      <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
        <div className="cd-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          {paragraphs(text).map((p, k) => (
            <p key={k}>{p}</p>
          ))}
        </div>
      </Opt>
      <div className="cd-chips">
        {ctx.data.skills
          .filter((s) => s.name.trim())
          .map((s) => (
            <span key={s.id} className="cd-chip" {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>
              {s.name}
            </span>
          ))}
      </div>
    </section>
  );
}

function Experience({ ctx, editing }: View) {
  const fmt = ctx.theme.display.dateFormat;
  return (
    <section className="cd-sec" id="experience">
      <h2 className="cd-h2">سوابق</h2>
      <ol className="cd-list">
        {ctx.data.experience.map((x) => {
          const at = item("experience", x.id);
          return (
            <li key={x.id} className="cd-row">
              <small className="cd-date" {...ed(`${at}.period`, "period", "تاریخ")}>
                {formatPeriod(x.period, ctx.data.locale, fmt)}
              </small>
              <div>
                <h3>
                  <span {...ed(`${at}.position`, "text", "سمت")}>{x.position}</span>
                  <span className="cd-at"> · </span>
                  <span className="cd-at" {...ed(`${at}.company`, "text", "شرکت")}>
                    {x.company}
                  </span>
                </h3>
                <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                  <p {...ed(`${at}.description`, "multiline", "توضیحات")}>{x.description}</p>
                </Opt>
                <Opt value={x.highlights} editing={editing} edit={ed(`${at}.highlights`, "lines", "دستاوردها")}>
                  <div className="cd-chips" {...ed(`${at}.highlights`, "lines", "دستاوردها")}>
                    {x.highlights.map((h, k) => (
                      <span key={k} className="cd-chip">
                        {h}
                      </span>
                    ))}
                  </div>
                </Opt>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Projects({ ctx, editing }: View) {
  const items = ctx.data.projects.filter((p) => p.title.trim());
  return (
    <section className="cd-sec" id="projects">
      <h2 className="cd-h2">پروژه‌ها</h2>
      <ol className="cd-list">
        {items.map((p) => {
          const at = item("projects", p.id);
          const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
          const img = safeUrl(p.images[0]);
          return (
            <li key={p.id}>
              <a href={href ?? "#"} {...outside(href)} className="cd-row cd-proj">
                <span className="cd-shot" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
                  {img && <img src={img} alt={p.title} loading="lazy" />}
                </span>
                <div>
                  <h3>
                    <span {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</span>
                    <Icon name="arrow" className="p-ico cd-go" />
                  </h3>
                  <Opt value={p.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح پروژه")}>
                    <p {...ed(`${at}.description`, "multiline", "توضیح پروژه")}>{p.description}</p>
                  </Opt>
                  <Opt value={p.technologies} editing={editing} edit={ed(`${at}.technologies`, "tags", "ابزارها")}>
                    <div className="cd-chips" {...ed(`${at}.technologies`, "tags", "ابزارها")}>
                      {p.technologies.map((t) => (
                        <span key={t} className="cd-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </Opt>
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Education({ ctx }: View) {
  const fmt = ctx.theme.display.dateFormat;
  return (
    <section className="cd-sec" id="education">
      <h2 className="cd-h2">تحصیلات</h2>
      <ol className="cd-list">
        {ctx.data.education.map((x) => {
          const at = item("education", x.id);
          return (
            <li key={x.id} className="cd-row">
              <small className="cd-date" {...ed(`${at}.period`, "period", "تاریخ")}>
                {formatPeriod(x.period, ctx.data.locale, fmt)}
              </small>
              <div>
                <h3 {...ed(`${at}.institution`, "text", "دانشگاه")}>{x.institution}</h3>
                <p {...ed(`${at}.degree`, "text", "مقطع")}>{[x.degree, x.field].filter(Boolean).join("، ")}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function codeSample(locale: ResumeData["locale"]): ResumeData {
  return sampleResume(locale);
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.cd { --cd-bg: #0B1222; --cd-ink: #E2E8F0; --cd-mute: #8C9AB3; --cd-head: #F1F5F9; --cd-accent: var(--color-primary-on-dark);
  position: relative; background: var(--cd-bg); color: var(--cd-mute); min-height: 100%; }
.cd a { color: inherit; }
.cd-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(600px 400px at 85% 10%, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 70%), radial-gradient(500px 500px at 10% 70%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 70%); }
.cd-wrap { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: clamp(24px, 5cqi, 64px); width: min(1180px, 100% - 2 * clamp(16px, 4cqi, 48px)); margin: 0 auto; }
.cd-side { position: sticky; top: 0; height: 100vh; max-height: 900px; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(40px, 8cqi, 96px) 0; animation: cd-in .9s cubic-bezier(.2, 1, .3, 1) both; }
@keyframes cd-in { from { opacity: 0; transform: scale(.96) translateY(20px); } }
.cd-side h1 { color: var(--cd-head); font-size: clamp(2.2em, 5.6cqi, 3.4em); font-weight: 800; letter-spacing: -.02em; line-height: 1.3; }
.cd-job { margin-top: 10px; color: var(--cd-ink); font-size: 1.2em; font-weight: 500; }
.cd-tag { margin-top: 16px; max-width: 22em; line-height: 1.95; }
.cd-nav { display: grid; gap: 4px; margin-top: 50px; justify-items: start; }
.cd-nav a { display: flex; align-items: center; gap: 14px; padding: 8px 0; font-size: .82em; font-weight: 700; letter-spacing: .08em; animation: cd-in .7s calc(.3s + var(--i) * .08s) cubic-bezier(.2, 1, .3, 1) both; }
.cd-nav i { width: 32px; height: 1px; background: currentColor; transition: width .3s, background .3s; }
.cd-nav a:hover { color: var(--cd-head); }
.cd-nav a:hover i { width: 64px; background: var(--cd-accent); }
.cd-socials a { color: var(--cd-mute); }
.cd-socials a:hover { color: var(--cd-head); background: rgb(255 255 255 / .06); }

.cd-main { padding: clamp(40px, 8cqi, 96px) 0; }
.cd-sec { margin-bottom: clamp(60px, 10cqi, 120px); scroll-margin-top: 30px; }
.cd-h2 { display: none; }
.cd-text { display: grid; gap: 16px; line-height: 2.05; }
.cd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.cd-chip { padding: 5px 13px; border-radius: 999px; background: color-mix(in srgb, var(--color-primary) 16%, transparent); color: var(--cd-accent); font-size: .76em; font-weight: 600; }
.cd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.cd-list > li { animation: cd-in .8s cubic-bezier(.2, 1, .3, 1) both; }
.cd-row { position: relative; display: grid; grid-template-columns: 9em 1fr; gap: 18px; padding: 20px; margin-inline: -20px; border-radius: 14px; transition: background .3s, box-shadow .3s; }
.cd-row:hover { background: rgb(148 163 184 / .06); box-shadow: inset 0 1px 0 rgb(148 163 184 / .1); }
.cd-list:hover > li > .cd-row:not(:hover), .cd-list:hover > li:not(:hover) > .cd-row { opacity: .55; }
.cd-row { transition: background .3s, box-shadow .3s, opacity .3s; }
.cd-date { padding-top: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .74em; letter-spacing: .03em; text-transform: uppercase; }
.cd-row h3 { color: var(--cd-head); font-size: 1.02em; font-weight: 600; line-height: 1.6; }
.cd-at { color: var(--cd-mute); font-weight: 400; }
.cd-row p { margin-top: 8px; font-size: .9em; line-height: 1.95; }
.cd-row:hover h3 { color: var(--cd-accent); }
.cd-shot { aspect-ratio: 16 / 10; border-radius: 8px; overflow: hidden; border: 2px solid rgb(148 163 184 / .2); background: rgb(148 163 184 / .1); transition: border-color .3s; }
.cd-shot img { width: 100%; height: 100%; object-fit: cover; }
.cd-proj:hover .cd-shot { border-color: rgb(148 163 184 / .4); }
.cd-go { width: 15px; height: 15px; margin-inline-start: 6px; vertical-align: middle; transition: transform .3s; }
.cd[dir="rtl"] .cd-go { transform: scaleX(-1); }
.cd-proj:hover .cd-go { transform: translate(-3px, -3px) scaleX(-1); }
.cd-certs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.cd-certs .p-cert-pic { aspect-ratio: 4 / 3; border-radius: 10px; padding: 10px; background: rgb(148 163 184 / .08); border: 1px solid rgb(148 163 184 / .15); }
.cd-certs .p-cert-pic img { object-fit: contain; }
.cd-certs strong { color: var(--cd-head); font-weight: 600; font-size: .92em; }
.cd-note { font-size: .8em; opacity: .7; }

@container (max-width: 860px) {
  .cd-wrap { grid-template-columns: 1fr; }
  .cd-side { position: static; height: auto; padding-bottom: 20px; gap: 24px; }
  .cd-nav { display: none; }
  .cd-h2 { display: block; position: sticky; top: 0; z-index: 2; margin: 0 -16px 18px; padding: 14px 16px; background: color-mix(in srgb, var(--cd-bg) 85%, transparent); backdrop-filter: blur(8px); color: var(--cd-head); font-size: .85em; font-weight: 700; letter-spacing: .1em; }
  .cd-main { padding-top: 0; }
}
@container (max-width: 520px) {
  .cd-row { grid-template-columns: 1fr; gap: 8px; }
  .cd-certs { grid-template-columns: 1fr; }
}
@supports (animation-timeline: view()) {
  .cd-list > li, .cd-text, .cd-certs > * { animation: cd-in linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
}
@media (prefers-reduced-motion: reduce) {
  .cd-side, .cd-nav a, .cd-list > li, .cd-text, .cd-certs > * { animation: none !important; }
}
`;
