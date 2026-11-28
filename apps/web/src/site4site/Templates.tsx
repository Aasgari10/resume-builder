// Templates (unit 12): a showcase of the newest templates on a lit plinth (a laptop and a phone whose
// screens scroll), then every template as a framed picture on a brass rail, with search and filters.
// On wide screens each frame can show its phone version; hovering scrolls the shown screen.
// Templates are drawn live from their sample content, so what is shown is exactly what is ordered.

import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SITE_TEMPLATES, sampleResume, type TemplateDefinition } from "@rb/templates";
import { Scaled } from "../components/Scaled";
import { themeFor } from "../hub/Gallery";
import { showcaseColor } from "../hub/showcase";
import { PageHead, UnitPage } from "./Shell";
import { Icon } from "./units";
import "./pages.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

/** Shown on the plinth, newest first. */
const FEATURED = ["barg-shop", "tanin-site", "escape-site"];

type Category = "shop" | "booking" | "personal";
const CATEGORIES: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "shop", label: "فروشگاهی" },
  { key: "booking", label: "رزرو و نوبت" },
  { key: "personal", label: "شخصی و رزومه" },
];

type Meta = {
  t: TemplateDefinition;
  title: string;
  kind: string;
  category: Category;
  features: string[];
};

/** "برگ (کتاب‌فروشی)" → title «برگ», kind «کتاب‌فروشی»; the category and features come from what the template can do. */
function metaOf(t: TemplateDefinition): Meta {
  const m = /^(.*?)\s*\((.*)\)$/.exec(t.name);
  const category: Category = t.bookings ? "booking" : t.shop ? "shop" : "personal";
  const features = [
    t.shop && !t.bookings && "سبد خرید",
    t.bookings && "رزرو آنلاین",
    t.menu && "منوی دیجیتال",
    t.services && "فهرست خدمات",
    t.shop && "حساب مشتری",
    t.optionalPages?.length && "صفحه‌های دلخواه",
    "پنل مدیریت",
  ].filter(Boolean) as string[];
  return {
    t,
    title: m ? m[1]! : t.name,
    kind: m ? m[2]! : category === "personal" ? "سایت شخصی و رزومه" : "",
    category,
    features: features.slice(0, 4),
  };
}

/**
 * Live templates are heavy (a whole site each), so they are built one at a time, only while the page is
 * not scrolling (building one mid-scroll would make the scroll stutter), and the frames in view go first.
 */
const waiting: (() => void)[] = [];
let lastScroll = 0;
let pumping = false;
const QUIET_MS = 180;

function pump() {
  if (pumping) return;
  pumping = true;
  const step = () => {
    if (!waiting.length) {
      pumping = false;
      return;
    }
    const quiet = performance.now() - lastScroll;
    if (quiet < QUIET_MS) {
      window.setTimeout(step, QUIET_MS - quiet);
      return;
    }
    // newest first: the frames the reader has just reached
    waiting.pop()!();
    // let the browser paint (and take a scroll) before the next one
    window.setTimeout(step, 30);
  };
  step();
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => (lastScroll = performance.now()), { passive: true });
  window.addEventListener("wheel", () => (lastScroll = performance.now()), { passive: true });
}

/** Renders children once they come near the screen, through the one-at-a-time queue above. */
function Lazy({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    let queued: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          if (queued) return;
          queued = () => setShown(true);
          waiting.push(queued);
          pump();
        } else if (queued) {
          // scrolled past before its turn: leave the queue to the frames now in view
          const k = waiting.indexOf(queued);
          if (k >= 0) waiting.splice(k, 1);
          queued = null;
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (queued) {
        const k = waiting.indexOf(queued);
        if (k >= 0) waiting.splice(k, 1);
      }
    };
  }, [shown]);
  return (
    <div ref={ref} className={className}>
      {shown ? children : null}
    </div>
  );
}

/** A template drawn at a device width (1280 for computers, 390 for phones), scaled into its box. */
const Live = memo(function Live({ t, base }: { t: TemplateDefinition; base: number }) {
  const data = useMemo(() => t.sample?.("fa") ?? sampleResume("fa"), [t]);
  return (
    <Scaled base={base}>
      <t.component data={data} theme={themeFor(t.id)} />
    </Scaled>
  );
});

function useWide() {
  const q = "(min-width: 1000px)";
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

export function Templates() {
  const navigate = useNavigate();
  const wide = useWide();
  const all = useMemo(() => SITE_TEMPLATES.map(metaOf), []);
  const featured = useMemo(() => FEATURED.map((id) => all.find((m) => m.t.id === id)).filter(Boolean) as Meta[], [all]);
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [phones, setPhones] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Meta | null>(null);

  useEffect(() => {
    document.title = "قالب‌ها | site4site";
  }, []);

  const order = (m: Meta) => navigate(`/resume/new?site=${m.t.id}&color=${encodeURIComponent(showcaseColor(m.t.id))}`);
  const query = q.trim();
  const shown = all.filter((m) => (cat === "all" || m.category === cat) && (!query || `${m.t.name} ${m.kind} ${m.features.join(" ")}`.includes(query)));
  const allPhones = shown.length > 0 && shown.every((m) => phones[m.t.id]);
  const setAll = (on: boolean) => setPhones(Object.fromEntries(shown.map((m) => [m.t.id, on])));

  return (
    <UnitPage current="templates">
      <PageHead plate="واحد ۱۲" title="قالب‌ها" sub="هر قالب یک سایت کامل است؛ با پنل مدیریت، آماده برای کسب‌وکار شما." />

      <Showcase items={featured} wide={wide} onOrder={order} onPreview={setPreview} />

      <h2 className="tp-all">
        همه‌ی قالب‌ها <small>{fa(all.length)} قالب</small>
      </h2>
      <label className="tp-search">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دنبال قالب چه کسب‌وکاری هستید؟ (کافه، آرایشگاه…)" aria-label="جستجوی قالب" />
      </label>
      <div className="tp-tools">
        <div className="s4-chips" role="group" aria-label="دسته‌ها">
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        {wide && (
          <div className="tp-view" role="group" aria-label="نمایش">
            <span>نمایش:</span>
            <button type="button" aria-pressed={!allPhones} onClick={() => setAll(false)}>
              <Icon name="desktop" />
              دسکتاپ
            </button>
            <button type="button" aria-pressed={allPhones} onClick={() => setAll(true)}>
              <Icon name="phone" />
              گوشی
            </button>
          </div>
        )}
      </div>
      <div className="s4-rail" />

      {shown.length === 0 ? (
        <div className="tp-empty">
          <b>قالبی پیدا نشد.</b>
          <p>شاید با کلمه‌ی دیگری پیدا شود؛ یا طرحی که در ذهن دارید را برایمان بفرستید.</p>
        </div>
      ) : (
        <div className="tp-grid">
          {shown.map((m) => (
            <Frame
              key={m.t.id}
              m={m}
              wide={wide}
              phone={Boolean(phones[m.t.id])}
              isNew={m.t.id === FEATURED[0]}
              onPhone={() => setPhones((p) => ({ ...p, [m.t.id]: !p[m.t.id] }))}
              onOrder={() => order(m)}
              onPreview={() => setPreview(m)}
            />
          ))}
        </div>
      )}

      <div className="tp-more">
        <div>
          <b>قالبی که می‌خواهید این‌جا نیست؟</b>
          <p>طرح یا سایت نمونه‌تان را بفرستید؛ برایتان اختصاصی می‌سازیم.</p>
        </div>
        <a className="s4-btn dark" href="/contact">
          سفارش طراحی اختصاصی
        </a>
      </div>

      {preview && <PreviewModal m={preview} onClose={() => setPreview(null)} onOrder={() => order(preview)} />}
    </UnitPage>
  );
}

function Showcase({ items, wide, onOrder, onPreview }: { items: Meta[]; wide: boolean; onOrder: (m: Meta) => void; onPreview: (m: Meta) => void }) {
  const [i, setI] = useState(0);
  const n = items.length;
  const at = (k: number) => items[(k + n) % n]!;
  const m = at(i);
  if (!n) return null;
  return (
    <section className="tp-show" aria-roledescription="carousel" aria-label="قالب‌های تازه">
      <div className="tp-stage">
        <div className="tp-beam" aria-hidden="true" />
        {wide && (
          <>
            <div className="tp-side prev" aria-hidden="true">
              <div className="tp-lap sm">
                <div className="scr">
                  <Live t={at(i - 1).t} base={1280} />
                </div>
                <div className="base" />
              </div>
              <span>{at(i - 1).title}</span>
            </div>
            <div className="tp-side next" aria-hidden="true">
              <div className="tp-lap sm">
                <div className="scr">
                  <Live t={at(i + 1).t} base={1280} />
                </div>
                <div className="base" />
              </div>
              <span>{at(i + 1).title}</span>
            </div>
          </>
        )}
        <div className="tp-hero" key={m.t.id}>
          <span className="tp-new">تازه</span>
          {wide && (
            <div className="tp-lap">
              <div className="scr">
                <div className="roll">
                  <Live t={m.t} base={1280} />
                </div>
              </div>
              <div className="base" />
            </div>
          )}
          <div className="tp-phone">
            <div className="scr">
              <div className="roll">
                <Live t={m.t} base={390} />
              </div>
            </div>
          </div>
        </div>
        <div className="tp-plinth" aria-hidden="true" />
        {n > 1 && (
          <>
            <button type="button" className="tp-arr r" onClick={() => setI(i - 1)} aria-label="قالب قبلی">
              <Icon name="prev" />
            </button>
            <button type="button" className="tp-arr l" onClick={() => setI(i + 1)} aria-label="قالب بعدی">
              <Icon name="next" />
            </button>
          </>
        )}
      </div>
      <div className="tp-card">
        <div className="t">
          <b>{m.title}</b>
          <span className="s4-tag">{CATEGORIES.find((c) => c.key === m.category)!.label}</span>
        </div>
        <small>{m.kind}</small>
        <div className="tp-feats">
          {m.features.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
        <div className="tp-acts">
          <button type="button" className="s4-btn ghost" onClick={() => onPreview(m)}>
            پیش‌نمایش کامل
          </button>
          <button type="button" className="s4-btn main" onClick={() => onOrder(m)}>
            امتحان و سفارش
          </button>
        </div>
        <div className="tp-dots">
          {items.map((it, k) => (
            <button key={it.t.id} type="button" aria-label={it.title} aria-current={k === ((i % n) + n) % n} onClick={() => setI(k)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Frame({
  m,
  wide,
  phone,
  isNew,
  onPhone,
  onOrder,
  onPreview,
}: {
  m: Meta;
  wide: boolean;
  phone: boolean;
  isNew: boolean;
  onPhone: () => void;
  onOrder: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="tp-art">
      <div className={`tp-frame ${phone ? "ph" : ""}`}>
        {isNew && <span className="tp-new">تازه</span>}
        <Lazy className="tp-mat">
          <div className="roll">
            <Live t={m.t} base={1280} />
          </div>
        </Lazy>
        {wide && (
          <>
            <button type="button" className="tp-phb" aria-pressed={phone} aria-label={`نسخه‌ی گوشی ${m.title}`} onClick={onPhone}>
              <Icon name="phone" />
            </button>
            {phone && (
              <div className="tp-mini">
                <div className="scr">
                  <div className="roll">
                    <Live t={m.t} base={390} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="tp-info">
        <div>
          <b>{m.title}</b>
          <small>{m.kind}</small>
        </div>
        <span className="s4-tag">{CATEGORIES.find((c) => c.key === m.category)!.label}</span>
      </div>
      <div className="tp-feats">
        {m.features.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <div className="tp-acts">
        <button type="button" className="s4-btn ghost" onClick={onPreview}>
          پیش‌نمایش
        </button>
        <button type="button" className="s4-btn main" onClick={onOrder}>
          امتحان و سفارش
        </button>
      </div>
    </article>
  );
}

function PreviewModal({ m, onClose, onOrder }: { m: Meta; onClose: () => void; onOrder: () => void }) {
  const [device, setDevice] = useState<"desktop" | "phone">(window.innerWidth < 760 ? "phone" : "desktop");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="tp-modal" role="dialog" aria-modal="true" aria-label={`پیش‌نمایش ${m.title}`} onClick={onClose}>
      <div className="tp-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tp-modal-head">
          <b>{m.title}</b>
          <div className="tp-view">
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
              <Icon name="desktop" />
              دسکتاپ
            </button>
            <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>
              <Icon name="phone" />
              گوشی
            </button>
          </div>
          <button type="button" className="s4-btn main" onClick={onOrder}>
            امتحان و سفارش
          </button>
          <button type="button" className="s4-menu-btn" onClick={onClose} aria-label="بستن">
            <Icon name="close" />
          </button>
        </div>
        <div className={`tp-modal-view ${device}`}>
          <div className="tp-modal-site">
            <Live t={m.t} base={device === "phone" ? 390 : 1280} />
          </div>
        </div>
      </div>
    </div>
  );
}
