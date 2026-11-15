// The baking days of a pastry shop: which weekdays it takes custom cakes for, how many cakes a day,
// how far ahead, and days off. The custom-cake form of the site offers only days that are open and
// not yet full; the server checks again when an order comes in. The orders themselves are bookings:
// they show in the inbox and the booking tabs (StudioPanel).

import { useState } from "react";
import { CAKE_FIXED, cakeDefaults, todayTehran, type Schedule, type Shop } from "@rb/schema";
import { Field } from "./fields";
import { WEEKDAYS, jalaliHint } from "./StudioPanel";

export function CakeSchedule({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const s: Schedule = { ...cakeDefaults(), ...shop.schedule, ...CAKE_FIXED };
  const save = (patch: Partial<Schedule>) => setShop({ schedule: { ...s, ...patch, ...CAKE_FIXED } });
  const [closedDay, setClosedDay] = useState("");
  const today = todayTehran();
  return (
    <div className="shm-studio">
      <p className="muted">
        فرم «کیک سفارشی» سایت فقط روزهایی را نشان می‌دهد که این‌جا باز باشند و ظرفیتشان پر نشده باشد (سفارش برای امروز گرفته نمی‌شود). همین روزها در «روز تحویل» صفحه‌ی ثبت سفارش هم
        پیشنهاد می‌شوند. تغییرها بعد از «انتشار» در سایت اعمال می‌شود.
      </p>
      <h3>روزهایی که کیک سفارشی تحویل می‌دهید</h3>
      <div className="shm-row">
        {WEEKDAYS.map(([d, label]) => (
          <label key={d} className="shm-sell">
            <input type="checkbox" checked={s.days.includes(d)} onChange={(e) => save({ days: e.target.checked ? [...s.days, d] : s.days.filter((x) => x !== d) })} />
            {label}
          </label>
        ))}
      </div>
      <div className="shm-sched">
        <Field label="کیک سفارشی در هر روز" hint="وقتی این تعداد برای روزی سفارش گرفتید، آن روز در سایت «ظرفیت پر» می‌شود.">
          <input type="number" min={1} max={500} value={s.capacity} onChange={(e) => save({ capacity: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })} />
        </Field>
        <Field label="سفارش تا چند روز آینده">
          <input type="number" min={1} max={180} value={s.ahead} onChange={(e) => save({ ahead: Math.max(1, Math.min(180, Number(e.target.value) || 30)) })} />
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
