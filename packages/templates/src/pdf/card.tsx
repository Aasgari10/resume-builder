/** @jsxRuntime automatic @jsxImportSource react */
// Intro card in the theme color with the photo on its edge, contact beside it,
// and a light side panel; headings carry a small diamond marker.

import { Avatar, ContactList, Page, Sections, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-card { display: flex; flex-direction: column; padding: 12mm 12mm 0; }
.t-card .t-top { display: grid; grid-template-columns: 1fr 58mm; gap: 8mm; align-items: start; }
.t-card .t-intro { position: relative; padding: 8mm 9mm 9mm; padding-inline-end: 26mm; border-radius: calc(var(--radius) * 1.5); background: var(--color-primary-strong); color: var(--color-on-primary); }
.t-card .t-name { font-family: var(--font-heading); font-size: 2.2em; font-weight: 700; line-height: 1.2; }
.t-card .t-role { margin-top: 0.5mm; color: var(--color-primary-tint); font-weight: 600; letter-spacing: 0.03em; }
.t-card .t-summary { margin-top: 3mm; font-size: 0.95em; white-space: pre-line; opacity: 0.92; }
.t-card .t-photo { position: absolute; top: 50%; inset-inline-end: -14mm; transform: translateY(-50%); width: 34mm; height: 34mm; box-shadow: 0 0 0 1.5mm #fff; }
.t-card .t-top .k-contact { padding-top: 3mm; padding-inline-start: 8mm; font-size: 0.92em; }
.t-card .t-top .k-icon { fill: var(--color-primary); }
.t-card .t-body { flex: 1; display: grid; grid-template-columns: 1fr 62mm; gap: 8mm; margin-top: 8mm; }
.t-card .t-side { padding: 6mm; border-radius: calc(var(--radius) * 1.5) calc(var(--radius) * 1.5) 0 0; background: #F3F4F6; }
.t-card .t-main { padding-bottom: 14mm; }
.t-card .k-h2 { display: flex; align-items: center; gap: 2.5mm; color: var(--color-primary-strong); letter-spacing: 0.04em; }
.t-card .k-h2::before { content: ""; width: 3mm; height: 3mm; transform: rotate(45deg); border-radius: 0.6mm; background: var(--color-primary); flex: none; }
.t-card .t-main .k-item-sub { color: var(--color-primary); opacity: 1; }
`;

export function CardResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-card" css={css}>
      <div className="t-top">
        <header className="t-intro">
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
          {data.basics.summary && <p className="t-summary">{data.basics.summary}</p>}
          <Avatar ctx={ctx} className="t-photo" />
        </header>
        {hasContact(ctx) && <ContactList ctx={ctx} />}
      </div>
      <div className="t-body">
        <main className="t-main">
          <Sections list={main} ctx={ctx} variant="main" />
        </main>
        <aside className="t-side">
          <Sections list={side} ctx={ctx} variant="side" />
        </aside>
      </div>
    </Page>
  );
}
