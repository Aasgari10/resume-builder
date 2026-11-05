// Main color chooser: the suggested swatches plus a "custom color" button that opens the full
// palette and accepts a brand hex code. Text colors adapt automatically (themeToCssVars), so any
// choice stays readable; the hints only explain what will happen.

import { useEffect, useState } from "react";
import { PRIMARY_SWATCHES, contrast } from "@rb/schema";

const HEX = /^#[0-9A-F]{6}$/;

/** Saturation and lightness (0–1) of a hex color. */
function hsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

export function ColorPicker({ value, onChange, forPrint = false }: { value: string; onChange: (hex: string) => void; forPrint?: boolean }) {
  const current = value.toUpperCase();
  const isSwatch = PRIMARY_SWATCHES.some((c) => c.value === current);
  const [code, setCode] = useState(current);
  useEffect(() => setCode(current), [current]);

  const light = contrast(current, "#FFFFFF") < 2.2;
  const { s, l } = hsl(current);
  const vivid = forPrint && s > 0.85 && l > 0.4 && l < 0.65;

  return (
    <div className="cp">
      <div className="cp-row" role="radiogroup" aria-label="رنگ اصلی">
        {PRIMARY_SWATCHES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={current === c.value}
            title={c.label}
            aria-label={c.label}
            className="cp-dot"
            style={{ background: c.value }}
            onClick={() => onChange(c.value)}
          />
        ))}
        <label className={`cp-dot cp-custom${isSwatch ? "" : " on"}`} title="رنگ دلخواه">
          <span className="sr-only">رنگ دلخواه</span>
          {!isSwatch && <i style={{ background: current }} />}
          <input type="color" value={current.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} />
        </label>
        <input
          className="cp-code"
          dir="ltr"
          value={code}
          maxLength={7}
          aria-label="کد رنگ"
          onChange={(e) => {
            const next = e.target.value.toUpperCase().replace(/^([^#])/, "#$1");
            setCode(next);
            if (HEX.test(next)) onChange(next);
          }}
          onBlur={() => setCode(current)}
        />
      </div>
      {light && <small className="cp-hint">این رنگ کم‌رنگ است؛ برای خوانایی، نوشته‌ها کمی پررنگ‌تر نمایش داده می‌شوند.</small>}
      {vivid && <small className="cp-hint">رنگ‌های خیلی تند در چاپ کمی کدرتر از صفحه دیده می‌شوند.</small>}
    </div>
  );
}
