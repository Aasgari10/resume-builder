// Site workspace: the live website with click-to-edit, page and device switches, and the side panel
// (settings, assistant, publishing). "Show" turns the same workspace into a full-screen view.
// Empty content is filled with sample text and pictures; publishing uses only the user's own content.

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { applyHiddenFields, changeCart, emptyVisitor, toggleWishlist, variantKey, type ResumeData, type Theme, type Visitor } from "@rb/schema";
import { SITE_TEMPLATES, getTemplate, isDummyUrl, pageTitle, resolvePage, siteTheme, withPlaceholders } from "@rb/templates";
import { newId } from "./editor/list";
import { EditPopover, type EditTarget } from "./site-edit/EditPopover";
import { SitePanel, type PanelTab } from "./site-edit/SitePanel";
import { getAt, isItemPath, removeItem, setAt } from "./site-edit/paths";
import { ShopManager } from "./shop/ShopManager";
import { onSampleChange, resetSample, sampleAccountAction, sampleMe, sampleOrder, sampleShopFor, sampleSignIn, sampleSignOut, sampleVisitor, touchSample } from "./shop/sampleData";
import { SHOWCASE_COLORS, showcaseColor } from "../hub/showcase";

/**
 * Another template keeps the user's own main color, but a color that only came with the previous
 * template (its designed color, or the starting default) is swapped for the new template's own.
 */
function switchTemplate(theme: Theme, templateId: string): Theme {
  const now = theme.colors.primary.toUpperCase();
  const designed = new Set([...Object.values(SHOWCASE_COLORS), "#1E3A5F"].map((c) => c.toUpperCase()));
  return designed.has(now) ? { ...theme, templateId, colors: { ...theme.colors, primary: showcaseColor(templateId) } } : { ...theme, templateId };
}

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
  const [panel, setPanel] = useState(true);
  const [tab, setTab] = useState<PanelTab>("settings");
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [requestedPage, setPage] = useState("/");
  // Shop templates: the preview keeps its own cart and wishlist, as a visitor's browser would.
  const [visitor, setVisitor] = useState<Visitor>(emptyVisitor);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopFocus, setShopFocus] = useState<string | undefined>();
  const pages = site.pages?.(data) ?? ["/"];
  const page = resolvePage(site, data, requestedPage) ?? "/";

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
          <select className="ws-select" value={site.id} onChange={(e) => onThemeChange(switchTemplate(theme, e.target.value))} aria-label="قالب">
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
        {site.shop && (
          <DemoMenu
            customer={sampleMe(sampleShop)}
            onSignIn={() => {
              sampleSignIn(sampleShop);
              setVisitor((v) => ({ ...v, query: {} }));
              setEditing(false);
              setPage("/account");
            }}
            onSignOut={() => {
              sampleSignOut(sampleShop);
              setPage("/");
            }}
            onAdmin={() => {
              setShopFocus(undefined);
              setShopOpen(true);
            }}
            onReset={() => {
              if (!window.confirm("سفارش‌ها، تیکت‌ها و نظرهای نمونه به حالت اول برگردند؟")) return;
              resetSample(sampleShop);
              setVisitor(emptyVisitor());
              setPage("/");
            }}
          />
        )}
        {site.shop && (
          <button type="button" className="btn small" onClick={() => { setShopFocus(undefined); setShopOpen(true); }}>
            🛍 مدیریت فروشگاه
          </button>
        )}
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
            onSubmit={onFrameSubmit}
          >
            <site.component data={data} theme={effective} page={page} editing={editing} visitor={shownVisitor} />
          </div>
        </div>
        {panel && (
          <SitePanel
            tab={tab}
            onTab={setTab}
            data={raw}
            theme={effective}
            template={site}
            onData={onDataChange}
            onTheme={changeTheme}
            onResetColors={() => onThemeChange({ ...theme, colorsFor: undefined })}
            ownColors={theme.colorsFor === theme.templateId}
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
      {shopOpen &&
        createPortal(
          <ShopManager data={raw} sample={templateSample} onData={onDataChange} resumeId={resumeId} focusProductId={shopFocus} onClose={() => { setShopOpen(false); setShopFocus(undefined); }} />,
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

/**
 * The "demo mode" menu of shop templates: try the shop as a customer (signed in with a sample
 * account) or as its manager, and start the sample over.
 */
function DemoMenu({ customer, onSignIn, onSignOut, onAdmin, onReset }: { customer?: string; onSignIn: () => void; onSignOut: () => void; onAdmin: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => !(e.target as Element).closest?.(".demo-menu") && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const pick = (f: () => void) => () => {
    setOpen(false);
    f();
  };
  return (
    <div className="demo-menu">
      <button type="button" className={`demo-chip${customer ? " on" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        🧪 حالت نمایشی{customer && <small>: {customer}</small>}
      </button>
      {open && (
        <div className="demo-pop" role="menu">
          <p className="demo-pop-head">
            <b>فروشگاه را از هر دو طرف امتحان کنید</b>
            <span>به‌عنوان مشتری سفارش بدهید، تیکت بفرستید و نظر بنویسید؛ بعد در پنل مدیریت ببینید و جواب بدهید.</span>
          </p>
          {customer ? (
            <button type="button" role="menuitem" onClick={pick(onSignOut)}>
              <i>👤</i>
              <span>
                خروج از حساب مشتری
                <small>الان به‌عنوان «{customer}» وارد شده‌اید</small>
              </span>
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={pick(onSignIn)}>
              <i>👤</i>
              <span>
                ورود به‌عنوان مشتری نمونه
                <small>با سفارش‌ها و تیکت‌های نمونه؛ بدون فرم</small>
              </span>
            </button>
          )}
          <button type="button" role="menuitem" onClick={pick(onAdmin)}>
            <i>🛍</i>
            <span>
              ورود به پنل مدیر
              <small>سفارش‌ها، تیکت‌ها، نظرها و گزارش‌ها</small>
            </span>
          </button>
          <button type="button" role="menuitem" onClick={pick(onReset)}>
            <i>↺</i>
            <span>
              شروع دوباره‌ی نمونه‌ها
              <small>همه‌ی تغییرها پاک و نمونه‌ها از نو ساخته می‌شوند</small>
            </span>
          </button>
          <p className="demo-pop-foot">تغییرها فقط در همین مرورگر می‌مانند، کاربر دیگری آن‌ها را نمی‌بیند و بعد از ۳۰ دقیقه دوری خودشان تازه می‌شوند. سایت منتشرشده اطلاعات واقعی خودش را دارد.</p>
        </div>
      )}
    </div>
  );
}
