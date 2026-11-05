// Site workspace: the live website with click-to-edit, page and device switches, and the side panel
// (settings, assistant, publishing). "Show" turns the same workspace into a full-screen view.
// Empty content is filled with sample text and pictures; publishing uses only the user's own content.

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { applyHiddenFields, type ResumeData, type Theme } from "@rb/schema";
import { SITE_TEMPLATES, getTemplate, pageTitle, resolvePage, withPlaceholders } from "@rb/templates";
import { newId } from "./editor/list";
import { EditPopover, type EditTarget } from "./site-edit/EditPopover";
import { SitePanel, type PanelTab } from "./site-edit/SitePanel";
import { getAt, isItemPath, removeItem, setAt } from "./site-edit/paths";

type Device = "desktop" | "mobile";

const MOBILE_WIDTH = 390;

type Props = {
  data: ResumeData;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onDataChange: (data: ResumeData) => void;
  /** Publishing controls for the panel's last tab. */
  publish: ReactNode;
  /** Shown at the start of the workspace bar (title, save state, …). */
  bar?: ReactNode;
};

export function Preview({ data: raw, theme, onThemeChange, onDataChange, publish, bar }: Props) {
  const shown = withPlaceholders(raw);
  const data = applyHiddenFields(shown, theme.hiddenFields);
  const [editing, setEditing] = useState(true);
  const [full, setFull] = useState(false);
  const [panel, setPanel] = useState(true);
  const [tab, setTab] = useState<PanelTab>("settings");
  const [target, setTarget] = useState<EditTarget | null>(null);
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

  // In edit mode a click on a marked text or picture opens its editor; links switch pages.
  const onFrameClick = (e: MouseEvent) => {
    const marked = editing ? (e.target as Element).closest<HTMLElement>("[data-edit]") : null;
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
    // Buttons and links work as on the published site: pages switch here, "#" scrolls,
    // and outside links (email, phone, other sites) open in a new tab so the editor stays open.
    const a = (e.target as Element).closest("a");
    if (!a) return;
    e.preventDefault();
    const to = a.getAttribute("data-page");
    const href = a.getAttribute("href") ?? "";
    if (to) setPage(to);
    else if (href.startsWith("#")) document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else if (/^(https?:|mailto:|tel:)/i.test(href)) window.open(href, "_blank", "noopener,noreferrer");
  };

  const openPanel = (next: PanelTab) => {
    setTab(next);
    setPanel(true);
  };

  const workspace = (
    <div className={`ws${full ? " full" : ""}`} dir="rtl">
      <div className="ws-bar">
        {full ? (
          <button type="button" className="btn small" onClick={() => setFull(false)}>
            → بازگشت
          </button>
        ) : (
          bar
        )}
        <span className="ws-gap" />
        {SITE_TEMPLATES.length > 1 && (
          <select className="ws-select" value={site.id} onChange={(e) => onThemeChange({ ...theme, templateId: e.target.value })} aria-label="قالب">
            {SITE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                قالب {t.name}
              </option>
            ))}
          </select>
        )}
        {pages.length > 1 && (
          <select className="ws-select" value={page} onChange={(e) => setPage(e.target.value)} aria-label="صفحه">
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
        <button
          type="button"
          role="switch"
          aria-checked={editing}
          className={`ws-edit${editing ? " on" : ""}`}
          title={editing ? "ویرایش روشن است: روی هر متن یا تصویر کلیک کنید. برای امتحان دکمه‌ها و لینک‌ها خاموشش کنید." : "ویرایش خاموش است: دکمه‌ها و لینک‌ها مثل سایت واقعی کار می‌کنند."}
          onClick={() => setEditing(!editing)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          {editing ? "ویرایش روشن" : "ویرایش خاموش"}
          <i aria-hidden="true" />
        </button>
        <button type="button" className="btn small ghost" aria-pressed={panel && tab === "assistant"} onClick={() => (panel && tab === "assistant" ? setPanel(false) : openPanel("assistant"))}>
          ✨ دستیار هوشمند
        </button>
        <button type="button" className="btn small ghost" aria-pressed={panel && tab !== "assistant"} onClick={() => (panel && tab !== "assistant" ? setPanel(false) : openPanel("settings"))}>
          تنظیمات
        </button>
        {!full && (
          <button type="button" className="btn small" onClick={() => setFull(true)}>
            نمایش
          </button>
        )}
      </div>

      <div className="ws-body">
        <div className="ws-view">
          <div
            className={`preview-frame${editing ? " editing" : ""}${device === "mobile" ? " mobile" : ""}`}
            style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}
            onClick={onFrameClick}
          >
            <site.component data={data} theme={theme} page={page} editing={editing} />
          </div>
        </div>
        {panel && (
          <SitePanel
            tab={tab}
            onTab={setTab}
            data={raw}
            theme={theme}
            multiPage={Boolean(site.pages)}
            onData={onDataChange}
            onTheme={onThemeChange}
            onClose={() => setPanel(false)}
            publish={publish}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {full ? createPortal(workspace, document.body) : workspace}
      {target &&
        createPortal(
          <EditPopover
            key={target.path}
            target={target}
            value={getAt(raw, target.path)}
            shown={getAt(shown, target.path)}
            canRemove={isItemPath(target.path)}
            onSave={(value) => {
              if (target.kind === "newlink") {
                // A new way to be reached is added to the user's own links (sample links are replaced).
                const link = value as { type: ResumeData["basics"]["links"][number]["type"]; url: string };
                onDataChange({ ...raw, basics: { ...raw.basics, links: [...raw.basics.links, { id: newId(), ...link }] } });
                setTarget(null);
                return;
              }
              // An emptied extra picture is removed rather than kept as an empty slot.
              const drop = value === "" && target.kind === "image" && /\.\d+$/.test(target.path);
              onDataChange(setAt(raw, shown, target.path, drop ? undefined : value));
              setTarget(null);
            }}
            onRemove={() => {
              onDataChange(removeItem(raw, shown, target.path));
              setTarget(null);
            }}
            onClose={() => setTarget(null)}
          />,
          document.body,
        )}
    </>
  );
}
