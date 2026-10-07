// The programme-style date block (`components/ui/date-block.tsx`): the day
// and the French month abbreviation, without date-fns or Intl so the server
// and the browser always agree. Pure and unit-tested.

/** The French abbreviations, as a concert programme prints them. */
export const MONTH_ABBR_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

/** « oct. » for October (a Date, or a month index from 0 to 11). */
export function monthAbbrFr(month: Date | number): string {
  const index = typeof month === "number" ? month : month.getMonth();
  return MONTH_ABBR_FR[((index % 12) + 12) % 12]!;
}

/** « 7 » and « oct. »: what the date block shows (local day, not UTC). */
export function dateBlockParts(date: Date): { day: string; month: string } {
  return { day: String(date.getDate()), month: monthAbbrFr(date) };
}
