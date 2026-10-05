// « À venir / Passés » for the concerts page (F4, #480): the split of
// concerts and tours by today's date, their sort orders and the French
// wording of their facts. Pure and unit-tested; the page feeds it the two
// existing queries.
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** The slice of a concert row the split needs (fixtures stay small). */
export type ConcertLike = {
  id: string;
  name?: string | null;
  date: string;
  time: string;
  place?: string | null;
  context?: string | null;
  tour_id?: string | null;
};

/** The slice of a tour row the split needs. */
export type TourLike = {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
};

/**
 * Today as `yyyy-MM-dd` in the admin's own time zone. `toISOString()`
 * would give the UTC day, which is still yesterday in Paris before 2 am.
 */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A concert dated today is still « à venir » until midnight. */
export function isUpcomingConcert(concert: ConcertLike, today: string) {
  return concert.date >= today;
}

/**
 * A tour is « à venir » until its last day; a tour with only a start date
 * is judged on that day. A tour with no date at all stays « à venir »
 * (it is being planned) instead of disappearing.
 */
export function isUpcomingTour(tour: TourLike, today: string) {
  const last = tour.end_date || tour.start_date;
  return !last || last >= today;
}

const byDateTime = (direction: 1 | -1) => (a: ConcertLike, b: ConcertLike) => {
  const cmp =
    a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");
  return cmp * direction;
};

/** Upcoming concerts soonest first, past concerts most recent first. */
export function splitConcerts<T extends ConcertLike>(
  concerts: readonly T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  const upcoming = concerts
    .filter((c) => isUpcomingConcert(c, today))
    .sort(byDateTime(1));
  const past = concerts
    .filter((c) => !isUpcomingConcert(c, today))
    .sort(byDateTime(-1));
  return { upcoming, past };
}

/** The date a tour is sorted by; undated tours come first in « À venir ». */
function tourSortKey(tour: TourLike) {
  return tour.start_date || tour.end_date || "";
}

/** Upcoming tours soonest first (undated ones on top), past tours most recent first. */
export function splitTours<T extends TourLike>(
  tours: readonly T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  const upcoming = tours
    .filter((t) => isUpcomingTour(t, today))
    .sort((a, b) => tourSortKey(a).localeCompare(tourSortKey(b)));
  const past = tours
    .filter((t) => !isUpcomingTour(t, today))
    .sort((a, b) => tourSortKey(b).localeCompare(tourSortKey(a)));
  return { upcoming, past };
}

// --- Wording ---

export const CONTEXT_LABELS: Record<string, string> = {
  orchestre: "Orchestre",
  choeur: "Chœur",
  orchestre_et_choeur: "Orchestre et chœur",
  autre: "Autre",
};

/** The plain label of a concert or tour « context » enum value. */
export function contextLabel(context: string | null | undefined): string {
  return (context && CONTEXT_LABELS[context]) || "Autre";
}

/** What the site shows when a concert has no name. */
export function concertTitle(concert: {
  name?: string | null;
  place?: string | null;
}): string {
  return (
    concert.name ||
    (concert.place ? `Concert à ${concert.place}` : "Concert sans titre")
  );
}

/** "2026-09-15" as a local date (never UTC midnight, which shifts the day). */
export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** « Mardi 15 septembre 2026 » */
export function formatLongDateFr(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  const text = format(date, "EEEE d MMMM yyyy", { locale: fr });
  return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
}

/** « 15 sept. 2026 » */
export function formatShortDateFr(value: string): string {
  const date = parseIsoDate(value);
  return date ? format(date, "d MMM yyyy", { locale: fr }) : value;
}

/** "20:30:00" → « 20 h 30 », "20:00" → « 20 h »; "" when unreadable. */
export function formatTimeFr(time: string | null | undefined): string {
  const m = time ? /^(\d{1,2}):(\d{2})/.exec(time) : null;
  if (!m) return "";
  const hours = Number(m[1]);
  return m[2] === "00" ? `${hours} h` : `${hours} h ${m[2]}`;
}

/**
 * « Du 14 août au 28 sept. 2025 », « À partir du 14 août 2025 »,
 * « Jusqu'au 28 sept. 2025 », or « Dates à préciser ».
 */
export function tourPeriodLabel(tour: TourLike): string {
  const start = tour.start_date ? formatShortDateFr(tour.start_date) : null;
  const end = tour.end_date ? formatShortDateFr(tour.end_date) : null;
  if (start && end)
    return start === end ? `Le ${start}` : `Du ${start} au ${end}`;
  if (start) return `À partir du ${start}`;
  if (end) return `Jusqu'au ${end}`;
  return "Dates à préciser";
}

/** « 3 concerts », « 1 concert », « Aucun concert ». */
export function concertCountLabel(count: number): string {
  if (count === 0) return "Aucun concert";
  return `${count} concert${count > 1 ? "s" : ""}`;
}

/** The first line or so of a text, for a card excerpt. */
export function excerpt(text: string | null | undefined, max = 120): string {
  if (!text) return "";
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  const cut = oneLine.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`;
}
