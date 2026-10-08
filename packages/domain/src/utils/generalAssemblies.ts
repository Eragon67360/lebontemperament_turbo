// General assemblies (public.general_assemblies, edited in the admin under
// Association › Assemblée générale, shown at /ag on the website). The AG is
// held in Alsace, so every label and every « is it over? » question uses the
// Paris clock, whatever the server's time zone.
import { parisToday } from "./parisDay";

export const ASSEMBLY_TEXT_MAX = 3000;
export const ASSEMBLY_PLACE_MAX = 200;
export const ASSEMBLY_NOTE_MAX = 500;

const PARIS_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type ParisParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parisParts(date: Date): ParisParts {
  const parts: ParisParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
  for (const part of PARIS_PARTS.formatToParts(date)) {
    if (part.type in parts) {
      parts[part.type as keyof ParisParts] = Number(part.value);
    }
  }
  return parts;
}

/** Paris wall-clock time of an instant, for `<input type="datetime-local">`. */
export function isoToParisLocal(iso: string): string {
  const p = parisParts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Minutes Paris is ahead of UTC at `date` (60 in winter, 120 in summer). */
function parisOffsetMinutes(date: Date): number {
  const p = parisParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round(
    (asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000,
  );
}

/**
 * The instant of a Paris wall-clock time (`YYYY-MM-DDTHH:mm`), as an ISO
 * string. Returns null when the value is not a valid date and time.
 */
export function parisLocalToIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wallAsUtc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  // The offset at the guess, then again at the result (daylight-saving edges).
  let instant = wallAsUtc - parisOffsetMinutes(new Date(wallAsUtc)) * 60000;
  instant = wallAsUtc - parisOffsetMinutes(new Date(instant)) * 60000;
  return new Date(instant).toISOString();
}

/** The Paris calendar day of an instant, YYYY-MM-DD. */
export function assemblyDay(heldAt: string): string {
  return parisToday(new Date(heldAt));
}

/** « Assemblée générale 2026 » */
export function assemblyTitle(heldAt: string): string {
  return `Assemblée générale ${assemblyDay(heldAt).slice(0, 4)}`;
}

const LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « 19h », « 19h30 » */
export function assemblyTimeLabel(heldAt: string): string {
  const p = parisParts(new Date(heldAt));
  return p.minute === 0
    ? `${p.hour}h`
    : `${p.hour}h${String(p.minute).padStart(2, "0")}`;
}

/** « Samedi 14 mars 2026 à 19h » */
export function assemblyDateLabel(heldAt: string): string {
  const day = LONG_DATE.format(new Date(heldAt));
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} à ${assemblyTimeLabel(heldAt)}`;
}

/** « 14 mars 2026 », for the home page button. */
export function assemblyShortDateLabel(heldAt: string): string {
  return SHORT_DATE.format(new Date(heldAt));
}

/**
 * Whether the AG is still ahead: true until the end of its day in Paris, so
 * the home page keeps announcing it on the evening itself.
 */
export function isAssemblyUpcoming(
  heldAt: string,
  now: Date = new Date(),
): boolean {
  return parisToday(now) <= assemblyDay(heldAt);
}
