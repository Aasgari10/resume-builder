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
  /** True when the user switched this field off (theme.hiddenFields). */
  isOff: (key: string) => boolean;
};

export const makeCtx = (data: ResumeData, theme: Theme): Ctx => ({
  data,
  theme,
  labels: LABELS[data.locale],
  isOff: (key) => Boolean(theme.hiddenFields?.includes(key)),
});

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
  if (!ctx.theme.display.showAvatar || ctx.isOff("basics.avatar")) return null;
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
  info: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 9v6h2v-6zm0-4v2h2V7z",
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
export function ContactList({ ctx, className = "", withPersonal = false }: { ctx: Ctx; className?: string; withPersonal?: boolean }) {
  const { basics } = ctx.data;
  const personal = withPersonal ? personalLines(ctx) : [];
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
      {personal.map((line) => (
        <li key={line}>
          <Icon name="info" />
          <span>{line}</span>
        </li>
      ))}
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

/** Birth date, marital status and military service, for printed resumes. */
export function personalLines({ data, labels }: Ctx): string[] {
  const p = data.basics.personal;
  if (!p) return [];
  const t = labels.personal;
  const digits = (v: string) => (data.locale === "fa" ? v.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!) : v);
  return [
    p.birthDate ? `${t.born}: ${digits(p.birthDate)}` : "",
    p.marital ? `${t.marital}: ${t.maritalValues[p.marital]}` : "",
    p.military ? `${t.military}: ${t.militaryValues[p.military]}` : "",
  ].filter(Boolean);
}

/** True when there is anything to show in a contact block. */
export const hasContact = ({ data: { basics } }: Ctx) =>
  Boolean(basics.phone || basics.email || basics.location || basics.links.some((l) => safeUrl(l.url)));

/* ───────────── Sections ───────────── */

type Variant = "main" | "side";

const SECTION_ICONS = {
  experience: "M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zm0 3h4V5h-4zM3 13h7v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  education: "M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2v3.6L12 21l7-4.2v-3.6L12 17z",
  skills: "M12 2.5l2.9 6.2 6.6.6-5 4.5 1.5 6.6L12 17l-6 3.4 1.5-6.6-5-4.5 6.6-.6z",
  projects: "M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  languages: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c.9 1.2 1.6 2.5 2 4h-4c.4-1.5 1.1-2.8 2-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-3.6C7.9 5.5 7.4 6.7 8.1 8zM12 20c-.9-1.2-1.6-2.5-2-4h4c-.4 1.5-1.1 2.8-2 4zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4zM16 8c-.3-1.3-.8-2.5-1.4-3.6A8 8 0 0 1 18.9 8z",
  certificates: "M12 2a6 6 0 0 1 3.5 10.87V22L12 20l-3.5 2v-9.13A6 6 0 0 1 12 2zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  customSections: "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z",
  profile: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z",
  contact: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 15.5h6c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5zM13 9v1.5h6V9zm0 3v1.5h4V12z",
} as const;

export type SectionIcon = keyof typeof SECTION_ICONS;

/**
 * Section heading with an icon. The icon is hidden by default (.k-h2-icon);
 * templates that want icons show and style it.
 */
export function Heading({ children, icon }: { children: ReactNode; icon?: SectionIcon }) {
  return (
    <h2 className="k-h2">
      {icon && (
        <svg className="k-h2-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d={SECTION_ICONS[icon]} />
        </svg>
      )}
      <span>{children}</span>
    </h2>
  );
}

function Block({ title, icon, children, variant }: { title: string; icon: SectionIcon; children: ReactNode; variant: Variant }) {
  return (
    <section className={`k-section k-${variant} k-section-${icon}`}>
      <Heading icon={icon}>{title}</Heading>
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

/** Readable links under an item, separated by dots. */
function LinkLine({ urls }: { urls: string[] }) {
  return (
    <p className="k-meta k-links">
      {urls.map((u, i) => (
        <span key={u}>
          {i > 0 && " · "}
          <a href={u} dir="ltr">
            {displayUrl(u)}
          </a>
        </span>
      ))}
    </p>
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
  const { dateFormat } = ctx.theme.display;
  const title = (fallback: string) => section.customTitle?.trim() || fallback;
  const period = (p: Parameters<typeof formatPeriod>[0]) => formatPeriod(p, data.locale, dateFormat);

  switch (section.key) {
    case "experience": {
      const items = data.experience.filter((x) => x.position || x.company);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.experience)} icon="experience" variant={variant}>
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
        <Block title={title(labels.sections.education)} icon="education" variant={variant}>
          {items.map((x) => (
            <Item
              key={x.id}
              title={[x.degree, x.field].filter(Boolean).join(" ") || x.institution}
              sub={[x.degree || x.field ? x.institution : "", x.grade ?? ""].filter(Boolean).join("، ")}
              date={period(x.period)}
            >
              {x.description && <p className="k-desc">{x.description}</p>}
            </Item>
          ))}
        </Block>
      );
    }
    case "skills": {
      const skills = data.skills.filter((s) => s.name.trim());
      if (skills.length === 0) return null;
      const bars = skills.some((s) => s.level);
      // Grouped by category when the user set any; skills without one come first.
      const groups = new Map<string, typeof skills>();
      for (const s of skills) {
        const key = s.category?.trim() ?? "";
        groups.set(key, [...(groups.get(key) ?? []), s]);
      }
      return (
        <Block title={title(labels.sections.skills)} icon="skills" variant={variant}>
          {[...groups].map(([category, list]) => (
            <div className="k-skill-group" key={category || "-"}>
              {category && <div className="k-cat">{category}</div>}
              {bars ? (
                <ul className="k-bars">
                  {list.map((s) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      {s.level ? (
                        <span className="k-bar">
                          <i style={{ width: `${(s.level / 5) * 100}%` }} />
                        </span>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="k-tags">
                  {list.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Block>
      );
    }
    case "projects": {
      const items = data.projects.filter((p) => p.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.projects)} icon="projects" variant={variant}>
          {items.map((p) => {
            const links = [safeUrl(p.url), safeUrl(p.repoUrl)].filter((u): u is string => Boolean(u));
            const images = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
            return (
              <Item key={p.id} title={p.title} sub={p.role} date={p.period ? period(p.period) : undefined}>
                {p.description && <p className="k-desc">{p.description}</p>}
                {p.technologies.length > 0 && <p className="k-meta">{p.technologies.join("، ")}</p>}
                {links.length > 0 && <LinkLine urls={links} />}
                {images.length > 0 && (
                  <div className="k-shots">
                    {images.slice(0, 4).map((src) => (
                      <img key={src} src={src} alt="" />
                    ))}
                  </div>
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
        <Block title={title(labels.sections.languages)} icon="languages" variant={variant}>
          <ul className="k-langs">
            {items.map((l) => (
              <li key={l.id}>
                <span>{l.name}</span>
                {!ctx.isOff("languages.level") && (
                  <span className="k-lang-level">
                    {labels.languageLevels[l.level]}
                    <Dots value={LANGUAGE_DOTS[l.level]} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Block>
      );
    }
    case "certificates": {
      const items = data.certificates.filter((c) => c.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.certificates)} icon="certificates" variant={variant}>
          {items.map((c) => (
            <Item key={c.id} title={c.title} sub={c.issuer} date={formatYearMonth(c.date, data.locale, dateFormat)}>
              {safeUrl(c.url) && <LinkLine urls={[safeUrl(c.url)!]} />}
            </Item>
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
              <Block key={s.id} title={s.title} icon="customSections" variant={variant}>
                {s.items
                  .filter((i) => i.title)
                  .map((i) => (
                    <Item key={i.id} title={i.title} sub={i.subtitle} date={formatYearMonth(i.date, data.locale, dateFormat)}>
                      {i.description && <p className="k-desc">{i.description}</p>}
                      {safeUrl(i.url) && <LinkLine urls={[safeUrl(i.url)!]} />}
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
    <Block title={ctx.labels.profile} icon="profile" variant={variant}>
      <p className="k-summary">{summary}</p>
    </Block>
  ) : null;
}
