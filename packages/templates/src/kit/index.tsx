/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// Shared building blocks for printable resume templates. Templates arrange these blocks
// and style them through their own root class; colors always come from theme variables.

import type { CSSProperties, ReactNode } from "react";
import { themeToCssVars, type ResumeData, type SectionConfig, type SectionKey, type Theme } from "@rb/schema";
import { Silhouette } from "../avatar";
import { LABELS, formatPeriod, formatYearMonth, linkLabel, safeUrl } from "../format";
import { kitStyles } from "./styles";

export type Ctx = {
  data: ResumeData;
  theme: Theme;
  labels: (typeof LABELS)[ResumeData["locale"]];
};

export const makeCtx = (data: ResumeData, theme: Theme): Ctx => ({ data, theme, labels: LABELS[data.locale] });

/** URL without protocol, "www." or trailing slash, for printing as readable text. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

/** Visible sections in the user's order, split between the main column and a side column. */
export function splitSections(theme: Theme, sideKeys: readonly SectionKey[]) {
  const visible = theme.sections.filter((s) => s.visible);
  return {
    main: visible.filter((s) => !sideKeys.includes(s.key)),
    side: visible.filter((s) => sideKeys.includes(s.key)),
  };
}

/* ───────────── Page ───────────── */

/** A4 page root: direction, language, theme variables and styles. */
export function Page({ ctx, className, css, children }: { ctx: Ctx; className: string; css: string; children: ReactNode }) {
  return (
    <div
      className={`k-page ${className}`}
      dir={ctx.data.locale === "fa" ? "rtl" : "ltr"}
      lang={ctx.data.locale}
      style={themeToCssVars(ctx.theme) as CSSProperties}
    >
      <style>{kitStyles + css}</style>
      {children}
    </div>
  );
}

/* ───────────── Avatar ───────────── */

/** The user's photo, or a silhouette in the theme colors when there is none. Hidden when turned off. */
export function Avatar({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  if (!ctx.theme.display.showAvatar) return null;
  const { basics } = ctx.data;
  const src = safeUrl(basics.avatarUrl);
  return src ? (
    <img className={`k-avatar ${className}`} src={src} alt={basics.fullName} />
  ) : (
    <div className={`k-avatar k-avatar-empty ${className}`} aria-hidden="true">
      <Silhouette />
    </div>
  );
}

/* ───────────── Contact ───────────── */

const ICONS = {
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  mail: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V7zm16 2.75-8 5-8-5V17h16z",
  pin: "M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5z",
  link: "M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 0 0-4.24-4.24l-1.5 1.5 1.41 1.41 1.5-1.5a1 1 0 0 1 1.42 1.42l-4 4a1 1 0 0 0 0 1.41zm2.8-2.8a1 1 0 0 0-1.4 0l-4 4a3 3 0 1 0 4.24 4.24l1.5-1.5-1.41-1.41-1.5 1.5a1 1 0 1 1-1.42-1.42l4-4a1 1 0 0 0 0-1.41z",
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="k-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Email, phone, location and links, one per line with an icon. */
export function ContactList({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  const { basics } = ctx.data;
  const links = basics.links
    .map((l) => ({ url: safeUrl(l.url), label: linkLabel(l, ctx.data.locale) }))
    .filter((l): l is { url: string; label: string } => Boolean(l.url));

  return (
    <ul className={`k-contact ${className}`}>
      {basics.phone && (
        <li>
          <Icon name="phone" />
          <span dir="ltr">{basics.phone}</span>
        </li>
      )}
      {basics.email && (
        <li>
          <Icon name="mail" />
          <a href={`mailto:${basics.email}`} dir="ltr">
            {basics.email}
          </a>
        </li>
      )}
      {basics.location && (
        <li>
          <Icon name="pin" />
          <span>{basics.location}</span>
        </li>
      )}
      {links.map((l) => (
        <li key={l.url}>
          <Icon name="link" />
          <a href={l.url} dir="ltr" title={l.label}>
            {displayUrl(l.url)}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** True when there is anything to show in a contact block. */
export const hasContact = ({ data: { basics } }: Ctx) =>
  Boolean(basics.phone || basics.email || basics.location || basics.links.some((l) => safeUrl(l.url)));

/* ───────────── Sections ───────────── */

type Variant = "main" | "side";

/** Section heading; templates style .k-h2 (and may wrap it with decorations via CSS). */
export function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="k-h2">
      <span>{children}</span>
    </h2>
  );
}

function Block({ title, children, variant }: { title: string; children: ReactNode; variant: Variant }) {
  return (
    <section className={`k-section k-${variant}`}>
      <Heading>{title}</Heading>
      {children}
    </section>
  );
}

function Item({ title, sub, date, children }: { title: string; sub?: string; date?: string; children?: ReactNode }) {
  return (
    <div className="k-item">
      <div className="k-item-head">
        <span className="k-item-title">{title}</span>
        {date && <span className="k-date">{date}</span>}
      </div>
      {sub && <div className="k-item-sub">{sub}</div>}
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  const list = items.filter((h) => h.trim());
  return list.length === 0 ? null : (
    <ul className="k-bullets">
      {list.map((h, i) => (
        <li key={i}>{h}</li>
      ))}
    </ul>
  );
}

const LANGUAGE_DOTS = { native: 5, fluent: 5, advanced: 4, intermediate: 3, basic: 2 } as const;

function Dots({ value }: { value: number }) {
  return (
    <span className="k-dots" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= value ? "on" : ""} />
      ))}
    </span>
  );
}

/** One resume section. "side" renders compact versions for narrow columns. */
export function Section({ section, ctx, variant }: { section: SectionConfig; ctx: Ctx; variant: Variant }) {
  const { data, labels } = ctx;
  const { dateFormat, showSkillLevel } = ctx.theme.display;
  const title = (fallback: string) => section.customTitle?.trim() || fallback;
  const period = (p: Parameters<typeof formatPeriod>[0]) => formatPeriod(p, data.locale, dateFormat);

  switch (section.key) {
    case "experience": {
      const items = data.experience.filter((x) => x.position || x.company);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.experience)} variant={variant}>
          {items.map((x) => (
            <Item key={x.id} title={x.position} sub={[x.company, x.location].filter(Boolean).join("، ")} date={period(x.period)}>
              {x.description && <p className="k-desc">{x.description}</p>}
              <Bullets items={x.highlights} />
            </Item>
          ))}
        </Block>
      );
    }
    case "education": {
      const items = data.education.filter((x) => x.institution);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.education)} variant={variant}>
          {items.map((x) => (
            <Item
              key={x.id}
              title={[x.degree, x.field].filter(Boolean).join(" ") || x.institution}
              sub={[x.degree || x.field ? x.institution : "", x.grade ?? ""].filter(Boolean).join("، ")}
              date={period(x.period)}
            >
              {variant === "main" && x.description && <p className="k-desc">{x.description}</p>}
            </Item>
          ))}
        </Block>
      );
    }
    case "skills": {
      const skills = data.skills.filter((s) => s.name.trim());
      if (skills.length === 0) return null;
      if (showSkillLevel && skills.some((s) => s.level)) {
        return (
          <Block title={title(labels.sections.skills)} variant={variant}>
            <ul className="k-bars">
              {skills.map((s) => (
                <li key={s.id}>
                  <span>{s.name}</span>
                  <span className="k-bar">
                    <i style={{ width: `${((s.level ?? 3) / 5) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        );
      }
      return (
        <Block title={title(labels.sections.skills)} variant={variant}>
          <ul className="k-tags">
            {skills.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </Block>
      );
    }
    case "projects": {
      const items = data.projects.filter((p) => p.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.projects)} variant={variant}>
          {items.map((p) => {
            const url = safeUrl(p.url) ?? safeUrl(p.repoUrl);
            return (
              <Item key={p.id} title={p.title} sub={p.role} date={p.period ? period(p.period) : undefined}>
                {p.description && <p className="k-desc">{p.description}</p>}
                {(p.technologies.length > 0 || url) && (
                  <p className="k-meta">
                    {p.technologies.join("، ")}
                    {p.technologies.length > 0 && url && " · "}
                    {url && (
                      <a href={url} dir="ltr">
                        {displayUrl(url)}
                      </a>
                    )}
                  </p>
                )}
              </Item>
            );
          })}
        </Block>
      );
    }
    case "languages": {
      const items = data.languages.filter((l) => l.name);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.languages)} variant={variant}>
          <ul className="k-langs">
            {items.map((l) => (
              <li key={l.id}>
                <span>{l.name}</span>
                <span className="k-lang-level">
                  {labels.languageLevels[l.level]}
                  <Dots value={LANGUAGE_DOTS[l.level]} />
                </span>
              </li>
            ))}
          </ul>
        </Block>
      );
    }
    case "certificates": {
      const items = data.certificates.filter((c) => c.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.certificates)} variant={variant}>
          {items.map((c) => (
            <Item key={c.id} title={c.title} sub={c.issuer} date={formatYearMonth(c.date, data.locale, dateFormat)} />
          ))}
        </Block>
      );
    }
    case "customSections":
      return (
        <>
          {data.customSections
            .filter((s) => s.title && s.items.some((i) => i.title))
            .map((s) => (
              <Block key={s.id} title={s.title} variant={variant}>
                {s.items
                  .filter((i) => i.title)
                  .map((i) => (
                    <Item key={i.id} title={i.title} sub={i.subtitle} date={formatYearMonth(i.date, data.locale, dateFormat)}>
                      {i.description && <p className="k-desc">{i.description}</p>}
                    </Item>
                  ))}
              </Block>
            ))}
        </>
      );
  }
}

/** Renders a list of sections in one column. */
export function Sections({ list, ctx, variant }: { list: SectionConfig[]; ctx: Ctx; variant: Variant }) {
  return (
    <>
      {list.map((s) => (
        <Section key={s.key} section={s} ctx={ctx} variant={variant} />
      ))}
    </>
  );
}

/** "About me" block from the summary, with the same heading style as other sections. */
export function Summary({ ctx, variant = "main" }: { ctx: Ctx; variant?: Variant }) {
  const { summary } = ctx.data.basics;
  return summary ? (
    <Block title={ctx.labels.profile} variant={variant}>
      <p className="k-summary">{summary}</p>
    </Block>
  ) : null;
}
