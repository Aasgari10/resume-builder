/** @jsxRuntime automatic @jsxImportSource react */
// Minimal and formal: thin rules, letter-spaced headings, a light contact strip,
// and short lists (skills, languages, certificates) side by side at the end.

import { Avatar, ContactList, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-line { padding: 15mm 15mm 14mm; }
.t-line .t-head { display: flex; align-items: center; gap: 7mm; }
.t-line .t-photo { width: 30mm; height: 36mm; border-radius: var(--radius); }
.t-line .t-name { font-family: var(--font-heading); font-size: 2.6em; font-weight: 300; line-height: 1.15; letter-spacing: 0.04em; }
.t-line .t-role { margin-top: 1.5mm; color: var(--color-primary); font-weight: 600; letter-spacing: 0.12em; }
.t-line .t-strip { margin-top: 6mm; padding: 2.5mm 4mm; border-inline-start: 1.2mm solid var(--color-primary); background: var(--color-primary-soft); }
.t-line .t-strip .k-contact { display: flex; flex-wrap: wrap; gap: 1.5mm 7mm; font-size: 0.92em; }
.t-line .t-strip .k-icon { fill: var(--color-primary); }
.t-line .k-h2 { display: flex; align-items: center; gap: 3mm; color: var(--color-primary); font-size: 1em; letter-spacing: 0.14em; }
.t-line .k-h2::after { content: ""; flex: 1; height: 0.25mm; background: var(--k-line); }
.t-line .t-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(50mm, 1fr)); gap: 0 9mm; }
.t-line .k-date { color: var(--color-primary); opacity: 1; }
`;

export function LineResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-line" css={css}>
      <header className="t-head">
        <Avatar ctx={ctx} className="t-photo" />
        <div>
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        </div>
      </header>
      {hasContact(ctx) && (
        <div className="t-strip">
          <ContactList ctx={ctx} />
        </div>
      )}
      <Summary ctx={ctx} />
      <Sections list={main} ctx={ctx} variant="main" />
      {side.length > 0 && (
        <div className="t-grid">
          <Sections list={side} ctx={ctx} variant="side" />
        </div>
      )}
    </Page>
  );
}
