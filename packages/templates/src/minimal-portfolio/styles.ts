// Styles for the minimal portfolio template.
// Kept as a string so the same CSS can be inlined into server-rendered pages and HTML exports.
// All selectors are scoped under .mp-root; theme values come from CSS variables (see themeToCssVars).
// Layout responds to the container width, not the viewport, so the editor preview can emulate mobile.

export const styles = /* css */ `
.mp-root {
  container-type: inline-size;
  --mp-space: calc(var(--space-factor, 1) * 1rem);
  --mp-line: color-mix(in srgb, var(--color-text) 12%, transparent);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: 1.8;
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
}
.mp-root *, .mp-root *::before, .mp-root *::after { box-sizing: border-box; }
:where(.mp-root) :where(h1, h2, h3, p, ul, figure) { margin: 0; padding: 0; }
.mp-root ul { list-style: none; }
.mp-root a { color: var(--color-primary); text-decoration: none; }
.mp-root a:hover { text-decoration: underline; }

.mp-wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: calc(var(--mp-space) * 3) calc(var(--mp-space) * 1.5);
}

/* Hero */
.mp-hero {
  display: flex;
  align-items: center;
  gap: calc(var(--mp-space) * 1.5);
  padding-bottom: calc(var(--mp-space) * 2);
  border-bottom: 1px solid var(--mp-line);
}
.mp-avatar {
  flex: none;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  object-fit: cover;
  display: grid;
  place-items: center;
  background: var(--color-primary);
  color: var(--color-bg);
  font-family: var(--font-heading);
  font-size: 2.2em;
  font-weight: 700;
}
.mp-avatar-empty { overflow: hidden; padding: 0; }
.mp-avatar-empty .avatar-silhouette { display: block; width: 100%; height: 100%; }
.mp-name {
  font-family: var(--font-heading);
  font-size: 2.1em;
  font-weight: 700;
  line-height: 1.3;
}
.mp-title { color: var(--color-primary); font-size: 1.1em; font-weight: 600; }
.mp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.25rem;
  margin-top: 0.5rem;
  color: var(--color-muted);
  font-size: 0.9em;
}
.mp-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
.mp-link {
  padding: 0.1rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  border-radius: 999px;
  font-size: 0.85em;
}
.mp-summary {
  margin-top: calc(var(--mp-space) * 1.75);
  max-width: 68ch;
  font-size: 1.05em;
}

/* Sections */
.mp-section { margin-top: calc(var(--mp-space) * 2.75); }
.mp-h2 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: var(--mp-space);
  font-family: var(--font-heading);
  font-size: 1.3em;
  font-weight: 700;
}
.mp-h2::before {
  content: "";
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 2px;
  background: var(--color-accent);
}
.mp-h3 { margin-bottom: 0.5rem; color: var(--color-muted); font-size: 0.9em; font-weight: 600; }

/* Timeline items (experience, education, certificates, custom) */
.mp-item { padding: var(--mp-space) 0; border-top: 1px solid var(--mp-line); }
.mp-item:first-child { border-top: 0; padding-top: 0; }
.mp-item-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.25rem 1rem;
}
.mp-item-title { font-weight: 700; }
.mp-item-sub { color: var(--color-muted); }
.mp-date { color: var(--color-muted); font-size: 0.85em; white-space: nowrap; }
.mp-desc { margin-top: 0.35rem; white-space: pre-line; }
.mp-bullets { margin-top: 0.4rem; }
.mp-bullets li { position: relative; padding-inline-start: 1.1rem; }
.mp-bullets li::before {
  content: "";
  position: absolute;
  inset-inline-start: 0.2rem;
  top: 0.8em;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: var(--color-accent);
}

/* Skills */
.mp-skill-group + .mp-skill-group { margin-top: var(--mp-space); }
.mp-skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mp-skill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.85rem;
  background: var(--color-surface);
  border-radius: var(--radius);
  font-size: 0.9em;
}
.mp-dots { display: inline-flex; gap: 3px; direction: ltr; }
.mp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
}
.mp-dot.is-on { background: var(--color-primary); }

/* Projects */
.mp-projects { display: grid; grid-template-columns: 1fr; gap: var(--mp-space); }
.mp-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: calc(var(--mp-space) * 1.25);
  background: var(--color-surface);
  border-radius: var(--radius);
}
.mp-card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: calc(var(--radius) * 0.75);
}
.mp-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.mp-tag {
  padding: 0 0.6rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  border-radius: 999px;
  color: var(--color-accent);
  font-size: 0.75em;
}
.mp-card-links { display: flex; gap: 1rem; margin-top: auto; font-size: 0.9em; }

/* Languages */
.mp-langs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}
.mp-lang {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: var(--color-surface);
  border-radius: var(--radius);
}

.mp-footer {
  margin-top: calc(var(--mp-space) * 3.5);
  padding-top: var(--mp-space);
  border-top: 1px solid var(--mp-line);
  color: var(--color-muted);
  font-size: 0.8em;
  text-align: center;
}

@container (min-width: 640px) {
  .mp-projects { grid-template-columns: 1fr 1fr; }
}

@container (max-width: 560px) {
  .mp-wrap { padding: calc(var(--mp-space) * 2) var(--mp-space); }
  .mp-hero { flex-direction: column; text-align: center; }
  .mp-meta, .mp-links { justify-content: center; }
  .mp-name { font-size: 1.7em; }
  .mp-avatar { width: 88px; height: 88px; }
}
`;
