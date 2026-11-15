import { test } from "node:test";
import assert from "node:assert/strict";
import { addDay, freeAt, openDays, slotsOf, freeFor, slotKey, spanTimes, takenFor, takenKey, todayTehran, type Schedule } from "@rb/schema";

const s: Schedule = { days: [6, 0, 1, 2, 3], start: "09:00", end: "13:00", slot: 60, capacity: 2, ahead: 10, closed: [], breakStart: "11:00", breakEnd: "12:00" };
// A Saturday comfortably in the future (Tehran calendar), so "today" never trims its times.
const sat = (() => {
  let d = addDay(todayTehran(), 2);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 6) d = addDay(d, 1);
  return d;
})();

test("working day: times from start to end, without the break", () => {
  assert.deepEqual(slotsOf(s, sat), ["09:00", "10:00", "12:00"]);
});
test("no times on a day off, a closed day, or past the booking window", () => {
  assert.deepEqual(slotsOf(s, addDay(sat, 6)), []); // Friday
  assert.deepEqual(slotsOf({ ...s, closed: [sat] }, sat), []);
  assert.deepEqual(slotsOf({ ...s, ahead: 1 }, addDay(todayTehran(), 5)), []);
});
test("a time is full once its capacity is taken", () => {
  assert.equal(freeAt(s, {}, sat, "09:00"), 2);
  assert.equal(freeAt(s, { [slotKey(sat, "09:00")]: 2 }, sat, "09:00"), 0);
  assert.equal(freeAt(s, {}, sat, "11:00"), 0); // the break
});
test("a day whose every time is taken is not offered", () => {
  const full = Object.fromEntries(["09:00", "10:00", "12:00"].map((t) => [slotKey(sat, t), 2]));
  assert.ok(openDays(s, {}).includes(sat));
  assert.ok(!openDays(s, full).includes(sat));
});

test("seats: a party needs as many free seats as its guests", () => {
  const r: Schedule = { ...s, capacity: 40, seats: true };
  const taken = { [slotKey(sat, "09:00")]: 36 };
  assert.equal(freeAt(r, taken, sat, "09:00"), 4);
  assert.ok(openDays(r, taken, new Date(), 4).includes(sat));
  const allButFour = Object.fromEntries(["09:00", "10:00", "12:00"].map((t) => [slotKey(sat, t), 37]));
  assert.ok(!openDays(r, allButFour, new Date(), 4).includes(sat));
});

test("byService: each room has its own capacity", () => {
  const r: Schedule = { ...s, capacity: 1, byService: true };
  const taken = { [takenKey(r, sat, "09:00", "زندان")]: 1 };
  assert.equal(freeAt(r, takenFor(r, taken, "زندان"), sat, "09:00"), 0);
  assert.equal(freeAt(r, takenFor(r, taken, "شرلوک"), sat, "09:00"), 1);
  // Without a capacity per service every booking counts against the same time.
  assert.equal(takenKey(s, sat, "09:00", "زندان"), slotKey(sat, "09:00"));
});

test("span: a booking of hours takes each slot it runs through", () => {
  const r: Schedule = { ...s, capacity: 1, span: true, slot: 60, start: "09:00", end: "13:00", breakStart: undefined, breakEnd: undefined };
  assert.deepEqual(spanTimes(r, "10:00", 2), ["10:00", "11:00"]);
  const taken = { [slotKey(sat, "11:00")]: 1 };
  assert.equal(freeFor(r, taken, sat, "09:00", 2), 1); // 09:00 and 10:00 are free
  assert.equal(freeFor(r, taken, sat, "10:00", 2), 0); // 11:00 is taken
  assert.equal(freeFor(r, {}, sat, "12:00", 2), 0); // runs past the end of the day
});

/* ───── Stays: rooms booked by the night ───── */

test("stay: each night of a booking takes its room, and a stay needs every night free", async () => {
  const { countTaken, stayDefaults, stayFree, takenFor, daysBetween } = await import("@rb/schema");
  const st = stayDefaults();
  const d0 = addDay(todayTehran(), 3);
  // Two rooms of "Loft": one booked for 3 nights from d0, the other for 1 night from d0 + 1.
  const taken = countTaken(st, [
    { date: d0, time: st.start, service: "Loft", nights: 3 },
    { date: addDay(d0, 1), time: st.start, service: "Loft", nights: 1 },
    { date: d0, time: st.start, service: "Loft", nights: 2, status: "CANCELED" },
  ]);
  const loft = takenFor({ byService: true }, taken, "Loft");
  assert.equal(stayFree(st, loft, d0, 1, 2), 1);
  assert.equal(stayFree(st, loft, d0, 2, 2), 0); // the second night has both rooms taken
  assert.equal(stayFree(st, loft, addDay(d0, 3), 2, 2), 2); // after the stays end
  assert.equal(stayFree(st, takenFor({ byService: true }, taken, "Suite"), d0, 5, 1), 1); // another room
  // A stay that began before today still holds its remaining nights.
  const old = countTaken(st, [{ date: addDay(todayTehran(), -1), time: st.start, service: "Loft", nights: 3 }]);
  assert.equal(stayFree(st, takenFor({ byService: true }, old, "Loft"), todayTehran(), 1, 1), 0);
  // Closed nights and nights past the window cannot be booked.
  assert.equal(stayFree({ ...st, closed: [addDay(d0, 1)] }, {}, d0, 3, 1), 0);
  assert.equal(stayFree({ ...st, ahead: 4 }, {}, d0, 3, 1), 0);
  assert.equal(daysBetween(d0, addDay(d0, 4)), 4);
});
