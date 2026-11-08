// Extra parts of the product form: choices (colour, size, memory…) with a price and stock for each
// combination, the specification table, and the end time of a sale.

import { useState } from "react";
import { allVariantKeys, formatToman, productOptions, type Product } from "@rb/schema";
import { Field, MoneyInput, readNumber, showNumber } from "./fields";

type Option = NonNullable<Product["options"]>[number];
type Variant = NonNullable<Product["variants"]>[number];

const MAX_VALUES = 12;

/** Up to two kinds of choice, and the table of their combinations. */
export function OptionsEditor({ p, onChange }: { p: Product; onChange: (patch: Partial<Product>) => void }) {
  // The older single list of sizes is shown as the first option and saved as options from now on.
  // (Options still without values are kept here so they can be filled in.)
  const options: Option[] = p.options?.length ? p.options : productOptions(p);
  const save = (next: Option[]) => {
    const clean = next.filter((o) => o.name.trim() || o.values.length);
    const draft = { ...p, options: clean.length ? clean : undefined, sizes: undefined, optionLabel: undefined };
    // Keep the price and stock of combinations that still exist.
    const keys = new Set(allVariantKeys(draft));
    const variants = (p.variants ?? []).filter((v) => keys.has(v.key));
    onChange({ options: draft.options, sizes: undefined, optionLabel: undefined, variants: variants.length ? variants : undefined });
  };
  const setOption = (k: number, patch: Partial<Option>) => save(options.map((o, i) => (i === k ? { ...o, ...patch } : o)));

  return (
    <div className="shm-options">
      <h4>انتخاب‌های محصول</h4>
      <p className="muted">مثلاً رنگ و سایز، یا رنگ و حافظه (حداکثر دو نوع). برای هر ترکیب می‌توانید قیمت و موجودی جدا بگذارید.</p>
      {options.map((o, k) => (
        <OptionRow key={k} option={o} onChange={(patch) => setOption(k, patch)} onRemove={() => save(options.filter((_, i) => i !== k))} />
      ))}
      {options.length < 2 && (
        <button type="button" className="btn ghost small" onClick={() => save([...options, { name: options.length ? "سایز" : "رنگ", values: [] }])}>
          + نوع انتخاب {options.length ? "دوم" : ""}
        </button>
      )}
      <VariantTable p={{ ...p, options: options.length ? options : undefined, sizes: undefined }} onChange={(variants) => onChange({ variants })} />
    </div>
  );
}

function OptionRow({ option, onChange, onRemove }: { option: Option; onChange: (patch: Partial<Option>) => void; onRemove: () => void }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#000000");
  const [withColor, setWithColor] = useState(option.values.some((v) => v.color));
  const add = () => {
    const text = label.trim().slice(0, 30);
    if (!text || option.values.some((v) => v.label === text) || option.values.length >= MAX_VALUES) return;
    onChange({ values: [...option.values, withColor ? { label: text, color } : { label: text }] });
    setLabel("");
  };
  return (
    <div className="shm-option">
      <div className="row gap wrap">
        <input className="shm-option-name" value={option.name} maxLength={30} placeholder="نام (مثلاً رنگ)" aria-label="نام این نوع انتخاب" onChange={(e) => onChange({ name: e.target.value })} />
        <label className="shm-inline">
          <input type="checkbox" checked={withColor} onChange={(e) => setWithColor(e.target.checked)} />
          با نمونه‌ی رنگ
        </label>
        <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`«${option.name || "این انتخاب"}» و قیمت‌های ترکیب‌هایش حذف شود؟`) && onRemove()}>
          حذف
        </button>
      </div>
      <div className="shm-chips">
        {option.values.map((v, k) => (
          <span key={v.label} className="shm-chip">
            {v.color && <i style={{ background: v.color }} />}
            {v.label}
            {withColor && (
              <input type="color" value={v.color ?? "#000000"} aria-label={`رنگ ${v.label}`} onChange={(e) => onChange({ values: option.values.map((x, i) => (i === k ? { ...x, color: e.target.value } : x)) })} />
            )}
            <button type="button" aria-label={`حذف ${v.label}`} onClick={() => onChange({ values: option.values.filter((_, i) => i !== k) })}>
              ×
            </button>
          </span>
        ))}
      </div>
      {option.values.length < MAX_VALUES && (
        <div className="row gap">
          <input
            value={label}
            maxLength={30}
            placeholder="مقدار تازه، مثلاً مشکی یا XL"
            aria-label="مقدار تازه"
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          {withColor && <input type="color" value={color} aria-label="رنگ مقدار تازه" onChange={(e) => setColor(e.target.value)} />}
          <button type="button" className="btn small" onClick={add}>
            افزودن
          </button>
        </div>
      )}
    </div>
  );
}

/** Price and stock of each combination; empty cells use the product's own price and stock. */
function VariantTable({ p, onChange }: { p: Product; onChange: (variants: Variant[] | undefined) => void }) {
  const keys = allVariantKeys(p);
  if (keys.length < 1) return null;
  const list = p.variants ?? [];
  const set = (key: string, patch: Partial<Variant>) => {
    const old = list.find((v) => v.key === key) ?? { key };
    const next = { ...old, ...patch };
    const rest = list.filter((v) => v.key !== key);
    const all = next.price === undefined && next.stock === undefined ? rest : [...rest, next];
    onChange(all.length ? all : undefined);
  };
  return (
    <div className="shm-variants">
      <table>
        <thead>
          <tr>
            <th>ترکیب</th>
            <th>قیمت</th>
            <th>موجودی</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const v = list.find((x) => x.key === key);
            return (
              <tr key={key}>
                <td>{key}</td>
                <td>
                  <MoneyInput value={v?.price} placeholder={formatToman(p.price)} onChange={(n) => set(key, { price: n })} />
                </td>
                <td>
                  <input
                    key={`${key}:${v?.stock ?? ""}`}
                    inputMode="numeric"
                    defaultValue={v?.stock === undefined ? "" : String(v.stock)}
                    placeholder={p.stock === undefined ? "نامحدود" : showNumber(p.stock)}
                    aria-label={`موجودی ${key}`}
                    onBlur={(e) => {
                      const n = readNumber(e.target.value);
                      set(key, { stock: n === undefined ? undefined : Math.min(n, 100000) });
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <small className="muted">خانه‌ی خالی: همان قیمت و موجودی کلی محصول · موجودی ۰: آن ترکیب ناموجود است. حراج محصول به همان نسبت روی همه‌ی ترکیب‌ها اعمال می‌شود.</small>
    </div>
  );
}

type Spec = NonNullable<Product["specs"]>[number];

/** The "specifications" table on the product page (brand, weight, size…). */
export function SpecsEditor({ p, onChange }: { p: Product; onChange: (patch: Partial<Product>) => void }) {
  const specs = p.specs ?? [];
  const save = (next: Spec[]) => onChange({ specs: next.length ? next : undefined });
  const set = (k: number, patch: Partial<Spec>) => save(specs.map((s, i) => (i === k ? { ...s, ...patch } : s)));
  return (
    <div className="shm-specs">
      <h4>مشخصات فنی</h4>
      {specs.map((s, k) => (
        <div key={k} className="row gap">
          <input value={s.label} maxLength={40} placeholder="عنوان (مثلاً برند)" aria-label="عنوان مشخصه" onChange={(e) => set(k, { label: e.target.value })} />
          <input value={s.value} maxLength={80} placeholder="مقدار" aria-label="مقدار مشخصه" onChange={(e) => set(k, { value: e.target.value })} />
          <button type="button" className="btn ghost small danger" aria-label="حذف مشخصه" onClick={() => save(specs.filter((_, i) => i !== k))}>
            ×
          </button>
        </div>
      ))}
      {specs.length < 12 && (
        <button type="button" className="btn ghost small" onClick={() => save([...specs, { label: "", value: "" }])}>
          + مشخصه‌ی جدید
        </button>
      )}
    </div>
  );
}

/** Local date-time text for <input type="datetime-local"> from an ISO date, and back. */
const toLocalInput = (iso?: string) => {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "";
  const d = new Date(t - new Date(t).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (text: string) => (text ? new Date(text).toISOString() : undefined);

export function DateTimeInput({ value, onChange }: { value?: string; onChange: (iso: string | undefined) => void }) {
  return (
    <span className="row gap">
      <input type="datetime-local" dir="ltr" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />
      {value && (
        <button type="button" className="btn ghost small" onClick={() => onChange(undefined)}>
          بدون پایان
        </button>
      )}
    </span>
  );
}

/** Sale end time with a countdown on the site. */
export function SaleEndField({ p, onChange }: { p: Product; onChange: (patch: Partial<Product>) => void }) {
  if (p.salePrice === undefined) return null;
  return (
    <Field label="پایان حراج" hint="اگر تعیین شود، روی سایت شمارش معکوس نمایش داده می‌شود و بعد از آن قیمت اصلی برمی‌گردد.">
      <DateTimeInput value={p.saleEndsAt} onChange={(saleEndsAt) => onChange({ saleEndsAt })} />
    </Field>
  );
}
