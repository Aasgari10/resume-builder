// The manager tabs of a guesthouse (a stay template): its rooms with their nightly prices, how many of
// each there are and what they have; the paid extras a guest can add; and the booking rules (open
// days, check-in and check-out times, how far ahead, days off). Bookings themselves are in the inbox
// and the booking tabs shared with the other booking templates (StudioPanel).

import { useState } from "react";
import { stayDefaults, todayTehran, type Product, type Schedule, type Shop } from "@rb/schema";
import { newId } from "../editor/list";
import { Field, ImagePicker, MoneyInput, showNumber } from "./fields";
import { WEEKDAYS, jalaliHint } from "./StudioPanel";

/** Amenities offered as ticks; the site shows each with its own icon (others get a plain one). */
export const STAY_AMENITIES = ["وای‌فای", "صبحانه", "پارکینگ", "کولر", "گرمایش", "تلویزیون", "آشپزخانه", "یخچال", "حمام اختصاصی", "سشوار", "حوله و ملحفه", "بالکن", "میز کار", "مناسب حیوانات"];

const STAY_FIXED = { byService: true, nights: true, slot: 60 } as const;
const live = (shop: Shop) => shop.products.filter((p) => !p.trashed);

/* ───────────── Rooms ───────────── */

export function StayRooms({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const list = live(shop);
  const save = (next: Product[]) => setShop({ products: [...next, ...shop.products.filter((p) => p.trashed)] });
  const update = (id: string, patch: Partial<Product>) => save(list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (k: number, by: number) => {
    const next = [...list];
    const [x] = next.splice(k, 1);
    next.splice(Math.max(0, Math.min(next.length, k + by)), 0, x!);
    save(next);
  };
  const [custom, setCustom] = useState<Record<string, string>>({});
  return (
    <div className="shm-studio">
      <p className="muted">
        هر اتاق در صفحه‌ی «اتاق‌ها» و صفحه‌ی خودش (با تقویم شب‌های خالی و فرم رزرو) دیده می‌شود. «تعداد این اتاق» یعنی چند اتاق دقیقاً مثل هم دارید؛ هر شب همین تعداد رزرو می‌پذیرد. قیمت آخر هفته برای شب‌های چهارشنبه و پنجشنبه است.
      </p>
      {list.map((p, k) => (
        <article key={p.id} className="shm-pack">
          <div className="shm-pack-top">
            <Field label="نام اتاق">
              <input value={p.name} maxLength={120} onChange={(e) => update(p.id, { name: e.target.value })} />
            </Field>
            {shop.categories.length > 0 && (
              <Field label="نوع">
                <select value={p.categoryId ?? ""} onChange={(e) => update(p.id, { categoryId: e.target.value || undefined })}>
                  <option value="">—</option>
                  {shop.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="قیمت هر شب">
              <MoneyInput value={p.price} onChange={(n) => update(p.id, { price: n ?? 0 })} />
            </Field>
            <Field label="قیمت شب آخر هفته" hint="خالی: همان قیمت هر شب">
              <MoneyInput value={p.weekendPrice} onChange={(n) => update(p.id, { weekendPrice: n || undefined })} />
            </Field>
            <Field label="قیمت ویژه (تخفیف)" hint="خالی: بدون تخفیف">
              <MoneyInput value={p.salePrice} onChange={(n) => update(p.id, { salePrice: n || undefined })} />
            </Field>
            {p.salePrice !== undefined && (
              <Field label="پایان تخفیف (اختیاری)">
                <input type="date" value={(p.saleEndsAt ?? "").slice(0, 10)} min={todayTehran()} onChange={(e) => update(p.id, { saleEndsAt: e.target.value ? `${e.target.value}T23:59:00+03:30` : undefined })} />
              </Field>
            )}
            <Field label="تعداد این اتاق">
              <input type="number" min={1} max={200} value={p.stock ?? 1} onChange={(e) => update(p.id, { stock: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })} />
            </Field>
            <Field label="حداکثر مهمان">
              <input type="number" min={1} max={50} value={p.maxGuests ?? 2} onChange={(e) => update(p.id, { maxGuests: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />
            </Field>
            <label className="shm-sell">
              <input type="checkbox" checked={!p.hidden} onChange={(e) => update(p.id, { hidden: e.target.checked ? undefined : true })} />
              نمایش در سایت
            </label>
          </div>
          <Field label="توضیح اتاق" wide>
            <textarea rows={3} maxLength={3000} value={p.description ?? ""} onChange={(e) => update(p.id, { description: e.target.value })} />
          </Field>
          <div className="shm-row">
            {[...p.images, ""].slice(0, 6).map((src, i) => (
              <ImagePicker
                key={i}
                value={src || undefined}
                label={i === 0 ? "عکس اصلی" : src ? `عکس ${showNumber(i + 1)}` : "+ عکس"}
                onChange={(url) => update(p.id, { images: url ? (i < p.images.length ? p.images.map((x, j) => (j === i ? url : x)) : [...p.images, url]) : p.images.filter((_, j) => j !== i) })}
              />
            ))}
          </div>
          <div className="shm-pack-lines">
            <span className="muted">امکانات:</span>
            <div className="shm-row">
              {[...new Set([...STAY_AMENITIES, ...(p.amenities ?? [])])].map((a) => (
                <label key={a} className="shm-sell">
                  <input
                    type="checkbox"
                    checked={(p.amenities ?? []).includes(a)}
                    onChange={(e) => update(p.id, { amenities: e.target.checked ? [...(p.amenities ?? []), a].slice(0, 16) : (p.amenities ?? []).filter((x) => x !== a) })}
                  />
                  {a}
                </label>
              ))}
            </div>
            <div className="shm-row">
              <input value={custom[p.id] ?? ""} maxLength={30} placeholder="امکان دیگر، مثلاً «شومینه»" onChange={(e) => setCustom({ ...custom, [p.id]: e.target.value })} />
              <button
                type="button"
                className="btn ghost small"
                disabled={!custom[p.id]?.trim()}
                onClick={() => (update(p.id, { amenities: [...(p.amenities ?? []), custom[p.id]!.trim()].slice(0, 16) }), setCustom({ ...custom, [p.id]: "" }))}
              >
                + افزودن
              </button>
            </div>
          </div>
          <div className="shm-pack-lines">
            <span className="muted">مشخصات (مثلاً متراژ: ۳۵ متر، تخت: یک دونفره):</span>
            {(p.specs ?? []).map((x, i) => (
              <div key={i} className="shm-row">
                <input value={x.label} maxLength={40} placeholder="عنوان" onChange={(e) => update(p.id, { specs: (p.specs ?? []).map((y, j) => (j === i ? { ...y, label: e.target.value } : y)) })} />
                <input value={x.value} maxLength={80} placeholder="مقدار" onChange={(e) => update(p.id, { specs: (p.specs ?? []).map((y, j) => (j === i ? { ...y, value: e.target.value } : y)) })} />
                <button type="button" className="btn ghost small" aria-label="حذف ردیف" onClick={() => update(p.id, { specs: (p.specs ?? []).filter((_, j) => j !== i) })}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn ghost small" disabled={(p.specs ?? []).length >= 12} onClick={() => update(p.id, { specs: [...(p.specs ?? []), { label: "", value: "" }] })}>
              + مشخصه
            </button>
          </div>
          <div className="shm-row">
            <button type="button" className="btn ghost small" disabled={k === 0} onClick={() => move(k, -1)}>
              ↑ بالاتر
            </button>
            <button type="button" className="btn ghost small" disabled={k === list.length - 1} onClick={() => move(k, 1)}>
              ↓ پایین‌تر
            </button>
            <button
              type="button"
              className="btn ghost small danger"
              onClick={() => window.confirm(`اتاق «${p.name}» به سطل زباله برود؟`) && setShop({ products: shop.products.map((x) => (x.id === p.id ? { ...x, trashed: true } : x)) })}
            >
              حذف
            </button>
          </div>
        </article>
      ))}
      <button type="button" className="btn small" onClick={() => save([...list, { id: newId(), name: "اتاق جدید", price: 0, images: [], stock: 1, maxGuests: 2, amenities: ["وای‌فای", "حوله و ملحفه"] }])}>
        + اتاق جدید
      </button>
      <StayExtras shop={shop} setShop={setShop} />
    </div>
  );
}

/* ───────────── Extras ───────────── */

type Extra = NonNullable<Shop["extras"]>[number];
const PER: [Extra["per"], string][] = [
  ["stay", "برای کل اقامت"],
  ["night", "برای هر شب"],
  ["guest", "برای هر نفر"],
];

/** Paid extras a guest ticks on the room page (breakfast, transfer…); added to the booking's total. */
function StayExtras({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const list = shop.extras ?? [];
  const save = (next: Extra[]) => setShop({ extras: next });
  const update = (id: string, patch: Partial<Extra>) => save(list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <>
      <h3>خدمات اضافه</h3>
      <p className="muted">مهمان موقع رزرو می‌تواند این‌ها را انتخاب کند و قیمتشان به جمع رزرو اضافه می‌شود؛ در پیام رزرو هم نوشته می‌شوند.</p>
      {list.map((x) => (
        <div key={x.id} className="shm-row">
          <input value={x.title} maxLength={60} placeholder="مثلاً صبحانه" onChange={(e) => update(x.id, { title: e.target.value })} aria-label="عنوان" />
          <MoneyInput value={x.price} onChange={(n) => update(x.id, { price: n ?? 0 })} />
          <select value={x.per} onChange={(e) => update(x.id, { per: e.target.value as Extra["per"] })} aria-label="قیمت برای">
            {PER.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <label className="shm-sell">
            <input type="checkbox" checked={!x.hidden} onChange={(e) => update(x.id, { hidden: e.target.checked ? undefined : true })} />
            فعال
          </label>
          <button type="button" className="btn ghost small" aria-label="حذف" onClick={() => save(list.filter((y) => y.id !== x.id))}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn ghost small" disabled={list.length >= 12} onClick={() => save([...list, { id: newId(), title: "", price: 0, per: "stay" }])}>
        + خدمت اضافه
      </button>
    </>
  );
}

/* ───────────── Booking rules ───────────── */

export function StaySchedule({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const s = shop.schedule?.nights ? shop.schedule : stayDefaults();
  const save = (patch: Partial<Schedule>) => {
    const next = { ...s, ...patch, ...STAY_FIXED };
    // The check-in time is the one "slot" of each day (for the booking tabs' calendar).
    const [h, m] = next.start.split(":").map(Number);
    next.end = `${String(Math.min(23, h! + 1)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setShop({ schedule: next });
  };
  const [closedDay, setClosedDay] = useState("");
  const today = todayTehran();
  return (
    <div className="shm-studio">
      <p className="muted">صفحه‌ی هر اتاق فقط شب‌هایی را برای رزرو نشان می‌دهد که این‌جا باز باشند و هنوز پر نشده باشند؛ سرور هم موقع ثبت دوباره بررسی می‌کند. تغییرها بعد از «انتشار» در سایت اعمال می‌شود.</p>
      <h3>شب‌هایی که پذیرش دارید</h3>
      <div className="shm-row">
        {WEEKDAYS.map(([d, label]) => (
          <label key={d} className="shm-sell">
            <input type="checkbox" checked={s.days.includes(d)} onChange={(e) => save({ days: e.target.checked ? [...s.days, d] : s.days.filter((x) => x !== d) })} />
            {label}
          </label>
        ))}
      </div>
      <div className="shm-sched">
        <Field label="ساعت ورود (چک‌این)">
          <input type="time" value={s.start} onChange={(e) => e.target.value && save({ start: e.target.value })} />
        </Field>
        <Field label="ساعت خروج (چک‌اوت)">
          <input type="time" value={s.checkOut ?? "12:00"} onChange={(e) => e.target.value && save({ checkOut: e.target.value })} />
        </Field>
        <Field label="رزرو تا چند روز آینده">
          <input type="number" min={1} max={180} value={s.ahead} onChange={(e) => save({ ahead: Math.max(1, Math.min(180, Number(e.target.value) || 120)) })} />
        </Field>
      </div>
      <h3>روزهای بسته (تعمیرات، تعطیلی)</h3>
      <div className="shm-row">
        <input type="date" value={closedDay} min={today} onChange={(e) => setClosedDay(e.target.value)} aria-label="روز بسته" />
        {closedDay && <span className="muted">{jalaliHint(closedDay)}</span>}
        <button type="button" className="btn small" disabled={!closedDay || s.closed.includes(closedDay)} onClick={() => (save({ closed: [...s.closed, closedDay].sort() }), setClosedDay(""))}>
          + افزودن شب بسته
        </button>
      </div>
      <div className="shm-row">
        {s.closed.filter((d) => d >= today).map((d) => (
          <span key={d} className="shm-chip">
            {jalaliHint(d)}
            <button type="button" aria-label="حذف" onClick={() => save({ closed: s.closed.filter((x) => x !== d) })}>
              ✕
            </button>
          </span>
        ))}
        {!s.closed.some((d) => d >= today) && <span className="muted">شب بسته‌ای ثبت نشده است.</span>}
      </div>
    </div>
  );
}
