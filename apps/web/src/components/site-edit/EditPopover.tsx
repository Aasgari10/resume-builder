// Small editor that opens next to a text or picture clicked in the site preview.
// Text: a field prefilled with the user's own value (sample text shows as a hint). Picture: upload or link.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ApiError } from "../../api";
import { uploadPicture } from "./uploadImage";

export type EditTarget = {
  path: string;
  kind: "text" | "multiline" | "image";
  label: string;
  /** Where the clicked element is on screen, to place the popover next to it. */
  rect: { top: number; bottom: number; left: number; right: number };
};

type Props = {
  target: EditTarget;
  value: string;
  placeholder: string;
  canRemove: boolean;
  onSave: (value: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

const WIDTH = 340;

export function EditPopover({ target, value, placeholder, canRemove, onSave, onRemove, onClose }: Props) {
  const [text, setText] = useState(value);
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

  const save = () => onSave(text.trim());

  return (
    <div ref={box} className="ep" role="dialog" aria-label={target.label} style={{ top: pos.top, left: pos.left, width: WIDTH }}>
      <div className="ep-head">
        <strong>{target.label}</strong>
        <button type="button" className="ep-x" onClick={onClose} aria-label="بستن">
          ×
        </button>
      </div>

      {target.kind === "image" ? (
        <>
          {value && <img className="ep-thumb" src={value} alt="" />}
          <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>
            {busy ? "در حال آپلود…" : value ? "عوض کردن تصویر" : "آپلود تصویر"}
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          <label className="field">
            <span>یا لینک تصویر</span>
            <input className="ltr" dir="ltr" value={text} placeholder="https://..." onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="ep-actions">
            {value && (
              <button type="button" className="btn ghost danger" onClick={() => onSave("")}>
                حذف تصویر
              </button>
            )}
            <button type="button" className="btn" onClick={save} disabled={text.trim() === value}>
              ثبت لینک
            </button>
          </div>
        </>
      ) : (
        <>
          {target.kind === "multiline" ? (
            <textarea
              autoFocus
              rows={6}
              value={text}
              placeholder={placeholder}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && save()}
            />
          ) : (
            <input autoFocus value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
          )}
          {!value && <small className="muted">متن کم‌رنگ نمونه است؛ تا چیزی ننویسید، در سایت منتشرشده نمی‌آید.</small>}
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
