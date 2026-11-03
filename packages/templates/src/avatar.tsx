/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
import { useId } from "react";

/**
 * Neutral person silhouette shown when the user has no photo. Fills its container, sits on the
 * bottom edge, and takes its colors from the theme: a soft-to-primary gradient behind a light figure.
 */
// CSS variables only work in style properties, not in SVG presentation attributes.
const FIGURE = { fill: "var(--color-on-primary, #FFFFFF)", opacity: 0.92 };

export function Silhouette({ className = "" }: { className?: string }) {
  // Unique per instance: several avatars (e.g. template thumbnails) can share one page.
  const gradient = `avatar-bg-${useId().replace(/:/g, "")}`;
  return (
    <svg className={`avatar-silhouette ${className}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-primary-tint, #C7D7EE)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-primary, #1E5AA8)" }} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradient})`} />
      <circle cx="50" cy="40" r="17" style={FIGURE} />
      <path d="M14 104c0-24 16-38 36-38s36 14 36 38z" style={FIGURE} />
    </svg>
  );
}
