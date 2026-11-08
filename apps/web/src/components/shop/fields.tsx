// Small form pieces shared by the shop manager's tabs.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { uploadPicture } from "../site-edit/uploadImage";

/** Reads a whole number typed with Persian or Latin digits and separators; empty stays empty. */
export function readNumber(text: string): number | undefined {
  const digits = text.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, "");
  return digits ? Math.min(Number(digits), 10_000_000_000) : undefined;
}
export const showNumber = (n: number | undefined) => (n === undefined ? "" : new Intl.NumberFormat("fa-IR").format(n));


export function Field({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return (
    <label className={`shm-field${wide ? " wide" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export function MoneyInput({ value, onChange, placeholder }: { value: number | undefined; onChange: (n: number | undefined) => void; placeholder?: string }) {
  const [text, setText] = useState(showNumber(value));
  useEffect(() => setText(showNumber(value)), [value]);
  return (
    <span className="shm-money">
      <input inputMode="numeric" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onBlur={() => onChange(readNumber(text))} />
      <i>تومان</i>
    </span>
  );
}

export function ImagePicker({ value, onChange, label = "انتخاب عکس" }: { value?: string; onChange: (url: string) => void; label?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="shm-pick">
      <button type="button" className="btn ghost small" disabled={busy} onClick={() => file.current?.click()}>
        {busy ? "در حال آپلود…" : value ? "عوض کردن عکس" : label}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await uploadPicture(f));
          } catch (err) {
            setError(err instanceof Error ? err.message : "آپلود انجام نشد");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {error && <small className="error">{error}</small>}
    </span>
  );
}

