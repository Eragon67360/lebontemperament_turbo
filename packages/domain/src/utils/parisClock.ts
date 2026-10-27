// The clock of a delivery day, as the recipients read it: Paris wall-clock
// time in the « 9 h 15 » style, whatever the device's own zone says (the
// people we deliver to are in Alsace). The pushes
// (supabase/functions/_shared/delivery-messages.ts) and the app
// (`parisTime` in delivery_tracking.dart) keep their own copies of these two
// rules, pinned by the same test vectors as parisClock.test.ts.
const PARIS_CLOCK = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** « 9 h 15 », « 14 h », « 0 h 05 »: the Paris wall-clock time of `date`. */
export function frenchClock(date: Date): string {
  const parts = PARIS_CLOCK.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const hours = String(Number(part("hour")));
  const minutes = part("minute");
  return minutes === "00" ? `${hours} h` : `${hours} h ${minutes}`;
}

const QUARTER_MS = 15 * 60 * 1000;

/**
 * The window announced around a scheduled instant: rounded to the nearest
 * quarter hour, then ±15 min (09:29 → 09:15–09:45), as the SMS and the
 * pushes announce it.
 */
export function roundedWindow(scheduledAt: Date): { start: Date; end: Date } {
  const rounded = Math.round(scheduledAt.getTime() / QUARTER_MS) * QUARTER_MS;
  return {
    start: new Date(rounded - QUARTER_MS),
    end: new Date(rounded + QUARTER_MS),
  };
}
