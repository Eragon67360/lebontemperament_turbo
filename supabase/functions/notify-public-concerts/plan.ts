// What notify-public-concerts sends on a given day: pure functions, tested
// in plan_test.ts.

export interface ConcertRow {
  id: string;
  name: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM or HH:MM:SS */
  time: string | null;
  place: string | null;
  venue_name: string | null;
  city: string | null;
}

export type PushKind = "announcement" | "reminder";

export interface PlannedPush {
  concert: ConcertRow;
  kind: PushKind;
  title: string;
  body: string;
}

/** At most this many pushes per day: the rest waits for the next run. */
export const MAX_PUSHES_PER_RUN = 3;

/** A reminder goes out when the concert is this many days away or fewer. */
export const REMINDER_DAYS = 2;

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Today's date in Paris, as YYYY-MM-DD. */
export function parisToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Whole days from [from] to [to], both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** « samedi 14 novembre ». */
export function frenchDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "20:00:00" → « 20 h », "19:30" → « 19 h 30 »; "" when unknown. */
export function frenchTime(time: string | null): string {
  const m = (time ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = parseInt(m[1], 10);
  return m[2] === "00" ? `${h} h` : `${h} h ${m[2]}`;
}

function concertName(c: ConcertRow): string {
  return c.name?.trim() || "Notre concert";
}

/** The venue and its town, else the free-text place. */
export function concertPlace(c: ConcertRow): string {
  const venue = c.venue_name?.trim() ?? "";
  const city = c.city?.trim() ?? "";
  if (!venue) return c.place?.trim() ?? "";
  if (!city || venue.includes(city)) return venue;
  return `${venue}, ${city}`;
}

/** « samedi 14 novembre à 20 h, Église Saint-Martin, Saverne. » */
function whenAndWhere(c: ConcertRow): string {
  const time = frenchTime(c.time);
  const place = concertPlace(c);
  return `${frenchDate(c.date)}${time ? ` à ${time}` : ""}${place ? `, ${place}` : ""}.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function message(
  c: ConcertRow,
  kind: PushKind,
  daysAway: number,
): { title: string; body: string } {
  if (kind === "announcement") {
    return {
      title: `Nouveau concert : ${concertName(c)}`,
      body: `${capitalize(whenAndWhere(c))} Notez la date, on compte sur vous !`,
    };
  }
  return {
    title: `${concertName(c)}, c’est ${daysAway <= 1 ? "demain" : "après-demain"} !`,
    body: `${capitalize(whenAndWhere(c))} On vous attend !`,
  };
}

/**
 * The pushes due today, soonest concert first, at most
 * [MAX_PUSHES_PER_RUN]. [sent] holds "<concert id>:<kind>" for the pushes
 * already sent. A concert two days away or closer only gets its reminder
 * (the reminder is the news); a past or same-day concert gets nothing.
 */
export function plan(
  concerts: ConcertRow[],
  sent: Set<string>,
  today: string,
): PlannedPush[] {
  const due: PlannedPush[] = [];
  const upcoming = concerts
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.date))
    .map((c) => ({ c, days: daysBetween(today, c.date) }))
    .filter(({ days }) => days >= 1)
    .sort(
      (a, b) =>
        a.days - b.days || (a.c.time ?? "").localeCompare(b.c.time ?? ""),
    );

  for (const { c, days } of upcoming) {
    const kind: PushKind | null =
      days <= REMINDER_DAYS
        ? sent.has(`${c.id}:reminder`)
          ? null
          : "reminder"
        : sent.has(`${c.id}:announcement`)
          ? null
          : "announcement";
    if (!kind) continue;
    due.push({ concert: c, kind, ...message(c, kind, days) });
    if (due.length >= MAX_PUSHES_PER_RUN) break;
  }
  return due;
}
