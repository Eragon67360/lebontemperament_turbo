import assert from "node:assert/strict";
import { frenchClock, roundedWindow } from "./parisClock";

// Paris wall-clock in winter (CET, UTC+1) and summer (CEST, UTC+2), whatever
// TZ this runs under: the first two are the vectors of
// supabase/functions/_shared/delivery-messages_test.ts.
assert.equal(frenchClock(new Date("2026-11-14T08:15:00Z")), "9 h 15");
assert.equal(frenchClock(new Date("2026-07-14T12:00:00Z")), "14 h");
assert.equal(frenchClock(new Date("2026-11-14T08:05:00Z")), "9 h 05");
assert.equal(frenchClock(new Date("2026-10-27T08:29:00Z")), "9 h 29");

// Midnight in Paris is 23:00 UTC in winter and 22:00 UTC in summer.
assert.equal(frenchClock(new Date("2026-10-26T23:00:00Z")), "0 h");
assert.equal(frenchClock(new Date("2026-07-13T22:00:00Z")), "0 h");

// The night of 25 October 2026, when Paris went back to UTC+1: the wall
// clock reads 2 h 30 twice, and 3 h only once the hour has been given back.
assert.equal(frenchClock(new Date("2026-10-24T22:30:00Z")), "0 h 30");
assert.equal(frenchClock(new Date("2026-10-25T00:30:00Z")), "2 h 30");
assert.equal(frenchClock(new Date("2026-10-25T01:30:00Z")), "2 h 30");
assert.equal(frenchClock(new Date("2026-10-25T02:00:00Z")), "3 h");

// The window: the nearest quarter hour, then ±15 min.
const window = (iso: string) => {
  const { start, end } = roundedWindow(new Date(iso));
  return [start.toISOString(), end.toISOString()];
};
assert.deepEqual(window("2026-11-14T08:29:00Z"), [
  "2026-11-14T08:15:00.000Z",
  "2026-11-14T08:45:00.000Z",
]);
// Halfway rounds up, as in the SMS.
assert.deepEqual(window("2026-11-14T08:37:30Z"), [
  "2026-11-14T08:30:00.000Z",
  "2026-11-14T09:00:00.000Z",
]);
// An exact quarter stays centred.
assert.deepEqual(window("2026-11-14T09:00:00Z"), [
  "2026-11-14T08:45:00.000Z",
  "2026-11-14T09:15:00.000Z",
]);

// Read together, a 09:29 slot is « 9 h 15 – 9 h 45 », as the push says.
{
  const { start, end } = roundedWindow(new Date("2026-11-14T08:29:00Z"));
  assert.equal(
    `${frenchClock(start)} – ${frenchClock(end)}`,
    "9 h 15 – 9 h 45",
  );
}

console.log("parisClock: all tests passed");
