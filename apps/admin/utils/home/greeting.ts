// The home's first lines: « Bonjour » or « Bonsoir », today's date and one
// sentence, which counts down to the next concert when there is one. Pure
// and unit-tested; the header feeds it the admin's clock and the concerts.
import { concertTitle } from "@/utils/concerts/schedule";
import { countdownFr, daysUntil } from "@/utils/home/nextConcert";
import { formatDayFr } from "@/utils/home/upcoming";

/** From this hour (admin's local time) the home says « Bonsoir ». */
export const EVENING_HOUR = 18;

/** « Bonjour » before 18 h, « Bonsoir » from 18 h. */
export function greetingFr(now: Date): "Bonjour" | "Bonsoir" {
  return now.getHours() >= EVENING_HOUR ? "Bonsoir" : "Bonjour";
}

/** The sentence when no concert is coming. */
export const DEFAULT_INTRO = "Voici ce qui vous attend.";

/**
 * « Mercredi 7 octobre. » then « Plus que 39 jours avant « Entre terre et
 * ciel ». » (or « C’est demain : … », « C’est aujourd’hui : … »), or the
 * default sentence when no concert is coming. `concert` undefined means the
 * concerts are still loading: the date alone, so nothing flips once they
 * arrive.
 */
export function homeIntroFr(
  now: Date,
  concert:
    | { name?: string | null; place?: string | null; date: string }
    | null
    | undefined,
): { date: string; sentence: string | null } {
  const date = `${formatDayFr(now, now)}.`;
  if (concert === undefined) return { date, sentence: null };
  const countdown = concert
    ? countdownFr(daysUntil(concert.date, now), concertTitle(concert))
    : null;
  return { date, sentence: countdown ?? DEFAULT_INTRO };
}
