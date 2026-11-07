/** @jsxRuntime automatic @jsxImportSource react */
// Project rule: in every template, clicking a certificate shows it large over the page.
// Published sites run no scripts, so this uses a hidden checkbox: the picture is a <label> for it,
// and the large view (also a label) closes it again with one click anywhere.
// The large views are rendered once per page, outside the cards: animated cards would otherwise
// trap the full-screen layer inside themselves.

import type { ReactNode } from "react";

export type ZoomItem = { id: string; src: string; title?: string; caption?: string };

const zoomId = (id: string) => `zoom-${id.replace(/[^\w-]/g, "")}`;

/** Clickable area that opens the large view of one item. */
export function ZoomOpen({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <label htmlFor={zoomId(id)} className={`w-zoom-open${className ? ` ${className}` : ""}`}>
      {children}
    </label>
  );
}

/** The large views for a page; place once, after the content. */
export function ZoomLayers({ items, closeLabel }: { items: ZoomItem[]; closeLabel: string }) {
  return (
    <>
      {items.map((it) => (
        <div key={it.id} className="w-zoom-wrap">
          <input type="checkbox" id={zoomId(it.id)} className="w-zoom-in" aria-hidden="true" tabIndex={-1} />
          <label htmlFor={zoomId(it.id)} className="w-zoom" aria-label={closeLabel}>
            <span className="w-zoom-x" aria-hidden="true">
              ×
            </span>
            <figure>
              <img src={it.src} alt={it.title ?? ""} loading="lazy" />
              {(it.title || it.caption) && (
                <figcaption>
                  {it.title && <strong>{it.title}</strong>}
                  {it.caption && <small>{it.caption}</small>}
                </figcaption>
              )}
            </figure>
          </label>
        </div>
      ))}
    </>
  );
}

export const zoomCss = /* css */ `
.w-zoom-open { cursor: zoom-in; }
.w-zoom-wrap { display: contents; }
.w-zoom-in { display: none; }
.w-zoom { position: fixed; inset: 0; z-index: 1000; display: none; place-items: center; padding: 5vmin; background: rgb(12 12 14 / .88); backdrop-filter: blur(6px); cursor: zoom-out; }
.w-zoom-in:checked + .w-zoom { display: grid; animation: w-zoom-fade .25s ease both; }
.w-zoom figure { margin: 0; display: grid; gap: 14px; justify-items: center; max-width: min(1100px, 100%); animation: w-zoom-grow .4s cubic-bezier(.2, 1.1, .3, 1) both; }
.w-zoom img { max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 8px; box-shadow: 0 30px 60px -20px rgb(0 0 0 / .8); }
.w-zoom figcaption { display: grid; gap: 4px; text-align: center; color: #fff; }
.w-zoom figcaption small { opacity: .7; }
.w-zoom-x { position: absolute; top: 16px; inset-inline-end: 16px; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: rgb(255 255 255 / .12); color: #fff; font-size: 1.6em; line-height: 1; }
@keyframes w-zoom-fade { from { opacity: 0; } }
@keyframes w-zoom-grow { from { opacity: 0; scale: .85; } }
@media (prefers-reduced-motion: reduce) { .w-zoom, .w-zoom figure { animation: none !important; } }
`;
