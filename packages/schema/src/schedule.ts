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
  /**
   * Stays (a guesthouse): each service is a room, a booking takes it for some nights from its check-in
   * day, and `start` is the check-in time. A room's own stock is how many of it there are.
   */
  nights: z.boolean().optional(),
  /** A stay's check-out time (its check-in time is `start`). */
  checkOut: hhmm.optional(),
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

/**
 * A bakery's custom cakes: a number of cakes a day on the open weekdays, one booking time a day at
 * midnight (so today is never offered: a cake needs a day), up to a month ahead.
 */
export const cakeDefaults = (): Schedule => ({ ...defaultSchedule(), days: [6, 0, 1, 2, 3, 4], start: "00:00", end: "01:00", slot: 60, capacity: 4, ahead: 30 });
/** The fixed parts of a bakery's schedule, whatever was stored. */
export const CAKE_FIXED = { start: "00:00", end: "01:00", slot: 60, byService: false, nights: false, seats: false, span: false } as const;

/* ───────────── Stays: rooms booked by the night ───────────── */

/** What a booking row needs for counting taken places (the API's rows and the preview's sample alike). */
export type BookingRow = { date?: string | null; time?: string | null; guests?: number | null; service?: string | null; nights?: number | null; status?: string | null };

/** A guesthouse's booking rules: every night open, each room on its own, check-in at 14:00 and out at 12:00. */
export const stayDefaults = (): Schedule => ({ ...defaultSchedule(), days: [0, 1, 2, 3, 4, 5, 6], start: "14:00", end: "15:00", slot: 60, capacity: 1, ahead: 120, byService: true, nights: true, checkOut: "12:00" });

/** Nights of a stay, kept between 1 and 30. */
export const stayNights = (n?: number | null) => Math.min(30, Math.max(1, Math.floor(n ?? 1)));
/** The nights a stay takes, as their days ("yyyy-mm-dd", one per night from the check-in day). */
export const stayDays = (checkIn: string, nights: number) => Array.from({ length: stayNights(nights) }, (_, k) => addDay(checkIn, k));
/** Whole days from one "yyyy-mm-dd" to another. */
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
/** Nights of Wednesday and Thursday: the Iranian weekend, often priced higher. */
export const isWeekendNight = (day: string) => [3, 4].includes(weekdayOf(day));

/** A night can be booked: inside the booking window, on an open weekday and not a day off. */
export function nightOpen(s: Schedule, day: string, now = new Date()): boolean {
  const today = todayTehran(now);
  return day >= today && day <= addDay(today, s.ahead) && s.days.includes(weekdayOf(day)) && !s.closed.includes(day);
}

/**
 * Rooms of one kind still free for a whole stay: the fewest left over its nights, and 0 when one of
 * them cannot be booked. `taken` is that room's own count (see takenFor), `units` how many it has.
 */
export function stayFree(s: Schedule, taken: Taken, checkIn: string, nights: number, units = 1, now = new Date()): number {
  let free = Math.max(1, units);
  for (const day of stayDays(checkIn, nights)) {
    if (!nightOpen(s, day, now)) return 0;
    free = Math.min(free, Math.max(1, units) - (taken[slotKey(day, s.start)] ?? 0));
  }
  return Math.max(0, free);
}

/**
 * Places taken from today on, by takenKey: each slot of a booking (several in a row on a schedule
 * that spans them), each night of a stay, and guests instead of bookings on a restaurant's seats.
 * The API and the editor's preview both count with this, so they agree.
 */
export function countTaken(s: Schedule | undefined, rows: BookingRow[], now = new Date()): Taken {
  const sch = s ?? defaultSchedule();
  const today = todayTehran(now);
  const out: Taken = {};
  const put = (day: string, time: string, service: string | null | undefined, n: number) => {
    if (day < today) return;
    const key = takenKey(sch.nights ? { byService: true } : sch, day, time, service); // every room of a stay counts on its own
    out[key] = (out[key] ?? 0) + n;
  };
  for (const r of rows) {
    if (!r.date || !r.time || r.status === "CANCELED") continue;
    if (sch.nights) for (const day of stayDays(r.date, stayNights(r.nights))) put(day, sch.start, r.service, 1);
    else {
      const times = sch.span ? spanTimes(sch, r.time, spanOf(sch, r.guests)) : [r.time];
      for (const t of times) put(r.date, t, r.service, sch.seats ? Math.max(1, r.guests ?? 1) : 1);
    }
  }
  return out;
}
