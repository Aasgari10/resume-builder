// Online booking rules shared by the booking templates (which days and times to offer), the API
// (which requests to accept) and the panel (where the owner sets them), so all three agree.
// Days are "yyyy-mm-dd" in Tehran time; times "hh:mm".

import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const scheduleSchema = z.object({
  /** Working weekdays, as JavaScript counts them (0 Sunday … 6 Saturday). */
  days: z.array(z.number().int().min(0).max(6)).max(7).default([6, 0, 1, 2, 3]),
  start: hhmm.default("09:00"),
  end: hhmm.default("17:00"),
  /** Length of one appointment, in minutes. */
  slot: z.number().int().min(10).max(480).default(60),
  /** Appointments that can be booked at the same time. */
  capacity: z.number().int().min(1).max(50).default(1),
  /** How many days ahead can be booked. */
  ahead: z.number().int().min(1).max(180).default(30),
  /** Days off (holidays, leave). */
  closed: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(200).default([]),
  /** A break with no appointments, e.g. lunch. */
  breakStart: hhmm.optional(),
  breakEnd: hhmm.optional(),
});
export type Schedule = z.infer<typeof scheduleSchema>;
export const defaultSchedule = (): Schedule => scheduleSchema.parse({});

/** Today in Tehran, as "yyyy-mm-dd" (bookings follow the clinic's clock, not the server's). */
export function todayTehran(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts; // en-CA formats as yyyy-mm-dd
}
/** The time now in Tehran, as minutes after midnight. */
function nowMinutesTehran(now = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now).split(":").map(Number);
  return h! * 60 + m!;
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** "yyyy-mm-dd" plus n days. */
export function addDay(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const weekdayOf = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();

/** Every start time of a working day (empty on a day off or outside the booking window). */
export function slotsOf(s: Schedule, day: string, now = new Date()): string[] {
  const today = todayTehran(now);
  if (day < today || day > addDay(today, s.ahead) || !s.days.includes(weekdayOf(day)) || s.closed.includes(day)) return [];
  const out: string[] = [];
  const brk = s.breakStart && s.breakEnd ? ([toMin(s.breakStart), toMin(s.breakEnd)] as const) : null;
  const earliest = day === today ? nowMinutesTehran(now) + 30 : -1; // today: from half an hour from now
  for (let m = toMin(s.start); m + s.slot <= toMin(s.end); m += s.slot) {
    if (brk && m < brk[1] && m + s.slot > brk[0]) continue;
    if (m >= earliest) out.push(toTime(m));
  }
  return out;
}

/** Appointments already taken, by "yyyy-mm-dd hh:mm". */
export type Taken = Record<string, number>;
export const slotKey = (day: string, time: string) => `${day} ${time}`;

/** Free places left at a time (0 when full or not offered). */
export function freeAt(s: Schedule, taken: Taken, day: string, time: string, now = new Date()): number {
  if (!slotsOf(s, day, now).includes(time)) return 0;
  return Math.max(0, s.capacity - (taken[slotKey(day, time)] ?? 0));
}

/** The days of the booking window that still have a free time. */
export function openDays(s: Schedule, taken: Taken, now = new Date()): string[] {
  const today = todayTehran(now);
  const out: string[] = [];
  for (let k = 0; k <= s.ahead; k++) {
    const day = addDay(today, k);
    if (slotsOf(s, day, now).some((t) => freeAt(s, taken, day, t, now) > 0)) out.push(day);
  }
  return out;
}
