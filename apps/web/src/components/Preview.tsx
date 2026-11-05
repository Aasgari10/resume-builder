// Live preview: the portfolio site, or the printable resume with a template picker.
// The resume page is rendered at its real A4 width and scaled down to fit the pane.

import { memo, useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { applyHiddenFields, type ResumeData, type Theme } from "@rb/schema";
import {
  PDF_TEMPLATES,
  PORTFOLIO_TEMPLATES,
  getPdfTemplate,
  getTemplate,
  pageTitle,
  resolvePage,
  withPlaceholders,
  type TemplateDefinition,
} from "@rb/templates";
import { Scaled } from "./Scaled";
import { EditPopover, type EditTarget } from "./site-edit/EditPopover";
import { SitePanel } from "./site-edit/SitePanel";
import { getAt, isItemPath, removeItem, setAt } from "./site-edit/paths";

type Device = "desktop" | "mobile";
type Mode = "site" | "resume";

const MOBILE_WIDTH = 390;

type Props = {
  data: ResumeData;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  /** When given, texts and pictures on the site can be edited by clicking them. */
  onDataChange?: (data: ResumeData) => void;
  initialMode?: Mode;
};

export function Preview({ data: raw, theme, onThemeChange, onDataChange, initialMode = "site" }: Props) {
  // Sample text fills what is still empty, as in the resume editor; publishing uses only real content.
  const shown = withPlaceholders(raw);
  const data = applyHiddenFields(shown, theme.hiddenFields);
  const [editing, setEditing] = useState(Boolean(onDataChange));
  const [full, setFull] = useState(false);
  const [panel, setPanel] = useState(true);
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [device, setDevice] = useState<Device>("desktop");
  const [requestedPage, setPage] = useState("/");
  const site = getTemplate(theme.templateId);
  const pages = site.pages?.(data) ?? ["/"];
  const page = resolvePage(site, data, requestedPage) ?? "/";

  // Esc leaves the full-screen view (an open popover closes first).
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !target && setFull(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full, target]);

  // In edit mode a click on a marked text or picture opens its editor; otherwise links switch pages.
  const onFrameClick = (e: MouseEvent) => {
    const marked = editing && onDataChange ? (e.target as Element).closest<HTMLElement>("[data-edit]") : null;
    if (marked) {
      e.preventDefault();
      const r = marked.getBoundingClientRect();
      setTarget({
        path: marked.dataset.edit!,
        kind: (marked.dataset.editKind as EditTarget["kind"]) ?? "text",
        label: marked.dataset.editLabel ?? "",
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
      });
      return;
    }
    followPageLink(e);
  };

  // Links between pages of a multi-page site switch the preview instead of leaving the editor.
  const followPageLink = (e: MouseEvent) => {
    const a = (e.target as Element).closest("a");
    if (!a) return;
    e.preventDefault();
    const target = a.getAttribute("data-page");
    if (target) setPage(target);
    else if (a.getAttribute("href")?.startsWith("#")) document.getElementById(a.getAttribute("href")!.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };
  const pdf = getPdfTemplate(theme.pdfTemplateId);

  const pickSite = (id: string) => onThemeChange({ ...theme, templateId: id });

  const pickPdf = (id: string) => {
    onThemeChange({ ...theme, pdfTemplateId: id });
    setMode("resume");
  };

  return (
    <div className="preview">
      <div className="preview-toolbar">
        <div className="segmented" role="group" aria-label="نوع پیش‌نمایش">
          <button aria-pressed={mode === "site"} onClick={() => setMode("site")}>
            سایت
          </button>
          <button aria-pressed={mode === "resume"} onClick={() => setMode("resume")}>
            رزومه‌ی پی‌دی‌اف
          </button>
        </div>
        <span className="muted small grow">قالب {mode === "site" ? site.name : pdf.name}</span>
        {mode === "site" && pages.length > 1 && (
          <select className="preview-page" value={page} onChange={(e) => setPage(e.target.value)} aria-label="صفحه">
            {pages.map((p) => (
              <option key={p} value={p}>
                {p === "/" ? "صفحه‌ی اصلی" : pageTitle(data, p) || p}
              </option>
            ))}
          </select>
        )}
        {mode === "site" && onDataChange && <EditToggle on={editing} onChange={setEditing} />}
        {mode === "site" && (
          <button type="button" className="btn small" onClick={() => setFull(true)}>
            نمایش
          </button>
        )}
        {mode === "site" && (
          <div className="segmented" role="group" aria-label="اندازه‌ی نمایش">
            <button aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
              دسکتاپ
            </button>
            <button aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
              موبایل
            </button>
          </div>
        )}
      </div>

      {mode === "site" ? (
        <>
        <div className="pdf-picker" role="listbox" aria-label="قالب سایت">
          {PORTFOLIO_TEMPLATES.map((t) => (
            <button key={t.id} role="option" aria-selected={t.id === site.id} className="pdf-thumb site-thumb" onClick={() => pickSite(t.id)}>
              <div className="site-thumb-page" aria-hidden="true">
                <Scaled width={128} base={1280}>
                  <t.component data={data} theme={{ ...theme, templateId: t.id }} />
                </Scaled>
              </div>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
        <div className="preview-viewport">
          <div className={`preview-frame${editing && onDataChange ? " editing" : ""}`} style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }} onClick={onFrameClick}>
            <site.component data={data} theme={theme} page={page} />
          </div>
        </div>
        </>
      ) : (
        <>
          <div className="pdf-picker" role="listbox" aria-label="قالب رزومه">
            {PDF_TEMPLATES.map((t) => (
              <button key={t.id} role="option" aria-selected={t.id === pdf.id} className="pdf-thumb" onClick={() => pickPdf(t.id)}>
                <Thumb template={t} data={data} theme={theme} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
          <div className="preview-viewport">
            <Scaled>
              <pdf.component data={data} theme={{ ...theme, templateId: pdf.id }} />
            </Scaled>
          </div>
        </>
      )}

      {full &&
        createPortal(
          <div className="pv-full" dir="rtl">
            <div className="pv-full-bar">
              <button type="button" className="btn small" onClick={() => setFull(false)}>
                → بازگشت به ویرایشگر
              </button>
              {pages.length > 1 && (
                <select className="preview-page" value={page} onChange={(e) => setPage(e.target.value)} aria-label="صفحه">
                  {pages.map((p) => (
                    <option key={p} value={p}>
                      {p === "/" ? "صفحه‌ی اصلی" : pageTitle(data, p) || p}
                    </option>
                  ))}
                </select>
              )}
              <div className="segmented" role="group" aria-label="اندازه‌ی نمایش">
                <button aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
                  دسکتاپ
                </button>
                <button aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
                  موبایل
                </button>
              </div>
              {onDataChange && <EditToggle on={editing} onChange={setEditing} />}
              {onDataChange && (
                <button type="button" className="btn small ghost" aria-pressed={panel} onClick={() => setPanel(!panel)}>
                  تنظیمات
                </button>
              )}
            </div>
            <div className="pv-full-body">
              <div className="pv-full-view">
                <div
                  className={`preview-frame${editing && onDataChange ? " editing" : ""}${device === "mobile" ? " mobile" : ""}`}
                  style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}
                  onClick={onFrameClick}
                >
                  <site.component data={data} theme={theme} page={page} />
                </div>
              </div>
              {onDataChange && panel && (
                <SitePanel
                  data={raw}
                  theme={theme}
                  multiPage={Boolean(site.pages)}
                  onData={onDataChange}
                  onTheme={onThemeChange}
                  onClose={() => setPanel(false)}
                />
              )}
            </div>
          </div>,
          document.body,
        )}

      {target &&
        onDataChange &&
        createPortal(
          <EditPopover
            key={target.path}
            target={target}
            value={String(getAt(raw, target.path) ?? "")}
            placeholder={String(getAt(shown, target.path) ?? "")}
            canRemove={isItemPath(target.path)}
            onSave={(value) => {
              onDataChange(setAt(raw, shown, target.path, value === "" && target.kind === "image" && /\.\d+$/.test(target.path) ? undefined : value));
              setTarget(null);
            }}
            onRemove={() => {
              onDataChange(removeItem(raw, target.path));
              setTarget(null);
            }}
            onClose={() => setTarget(null)}
          />,
          document.body,
        )}
    </div>
  );
}

function EditToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="pv-edit-toggle" title="با کلیک روی متن‌ها و تصویرها، همان‌جا ویرایششان کنید">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      ویرایش با کلیک
    </label>
  );
}

/** Small first-page preview of a template with the user's own content and colors. */
const Thumb = memo(function Thumb({ template, data, theme }: { template: TemplateDefinition; data: ResumeData; theme: Theme }) {
  return (
    <div className="pdf-thumb-page" aria-hidden="true">
      <Scaled width={96}>
        <template.component data={data} theme={{ ...theme, templateId: template.id }} />
      </Scaled>
    </div>
  );
});
