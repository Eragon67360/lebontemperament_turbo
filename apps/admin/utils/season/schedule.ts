// « À venir / Passés » for the member-season screens (Répétitions and
// Événements, Phase 4 wave 4, #433): the split by today's local day, the
// sort orders, the French wording of the facts, the recurrence of a weekly
// rehearsal and the exact payloads the forms send. Pure and unit-tested; the
// pages feed it the existing queries. Shares `todayIso`, `parseIsoDate` and
// `formatTimeFr` with the concerts page so the three screens agree on what
// « aujourd'hui » means.
import type { EventFormValues, RehearsalFormValues } from "@/utils/formSchemas";
import type { CreateEventDTO, UpdateEventDTO } from "@repo/domain/types/events";
import { addWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  excerpt,
  formatTimeFr,
  parseIsoDate,
  todayIso,
} from "../concerts/schedule";

export { excerpt, formatTimeFr, parseIsoDate, todayIso };

/** The slice of a rehearsal row the split needs (fixtures stay small). */
export type RehearsalLike = {
  id: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
};

/** The slice of an event row the split needs. */
export type EventLike = {
  id: string;
  date_from: string;
  date_to?: string | null;
  time?: string | null;
};

/** A rehearsal dated today is still « à venir » until midnight. */
export function isUpcomingRehearsal(rehearsal: RehearsalLike, today: string) {
  return rehearsal.date >= today;
}

/** An event is « à venir » until its last day (its first when it has only one). */
export function isUpcomingEvent(event: EventLike, today: string) {
  return (event.date_to || event.date_from) >= today;
}

const compareIso = (
  a: string | null | undefined,
  b: string | null | undefined,
) => (a ?? "").localeCompare(b ?? "");

/** Upcoming rehearsals soonest first, past rehearsals most recent first. */
export function splitRehearsals<T extends RehearsalLike>(
  rehearsals: readonly T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  const byStart = (a: T, b: T) =>
    compareIso(a.date, b.date) || compareIso(a.start_time, b.start_time);
  const upcoming = rehearsals
    .filter((r) => isUpcomingRehearsal(r, today))
    .sort(byStart);
  const past = rehearsals
    .filter((r) => !isUpcomingRehearsal(r, today))
    .sort((a, b) => byStart(b, a));
  return { upcoming, past };
}

/** Upcoming events soonest first (by first day), past events most recent first. */
export function splitEvents<T extends EventLike>(
  events: readonly T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  const byStart = (a: T, b: T) =>
    compareIso(a.date_from, b.date_from) || compareIso(a.time, b.time);
  const upcoming = events
    .filter((e) => isUpcomingEvent(e, today))
    .sort(byStart);
  const past = events
    .filter((e) => !isUpcomingEvent(e, today))
    .sort((a, b) => byStart(b, a));
  return { upcoming, past };
}

// --- Recurrence ---

/**
 * The dates of a weekly rehearsal: `start`, then every `intervalWeeks`
 * weeks up to and including `until` (compared on the calendar day). An
 * `until` before `start` or an interval under 1 yields no date.
 */
export function recurrenceDates(
  start: Date,
  intervalWeeks: number,
  until: Date,
): Date[] {
  const dates: Date[] = [];
  if (!(intervalWeeks >= 1)) return dates;
  const last = format(until, "yyyy-MM-dd");
  let current = new Date(start);
  while (format(current, "yyyy-MM-dd") <= last) {
    dates.push(new Date(current));
    current = addWeeks(current, intervalWeeks);
  }
  return dates;
}

// --- Payloads: exactly what the previous forms sent ---

export type RehearsalPayload = {
  name: string;
  place: string;
  date: string;
  start_time: string;
  end_time: string;
  group_type: RehearsalFormValues["group_type"];
};

/**
 * The rows a saved rehearsal form writes: one `{ name, place, date,
 * start_time, end_time, group_type }` per date. A single date gives one row;
 * a repeated séance gives one per occurrence (the route accepts both).
 */
export function toRehearsalPayloads(
  values: RehearsalFormValues,
): RehearsalPayload[] {
  const common = {
    name: values.name,
    place: values.place,
    start_time: values.start_time,
    end_time: values.end_time,
    group_type: values.group_type,
  };
  const dates =
    values.repeat && values.repeat_until
      ? recurrenceDates(
          values.date,
          values.repeat_interval,
          values.repeat_until,
        )
      : [values.date];
  return dates.map((date) => ({ ...common, date: format(date, "yyyy-MM-dd") }));
}

/** The event row a saved form writes; the id only on an edit. */
export function toEventPayload(values: EventFormValues): CreateEventDTO;
export function toEventPayload(
  values: EventFormValues,
  id: string,
): UpdateEventDTO;
export function toEventPayload(
  values: EventFormValues,
  id?: string,
): CreateEventDTO | UpdateEventDTO {
  const data: CreateEventDTO = {
    title: values.title,
    date_from: format(values.date_from, "yyyy-MM-dd"),
    date_to: values.date_to ? format(values.date_to, "yyyy-MM-dd") : null,
    time: values.time,
    location: values.location,
    responsible_name: values.responsible_name,
    responsible_email: values.responsible_email || null,
    event_type: values.event_type,
    description: values.description || null,
    link: values.link || null,
    is_public: values.is_public,
  };
  return id ? { id, ...data } : data;
}

// --- Wording ---

export const EVENT_TYPE_LABELS: Record<string, string> = {
  concert: "Concert",
  repetition: "Répétition",
  sejour: "Séjour",
  vente: "Vente",
  autre: "Autre",
};

/** The plain label of an `event_type` enum value. */
export function eventTypeLabel(type: string | null | undefined): string {
  return (type && EVENT_TYPE_LABELS[type]) || "Autre";
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
}

/** « Mardi 7 octobre 2026 » */
export function formatLongDateFr(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return capitalize(format(date, "EEEE d MMMM yyyy", { locale: fr }));
}

/** « 19 h – 21 h 30 »; one side alone when the other is unreadable. */
export function timeRangeFr(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  return [formatTimeFr(start), formatTimeFr(end)].filter(Boolean).join(" – ");
}

/**
 * « Samedi 14 août 2026 », « Du 14 au 16 août 2026 », « Du 30 août au
 * 2 septembre 2026 », « Du 30 déc. 2026 au 2 janv. 2027 ».
 */
export function eventPeriodLabel(event: {
  date_from: string;
  date_to?: string | null;
}): string {
  const from = parseIsoDate(event.date_from);
  const to = event.date_to ? parseIsoDate(event.date_to) : null;
  if (!from) return event.date_from;
  if (!to || event.date_to === event.date_from)
    return formatLongDateFr(event.date_from);
  if (from.getFullYear() !== to.getFullYear()) {
    return `Du ${format(from, "d MMM yyyy", { locale: fr })} au ${format(to, "d MMM yyyy", { locale: fr })}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `Du ${format(from, "d MMMM", { locale: fr })} au ${format(to, "d MMMM yyyy", { locale: fr })}`;
  }
  return `Du ${format(from, "d", { locale: fr })} au ${format(to, "d MMMM yyyy", { locale: fr })}`;
}

/** « 3 répétitions », « 1 répétition », « Aucune répétition ». */
export function rehearsalCountLabel(count: number): string {
  if (count === 0) return "Aucune répétition";
  return `${count} répétition${count > 1 ? "s" : ""}`;
}

/** « 3 événements », « 1 événement », « Aucun événement ». */
export function eventCountLabel(count: number): string {
  if (count === 0) return "Aucun événement";
  return `${count} événement${count > 1 ? "s" : ""}`;
}
