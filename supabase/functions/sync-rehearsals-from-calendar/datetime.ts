import type { GoogleCalendarDate } from "./types.ts";

const PARIS_TIME_ZONE = "Europe/Paris";

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function formatParisDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
}

function formatParisTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return `${getPart(parts, "hour")}:${getPart(parts, "minute")}`;
}

function parseDateTime(
  value: GoogleCalendarDate | undefined,
  label: string,
): Date {
  if (!value?.dateTime) {
    throw new Error(`Google Calendar event is missing ${label}.dateTime.`);
  }

  const parsed = new Date(value.dateTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Google Calendar event has invalid ${label}.dateTime.`);
  }

  return parsed;
}

export function getParisToday(now = new Date()): string {
  return formatParisDate(now);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function parseParisDateTimes(
  start: GoogleCalendarDate | undefined,
  end: GoogleCalendarDate | undefined,
): { date: string; start_time: string; end_time: string } {
  const startDate = parseDateTime(start, "start");
  const endDate = parseDateTime(end, "end");

  return {
    date: formatParisDate(startDate),
    start_time: formatParisTime(startDate),
    end_time: formatParisTime(endDate),
  };
}
