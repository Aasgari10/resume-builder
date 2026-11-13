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
  /** Appointments that can be booked at the same time (seats, when `seats` is on). */
  capacity: z.number().int().min(1).max(500).default(1),
  /** A restaurant: the capacity is in seats and each booking takes as many as its guests. */
  seats: z.boolean().optional(),
  /** Each service has its own capacity (an escape room: one group per room at a time). */
  byService: z.boolean().optional(),
  /** A booking may run several slots in a row (a studio rented for hours): its "guests" is how many. */
  span: z.boolean().optional(),
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
/**
 * The key a booking takes: its day and time, and on a schedule with a capacity per service, the
 * service too ("<service>|yyyy-mm-dd hh:mm").
 */
export const takenKey = (s: Pick<Schedule, "byService">, day: string, time: string, service?: string | null) =>
  s.byService ? `${service ?? ""}|${slotKey(day, time)}` : slotKey(day, time);
/** The places taken for one service (all of them on a schedule without a capacity per service). */
export function takenFor(s: Pick<Schedule, "byService">, taken: Taken, service?: string | null): Taken {
  if (!s.byService) return taken;
  const prefix = `${service ?? ""}|`;
  const out: Taken = {};
  for (const [k, n] of Object.entries(taken)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = n;
  return out;
}

/** The start times a booking of `n` slots from `time` takes ("10:00", "11:00"… one slot apart). */
export function spanTimes(s: Pick<Schedule, "slot">, time: string, n = 1): string[] {
  return Array.from({ length: Math.max(1, n) }, (_, k) => toTime(toMin(time) + k * s.slot));
}
/** How many slots a booking takes: its guests on a schedule that spans slots, else one. */
export const spanOf = (s: Pick<Schedule, "span">, guests?: number | null) => (s.span ? Math.min(8, Math.max(1, guests ?? 1)) : 1);
/**
 * Free places for a booking of `n` slots in a row from `time`: the fewest left among those slots, and
 * 0 when one of them is not offered (past the end of the day, in the break, already gone).
 */
export function freeFor(s: Schedule, taken: Taken, day: string, time: string, n = 1, now = new Date()): number {
  const offered = slotsOf(s, day, now);
  let free = Infinity;
  for (const t of spanTimes(s, time, n)) {
    if (!offered.includes(t)) return 0;
    free = Math.min(free, s.capacity - (taken[slotKey(day, t)] ?? 0));
  }
  return Math.max(0, free);
}

/** Free places left at a time (0 when full or not offered). */
export function freeAt(s: Schedule, taken: Taken, day: string, time: string, now = new Date()): number {
  if (!slotsOf(s, day, now).includes(time)) return 0;
  return Math.max(0, s.capacity - (taken[slotKey(day, time)] ?? 0));
}

/** The days of the booking window that still have a time with `need` free places. */
export function openDays(s: Schedule, taken: Taken, now = new Date(), need = 1, length = 1): string[] {
  const today = todayTehran(now);
  const out: string[] = [];
  for (let k = 0; k <= s.ahead; k++) {
    const day = addDay(today, k);
    if (slotsOf(s, day, now).some((t) => freeFor(s, taken, day, t, length, now) >= need)) out.push(day);
  }
  return out;
}
