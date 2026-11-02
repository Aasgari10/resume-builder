/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
import type { CSSProperties, ReactNode } from "react";
import { themeToCssVars, type ResumeData, type SectionConfig, type Theme } from "@rb/schema";
import { LABELS, formatPeriod, formatYearMonth, safeUrl } from "../format";
import type { TemplateProps } from "../types";
import { styles } from "./styles";

type Ctx = { data: ResumeData; theme: Theme; labels: (typeof LABELS)[ResumeData["locale"]] };

/** URL without protocol, "www." or trailing slash, for printing as readable text. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

/** Single-column A4 resume, designed for printing and saving as PDF. */
export function ClassicResume({ data, theme }: TemplateProps) {
  const ctx: Ctx = { data, theme, labels: LABELS[data.locale] };
  const { basics } = data;
  const links = basics.links.map((l) => safeUrl(l.url)).filter((u): u is string => Boolean(u));

  return (
    <div
      className="cr-root"
      dir={data.locale === "fa" ? "rtl" : "ltr"}
      lang={data.locale}
      style={themeToCssVars(theme) as CSSProperties}
    >
      <style>{styles}</style>
      <header className="cr-header">
        <h1 className="cr-name">{basics.fullName}</h1>
        {basics.jobTitle && <p className="cr-title">{basics.jobTitle}</p>}
        <div className="cr-contact">
          {basics.location && <span>{basics.location}</span>}
          {basics.email && <a href={`mailto:${basics.email}`} dir="ltr">{basics.email}</a>}
          {basics.phone && <span dir="ltr">{basics.phone}</span>}
          {links.map((url) => (
            <a key={url} href={url} dir="ltr">
              {displayUrl(url)}
            </a>
          ))}
        </div>
        {basics.summary && <p className="cr-summary">{basics.summary}</p>}
      </header>

      {theme.sections
        .filter((s) => s.visible)
        .map((s) => (
          <Section key={s.key} section={s} ctx={ctx} />
        ))}
    </div>
  );
}

function Section({ section, ctx }: { section: SectionConfig; ctx: Ctx }) {
  const { data, labels } = ctx;
  const { dateFormat } = ctx.theme.display;
  const title = (fallback: string) => section.customTitle?.trim() || fallback;

  switch (section.key) {
    case "experience": {
      const items = data.experience.filter((x) => x.position || x.company);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.experience)}>
          {items.map((x) => (
            <Item
              key={x.id}
              title={x.position}
              sub={[x.company, x.location].filter(Boolean).join("، ")}
              date={formatPeriod(x.period, data.locale, dateFormat)}
            >
              {x.description && <p className="cr-desc">{x.description}</p>}
              {x.highlights.some(Boolean) && (
                <ul className="cr-bullets">
                  {x.highlights.filter(Boolean).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </Item>
          ))}
        </Block>
      );
    }
    case "education": {
      const items = data.education.filter((x) => x.institution);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.education)}>
          {items.map((x) => (
            <Item
              key={x.id}
              title={[x.degree, x.field].filter(Boolean).join(" ") || x.institution}
              sub={[x.degree || x.field ? x.institution : "", x.grade ?? ""].filter(Boolean).join("، ")}
              date={formatPeriod(x.period, data.locale, dateFormat)}
            >
              {x.description && <p className="cr-desc">{x.description}</p>}
            </Item>
          ))}
        </Block>
      );
    }
    case "skills": {
      const skills = data.skills.filter((s) => s.name.trim());
      if (skills.length === 0) return null;
      const groups = new Map<string, string[]>();
      for (const s of skills) {
        const key = s.category?.trim() || "";
        groups.set(key, [...(groups.get(key) ?? []), s.name]);
      }
      return (
        <Block title={title(labels.sections.skills)}>
          {[...groups].map(([category, names]) => (
            <p key={category} className="cr-group">
              {category && <span className="cr-group-name">{category}: </span>}
              {names.join("، ")}
            </p>
          ))}
        </Block>
      );
    }
    case "projects": {
      const items = data.projects.filter((p) => p.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.projects)}>
          {items.map((p) => {
            const url = safeUrl(p.url) ?? safeUrl(p.repoUrl);
            return (
              <Item key={p.id} title={p.title} sub={p.role} date={formatPeriod(p.period, data.locale, dateFormat)}>
                {p.description && <p className="cr-desc">{p.description}</p>}
                {(p.technologies.length > 0 || url) && (
                  <p className="cr-tech">
                    {p.technologies.join("، ")}
                    {p.technologies.length > 0 && url && " · "}
                    {url && <a href={url} dir="ltr">{displayUrl(url)}</a>}
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
        <Block title={title(labels.sections.languages)}>
          <ul className="cr-inline-list">
            {items.map((l) => (
              <li key={l.id}>
                {l.name} <span className="cr-item-sub">({labels.languageLevels[l.level]})</span>
              </li>
            ))}
          </ul>
        </Block>
      );
    }
    case "certificates": {
      const items = data.certificates.filter((c) => c.title);
      return items.length === 0 ? null : (
        <Block title={title(labels.sections.certificates)}>
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
              <Block key={s.id} title={s.title}>
                {s.items
                  .filter((i) => i.title)
                  .map((i) => (
                    <Item key={i.id} title={i.title} sub={i.subtitle} date={formatYearMonth(i.date, data.locale, dateFormat)}>
                      {i.description && <p className="cr-desc">{i.description}</p>}
                    </Item>
                  ))}
              </Block>
            ))}
        </>
      );
  }
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cr-section">
      <h2 className="cr-h2">{title}</h2>
      {children}
    </section>
  );
}

function Item({ title, sub, date, children }: { title: string; sub?: string; date?: string; children?: ReactNode }) {
  return (
    <div className="cr-item">
      <div className="cr-item-head">
        <div>
          <span className="cr-item-title">{title}</span>
          {sub && <span className="cr-item-sub"> · {sub}</span>}
        </div>
        {date && <span className="cr-date">{date}</span>}
      </div>
      {children}
    </div>
  );
}
