/** @jsxRuntime automatic @jsxImportSource react */
// Dark page with a colored header band, icon headings in a light tone of the main color,
// outlined skill chips and items laid out in two columns.

import { Avatar, ContactList, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-night { display: flex; flex-direction: column; background: #2C2E33; color: #E5E7EB; --k-line: rgb(255 255 255 / 0.16); }
.t-night .t-head { display: flex; align-items: center; gap: 6mm; padding: 9mm 11mm; background: var(--color-primary); color: var(--color-on-primary); }
.t-night .t-photo { width: 32mm; height: 32mm; box-shadow: 0 0 0 1.3mm #fff; }
.t-night .t-id { flex: 1; min-width: 0; }
.t-night .t-name { display: inline-block; padding-bottom: 1mm; border-bottom: 0.6mm solid currentColor; font-family: var(--font-heading); font-size: 2.2em; font-weight: 800; line-height: 1.2; }
.t-night .t-role { margin-top: 1.5mm; font-size: 1.1em; opacity: 0.92; }
.t-night .t-head .k-contact { flex: none; max-width: 64mm; font-size: 0.9em; }
.t-night .t-body { flex: 1; display: grid; grid-template-columns: 1fr 35%; }
.t-night .t-main { padding: 5mm 11mm 14mm; }
.t-night .t-side { padding: 5mm 8mm 14mm; background: #25272B; }
.t-night .k-h2 { display: flex; align-items: center; gap: 2mm; padding-bottom: 1.5mm; border-bottom: 0.3mm solid var(--k-line); color: var(--color-primary-on-dark); }
.t-night .k-h2-icon { display: block; }
.t-night .k-item-sub, .t-night .k-date, .t-night .k-meta { color: #B8BCC4; opacity: 1; }
.t-night .t-main .k-section:not(.k-section-profile) { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 7mm; align-content: start; }
.t-night .t-main .k-section > .k-h2 { grid-column: 1 / -1; margin-bottom: 0; }
.t-night .t-main .k-item + .k-item { margin-top: 0; }
.t-night .k-tags li { background: none; border: 0.3mm solid rgb(255 255 255 / 0.55); color: inherit; }
.t-night :is(.k-bar i, .k-dots i.on, .k-bullets li::before) { background: var(--color-primary-on-dark); }
.t-night .k-dots i, .t-night .k-bar { background: rgb(255 255 255 / 0.22); }
@media screen { .t-night { box-shadow: 0 1px 6px rgb(0 0 0 / 0.3); } }
/* Two items per row leave little width, so dates go on their own line. */
.t-night .t-main .k-item-head { flex-direction: column; align-items: flex-start; gap: 0; }
`;

export function NightResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-night" css={css}>
      <header className="t-head">
        <Avatar ctx={ctx} className="t-photo" />
        <div className="t-id">
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        </div>
        {hasContact(ctx) && <ContactList ctx={ctx} />}
      </header>
      <div className="t-body">
        <main className="t-main">
          <Summary ctx={ctx} />
          <Sections list={main} ctx={ctx} variant="main" />
        </main>
        <aside className="t-side">
          <Sections list={side} ctx={ctx} variant="side" />
        </aside>
      </div>
    </Page>
  );
}
