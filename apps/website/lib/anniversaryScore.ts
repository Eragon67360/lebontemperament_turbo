import type { Memory, TimelineEvent } from "@/types/anniversary";

/**
 * The /40-ans "score" (direction A, « Mesure 40 »): one measure per year
 * from the founding in 1987, ten measures per line (one line per decade),
 * then the anniversary year as the closing fermata. Timeline events and
 * featured memories become the notes; a year without either is a rest.
 */
export const SCORE_FIRST_YEAR = 1987;
export const SCORE_MEASURE_COUNT = 40;
export const SCORE_MEASURES_PER_LINE = 10;
/** 2027, the year after the last measure: the « point d'orgue ». */
export const SCORE_FINALE_YEAR = SCORE_FIRST_YEAR + SCORE_MEASURE_COUNT;

export type ScoreEntry =
  | { kind: "event"; id: string; title: string; text: string }
  | { kind: "memory"; id: string; name: string; text: string };

export interface ScoreMeasure {
  year: number;
  /** 1 to 40, or 41 for the finale. */
  number: number;
  entries: ScoreEntry[];
  /** Staff position of the note head, 0 (low) to 4 (high), for variety. */
  pitch: number;
}

export interface Score {
  lines: { label: string; measures: ScoreMeasure[] }[];
  finale: ScoreMeasure;
}

/**
 * Where a year lands on the score. Years before the founding go to the first
 * measure and years after the anniversary to the finale, so no CMS entry
 * silently disappears from the page.
 */
export function scoreYear(year: number): number {
  return Math.min(Math.max(year, SCORE_FIRST_YEAR), SCORE_FINALE_YEAR);
}

export function buildScore(events: TimelineEvent[], memories: Memory[]): Score {
  const byYear = new Map<number, ScoreEntry[]>();
  const push = (year: number, entry: ScoreEntry) => {
    const key = scoreYear(year);
    byYear.set(key, [...(byYear.get(key) ?? []), entry]);
  };

  // Events keep their CMS order; memories follow the events of their year.
  for (const event of events) {
    push(event.year, {
      kind: "event",
      id: event.id,
      title: event.title,
      text: event.description,
    });
  }
  for (const memory of memories) {
    if (memory.year === null) continue;
    push(memory.year, {
      kind: "memory",
      id: memory.id,
      name: memory.name,
      text: memory.message,
    });
  }

  const measure = (year: number): ScoreMeasure => ({
    year,
    number: year - SCORE_FIRST_YEAR + 1,
    entries: byYear.get(year) ?? [],
    pitch: (year * 7) % 5,
  });

  const lines = [];
  for (
    let start = SCORE_FIRST_YEAR;
    start < SCORE_FINALE_YEAR;
    start += SCORE_MEASURES_PER_LINE
  ) {
    const measures = Array.from({ length: SCORE_MEASURES_PER_LINE }, (_, i) =>
      measure(start + i),
    );
    lines.push({
      label: `${start} — ${start + SCORE_MEASURES_PER_LINE - 1}`,
      measures,
    });
  }

  return { lines, finale: { ...measure(SCORE_FINALE_YEAR), pitch: 4 } };
}

/** The measure to open on: the first one that has a note, else the first. */
export function firstNoteYear(score: Score): number {
  for (const line of score.lines) {
    for (const m of line.measures) {
      if (m.entries.length > 0) return m.year;
    }
  }
  return SCORE_FIRST_YEAR;
}
