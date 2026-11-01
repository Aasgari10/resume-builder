/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup), some of which
// would otherwise fall back to the classic `React.createElement` transform.
import type { CSSProperties, ReactNode } from "react";
import { themeToCssVars, type ResumeData, type SectionConfig, type SectionKey, type Theme } from "@rb/schema";
import { LABELS, formatNumber, formatPeriod, formatYearMonth, initials, linkLabel, safeUrl } from "../format";
import type { TemplateProps } from "../types";
import { styles } from "./styles";

type Ctx = { data: ResumeData; theme: Theme; labels: (typeof LABELS)[ResumeData["locale"]] };

/** Single-page portfolio: hero, then sections in the order and visibility set by the theme. */
export function MinimalPortfolio({ data, theme }: TemplateProps) {
  const ctx: Ctx = { data, theme, labels: LABELS[data.locale] };
  const style = themeToCssVars(theme) as CSSProperties;

  return (
    <div className="mp-root" dir={data.locale === "fa" ? "rtl" : "ltr"} lang={data.locale} style={style}>
      <style>{styles}</style>
      <div className="mp-wrap">
        <Hero ctx={ctx} />
        <main>
          {theme.sections
            .filter((s) => s.visible)
            .map((section) => (
              <Section key={section.key} section={section} ctx={ctx} />
            ))}
        </main>
        <footer className="mp-footer">
          © {formatNumber(new Date().getFullYear(), data.locale)} {data.basics.fullName}
        </footer>
      </div>
    </div>
  );
}

/* ───────────── Hero ───────────── */

function Hero({ ctx }: { ctx: Ctx }) {
  const { basics } = ctx.data;
  const avatar = ctx.theme.display.showAvatar ? safeUrl(basics.avatarUrl) : undefined;
  const links = basics.links.map((l) => ({ ...l, href: safeUrl(l.url) })).filter((l) => l.href);

  return (
    <header className="mp-hero">
      {avatar ? (
        <img className="mp-avatar" src={avatar} alt={basics.fullName} />
      ) : (
        basics.fullName.trim() && (
          <div className="mp-avatar" aria-hidden="true">
            {initials(basics.fullName)}
          </div>
        )
      )}
      <div>
        <h1 className="mp-name">{basics.fullName}</h1>
        {basics.jobTitle && <p className="mp-title">{basics.jobTitle}</p>}
        <div className="mp-meta">
          {basics.location && <span>{basics.location}</span>}
          {basics.email && (
            <a href={`mailto:${basics.email}`} dir="ltr">
              {basics.email}
            </a>
          )}
          {basics.phone && (
            <a href={`tel:${basics.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
              {basics.phone}
            </a>
          )}
        </div>
        {links.length > 0 && (
          <div className="mp-links">
            {links.map((l) => (
              <a key={l.id} className="mp-link" href={l.href} target="_blank" rel="noopener noreferrer">
                {linkLabel(l, ctx.data.locale)}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ───────────── Sections ───────────── */

function Section({ section, ctx }: { section: SectionConfig; ctx: Ctx }) {
  const title = (key: Exclude<SectionKey, "customSections">) => section.customTitle?.trim() || ctx.labels.sections[key];

  switch (section.key) {
    case "experience":
      return <Experience title={title("experience")} ctx={ctx} />;
    case "education":
      return <Education title={title("education")} ctx={ctx} />;
    case "skills":
      return <Skills title={title("skills")} ctx={ctx} />;
    case "projects":
      return <Projects title={title("projects")} ctx={ctx} />;
    case "languages":
      return <Languages title={title("languages")} ctx={ctx} />;
    case "certificates":
      return <Certificates title={title("certificates")} ctx={ctx} />;
    case "customSections":
      return <CustomSections ctx={ctx} />;
  }
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mp-section">
      <h2 className="mp-h2">{title}</h2>
      {children}
    </section>
  );
}

function ItemHead({ title, sub, date }: { title: string; sub?: string; date?: string }) {
  return (
    <div className="mp-item-head">
      <div>
        <span className="mp-item-title">{title}</span>
        {sub && <span className="mp-item-sub"> · {sub}</span>}
      </div>
      {date && <span className="mp-date">{date}</span>}
    </div>
  );
}

function Experience({ title, ctx }: { title: string; ctx: Ctx }) {
  const items = ctx.data.experience.filter((x) => x.position || x.company);
  if (items.length === 0) return null;
  const { locale } = ctx.data;
  const { dateFormat } = ctx.theme.display;

  return (
    <Block title={title}>
      <ul>
        {items.map((x) => (
          <li key={x.id} className="mp-item">
            <ItemHead
              title={x.position}
              sub={[x.company, x.location].filter(Boolean).join("، ")}
              date={formatPeriod(x.period, locale, dateFormat)}
            />
            {x.description && <p className="mp-desc">{x.description}</p>}
            {x.highlights.filter(Boolean).length > 0 && (
              <ul className="mp-bullets">
                {x.highlights.filter(Boolean).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Education({ title, ctx }: { title: string; ctx: Ctx }) {
  const items = ctx.data.education.filter((x) => x.institution);
  if (items.length === 0) return null;

  return (
    <Block title={title}>
      <ul>
        {items.map((x) => (
          <li key={x.id} className="mp-item">
            <ItemHead
              title={[x.degree, x.field].filter(Boolean).join(" ") || x.institution}
              sub={x.degree || x.field ? x.institution : undefined}
              date={formatPeriod(x.period, ctx.data.locale, ctx.theme.display.dateFormat)}
            />
            {x.grade && <p className="mp-item-sub">{x.grade}</p>}
            {x.description && <p className="mp-desc">{x.description}</p>}
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Skills({ title, ctx }: { title: string; ctx: Ctx }) {
  const skills = ctx.data.skills.filter((s) => s.name.trim());
  if (skills.length === 0) return null;

  // Group by category, preserving first-seen order; uncategorized skills go last.
  const groups = new Map<string, typeof skills>();
  for (const skill of skills) {
    const key = skill.category?.trim() || "";
    groups.set(key, [...(groups.get(key) ?? []), skill]);
  }
  const uncategorized = groups.get("");
  groups.delete("");
  if (uncategorized) groups.set("", uncategorized);
  const showGroupTitles = groups.size > 1;

  return (
    <Block title={title}>
      {[...groups].map(([category, list]) => (
        <div key={category} className="mp-skill-group">
          {showGroupTitles && <h3 className="mp-h3">{category || ctx.labels.general}</h3>}
          <ul className="mp-skills">
            {list.map((s) => (
              <li key={s.id} className="mp-skill">
                {s.name}
                {ctx.theme.display.showSkillLevel && s.level && <Dots value={s.level} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Block>
  );
}

function Dots({ value }: { value: number }) {
  return (
    <span className="mp-dots" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "mp-dot is-on" : "mp-dot"} />
      ))}
    </span>
  );
}

function Projects({ title, ctx }: { title: string; ctx: Ctx }) {
  const items = ctx.data.projects.filter((p) => p.title);
  if (items.length === 0) return null;

  return (
    <Block title={title}>
      <div className="mp-projects">
        {items.map((p) => {
          const image = p.images.map(safeUrl).find(Boolean);
          const url = safeUrl(p.url);
          const repo = safeUrl(p.repoUrl);
          const date = formatPeriod(p.period, ctx.data.locale, ctx.theme.display.dateFormat);
          return (
            <article key={p.id} className="mp-card">
              {image && <img src={image} alt={p.title} loading="lazy" />}
              <ItemHead title={p.title} sub={p.role} date={date} />
              {p.description && <p className="mp-desc">{p.description}</p>}
              {p.technologies.length > 0 && (
                <ul className="mp-tags">
                  {p.technologies.map((t) => (
                    <li key={t} className="mp-tag">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {(url || repo) && (
                <div className="mp-card-links">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {ctx.labels.viewProject}
                    </a>
                  )}
                  {repo && (
                    <a href={repo} target="_blank" rel="noopener noreferrer">
                      {ctx.labels.sourceCode}
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Block>
  );
}

function Languages({ title, ctx }: { title: string; ctx: Ctx }) {
  const items = ctx.data.languages.filter((l) => l.name);
  if (items.length === 0) return null;

  return (
    <Block title={title}>
      <ul className="mp-langs">
        {items.map((l) => (
          <li key={l.id} className="mp-lang">
            <span>{l.name}</span>
            <span className="mp-item-sub">{ctx.labels.languageLevels[l.level]}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

function Certificates({ title, ctx }: { title: string; ctx: Ctx }) {
  const items = ctx.data.certificates.filter((c) => c.title);
  if (items.length === 0) return null;

  return (
    <Block title={title}>
      <ul>
        {items.map((c) => {
          const url = safeUrl(c.url);
          return (
            <li key={c.id} className="mp-item">
              <ItemHead
                title={c.title}
                sub={c.issuer}
                date={formatYearMonth(c.date, ctx.data.locale, ctx.theme.display.dateFormat)}
              />
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {ctx.labels.verify}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </Block>
  );
}

function CustomSections({ ctx }: { ctx: Ctx }) {
  return (
    <>
      {ctx.data.customSections
        .filter((s) => s.title && s.items.some((i) => i.title))
        .map((s) => (
          <Block key={s.id} title={s.title}>
            <ul>
              {s.items
                .filter((i) => i.title)
                .map((i) => {
                  const url = safeUrl(i.url);
                  return (
                    <li key={i.id} className="mp-item">
                      <ItemHead
                        title={i.title}
                        sub={i.subtitle}
                        date={formatYearMonth(i.date, ctx.data.locale, ctx.theme.display.dateFormat)}
                      />
                      {i.description && <p className="mp-desc">{i.description}</p>}
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {url}
                        </a>
                      )}
                    </li>
                  );
                })}
            </ul>
          </Block>
        ))}
    </>
  );
}
