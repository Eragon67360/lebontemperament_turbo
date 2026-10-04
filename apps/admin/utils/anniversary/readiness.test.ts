import assert from "node:assert/strict";
import { computeReadiness, type ReadinessFacts } from "./readiness";

const allGood: ReadinessFacts = {
  hero: { exists: true, complete: true, targetKnown: true },
  heroStats: { total: 4, visible: 4 },
  navigation: { total: 6, visible: 6, unknownTargets: 0 },
  timeline: { total: 12, visible: 12, withoutYear: 0 },
  videos: { total: 3, visible: 2 },
  audio: { total: 2, visible: 2 },
  photos: { total: 20, visible: 20 },
  archives: { total: 5, visible: 5 },
  form: { exists: true, enabled: true, complete: true },
  memories: { pending: 0, approved: 7 },
};

// Everything in place: ten rows, all ready, publishable.
{
  const readiness = computeReadiness(allGood);
  assert.equal(readiness.total, 10);
  assert.equal(readiness.ready, 10);
  assert.equal(readiness.publishable, true);
  assert.deepEqual(
    readiness.rows.map((row) => row.label),
    [
      "En-tête de la page",
      "Chiffres clés",
      "Cartes de navigation",
      "Chronologie",
      "Vidéos",
      "Souvenirs audio",
      "Photos",
      "Archives",
      "Formulaire",
      "Modération",
    ],
  );
  for (const row of readiness.rows) {
    assert.ok(row.href.startsWith("/dashboard/admin/anniversary"), row.label);
    assert.ok(row.reason.length > 0, row.label);
  }
  // A hidden item is said, not hidden.
  const videos = readiness.rows.find((row) => row.key === "videos")!;
  assert.equal(videos.reason, "2 vidéos en ligne, 1 masqué.");
}

// An empty section blocks the publication and says what to do.
{
  const readiness = computeReadiness({
    ...allGood,
    audio: { total: 0, visible: 0 },
  });
  const audio = readiness.rows.find((row) => row.key === "audio")!;
  assert.equal(audio.state, "empty");
  assert.equal(audio.action, "Ajouter");
  assert.equal(readiness.ready, 9);
  assert.equal(readiness.publishable, false);
}

// Items that are all hidden read as attention, not as ready.
{
  const photos = computeReadiness({
    ...allGood,
    photos: { total: 3, visible: 0 },
  }).rows.find((row) => row.key === "photos")!;
  assert.equal(photos.state, "attention");
  assert.equal(photos.reason, "3 photos, mais tout est masqué.");
}

// Timeline: events without a year are flagged.
{
  const timeline = computeReadiness({
    ...allGood,
    timeline: { total: 5, visible: 5, withoutYear: 2 },
  }).rows.find((row) => row.key === "timeline")!;
  assert.equal(timeline.state, "attention");
  assert.equal(timeline.reason, "2 événements sans année.");
  assert.equal(timeline.action, "Compléter");
}

// Navigation: a card pointing to an unknown section is flagged.
{
  const navigation = computeReadiness({
    ...allGood,
    navigation: { total: 2, visible: 2, unknownTargets: 1 },
  }).rows.find((row) => row.key === "navigation")!;
  assert.equal(navigation.state, "attention");
  assert.equal(navigation.reason, "1 carte mène à une section inconnue.");
}

// Hero: missing row, incomplete, unknown target.
{
  const missing = computeReadiness({
    ...allGood,
    hero: { exists: false, complete: false, targetKnown: false },
  }).rows[0]!;
  assert.equal(missing.state, "empty");
  const incomplete = computeReadiness({
    ...allGood,
    hero: { exists: true, complete: false, targetKnown: true },
  }).rows[0]!;
  assert.equal(incomplete.state, "attention");
  assert.equal(incomplete.action, "Compléter");
  const badTarget = computeReadiness({
    ...allGood,
    hero: { exists: true, complete: true, targetKnown: false },
  }).rows[0]!;
  assert.equal(badTarget.state, "attention");
  assert.equal(badTarget.action, "Corriger");
}

// Form disabled is a warning (the page can go live without it), not a blocker.
{
  const readiness = computeReadiness({
    ...allGood,
    form: { exists: true, enabled: false, complete: true },
  });
  const form = readiness.rows.find((row) => row.key === "form")!;
  assert.equal(form.state, "attention");
  assert.equal(readiness.publishable, true);
}

// Memories: pending ones ask for moderation; none at all is fine.
{
  const pending = computeReadiness({
    ...allGood,
    memories: { pending: 3, approved: 1 },
  }).rows.at(-1)!;
  assert.equal(pending.state, "attention");
  assert.equal(pending.reason, "3 témoignages attendent votre avis.");
  assert.equal(pending.action, "Modérer");
  const none = computeReadiness({
    ...allGood,
    memories: { pending: 0, approved: 0 },
  }).rows.at(-1)!;
  assert.equal(none.state, "ready");
}

console.log("readiness.test.ts: ok");
