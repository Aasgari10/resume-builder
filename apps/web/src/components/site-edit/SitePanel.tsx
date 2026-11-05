// Settings that are not visible on the page itself, for the full-screen site view: color, text size,
// spacing, corners, which pages are shown, and adding projects or gallery pictures.
// Every option is a fixed choice, so any combination still looks tidy on phones.

import { useRef, useState } from "react";
import type { ResumeData, Theme } from "@rb/schema";
import { ColorPicker } from "../ColorPicker";
import { newId } from "../editor/list";
import { uploadPicture } from "./uploadImage";

const PAGES: { path: string; label: string }[] = [
  { path: "/gallery", label: "گالری" },
  { path: "/about", label: "درباره‌ی من" },
  { path: "/resume", label: "رزومه" },
];

type Props = {
  data: ResumeData;
  theme: Theme;
  multiPage: boolean;
  onData: (data: ResumeData) => void;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
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

export function SitePanel({ data, theme, multiPage, onData, onTheme, onClose }: Props) {
  const site = data.site ?? { gallery: [] };
  const hidden = site.hiddenPages ?? [];
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A gallery item needs its picture, so the picture is chosen and uploaded first.
  async function addPicture(f: File) {
    setError(null);
    setBusy(true);
    try {
      const image = await uploadPicture(f);
      onData({ ...data, site: { ...site, gallery: [...site.gallery, { id: newId(), title: "تصویر جدید", image }] } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود انجام نشد");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  const togglePage = (path: string) =>
    onData({ ...data, site: { ...site, hiddenPages: hidden.includes(path) ? hidden.filter((p) => p !== path) : [...hidden, path] } });

  return (
    <aside className="sp" aria-label="تنظیمات سایت">
      <div className="sp-head">
        <strong>تنظیمات سایت</strong>
        <button type="button" className="ep-x" onClick={onClose} aria-label="بستن">
          ×
        </button>
      </div>

      <section>
        <h3>رنگ اصلی</h3>
        <ColorPicker value={theme.colors.primary} onChange={(primary) => onTheme({ ...theme, colors: { ...theme.colors, primary } })} />
      </section>

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
      </section>

      {multiPage && (
        <>
          <section>
            <h3>صفحه‌ها</h3>
            {PAGES.map((p) => (
              <label key={p.path} className="sp-switch">
                <input type="checkbox" checked={!hidden.includes(p.path)} onChange={() => togglePage(p.path)} />
                {p.label}
              </label>
            ))}
            <small className="muted">صفحه‌ای که محتوایی ندارد، خودش از منو حذف می‌شود.</small>
          </section>

          <section>
            <h3>افزودن</h3>
            <div className="sp-add">
              <button
                type="button"
                className="btn ghost"
                onClick={() => onData({ ...data, projects: [...data.projects, { id: newId(), title: "پروژه‌ی جدید", technologies: [], images: [] }] })}
              >
                + پروژه
              </button>
              <button type="button" className="btn ghost" disabled={busy} onClick={() => file.current?.click()}>
                {busy ? "در حال آپلود…" : "+ تصویر گالری"}
              </button>
              <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void addPicture(e.target.files[0])} />
            </div>
            {error && <p className="error small">{error}</p>}
            <small className="muted">بعد از افزودن، روی خود مورد در صفحه کلیک کنید تا متن یا تصویرش را عوض کنید.</small>
          </section>
        </>
      )}
    </aside>
  );
}
