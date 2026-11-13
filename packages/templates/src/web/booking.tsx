/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// The online booking picker shared by templates with working hours (a salon, a restaurant): a month
// of the Persian calendar with the days that still have a free time, then the free times of the
// chosen day and the template's own fields. No scripts: days and months are links (?day=, ?m=), the
// times radios. Each template colours it through the --bk-* variables.

import type { ReactNode } from "react";
import { addDay, freeFor, openDays, slotsOf, todayTehran, type Schedule } from "@rb/schema";
import type { Visitor } from "@rb/schema";
import { FormMeta } from "./parts";
import { BookingTable } from "./shopkit";

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
export const faDay = (day: string, o: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", ...o });

/** Persian calendar parts of a "yyyy-mm-dd" day. */
export function jalali(day: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(`${day}T12:00:00Z`));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}
/** A month of the Persian calendar: its first day and its days, as "yyyy-mm-dd". */
export function monthOf(anyDay: string): { first: string; days: string[] } {
  let first = anyDay;
  while (jalali(first).d !== 1) first = addDay(first, -1);
  const days = [first];
  for (let d = addDay(first, 1); jalali(d).d !== 1; d = addDay(d, 1)) days.push(d);
  return { first, days };
}
const faTime = (t: string) => `${fa(Number(t.slice(0, 2))).padStart(2, "۰")}:${fa(Number(t.slice(3))).padStart(2, "۰")}`;
const WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

type Props = {
  /** Href of a page path (adds the site's base). */
  link: (path: string) => string;
  /** The booking page, e.g. "/appointment". */
  path: string;
  schedule: Schedule;
  taken: Record<string, number>;
  query: Record<string, string>;
  /** Places a booking needs (a restaurant's guests); 1 otherwise. */
  need?: number;
  /** Slots in a row a booking takes (a studio rented for hours); 1 otherwise. */
  length?: number;
  /** Query values carried by every day and month link (chosen service, guests…). */
  keep?: Record<string, string | undefined>;
  /** The template's fields of the form (name, phone, service…), shown under the times. */
  children: ReactNode;
  button: string;
  /** Shown before a day is chosen. */
  hint?: ReactNode;
};

export function BookingPicker({ link, path, schedule: s, taken, query, need = 1, length = 1, keep = {}, children, button, hint }: Props) {
  const today = todayTehran();
  const open = new Set(openDays(s, taken, new Date(), need, length));
  const last = addDay(today, s.ahead);
  const months: string[] = [monthOf(today).first];
  while (months.length < 7) {
    const next = addDay(monthOf(months[months.length - 1]!).days.slice(-1)[0]!, 1);
    if (next > last) break;
    months.push(next);
  }
  const m = Math.min(months.length - 1, Math.max(0, Number(query.m) || 0));
  const { first, days } = monthOf(months[m]!);
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 1) % 7; // weeks start on Saturday
  const picked = query.day && open.has(query.day) ? query.day : undefined;
  const times = picked ? slotsOf(s, picked).filter((t) => freeFor(s, taken, picked, t, length) >= need) : [];
  const href = (q: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...keep, ...q })) if (v !== undefined && v !== "" && !(k === "m" && Number(v) === 0)) p.set(k, String(v));
    const qs = p.toString();
    return `${link(path)}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className="bk">
      <div className="bk-cal">
        <div className="bk-cal-head">
          {m > 0 ? (
            <a href={href({ m: m - 1 })} className="bk-arrow" aria-label="ماه قبل">
              ›
            </a>
          ) : (
            <span />
          )}
          <b>{faDay(first, { month: "long", year: "numeric" })}</b>
          {m < months.length - 1 ? (
            <a href={href({ m: m + 1 })} className="bk-arrow" aria-label="ماه بعد">
              ‹
            </a>
          ) : (
            <span />
          )}
        </div>
        <div className="bk-week">
          {WEEK.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="bk-days">
          {Array.from({ length: lead }, (_, k) => (
            <span key={`e${k}`} className="bk-day empty" />
          ))}
          {days.map((d) => {
            const n = fa(jalali(d).d);
            const cls = `bk-day${d === today ? " today" : ""}${d === picked ? " picked" : ""}`;
            return open.has(d) ? (
              <a key={d} href={`${href({ m, day: d })}#bk-times`} className={`${cls} open`} aria-label={faDay(d, { weekday: "long", day: "numeric", month: "long" })}>
                {n}
              </a>
            ) : (
              <span key={d} className={`${cls} off`}>
                {n}
              </span>
            );
          })}
        </div>
        <p className="bk-legend">
          <i className="open" /> دارای زمان خالی <i className="off" /> تعطیل یا پر
        </p>
      </div>
      <div className="bk-side" id="bk-times">
        {!picked ? (
          <div className="bk-hint">
            {hint}
            <b>یک روز را انتخاب کنید</b>
            <p>روزهایی که زمان خالی دارند در تقویم پررنگ‌اند؛ بعد از انتخاب، ساعت‌های خالی همان روز این‌جا نمایش داده می‌شود.</p>
            {open.size === 0 && <p className="bk-warn">در حال حاضر زمان خالی نداریم؛ لطفاً تماس بگیرید.</p>}
          </div>
        ) : (
          <form method="post" action={link("/_form")} className="bk-form">
            <FormMeta kind="booking" back={path} />
            <input type="hidden" name="date" value={picked} />
            <b className="bk-day-title">{faDay(picked, { weekday: "long", day: "numeric", month: "long" })}</b>
            <fieldset className="bk-times">
              <legend>ساعت</legend>
              {times.map((t, k) => (
                <label key={t}>
                  <input type="radio" name="time" value={t} required defaultChecked={k === 0} />
                  <span dir="ltr">{faTime(t)}</span>
                </label>
              ))}
            </fieldset>
            {children}
            <button type="submit" className="bk-btn">
              {button}
            </button>
            <small className="bk-note">پس از ثبت، کد پیگیری نمایش داده می‌شود و برای تأیید با شما تماس می‌گیریم.</small>
          </form>
        )}
      </div>
    </div>
  );
}

/** Find a booking by its code and phone; see its state and cancel it. Answered by the server (visitor.tracked). */
export function TrackBooking({ link, visitor }: { link: (path: string) => string; visitor: Visitor }) {
  const q = visitor.query;
  const looked = Boolean(q.code);
  return (
    <div className="bk bk-track">
      {q.msg && <p className="sk-ok">{q.msg}</p>}
      {q.error && <p className="sk-err">{q.error}</p>}
      <form method="get" action={link("/track")} className="bk-form bk-track-form">
        <label className="half">
          کد پیگیری
          <input name="code" required dir="ltr" defaultValue={q.code} placeholder="B123456" />
        </label>
        <label className="half">
          شماره‌ی موبایلی که با آن نوبت گرفتید
          <input name="phone" required inputMode="tel" dir="ltr" defaultValue={q.phone} />
        </label>
        <button type="submit" className="bk-btn">
          پیگیری
        </button>
      </form>
      {looked && (visitor.tracked ? <BookingTable list={[visitor.tracked]} link={link} back="/track" phone={q.phone} /> : <p className="sk-err">نوبتی با این کد و شماره پیدا نشد.</p>)}
    </div>
  );
}

export const bookingCss = /* css */ `
.bk.bk-track { grid-template-columns: minmax(0, 1fr); gap: 22px; max-width: 900px; margin-inline: auto; }
.bk-track .bk-form { padding: clamp(18px, 3cqi, 28px); background: var(--bk-soft); }
.bk-track .bk-btn { grid-column: 1 / -1; }
@container (max-width: 560px) { .bk-track .bk-form > label.half { grid-column: 1 / -1; } }
.bk { --bk-accent: #333; --bk-ink: #222; --bk-soft: #F6F2EE; --bk-line: #E4DDD6; --bk-dark: #222; --bk-on: #fff; --bk-head: inherit;
  display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: clamp(20px, 3cqi, 50px); align-items: start; color: var(--bk-ink); }
.bk-cal { border: 1px solid var(--bk-line); background: #fff; }
.bk-cal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; background: var(--bk-dark); color: var(--bk-on); }
.bk-cal-head b { font-family: var(--bk-head); font-size: 20px; font-weight: 500; }
.bk-arrow { display: grid; place-items: center; width: 34px; height: 34px; font-size: 26px; line-height: 1; }
.bk-cal-head > span { width: 34px; }
.bk-week, .bk-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; }
.bk-week { background: var(--bk-soft); font-size: 12px; }
.bk-week span { padding: 10px 2px; }
.bk-day { display: grid; place-items: center; aspect-ratio: 1 / .8; border-top: 1px solid var(--bk-line); border-inline-start: 1px solid var(--bk-line); font-family: var(--bk-head); font-size: clamp(15px, 1.3cqi, 22px); color: #C9C2BB; }
.bk-day:nth-child(7n + 1) { border-inline-start: 0; }
.bk-day.open { position: relative; color: var(--bk-ink); font-weight: 600; transition: background .2s; }
.bk-day.open::after { content: ""; position: absolute; bottom: 18%; width: 5px; height: 5px; border-radius: 50%; background: var(--bk-accent); }
.bk-day.open:hover { background: var(--bk-soft); }
.bk-day.today { box-shadow: inset 0 0 0 2px var(--bk-accent); }
.bk-day.picked { background: var(--bk-dark) !important; color: var(--bk-on); }
.bk-day.picked::after { background: var(--bk-on); }
.bk-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin: 0; padding: 12px 18px; border-top: 1px solid var(--bk-line); font-size: 12px; opacity: .8; }
.bk-legend i { display: inline-block; width: 12px; height: 12px; border: 1px solid var(--bk-line); }
.bk-legend i.open { border-color: var(--bk-ink); }
.bk-legend i.off { background: #EEE; }
.bk-side { padding: clamp(20px, 2.2cqi, 36px); background: var(--bk-soft); }
.bk-hint { display: grid; gap: 12px; text-align: center; }
.bk-hint b, .bk-day-title { font-family: var(--bk-head); font-size: 22px; font-weight: 500; }
.bk-hint p { margin: 0; opacity: .8; line-height: 2; }
.bk-warn { color: #B4442F; opacity: 1 !important; }
.bk-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.bk-form > * { grid-column: 1 / -1; }
.bk-form > label.half { grid-column: auto; }
.bk-form label { display: grid; gap: 6px; font-size: 13px; opacity: .9; }
.bk-form input:not([type="radio"]), .bk-form select, .bk-form textarea { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid var(--bk-line); background: #fff; color: var(--bk-ink); font: inherit; }
.bk-form input:focus, .bk-form select:focus, .bk-form textarea:focus { outline: none; border-color: var(--bk-accent); }
.bk-times { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; border: 0; }
.bk-times legend { margin-bottom: 8px; font-size: 13px; opacity: .8; }
.bk-times label { position: relative; }
.bk-times input { position: absolute; opacity: 0; }
.bk-times span { display: inline-block; padding: 9px 16px; border: 1px solid var(--bk-line); border-radius: 99px; background: #fff; cursor: pointer; }
.bk-times input:checked + span { background: var(--bk-dark); border-color: var(--bk-dark); color: var(--bk-on); }
.bk-times input:focus-visible + span { outline: 2px solid var(--bk-accent); }
.bk-btn { justify-self: start; height: 50px; padding: 0 30px; border: 1px solid var(--bk-accent); background: var(--bk-accent); color: #fff; font: inherit; font-weight: 700; cursor: pointer; transition: filter .3s; }
.bk-btn:hover { filter: brightness(.92); }
.bk-note { opacity: .75; font-size: 12px; line-height: 1.9; }
@container (max-width: 900px) {
  .bk { grid-template-columns: 1fr; }
  .bk-week span { font-size: 10px; padding: 8px 0; }
  .bk-day { aspect-ratio: 1; }
  .bk-form { grid-template-columns: 1fr; }
  .bk-form > label.half { grid-column: 1 / -1; }
}
`;
