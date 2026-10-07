import assert from "node:assert/strict";
import { caCountLabel, meetingDateLabel, sortByMeetingDate } from "./list";

// --- Most recent meeting first ---
assert.deepEqual(
  sortByMeetingDate([
    { id: "a", date_from: "2024-01-15" },
    { id: "c", date_from: "2025-05-25" },
    { id: "b", date_from: "2024-11-02" },
  ]).map((ca) => ca.id),
  ["c", "b", "a"],
);

// --- The meeting day, in French, never shifted by the time zone ---
assert.equal(meetingDateLabel("2025-05-25"), "25 mai 2025");
assert.equal(meetingDateLabel("2026-01-01"), "1 janvier 2026");
assert.equal(meetingDateLabel("pas une date"), "pas une date");

assert.equal(caCountLabel(1), "1 compte rendu");
assert.equal(caCountLabel(3), "3 comptes rendus");

console.log("ca/list: ok");
