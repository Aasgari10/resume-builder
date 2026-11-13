// Site workspace: the live website with click-to-edit, page and device switches, and the side panel
// (settings, assistant, publishing). "Show" turns the same workspace into a full-screen view.
// Empty content is filled with sample text and pictures; publishing uses only the user's own content.

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { applyHiddenFields, changeCart, emptyVisitor, toggleWishlist, variantKey, type ResumeData, type Theme, type Visitor } from "@rb/schema";
import { getTemplate, isDummyUrl, pageTitle, resolvePage, siteTheme, withPlaceholders } from "@rb/templates";
import { newId } from "./editor/list";
import { EditPopover, type EditTarget } from "./site-edit/EditPopover";
import { SitePanel, type PanelTab } from "./site-edit/SitePanel";
import { getAt, isItemPath, removeItem, setAt } from "./site-edit/paths";
import { SiteInbox } from "./shop/SiteInbox";
import { ShopManager } from "./shop/ShopManager";
import { onSampleChange, sampleAccountAction, sampleOrder, sampleShopFor, sampleVisitor, touchSample } from "./shop/sampleData";

type Device = "desktop" | "mobile";

const MOBILE_WIDTH = 390;

/** Fields that must keep a value: the name, and the main title of every item. */
const REQUIRED = /^basics\.fullName$|\.(title|position|company|institution|name|period)$/;
/** Templates show these fields in place of an empty one, so clearing one clears its stand-in too. */
const STAND_IN: Record<string, string> = { "site.aboutText": "basics.summary", "site.aboutImage": "basics.avatarUrl", "site.address": "basics.location" };

/** Remembers (or forgets) that a top-level field was emptied on purpose, so no sample fills it. */
function markCleared(data: ResumeData, path: string, empty: boolean): ResumeData {
  if (path.includes("[")) return data; // fields of items are never filled with samples one by one
  const paths = [path, ...(STAND_IN[path] ? [STAND_IN[path]!] : [])];
  const now = (data.site?.clearedFields ?? []).filter((p) => !paths.includes(p));
  const clearedFields = empty ? [...now, ...paths] : now;
  return { ...data, site: { gallery: [], ...data.site, clearedFields } };
}

type Props = {
  data: ResumeData;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onDataChange: (data: ResumeData) => void;
  /** Publishing controls for the panel's last tab. */
  publish: ReactNode;
  /** Shown at the start of the workspace bar (title, save state, …). */
  bar?: ReactNode;
  /** Saved resume id (absent for an unsaved draft); the shop panel needs it to list orders. */
  resumeId?: string;
};

export function Preview({ data: raw, theme, onThemeChange, onDataChange, publish, bar, resumeId }: Props) {
  const site = getTemplate(theme.templateId);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [formNote, setFormNote] = useState<string | null>(null);
  // Each template may bring its own example persona and pictures.
  const templateSample = useMemo(() => site.sample?.(raw.locale), [site, raw.locale]);
  const shown = withPlaceholders(raw, templateSample);
  const data = applyHiddenFields(shown, theme.hiddenFields);
  // The colors the site is drawn with: the template's own page colors until the user picks others.
  const effective = siteTheme(theme);
  const changeTheme = (next: Theme) => {
    const page = ["background", "surface", "text", "mutedText"] as const;
    if (page.some((k) => next.colors[k] !== effective.colors[k])) return onThemeChange({ ...next, colorsFor: next.templateId });
    // Untouched page colors stay as stored (the template's own colors are not copied into the theme).
    const { background, surface, text, mutedText } = theme.colors;
    onThemeChange({ ...next, colors: { ...next.colors, background, surface, text, mutedText } });
  };
  const [editing, setEditing] = useState(true);
  const [full, setFull] = useState(false);
  // In full-screen view the bar hides behind a small button.
  const [barOpen, setBarOpen] = useState(false);
  useEffect(() => setBarOpen(false), [full]);
  const [panel, setPanel] = useState(true);
  const [tab, setTab] = useState<PanelTab>("assistant");
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [requestedPage, setPage] = useState("/");
  // Shop templates: the preview keeps its own cart and wishlist, as a visitor's browser would.
  const [visitor, setVisitor] = useState<Visitor>(emptyVisitor);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopFocus, setShopFocus] = useState<string | undefined>();
  const pages = site.pages?.(data) ?? ["/"];
  const page = resolvePage(site, data, requestedPage) ?? "/";

  // HomeMart's own color is burgundy: a site still on the starting navy gets it (a color the user picked stays).
  useEffect(() => {
    if (theme.templateId === "homemart-shop" && theme.colors.primary.toUpperCase() === "#1E3A5F") onThemeChange({ ...theme, colors: { ...theme.colors, primary: "#800E2F" } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.templateId, theme.colors.primary]);

  // Shop templates: the customer's side (signing in, orders, tickets, comments) runs on the sample
  // shop activity that the shop manager shows too, kept in this browser only.
  const sampleShop = sampleShopFor(raw.site?.shop, templateSample?.site?.shop);
  const [, setSampleRound] = useState(0);
  useEffect(() => {
    if (!site.shop) return;
    const stop = onSampleChange(() => setSampleRound((n) => n + 1));
    touchSample();
    const timer = setInterval(touchSample, 60000);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [site.shop]);
  const shownVisitor: Visitor = site.shop ? { ...visitor, ...sampleVisitor(sampleShop, page) } : visitor;

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
    // Products are edited in the shop manager: a click on a product (not on its buttons) opens it there.
    const el = e.target as Element;
    const product = editing && site.shop && !el.closest("button, input, select, label, textarea") ? el.closest<HTMLElement>("[data-product]") : null;
    if (product) {
      e.preventDefault();
      setShopFocus(product.dataset.product!);
      setShopOpen(true);
      return;
    }
    // The nearest marked element or link decides: a plain link inside an editable area still navigates.
    const hit = editing ? (e.target as Element).closest<HTMLElement>("[data-edit], a") : null;
    const marked = hit?.hasAttribute("data-edit") ? hit : null;
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
    // Links inside the site with a query (a booking day, a month, a blog category or page): open that
    // page with the query, as the published site does, then go to its anchor or the top.
    else if (href.startsWith("/") && !href.startsWith("//")) {
      const url = new URL(href, "http://site");
      setVisitor((v) => ({ ...v, query: Object.fromEntries(url.searchParams) }));
      setPage(url.pathname);
      const anchor = url.hash.slice(1);
      window.setTimeout(() => (anchor ? document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }) : frameTop(a)), 60);
    }
    // Project rule: a placeholder link ("#", example.com) takes the visitor to the top of the page.
    else if (isDummyUrl(href)) a.closest(".ws-view")?.scrollTo({ top: 0, behavior: "smooth" });
    else if (href.startsWith("#")) document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else if (/^(https?:|mailto:|tel:)/i.test(href)) window.open(href, "_blank", "noopener,noreferrer");
  };

  // Shop forms (cart, wishlist, search, checkout) are answered here instead of by the server.
  /** Scrolls the preview to the top, as a new page would open. */
  const frameTop = (from: Element) => from.closest(".ws-view")?.scrollTo({ top: 0, behavior: "smooth" });

  const onFrameSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const action = form.getAttribute("action") ?? "";
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (action.endsWith("/_cart")) {
      const qty = Math.max(0, Math.floor(Number(fields.qty ?? 1)) || 0);
      // Choices come as opt0/opt1 from a product page, or as the stored key from the cart.
      const size = (fields.opt0 ? variantKey([fields.opt0, fields.opt1]) : fields.size) || undefined;
      setVisitor((v) => {
        if (fields.op === "coupon") return { ...v, coupon: fields.code?.trim() || undefined };
        if (fields.op === "wish") return { ...v, wishlist: toggleWishlist(v.wishlist, fields.id!) };
        if (fields.op === "add") return { ...v, cart: changeCart(v.cart, "add", fields.id!, Math.max(1, qty), size) };
        if (fields.op === "set") return { ...v, cart: changeCart(v.cart, "set", fields.id!, qty, size) };
        if (fields.op === "remove") return { ...v, cart: changeCart(v.cart, "remove", fields.id!, 0, size) };
        return v;
      });
      if (fields.back && fields.back !== page) setPage(fields.back);
    } else if (action.endsWith("/_account")) {
      // The preview signs in sample customers; their tickets and comments join the sample the manager shows.
      const r = sampleAccountAction(sampleShop, fields, Boolean(raw.site?.shop?.reviewsAutoApprove));
      const query: Record<string, string> = r.error ? { error: r.error } : r.msg ? { msg: r.msg } : {};
      setVisitor((v) => ({ ...v, query }));
      if (r.page) setPage(r.page);
      frameTop(form);
    } else if (action.endsWith("/_order")) {
      // The order joins the sample: the manager shows it as a new order (nothing reaches the server).
      const r = sampleOrder(sampleShop, visitor.cart, visitor.coupon, fields);
      const query: Record<string, string> = r.code ? { code: r.code } : { error: r.error ?? "" };
      setVisitor((v) => (r.code ? { ...v, cart: [], coupon: undefined, query } : { ...v, query }));
      if (r.page) setPage(r.page);
      frameTop(form);
    } else if (action.endsWith("/_form")) {
      // Bookings, messages and sign-ups are saved only from the published site; the preview says so.
      setFormNote(
        fields.kind === "booking"
          ? "در سایت منتشرشده، این درخواست نوبت ثبت می‌شود و در «📥 پیام‌ها و نوبت‌ها» می‌بینیدش."
          : fields.kind === "newsletter"
            ? "در سایت منتشرشده، این عضویت خبرنامه ثبت می‌شود و در «📥 پیام‌ها» می‌بینیدش."
            : "در سایت منتشرشده، این پیام ثبت می‌شود و در «📥 پیام‌ها» می‌بینیدش.",
      );
      window.setTimeout(() => setFormNote(null), 6000);
    } else if ((form.getAttribute("method") ?? "get").toLowerCase() === "get" && action.startsWith("/")) {
      // Search boxes and shop filters: open that page with the filled-in fields as its query.
      const query = Object.fromEntries(Object.entries(fields).filter(([, v]) => typeof v === "string" && v.trim()));
      setVisitor((v) => ({ ...v, query }));
      setPage(action);
    }
  };

  const openPanel = (next: PanelTab) => {
    setTab(next);
    setPanel(true);
  };

  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  const workspace = (
    <div className={`ws${full ? " full" : ""}${full && barOpen ? " bar-open" : ""}`} dir="rtl">
      {full && !barOpen && (
        <button type="button" className="ws-float" title="نمایش ابزارها" aria-label="نمایش ابزارها" onClick={() => setBarOpen(true)}>
          {icon("M4 7h16 M4 12h16 M4 17h16")}
        </button>
      )}
      {(!full || barOpen) && (
      <div className="ws-bar">
        {full ? (
          <>
            <button type="button" className="ws-icon" title="پایان نمایش" aria-label="پایان نمایش" onClick={() => setFull(false)}>
              {icon("M9 6l6 6-6 6")}
            </button>
            <button type="button" className="ws-icon" title="پنهان کردن ابزارها" aria-label="پنهان کردن ابزارها" onClick={() => setBarOpen(false)}>
              {icon("M6 6l12 12 M18 6L6 18")}
            </button>
          </>
        ) : (
          bar
        )}
        <span className="ws-gap" />
        {pages.length > 1 && (
          <select className="ws-select" value={page} onChange={(e) => setPage(e.target.value)} aria-label="صفحه">
            {pages.map((p) => (
              <option key={p} value={p}>
                {p === "/" ? "صفحه‌ی اصلی" : pageTitle(data, p) || p}
              </option>
            ))}
          </select>
        )}
        <div className="ws-seg" role="group" aria-label="اندازه‌ی نمایش">
          <button type="button" aria-pressed={device === "desktop"} title="دسکتاپ" aria-label="دسکتاپ" onClick={() => setDevice("desktop")}>
            {icon("M3.5 5h17v11h-17z M9 20h6 M12 16v4")}
          </button>
          <button type="button" aria-pressed={device === "mobile"} title="موبایل" aria-label="موبایل" onClick={() => setDevice("mobile")}>
            {icon("M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2")}
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
          ویرایش
          <i aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ws-chip"
          aria-pressed={panel}
          title={panel ? "بستن کشوی دستیار هوشمند و انتشار" : "باز کردن کشوی دستیار هوشمند و انتشار"}
          onClick={() => (panel ? setPanel(false) : openPanel("assistant"))}
        >
          {icon("M4 4.5h16v15H4z M9.5 4.5v15 M6 8h1.5 M6 11h1.5")}
          دستیار
        </button>
        {site.shop && (
          <button type="button" className="ws-chip" title={site.clinic ? "مدیریت مطب: نوبت‌ها، ساعت کاری، تعرفه‌ها، رویدادها و بلاگ" : site.studio ? "مدیریت آتلیه: پیام‌ها و رزروها، پکیج‌ها، تیم، بلاگ" : site.services ? "مدیریت سایت: خدمات، فروشگاه، سفارش‌ها و بلاگ" : site.menu && site.sells ? "مدیریت سایت: منو، فروشگاه، سفارش‌ها و QR کد" : site.menu ? "مدیریت سایت: منو، QR کد و محتوای صفحه‌ها" : "مدیریت فروشگاه: سفارش‌ها، محصولات، تیکت‌ها و گزارش‌ها"} onClick={() => { setShopFocus(undefined); setShopOpen(true); }}>
            ⚙️ مدیریت
          </button>
        )}
        {!site.shop && site.kind === "PORTFOLIO" && (
          <button type="button" className="ws-chip" title="پیام‌هایی که بازدیدکننده‌ها از فرم تماس سایت فرستاده‌اند" onClick={() => setInboxOpen(true)}>
            📥 پیام‌ها
          </button>
        )}
        {!full && (
          <button type="button" className="ws-chip primary" title="دیدن سایت در کل صفحه" onClick={() => setFull(true)}>
            {icon("M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z")}
            نمایش
          </button>
        )}
      </div>
      )}
      <div className="ws-body">
        <div className="ws-view">
          <div
            className={`preview-frame${editing ? " editing" : ""}${device === "mobile" ? " mobile" : ""}`}
            style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}
            onClick={onFrameClick}
            onSubmit={onFrameSubmit}
          >
            <site.component data={data} theme={effective} page={page} editing={editing} visitor={shownVisitor} />
          </div>
        </div>
        {panel && (!full || barOpen) && (
          <SitePanel
            tab={tab}
            onTab={setTab}
            data={raw}
            theme={effective}
            template={site}
            onData={onDataChange}
            onTheme={changeTheme}
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
      {formNote && (
        <div className="ws-form-note" role="status">
          <b>پیش‌نمایش:</b> {formNote}
        </div>
      )}
      {inboxOpen &&
        createPortal(
          <div className="shm" dir="rtl" role="dialog" aria-label="پیام‌ها">
            <header className="shm-head">
              <h2>📥 پیام‌های سایت</h2>
              <button type="button" className="btn small" onClick={() => setInboxOpen(false)}>
                بستن و برگشت به سایت
              </button>
            </header>
            <div className="shm-body">
              <SiteInbox resumeId={resumeId} />
            </div>
          </div>,
          document.body,
        )}
      {shopOpen &&
        createPortal(
          <ShopManager data={raw} sample={templateSample} onData={onDataChange} resumeId={resumeId} focusProductId={shopFocus} menu={Boolean(site.menu)} sells={Boolean(site.sells)} services={Boolean(site.services)} bookings={Boolean(site.bookings)} studio={Boolean(site.studio)} clinic={Boolean(site.clinic)} panel={site.panel} hasBlog={Boolean(site.optionalPages?.some((p) => p.path === "/blog"))} onClose={() => { setShopOpen(false); setShopFocus(undefined); }} />,
          document.body,
        )}
      {target &&
        createPortal(
          <EditPopover
            key={target.path}
            target={target}
            value={getAt(raw, target.path)}
            shown={getAt(shown, target.path)}
            canRemove={isItemPath(target.path)}
            canClear={!REQUIRED.test(target.path)}
            onSave={(value) => {
              if (target.kind === "newlink") {
                // A new way to be reached is added to the user's own links (sample links are replaced).
                const link = value as { type: ResumeData["basics"]["links"][number]["type"]; url: string };
                onDataChange({ ...raw, basics: { ...raw.basics, links: [...raw.basics.links, { id: newId(), ...link }] } });
                setTarget(null);
                return;
              }
              if (target.kind === "newimage") {
                // A new picture joins the user's own list (sample pictures are replaced): a client
                // logo, or by default a gallery picture / certificate.
                const site = raw.site ?? { gallery: [] };
                const image = String(value);
                onDataChange({
                  ...raw,
                  site:
                    target.path === "site.clients"
                      ? { ...site, clients: [...(site.clients ?? []), { id: newId(), name: "مشتری", image }] }
                      : { ...site, gallery: [...site.gallery, { id: newId(), title: "مدرک جدید", image }] },
                });
                setTarget(null);
                return;
              }
              // An emptied extra picture is removed rather than kept as an empty slot.
              const drop = value === "" && target.kind === "image" && /\.\d+$/.test(target.path);
              const empty = value === "" || value === undefined || (Array.isArray(value) && value.length === 0);
              onDataChange(markCleared(setAt(raw, shown, target.path, drop ? undefined : value), target.path, empty));
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

