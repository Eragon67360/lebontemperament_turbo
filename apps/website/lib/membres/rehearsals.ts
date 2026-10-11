import type { MemberRehearsal } from "@/lib/publicConcerts";
import { differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * Rehearsal dates are stored as « YYYY-MM-DD » and mean a local calendar day,
 * so they are parsed as local dates (not UTC, which can shift the day).
 */
export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split("-");
  if (parts.length !== 3) {
    // Fallback to the current date if the format is invalid
    return new Date();
  }
  return new Date(
    parseInt(parts[0]!, 10),
    parseInt(parts[1]!, 10) - 1,
    parseInt(parts[2]!, 10),
  );
}

/** Today's and future rehearsals, earliest first. */
export function upcomingRehearsals(
  rehearsals: MemberRehearsal[],
  today: Date = startOfDay(new Date()),
): MemberRehearsal[] {
  return rehearsals
    .filter(
      (rehearsal) =>
        parseLocalDate(rehearsal.date).getTime() >= today.getTime(),
    )
    .sort(
      (a, b) =>
        parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime() ||
        a.start_time.localeCompare(b.start_time),
    );
}

/** « 09:30:00 » → « 9 h 30 », « 20:00 » → « 20 h ». */
export function formatHour(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours ?? "", 10);
  if (Number.isNaN(hour)) return time;
  const minute = parseInt(minutes ?? "0", 10);
  return minute ? `${hour} h ${String(minute).padStart(2, "0")}` : `${hour} h`;
}

/** « De 9 h 30 à 16 h 30 » (or « À 9 h 30 » when the end is missing). */
export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (start && end) return `De ${formatHour(start)} à ${formatHour(end)}`;
  if (start) return `À ${formatHour(start)}`;
  return "";
}

/** « 20 h – 22 h », for the compact lists. */
export function formatTimeSpan(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (start && end) return `${formatHour(start)} – ${formatHour(end)}`;
  if (start) return formatHour(start);
  return "";
}

/** « Aujourd'hui », « Demain » or « Dans N jours ». */
export function whenLabel(date: Date, today: Date = new Date()): string {
  const days = differenceInCalendarDays(date, today);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

/**
 * The place on one line: « Salle des fêtes, 31A rue des Vignes, 67520
 * Wangen » or « Conservatoire de Strasbourg, Salle 12 ».
 */
export function placeLine(rehearsal: MemberRehearsal): string {
  return [rehearsal.place, rehearsal.room, rehearsal.address]
    .filter(Boolean)
    .join(", ");
}

/** Whether a map search can help: not for a place still « À confirmer ». */
export function hasDirections(rehearsal: MemberRehearsal): boolean {
  if (rehearsal.address) return true;
  return !!rehearsal.place && !/confirmer/i.test(rehearsal.place);
}

/**
 * A Google Maps search for the rehearsal, to open in a new tab: the place
 * name and its street address together, so « Salle des fêtes » alone never
 * lands in the wrong village.
 */
export function mapsUrl(rehearsal: MemberRehearsal): string {
  const query = [rehearsal.place, rehearsal.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
