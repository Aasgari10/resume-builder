// Small editor that opens next to a text or picture clicked in the site preview. The kind written
// on the page (data-edit-kind) decides the input: text, paragraph, link, picture, date range,
// month, one-item-per-line list or tags. Sample text in the preview shows as a hint.

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ApiError } from "../../api";
import { uploadPicture } from "./uploadImage";

export type EditKind = "text" | "multiline" | "image" | "url" | "period" | "month" | "lines" | "tags";

export type EditTarget = {
  path: string;
  kind: EditKind;
  label: string;
  /** Where the clicked element is on screen, to place the popover next to it. */
  rect: { top: number; bottom: number; left: number; right: number };
};

type Period = { start: string; end?: string; current: boolean };

type Props = {
  target: EditTarget;
  /** The user's own value at the path (undefined when only sample content is shown). */
  value: unknown;
  /** What the preview shows there now, used as a hint. */
  shown: unknown;
  canRemove: boolean;
  onSave: (value: unknown) => void;
  onRemove: () => void;
  onClose: () => void;
};

const WIDTH = 340;
const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

const asText = (v: unknown) => (Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : "");

export function EditPopover({ target, value, shown, canRemove, onSave, onRemove, onClose }: Props) {
  const { kind } = target;
  const [text, setText] = useState(kind === "tags" && Array.isArray(value) ? value.join("، ") : asText(value));
  const initialPeriod = (value ?? shown) as Period | undefined;
  const [period, setPeriod] = useState<Period>({ start: initialPeriod?.start ?? "", end: initialPeriod?.end ?? "", current: initialPeriod?.current ?? false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: target.rect.bottom + 8, left: target.rect.left });

  // Below the element when there is room, otherwise above; always inside the window.
  useLayoutEffect(() => {
    const h = box.current?.offsetHeight ?? 200;
    const below = target.rect.bottom + 8;
    const top = below + h > window.innerHeight - 8 ? Math.max(8, target.rect.top - h - 8) : below;
    const left = Math.min(Math.max(8, target.rect.right - WIDTH), window.innerWidth - WIDTH - 8);
    setPos({ top, left });
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose]);

  async function upload(f: File) {
    setError(null);
    setBusy(true);
    try {
      onSave(await uploadPicture(f));
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "آپلود انجام نشد");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    setError(null);
    if (kind === "period") {
      if (!YM.test(period.start)) return setError("تاریخ شروع را کامل انتخاب کنید.");
      if (!period.current && period.end && period.end < period.start) return setError("تاریخ پایان نباید قبل از شروع باشد.");
      return onSave({ start: period.start, end: period.current ? undefined : period.end || undefined, current: period.current });
    }
    if (kind === "month") return onSave(text || undefined);
    if (kind === "lines") return onSave(text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10));
    if (kind === "tags") return onSave([...new Set(text.split(/[،,\n]/).map((t) => t.trim()).filter(Boolean))].slice(0, 20));
    if (kind === "url" && text.trim() && !/^https?:\/\//i.test(text.trim())) return setError("لینک باید با http:// یا https:// شروع شود.");
    onSave(text.trim());
  }

  const hint = asText(shown);
  const onEnter = (e: ReactKeyboardEvent) => e.key === "Enter" && save();

  return (
    <div ref={box} className="ep" role="dialog" aria-label={target.label} style={{ top: pos.top, left: pos.left, width: WIDTH }}>
      <div className="ep-head">
        <strong>{target.label}</strong>
        <button type="button" className="ep-x" onClick={onClose} aria-label="بستن">
          ×
        </button>
      </div>

      {kind === "image" && (
        <>
          {typeof value === "string" && value && <img className="ep-thumb" src={value} alt="" />}
          <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>
            {busy ? "در حال آپلود…" : value ? "عوض کردن تصویر" : "آپلود تصویر"}
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          <label className="field">
            <span>یا لینک تصویر</span>
            <input className="ltr" dir="ltr" value={text} placeholder="https://..." onChange={(e) => setText(e.target.value)} onKeyDown={onEnter} />
          </label>
          <div className="ep-actions">
            {Boolean(value) && (
              <button type="button" className="btn ghost danger" onClick={() => onSave("")}>
                حذف تصویر
              </button>
            )}
            <button type="button" className="btn" onClick={save} disabled={!text.trim() || text.trim() === value}>
              ثبت لینک
            </button>
          </div>
        </>
      )}

      {(kind === "text" || kind === "url") && (
        <input
          autoFocus
          dir={kind === "url" ? "ltr" : undefined}
          className={kind === "url" ? "ltr" : undefined}
          value={text}
          placeholder={kind === "url" ? "https://..." : hint}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onEnter}
        />
      )}

      {(kind === "multiline" || kind === "lines" || kind === "tags") && (
        <>
          <textarea autoFocus rows={kind === "tags" ? 3 : 6} value={text} placeholder={kind === "tags" ? asText(shown).replace(/\n/g, "، ") : hint} onChange={(e) => setText(e.target.value)} />
          <small className="muted">
            {kind === "lines" ? "هر مورد در یک خط." : kind === "tags" ? "موارد را با «،» از هم جدا کنید." : "برای بند جدید یک خط خالی بگذارید."}
          </small>
        </>
      )}

      {kind === "month" && <input type="month" dir="ltr" value={text} onChange={(e) => setText(e.target.value)} />}

      {kind === "period" && (
        <div className="ep-period">
          <label className="field">
            <span>شروع</span>
            <input type="month" dir="ltr" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} />
          </label>
          <label className="field">
            <span>پایان</span>
            <input type="month" dir="ltr" value={period.end ?? ""} disabled={period.current} onChange={(e) => setPeriod({ ...period, end: e.target.value })} />
          </label>
          <label className="ep-check">
            <input type="checkbox" checked={period.current} onChange={(e) => setPeriod({ ...period, current: e.target.checked })} />
            هنوز ادامه دارد
          </label>
        </div>
      )}

      {kind !== "image" && (
        <>
          {value === undefined && hint && <small className="muted">متن کم‌رنگ نمونه است؛ تا چیزی ننویسید، در سایت منتشرشده نمی‌آید.</small>}
          <div className="ep-actions">
            <button type="button" className="btn" onClick={save}>
              ثبت
            </button>
          </div>
        </>
      )}

      {error && <p className="error small">{error}</p>}
      {canRemove && (
        <button type="button" className="ep-remove" onClick={onRemove}>
          حذف کامل این مورد
        </button>
      )}
    </div>
  );
}
