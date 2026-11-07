// Side panel of the site editor, with three tabs:
// - Settings: things not visible on the page itself (color, sizes, pages) and adding new items.
//   Every option is a fixed choice, so any combination still looks tidy on phones.
// - Assistant: the AI chat that changes the same settings from a written request.
// - Publish: site address, search engine settings and publishing.

import { useRef, useState, type ReactNode } from "react";
import type { ResumeData, Theme } from "@rb/schema";
import { PAGE_PRESETS, SITE_PALETTES, pageColorsFrom, type PageColors, type TemplateDefinition } from "@rb/templates";
import { AssistantChat } from "../AssistantChat";
import { ColorPicker } from "../ColorPicker";
import { newId } from "../editor/list";
import { uploadPicture } from "./uploadImage";

export type PanelTab = "settings" | "assistant" | "publish";

/** Hint when the chosen contact channel is not filled in yet (the button then falls back to email). */
function contactMissing(data: ResumeData): string | null {
  const via = data.site?.contactVia ?? "email";
  const has = (type: string) => data.basics.links.some((l) => l.type === type && l.url.trim());
  if (via === "whatsapp" && !has("whatsapp")) return "هنوز واتس‌اپی اضافه نشده؛ از «+ راه ارتباطی» در صفحه‌ی درباره‌ی من اضافه کنید.";
  if (via === "telegram" && !has("telegram")) return "هنوز تلگرامی اضافه نشده؛ از «+ راه ارتباطی» در صفحه‌ی درباره‌ی من اضافه کنید.";
  if (via === "phone" && !data.basics.phone?.trim()) return "شماره‌ی تلفن وارد نشده است.";
  if (via === "email" && !data.basics.email?.trim()) return "ایمیل وارد نشده است.";
  return null;
}

/** Current month as YYYY-MM, the start date of newly added items. */
const thisMonth = () => new Date().toISOString().slice(0, 7);

type Props = {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  data: ResumeData;
  theme: Theme;
  /** The chosen site template: its switchable pages and sections. */
  template: TemplateDefinition;
  /** Puts the template's own page colors back. */
  onResetColors: () => void;
  /** Whether the user picked page colors for this template (otherwise its own colors are shown). */
  ownColors: boolean;
  onData: (data: ResumeData) => void;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
  /** Publishing controls; absent for a draft that has not been saved yet. */
  publish: ReactNode;
};

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="sp-row">
      <span>{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SitePanel({ tab, onTab, data, theme, template, onResetColors, ownColors, onData, onTheme, onClose, publish }: Props) {
  return (
    <aside className="sp" aria-label="پنل سایت">
      <div className="sp-head">
        <div className="sp-tabs" role="tablist">
          {(
            [
              ["settings", "تنظیمات"],
              ["assistant", "دستیار هوشمند"],
              ["publish", "انتشار"],
            ] as [PanelTab, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="ep-x" onClick={onClose} aria-label="بستن پنل">
          ×
        </button>
      </div>

      {tab === "settings" && <Settings data={data} theme={theme} template={template} onResetColors={onResetColors} ownColors={ownColors} onData={onData} onTheme={onTheme} />}
      {tab === "assistant" && (
        <div className="sp-assistant">
          <AssistantChat theme={theme} locale={data.locale} onChange={onTheme} />
        </div>
      )}
      {tab === "publish" && <div className="sp-publish">{publish}</div>}
    </aside>
  );
}

function Settings({ data, theme, template, onResetColors, ownColors, onData, onTheme }: Pick<Props, "data" | "theme" | "template" | "onResetColors" | "ownColors" | "onData" | "onTheme">) {
  const site = data.site ?? { gallery: [] };
  const hidden = site.hiddenPages ?? [];
  const hiddenBlocks = site.hiddenBlocks ?? [];
  // The "let's talk" destination is used by the vitrine template only.
  const multiPage = template.id === "vitrine-portfolio";
  const optionalPages = template.optionalPages ?? [];
  const blocks = template.blocks ?? [];
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePage = (path: string) =>
    onData({ ...data, site: { ...site, hiddenPages: hidden.includes(path) ? hidden.filter((p) => p !== path) : [...hidden, path] } });
  const toggleBlock = (key: string) =>
    onData({ ...data, site: { ...site, hiddenBlocks: hiddenBlocks.includes(key) ? hiddenBlocks.filter((k) => k !== key) : [...hiddenBlocks, key] } });

  // A gallery item needs its picture, so the picture is chosen and uploaded first.
  async function addPicture(f: File) {
    setError(null);
    setBusy(true);
    try {
      const image = await uploadPicture(f);
      onData({ ...data, site: { ...site, gallery: [...site.gallery, { id: newId(), title: "مدرک جدید", image }] } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود انجام نشد");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  const add = {
    project: () => onData({ ...data, projects: [...data.projects, { id: newId(), title: "پروژه‌ی جدید", technologies: [], images: [] }] }),
    experience: () =>
      onData({
        ...data,
        experience: [...data.experience, { id: newId(), position: "سمت جدید", company: "نام شرکت", period: { start: thisMonth(), current: true }, highlights: [] }],
      }),
    education: () =>
      onData({ ...data, education: [...data.education, { id: newId(), institution: "نام دانشگاه", degree: "کارشناسی", period: { start: thisMonth(), current: false } }] }),
    certificate: () => onData({ ...data, certificates: [...data.certificates, { id: newId(), title: "دوره‌ی جدید" }] }),
    skill: () => onData({ ...data, skills: [...data.skills, { id: newId(), name: "مهارت جدید" }] }),
    testimonial: () =>
      onData({ ...data, site: { ...site, testimonials: [...(site.testimonials ?? []), { id: newId(), name: "نام مشتری", text: "نظر مشتری درباره‌ی کار شما" }] } }),
  };

  return (
    <div className="sp-body">
      <section>
        <h3>رنگ اصلی</h3>
        <ColorPicker value={theme.colors.primary} onChange={(primary) => onTheme({ ...theme, colors: { ...theme.colors, primary } })} />
      </section>

      <PageColorsPicker theme={theme} template={template} ownColors={ownColors} onTheme={onTheme} onReset={onResetColors} />

      <section>
        <h3>اندازه‌ها</h3>
        <Choice
          label="متن"
          value={theme.typography.scale}
          options={[
            ["sm", "کوچک"],
            ["md", "معمولی"],
            ["lg", "بزرگ"],
          ]}
          onChange={(scale) => onTheme({ ...theme, typography: { ...theme.typography, scale } })}
        />
        <Choice
          label="فاصله‌ها"
          value={theme.layout.spacing}
          options={[
            ["compact", "فشرده"],
            ["normal", "معمولی"],
            ["relaxed", "باز"],
          ]}
          onChange={(spacing) => onTheme({ ...theme, layout: { ...theme.layout, spacing } })}
        />
        <Choice
          label="گوشه‌ها"
          value={theme.layout.radius}
          options={[
            ["none", "تیز"],
            ["sm", "کم"],
            ["md", "گرد"],
            ["lg", "خیلی گرد"],
          ]}
          onChange={(radius) => onTheme({ ...theme, layout: { ...theme.layout, radius } })}
        />
        <Choice
          label="تاریخ‌ها"
          value={theme.display.dateFormat}
          options={[
            ["jalali", "شمسی"],
            ["gregorian", "میلادی"],
          ]}
          onChange={(dateFormat) => onTheme({ ...theme, display: { ...theme.display, dateFormat } })}
        />
      </section>

      {multiPage && (
        <section>
          <h3>دکمه‌ی «گفت‌وگو کنیم» به کجا برود؟</h3>
          <div className="sp-add">
            {(
              [
                ["email", "ایمیل"],
                ["whatsapp", "واتس‌اپ"],
                ["telegram", "تلگرام"],
                ["phone", "تماس تلفنی"],
                ["about", "صفحه‌ی درباره‌ی من"],
              ] as const
            ).map(([via, label]) => (
              <button
                key={via}
                type="button"
                className="btn ghost small"
                aria-pressed={(site.contactVia ?? "email") === via}
                onClick={() => onData({ ...data, site: { ...site, contactVia: via } })}
              >
                {label}
              </button>
            ))}
          </div>
          {contactMissing(data) && <small className="cp-hint">{contactMissing(data)}</small>}
        </section>
      )}

      {optionalPages.length > 0 && (
        <section>
          <h3>صفحه‌ها</h3>
          {optionalPages.map((p) => (
            <label key={p.path} className="sp-switch">
              <input type="checkbox" checked={!hidden.includes(p.path)} onChange={() => togglePage(p.path)} />
              {p.label}
            </label>
          ))}
          <small className="muted">صفحه‌ی خاموش از منو و سایت حذف می‌شود. صفحه‌ای که محتوایی ندارد هم خودش پنهان می‌شود.</small>
        </section>
      )}

      {blocks.length > 0 && (
        <section>
          <h3>بخش‌ها</h3>
          {blocks.map((b) => (
            <label key={b.key} className="sp-switch">
              <input type="checkbox" checked={!hiddenBlocks.includes(b.key)} onChange={() => toggleBlock(b.key)} />
              {b.label}
            </label>
          ))}
        </section>
      )}

      <section>
        <h3>افزودن</h3>
        <div className="sp-add">
          <button type="button" className="btn ghost small" onClick={add.project}>
            + پروژه
          </button>
          <button type="button" className="btn ghost small" disabled={busy} onClick={() => file.current?.click()}>
            {busy ? "در حال آپلود…" : "+ مدرک (تصویر)"}
          </button>
          <button type="button" className="btn ghost small" onClick={add.experience}>
            + سابقه‌ی کاری
          </button>
          <button type="button" className="btn ghost small" onClick={add.education}>
            + تحصیلات
          </button>
          <button type="button" className="btn ghost small" onClick={add.certificate}>
            + دوره
          </button>
          <button type="button" className="btn ghost small" onClick={add.skill}>
            + مهارت
          </button>
          {blocks.some((b) => b.key === "testimonials") && (
            <button type="button" className="btn ghost small" onClick={add.testimonial}>
              + نظر مشتری
            </button>
          )}
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void addPicture(e.target.files[0])} />
        </div>
        {error && <p className="error small">{error}</p>}
        <small className="muted">بعد از افزودن، روی خود مورد در صفحه کلیک کنید تا متن، تاریخ یا تصویرش را عوض کنید. برای حذف یا پاک کردن هم روی آن کلیک کنید.</small>
      </section>
    </div>
  );
}

const same = (a: PageColors, b: PageColors) => (["background", "surface", "text", "mutedText"] as const).every((k) => a[k].toUpperCase() === b[k].toUpperCase());

/**
 * Page colors (background, cards and text together): the template's own set, ready-made sets, or
 * any background color, with cards and text following it so the page stays readable.
 */
function PageColorsPicker({ theme, template, ownColors, onTheme, onReset }: { theme: Theme; template: TemplateDefinition; ownColors: boolean; onTheme: (t: Theme) => void; onReset: () => void }) {
  const own = SITE_PALETTES[template.id];
  const [custom, setCustom] = useState(false);
  if (!own) return null;
  const current: PageColors = theme.colors;
  const apply = (colors: PageColors) => onTheme({ ...theme, colors: { ...theme.colors, ...colors } });
  const options: { key: string; label: string; colors: PageColors }[] = [{ key: "own", label: "رنگ‌های قالب", colors: own }, ...PAGE_PRESETS];
  const chosen = !ownColors ? "own" : options.find((o) => o.key !== "own" && same(o.colors, current))?.key;
  return (
    <section>
      <h3>رنگ پس‌زمینه</h3>
      <div className="sp-swatches">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            className="sp-swatch"
            aria-pressed={chosen === o.key}
            title={o.label}
            onClick={() => (o.key === "own" ? onReset() : apply(o.colors))}
          >
            <i style={{ background: o.colors.background }}>
              <b style={{ background: o.colors.surface, color: o.colors.text }}>آ</b>
            </i>
            <span>{o.label}</span>
          </button>
        ))}
        <button type="button" className="sp-swatch" aria-pressed={custom || (ownColors && !chosen)} onClick={() => setCustom(!custom)}>
          <i className="sp-rainbow" />
          <span>رنگ دلخواه</span>
        </button>
      </div>
      {(custom || (ownColors && !chosen)) && (
        <>
          <BackgroundPicker value={current.background} onChange={(bg) => apply(pageColorsFrom(bg))} />
          <small className="muted">رنگ کارت‌ها و متن‌ها خودکار با پس‌زمینه هماهنگ می‌شود تا نوشته‌ها خوانا بمانند.</small>
        </>
      )}
    </section>
  );
}

/** Soft light tones and deep dark ones that work as page backgrounds. */
const BACKGROUNDS = ["#FFF4F2", "#FFF8E6", "#F1F8F2", "#EEF5FD", "#F4F0FC", "#F2F2F2", "#1E2A23", "#2B1F2E", "#1E293B", "#2A2420"];
const HEX = /^#[0-9A-F]{6}$/;

function BackgroundPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const current = value.toUpperCase();
  const [code, setCode] = useState(current);
  return (
    <div className="cp">
      <div className="cp-row" role="radiogroup" aria-label="رنگ پس‌زمینه">
        {BACKGROUNDS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={current === c} aria-label={c} className="cp-dot sp-bg-dot" style={{ background: c }} onClick={() => onChange(c)} />
        ))}
        <label className="cp-dot cp-custom" title="هر رنگی">
          <span className="sr-only">هر رنگی</span>
          <input type="color" value={current.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} />
        </label>
        <input
          className="cp-code"
          dir="ltr"
          value={code}
          maxLength={7}
          aria-label="کد رنگ پس‌زمینه"
          onChange={(e) => {
            const next = e.target.value.toUpperCase().replace(/^([^#])/, "#$1");
            setCode(next);
            if (HEX.test(next)) onChange(next);
          }}
          onBlur={() => setCode(current)}
        />
      </div>
    </div>
  );
}
