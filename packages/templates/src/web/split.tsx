/** @jsxRuntime automatic @jsxImportSource react */
// Two columns: a profile panel in a soft tint of the main color (photo, contact, skills,
// languages) next to the scrolling content. Stacks on narrow screens.

import { Avatar, ContactList, Footer, Links, WebPage, WebSections, hasContact, webCtx } from "./kit";
import type { TemplateProps } from "../types";

const SIDE = ["skills", "languages", "certificates"] as const;
const MAIN = ["experience", "education", "projects", "customSections"] as const;

const css = /* css */ `
.t-split .p-grid { display: grid; grid-template-columns: minmax(280px, 34%) 1fr; min-height: 100vh; }
.t-split .p-side { background: var(--color-primary-soft); }
.t-split .p-side-in { padding: calc(var(--w-space) * 3) calc(var(--w-space) * 2); display: grid; gap: calc(var(--w-space) * 1.2); }
.t-split .p-photo { width: 132px; height: 132px; box-shadow: 0 0 0 5px #fff, 0 0 0 7px var(--color-primary-tint); }
.t-split .p-name { font-family: var(--font-heading); font-size: 2em; font-weight: 800; line-height: 1.25; }
.t-split .p-role { color: var(--color-primary-strong); font-weight: 600; }
.t-split .p-side .w-links a { border-color: var(--color-primary-tint); color: var(--color-primary-strong); background: #fff; }
.t-split .p-side .k-section { margin-top: calc(var(--w-space) * 1); }
.t-split .p-side .k-h2 { font-size: 1.05em; color: var(--color-primary-strong); }
.t-split .p-side .k-tags li { background: #fff; }
.t-split .p-main { padding: calc(var(--w-space) * 3) calc(var(--w-space) * 3) 0; max-width: 820px; }
.t-split .p-intro { font-size: 1.15em; line-height: 1.95; white-space: pre-line; }
.t-split .p-main .k-h2 { padding-bottom: .5rem; border-bottom: 3px solid var(--color-primary); width: fit-content; }
.t-split .p-main .k-item { position: relative; padding-inline-start: 1.4rem; border-top: none; border-inline-start: 2px solid var(--color-primary-tint); padding-top: 0; padding-bottom: calc(var(--w-space) * 1.4); }
.t-split .p-main .k-item::before { content: ""; position: absolute; inset-inline-start: -7px; top: .45em; width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 0 3px var(--color-bg); }
.t-split .p-main .k-date { color: var(--color-primary-strong); font-weight: 600; }

@container (max-width: 760px) {
  .t-split .p-grid { grid-template-columns: 1fr; }
  .t-split .p-side-in { padding: calc(var(--w-space) * 2) calc(var(--w-space) * 1.2); }
  .t-split .p-main { padding: calc(var(--w-space) * 2) calc(var(--w-space) * 1.2) 0; }
}
`;

export function SplitPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const { basics } = props.data;
  return (
    <WebPage ctx={ctx} className="t-split" css={css}>
      <div className="p-grid">
        <aside className="p-side">
          <div className="p-side-in">
            <Avatar ctx={ctx} className="p-photo" />
            <div>
              <h1 className="p-name">{basics.fullName}</h1>
              {basics.jobTitle && <p className="p-role">{basics.jobTitle}</p>}
            </div>
            {hasContact(ctx) && <ContactList ctx={ctx} />}
            <Links ctx={ctx} />
            <WebSections ctx={ctx} keys={SIDE} variant="side" />
          </div>
        </aside>
        <main className="p-main">
          {basics.summary && <p className="p-intro">{basics.summary}</p>}
          <WebSections ctx={ctx} keys={MAIN} />
          <Footer data={props.data} />
        </main>
      </div>
    </WebPage>
  );
}
