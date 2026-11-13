/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// Building blocks shared by the newer website templates: click-to-edit markers, optional-field
// placeholders, page links, icons, social links and the certificate gallery with its enlarged
// view. Each template keeps its own look through its own class names and CSS.

import type { ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { isDummyUrl, linkLabel, safeUrl } from "../format";
import type { Ctx } from "./kit";
import { ZoomOpen } from "./zoom";

/* ───────────── Click-to-edit markers ───────────── */

export type EditKind = "text" | "multiline" | "image" | "url" | "period" | "month" | "lines" | "tags" | "newlink" | "newimage";
export type Edit = { "data-edit": string; "data-edit-kind": EditKind; "data-edit-label": string };
export const ed = (path: string, kind: EditKind, label: string): Edit => ({ "data-edit": path, "data-edit-kind": kind, "data-edit-label": label });
export const item = (list: string, id: string) => `${list}[${id}]`;

/** Shows its children when the value is filled; while editing an empty value becomes a "+ label" button. */
export function Opt({ value, editing, edit, children }: { value: unknown; editing: boolean; edit: Edit; children?: ReactNode }) {
  const filled = Array.isArray(value) ? value.some((v) => String(v).trim()) : Boolean(String(value ?? "").trim());
  if (filled) return <>{children}</>;
  return editing ? (
    <span className="p-ghost" {...edit}>
      + {edit["data-edit-label"]}
    </span>
  ) : null;
}

export const paragraphs = (text: string) => text.split(/\n\s*\n|\n/).filter((p) => p.trim());

/* ───────────── Pages ───────────── */

export type Link = (path: string) => string;
export type View = { ctx: Ctx; link: Link; editing: boolean };

const has = {
  gallery: (d: ResumeData) => Boolean(d.site?.gallery.some((g) => safeUrl(g.image))),
};

/** Home plus the optional pages that are switched on (the certificates page needs a picture). */
export function pagesOf(data: ResumeData, optional: readonly { path: string }[]): string[] {
  const off = data.site?.hiddenPages ?? [];
  return ["/", ...optional.map((p) => p.path).filter((p) => !off.includes(p) && (p !== "/gallery" || has.gallery(data)))];
}

/** Whether a home-page section is switched on. */
export const blockOn = (data: ResumeData, key: string) => !(data.site?.hiddenBlocks ?? []).includes(key);

export function PageLink({ to, link, className, children, current, product, label }: { to: string; link: Link; className?: string; children: ReactNode; current?: boolean; product?: string; label?: string }) {
  // "product": in the editor, a click on it opens that product in the shop manager.
  return (
    <a href={link(to)} data-page={to} data-product={product} className={className} aria-label={label} aria-current={current ? "page" : undefined}>
      {children}
    </a>
  );
}

/** Link to a page when it exists; otherwise a placeholder link, which takes the visitor to the top. */
export function ToPage({ pages, to, link, className, children }: { pages: string[]; to: string; link: Link; className?: string; children: ReactNode }) {
  return pages.includes(to) ? (
    <PageLink to={to} link={link} className={className}>
      {children}
    </PageLink>
  ) : (
    <a href="#" className={className}>
      {children}
    </a>
  );
}

/** Opens in a new tab unless it is a placeholder link (those take the visitor to the top). */
export const outside = (href: string | undefined) => (href && !isDummyUrl(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/* ───────────── Icons ───────────── */

const ICONS: Record<string, string> = {
  mail: "M4 6h16v12H4z M4 7l8 6 8-6",
  phone: "M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z",
  pin: "M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  arrow: "M7 17L17 7 M8 7h9v9",
  whatsapp: "M4 20l1.5-4.5A8 8 0 1 1 8.5 18.5z M9 9.5c.5 2.5 2.5 4.5 5 5l1.5-1.5-2-1-1 1a5 5 0 0 1-2-2l1-1-1-2z",
  telegram: "M21 4L3 11l6 2 2 6 3-4 5 4z M9 13l8-6",
  instagram: "M5 5h14v14H5z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M16.5 7.5h.01",
  github: "M9 18l-6-6 6-6 M15 6l6 6-6 6",
  linkedin: "M5 5h14v14H5z M8 10v6 M8 7.5v.01 M11.5 16v-6 M11.5 12.5c0-1.5 1-2.5 2.5-2.5s2 1 2 2.5V16",
  dribbble: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M5 7c4 3 10 4 15 3 M8 20c1-6 5-10 12-10 M7 4c3 4 6 10 7 17",
  eitaa: "M5 5h14v14H5z M15 10.5a3 3 0 1 0-1 4 M9.5 11.5h5.5",
  rubika: "M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 8l4 2.3v4.4L12 17l-4-2.3v-4.4z",
  behance: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18",
  website: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18",
  other: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
  code: "M8 4H6v6l-2 2 2 2v6h2 M16 4h2v6l2 2-2 2v6h-2",
  pen: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z M13.5 6.5l4 4",
  layers: "M12 3l9 5-9 5-9-5z M3 13l9 5 9-5",
  spark: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M6 18l2.5-2.5 M15.5 8.5L18 6",
};
export const SERVICE_ICONS = ["code", "pen", "layers", "spark"];

export function Icon({ name, className = "p-ico" }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.other} />
    </svg>
  );
}

/** Social links as round icon buttons; while editing, a "+" adds a new one. */
export function Socials({ ctx, editing, className = "" }: { ctx: Ctx; editing: boolean; className?: string }) {
  const links = ctx.data.basics.links.filter((l) => safeUrl(l.url));
  return (
    <div className={`p-socials ${className}`}>
      {links.map((l) => {
        const href = safeUrl(l.url)!;
        const label = linkLabel(l, ctx.data.locale);
        return (
          <a key={l.id} href={href} {...outside(href)} aria-label={label} title={label} {...ed(`basics.links[${l.id}].url`, "url", label)}>
            <Icon name={l.type} />
          </a>
        );
      })}
      {editing && (
        <span className="p-ghost" {...ed("basics.links", "newlink", "افزودن راه ارتباطی")}>
          +
        </span>
      )}
    </div>
  );
}

/* ───────────── Certificates ───────────── */

/**
 * Certificate pictures. Project rule: clicking a certificate always shows it large over the page
 * (see ./zoom; the large views themselves are added once by WebPage).
 */
export function Certificates({ ctx, editing, className, addLabel = "افزودن مدرک" }: { ctx: Ctx; editing: boolean; className: string; addLabel?: string }) {
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <div className={className} id="certs">
      {items.map((g) => {
        const at = item("site.gallery", g.id);
        return (
          <ZoomOpen key={g.id} id={g.id} className="p-cert">
            <span className="p-cert-pic" {...ed(`${at}.image`, "image", "تصویر مدرک")}>
              <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
            </span>
            <span className="p-cert-text">
              <strong {...ed(`${at}.title`, "text", "عنوان مدرک")}>{g.title}</strong>
              <Opt value={g.description} editing={editing} edit={ed(`${at}.description`, "text", "صادرکننده یا توضیح")}>
                <small {...ed(`${at}.description`, "text", "صادرکننده یا توضیح")}>{g.description}</small>
              </Opt>
            </span>
          </ZoomOpen>
        );
      })}
      {editing && (
        <span className="p-cert p-cert-add" {...ed("site.gallery", "newimage", addLabel)}>
          <b>+</b>
          {addLabel}
        </span>
      )}
    </div>
  );
}

/** Shared styles: placeholders, icons, social buttons and certificate cards. */
export const partsCss = /* css */ `
.p-ghost { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border: 1px dashed currentColor; border-radius: 999px; font-size: .8em; opacity: .7; }
.p-ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.p-socials { display: flex; flex-wrap: wrap; gap: 10px; }
.p-socials a, .p-socials .p-ghost { width: 42px; height: 42px; padding: 0; display: grid; place-items: center; border-radius: 50%; transition: transform .2s, background .2s, color .2s; }
.p-socials a:hover { transform: translateY(-2px); }
.p-socials .p-ico { width: 19px; height: 19px; }
.p-cert { display: grid; gap: 10px; cursor: zoom-in; }
.p-cert-pic { display: block; overflow: hidden; }
.p-cert-pic img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.p-cert:hover .p-cert-pic img { transform: scale(1.04); }
.p-cert-text { display: grid; gap: 3px; }
.p-cert-text small { opacity: .65; font-size: .82em; }
.p-cert-add { place-items: center; align-content: center; min-height: 160px; border: 1.5px dashed currentColor; border-radius: 14px; opacity: .6; cursor: pointer; }
.p-cert-add b { font-size: 2em; font-weight: 300; line-height: 1; }
`;

/**
 * Hidden fields of a form that sends to the site's own inbox (a booking, a contact message or a
 * newsletter sign-up): what it is, the page to come back to, and a trap only robots fill in.
 * The form posts to link("/_form"); the owner sees what arrives in the panel.
 */
export function FormMeta({ kind, back }: { kind: "booking" | "contact" | "newsletter"; back: string }) {
  return (
    <>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="back" value={back} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", insetInlineStart: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
    </>
  );
}
