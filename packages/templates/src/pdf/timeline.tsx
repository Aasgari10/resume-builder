/** @jsxRuntime automatic @jsxImportSource react */
// Main column as a vertical timeline with an icon node per section; the side column holds
// a contact card in the main color over a dark panel for skills and languages.

import { Avatar, ContactList, Heading, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-timeline { display: flex; flex-direction: column; --t-dark: #3A3C42; }
.t-timeline .t-head { display: flex; align-items: center; gap: 6mm; padding: 9mm 11mm; background: var(--t-dark); color: #fff; border-bottom: 1.5mm solid var(--color-primary); }
.t-timeline .t-photo { width: 32mm; height: 32mm; box-shadow: 0 0 0 1.5mm var(--color-primary); }
.t-timeline .t-name { font-family: var(--font-heading); font-size: 2.2em; font-weight: 800; line-height: 1.2; }
.t-timeline .t-role { margin-top: 1mm; color: var(--color-primary-on-dark); font-weight: 600; }
.t-timeline .t-body { flex: 1; display: grid; grid-template-columns: 1fr 34%; }
.t-timeline .t-main { position: relative; padding: 4mm 9mm 14mm; padding-inline-start: 16mm; }
.t-timeline .t-main::before { content: ""; position: absolute; top: 0; bottom: 0; inset-inline-start: 8.4mm; width: 0.5mm; background: color-mix(in srgb, var(--t-dark) 35%, transparent); }
.t-timeline .t-main .k-h2 { position: relative; display: flex; align-items: center; min-height: 7mm; padding-bottom: 1mm; border-bottom: 0.3mm solid var(--k-line); color: var(--t-dark); }
.t-timeline .t-main .k-h2-icon { display: block; position: absolute; inset-inline-start: -10.6mm; width: 7mm; height: 7mm; padding: 1.5mm; border-radius: 50%; background: var(--t-dark); fill: #fff; box-shadow: 0 0 0 1mm #fff; }
.t-timeline .t-main .k-date { color: var(--color-primary-strong); opacity: 1; }
.t-timeline .t-side { background: var(--t-dark); color: #E8E9EC; }
.t-timeline .t-card { margin: -3mm 5mm 0; padding: 4mm 5mm 5mm; border-radius: 0 0 var(--radius) var(--radius); background: var(--color-primary); color: var(--color-on-primary); }
.t-timeline .t-card .k-section { margin-top: 0; }
.t-timeline .t-side-body { padding: 2mm 7mm 14mm; }
.t-timeline .t-side .k-h2 { display: inline-flex; align-items: center; gap: 2mm; }
.t-timeline .t-side .k-h2-icon { display: block; }
.t-timeline .t-side-body .k-h2 { padding: 0.6mm 4mm; border-radius: 999px; background: #fff; color: var(--t-dark); }
.t-timeline .t-side-body .k-tags li { background: none; border: 0.3mm solid var(--color-primary-on-dark); color: inherit; }
.t-timeline .t-side-body :is(.k-bar i, .k-dots i.on) { background: var(--color-primary-on-dark); }
.t-timeline .t-side-body :is(.k-bar, .k-dots i) { background: rgb(255 255 255 / 0.2); }
`;

export function TimelineResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-timeline" css={css}>
      <header className="t-head">
        <Avatar ctx={ctx} className="t-photo" />
        <div>
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        </div>
      </header>
      <div className="t-body">
        <main className="t-main">
          <Summary ctx={ctx} />
          <Sections list={main} ctx={ctx} variant="main" />
        </main>
        <aside className="t-side">
          {hasContact(ctx) && (
            <div className="t-card">
              <section className="k-section k-side">
                <Heading icon="contact">{ctx.labels.contact}</Heading>
                <ContactList withPersonal ctx={ctx} />
              </section>
            </div>
          )}
          <div className="t-side-body">
            <Sections list={side} ctx={ctx} variant="side" />
          </div>
        </aside>
      </div>
    </Page>
  );
}
