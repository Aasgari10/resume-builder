// A gym's panel pieces: the timetable settings (which category holds the classes and which the
// membership plans, open weekdays, places per class, how far ahead, days off) and, on a class, its
// weekly sessions. Visitors book one meeting of a class; the bookings show in the inbox and the
// booking tabs (StudioPanel), and the server checks the meeting and its places again.

import { useState } from "react";
import { GYM_FIXED, gymDefaults, todayTehran, type Product, type Schedule, type Shop } from "@rb/schema";
import { Field } from "./fields";
import { WEEKDAYS, jalaliHint } from "./StudioPanel";

export function GymSchedule({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const s: Schedule = { ...gymDefaults(), ...shop.schedule, ...GYM_FIXED };
  const save = (patch: Partial<Schedule>) => setShop({ schedule: { ...s, ...patch, ...GYM_FIXED } });
  const [closedDay, setClosedDay] = useState("");
  const today = todayTehran();
  const cats = shop.categories ?? [];
  return (
    <div className="shm-studio">
      <p className="muted">
        هر کلاس محصولی از دسته‌ی «کلاس‌ها» است با روزها و ساعت‌های ثابت هفتگی (در فرم همان محصول، بخش «جلسه‌های هفتگی»). بازدیدکننده از «رزرو آنلاین» یک جلسه را رزرو می‌کند؛ ظرفیت هر جلسه «موجودی» همان
        کلاس است (خالی: عدد پیش‌فرض پایین). تغییرها بعد از «انتشار» در سایت اعمال می‌شود.
      </p>
      <div className="shm-sched">
        <Field label="دسته‌ی کلاس‌ها" hint="محصولات این دسته کارت کلاس می‌شوند و در برنامه‌ی هفتگی می‌آیند.">
          <select value={shop.showcaseCategoryId ?? ""} onChange={(e) => setShop({ showcaseCategoryId: e.target.value || undefined })}>
            <option value="">— انتخاب کنید —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="دسته‌ی اشتراک‌ها (تعرفه‌ها)" hint="محصولات این دسته جدول تعرفه می‌شوند؛ ویژگی‌ها را در «مشخصات» بنویسید و برای نداشتن، مقدار «ندارد» بگذارید.">
          <select value={shop.plansCategoryId ?? ""} onChange={(e) => setShop({ plansCategoryId: e.target.value || undefined })}>
            <option value="">— انتخاب کنید —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <h3>روزهای باز باشگاه</h3>
      <div className="shm-row">
        {WEEKDAYS.map(([d, label]) => (
          <label key={d} className="shm-sell">
            <input type="checkbox" checked={s.days.includes(d)} onChange={(e) => save({ days: e.target.checked ? [...s.days, d] : s.days.filter((x) => x !== d) })} />
            {label}
          </label>
        ))}
      </div>
      <div className="shm-sched">
        <Field label="ظرفیت پیش‌فرض هر جلسه" hint="برای کلاسی که «موجودی» ندارد.">
          <input type="number" min={1} max={500} value={s.capacity} onChange={(e) => save({ capacity: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })} />
        </Field>
        <Field label="رزرو تا چند روز آینده">
          <input type="number" min={1} max={60} value={s.ahead} onChange={(e) => save({ ahead: Math.max(1, Math.min(60, Number(e.target.value) || 14)) })} />
        </Field>
      </div>
      <h3>روزهای تعطیل</h3>
      <div className="shm-row">
        <input type="date" value={closedDay} min={today} onChange={(e) => setClosedDay(e.target.value)} aria-label="روز تعطیل" />
        {closedDay && <span className="muted">{jalaliHint(closedDay)}</span>}
        <button type="button" className="btn small" disabled={!closedDay || s.closed.includes(closedDay)} onClick={() => (save({ closed: [...s.closed, closedDay].sort() }), setClosedDay(""))}>
          + افزودن روز تعطیل
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
        {!s.closed.some((d) => d >= today) && <span className="muted">روز تعطیلی ثبت نشده است.</span>}
      </div>
    </div>
  );
}

/** Times go by quarter hours (the booking times of the site). */
const quarter = (t: string) => {
  const m = Math.min(23 * 60 + 30, Math.round((Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))) / 15) * 15);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** A class's weekly sessions: a weekday and a start time each. */
export function SessionsEditor({ p, onChange }: { p: Product; onChange: (patch: Partial<Product>) => void }) {
  const list = p.sessions ?? [];
  const set = (next: NonNullable<Product["sessions"]>) => onChange({ sessions: next.length ? next : undefined });
  return (
    <div className="shm-sessions">
      <h4>جلسه‌های هفتگی کلاس</h4>
      <p className="muted">هر ردیف یک جلسه در هفته است؛ در برنامه‌ی هفتگی سایت می‌آید و قابل رزرو است.</p>
      {list.map((x, k) => (
        <div key={k} className="shm-row">
          <select value={x.day} onChange={(e) => set(list.map((y, i) => (i === k ? { ...y, day: Number(e.target.value) } : y)))} aria-label="روز">
            {WEEKDAYS.map(([d, label]) => (
              <option key={d} value={d}>
                {label}
              </option>
            ))}
          </select>
          <input type="time" value={x.time} step={900} onChange={(e) => /^\d\d:\d\d$/.test(e.target.value) && set(list.map((y, i) => (i === k ? { ...y, time: quarter(e.target.value) } : y)))} aria-label="ساعت" />
          <button type="button" className="btn ghost small" onClick={() => set(list.filter((_, i) => i !== k))}>
            حذف
          </button>
        </div>
      ))}
      {list.length < 28 && (
        <button type="button" className="btn small" onClick={() => set([...list, { day: 6, time: "18:00" }])}>
          + افزودن جلسه
        </button>
      )}
    </div>
  );
}

/** Which category holds the services (or classes) and which the price packages. */
export function CategoryRoles({ shop, setShop, first, firstHint, second }: { shop: Shop; setShop: (s: Partial<Shop>) => void; first: string; firstHint: string; second: string }) {
  const cats = shop.categories ?? [];
  const pick = (value: string | undefined, onPick: (v: string | undefined) => void) => (
    <select value={value ?? ""} onChange={(e) => onPick(e.target.value || undefined)}>
      <option value="">— انتخاب کنید —</option>
      {cats.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
  return (
    <div className="shm-sched">
      <Field label={first} hint={firstHint}>
        {pick(shop.showcaseCategoryId, (v) => setShop({ showcaseCategoryId: v }))}
      </Field>
      <Field label={second} hint="ویژگی‌های هر پکیج را در «مشخصات» بنویسید؛ برای نداشتن، مقدار «ندارد» بگذارید.">
        {pick(shop.plansCategoryId, (v) => setShop({ plansCategoryId: v }))}
      </Field>
    </div>
  );
}
