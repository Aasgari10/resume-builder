// Styles for the classic printable resume (A4).
// Scoped under .cr-root; colors and fonts come from theme CSS variables.
// Print rules remove browser margins (and with them the default header/footer) and keep items unsplit.

export const styles = /* css */ `
@page { size: A4; margin: 0; }

.cr-root {
  --cr-space: calc(var(--space-factor, 1) * 1rem);
  --cr-line: color-mix(in srgb, var(--color-text) 18%, transparent);
  box-sizing: border-box;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 16mm 16mm 14mm;
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: calc(var(--font-size-base) * 0.8);
  line-height: 1.65;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.cr-root *, .cr-root *::before, .cr-root *::after { box-sizing: border-box; }
.cr-root :is(h1, h2, h3, p, ul) { margin: 0; padding: 0; }
.cr-root ul { list-style: none; }
.cr-root a { color: inherit; text-decoration: none; }

/* Header */
.cr-header { padding-bottom: calc(var(--cr-space) * 0.9); border-bottom: 2px solid var(--color-primary); }
.cr-name { font-family: var(--font-heading); font-size: 2.1em; font-weight: 700; line-height: 1.25; color: var(--color-primary); }
.cr-title { font-size: 1.15em; font-weight: 600; margin-top: 0.15rem; }
.cr-contact { display: flex; flex-wrap: wrap; gap: 0.15rem 1.1rem; margin-top: 0.5rem; color: var(--color-muted); font-size: 0.92em; }
.cr-summary { margin-top: calc(var(--cr-space) * 0.8); text-align: justify; }

/* Sections */
.cr-section { margin-top: calc(var(--cr-space) * 1.1); }
.cr-h2 {
  margin-bottom: calc(var(--cr-space) * 0.5);
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--cr-line);
  font-family: var(--font-heading);
  font-size: 1.15em;
  font-weight: 700;
  color: var(--color-primary);
}
.cr-item { break-inside: avoid; }
.cr-item + .cr-item { margin-top: calc(var(--cr-space) * 0.6); }
.cr-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
.cr-item-title { font-weight: 700; }
.cr-item-sub { color: var(--color-muted); }
.cr-date { flex: none; color: var(--color-muted); font-size: 0.9em; white-space: nowrap; }
.cr-desc { margin-top: 0.15rem; white-space: pre-line; }
.cr-bullets { margin-top: 0.2rem; }
.cr-bullets li { position: relative; padding-inline-start: 0.9rem; }
.cr-bullets li::before { content: "•"; position: absolute; inset-inline-start: 0; color: var(--color-accent); }
.cr-inline-list > li { display: inline; }
.cr-inline-list > li + li::before { content: " · "; color: var(--color-muted); }
.cr-group + .cr-group { margin-top: 0.2rem; }
.cr-group-name { font-weight: 600; }
.cr-tech { color: var(--color-muted); font-size: 0.9em; }

@media screen {
  .cr-root { box-shadow: 0 1px 6px rgb(0 0 0 / 0.12); margin: 1.5rem auto; }
}
@media print {
  .cr-root { width: auto; min-height: 0; margin: 0; }
}
.cr-header { position: relative; display: flow-root; }
.cr-photo { float: inline-end; width: 84px; height: 84px; margin-inline-start: 16px; border-radius: 50%; object-fit: cover; }
.cr-personal { margin-top: 4px; }
.cr-shots { display: flex; gap: 6px; margin-top: 6px; }
.cr-shots img { width: 72px; height: 48px; border-radius: 4px; object-fit: cover; }
`;
