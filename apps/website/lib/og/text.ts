/**
 * Pure text helpers for the link-preview cards (`lib/og/cards.tsx`), kept
 * apart from the JSX so `text.test.ts` can run them with plain `tsx`.
 */

const DAY_MONTH = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const SHORT_MONTH = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  timeZone: "UTC",
});

/** The pieces of a concert's date block and date line, from `YYYY-MM-DD`. */
export function concertDateParts(date: string, time?: string | null) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  // « samedi 1er mai »: French writes the first of the month as an ordinal
  const long = DAY_MONTH.format(day).replace(/ 1 /, " 1er ");
  const hour = time ? time.slice(0, 5).replace(":", " h ") : null;
  return {
    day: String(day.getUTCDate()),
    // « nov. », « mai », « juil. »: Intl's French abbreviations
    month: SHORT_MONTH.format(day),
    year: String(day.getUTCFullYear()),
    line: [long.charAt(0).toUpperCase() + long.slice(1), hour]
      .filter(Boolean)
      .join(" · "),
  };
}

/** Same rule as the agenda's cards (`ConcertsClient`). */
export function concertTitle(name: string | null, place: string) {
  return name || `Concert à ${place}`;
}

/** A story's year: its `date` column is a full date in the database. */
export function storyYear(date: string | null | undefined): string | null {
  const year = date?.match(/^\d{4}/)?.[0];
  return year ?? null;
}

/** Cuts long admin-typed text at a word, with an ellipsis, for a fixed card. */
export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return `${(atWord.length > max * 0.6 ? atWord : cut).replace(/[\s,;:.-]+$/, "")}…`;
}
