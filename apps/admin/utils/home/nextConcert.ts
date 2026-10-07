// « Prochain concert » on the home and the countdown in its greeting: which
// concert comes next, in how many days, and the French wording of its facts.
// Pure and unit-tested; the home feeds it the concerts query it already has.
import {
  contextLabel,
  formatTimeFr,
  parseIsoDate,
  splitConcerts,
  todayIso,
  type ConcertLike,
} from "@/utils/concerts/schedule";
import { formatDayFr } from "@/utils/home/upcoming";

/** The slice of a concert row the card needs (fixtures stay small). */
export type NextConcertLike = ConcertLike & {
  affiche?: string | null;
  is_free?: boolean | null;
  price?: number | null;
};

/**
 * The first concert still to come, by the admin's local day: a concert dated
 * today is still the next one until midnight, as on the concerts page.
 */
export function pickNextConcert<T extends ConcertLike>(
  concerts: readonly T[] | undefined,
  now: Date = new Date(),
): T | null {
  if (!concerts?.length) return null;
  return splitConcerts(concerts, todayIso(now)).upcoming[0] ?? null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days from today to the concert's day (0 today, 1 tomorrow),
 * counted on local days so a daylight-saving change never shifts it; null
 * when the date is unreadable.
 */
export function daysUntil(
  dateIso: string,
  now: Date = new Date(),
): number | null {
  const day = parseIsoDate(dateIso);
  const today = parseIsoDate(todayIso(now));
  if (!day || !today) return null;
  return Math.round((day.getTime() - today.getTime()) / DAY_MS);
}

/**
 * « Plus que 39 jours avant « Entre terre et ciel ». », « C'est demain :
 * « … ». », « C'est aujourd'hui : « … ». »; null for a past or unreadable date.
 */
export function countdownFr(days: number | null, title: string): string | null {
  if (days === null || days < 0) return null;
  if (days === 0) return `C’est aujourd’hui : « ${title} ».`;
  if (days === 1) return `C’est demain : « ${title} ».`;
  return `Plus que ${days} jours avant « ${title} ».`;
}

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/**
 * The card's two meta lines: « Dimanche 15 novembre · 20 h 30 · Église
 * Saint-Paul », then what else the row knows (the formation, the entry:
 * « Orchestre et chœur · Entrée libre »), or null when it knows nothing more.
 */
export function concertMetaFr(
  concert: NextConcertLike,
  now: Date = new Date(),
): { when: string; details: string | null } {
  const date = parseIsoDate(concert.date);
  const when = [
    date ? formatDayFr(date, now) : null,
    formatTimeFr(concert.time) || null,
    concert.place?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const formation =
    concert.context && concert.context !== "autre"
      ? contextLabel(concert.context)
      : null;
  const price =
    concert.price === null || concert.price === undefined
      ? null
      : Number(concert.price);
  const entry =
    concert.is_free === true
      ? "Entrée libre"
      : price !== null && Number.isFinite(price) && price > 0
        ? `Plein tarif ${euros.format(price)}`
        : null;
  const details = [formation, entry].filter(Boolean).join(" · ");

  return { when, details: details || null };
}

const DEFAULT_WEBSITE_URL = "https://www.lebontemperament.com";

/**
 * The public concerts page. A concert has no page of its own on the site
 * (`/concerts/[slug]` is a concert story), so « Voir sur le site » opens the
 * list, where the next concert is the featured one.
 */
export function siteConcertsUrl(
  base: string | undefined = process.env.NEXT_PUBLIC_WEBSITE_URL,
): string {
  return `${(base || DEFAULT_WEBSITE_URL).replace(/\/+$/, "")}/concerts`;
}
