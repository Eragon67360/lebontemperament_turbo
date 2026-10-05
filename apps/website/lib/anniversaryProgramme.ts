import type { Memory, Photo, TimelineEvent } from "@/types/anniversary";

/**
 * The /40-ans "programme" (direction D, « Le Programme »): the page reads as
 * the booklet of a gala concert. The ensemble was founded in Saverne in 1987,
 * so the anniversary season is 2027.
 */
export const PROGRAMME_FIRST_YEAR = 1987;
export const PROGRAMME_ANNIVERSARY_YEAR = PROGRAMME_FIRST_YEAR + 40;

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 1987 → « MCMLXXXVII ». Positive integers only; anything else is "". */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value <= 0) return "";
  let rest = value;
  let out = "";
  for (const [n, numeral] of ROMAN) {
    while (rest >= n) {
      out += numeral;
      rest -= n;
    }
  }
  return out;
}

export interface Season {
  event: TimelineEvent;
  /** The first gallery photo of the same year, if any. */
  photo: Photo | null;
  /** Featured memories from this season's year up to the next season's. */
  memories: Memory[];
}

/**
 * « Quarante saisons »: one season per timeline event, in the CMS order. A
 * featured memory joins the latest season that started on or before its
 * year (the first season when it is older than all of them), so every dated
 * memory finds a place; undated ones stay in the livre d'or only.
 */
export function buildSeasons(
  events: TimelineEvent[],
  memories: Memory[],
  photos: Photo[],
): Season[] {
  const seasons: Season[] = events.map((event) => ({
    event,
    photo: photos.find((p) => p.year === event.year) ?? null,
    memories: [],
  }));
  if (seasons.length === 0) return seasons;

  const byYear = [...seasons].sort((a, b) => a.event.year - b.event.year);
  for (const memory of memories) {
    if (memory.year === null) continue;
    const year = memory.year;
    const home =
      byYear.filter((s) => s.event.year <= year).at(-1) ?? byYear[0]!;
    home.memories.push(memory);
  }
  return seasons;
}

export interface PosterSource {
  id: string;
  name: string | null;
  date: string | null;
  affiche: string | null;
}

export interface ProgrammePoster {
  id: string;
  title: string;
  date: string | null;
  image: string;
}

/**
 * The posters of the archive stack: concerts with a poster, newest first,
 * one per programme (a tour repeats the same name and poster on every
 * date), without the end-to-end test fixtures (`E2E_` names).
 */
export function pickPosters(
  rows: PosterSource[],
  limit: number,
): ProgrammePoster[] {
  const seenNames = new Set<string>();
  const seenImages = new Set<string>();
  const posters: ProgrammePoster[] = [];
  const sorted = [...rows].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );

  for (const row of sorted) {
    const image = row.affiche?.trim();
    const title = row.name?.trim();
    if (!image || !title || title.startsWith("E2E_")) continue;
    const key = title.toLocaleLowerCase("fr");
    if (seenNames.has(key) || seenImages.has(image)) continue;
    seenNames.add(key);
    seenImages.add(image);
    posters.push({ id: row.id, title, date: row.date, image });
    if (posters.length === limit) break;
  }
  return posters;
}
