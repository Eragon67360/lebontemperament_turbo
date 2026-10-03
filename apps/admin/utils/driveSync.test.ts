import assert from "node:assert/strict";
import {
  describeCounts,
  describeRun,
  formatRunDate,
  hasChanges,
  modeLabel,
  parseSyncMode,
  plural,
  triggerLabel,
  type DriveSyncCounts,
} from "./driveSync";

const counts = (partial: Partial<DriveSyncCounts> = {}): DriveSyncCounts => ({
  added: 0,
  renamed: 0,
  moved: 0,
  removed: 0,
  unchanged: 0,
  unreadable_roots: 0,
  ...partial,
});

// --- Request validation ---
assert.equal(parseSyncMode("dry_run"), "dry_run");
assert.equal(parseSyncMode("apply"), "apply");
assert.equal(parseSyncMode("APPLY"), null);
assert.equal(parseSyncMode("cron"), null);
assert.equal(parseSyncMode(undefined), null);
assert.equal(parseSyncMode({ mode: "apply" }), null);

// --- Wording ---
assert.equal(plural(0, "nouveau", "nouveaux"), "0 nouveau");
assert.equal(plural(1, "nouveau", "nouveaux"), "1 nouveau");
assert.equal(plural(2, "nouveau", "nouveaux"), "2 nouveaux");

assert.equal(describeCounts(counts()), "aucun changement");
assert.equal(
  describeCounts(counts({ added: 3, renamed: 1, removed: 2 })),
  "3 nouveaux, 1 renommé, 2 retirés",
);
assert.equal(describeCounts(counts({ moved: 1 })), "1 déplacé");
assert.equal(describeCounts(counts({ unchanged: 40 })), "aucun changement");

assert.equal(hasChanges(counts()), false);
assert.equal(hasChanges(counts({ unchanged: 10 })), false);
assert.equal(hasChanges(counts({ removed: 1 })), true);
assert.equal(hasChanges(counts({ unreadable_roots: 1 })), false);

// --- Past runs ---
assert.equal(
  describeRun({ status: "running", counts: {}, error: null }),
  "En cours…",
);
const t0 = Date.parse("2026-10-03T10:00:00.000Z");
const running = {
  status: "running",
  counts: {},
  error: null,
  started_at: "2026-10-03T10:00:00.000Z",
};
assert.equal(describeRun(running, t0 + 9 * 60 * 1000), "En cours…");
assert.equal(describeRun(running, t0 + 11 * 60 * 1000), "Interrompue");
assert.equal(
  describeRun({
    status: "error",
    counts: {},
    error: "Google token request failed",
  }),
  "Erreur : Google token request failed",
);
assert.equal(
  describeRun({ status: "error", counts: {}, error: null }),
  "Erreur",
);
assert.equal(
  describeRun({ status: "success", counts: counts({ added: 2 }), error: null }),
  "2 nouveaux",
);
assert.equal(
  describeRun({
    status: "success",
    counts: counts({ unreadable_roots: 2 }),
    error: null,
  }),
  "aucun changement, 2 dossiers illisibles",
);
// A row whose counts aren't the expected shape still renders.
assert.equal(
  describeRun({ status: "success", counts: null, error: null }),
  "Terminé",
);
assert.equal(
  describeRun({ status: "success", counts: "oops", error: null }),
  "Terminé",
);

assert.equal(triggerLabel("cron"), "Automatique (nuit)");
assert.equal(triggerLabel("admin"), "Manuel");
assert.equal(modeLabel("apply"), "Application");
assert.equal(modeLabel("dry_run"), "Vérification");

// Paris time, whatever the server's zone: 01:30 UTC in summer is 03:30.
assert.equal(formatRunDate("2026-07-15T01:30:00.000Z"), "15/07/2026 03:30");
assert.equal(formatRunDate("2026-12-15T02:30:00.000Z"), "15/12/2026 03:30");

console.log("driveSync tests passed");
