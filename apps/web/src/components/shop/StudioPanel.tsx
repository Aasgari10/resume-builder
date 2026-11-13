// The booking side of a site manager: an overview, a week calendar, the clients (people who booked)
// and reports, for every template with a booking form — a photo studio (sessions for a package), a
// salon (appointments for a service) and a restaurant (tables for a number of guests). The studio also
// gets a plain editor for its price packages. Everything is read from the bookings saved by the site's
// forms (see SiteInbox); before the site has any, sample bookings show what each tab does.

import { useEffect, useMemo, useState } from "react";
import type { Product, Shop } from "@rb/schema";
import { api, type SiteMessage, type SiteMessageStatus } from "../../api";
import { newId } from "../editor/list";
import { Field, MoneyInput, showNumber } from "./fields";
import { errorText } from "./ShopOrders";

const STATUS: Record<SiteMessageStatus, string> = { NEW: "جدید", SEEN: "در حال بررسی", CONFIRMED: "تأییدشده", DONE: "انجام‌شده", CANCELED: "لغوشده" };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const faDay = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("fa-IR", o);
const toman = (n: number) => `${showNumber(Math.round(n))} تومان`;
const live = (shop: Shop) => shop.products.filter((p) => !p.trashed);

/** What is booked: a photo session (studio), an appointment (salon) or a table (restaurant). */
export type BookingKind = "studio" | "salon" | "table";
const WORDS: Record<BookingKind, { one: string; many: string; who: string; what: string }> = {
  studio: { one: "نوبت", many: "نوبت‌ها", who: "مشتری", what: "پکیج" },
  salon: { one: "نوبت", many: "نوبت‌ها", who: "مشتری", what: "خدمت" },
  table: { one: "رزرو", many: "رزروها", who: "مهمان", what: "تعداد نفرات" },
};
/** What a booking is for, as shown in lists: the package or service, or the number of guests. */
const subject = (b: SiteMessage, kind: BookingKind) => (kind === "table" ? (b.guests ? `${showNumber(b.guests)} نفر` : "میز") : b.service || "—");

/** Sample bookings around today, with the studio's own package names (nothing reaches the server). */
function sampleBookings(shop: Shop, kind: BookingKind): SiteMessage[] {
  const names = kind === "salon" ? shop.categories.filter((c) => !c.sell).map((c) => c.name) : live(shop).map((p) => p.name);
  const pick = (k: number) => names[k % Math.max(1, names.length)] ?? "پکیج عکاسی";
  const people = [
    ["مریم احمدی", "09121234567"],
    ["سارا کریمی", "09351234567"],
    ["علی رضایی", "09191234567"],
    ["نگار حسینی", "09121112233"],
    ["رضا موسوی", "09361234567"],
    ["مریم احمدی", "09121234567"],
    ["الهام نوری", "09131234567"],
    ["سارا کریمی", "09351234567"],
  ];
  const plan: [number, string, SiteMessageStatus][] = [
    [0, "10:00", "CONFIRMED"],
    [0, "16:30", "NEW"],
    [1, "11:00", "CONFIRMED"],
    [3, "15:00", "NEW"],
    [-2, "12:00", "DONE"],
    [-9, "10:30", "DONE"],
    [-20, "17:00", "DONE"],
    [-35, "13:00", "CANCELED"],
  ];
  const now = new Date();
  return plan.map(([days, time, status], k) => {
    const day = addDays(now, days);
    return {
      id: `sample-${k}`,
      kind: "BOOKING",
      status,
      code: `B${100200 + k}`,
      name: people[k]![0]!,
      phone: people[k]![1]!,
      email: null,
      subject: null,
      text: k % 3 === 0 ? "عکس پرتره برای پرونده‌ی کاری" : null,
      service: kind === "table" ? null : pick(k),
      date: iso(day),
      time,
      guests: kind === "table" ? 2 + (k % 5) : null,
      page: kind === "table" ? "/reservation" : kind === "salon" ? "/appointment" : "/contact",
      ownerNote: null,
      createdAt: addDays(day, -3).toISOString(),
      deletedAt: null,
    };
  });
}

/** The studio's bookings (or the sample ones), shared by the tabs below. */
export function useBookings(resumeId: string | undefined, shop: Shop, kind: BookingKind) {
  const [rows, setRows] = useState<SiteMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!resumeId) return setRows([]);
    api.siteMessages(resumeId).then(
      (r) => setRows(r.messages.filter((m) => m.kind === "BOOKING")),
      (e) => setError(errorText(e, "دریافت رزروها ممکن نشد")),
    );
  }, [resumeId]);
  const sample = rows !== null && rows.length === 0;
  const bookings = useMemo(() => (rows === null ? null : sample ? sampleBookings(shop, kind) : rows), [rows, sample, shop, kind]);
  return { bookings, sample, error };
}

function SampleNote({ on }: { on: boolean }) {
  return on ? (
    <p className="shm-sample">
      <span>
        🧪 <b>این‌ها نمونه است</b> تا ببینید این بخش چه نشان می‌دهد. با اولین نوبت یا رزرو واقعی سایت منتشرشده، اطلاعات خودتان این‌جا می‌آید.
      </span>
    </p>
  ) : null;
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
  const { bookings, sample, error } = useBookings(resumeId, shop, kind);
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
      <SampleNote on={sample} />
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
  const { bookings, sample, error } = useBookings(resumeId, shop, kind);
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
      <SampleNote on={sample} />
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
export function StudioPackages({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
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
      <p className="muted">پکیج‌ها در صفحه‌ی «خدمات ما» با دکمه‌ی «سفارش این پکیج» دیده می‌شوند؛ سه پکیج اول نمایش داده می‌شود. هر سفارش یک رزرو در «پیام‌ها و نوبت‌ها» است.</p>
      {list.map((p, k) => (
        <article key={p.id} className="shm-pack">
          <div className="shm-pack-top">
            <Field label="نام پکیج">
              <input value={p.name} maxLength={120} onChange={(e) => update(p.id, { name: e.target.value })} />
            </Field>
            <Field label="قیمت">
              <MoneyInput value={p.price} onChange={(n) => update(p.id, { price: n ?? 0 })} />
            </Field>
            <label className="shm-sell">
              <input type="checkbox" checked={!p.hidden} onChange={(e) => update(p.id, { hidden: e.target.checked ? undefined : true })} />
              نمایش در سایت
            </label>
          </div>
          <div className="shm-pack-lines">
            <span className="muted">ویژگی‌ها (هر کدام یک ردیف):</span>
            {lines(p).map((x, i) => (
              <div key={i} className="shm-row">
                <input value={x} maxLength={80} placeholder="مثلاً ۲ بار تعویض لباس" onChange={(e) => setLines(p, lines(p).map((y, j) => (j === i ? e.target.value : y)))} />
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
              onClick={() => window.confirm(`پکیج «${p.name}» به سطل زباله برود؟`) && setShop({ products: shop.products.map((x) => (x.id === p.id ? { ...x, trashed: true } : x)) })}
            >
              حذف
            </button>
          </div>
        </article>
      ))}
      <button type="button" className="btn small" onClick={() => save([...list, { id: newId(), name: "پکیج جدید", price: 0, images: [], description: "حداکثر یک نفر\n۲ ساعت عکاسی\n۲۰ عکس روتوش‌شده" }])}>
        + پکیج جدید
      </button>
    </div>
  );
}

/* ───────────── 5. Clients ───────────── */

export function StudioClients({ resumeId, shop, kind = "studio" }: { resumeId?: string; shop: Shop; kind?: BookingKind }) {
  const { bookings, sample, error } = useBookings(resumeId, shop, kind);
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
      <SampleNote on={sample} />
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
  const { bookings, sample, error } = useBookings(resumeId, shop, kind);
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
  const groups = kind === "studio" ? live(shop).map((p) => p.name) : kind === "salon" ? shop.categories.filter((c) => !c.sell).map((c) => c.name) : [...new Set(bookings.map((b) => subject(b, kind)))].sort();
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
      <SampleNote on={sample} />
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
