// The booking side of a site manager: an overview, a week calendar, the clients (people who booked)
// and reports, for every template with a booking form — a photo studio (sessions for a package), a
// salon (appointments for a service) and a restaurant (tables for a number of guests). The studio also
// gets a plain editor for its price packages. Everything is read from the bookings saved by the site's
// forms (see SiteInbox); before the site has any, the sample inbox (sampleData.ts) shows what each tab does.

import { useEffect, useMemo, useState } from "react";
import { addDay, defaultSchedule, slotsOf, todayTehran, type Product, type Schedule, type Shop } from "@rb/schema";
import type { SiteMessage, SiteMessageStatus } from "../../api";
import { useShopApi } from "./shopApi";
import { newId } from "../editor/list";
import { Field, ImagePicker, MoneyInput, showNumber } from "./fields";
import { errorText } from "./ShopOrders";

const STATUS: Record<SiteMessageStatus, string> = { NEW: "جدید", SEEN: "در حال بررسی", CONFIRMED: "تأییدشده", DONE: "انجام‌شده", CANCELED: "لغوشده" };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const faDay = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("fa-IR", o);
const toman = (n: number) => `${showNumber(Math.round(n))} تومان`;
const live = (shop: Shop) => shop.products.filter((p) => !p.trashed);

/** What is booked: a photo session (studio), an appointment (salon) or a table (restaurant). */
export type BookingKind = "studio" | "salon" | "table" | "clinic" | "room";
const WORDS: Record<BookingKind, { one: string; many: string; who: string; what: string }> = {
  studio: { one: "نوبت", many: "نوبت‌ها", who: "مشتری", what: "پکیج" },
  salon: { one: "نوبت", many: "نوبت‌ها", who: "مشتری", what: "خدمت" },
  table: { one: "رزرو", many: "رزروها", who: "مهمان", what: "تعداد نفرات" },
  clinic: { one: "نوبت", many: "نوبت‌ها", who: "مراجع", what: "نوع جلسه" },
  room: { one: "رزرو", many: "رزروها", who: "مشتری", what: "اتاق" },
};
/** What a booking is for, as shown in lists: the package or service, or the number of guests. */
const subject = (b: SiteMessage, kind: BookingKind) =>
  kind === "table" ? (b.guests ? `${showNumber(b.guests)} نفر` : "میز") : kind === "room" && b.guests ? `${b.service || "—"} (${showNumber(b.guests)} نفر)` : b.service || "—";

/** The studio's bookings (or the sample ones), shared by the tabs below. */
export function useBookings(resumeId: string | undefined, _shop: Shop, _kind: BookingKind) {
  const source = useShopApi();
  const [rows, setRows] = useState<SiteMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!resumeId) return setRows([]);
    source.siteMessages(resumeId).then(
      (r) => setRows(r.messages.filter((m) => m.kind === "BOOKING")),
      (e) => setError(errorText(e, "دریافت رزروها ممکن نشد")),
    );
  }, [resumeId, source]);
  return { bookings: rows, error };
}

/** The price of what was booked: the package's price, or the lowest price of the service's items; tables have none. */
const priceOf = (shop: Shop, service: string | null) => {
  if (!service) return 0;
  const p = live(shop).find((x) => x.name === service);
  if (p) return p.salePrice ?? p.price;
  const cat = shop.categories.find((c) => c.name === service);
  const prices = cat ? live(shop).filter((x) => x.categoryId === cat.id && !x.hidden).map((x) => x.salePrice ?? x.price).filter((n) => n > 0) : [];
  return prices.length ? Math.min(...prices) : 0;
};

/* ───────────── 1. Overview ───────────── */

export function StudioDashboard({ resumeId, shop, onTab, kind = "studio" }: { resumeId?: string; shop: Shop; onTab: (tab: string) => void; kind?: BookingKind }) {
  const { bookings, error } = useBookings(resumeId, shop, kind);
  const w = WORDS[kind];
  if (error) return <p className="error">{error}</p>;
  if (!bookings) return <p className="muted shm-hint">در حال بارگذاری…</p>;
  const today = iso(new Date());
  const weekEnd = iso(addDays(new Date(), 7));
  const active = bookings.filter((b) => b.status !== "CANCELED");
  const fresh = bookings.filter((b) => b.status === "NEW");
  const todays = active.filter((b) => b.date === today).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const week = active.filter((b) => (b.date ?? "") >= today && (b.date ?? "") < weekEnd);
  const monthStart = today.slice(0, 8) + "01";
  const doneMonth = bookings.filter((b) => b.status === "DONE" && (b.date ?? "") >= monthStart && (b.date ?? "") <= today);
  const counts = new Map<string, number>();
  active.forEach((b) => b.service && counts.set(b.service, (counts.get(b.service) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const guestsToday = todays.reduce((s, b) => s + (b.guests ?? 0), 0);
  return (
    <div className="shm-studio">
      <div className="shm-stats">
        <button type="button" onClick={() => onTab("inbox")}>
          <small>درخواست‌های جدید</small>
          <b>{showNumber(fresh.length)}</b>
        </button>
        <button type="button" onClick={() => onTab("calendar")}>
          <small>{w.many}ی امروز</small>
          <b>{showNumber(todays.length)}</b>
        </button>
        <button type="button" onClick={() => onTab("calendar")}>
          <small>{w.many}ی ۷ روز آینده</small>
          <b>{showNumber(week.length)}</b>
        </button>
        {kind === "table" ? (
          <div>
            <small>مهمان‌های امروز</small>
            <b>{showNumber(guestsToday)} نفر</b>
          </div>
        ) : (
          <>
            <div>
              <small>درآمد {kind === "studio" ? "جلسه‌های" : "نوبت‌های"} انجام‌شده‌ی این ماه</small>
              <b>{toman(doneMonth.reduce((s, b) => s + priceOf(shop, b.service), 0))}</b>
            </div>
            <div>
              <small>پرطرفدارترین {w.what}</small>
              <b>{top ? `${top[0]} (${showNumber(top[1])})` : "—"}</b>
            </div>
          </>
        )}
      </div>
      <h3>📅 {w.many}ی امروز</h3>
      {todays.length ? (
        <ul className="shm-day-list">
          {todays.map((b) => (
            <li key={b.id}>
              <b dir="ltr">{b.time || "—"}</b>
              <span>
                {b.name} · {subject(b, kind)}
              </span>
              <a href={`tel:${b.phone ?? ""}`} dir="ltr">
                {b.phone}
              </a>
              <i className={`shm-status s-${b.status.toLowerCase()}`}>{STATUS[b.status]}</i>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">امروز {w.one}ی ثبت نشده است.</p>
      )}
      {fresh.length > 0 && (
        <p>
          <button type="button" className="btn small" onClick={() => onTab("inbox")}>
            بررسی {showNumber(fresh.length)} درخواست جدید
          </button>
        </p>
      )}
    </div>
  );
}

/* ───────────── 2. Week calendar ───────────── */

export function StudioCalendar({ resumeId, shop, kind = "studio" }: { resumeId?: string; shop: Shop; kind?: BookingKind }) {
  const { bookings, error } = useBookings(resumeId, shop, kind);
  const w = WORDS[kind];
  // Weeks start on Saturday, as in the Iranian calendar.
  const [offset, setOffset] = useState(0);
  if (error) return <p className="error">{error}</p>;
  if (!bookings) return <p className="muted shm-hint">در حال بارگذاری…</p>;
  const now = new Date();
  const start = addDays(now, -((now.getDay() + 1) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, k) => addDays(start, k));
  const today = iso(now);
  const undated = bookings.filter((b) => !b.date && b.status !== "CANCELED");
  return (
    <div className="shm-studio">
      <div className="shm-row shm-cal-head">
        <button type="button" className="btn ghost small" onClick={() => setOffset((o) => o - 1)}>
          → هفته‌ی قبل
        </button>
        <b>
          {faDay(days[0]!, { day: "numeric", month: "long" })} تا {faDay(days[6]!, { day: "numeric", month: "long", year: "numeric" })}
        </b>
        <button type="button" className="btn ghost small" onClick={() => setOffset((o) => o + 1)}>
          هفته‌ی بعد ←
        </button>
        {offset !== 0 && (
          <button type="button" className="btn ghost small" onClick={() => setOffset(0)}>
            این هفته
          </button>
        )}
      </div>
      <div className="shm-cal">
        {days.map((d) => {
          const key = iso(d);
          const list = bookings.filter((b) => b.date === key).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
          return (
            <section key={key} className={`shm-cal-day${key === today ? " today" : ""}`}>
              <h4>
                {faDay(d, { weekday: "long" })}
                <small>{faDay(d, { day: "numeric", month: "short" })}</small>
              </h4>
              {list.length === 0 && <p className="muted">—</p>}
              {list.map((b) => (
                <article key={b.id} className={`shm-cal-item s-${b.status.toLowerCase()}`} title={b.text ?? undefined}>
                  <b dir="ltr">{b.time || "بدون ساعت"}</b>
                  <span>{b.name}</span>
                  <small>{subject(b, kind)}</small>
                  <small>{STATUS[b.status]}</small>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      <p className="muted shm-hint">رنگ‌ها: زرد جدید، سبز تأییدشده، آبی انجام‌شده، خاکستری لغوشده. وضعیت و ساعت هر {w.one} را در «📥 پیام‌ها و نوبت‌ها» عوض کنید.</p>
      {undated.length > 0 && <p className="muted">{showNumber(undated.length)} درخواست بدون تاریخ هم هست؛ در «پیام‌ها و نوبت‌ها» ببینیدشان.</p>}
    </div>
  );
}

/* ───────────── 4. Packages ───────────── */

/** A plain editor for the price packages: name, price, a row per feature, the highlighted one. */
export function StudioPackages({ shop, setShop, rooms }: { shop: Shop; setShop: (s: Partial<Shop>) => void; rooms?: boolean }) {
  // An escape room's rooms: a picture each, and short facts (players, time, difficulty) as the lines.
  const word = rooms ? "اتاق" : "پکیج";
  const list = live(shop);
  const save = (next: Product[]) => setShop({ products: [...next, ...shop.products.filter((p) => p.trashed)] });
  const update = (id: string, patch: Partial<Product>) => save(list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const lines = (p: Product) => (p.description ?? "").split("\n");
  const setLines = (p: Product, next: string[]) => update(p.id, { description: next.join("\n") });
  const move = (k: number, by: number) => {
    const next = [...list];
    const [x] = next.splice(k, 1);
    next.splice(Math.max(0, Math.min(next.length, k + by)), 0, x!);
    save(next);
  };
  return (
    <div className="shm-studio">
      <p className="muted">
        {rooms
          ? "اتاق‌ها در صفحه‌ی اول (شش اتاق اول)، صفحه‌ی «اتاق‌ها» و فرم «رزرو اتاق» دیده می‌شوند. هر اتاق جدا رزرو می‌شود و هر رزرو در «پیام‌ها و نوبت‌ها» می‌آید."
          : "پکیج‌ها در صفحه‌ی «خدمات ما» با دکمه‌ی «سفارش این پکیج» دیده می‌شوند؛ سه پکیج اول نمایش داده می‌شود. هر سفارش یک رزرو در «پیام‌ها و نوبت‌ها» است."}
      </p>
      {list.map((p, k) => (
        <article key={p.id} className="shm-pack">
          <div className="shm-pack-top">
            <Field label={`نام ${word}`}>
              <input value={p.name} maxLength={120} onChange={(e) => update(p.id, { name: e.target.value })} />
            </Field>
            <Field label={rooms ? "قیمت هر سانس" : "قیمت"}>
              <MoneyInput value={p.price} onChange={(n) => update(p.id, { price: n ?? 0 })} />
            </Field>
            {rooms && <ImagePicker value={p.images[0]} onChange={(url) => update(p.id, { images: url ? [url] : [] })} label="عکس اتاق" />}
            <label className="shm-sell">
              <input type="checkbox" checked={!p.hidden} onChange={(e) => update(p.id, { hidden: e.target.checked ? undefined : true })} />
              نمایش در سایت
            </label>
          </div>
          <div className="shm-pack-lines">
            <span className="muted">{rooms ? "مشخصات (هر کدام یک ردیف، مثلاً «۲ تا ۶ نفر»):" : "ویژگی‌ها (هر کدام یک ردیف):"}</span>
            {lines(p).map((x, i) => (
              <div key={i} className="shm-row">
                <input value={x} maxLength={80} placeholder={rooms ? "مثلاً ۶۰ دقیقه" : "مثلاً ۲ بار تعویض لباس"} onChange={(e) => setLines(p, lines(p).map((y, j) => (j === i ? e.target.value : y)))} />
                <button type="button" className="btn ghost small" aria-label="حذف ردیف" onClick={() => setLines(p, lines(p).filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn ghost small" onClick={() => setLines(p, [...lines(p).filter((x) => x.trim()), ""])}>
              + ویژگی
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
              onClick={() => window.confirm(`${word} «${p.name}» به سطل زباله برود؟`) && setShop({ products: shop.products.map((x) => (x.id === p.id ? { ...x, trashed: true } : x)) })}
            >
              حذف
            </button>
          </div>
        </article>
      ))}
      <button
        type="button"
        className="btn small"
        onClick={() => save([...list, rooms ? { id: newId(), name: "اتاق جدید", price: 0, images: [], description: "۲ تا ۶ نفر\n۶۰ دقیقه\nسختی: متوسط" } : { id: newId(), name: "پکیج جدید", price: 0, images: [], description: "حداکثر یک نفر\n۲ ساعت عکاسی\n۲۰ عکس روتوش‌شده" }])}
      >
        + {word} جدید
      </button>
    </div>
  );
}

/* ───────────── 5. Clients ───────────── */

export function StudioClients({ resumeId, shop, kind = "studio" }: { resumeId?: string; shop: Shop; kind?: BookingKind }) {
  const { bookings, error } = useBookings(resumeId, shop, kind);
  const w = WORDS[kind];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <p className="error">{error}</p>;
  if (!bookings) return <p className="muted shm-hint">در حال بارگذاری…</p>;
  // One client per phone number (or name, when there is no phone).
  const groups = new Map<string, SiteMessage[]>();
  bookings.forEach((b) => {
    const key = (b.phone ?? "").replace(/\D/g, "") || b.name || b.id;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  });
  const clients = [...groups.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
      return {
        key,
        name: sorted[0]!.name ?? "بی‌نام",
        phone: sorted[0]!.phone,
        email: sorted.find((b) => b.email)?.email ?? null,
        list: sorted,
        done: list.filter((b) => b.status === "DONE").length,
        spent: list.filter((b) => b.status === "DONE").reduce((s, b) => s + priceOf(shop, b.service), 0),
        last: sorted[0]!.date,
      };
    })
    .filter((c) => !q.trim() || [c.name, c.phone, c.email].some((x) => x?.includes(q.trim())))
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
  return (
    <div className="shm-studio">
      <p className="muted">هر کسی که از سایت {kind === "table" ? "میز رزرو کرده" : "نوبت گرفته"}، با همه‌ی {w.many}یش؛ با شماره‌ی تلفن از هم جدا می‌شوند.</p>
      <div className="shm-toolbar">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در نام، تلفن یا ایمیل…" aria-label="جستجو" />
        <span className="muted">
          {showNumber(clients.length)} {w.who}
        </span>
      </div>
      <ul className="shm-msgs">
        {clients.map((c) => (
          <li key={c.key} className="shm-msg">
            <div className="shm-msg-head">
              <button type="button" className="shm-msg-sum" onClick={() => setOpen(open === c.key ? null : c.key)} aria-expanded={open === c.key}>
                <b>{c.name}</b>
                <span dir="ltr">{c.phone}</span>
                <span>
                  {showNumber(c.list.length)} {w.one} · {showNumber(c.done)} انجام‌شده{c.spent ? ` · ${toman(c.spent)}` : ""}
                </span>
              </button>
              {c.phone && (
                <a className="btn ghost small" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                  تماس
                </a>
              )}
            </div>
            {open === c.key && (
              <div className="shm-msg-body">
                {c.email && (
                  <p>
                    ایمیل: <a href={`mailto:${c.email}`} dir="ltr">{c.email}</a>
                  </p>
                )}
                <ul className="shm-day-list">
                  {c.list.map((b) => (
                    <li key={b.id}>
                      <b>{b.date ? faDay(new Date(`${b.date}T12:00:00`), { day: "numeric", month: "long", year: "numeric" }) : "بدون تاریخ"}</b>
                      <span>
                        {b.time ? `${b.time} · ` : ""}
                        {subject(b, kind)}
                      </span>
                      <i className={`shm-status s-${b.status.toLowerCase()}`}>{STATUS[b.status]}</i>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── 6. Reports ───────────── */

export function StudioReports({ resumeId, shop, kind = "studio" }: { resumeId?: string; shop: Shop; kind?: BookingKind }) {
  const { bookings, error } = useBookings(resumeId, shop, kind);
  const w = WORDS[kind];
  const priced = kind !== "table";
  if (error) return <p className="error">{error}</p>;
  if (!bookings) return <p className="muted shm-hint">در حال بارگذاری…</p>;
  // The last six months, by the booked day (or the day of the request when there is none).
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, k) => new Date(now.getFullYear(), now.getMonth() - 5 + k, 1));
  const monthOf = (b: SiteMessage) => (b.date ?? b.createdAt).slice(0, 7);
  const rows = months.map((m) => {
    const key = iso(m).slice(0, 7);
    const list = bookings.filter((b) => monthOf(b) === key);
    const done = list.filter((b) => b.status === "DONE");
    return { label: faDay(m, { month: "long", year: "numeric" }), all: list.length, done: done.length, canceled: list.filter((b) => b.status === "CANCELED").length, income: done.reduce((s, b) => s + priceOf(shop, b.service), 0) };
  });
  const max = Math.max(1, ...rows.map((r) => r.all));
  // Per package (studio), per service (salon) or per party size (restaurant).
  const groups = kind === "studio" || kind === "room" ? live(shop).map((p) => p.name) : kind === "salon" ? shop.categories.filter((c) => !c.sell).map((c) => c.name) : [...new Set(bookings.map((b) => subject(b, kind)))].sort();
  const byPack = groups.map((name) => {
    const list = bookings.filter((b) => (kind === "table" ? subject(b, kind) : b.service) === name);
    const done = list.filter((b) => b.status === "DONE");
    return { name, all: list.length, done: done.length, income: done.reduce((s, b) => s + priceOf(shop, b.service), 0) };
  });
  const guests = bookings.filter((b) => b.status !== "CANCELED").reduce((s, b) => s + (b.guests ?? 0), 0);
  const total = bookings.length;
  const canceled = bookings.filter((b) => b.status === "CANCELED").length;
  return (
    <div className="shm-studio">
      <div className="shm-stats">
        <div>
          <small>همه‌ی {w.many}</small>
          <b>{showNumber(total)}</b>
        </div>
        <div>
          <small>انجام‌شده</small>
          <b>{showNumber(bookings.filter((b) => b.status === "DONE").length)}</b>
        </div>
        <div>
          <small>نرخ لغو</small>
          <b>{total ? `${showNumber(Math.round((canceled / total) * 100))}٪` : "—"}</b>
        </div>
        {priced ? (
          <div>
            <small>درآمد انجام‌شده‌ها</small>
            <b>{toman(bookings.filter((b) => b.status === "DONE").reduce((s, b) => s + priceOf(shop, b.service), 0))}</b>
          </div>
        ) : (
          <div>
            <small>همه‌ی مهمان‌ها (بدون لغوشده‌ها)</small>
            <b>{showNumber(guests)} نفر</b>
          </div>
        )}
      </div>
      <h3>{w.many} در شش ماه اخیر</h3>
      <div className="shm-bars">
        {rows.map((r) => (
          <div key={r.label} className="shm-bar-row">
            <span>{r.label}</span>
            <i style={{ width: `${(r.all / max) * 100}%` }} />
            <small>
              {showNumber(r.all)} {w.one} · {showNumber(r.done)} انجام‌شده{r.canceled ? ` · ${showNumber(r.canceled)} لغو` : ""}
              {priced ? ` · ${toman(r.income)}` : ""}
            </small>
          </div>
        ))}
      </div>
      <h3>به تفکیک {w.what}</h3>
      <table className="shm-table">
        <thead>
          <tr>
            <th>{w.what}</th>
            <th>{w.one}</th>
            <th>انجام‌شده</th>
            {priced && <th>درآمد</th>}
          </tr>
        </thead>
        <tbody>
          {byPack.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{showNumber(p.all)}</td>
              <td>{showNumber(p.done)}</td>
              {priced && <td>{toman(p.income)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {priced && <p className="muted shm-hint">درآمد از قیمت فعلی {kind === "studio" ? "پکیج‌ها" : "خدمات (کمترین قیمت هر خدمت)"} و {w.many}یی حساب می‌شود که در «پیام‌ها و نوبت‌ها» «انجام‌شده» زده‌اید.</p>}
    </div>
  );
}

/* ───────────── Working hours and capacity ───────────── */

/** The browser's date box shows the Gregorian date; this shows the same day in the Persian calendar. */
const jalaliHint = (d?: string) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }) : undefined);

const WEEKDAYS: [number, string][] = [
  [6, "شنبه"],
  [0, "یکشنبه"],
  [1, "دوشنبه"],
  [2, "سه‌شنبه"],
  [3, "چهارشنبه"],
  [4, "پنجشنبه"],
  [5, "جمعه"],
];

/** The online booking rules: working days and hours, session length, places at a time, days off. */
export function ScheduleEditor({ shop, setShop, seats, rooms }: { shop: Shop; setShop: (s: Partial<Shop>) => void; seats?: boolean; rooms?: boolean }) {
  // A restaurant counts seats: each booking takes as many as its guests. An escape room books each
  // room on its own: the capacity is for one room.
  const fixed = seats ? { seats: true } : rooms ? { byService: true } : {};
  const s = shop.schedule ?? { ...defaultSchedule(), ...(seats ? { capacity: 40, slot: 90 } : rooms ? { capacity: 1, slot: 90 } : {}), ...fixed };
  const save = (patch: Partial<Schedule>) => setShop({ schedule: { ...s, ...patch, ...fixed } });
  const [closedDay, setClosedDay] = useState("");
  const today = todayTehran();
  // A look at the next working day, to show the owner the times visitors will see.
  let sampleDay = today;
  for (let k = 0; k < 14 && slotsOf(s, sampleDay).length === 0; k++) sampleDay = addDay(today, k + 1);
  const sample = slotsOf(s, sampleDay);
  const per = (n: number) => `${showNumber(n)} دقیقه`;
  return (
    <div className="shm-studio">
      <p className="muted">صفحه‌ی نوبت یا رزرو فقط روزها و ساعت‌هایی را نشان می‌دهد که این‌جا تعیین کنید و هنوز پر نشده‌اند؛ سرور هم موقع ثبت دوباره بررسی می‌کند. تغییرها بعد از «انتشار» در سایت اعمال می‌شود.</p>
      <h3>روزهای کاری</h3>
      <div className="shm-row">
        {WEEKDAYS.map(([d, label]) => (
          <label key={d} className="shm-sell">
            <input type="checkbox" checked={s.days.includes(d)} onChange={(e) => save({ days: e.target.checked ? [...s.days, d] : s.days.filter((x) => x !== d) })} />
            {label}
          </label>
        ))}
      </div>
      <div className="shm-sched">
        <Field label="ساعت شروع">
          <input type="time" value={s.start} onChange={(e) => e.target.value && save({ start: e.target.value })} />
        </Field>
        <Field label="ساعت پایان">
          <input type="time" value={s.end} onChange={(e) => e.target.value && save({ end: e.target.value })} />
        </Field>
        <Field label={seats ? "فاصله‌ی نوبت‌های رزرو" : "طول هر جلسه"}>
          <select value={s.slot} onChange={(e) => save({ slot: Number(e.target.value) })}>
            {[15, 20, 30, 45, 60, 75, 90, 120].map((n) => (
              <option key={n} value={n}>
                {per(n)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={seats ? "صندلی در هر نوبت" : rooms ? "گروه هم‌زمان در هر اتاق" : "ظرفیت هر نوبت"}
          hint={seats ? "هر رزرو به تعداد مهمان‌هایش صندلی کم می‌کند" : rooms ? "هر اتاق جدا حساب می‌شود؛ معمولاً ۱ گروه در هر سانس" : "چند نفر هم‌زمان (مثلاً چند آرایشگر یا درمانگر)"}
        >
          <input type="number" min={1} max={500} value={s.capacity} onChange={(e) => save({ capacity: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })} />
        </Field>
        <Field label="نوبت‌دهی تا چند روز آینده">
          <input type="number" min={1} max={180} value={s.ahead} onChange={(e) => save({ ahead: Math.max(1, Math.min(180, Number(e.target.value) || 30)) })} />
        </Field>
        <Field label="استراحت (اختیاری)" hint="مثلاً ناهار؛ این بازه نوبت ندارد">
          <span className="shm-row">
            <input type="time" value={s.breakStart ?? ""} onChange={(e) => save({ breakStart: e.target.value || undefined })} aria-label="شروع استراحت" />
            <input type="time" value={s.breakEnd ?? ""} onChange={(e) => save({ breakEnd: e.target.value || undefined })} aria-label="پایان استراحت" />
          </span>
        </Field>
      </div>
      <h3>روزهای تعطیل و مرخصی</h3>
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
      <h3>پیش‌نمایش</h3>
      <p className="muted">
        {sample.length
          ? `${new Date(`${sampleDay}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })}: ${showNumber(sample.length)} ${rooms ? "سانس برای هر اتاق" : "نوبت"}، هر کدام ${showNumber(s.capacity)} ${seats ? "صندلی" : rooms ? "گروه" : "نفر"} — ${sample.join("، ")}`
          : "با این تنظیم‌ها در دو هفته‌ی آینده نوبتی نمایش داده نمی‌شود؛ روزها و ساعت‌ها را بررسی کنید."}
      </p>
    </div>
  );
}

/* ───────────── Events ───────────── */

type Ev = NonNullable<Shop["events"]>[number];

/** Dated events with a price (workshops, conferences); the site shows the ones not over yet. */
export function EventsEditor({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const list = shop.events ?? [];
  const save = (next: Ev[]) => setShop({ events: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Ev>) => save(list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const today = todayTehran();
  return (
    <div className="shm-studio">
      <p className="muted">رویدادهایی که تاریخشان نگذشته در صفحه‌ی اول نمایش داده می‌شوند (دو رویداد نزدیک‌تر)؛ رویدادهای گذشته خودشان پنهان می‌شوند.</p>
      {[...list]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((e) => (
          <article key={e.id} className={`shm-pack${(e.end || e.start) < today ? " shm-past" : ""}`}>
            <div className="shm-pack-top">
              <Field label="عنوان">
                <input value={e.title} maxLength={160} onChange={(x) => update(e.id, { title: x.target.value })} />
              </Field>
              <Field label="هزینه‌ی شرکت (خالی یعنی رایگان)">
                <MoneyInput value={e.price} onChange={(n) => update(e.id, { price: n })} />
              </Field>
              <label className="shm-sell">
                <input type="checkbox" checked={!e.hidden} onChange={(x) => update(e.id, { hidden: x.target.checked ? undefined : true })} />
                نمایش در سایت
              </label>
            </div>
            <div className="shm-sched">
              <Field label="تاریخ شروع" hint={jalaliHint(e.start)}>
                <input type="date" value={e.start} onChange={(x) => x.target.value && update(e.id, { start: x.target.value })} />
              </Field>
              <Field label="تاریخ پایان (اختیاری)" hint={jalaliHint(e.end)}>
                <input type="date" value={e.end ?? ""} onChange={(x) => update(e.id, { end: x.target.value || undefined })} />
              </Field>
              <Field label="لینک ثبت‌نام (اختیاری)">
                <input value={e.link ?? ""} dir="ltr" placeholder="https://…" onChange={(x) => update(e.id, { link: x.target.value || undefined })} />
              </Field>
            </div>
            <div className="shm-row">
              <ImagePicker value={e.image} onChange={(url) => update(e.id, { image: url })} />
              {(e.end || e.start) < today && <span className="muted">برگزار شده (در سایت نمایش داده نمی‌شود)</span>}
              <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`رویداد «${e.title}» حذف شود؟`) && save(list.filter((x) => x.id !== e.id))}>
                حذف
              </button>
            </div>
          </article>
        ))}
      <button type="button" className="btn small" onClick={() => save([...list, { id: newId(), title: "رویداد جدید", start: addDay(today, 14), image: "" }])}>
        + رویداد جدید
      </button>
    </div>
  );
}
