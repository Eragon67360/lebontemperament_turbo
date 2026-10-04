// Run with `npm test -w website` (tsx, no framework, like apps/admin).
import assert from "node:assert/strict";
import type { Memory, TimelineEvent } from "../types/anniversary";
import {
  SCORE_FINALE_YEAR,
  SCORE_FIRST_YEAR,
  buildScore,
  firstNoteYear,
  scoreYear,
} from "./anniversaryScore";

const event = (id: string, year: number): TimelineEvent => ({
  id,
  year,
  title: `Titre ${id}`,
  description: `Texte ${id}`,
  icon_name: "FaMusic",
  display_order: 0,
});

const memory = (id: string, year: number | null): Memory => ({
  id,
  name: `Témoin ${id}`,
  message: `Souvenir ${id}`,
  year,
  is_featured: true,
  created_at: "2026-01-01T00:00:00Z",
});

// Forty measures in four lines of ten, from the founding to 2026.
const empty = buildScore([], []);
assert.equal(empty.lines.length, 4);
assert.deepEqual(
  empty.lines.map((l) => l.measures.length),
  [10, 10, 10, 10],
);
assert.equal(empty.lines[0]!.measures[0]!.year, 1987);
assert.equal(empty.lines[0]!.measures[0]!.number, 1);
assert.equal(empty.lines[3]!.measures[9]!.year, 2026);
assert.equal(empty.lines[3]!.measures[9]!.number, 40);
assert.equal(empty.lines[0]!.label, "1987 — 1996");
assert.equal(empty.finale.year, 2027);
assert.equal(empty.finale.number, 41);
assert.equal(firstNoteYear(empty), SCORE_FIRST_YEAR);

// Every measure's pitch stays on the staff.
for (const line of empty.lines) {
  for (const m of line.measures) assert.ok(m.pitch >= 0 && m.pitch <= 4);
}

// Out-of-range years are clamped, never dropped.
assert.equal(scoreYear(1984), SCORE_FIRST_YEAR);
assert.equal(scoreYear(2030), SCORE_FINALE_YEAR);
assert.equal(scoreYear(2001), 2001);

const score = buildScore(
  [event("a", 1984), event("b", 2023), event("c", 2027), event("d", 2023)],
  [memory("m1", 2023), memory("m2", null), memory("m3", 1995)],
);
const at = (year: number) =>
  year === SCORE_FINALE_YEAR
    ? score.finale
    : score.lines.flatMap((l) => l.measures).find((m) => m.year === year)!;

assert.deepEqual(
  at(1987).entries.map((e) => e.id),
  ["a"],
  "a 1984 event lands on the first measure",
);
assert.deepEqual(
  at(2023).entries.map((e) => `${e.kind}:${e.id}`),
  ["event:b", "event:d", "memory:m1"],
  "events keep their order, memories follow",
);
assert.deepEqual(
  at(2027).entries.map((e) => e.id),
  ["c"],
);
assert.deepEqual(
  at(1995).entries.map((e) => e.id),
  ["m3"],
);
assert.equal(
  score.lines.flatMap((l) => l.measures).flatMap((m) => m.entries).length +
    score.finale.entries.length,
  6,
  "a memory without a year is left out, nothing else",
);
assert.equal(firstNoteYear(score), 1987);

console.log("anniversaryScore: ok");
