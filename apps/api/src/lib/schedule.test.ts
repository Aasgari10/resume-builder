import { test } from "node:test";
import assert from "node:assert/strict";
import { addDay, freeAt, openDays, slotsOf, slotKey, todayTehran, type Schedule } from "@rb/schema";

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
