/** @jsxRuntime automatic @jsxImportSource react */
// Header band with a slanted edge next to the photo; icon headings over dashed rules,
// items in two columns, and segmented skill bars.

import { Avatar, ContactList, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-diagonal { padding-bottom: 14mm; }
.t-diagonal .t-head { display: flex; align-items: stretch; }
.t-diagonal .t-photo-wrap { display: grid; place-items: center; padding: 6mm 8mm; }
.t-diagonal .t-photo { width: 32mm; height: 32mm; box-shadow: 0 0 0 1mm #fff, 0 0 0 1.6mm var(--color-primary-strong); }
.t-diagonal .t-band { flex: 1; display: flex; gap: 6mm; justify-content: space-between; padding: 8mm 10mm; padding-inline-end: 24mm; background: var(--color-primary-strong); color: var(--color-on-primary); }
.t-diagonal[dir="rtl"] .t-band { clip-path: polygon(100% 0, 0 0, 14mm 100%, 100% 100%); }
.t-diagonal[dir="ltr"] .t-band { clip-path: polygon(0 0, 100% 0, calc(100% - 14mm) 100%, 0 100%); }
.t-diagonal .t-name { font-family: var(--font-heading); font-size: 2.1em; font-weight: 800; line-height: 1.2; }
.t-diagonal .t-role { margin-top: 1mm; padding-bottom: 2mm; border-bottom: 0.3mm dashed color-mix(in srgb, var(--color-on-primary) 60%, transparent); opacity: 0.92; }
.t-diagonal .t-band .k-contact { flex: none; font-size: 0.9em; }
.t-diagonal .t-content { padding: 0 12mm; }
.t-diagonal .k-h2 { display: flex; align-items: center; gap: 2.2mm; padding-bottom: 1.5mm; border-bottom: 0.35mm dashed color-mix(in srgb, var(--color-text) 35%, transparent); color: var(--color-text); }
.t-diagonal .k-h2-icon { display: block; fill: var(--color-primary); width: 1.3em; height: 1.3em; }
.t-diagonal .k-section:is(.k-section-experience, .k-section-education, .k-section-projects, .k-section-certificates, .k-section-customSections) { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; align-content: start; }
.t-diagonal .k-section > .k-h2 { grid-column: 1 / -1; margin-bottom: var(--k-head-gap); }
.t-diagonal .k-item + .k-item { margin-top: 0; }
.t-diagonal .k-item-sub { color: var(--color-primary-strong); opacity: 1; }
.t-diagonal .k-bars { grid-template-columns: 1fr 1fr; gap: 2.5mm 8mm; }
.t-diagonal .k-bars li { display: flex; justify-content: space-between; align-items: center; gap: 4mm; }
.t-diagonal .k-bar { flex: none; width: 26mm; height: 1.6mm; border-radius: 0;
  -webkit-mask-image: repeating-linear-gradient(90deg, #000 0 18%, transparent 18% 20%);
  mask-image: repeating-linear-gradient(90deg, #000 0 18%, transparent 18% 20%); }
.t-diagonal .k-bar i { border-radius: 0; background: var(--color-primary-strong); }
.t-diagonal .k-langs { grid-template-columns: 1fr 1fr; gap: 2mm 8mm; }
/* Two items per row leave little width, so dates go on their own line. */
.t-diagonal .k-section:is(.k-section-experience, .k-section-education, .k-section-projects, .k-section-certificates, .k-section-customSections) .k-item-head { flex-direction: column; align-items: flex-start; gap: 0; }
`;

export function DiagonalResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages"]);
  return (
    <Page ctx={ctx} className="t-diagonal" css={css}>
      <header className="t-head">
        <div className="t-photo-wrap">
          <Avatar ctx={ctx} className="t-photo" />
        </div>
        <div className="t-band">
          <div>
            <h1 className="t-name">{data.basics.fullName}</h1>
            {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
          </div>
          {hasContact(ctx) && <ContactList withPersonal ctx={ctx} />}
        </div>
      </header>
      <div className="t-content">
        <Summary ctx={ctx} />
        <Sections list={main} ctx={ctx} variant="main" />
        <Sections list={side} ctx={ctx} variant="main" />
      </div>
    </Page>
  );
}
