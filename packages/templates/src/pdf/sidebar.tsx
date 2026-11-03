/** @jsxRuntime automatic @jsxImportSource react */
// Colored sidebar with photo, contact, education, skills and languages; experience in the main column.

import { Avatar, ContactList, Heading, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-sidebar { display: grid; grid-template-columns: 34% 1fr; }
.t-sidebar[dir="rtl"] { background: linear-gradient(to left, var(--color-primary) 34%, #fff 34%); }
.t-sidebar[dir="ltr"] { background: linear-gradient(to right, var(--color-primary) 34%, #fff 34%); }
.t-sidebar .t-side { padding: 14mm 8mm 12mm; color: var(--color-on-primary); }
.t-sidebar .t-photo { margin: 0 auto 2mm; width: 38mm; height: 38mm; border: 1.2mm solid color-mix(in srgb, var(--color-on-primary) 80%, transparent); }
.t-sidebar .t-side .k-h2 { padding-bottom: 1.5mm; border-bottom: 0.3mm solid color-mix(in srgb, var(--color-on-primary) 45%, transparent); letter-spacing: 0.06em; }
.t-sidebar .t-side .k-tags li { background: color-mix(in srgb, var(--color-on-primary) 16%, transparent); color: inherit; }
.t-sidebar .t-side :is(.k-bar i, .k-dots i.on, .k-bullets li::before) { background: var(--color-on-primary); }
.t-sidebar .t-main { padding: 16mm 12mm 14mm; }
.t-sidebar .t-name { font-family: var(--font-heading); font-size: 2.4em; font-weight: 800; line-height: 1.2; color: var(--color-primary-strong); }
.t-sidebar .t-role { margin-top: 1mm; font-size: 1.15em; color: var(--color-muted); letter-spacing: 0.03em; }
.t-sidebar .t-main header::after { content: ""; display: block; width: 18mm; height: 1mm; margin-top: 4mm; border-radius: 1mm; background: var(--color-primary); }
.t-sidebar .t-main .k-h2 { padding-bottom: 1.5mm; border-bottom: 0.3mm solid var(--k-line); color: var(--color-primary-strong); letter-spacing: 0.04em; }
.t-sidebar .t-main .k-item { padding-inline-start: 4mm; border-inline-start: 0.6mm solid var(--color-primary-tint); }
.t-sidebar .t-main .k-date { color: var(--color-primary); opacity: 1; }
`;

export function SidebarResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["education", "skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-sidebar" css={css}>
      <aside className="t-side">
        <Avatar ctx={ctx} className="t-photo" />
        {hasContact(ctx) && (
          <section className="k-section k-side">
            <Heading>{ctx.labels.contact}</Heading>
            <ContactList ctx={ctx} />
          </section>
        )}
        <Sections list={side} ctx={ctx} variant="side" />
      </aside>
      <main className="t-main">
        <header>
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        </header>
        <Summary ctx={ctx} />
        <Sections list={main} ctx={ctx} variant="main" />
      </main>
    </Page>
  );
}
