import assert from "node:assert/strict";
import { dateBlockParts, MONTH_ABBR_FR, monthAbbrFr } from "./dateBlock";

assert.equal(MONTH_ABBR_FR.length, 12);
assert.deepEqual(
  Array.from({ length: 12 }, (_, month) => monthAbbrFr(month)).join(" "),
  "janv. févr. mars avr. mai juin juil. août sept. oct. nov. déc.",
);
assert.equal(monthAbbrFr(new Date(2026, 10, 15)), "nov.");
assert.equal(monthAbbrFr(new Date(2026, 4, 1)), "mai");
// Out-of-range indexes wrap instead of returning undefined.
assert.equal(monthAbbrFr(12), "janv.");
assert.equal(monthAbbrFr(-1), "déc.");

assert.deepEqual(dateBlockParts(new Date(2026, 9, 7)), {
  day: "7",
  month: "oct.",
});
// Local midnight stays on its day (never shifted by UTC).
assert.deepEqual(dateBlockParts(new Date(2026, 0, 1, 0, 0, 0)), {
  day: "1",
  month: "janv.",
});

console.log("utils/dateBlock.test.ts: ok");
