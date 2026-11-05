/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Vitrine": a calm, multi-page portfolio. Pages: work (home), certificates gallery, about, resume
// and one page per project. The header (photo, page menu, name and tagline) is shared; the home
// page shows it in full with two buttons, inner pages in a compact form. Colors come from the theme.
// Every text and picture carries a data-edit marker so the editor can change it in place.

import type { ReactNode } from "react";
import type { Project, ResumeData } from "@rb/schema";
import { Avatar, WebPage, webCtx, type Ctx } from "./kit";
import { formatNumber, formatPeriod, formatYearMonth, safeUrl } from "../format";
import { displayUrl } from "../kit";
import type { TemplateProps } from "../types";

/* ───────────── Pages ───────────── */

const has = {
  gallery: (d: ResumeData) => Boolean(d.site?.gallery.some((g) => safeUrl(g.image))),
  resume: (d: ResumeData) => d.experience.length + d.education.length + d.certificates.length > 0,
};
const projectsOf = (d: ResumeData) => d.projects.filter((p) => p.title.trim());
export const projectPath = (p: Project) => `/projects/${encodeURIComponent(p.id)}`;

/** Every page this content has, in menu order, plus one page per project. */
export function vitrinePages(data: ResumeData): string[] {
  const off = data.site?.hiddenPages ?? [];
  return [
    "/",
    ...(has.gallery(data) ? ["/gallery"] : []),
    "/about",
    ...(has.resume(data) ? ["/resume"] : []),
    ...projectsOf(data).map(projectPath),
  ].filter((p) => p === "/" || !off.includes(p));
}

/** Pages the user can switch off in the editor, with their menu names. */
export const VITRINE_OPTIONAL_PAGES = ["/gallery", "/about", "/resume"] as const;

const MENU: Record<string, { fa: string; en: string }> = {
  "/": { fa: "نمونه‌کارها", en: "Work" },
  "/gallery": { fa: "مدارک", en: "Certificates" },
  "/about": { fa: "درباره‌ی من", en: "About" },
  "/resume": { fa: "رزومه", en: "Resume" },
};

const TEXT = {
  fa: {
    work: "آخرین کارهایم",
    contact: "گفت‌وگو کنیم",
    hi: (name: string) => `سلام، من ${name} هستم.`,
    back: "همه‌ی کارها",
    visit: "دیدن پروژه",
    source: "کد پروژه",
    experience: "سوابق کاری",
    education: "تحصیلات",
    certificates: "دوره‌ها و گواهینامه‌ها",
    at: " در ",
    notFound: "این صفحه پیدا نشد.",
  },
  en: {
    work: "My latest work",
    contact: "Let's chat",
    hi: (name: string) => `Hi, I am ${name}.`,
    back: "All work",
    visit: "Visit project",
    source: "Source code",
    experience: "Experience",
    education: "Education",
    certificates: "Certificates",
    at: " @ ",
    notFound: "This page was not found.",
  },
};

/* ───────────── Click-to-edit markers ───────────── */

// The editor preview reads these attributes to edit a value in place; on a published site they are inert.
type EditKind = "text" | "multiline" | "image" | "url" | "period" | "month" | "lines" | "tags";
type Edit = { "data-edit": string; "data-edit-kind": EditKind; "data-edit-label": string };
const ed = (path: string, kind: EditKind, label: string): Edit => ({ "data-edit": path, "data-edit-kind": kind, "data-edit-label": label });
const item = (list: string, id: string) => `${list}[${id}]`;

/**
 * An optional value: shown when filled; while editing, an empty one becomes a small "+ label"
 * button so it can still be added. Published pages never show the button.
 */
function Opt({ value, editing, edit, children }: { value: unknown; editing: boolean; edit: Edit; children?: ReactNode }) {
  const filled = Array.isArray(value) ? value.some((v) => String(v).trim()) : Boolean(String(value ?? "").trim());
  if (filled) return <>{children}</>;
  return editing ? (
    <span className="vt-ghost" {...edit}>
      + {edit["data-edit-label"]}
    </span>
  ) : null;
}

/* ───────────── Template ───────────── */

type View = { ctx: Ctx; link: Link; editing: boolean };

export function VitrinePortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const { data } = props;
  const view: View = { ctx, link: props.link ?? ((p: string) => p), editing: Boolean(props.editing) };
  const page = props.page ?? "/";
  const t = TEXT[data.locale];
  const project = page.startsWith("/projects/") ? projectsOf(data).find((p) => projectPath(p) === page) : undefined;

  let body: ReactNode;
  if (page === "/") body = <Work {...view} />;
  else if (page === "/gallery") body = <Gallery {...view} />;
  else if (page === "/about") body = <About {...view} />;
  else if (page === "/resume") body = <Resume {...view} />;
  else if (project) body = <ProjectPage {...view} project={project} />;
  else body = <p className="vt-empty">{t.notFound}</p>;

  return (
    <WebPage ctx={ctx} className="vt" css={css}>
      <div className="vt-wrap">
        <Header {...view} page={page} full={page === "/"} />
        <main className="vt-main">{body}</main>
      </div>
    </WebPage>
  );
}

type Link = (path: string) => string;

/** An internal link; data-page lets the editor preview switch pages without leaving the editor. */
function PageLink({ to, link, className, children, current }: { to: string; link: Link; className?: string; children: ReactNode; current?: boolean }) {
  return (
    <a href={link(to)} data-page={to} className={className} aria-current={current ? "page" : undefined}>
      {children}
    </a>
  );
}

function Header({ ctx, link, editing, page, full }: View & { page: string; full: boolean }) {
  const { data } = ctx;
  const t = TEXT[data.locale];
  const b = data.basics;
  const tagline = data.site?.tagline?.trim() || b.jobTitle;
  const menu = vitrinePages(data).filter((p) => MENU[p]);
  const active = page.startsWith("/projects/") ? "/" : page;
  const email = b.email?.trim();

  return (
    <header className={`vt-header${full ? "" : " compact"}`}>
      <div className="vt-bar">
        <PageLink to="/" link={link} className="vt-photo">
          <span {...ed("basics.avatarUrl", "image", "عکس پروفایل")}>
            <Avatar ctx={ctx} />
          </span>
        </PageLink>
        {/* Shown beside the photo on narrow screens, where the menu moves to its own row. */}
        <div className="vt-bar-id">
          <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
            <b {...ed("basics.jobTitle", "text", "عنوان شغلی")}>{b.jobTitle}</b>
          </Opt>
          <Opt value={b.location} editing={editing} edit={ed("basics.location", "text", "شهر")}>
            <span {...ed("basics.location", "text", "شهر")}>{b.location}</span>
          </Opt>
        </div>
        {menu.length > 1 && (
          <nav className="vt-nav">
            {menu.map((p) => (
              <PageLink key={p} to={p} link={link} current={p === active}>
                {MENU[p]![data.locale]}
              </PageLink>
            ))}
          </nav>
        )}
      </div>
      <h1 className="vt-name" {...ed("basics.fullName", "text", "نام")}>
        {b.fullName}
      </h1>
      <Opt value={tagline} editing={editing} edit={ed("site.tagline", "multiline", "جمله‌ی زیر نام")}>
        <p className="vt-tagline" {...ed("site.tagline", "multiline", "جمله‌ی زیر نام")}>
          {tagline}
        </p>
      </Opt>
      {full && (
        <div className="vt-actions">
          <a className="vt-btn primary" href="#work" {...ed("site.ctaPrimary", "text", "متن دکمه‌ی اول")}>
            {data.site?.ctaPrimary?.trim() || t.work}
          </a>
          {email || editing ? (
            <a className="vt-btn" href={email ? `mailto:${email}` : "#"} {...ed("site.ctaSecondary", "text", "متن دکمه‌ی تماس")}>
              {data.site?.ctaSecondary?.trim() || t.contact}
            </a>
          ) : (
            <PageLink to="/about" link={link} className="vt-btn">
              {data.site?.ctaSecondary?.trim() || t.contact}
            </PageLink>
          )}
          {editing && (
            <span className="vt-ghost" {...ed("basics.email", "text", "ایمیل برای دکمه‌ی تماس")}>
              ✉ {email || "ایمیل"}
            </span>
          )}
        </div>
      )}
    </header>
  );
}

/** Picture with a theme-colored fallback, so a card never looks broken. */
function Picture({ src, alt, ratio, edit }: { src?: string; alt: string; ratio?: string; edit?: Edit }) {
  const url = safeUrl(src);
  return (
    <div className="vt-pic" style={ratio ? { aspectRatio: ratio } : undefined} {...edit}>
      {url ? <img src={url} alt={alt} loading="lazy" /> : <span aria-hidden="true">{alt.trim().charAt(0)}</span>}
    </div>
  );
}

const year = (ym: string | undefined, ctx: Ctx) => (ym ? formatNumber(Number(ym.slice(0, 4)), ctx.data.locale).replace(/٬|,/g, "") : "");

function Work({ ctx, link, editing }: View) {
  const items = projectsOf(ctx.data);
  if (items.length === 0) return null;
  return (
    <section id="work" className="vt-work">
      {items.map((p) => {
        const at = item("projects", p.id);
        return (
          <PageLink key={p.id} to={projectPath(p)} link={link} className="vt-card">
            <Picture src={p.images[0]} alt={p.title} ratio="4 / 3" edit={ed(`${at}.images.0`, "image", "تصویر پروژه")} />
            <div className="vt-card-meta">
              <span className="vt-card-title" {...ed(`${at}.title`, "text", "عنوان پروژه")}>
                {p.title}
              </span>
              <span className="vt-muted vt-card-sub">
                <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "نقش من")}>
                  <span {...ed(`${at}.role`, "text", "نقش من")}>{p.role}</span>
                </Opt>
                <Opt value={p.period?.start} editing={editing} edit={ed(`${at}.period`, "period", "تاریخ پروژه")}>
                  <span {...ed(`${at}.period`, "period", "تاریخ پروژه")}>{p.period ? year(p.period.end || p.period.start, ctx) : ""}</span>
                </Opt>
              </span>
            </div>
          </PageLink>
        );
      })}
    </section>
  );
}

function Gallery({ ctx, editing }: View) {
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <section className="vt-gallery">
      {items.map((g) => {
        const at = item("site.gallery", g.id);
        return (
          <figure key={g.id} className="vt-shot">
            <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${at}.image`, "image", "تصویر مدرک")} />
            <figcaption>
              <Opt value={g.title} editing={editing} edit={ed(`${at}.title`, "text", "عنوان")}>
                <span {...ed(`${at}.title`, "text", "عنوان")}>{g.title}</span>
              </Opt>
              <Opt value={g.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح کوتاه")}>
                <small {...ed(`${at}.description`, "multiline", "توضیح کوتاه")}>{g.description}</small>
              </Opt>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}

function About({ ctx, link, editing }: View) {
  const { data } = ctx;
  const t = TEXT[data.locale];
  const site = data.site;
  const firstName = data.basics.fullName.trim().split(/\s+/)[0] ?? "";
  const text = site?.aboutText?.trim() || data.basics.summary?.trim() || "";
  const skills = data.skills.filter((s) => s.name.trim());
  const email = data.basics.email?.trim();
  return (
    <section className="vt-about">
      <figure className="vt-about-photo">
        <Picture src={site?.aboutImage || data.basics.avatarUrl} alt={data.basics.fullName} ratio="4 / 5" edit={ed("site.aboutImage", "image", "عکس صفحه‌ی درباره‌ی من")} />
        <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "توضیح زیر عکس")}>
          <figcaption {...ed("site.aboutCaption", "text", "توضیح زیر عکس")}>{site?.aboutCaption}</figcaption>
        </Opt>
      </figure>
      <div className="vt-about-text">
        <h2>
          <span className="vt-hi" {...ed("basics.fullName", "text", "نام")}>
            {t.hi(firstName)}
          </span>
          <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "عنوان درباره‌ی من")}>
            <span {...ed("site.aboutTitle", "text", "عنوان درباره‌ی من")}>{site?.aboutTitle}</span>
          </Opt>
        </h2>
        <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          <div className="vt-about-body" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            {text.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Opt>
        {skills.length > 0 && (
          <ul className="k-tags">
            {skills.map((s) => (
              <li key={s.id} {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>
                {s.name}
              </li>
            ))}
          </ul>
        )}
        {email ? (
          <a className="vt-btn" href={`mailto:${email}`} {...ed("site.ctaSecondary", "text", "متن دکمه‌ی تماس")}>
            {site?.ctaSecondary?.trim() || t.contact}
          </a>
        ) : (
          <PageLink to="/" link={link} className="vt-btn">
            {t.back}
          </PageLink>
        )}
      </div>
    </section>
  );
}

function Resume({ ctx, editing }: View) {
  const { data } = ctx;
  const t = TEXT[data.locale];
  const fmt = ctx.theme.display.dateFormat;
  return (
    <div className="vt-resume">
      {data.experience.length > 0 && (
        <Timeline title={t.experience}>
          {data.experience.map((x) => {
            const at = item("experience", x.id);
            return (
              <Row
                key={x.id}
                badge={x.company}
                title={
                  <>
                    <span {...ed(`${at}.position`, "text", "سمت")}>{x.position}</span>
                    {t.at}
                    <span {...ed(`${at}.company`, "text", "شرکت")}>{x.company}</span>
                  </>
                }
                meta={[
                  <span key="p" {...ed(`${at}.period`, "period", "تاریخ شروع و پایان")}>
                    {formatPeriod(x.period, data.locale, fmt)}
                  </span>,
                  <Opt key="l" value={x.location} editing={editing} edit={ed(`${at}.location`, "text", "محل")}>
                    <span {...ed(`${at}.location`, "text", "محل")}>{x.location}</span>
                  </Opt>,
                ]}
              >
                <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                  <p className="vt-row-text" {...ed(`${at}.description`, "multiline", "توضیحات")}>
                    {x.description}
                  </p>
                </Opt>
                <Opt value={x.highlights} editing={editing} edit={ed(`${at}.highlights`, "lines", "دستاوردها")}>
                  <ul className="k-bullets" {...ed(`${at}.highlights`, "lines", "دستاوردها")}>
                    {x.highlights
                      .filter((h) => h.trim())
                      .map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                  </ul>
                </Opt>
              </Row>
            );
          })}
        </Timeline>
      )}
      {data.education.length > 0 && (
        <Timeline title={t.education}>
          {data.education.map((x) => {
            const at = item("education", x.id);
            return (
              <Row
                key={x.id}
                badge={x.institution}
                title={
                  <>
                    <Opt value={x.degree} editing={editing} edit={ed(`${at}.degree`, "text", "مقطع")}>
                      <span {...ed(`${at}.degree`, "text", "مقطع")}>{x.degree}</span>{" "}
                    </Opt>
                    <Opt value={x.field} editing={editing} edit={ed(`${at}.field`, "text", "رشته")}>
                      <span {...ed(`${at}.field`, "text", "رشته")}>{x.field}</span>
                    </Opt>
                  </>
                }
                meta={[
                  <span key="i" {...ed(`${at}.institution`, "text", "دانشگاه یا مؤسسه")}>
                    {x.institution}
                  </span>,
                  <span key="p" {...ed(`${at}.period`, "period", "تاریخ شروع و پایان")}>
                    {formatPeriod(x.period, data.locale, fmt)}
                  </span>,
                  <Opt key="g" value={x.grade} editing={editing} edit={ed(`${at}.grade`, "text", "معدل")}>
                    <span {...ed(`${at}.grade`, "text", "معدل")}>{x.grade}</span>
                  </Opt>,
                ]}
              >
                <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                  <p className="vt-row-text" {...ed(`${at}.description`, "multiline", "توضیحات")}>
                    {x.description}
                  </p>
                </Opt>
              </Row>
            );
          })}
        </Timeline>
      )}
      {data.certificates.length > 0 && (
        <Timeline title={t.certificates}>
          {data.certificates.map((c) => {
            const at = item("certificates", c.id);
            const href = safeUrl(c.url);
            return (
              <Row
                key={c.id}
                badge={c.issuer || c.title}
                title={<span {...ed(`${at}.title`, "text", "عنوان دوره")}>{c.title}</span>}
                meta={[
                  <Opt key="i" value={c.issuer} editing={editing} edit={ed(`${at}.issuer`, "text", "صادرکننده")}>
                    <span {...ed(`${at}.issuer`, "text", "صادرکننده")}>{c.issuer}</span>
                  </Opt>,
                  <Opt key="d" value={c.date} editing={editing} edit={ed(`${at}.date`, "month", "تاریخ")}>
                    <span {...ed(`${at}.date`, "month", "تاریخ")}>{formatYearMonth(c.date, data.locale, fmt)}</span>
                  </Opt>,
                ]}
              >
                <Opt value={href} editing={editing} edit={ed(`${at}.url`, "url", "لینک تأیید")}>
                  <a className="vt-link" href={href} dir="ltr" target="_blank" rel="noopener noreferrer" {...ed(`${at}.url`, "url", "لینک تأیید")}>
                    {href && displayUrl(href)}
                  </a>
                </Opt>
              </Row>
            );
          })}
        </Timeline>
      )}
    </div>
  );
}

function Timeline({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="vt-timeline">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Row({ badge, title, meta, children }: { badge: string; title: ReactNode; meta: ReactNode[]; children?: ReactNode }) {
  return (
    <article className="vt-row">
      <span className="vt-badge" aria-hidden="true">
        {badge.trim().charAt(0)}
      </span>
      <div>
        <h3>{title}</h3>
        <p className="vt-muted vt-meta">{meta}</p>
        {children}
      </div>
    </article>
  );
}

function ProjectPage({ ctx, link, editing, project: p }: View & { project: Project }) {
  const { data } = ctx;
  const t = TEXT[data.locale];
  const at = item("projects", p.id);
  const visit = safeUrl(p.url);
  const source = safeUrl(p.repoUrl);
  const images = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  return (
    <article className="vt-project">
      <PageLink to="/" link={link} className="vt-back">
        {data.locale === "fa" ? "→" : "←"} {t.back}
      </PageLink>
      <h2 {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</h2>
      <p className="vt-muted vt-meta">
        <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "نقش من")}>
          <span {...ed(`${at}.role`, "text", "نقش من")}>{p.role}</span>
        </Opt>
        <Opt value={p.period?.start} editing={editing} edit={ed(`${at}.period`, "period", "تاریخ پروژه")}>
          <span {...ed(`${at}.period`, "period", "تاریخ پروژه")}>{p.period && formatPeriod(p.period, data.locale, ctx.theme.display.dateFormat)}</span>
        </Opt>
      </p>
      <Opt value={p.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح پروژه")}>
        <p className="vt-project-text" {...ed(`${at}.description`, "multiline", "توضیح پروژه")}>
          {p.description}
        </p>
      </Opt>
      <Opt value={p.technologies} editing={editing} edit={ed(`${at}.technologies`, "tags", "ابزارها و تکنولوژی‌ها")}>
        <ul className="k-tags" {...ed(`${at}.technologies`, "tags", "ابزارها و تکنولوژی‌ها")}>
          {p.technologies.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Opt>
      <div className="vt-actions">
        <Opt value={visit} editing={editing} edit={ed(`${at}.url`, "url", "لینک پروژه")}>
          <a className="vt-btn primary" href={visit} target="_blank" rel="noopener noreferrer" {...ed(`${at}.url`, "url", "لینک پروژه")}>
            {t.visit}
          </a>
        </Opt>
        <Opt value={source} editing={editing} edit={ed(`${at}.repoUrl`, "url", "لینک کد پروژه")}>
          <a className="vt-btn" href={source} target="_blank" rel="noopener noreferrer" {...ed(`${at}.repoUrl`, "url", "لینک کد پروژه")}>
            {t.source}
          </a>
        </Opt>
      </div>
      <div className="vt-project-images">
        {(images.length ? images : [undefined]).map((src, i) => (
          <Picture key={src ?? i} src={src} alt={p.title} ratio={src ? undefined : "16 / 9"} edit={ed(`${at}.images.${i}`, "image", "تصویر پروژه")} />
        ))}
        {editing && images.length > 0 && images.length < 6 && (
          <span className="vt-ghost" {...ed(`${at}.images.${images.length}`, "image", "تصویر دیگر")}>
            + تصویر دیگر
          </span>
        )}
      </div>
    </article>
  );
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.vt { --vt-ink: var(--color-text); --vt-line: color-mix(in srgb, var(--color-text) 10%, transparent); --vt-soft: color-mix(in srgb, var(--color-text) 5%, var(--color-bg)); }
.vt-wrap { width: min(1180px, 100% - 2 * clamp(16px, 5cqi, 64px)); margin-inline: auto; padding-block: clamp(20px, 4cqi, 44px) 28px; }
.vt-muted { color: var(--color-muted); }

/* Header */
.vt-bar { display: flex; align-items: center; gap: 16px; min-height: 52px; }
.vt-photo { flex: none; }
.vt-photo .k-avatar { width: 64px; height: 64px; }
.vt-nav { display: flex; gap: 4px; margin-inline: auto; padding: 5px; border-radius: 999px; background: var(--vt-soft); box-shadow: inset 0 0 0 1px var(--vt-line); overflow-x: auto; scrollbar-width: none; }
.vt-nav a { flex: none; padding: 7px 16px; border-radius: 999px; color: var(--color-muted); font-size: .94em; font-weight: 600; transition: background .2s, color .2s; }
.vt-nav a:hover { color: var(--vt-ink); }
.vt-nav a[aria-current="page"] { background: var(--color-bg); color: var(--vt-ink); box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
/* Keeps the menu visually centred while the photo sits at the start. */
.vt-bar::after { content: ""; width: 64px; flex: none; }
.vt-name { margin-top: 20px !important; font-family: var(--font-heading); font-size: clamp(2.1em, 5.5cqi, 3.3em); font-weight: 700; line-height: 1.25; letter-spacing: -.01em; }
.vt-tagline { max-width: 34em; margin-top: 10px !important; color: var(--color-muted); font-size: 1.1em; line-height: 1.85; }
.vt-header.compact .vt-name { font-size: clamp(1.6em, 4cqi, 2.2em); margin-top: 14px !important; }
.vt-header.compact .vt-tagline { font-size: 1em; }
.vt-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.vt-btn { display: inline-flex; align-items: center; padding: 11px 20px; border-radius: 14px; background: var(--vt-soft); box-shadow: inset 0 0 0 1px var(--vt-line); color: var(--vt-ink); font-weight: 700; font-size: .95em; transition: transform .2s; }
.vt-btn:hover { transform: translateY(-2px); }
.vt-btn.primary { background: var(--color-primary); color: var(--color-on-primary); box-shadow: none; }
.vt-main { margin-top: clamp(36px, 6cqi, 64px); padding-bottom: clamp(40px, 7cqi, 90px); }
.vt-bar-id { display: none; min-width: 0; line-height: 1.6; }
.vt-bar-id b { display: block; font-size: .95em; }
.vt-bar-id span { display: block; color: var(--color-muted); font-size: .85em; }
.vt-ghost { display: inline-flex; align-items: center; margin: 2px 4px; padding: 2px 10px; border: 1px dashed currentColor; border-radius: 999px; color: var(--color-muted); font-size: .82em; font-weight: 500; opacity: .75; }
.vt-card-sub { display: inline-flex; gap: 6px; }
.vt-card-sub > span + span::before { content: "·"; margin-inline-end: 6px; }
.vt-hi { display: block; }
.vt-empty { padding: 60px 0; text-align: center; color: var(--color-muted); }

/* Pictures */
.vt-pic { position: relative; overflow: hidden; border-radius: calc(var(--radius) + 12px); background: linear-gradient(135deg, var(--color-primary-soft), var(--color-primary-tint)); box-shadow: inset 0 0 0 1px var(--vt-line); }
.vt-pic img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
.vt-pic span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3.5em; font-weight: 800; color: var(--color-primary-strong); opacity: .5; }

/* Work */
.vt-work { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 44px 28px; scroll-margin-top: 20px; }
.vt-card { display: grid; gap: 14px; }
.vt-card:hover .vt-pic img { transform: scale(1.04); }
.vt-card-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: .95em; }
.vt-card-title { font-weight: 700; }
.vt-card-meta .vt-muted { flex: none; font-size: .92em; }

/* Gallery: masonry columns keep each picture's own height */
.vt-gallery { columns: 3 220px; column-gap: 22px; }
.vt-shot { break-inside: avoid; margin: 0 0 26px !important; }
.vt-shot img { display: block; width: 100%; height: auto; border-radius: calc(var(--radius) + 12px); box-shadow: inset 0 0 0 1px var(--vt-line); background: var(--vt-soft); }
.vt-shot figcaption { display: grid; margin-top: 10px; font-size: .92em; font-weight: 600; color: var(--color-muted); }
.vt-shot small { font-weight: 400; }

/* About */
.vt-about { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: clamp(28px, 5cqi, 64px); align-items: start; }
.vt-about-photo figcaption { margin-top: 10px; text-align: center; font-size: .9em; color: var(--color-muted); }
.vt-about-text { display: grid; gap: 16px; justify-items: start; }
.vt-about-text h2 { display: grid; gap: 6px; font-family: var(--font-heading); font-size: 1.7em; font-weight: 700; line-height: 1.45; margin-bottom: 10px !important; }
.vt-about-text h2 span { color: var(--color-muted); font-weight: 500; }
.vt-about-body { display: grid; gap: 16px; }
.vt-about-text p { color: var(--color-muted); line-height: 2; }

/* Resume */
.vt-resume { display: grid; gap: 48px; }
.vt-timeline h2 { padding-bottom: 14px; border-bottom: 1px solid var(--vt-line); font-family: var(--font-heading); font-size: 1.3em; font-weight: 700; }
.vt-row { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 16px; padding: 22px 0; border-bottom: 1px solid var(--vt-line); }
.vt-badge { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-weight: 800; }
.vt-row h3 { font-size: 1.08em; font-weight: 700; }
.vt-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 2px !important; font-size: .92em; }
.vt-meta span + span::before { content: "·"; margin-inline-end: 14px; opacity: .6; }
.vt-row-text { max-width: 48em; margin-top: 8px !important; color: var(--color-muted); line-height: 1.9; }
.vt-row .k-bullets { margin-top: 8px; color: var(--color-muted); }
.vt-link { display: inline-block; margin-top: 6px; color: var(--color-primary) !important; font-size: .92em; }

/* Project page */
.vt-project { display: grid; gap: 14px; justify-items: start; }
.vt-back { color: var(--color-muted); font-weight: 600; font-size: .94em; }
.vt-project h2 { font-family: var(--font-heading); font-size: clamp(1.7em, 4cqi, 2.4em); font-weight: 700; }
.vt-project-text { max-width: 44em; line-height: 2; }
.vt-project .vt-actions { margin-top: 4px; }
.vt-project-images { display: grid; gap: 22px; width: 100%; margin-top: 18px; }


@container (max-width: 760px) {
  .vt-bar { flex-wrap: wrap; }
  .vt-bar::after { display: none; }
  .vt-bar-id { display: block; flex: 1; }
  .vt-nav { order: 3; width: 100%; margin-inline: 0; }
  .vt-work { grid-template-columns: 1fr; gap: 32px; }
  .vt-about { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .vt-pic img, .vt-btn { transition: none; }
}
`;
