import assert from "node:assert/strict";
import {
  assemblyDateLabel,
  assemblyShortDateLabel,
  assemblyTimeLabel,
  assemblyTitle,
  isAssemblyUpcoming,
  isoToParisLocal,
  parisLocalToIso,
} from "./generalAssemblies";

// The 2026 AG: Saturday 14 March 2026, 19:00 in Wangen (UTC+1).
const AG_2026 = "2026-03-14T18:00:00.000Z";
assert.equal(assemblyTitle(AG_2026), "Assemblée générale 2026");
assert.equal(assemblyDateLabel(AG_2026), "Samedi 14 mars 2026 à 19h");
assert.equal(assemblyShortDateLabel(AG_2026), "14 mars 2026");
assert.equal(assemblyTimeLabel("2026-06-20T17:30:00Z"), "19h30");

// Wall clock in Paris, both ways, winter and summer.
assert.equal(isoToParisLocal(AG_2026), "2026-03-14T19:00");
assert.equal(parisLocalToIso("2026-03-14T19:00"), AG_2026);
assert.equal(parisLocalToIso("2026-06-20T19:30"), "2026-06-20T17:30:00.000Z");
assert.equal(isoToParisLocal("2026-06-20T17:30:00Z"), "2026-06-20T19:30");
// The evening after the spring change (29 March 2026) is summer time.
assert.equal(parisLocalToIso("2026-03-29T19:00"), "2026-03-29T17:00:00.000Z");
assert.equal(parisLocalToIso("2026-02-30T19:00"), null);
assert.equal(parisLocalToIso("2026-03-14 19:00"), null);
assert.equal(parisLocalToIso("2026-03-14T25:00"), null);

// Upcoming until the end of its day in Paris.
assert.equal(
  isAssemblyUpcoming(AG_2026, new Date("2026-03-01T12:00:00Z")),
  true,
);
assert.equal(
  isAssemblyUpcoming(AG_2026, new Date("2026-03-14T22:30:00Z")),
  true,
);
assert.equal(
  isAssemblyUpcoming(AG_2026, new Date("2026-03-14T23:00:00Z")),
  false,
);

console.log("generalAssemblies.test.ts: ok");
