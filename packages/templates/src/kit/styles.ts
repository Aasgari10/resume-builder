// Base styles shared by all printable templates (A4). Templates add layout and decoration
// under their own root class. Colors come only from theme variables.

export const kitStyles = /* css */ `
@page { size: A4; margin: 0; }

.k-page {
  --k-space: calc(var(--space-factor, 1) * 1rem);
  --k-line: color-mix(in srgb, var(--color-text) 16%, transparent);
  box-sizing: border-box;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: calc(var(--font-size-base) * 0.78);
  line-height: 1.65;
  overflow-wrap: anywhere;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.k-page *, .k-page *::before, .k-page *::after { box-sizing: border-box; }
.k-page :is(h1, h2, h3, p, ul) { margin: 0; padding: 0; }
.k-page ul { list-style: none; }
.k-page a { color: inherit; text-decoration: none; }

/* Avatar */
.k-avatar { display: block; width: 34mm; height: 34mm; border-radius: 50%; object-fit: cover; flex: none; }
.k-avatar-empty { overflow: hidden; }
.k-avatar-empty .avatar-silhouette { display: block; width: 100%; height: 100%; }

/* Contact */
.k-contact { display: grid; gap: 0.35rem; }
.k-contact li { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.k-contact li > :last-child { min-width: 0; }
.k-icon { width: 1.05em; height: 1.05em; flex: none; fill: currentColor; opacity: 0.9; }

/* Sections */
.k-section { margin-top: calc(var(--k-space) * 1.15); }
.k-h2-icon { display: none; width: 1.15em; height: 1.15em; flex: none; fill: currentColor; }
.k-h2 { font-family: var(--font-heading); font-size: 1.12em; font-weight: 700; margin-bottom: calc(var(--k-space) * 0.55); }
.k-item { break-inside: avoid; }
.k-item + .k-item { margin-top: calc(var(--k-space) * 0.7); }
.k-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
.k-item-title { font-weight: 700; }
.k-item-sub { opacity: 0.8; }
.k-date { flex: none; font-size: 0.88em; opacity: 0.75; white-space: nowrap; }
.k-desc, .k-summary { margin-top: 0.15rem; white-space: pre-line; }
.k-summary { text-align: justify; }
.k-meta { font-size: 0.9em; opacity: 0.8; }
.k-bullets { margin-top: 0.2rem; }
.k-bullets li { position: relative; padding-inline-start: 0.95rem; }
.k-bullets li::before { content: ""; position: absolute; inset-inline-start: 0.1rem; top: 0.65em; width: 0.32rem; height: 0.32rem; border-radius: 50%; background: var(--color-primary); }

/* Skills: tags or level bars */
.k-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.k-tags li { padding: 0.05rem 0.55rem; border-radius: var(--radius); background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 0.92em; }
.k-bars { display: grid; gap: 0.45rem; }
.k-bars li { display: grid; gap: 0.15rem; }
.k-bar { display: block; height: 0.32rem; border-radius: 999px; background: color-mix(in srgb, currentColor 18%, transparent); overflow: hidden; }
.k-bar i { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }

.k-skill-group + .k-skill-group { margin-top: 0.55rem; }
.k-cat { margin-bottom: 0.25rem; font-size: 0.86em; font-weight: 700; opacity: 0.75; }
.k-links a { color: inherit; }

/* Languages */
.k-langs { display: grid; gap: 0.35rem; }
.k-langs li { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.k-lang-level { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.88em; opacity: 0.85; }
.k-dots { display: inline-flex; gap: 0.18rem; }
.k-dots i { width: 0.42rem; height: 0.42rem; border-radius: 50%; background: color-mix(in srgb, currentColor 22%, transparent); }
.k-dots i.on { background: var(--color-primary); }

@media screen { .k-page { box-shadow: 0 1px 6px rgb(0 0 0 / 0.12); } }
@media print { .k-page { width: auto; min-height: 0; margin: 0; box-shadow: none; } }
`;
