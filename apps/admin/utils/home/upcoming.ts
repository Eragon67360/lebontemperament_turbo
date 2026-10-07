// « À venir » on the home: rehearsals, events and concerts merged into one
// chronological list for the next weeks, plus the French wording of their
// dates and times. Pure and unit-tested; the page feeds it the three
// existing queries.
import RouteNames from "@/utils/routes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// --- Dates and times, in French ---

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_RE = /^(\d{1,2}):(\d{2})/;

/**
 * A calendar date and an optional clock time as a local Date (the browser's
 * zone, which is the admin's). `new Date("2026-10-07")` would be UTC midnight
 * and shift the day west of Greenwich.
 */
export function localDateTime(
  date: string,
  time?: string | null,
  fallback: { hours: number; minutes: number; seconds?: number } = {
    hours: 0,
    minutes: 0,
  },
): Date | null {
  const d = DATE_RE.exec(date);
  if (!d) return null;
  const t = time ? TIME_RE.exec(time) : null;
  return new Date(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    t ? Number(t[1]) : fallback.hours,
    t ? Number(t[2]) : fallback.minutes,
    t ? 0 : (fallback.seconds ?? 0),
  );
}

/** "20:30:00" → « 20 h 30 », "20:00" → « 20 h »; null when unreadable. */
export function formatTimeFr(time: string | null | undefined): string | null {
  const t = time ? TIME_RE.exec(time) : null;
  if (!t) return null;
  const hours = Number(t[1]);
  return t[2] === "00" ? `${hours} h` : `${hours} h ${t[2]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
}

/** « Mardi 7 octobre » (with the year only when it is not this one). */
export function formatDayFr(date: Date, now: Date = new Date()): string {
  const pattern =
    date.getFullYear() === now.getFullYear()
      ? "EEEE d MMMM"
      : "EEEE d MMMM yyyy";
  return capitalize(format(date, pattern, { locale: fr }));
}

// --- The merge ---

export type UpcomingKind = "rehearsal" | "event" | "concert";

export type UpcomingItem = {
  key: string;
  kind: UpcomingKind;
  title: string;
  startsAt: Date;
  /** When it stops being « à venir » (end of the day for a dated event). */
  endsAt: Date;
  /** « 20 h 30 », or null when the source has no time. */
  time: string | null;
  place: string | null;
  /** The admin page that manages this kind of item. */
  href: string;
};

/** The slices of the three row types the merge needs (fixtures stay small). */
export type RehearsalLike = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  place: string | null;
  group_type?: string | null;
};

export type EventLike = {
  id: string;
  title: string;
  date_from: string;
  date_to?: string | null;
  time?: string | null;
  location?: string | null;
};

export type ConcertLike = {
  id: string;
  name?: string | null;
  date: string;
  time: string;
  place?: string | null;
};

export const UPCOMING_KIND_LABEL: Record<UpcomingKind, string> = {
  rehearsal: "Répétition",
  event: "Événement",
  concert: "Concert",
};

const END_OF_DAY = { hours: 23, minutes: 59, seconds: 59 };

function rehearsalItem(row: RehearsalLike): UpcomingItem | null {
  const startsAt = localDateTime(row.date, row.start_time);
  if (!startsAt) return null;
  const endsAt = localDateTime(row.date, row.end_time) ?? startsAt;
  const name = row.name?.trim();
  return {
    key: `rehearsal-${row.id}`,
    kind: "rehearsal",
    title:
      name ||
      (row.group_type ? `Répétition · ${row.group_type}` : "Répétition"),
    startsAt,
    endsAt: endsAt < startsAt ? startsAt : endsAt,
    time: formatTimeFr(row.start_time),
    place: row.place?.trim() || null,
    href: RouteNames.DASHBOARD.MEMBERS.REPETITIONS,
  };
}

function eventItem(row: EventLike): UpcomingItem | null {
  const startsAt = localDateTime(row.date_from, row.time);
  if (!startsAt) return null;
  // A multi-day event stays listed until its last day ends.
  const endsAt =
    localDateTime(row.date_to || row.date_from, null, END_OF_DAY) ?? startsAt;
  return {
    key: `event-${row.id}`,
    kind: "event",
    title: row.title?.trim() || "Événement sans titre",
    startsAt,
    endsAt: endsAt < startsAt ? startsAt : endsAt,
    time: formatTimeFr(row.time),
    place: row.location?.trim() || null,
    href: RouteNames.DASHBOARD.MEMBERS.EVENEMENTS,
  };
}

function concertItem(row: ConcertLike): UpcomingItem | null {
  const startsAt = localDateTime(row.date, row.time);
  if (!startsAt) return null;
  return {
    key: `concert-${row.id}`,
    kind: "concert",
    title: row.name?.trim() || "Concert sans nom",
    startsAt,
    endsAt: startsAt,
    time: formatTimeFr(row.time),
    place: row.place?.trim() || null,
    href: RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS,
  };
}

export const UPCOMING_WINDOW_DAYS = 30;
export const UPCOMING_LIMIT = 6;

/**
 * Everything that has not ended yet and starts within the window, soonest
 * first, capped. A source that failed to load is simply absent (undefined),
 * so the list still shows the others.
 */
export function mergeUpcoming(
  sources: {
    rehearsals?: RehearsalLike[];
    events?: EventLike[];
    concerts?: ConcertLike[];
  },
  options: { now?: Date; days?: number; limit?: number } = {},
): UpcomingItem[] {
  const now = options.now ?? new Date();
  const days = options.days ?? UPCOMING_WINDOW_DAYS;
  const limit = options.limit ?? UPCOMING_LIMIT;
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const items: UpcomingItem[] = [
    ...(sources.rehearsals ?? []).map(rehearsalItem),
    ...(sources.events ?? []).map(eventItem),
    ...(sources.concerts ?? []).map(concertItem),
  ].filter((item): item is UpcomingItem => item !== null);

  return items
    .filter((item) => item.endsAt >= now && item.startsAt <= horizon)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, limit);
}

function firstToCome(
  items: (UpcomingItem | null)[],
  now: Date,
): UpcomingItem | null {
  return (
    items
      .filter((item): item is UpcomingItem => item !== null)
      .filter((item) => item.endsAt >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null
  );
}

/** The first concert still to come, whatever the window (for a status line). */
export function nextConcert(
  concerts: ConcertLike[] | undefined,
  now: Date = new Date(),
): UpcomingItem | null {
  return firstToCome((concerts ?? []).map(concertItem), now);
}

/** The first rehearsal still to come, whatever the window. */
export function nextRehearsal(
  rehearsals: RehearsalLike[] | undefined,
  now: Date = new Date(),
): UpcomingItem | null {
  return firstToCome((rehearsals ?? []).map(rehearsalItem), now);
}
