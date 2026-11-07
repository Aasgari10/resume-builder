/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Simple": one narrow, centered column, like a page linked from an Instagram bio. Photo, name,
// a line about the person and contact buttons on top; below them short cards for projects,
// experience, certificates and skills. Light, airy and quick to read on a phone.
// Every section can be switched off (site.hiddenBlocks).

import type { CSSProperties, ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatPeriod, safeUrl } from "../format";
import { sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Certificates, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, paragraphs, partsCss, type View } from "./parts";

export const SIMPLE_BLOCKS = [
  { key: "about", label: "درباره" },
  { key: "projects", label: "پروژه‌ها" },
  { key: "experience", label: "سوابق کاری" },
  { key: "certificates", label: "مدارک" },
  { key: "skills", label: "مهارت‌ها" },
] as const;

export const simplePages = () => ["/"];

export function SimplePortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing) };
  const { data } = ctx;
  const on = (k: string) => blockOn(data, k);
  const hasCerts = Boolean(data.site?.gallery.some((g) => safeUrl(g.image)));
  let i = 1;
  return (
    <WebPage ctx={ctx} className="sm" css={partsCss + css}>
      <div className="sm-col">
        <Profile {...view} />
        {on("about") && <About {...view} i={i++} />}
        {on("projects") && data.projects.length > 0 && (
          <Card title="پروژه‌ها" i={i++}>
            <Projects {...view} />
          </Card>
        )}
        {on("experience") && data.experience.length > 0 && (
          <Card title="سوابق کاری" i={i++}>
            <Experience {...view} />
          </Card>
        )}
        {on("certificates") && (hasCerts || view.editing) && (
          <Card title="مدارک" i={i++}>
            <Certificates ctx={ctx} editing={view.editing} className="sm-certs" />
          </Card>
        )}
        {on("skills") && data.skills.length > 0 && (
          <Card title="مهارت‌ها" i={i++}>
            <div className="sm-tags">
              {data.skills
                .filter((s) => s.name.trim())
                .map((s) => (
                  <span key={s.id} {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>
                    {s.name}
                  </span>
                ))}
            </div>
          </Card>
        )}
        <p className="sm-foot">
          ©{" "}
          <PageLink to="/" link={view.link}>
            {data.basics.fullName}
          </PageLink>{" "}
          · {data.basics.location}
        </p>
      </div>
    </WebPage>
  );
}

function Card({ title, i, children }: { title: string; i: number; children: ReactNode }) {
  return (
    <section className="sm-card" style={{ "--i": i } as CSSProperties}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Profile({ ctx, editing }: View) {
  const b = ctx.data.basics;
  const photo = safeUrl(b.avatarUrl);
  const tagline = ctx.data.site?.tagline?.trim() || "";
  const whatsapp = b.links.find((l) => l.type === "whatsapp" && safeUrl(l.url));
  return (
    <header className="sm-profile">
      <div className="sm-photo" {...ed("basics.avatarUrl", "image", "عکس پروفایل")}>
        {photo ? <img src={photo} alt={b.fullName} /> : <span>{b.fullName.charAt(0)}</span>}
        <i aria-hidden="true" />
      </div>
      <h1 {...ed("basics.fullName", "text", "نام")}>{b.fullName}</h1>
      <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
        <p className="sm-job" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
          {b.jobTitle}
          {b.location && <span> · {b.location}</span>}
        </p>
      </Opt>
      <Opt value={tagline} editing={editing} edit={ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
        <p className="sm-tag" {...ed("site.tagline", "multiline", "جمله‌ی معرفی")}>
          {tagline}
        </p>
      </Opt>
      <div className="sm-buttons">
        {b.email && (
          <a href={`mailto:${b.email}`} className="sm-btn main">
            <Icon name="mail" /> ایمیل بزنید
          </a>
        )}
        {whatsapp ? (
          <a href={safeUrl(whatsapp.url)} {...outside(safeUrl(whatsapp.url))} className="sm-btn">
            <Icon name="whatsapp" /> واتس‌اپ
          </a>
        ) : (
          b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="sm-btn">
              <Icon name="phone" /> تماس
            </a>
          )
        )}
      </div>
      <Socials ctx={ctx} editing={editing} className="sm-socials" />
    </header>
  );
}

function About({ ctx, editing, i }: View & { i: number }) {
  const text = ctx.data.site?.aboutText?.trim() || ctx.data.basics.summary?.trim() || "";
  return (
    <Card title="درباره" i={i}>
      <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
        <div className="sm-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          {paragraphs(text).map((p, k) => (
            <p key={k}>{p}</p>
          ))}
        </div>
      </Opt>
    </Card>
  );
}

function Projects({ ctx, editing }: View) {
  return (
    <div className="sm-list">
      {ctx.data.projects
        .filter((p) => p.title.trim())
        .map((p) => {
          const at = item("projects", p.id);
          const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
          const img = safeUrl(p.images[0]);
          return (
            <a key={p.id} href={href ?? "#"} {...outside(href)} className="sm-link">
              <span className="sm-thumb" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
                {img ? <img src={img} alt="" loading="lazy" /> : <b>{p.title.charAt(0)}</b>}
              </span>
              <span className="sm-link-text">
                <strong {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</strong>
                <Opt value={p.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح کوتاه")}>
                  <small {...ed(`${at}.description`, "multiline", "توضیح کوتاه")}>{p.description}</small>
                </Opt>
              </span>
              <Icon name="arrow" className="p-ico sm-go" />
            </a>
          );
        })}
    </div>
  );
}

function Experience({ ctx }: View) {
  const fmt = ctx.theme.display.dateFormat;
  return (
    <div className="sm-list">
      {ctx.data.experience.map((x) => {
        const at = item("experience", x.id);
        return (
          <div key={x.id} className="sm-job-row">
            <span className="sm-dot" aria-hidden="true">
              {x.company.trim().charAt(0)}
            </span>
            <span className="sm-link-text">
              <strong {...ed(`${at}.position`, "text", "سمت")}>{x.position}</strong>
              <small>
                <span {...ed(`${at}.company`, "text", "شرکت")}>{x.company}</span> ·{" "}
                <span {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, ctx.data.locale, fmt)}</span>
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function simpleSample(locale: ResumeData["locale"]): ResumeData {
  return sampleResume(locale);
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.sm { --sm-bg: #F7F7F5; --sm-card: #FFFFFF; --sm-ink: #1A1A1A; --sm-mute: #737373; --sm-line: #ECECEA;
  background: var(--sm-bg); color: var(--sm-ink); min-height: 100%;
  background-image: radial-gradient(700px 360px at 50% -80px, var(--color-primary-soft), transparent 70%); }
.sm a { color: inherit; }
.sm-col { width: min(640px, 100% - 32px); margin: 0 auto; padding: clamp(36px, 7cqi, 80px) 0 40px; display: grid; gap: 16px; }
.sm-profile { display: grid; justify-items: center; gap: 10px; text-align: center; margin-bottom: 18px; animation: sm-grow .8s cubic-bezier(.2, 1.2, .3, 1) both; }
@keyframes sm-grow { from { opacity: 0; transform: scale(.88); } }
.sm-photo { position: relative; width: 112px; height: 112px; }
.sm-photo img, .sm-photo span { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.sm-photo span { display: grid; place-items: center; background: var(--color-primary); color: #fff; font-size: 2.6em; font-weight: 800; }
.sm-photo i { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--color-primary); border-right-color: transparent; border-bottom-color: transparent; animation: sm-spin 6s linear infinite; }
@keyframes sm-spin { to { rotate: 360deg; } }
.sm-profile h1 { margin-top: 6px; font-size: 1.6em; font-weight: 800; }
.sm-job { color: var(--sm-mute); font-size: .92em; }
.sm-tag { max-width: 30em; line-height: 1.9; }
.sm-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
.sm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; background: var(--sm-card); box-shadow: inset 0 0 0 1px var(--sm-line), 0 6px 16px -12px rgb(0 0 0 / .4); font-weight: 600; font-size: .92em; transition: transform .2s, box-shadow .2s; }
.sm-btn.main { background: var(--sm-ink); color: #fff; box-shadow: none; }
.sm-btn:hover { transform: translateY(-2px); }
.sm-btn .p-ico { width: 18px; height: 18px; }
.sm-socials { justify-content: center; }
.sm-socials a { color: var(--sm-mute); }
.sm-socials a:hover { color: var(--color-primary); background: var(--sm-card); }

.sm-card { padding: 22px; border-radius: 22px; background: var(--sm-card); box-shadow: inset 0 0 0 1px var(--sm-line), 0 18px 40px -34px rgb(0 0 0 / .45);
  animation: sm-grow .8s calc(.15s + var(--i) * .1s) cubic-bezier(.2, 1.2, .3, 1) backwards; }
.sm-card h2 { margin-bottom: 14px; color: var(--sm-mute); font-size: .8em; font-weight: 700; letter-spacing: .06em; }
.sm-text { display: grid; gap: 12px; line-height: 2; font-size: .95em; }
.sm-list { display: grid; gap: 6px; }
.sm-link, .sm-job-row { display: flex; align-items: center; gap: 14px; padding: 10px; margin: 0 -10px; border-radius: 16px; transition: background .2s; }
.sm-link:hover { background: var(--sm-bg); }
.sm-thumb { position: relative; width: 58px; height: 58px; flex: none; border-radius: 14px; overflow: hidden; background: var(--color-primary-soft); }
.sm-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.sm-thumb b { position: absolute; inset: 0; display: grid; place-items: center; color: var(--color-primary); }
.sm-link:hover .sm-thumb img { transform: scale(1.1); }
.sm-link-text { display: grid; gap: 3px; min-width: 0; flex: 1; }
.sm-link-text small { color: var(--sm-mute); font-size: .82em; line-height: 1.7; }
.sm-go { width: 18px; height: 18px; color: var(--sm-mute); transition: transform .25s, color .25s; }
.sm[dir="rtl"] .sm-go { transform: scaleX(-1); }
.sm-link:hover .sm-go { color: var(--color-primary); transform: scaleX(-1) translate(3px, -3px); }
.sm-dot { width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--color-primary-soft); color: var(--color-primary); font-weight: 800; }
.sm-certs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.sm-certs .p-cert-pic { aspect-ratio: 1; border-radius: 14px; padding: 8px; background: var(--sm-bg); }
.sm-certs .p-cert-pic img { object-fit: contain; }
.sm-certs .p-cert-text strong { font-size: .8em; font-weight: 600; line-height: 1.6; }
.sm-certs .p-cert-text small { display: none; }
.sm-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.sm-tags span { padding: 7px 14px; border-radius: 999px; background: var(--sm-bg); box-shadow: inset 0 0 0 1px var(--sm-line); font-size: .86em; }
.sm-foot { margin-top: 18px; text-align: center; color: var(--sm-mute); font-size: .8em; }
@container (max-width: 420px) {
  .sm-certs { grid-template-columns: 1fr 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .sm-profile, .sm-card, .sm-photo i { animation: none; }
}
`;
