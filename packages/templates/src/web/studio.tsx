/** @jsxRuntime automatic @jsxImportSource react */
// Bold website: a dark full-width hero with a very large name, then numbered sections
// and project cards on a light page.

import { Avatar, ContactList, Footer, Links, WebPage, WebSections, hasContact, webCtx } from "./kit";
import type { TemplateProps } from "../types";

const css = /* css */ `
.t-studio .s-hero { background: #111216; color: #F4F4F6; }
.t-studio .s-hero-in { max-width: 1080px; margin: 0 auto; padding: calc(var(--w-space) * 4.5) calc(var(--w-space) * 1.5) calc(var(--w-space) * 3.5); display: grid; grid-template-columns: 1fr auto; gap: calc(var(--w-space) * 2); align-items: end; }
.t-studio .s-kicker { display: inline-block; margin-bottom: calc(var(--w-space) * 1); padding: .25rem .9rem; border-radius: 999px; background: var(--color-primary); color: var(--color-on-primary); font-size: .9em; font-weight: 600; }
.t-studio .s-name { font-family: var(--font-heading); font-size: clamp(2.6em, 8cqi, 5.4em); font-weight: 900; line-height: 1.1; letter-spacing: -.02em; }
.t-studio .s-summary { margin-top: calc(var(--w-space) * 1.2); max-width: 38em; color: #B9BAC4; font-size: 1.08em; white-space: pre-line; }
.t-studio .s-hero .w-links { margin-top: calc(var(--w-space) * 1.5); }
.t-studio .s-photo { width: 170px; height: 170px; border-radius: 28px; box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary) 60%, transparent); }
.t-studio .s-contact { margin-top: calc(var(--w-space) * 1.2); display: flex; flex-wrap: wrap; gap: .4rem 1.4rem; color: #CFD0D8; }
.t-studio .s-contact .k-icon { fill: var(--color-primary-tint); }
.t-studio .s-body { max-width: 1080px; margin: 0 auto; padding: calc(var(--w-space) * 1) calc(var(--w-space) * 1.5) 0; counter-reset: s-section; }
.t-studio .k-section { counter-increment: s-section; display: grid; grid-template-columns: 220px 1fr; gap: calc(var(--w-space) * 2); padding-top: calc(var(--w-space) * 2.5); margin-top: calc(var(--w-space) * 2.5); border-top: 2px solid var(--color-text); }
.t-studio .k-section > .k-h2 { flex-direction: column; align-items: flex-start; gap: .2rem; font-size: 1.5em; }
.t-studio .k-section > .k-h2::before { content: counter(s-section, persian); color: var(--color-primary); font-size: .85em; font-weight: 600; }
.t-studio[lang="en"] .k-section > .k-h2::before { content: counter(s-section, decimal-leading-zero); }
.t-studio .k-section > .k-h2 + * { min-width: 0; }
.t-studio .k-section:not(.w-projects) > :not(.k-h2) { grid-column: 2; }
.t-studio .w-projects .w-project-grid { grid-column: 2; }
.t-studio .w-project { border: none; background: #F2F2F5; }

@container (max-width: 720px) {
  .t-studio .s-hero-in { grid-template-columns: 1fr; padding-top: calc(var(--w-space) * 3); }
  .t-studio .s-photo { order: -1; width: 110px; height: 110px; }
  .t-studio .k-section { grid-template-columns: 1fr; gap: calc(var(--w-space) * .8); }
  .t-studio .k-section > :not(.k-h2), .t-studio .w-projects .w-project-grid { grid-column: 1 !important; }
}
`;

export function StudioPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const { basics } = props.data;
  return (
    <WebPage ctx={ctx} className="t-studio" css={css}>
      <header className="s-hero">
        <div className="s-hero-in">
          <div>
            {basics.jobTitle && <span className="s-kicker">{basics.jobTitle}</span>}
            <h1 className="s-name">{basics.fullName}</h1>
            {basics.summary && <p className="s-summary">{basics.summary}</p>}
            {hasContact(ctx) && <ContactList ctx={ctx} className="s-contact" />}
            <Links ctx={ctx} />
          </div>
          <Avatar ctx={ctx} className="s-photo" />
        </div>
      </header>
      <main className="s-body">
        <WebSections ctx={ctx} />
      </main>
      <Footer data={props.data} />
    </WebPage>
  );
}
