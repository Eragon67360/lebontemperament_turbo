import assert from "node:assert/strict";
import {
  computeReadiness,
  type ReadinessFacts,
} from "../anniversary/readiness";
import {
  buildHomeTasks,
  driveSyncAttention,
  summarizeReadiness,
} from "./tasks";

// --- summarizeReadiness: what the home needs from the checklist ---
const facts: ReadinessFacts = {
  hero: { exists: true, complete: true, targetKnown: true },
  heroStats: { total: 4, visible: 4 },
  navigation: { total: 6, visible: 6, unknownTargets: 0 },
  timeline: { total: 12, visible: 12, withoutYear: 2 }, // attention
  videos: { total: 3, visible: 3 },
  audio: { total: 0, visible: 0 }, // empty
  photos: { total: 20, visible: 20 },
  archives: { total: 5, visible: 5 },
  form: { exists: true, enabled: true, complete: true },
  memories: { pending: 3, approved: 7 }, // attention, but its own task
};
{
  const summary = summarizeReadiness({ ...computeReadiness(facts), facts });
  assert.equal(summary.total, 10);
  assert.equal(summary.ready, 7);
  assert.equal(summary.pendingMemories, 3);
  // Moderation is not a "section to complete": it is the memories task.
  assert.equal(summary.sectionsToComplete, 2);
  assert.deepEqual(summary.sectionLabels, ["Chronologie", "Souvenirs audio"]);
}
{
  const allGood = { ...facts, timeline: { ...facts.timeline, withoutYear: 0 } };
  allGood.audio = { total: 2, visible: 2 };
  allGood.memories = { pending: 0, approved: 7 };
  const summary = summarizeReadiness({
    ...computeReadiness(allGood),
    facts: allGood,
  });
  assert.equal(summary.sectionsToComplete, 0);
  assert.equal(summary.pendingMemories, 0);
  assert.equal(summary.ready, 10);
}

// --- driveSyncAttention: only the last run counts ---
const now = Date.parse("2026-10-03T10:00:00Z");
const ok = {
  status: "success",
  started_at: "2026-10-03T01:30:00Z",
  finished_at: "2026-10-03T01:31:00Z",
  error: null,
  counts: { added: 2, renamed: 0, moved: 0, removed: 0, unreadable_roots: 0 },
};
{
  assert.equal(driveSyncAttention(undefined, now), null);
  assert.equal(driveSyncAttention([], now), null);
  assert.equal(driveSyncAttention([ok], now), null);

  const failed = driveSyncAttention(
    [
      {
        status: "error",
        started_at: "2026-10-03T01:30:00Z",
        finished_at: "2026-10-03T01:30:05Z",
        error: "Google Drive n'a pas répondu.",
        counts: {},
      },
      ok,
    ],
    now,
  );
  assert.equal(failed?.kind, "failed");
  assert.equal(
    failed?.kind === "failed" && failed.error,
    "Google Drive n'a pas répondu.",
  );
  assert.match(failed!.when, /2026/);

  // A later success clears an older failure.
  assert.equal(driveSyncAttention([ok, { ...ok, status: "error" }], now), null);

  const unreadable = driveSyncAttention(
    [{ ...ok, counts: { ...ok.counts, unreadable_roots: 2 } }],
    now,
  );
  assert.deepEqual(unreadable && { kind: unreadable.kind }, {
    kind: "unreadable",
  });
  assert.equal(unreadable?.kind === "unreadable" && unreadable.count, 2);

  // Running: fresh is fine, stale is interrupted.
  assert.equal(
    driveSyncAttention(
      [{ ...ok, status: "running", started_at: "2026-10-03T09:58:00Z" }],
      now,
    ),
    null,
  );
  assert.equal(
    driveSyncAttention(
      [{ ...ok, status: "running", started_at: "2026-10-03T01:30:00Z" }],
      now,
    )?.kind,
    "interrupted",
  );
}

// --- buildHomeTasks: order, counts, wording, actions ---
{
  const tasks = buildHomeTasks({
    memoriesPending: 3,
    unreadMessages: 2,
    driveSync: { kind: "unreadable", when: "03/10/2026 03:31", count: 1 },
    sectionsToComplete: 2,
  });
  assert.deepEqual(
    tasks.map((task) => task.key),
    ["drive-sync", "memories", "messages", "campaign-sections"],
  );
  assert.equal(tasks[0]!.title, "Synchronisation Drive : 1 dossier illisible");
  assert.equal(tasks[0]!.tone, "warning");
  assert.deepEqual(tasks[0]!.action, {
    kind: "link",
    label: "Voir le détail",
    href: "/dashboard/members/travail",
  });
  assert.equal(tasks[1]!.title, "3 témoignages attendent votre avis");
  assert.deepEqual(tasks[1]!.action, {
    kind: "link",
    label: "Modérer",
    href: "/dashboard/admin/anniversary/memories",
  });
  assert.equal(tasks[2]!.title, "2 messages non lus");
  assert.deepEqual(tasks[2]!.action, { kind: "messages", label: "Lire" });
  assert.equal(tasks[3]!.title, "2 sections de la page des 40 ans à compléter");
  assert.deepEqual(tasks[3]!.action, {
    kind: "link",
    label: "Voir les sections",
    href: "/dashboard/admin/anniversary",
  });
  for (const task of tasks) {
    assert.ok(task.explanation.length > 0, task.key);
  }
}

// Singulars, and the failure wording of the sync.
{
  const tasks = buildHomeTasks({
    memoriesPending: 1,
    unreadMessages: 1,
    driveSync: { kind: "failed", when: "03/10/2026 03:31", error: null },
    sectionsToComplete: 1,
  });
  assert.equal(tasks[0]!.title, "La synchronisation Drive a échoué");
  assert.match(tasks[0]!.explanation, /03\/10\/2026 03:31/);
  assert.equal(tasks[1]!.title, "1 témoignage attend votre avis");
  assert.equal(tasks[2]!.title, "1 message non lu");
  assert.equal(tasks[3]!.title, "1 section de la page des 40 ans à compléter");
}

// Nothing to do, or sources missing: no row, never a zero.
{
  assert.deepEqual(
    buildHomeTasks({
      memoriesPending: 0,
      unreadMessages: 0,
      driveSync: null,
      sectionsToComplete: 0,
    }),
    [],
  );
  assert.deepEqual(buildHomeTasks({}), []);
  assert.deepEqual(
    buildHomeTasks({ unreadMessages: 4 }).map((task) => task.key),
    ["messages"],
  );
}

console.log("utils/home/tasks.test.ts: ok");
