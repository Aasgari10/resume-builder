import type { SectionKey, Theme } from "@rb/schema";
import { ColorPicker } from "./ColorPicker";

const SECTION_LABELS: Record<SectionKey, string> = {
  experience: "سوابق کاری",
  education: "تحصیلات",
  skills: "مهارت‌ها",
  projects: "پروژه‌ها",
  languages: "زبان‌ها",
  certificates: "گواهینامه‌ها",
  customSections: "بخش‌های آزاد",
};

type Props = {
  theme: Theme;
  onChange: (theme: Theme) => void;
};

/** Appearance controls: palette, colors, spacing, display options and section order. */
export function ThemePanel({ theme, onChange }: Props) {
  const set = <K extends keyof Theme>(key: K, value: Theme[K]) => onChange({ ...theme, [key]: value });

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= theme.sections.length) return;
    const sections = [...theme.sections];
    [sections[index], sections[target]] = [sections[target]!, sections[index]!];
    set("sections", sections);
  };

  const toggleSection = (index: number) =>
    set(
      "sections",
      theme.sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
    );

  return (
    <section className="card stack">
      <h2>ظاهر</h2>

      <div className="field">
        <span>رنگ اصلی</span>
        <ColorPicker value={theme.colors.primary} onChange={(primary) => set("colors", { ...theme.colors, primary })} />
        <small className="muted">فقط رنگ اصلی قالب عوض می‌شود؛ رنگ نوشته‌های روی آن خودکار خوانا می‌ماند.</small>
      </div>

      <div className="grid2">
        <ColorField label="رنگ تأکید" value={theme.colors.accent} onChange={(v) => set("colors", { ...theme.colors, accent: v })} />

        <label className="field">
          <span>فاصله‌ها</span>
          <select
            value={theme.layout.spacing}
            onChange={(e) => set("layout", { ...theme.layout, spacing: e.target.value as Theme["layout"]["spacing"] })}
          >
            <option value="compact">فشرده</option>
            <option value="normal">معمولی</option>
            <option value="relaxed">باز</option>
          </select>
        </label>

        <label className="field">
          <span>گردی گوشه‌ها</span>
          <select
            value={theme.layout.radius}
            onChange={(e) => set("layout", { ...theme.layout, radius: e.target.value as Theme["layout"]["radius"] })}
          >
            <option value="none">بدون گردی</option>
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
          </select>
        </label>

        <label className="field">
          <span>تاریخ</span>
          <select
            value={theme.display.dateFormat}
            onChange={(e) =>
              set("display", { ...theme.display, dateFormat: e.target.value as Theme["display"]["dateFormat"] })
            }
          >
            <option value="jalali">شمسی</option>
            <option value="gregorian">میلادی</option>
          </select>
        </label>

      </div>

      <div className="field">
        <span>ترتیب و نمایش بخش‌ها</span>
        <ul className="section-order">
          {theme.sections.map((s, i) => (
            <li key={s.key} className={s.visible ? undefined : "is-hidden"}>
              <label className="row gap grow">
                <input type="checkbox" checked={s.visible} onChange={() => toggleSection(i)} />
                {SECTION_LABELS[s.key]}
              </label>
              <button type="button" aria-label="بالا" disabled={i === 0} onClick={() => moveSection(i, -1)}>
                ↑
              </button>
              <button
                type="button"
                aria-label="پایین"
                disabled={i === theme.sections.length - 1}
                onClick={() => moveSection(i, 1)}
              >
                ↓
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="row gap">
        <input type="color" className="color-input" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} />
        <code className="ltr muted">{value}</code>
      </span>
    </label>
  );
}
