// Run with `npm test -w website` (tsx, no framework, like apps/admin).
import assert from "node:assert/strict";
import type { Memory, Photo, TimelineEvent } from "../types/anniversary";
import {
  PROGRAMME_ANNIVERSARY_YEAR,
  PROGRAMME_FIRST_YEAR,
  buildSeasons,
  pickPosters,
  toRoman,
} from "./anniversaryProgramme";

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

const photo = (id: string, year: number | null): Photo => ({
  id,
  title: `Photo ${id}`,
  description: null,
  year,
  category: "Concert",
  image_url: `https://example.org/${id}.jpg`,
  display_order: 0,
});

// The cover's dates, in roman numerals.
assert.equal(PROGRAMME_ANNIVERSARY_YEAR, 2027);
assert.equal(toRoman(PROGRAMME_FIRST_YEAR), "MCMLXXXVII");
assert.equal(toRoman(PROGRAMME_ANNIVERSARY_YEAR), "MMXXVII");
assert.equal(toRoman(4), "IV");
assert.equal(toRoman(9), "IX");
assert.equal(toRoman(0), "");
assert.equal(toRoman(2.5), "");

// Seasons keep the CMS order and take the photo of their year.
assert.deepEqual(buildSeasons([], [memory("m", 2000)], []), []);
const seasons = buildSeasons(
  [event("b", 2007), event("a", 1987), event("c", 2023)],
  [
    memory("early", 1980),
    memory("m1987", 1987),
    memory("m2010", 2010),
    memory("m2030", 2030),
    memory("none", null),
  ],
  [photo("p1", 2023), photo("p2", 2023), photo("p3", null)],
);
assert.deepEqual(
  seasons.map((s) => s.event.id),
  ["b", "a", "c"],
);
assert.equal(seasons[2]!.photo?.id, "p1", "the first photo of the year");
assert.equal(seasons[0]!.photo, null);

// A memory joins the season it falls in; older ones go to the first.
const ids = (i: number) => seasons[i]!.memories.map((m) => m.id);
assert.deepEqual(ids(1), ["early", "m1987"]);
assert.deepEqual(ids(0), ["m2010"]);
assert.deepEqual(ids(2), ["m2030"]);
assert.equal(
  seasons.flatMap((s) => s.memories).length,
  4,
  "an undated memory is left to the livre d'or",
);

// Posters: newest first, one per programme, no test fixtures.
const posters = pickPosters(
  [
    {
      id: "1",
      name: "Requiem de Mozart",
      date: "2025-09-20",
      affiche: "r.jpg",
    },
    {
      id: "2",
      name: "Requiem de Mozart",
      date: "2025-09-28",
      affiche: "r.jpg",
    },
    { id: "3", name: "E2E_concert", date: "2026-12-01", affiche: "e.jpg" },
    { id: "4", name: "Enchantements", date: "2026-09-20", affiche: "e2.jpg" },
    { id: "5", name: "Sans affiche", date: "2026-10-01", affiche: null },
    { id: "6", name: "Autre nom", date: "2025-01-01", affiche: "e2.jpg" },
    { id: "7", name: "Hisaishi", date: null, affiche: " h.jpg " },
  ],
  10,
);
assert.deepEqual(
  posters.map((p) => p.id),
  ["4", "2", "7"],
);
assert.equal(posters[2]!.image, "h.jpg");
assert.equal(
  pickPosters(
    [
      { id: "1", name: "A", date: null, affiche: "a" },
      { id: "2", name: "B", date: null, affiche: "b" },
    ],
    1,
  ).length,
  1,
);

console.log("anniversaryProgramme: ok");
