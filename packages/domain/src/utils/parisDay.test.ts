import assert from "node:assert/strict";
import { parisToday } from "./parisDay";

// Summer (UTC+2): 23:30 UTC on 4 Oct is already 5 Oct in Paris.
assert.equal(parisToday(new Date("2026-10-04T23:30:00Z")), "2026-10-05");
assert.equal(parisToday(new Date("2026-10-04T21:59:59Z")), "2026-10-04");
assert.equal(parisToday(new Date("2026-10-04T22:00:00Z")), "2026-10-05");
// Winter (UTC+1): the day changes at 23:00 UTC.
assert.equal(parisToday(new Date("2026-12-31T22:59:59Z")), "2026-12-31");
assert.equal(parisToday(new Date("2026-12-31T23:00:00Z")), "2027-01-01");
// Midday is the same day in both.
assert.equal(parisToday(new Date("2027-03-15T12:00:00Z")), "2027-03-15");

console.log("parisDay.test.ts: ok");
