/** @jsxRuntime automatic @jsxImportSource react */
// Light tinted sidebar with icon badges, and full-width pill headings in the theme color.

import { Avatar, ContactList, Heading, Page, Sections, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-soft { display: grid; grid-template-columns: 33% 1fr; }
.t-soft[dir="rtl"] { background: linear-gradient(to left, var(--color-primary-soft) 33%, #fff 33%); }
.t-soft[dir="ltr"] { background: linear-gradient(to right, var(--color-primary-soft) 33%, #fff 33%); }
.t-soft .t-side { padding: 14mm 7mm 12mm; }
.t-soft .t-photo { margin: 0 auto 6mm; width: 40mm; height: 40mm; box-shadow: 0 0 0 1.5mm #fff, 0 0 0 2mm var(--color-primary-tint); }
.t-soft .k-contact { gap: 2.5mm; }
.t-soft .k-contact .k-icon { box-sizing: content-box; width: 3.4mm; height: 3.4mm; padding: 1.6mm; border-radius: 50%; background: var(--color-primary); fill: var(--color-on-primary); opacity: 1; }
.t-soft .k-h2 { padding: 1mm 4mm; border-radius: 999px; background: var(--color-primary); color: var(--color-on-primary); font-size: 1em; letter-spacing: 0.08em; }
.t-soft .t-side .k-h2 { margin-inline: -2mm; }
.t-soft .t-main { padding: 16mm 11mm 14mm; }
.t-soft .t-name { font-family: var(--font-heading); font-size: 2.6em; font-weight: 800; line-height: 1.15; text-align: center; color: var(--color-text); }
.t-soft .t-role { margin-top: 1.5mm; text-align: center; font-size: 1.1em; color: var(--color-primary); font-weight: 600; letter-spacing: 0.05em; }
.t-soft .t-summary { margin-top: 4mm; padding-bottom: 5mm; border-bottom: 0.3mm solid var(--k-line); text-align: center; white-space: pre-line; }
.t-soft .t-main .k-item-sub { color: var(--color-primary-strong); opacity: 1; font-weight: 600; }
`;

export function SoftResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-soft" css={css}>
      <aside className="t-side">
        <Avatar ctx={ctx} className="t-photo" />
        {hasContact(ctx) && (
          <section className="k-section k-side">
            <Heading icon="contact">{ctx.labels.contact}</Heading>
            <ContactList withPersonal ctx={ctx} />
          </section>
        )}
        <Sections list={side} ctx={ctx} variant="side" />
      </aside>
      <main className="t-main">
        <h1 className="t-name">{data.basics.fullName}</h1>
        {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        {data.basics.summary && <p className="t-summary">{data.basics.summary}</p>}
        <Sections list={main} ctx={ctx} variant="main" />
      </main>
    </Page>
  );
}
