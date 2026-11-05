/** @jsxRuntime automatic @jsxImportSource react */
// Bento grid: rounded cards of different sizes on a soft background. A large intro card in the
// main color, cards for contact, skills and languages, then experience and projects.

import { Avatar, ContactList, Footer, Links, WebPage, WebSections, hasContact, webCtx } from "./kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-bento { background: color-mix(in srgb, var(--color-primary) 5%, #F4F4F6); }
.t-bento .b-wrap { max-width: 1120px; margin: 0 auto; padding: calc(var(--w-space) * 2.5) calc(var(--w-space) * 1.2) 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: calc(var(--w-space) * 1); }
.t-bento .b-card { grid-column: span 2; padding: calc(var(--w-space) * 1.6); border-radius: calc(var(--radius) * 2.5); background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / .04); min-width: 0; }
.t-bento .b-card .k-section { margin-top: 0; }
.t-bento .b-hero { grid-column: span 4; display: flex; flex-direction: column; justify-content: space-between; gap: calc(var(--w-space) * 2); min-height: 300px; background: var(--color-primary); color: var(--color-on-primary); }
.t-bento .b-hero-top { display: flex; align-items: center; gap: 1rem; }
.t-bento .b-photo { width: 76px; height: 76px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-on-primary) 40%, transparent); }
.t-bento .b-role { padding: .25rem .9rem; border-radius: 999px; background: color-mix(in srgb, var(--color-on-primary) 16%, transparent); font-weight: 600; font-size: .92em; }
.t-bento .b-name { font-family: var(--font-heading); font-size: clamp(2em, 5.4cqi, 3.4em); font-weight: 900; line-height: 1.15; }
.t-bento .b-summary { margin-top: .6rem; opacity: .9; white-space: pre-line; max-width: 36em; }
.t-bento .b-hero .w-links a { border-color: color-mix(in srgb, var(--color-on-primary) 45%, transparent); }
.t-bento .b-contact { display: flex; flex-direction: column; justify-content: center; gap: 1rem; }
.t-bento .b-contact .k-icon { box-sizing: content-box; padding: .45rem; border-radius: 10px; background: var(--color-primary-soft); fill: var(--color-primary-strong); }
.t-bento .b-label { font-size: .85em; font-weight: 700; color: var(--color-muted); }
.t-bento .b-wide { grid-column: span 4; }
.t-bento .b-full { grid-column: 1 / -1; }
.t-bento .k-h2 { font-size: 1.15em; }
.t-bento .k-h2-icon { display: block; padding: .3rem; box-sizing: content-box; border-radius: 9px; background: var(--color-primary-soft); fill: var(--color-primary-strong); }
.t-bento .b-full .w-project { border: none; background: color-mix(in srgb, var(--color-primary) 5%, #F7F7F9); }

@container (max-width: 860px) {
  .t-bento .b-wrap { grid-template-columns: 1fr 1fr; }
  .t-bento .b-hero, .t-bento .b-wide, .t-bento .b-full { grid-column: 1 / -1; }
  .t-bento .b-card { grid-column: span 1; }
}
@container (max-width: 560px) {
  .t-bento .b-wrap { grid-template-columns: 1fr; }
  .t-bento .b-card { grid-column: 1 / -1; }
}
`;

export function BentoPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const { basics } = props.data;
  const d = props.data;
  // A card is shown only when its section is visible and has content, so no card is left empty.
  const filled: Record<string, boolean> = {
    experience: d.experience.some((x) => x.position || x.company),
    education: d.education.some((x) => x.institution),
    skills: d.skills.some((x) => x.name.trim()),
    projects: d.projects.some((x) => x.title),
    languages: d.languages.some((x) => x.name),
    certificates: d.certificates.some((x) => x.title),
    customSections: d.customSections.some((x) => x.title && x.items.some((i) => i.title)),
  };
  const visible = (key: string) => Boolean(filled[key]) && props.theme.sections.some((s) => s.key === key && s.visible);
  return (
    <WebPage ctx={ctx} className="t-bento" css={css}>
      <div className="b-wrap">
        <header className="b-card b-hero">
          <div className="b-hero-top">
            <Avatar ctx={ctx} className="b-photo" />
            {basics.jobTitle && <span className="b-role">{basics.jobTitle}</span>}
          </div>
          <div>
            <h1 className="b-name">{basics.fullName}</h1>
            {basics.summary && <p className="b-summary">{basics.summary}</p>}
          </div>
          <Links ctx={ctx} />
        </header>
        {hasContact(ctx) && (
          <div className="b-card b-contact">
            <span className="b-label">{ctx.labels.contact}</span>
            <ContactList ctx={ctx} />
          </div>
        )}
        {visible("experience") && (
          <div className="b-card b-wide">
            <WebSections ctx={ctx} keys={["experience"]} />
          </div>
        )}
        {visible("skills") && (
          <div className="b-card">
            <WebSections ctx={ctx} keys={["skills"]} variant="side" />
          </div>
        )}
        {visible("projects") && (
          <div className="b-card b-full">
            <WebSections ctx={ctx} keys={["projects"]} />
          </div>
        )}
        {visible("education") && (
          <div className="b-card b-wide">
            <WebSections ctx={ctx} keys={["education"]} />
          </div>
        )}
        {visible("languages") && (
          <div className="b-card">
            <WebSections ctx={ctx} keys={["languages"]} variant="side" />
          </div>
        )}
        {(visible("certificates") || visible("customSections")) && (
          <div className="b-card b-full">
            <WebSections ctx={ctx} keys={["certificates", "customSections"]} />
          </div>
        )}
      </div>
      <Footer data={props.data} />
    </WebPage>
  );
}
