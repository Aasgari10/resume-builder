// Profile photo: upload with automatic square crop and resize in the browser, or a link.
// Without a photo, templates show an initials avatar in the theme color.

import { useRef, useState } from "react";
import { Silhouette } from "@rb/templates";
import { ApiError, api } from "../../api";
import { Field } from "./fields";

const SIZE = 512; // output edge in pixels
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Center-crops to a square and re-encodes as JPEG, which also strips metadata such as location. */
async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const edge = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, edge);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, (bitmap.width - edge) / 2, (bitmap.height - edge) / 2, edge, edge, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

type Props = { value: string; onChange: (url: string) => void };

export function AvatarField({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("لطفاً یک فایل تصویری انتخاب کنید.");
    if (file.size > MAX_INPUT_BYTES) return setError("حجم تصویر بیشتر از ۱۵ مگابایت است.");
    setBusy(true);
    try {
      const { url } = await api.uploadAvatar(await toSquareJpeg(file));
      onChange(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "این تصویر قابل خواندن نیست؛ تصویر دیگری امتحان کنید.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="field">
      <span>عکس پروفایل</span>
      <div className="avatar-field">
        {value ? (
          <img className="avatar-preview" src={value} alt="" />
        ) : (
          <div className="avatar-preview" aria-hidden="true">
            <Silhouette />
          </div>
        )}
        <div className="stack">
          <div className="row gap wrap">
            <button type="button" className="btn ghost" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "در حال آپلود…" : value ? "تغییر عکس" : "آپلود عکس"}
            </button>
            {value && (
              <button type="button" className="btn ghost danger" disabled={busy} onClick={() => onChange("")}>
                حذف عکس
              </button>
            )}
          </div>
          <small className="muted">
            {value ? "عکس به‌صورت مربع برش خورده است." : "بدون عکس، یک آواتار شیک به رنگ قالب نمایش داده می‌شود."}{" "}
            <button type="button" className="link-btn" onClick={() => setShowLink((v) => !v)}>
              {showLink ? "بستن" : "یا لینک عکس"}
            </button>
          </small>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
      {showLink && <Field label="لینک عکس" type="url" ltr placeholder="https://..." value={value} onChange={onChange} max={500} />}
      {error && <small className="error">{error}</small>}
    </div>
  );
}
