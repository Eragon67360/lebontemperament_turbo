import {
  isAllDayEvent,
  parseAllDayDate,
  parseParisDateTimes,
} from "./datetime.ts";
import type { GoogleCalendarEvent } from "./types.ts";

export interface ResolvedRehearsalTimes {
  date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  rule_id?: string;
}

/** Deterministic default hours for known all-day rehearsal patterns. */
const ALL_DAY_REHEARSAL_RULES = [
  {
    id: "dimanche_bt",
    pattern: /\bdimanche\s+bt\b/i,
    start_time: "09:30",
    end_time: "16:00",
  },
] as const;

function eventSearchText(event: GoogleCalendarEvent): string {
  return [event.summary, event.description, event.location]
    .filter(Boolean)
    .join(" ");
}

/**
 * Resolves rehearsal date/times from Google Calendar fields.
 * Timed events use start/end dateTime. All-day events need a matching rule
 * (e.g. "Dimanche BT" → 09:30–16:00). Returns null when all-day with no rule.
 */
export function resolveRehearsalTimes(
  event: GoogleCalendarEvent,
): ResolvedRehearsalTimes | null {
  if (!isAllDayEvent(event.start)) {
    const times = parseParisDateTimes(event.start, event.end);
    return { ...times, all_day: false };
  }

  const rule = ALL_DAY_REHEARSAL_RULES.find((entry) =>
    entry.pattern.test(eventSearchText(event)),
  );

  if (!rule) {
    return null;
  }

  return {
    date: parseAllDayDate(event.start),
    start_time: rule.start_time,
    end_time: rule.end_time,
    all_day: true,
    rule_id: rule.id,
  };
}
