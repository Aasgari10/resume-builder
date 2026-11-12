/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// Shared pieces for website templates. They reuse the resume section renderers from ../kit
// and style them for the screen; layout adapts to the container width (container queries),
// so the editor preview can emulate mobile.

import { ZoomLayers, zoomCss } from "./zoom";
import { siteTheme } from "../palettes";
import type { CSSProperties, ReactNode } from "react";
import { themeToCssVars, type ResumeData } from "@rb/schema";
import { Heading, Section, displayUrl, makeCtx, type Ctx } from "../kit";
import { formatNumber, formatPeriod, linkLabel, safeUrl } from "../format";
import type { TemplateProps } from "../types";

export { Avatar, ContactList, Heading, Section, hasContact, makeCtx, splitSections, type Ctx } from "../kit";

/** Page root for a website template: direction, language, theme variables and styles. */
export function WebPage({ ctx, className, css, children }: { ctx: Ctx; className: string; css: string; children: ReactNode }) {
  const dir = ctx.data.locale === "fa" ? "rtl" : "ltr";
  const vars = themeToCssVars(ctx.theme) as CSSProperties;
  // Large views of the certificates sit outside the page box: the page is a size container, and
  // a full-screen layer inside it would cover the whole (long) page instead of the screen.
  const zoomable = [
    ...(ctx.data.site?.gallery ?? []).map((g) => ({ id: g.id, src: safeUrl(g.image), title: g.title, caption: g.description })),
    // Shop templates enlarge product photos too ("<product id>-<photo number>").
    ...(ctx.data.site?.shop?.products ?? []).flatMap((p) => p.images.map((u, k) => ({ id: `${p.id}-${k}`, src: safeUrl(u), title: p.name, caption: undefined }))),
  ];
  const zoom = zoomable.filter((g): g is { id: string; src: string; title: string; caption: string | undefined } => Boolean(g.src));
  return (
    <div className="w-shell" dir={dir} lang={ctx.data.locale} style={vars}>
      <div className={`w-page ${className}`} dir={dir} lang={ctx.data.locale} style={vars}>
        {/* Set as raw text: as a child string, React escapes ">" and quotes when rendering to a string
            (published pages), which breaks selectors such as "a > b" and values such as content: "". */}
        <style dangerouslySetInnerHTML={{ __html: (webStyles + zoomCss + css).replace(/<\/style/gi, "<\\/style") }} />
        {children}
      </div>
      <ZoomLayers items={zoom} closeLabel={ctx.data.locale === "fa" ? "بستن" : "Close"} />
    </div>
  );
}

// Website templates are drawn with their own designed page colors until the user picks others.
export const webCtx = ({ data, theme }: TemplateProps) => makeCtx(data, siteTheme(theme));

/** Social and website links as pills. */
export function Links({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  const links = ctx.data.basics.links
    .map((l) => ({ id: l.id, href: safeUrl(l.url), label: linkLabel(l, ctx.data.locale) }))
    .filter((l): l is { id: string; href: string; label: string } => Boolean(l.href));
  return links.length === 0 ? null : (
    <div className={`w-links ${className}`}>
      {links.map((l) => (
        <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer">
          {l.label}
        </a>
      ))}
    </div>
  );
}

const GRADIENTS = [
  "linear-gradient(135deg, var(--color-primary-tint), var(--color-primary))",
  "linear-gradient(135deg, var(--color-primary-soft), var(--color-primary-tint))",
  "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
];

/** Project cards with the first image, or a gradient in the theme colors when there is none. */
export function Projects({ ctx, title, className = "" }: { ctx: Ctx; title?: string; className?: string }) {
  const items = ctx.data.projects.filter((p) => p.title);
  if (items.length === 0) return null;
  const { locale } = ctx.data;
  return (
    <section className={`k-section w-projects ${className}`}>
      <Heading icon="projects">{title ?? ctx.labels.sections.projects}</Heading>
      <div className="w-project-grid">
        {items.map((p, i) => {
          const url = safeUrl(p.url) ?? safeUrl(p.repoUrl);
          const image = p.images.map((src) => safeUrl(src)).find(Boolean);
          return (
            <article key={p.id} className="w-project">
              <div className="w-project-media" style={image ? undefined : { background: GRADIENTS[i % GRADIENTS.length] }}>
                {image && <img src={image} alt={p.title} loading="lazy" />}
              </div>
              <div className="w-project-body">
                <h3>{p.title}</h3>
                {p.role && <p className="w-muted">{p.role}</p>}
                {p.description && <p>{p.description}</p>}
                {p.technologies.length > 0 && (
                  <ul className="k-tags">
                    {p.technologies.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                {url && (
                  <a className="w-more" href={url} target="_blank" rel="noopener noreferrer" dir="ltr">
                    {displayUrl(url)}
                  </a>
                )}
                {p.period && <p className="w-muted w-small">{formatPeriod(p.period, locale, ctx.theme.display.dateFormat)}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Visible sections in order; projects use the card layout, the rest the shared renderers. */
export function WebSections({ ctx, keys, variant = "main" }: { ctx: Ctx; keys?: readonly string[]; variant?: "main" | "side" }) {
  return (
    <>
      {ctx.theme.sections
        .filter((s) => s.visible && (!keys || keys.includes(s.key)))
        .map((s) =>
          s.key === "projects" ? (
            <Projects key={s.key} ctx={ctx} title={s.customTitle?.trim() || undefined} />
          ) : (
            <Section key={s.key} section={s} ctx={ctx} variant={variant} />
          )
        )}
    </>
  );
}

export function Footer({ data }: { data: ResumeData }) {
  return (
    <footer className="w-footer">
      © {formatNumber(new Date().getFullYear(), data.locale)} {data.basics.fullName}
    </footer>
  );
}

/* Base screen styles for the shared section markup (k-*) and web pieces (w-*). */
const webStyles = /* css */ `
.w-shell { display: contents; }
.w-page {
  container-type: inline-size;
  --w-space: calc(var(--space-factor, 1) * 1rem);
  --k-space: var(--w-space);
  /* Standard space between a section heading (and its underline) and the section content. */
  --w-head-gap: clamp(18px, 2.4cqi, 28px);
  --k-head-gap: var(--w-head-gap);
  --k-line: color-mix(in srgb, var(--color-text) 12%, transparent);
  min-height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}
.w-page *, .w-page *::before, .w-page *::after { box-sizing: border-box; }
/* Zero-specificity reset (:where), so each template's own margins apply. */
:where(.w-page) :where(h1, h2, h3, p, ul, figure) { margin: 0; padding: 0; }
.w-page ul { list-style: none; }
.w-page a { color: inherit; text-decoration: none; }
.w-muted { color: var(--color-muted); }
.w-small { font-size: .88em; }

.w-page .k-avatar { display: block; width: 120px; height: 120px; border-radius: 50%; object-fit: cover; flex: none; }
.w-page .k-avatar-empty { overflow: hidden; }
.w-page .k-avatar-empty .avatar-silhouette { display: block; width: 100%; height: 100%; }
.w-page .k-contact { display: grid; gap: .45rem; }
.w-page .k-contact li { display: flex; align-items: center; gap: .55rem; min-width: 0; }
.w-page .k-icon { width: 1.05em; height: 1.05em; flex: none; fill: currentColor; opacity: .85; }
.w-page .k-section { margin-top: calc(var(--w-space) * 2.6); }
.w-page .k-h2 { display: flex; align-items: center; gap: .6rem; margin-bottom: var(--w-head-gap); font-family: var(--font-heading); font-size: 1.35em; font-weight: 800; }
.w-page .k-h2-icon { display: none; width: 1.1em; height: 1.1em; flex: none; fill: currentColor; }
.w-page .k-item { padding: calc(var(--w-space) * .9) 0; border-top: 1px solid var(--k-line); }
.w-page .k-item:first-of-type { border-top: none; padding-top: 0; }
.w-page .k-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.w-page .k-item-title { font-weight: 700; font-size: 1.05em; }
.w-page .k-item-sub, .w-page .k-date, .w-page .k-meta { color: var(--color-muted); }
.w-page .k-date { font-size: .9em; white-space: nowrap; }
.w-page .k-desc, .w-page .k-summary { margin-top: .35rem; white-space: pre-line; }
.w-page .k-bullets { margin-top: .35rem; }
.w-page .k-bullets li { position: relative; padding-inline-start: 1.1rem; }
.w-page .k-bullets li::before { content: ""; position: absolute; inset-inline-start: .2rem; top: .75em; width: .38rem; height: .38rem; border-radius: 50%; background: var(--color-primary); }
.w-page .k-tags { display: flex; flex-wrap: wrap; gap: .45rem; }
.w-page .k-tags li { padding: .2rem .8rem; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: .9em; }
.w-page .k-bars { display: grid; gap: .7rem; }
.w-page .k-bars li { display: grid; gap: .25rem; }
.w-page .k-bar { display: block; height: .4rem; border-radius: 999px; background: color-mix(in srgb, currentColor 14%, transparent); overflow: hidden; }
.w-page .k-bar i { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
.w-page .k-langs { display: grid; gap: .5rem; }
.w-page .k-langs li { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
.w-page .k-lang-level { display: inline-flex; align-items: center; gap: .5rem; color: var(--color-muted); font-size: .9em; }
.w-page .k-dots { display: inline-flex; gap: .2rem; }
.w-page .k-dots i { width: .5rem; height: .5rem; border-radius: 50%; background: color-mix(in srgb, currentColor 18%, transparent); }
.w-page .k-dots i.on { background: var(--color-primary); }

.w-links { display: flex; flex-wrap: wrap; gap: .5rem; }
.w-links a { padding: .3rem .95rem; border-radius: 999px; border: 1px solid currentColor; font-size: .92em; opacity: .9; }
.w-links a:hover { opacity: 1; }

.w-project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: calc(var(--w-space) * 1.2); }
.w-project { overflow: hidden; border-radius: var(--radius); background: var(--color-surface); border: 1px solid var(--k-line); display: flex; flex-direction: column; }
.w-project-media { aspect-ratio: 16 / 10; }
.w-project-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.w-project-body { padding: calc(var(--w-space) * 1); display: grid; gap: .45rem; }
.w-project-body h3 { font-size: 1.1em; }
.w-more { color: var(--color-primary) !important; font-size: .9em; }
.w-footer { padding: calc(var(--w-space) * 2) 0; color: var(--color-muted); font-size: .9em; text-align: center; }
`;
