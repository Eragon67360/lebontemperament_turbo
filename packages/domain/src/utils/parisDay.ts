// « Today » for the association: the calendar day in Paris, as YYYY-MM-DD.
// Concerts, events and rehearsals are dated in local days; the servers run in
// UTC, so `new Date().toISOString()` gave yesterday's date between midnight
// and 01:00/02:00 in Paris and kept the previous day's concerts upcoming (#490).
const PARIS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Paris calendar day of `now` (default: the current instant), YYYY-MM-DD. */
export function parisToday(now: Date = new Date()): string {
  return PARIS_DAY.format(now);
}
