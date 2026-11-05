/** @jsxRuntime automatic @jsxImportSource react */
// Full-width colored header with a ringed photo; two columns below with pill-shaped headings.

import { Avatar, ContactList, Page, Sections, Summary, hasContact, makeCtx, splitSections } from "../kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-banner { display: flex; flex-direction: column; }
.t-banner .t-body { flex: 1; }
.t-banner .t-head { display: flex; align-items: center; gap: 7mm; padding: 11mm 12mm; background: var(--color-primary); color: var(--color-on-primary); }
.t-banner .t-photo { width: 36mm; height: 36mm; box-shadow: 0 0 0 1.5mm var(--color-on-primary); }
.t-banner .t-id { flex: 1; min-width: 0; }
.t-banner .t-name { font-family: var(--font-heading); font-size: 2.5em; font-weight: 800; line-height: 1.15; }
.t-banner .t-role { margin-top: 1mm; font-size: 1.15em; opacity: 0.9; letter-spacing: 0.04em; }
.t-banner .t-head .k-contact { flex: none; max-width: 62mm; font-size: 0.92em; }
.t-banner .t-body { display: grid; grid-template-columns: 1fr 36%; }
.t-banner .t-main { padding: 6mm 9mm 14mm 12mm; }
.t-banner[dir="rtl"] .t-main { padding: 6mm 12mm 14mm 9mm; }
.t-banner .t-side { padding: 6mm 8mm 14mm; background: var(--color-primary-soft); }
.t-banner .k-h2 span { display: inline-block; padding: 0.6mm 5mm; border-radius: 999px; background: var(--color-primary); color: var(--color-on-primary); font-size: 0.95em; letter-spacing: 0.04em; }
.t-banner .t-main .k-item-title { color: var(--color-primary-strong); }
`;

export function BannerResume({ data, theme }: TemplateProps) {
  const ctx = makeCtx(data, theme);
  const { main, side } = splitSections(theme, ["skills", "languages", "certificates"]);
  return (
    <Page ctx={ctx} className="t-banner" css={css}>
      <header className="t-head">
        <Avatar ctx={ctx} className="t-photo" />
        <div className="t-id">
          <h1 className="t-name">{data.basics.fullName}</h1>
          {data.basics.jobTitle && <p className="t-role">{data.basics.jobTitle}</p>}
        </div>
        {hasContact(ctx) && <ContactList withPersonal ctx={ctx} />}
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
