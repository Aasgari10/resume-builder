/** @jsxRuntime automatic @jsxImportSource react */
// Dark column on the far side, topped by a large photo, holding contact and short lists;
// the main column carries a bold name and the timeline sections.

import { Avatar, ContactList, Heading, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-column { display: grid; grid-template-columns: 1fr 35%; }
.t-column[dir="rtl"] { background: linear-gradient(to right, var(--color-primary-strong) 35%, #fff 35%); }
.t-column[dir="ltr"] { background: linear-gradient(to left, var(--color-primary-strong) 35%, #fff 35%); }
.t-column .t-main { padding: 18mm 11mm 14mm 14mm; }
.t-column[dir="rtl"] .t-main { padding: 18mm 14mm 14mm 11mm; }
.t-column .t-name { font-family: var(--font-heading); font-size: 2.7em; font-weight: 800; line-height: 1.15; color: var(--color-primary-strong); }
.t-column .t-role { margin-top: 1.5mm; font-size: 1.15em; color: var(--color-muted); }
.t-column .t-main .k-h2 { padding-bottom: 1.2mm; border-bottom: 0.5mm solid var(--color-text); }
.t-column .t-side { color: var(--color-on-primary); }
.t-column .t-photo { width: 100%; height: 72mm; border-radius: 0; }
.t-column .t-side-body { padding: 2mm 8mm 12mm; }
.t-column .t-side .k-h2 { padding-bottom: 1.2mm; border-bottom: 0.3mm solid color-mix(in srgb, var(--color-on-primary) 45%, transparent); }
.t-column .t-side .k-tags li { background: color-mix(in srgb, var(--color-on-primary) 16%, transparent); color: inherit; }
.t-column .t-side :is(.k-bar i, .k-dots i.on, .k-bullets li::before) { background: var(--color-on-primary); }
`;

export function ColumnResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-column" css={css}>
      <main className="t-main">
        <h1 className="t-name">{data.basics.fullName}</h1>
        {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        <Summary ctx={ctx} />
        <Sections list={main} ctx={ctx} variant="main" />
      </main>
      <aside className="t-side">
        <Avatar ctx={ctx} className="t-photo" />
        <div className="t-side-body">
          {hasContact(ctx) && (
            <section className="k-section k-side">
              <Heading>{ctx.labels.contact}</Heading>
              <ContactList ctx={ctx} />
            </section>
          )}
          <Sections list={side} ctx={ctx} variant="side" />
        </div>
      </aside>
    </Page>
  );
}
