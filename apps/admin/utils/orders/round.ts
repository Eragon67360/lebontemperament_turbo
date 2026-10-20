// « Ajouter à la tournée »: which round the buyers would join, and the
// sentences that say so. `currentRound` follows add_sale_orders_to_delivery
// (supabase/migrations/20261013222527_orders.sql), whose round the app's
// « Mode livraison » opens too. Pure and unit-tested (round.test.ts).
import type { DriverRound, RoundRow, RoundStop } from "@/utils/orders/types";

/** Keeps « », a date or a count on one line, as French spacing wants. */
const NBSP = "\u00a0";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Opened longer ago than this and still with stops to deliver: probably forgotten. */
const OLD_AFTER_OPENED_MS = 14 * DAY_MS;
/** So is a round whose créneau ended longer ago than this. */
const OLD_AFTER_ENDED_MS = DAY_MS;

/**
 * The round the next add joins, from the driver's latest round (null when they
 * have none), its stops and the title of the sale each stop's order belongs
 * to (by stop id). Null when there is no current round: no round yet, or the
 * latest has stops and every one is delivered, so a new one is opened. An
 * empty latest round is the current one. Undefined when the latest round has
 * no creation date to tell it by.
 */
export function currentRound(
  latest: RoundRow | null,
  recipients: readonly RoundStop[],
  titleByRecipient: ReadonlyMap<string, string>,
): DriverRound | null | undefined {
  if (!latest) return null;
  if (latest.created_at === null) return undefined;

  const stops = recipients.length;
  const delivered = recipients.filter((r) => r.delivered_at !== null).length;
  if (stops > 0 && delivered === stops) return null;

  const sales: string[] = [];
  const inOrder = [...recipients].sort((a, b) => a.sort_order - b.sort_order);
  for (const stop of inOrder) {
    const title = titleByRecipient.get(stop.id)?.trim();
    if (title && !sales.includes(title)) sales.push(title);
  }
  return {
    opened_at: latest.created_at,
    scheduled_at: latest.scheduled_at,
    scheduled_end_at: latest.scheduled_end_at,
    stops,
    delivered,
    sales,
  };
}

/**
 * The round looks forgotten: it still has a stop to deliver and was opened
 * more than 14 days ago, or its créneau (the end, else the start) ended more
 * than a day ago.
 */
export function isOldRound(round: DriverRound, now: Date): boolean {
  if (round.delivered >= round.stops) return false;
  if (now.getTime() - Date.parse(round.opened_at) > OLD_AFTER_OPENED_MS) {
    return true;
  }
  const end = round.scheduled_end_at ?? round.scheduled_at;
  return end !== null && now.getTime() - Date.parse(end) > OLD_AFTER_ENDED_MS;
}

/** A new round is worth offering when the current one has stops: an empty one is as good as new. */
export function offersNewRound(
  round: DriverRound | null | undefined,
): round is DriverRound {
  return !!round && round.stops > 0;
}

const parisFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", ...options });
const DAY_FORMAT = parisFormat({
  weekday: "short",
  day: "numeric",
  month: "short",
});
const DAY_WITH_YEAR_FORMAT = parisFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
});
const YEAR_FORMAT = parisFormat({ year: "numeric" });

/**
 * A day in Paris: « lun. 19 oct. », or « 21 févr. 2025 » (no weekday) when
 * its year isn't the current one.
 */
export function roundDay(iso: string, now: Date): string {
  const date = new Date(iso);
  const day =
    YEAR_FORMAT.format(date) === YEAR_FORMAT.format(now)
      ? DAY_FORMAT.format(date)
      : DAY_WITH_YEAR_FORMAT.format(date);
  return day.replace(/\s/g, NBSP);
}

const quoted = (title: string) => `«${NBSP}${title}${NBSP}»`;

/**
 * « « A » », « « A » et « B » », « « A » et 3 autres ventes », or nothing
 * when the stops were all added in the app.
 */
function salesPhrase(sales: readonly string[]): string {
  const [first, second] = sales;
  if (first === undefined) return "";
  if (second === undefined) return quoted(first);
  if (sales.length === 2) return `${quoted(first)} et ${quoted(second)}`;
  return `${quoted(first)} et ${sales.length - 1}${NBSP}autres ventes`;
}

/** « 1 destinataire, aucun livré », « 4 destinataires, 2 livrés », « 3 destinataires, tous livrés ». */
function progressPhrase(stops: number, delivered: number): string {
  const recipients = `${stops}${NBSP}${stops < 2 ? "destinataire" : "destinataires"}`;
  if (delivered === 0) return `${recipients}, aucun livré`;
  if (delivered >= stops) {
    return `${recipients}, ${stops < 2 ? "livré" : "tous livrés"}`;
  }
  return `${recipients}, ${delivered}${NBSP}${delivered < 2 ? "livré" : "livrés"}`;
}

/**
 * The note under the driver select: whose round the buyers join. `undefined`
 * (the round could not be read) keeps the generic sentence; `null` says a new
 * round is created. With `newRound` (« Nouvelle tournée » ticked) the buyers
 * go to a new round instead of the one described.
 */
export function roundLine(
  round: DriverRound | null | undefined,
  now: Date,
  newRound = false,
): string {
  if (round === undefined) {
    return "Sa tournée en cours dans l'application, ou une nouvelle.";
  }
  if (round === null) {
    return `Pas de tournée en cours${NBSP}: une nouvelle sera créée.`;
  }
  const day = roundDay(round.opened_at, now);
  if (round.stops === 0) {
    return `Sa tournée en cours est vide (ouverte le ${day})${NBSP}: les acheteurs y seront ajoutés.`;
  }
  const sales = salesPhrase(round.sales);
  const next = newRound
    ? "Les acheteurs iront dans une nouvelle tournée."
    : "Les acheteurs s'y ajoutent.";
  return `Tournée en cours${NBSP}: ${sales ? `${sales}, ` : ""}ouverte le ${day}, ${progressPhrase(round.stops, round.delivered)}. ${next}`;
}

/** Why a round that looks forgotten (see `isOldRound`) deserves a second thought. */
export function oldRoundWarning(round: DriverRound, now: Date): string {
  const left = round.stops - round.delivered;
  const recipients =
    left < 2
      ? `${left}${NBSP}destinataire non livré`
      : `${left}${NBSP}destinataires non livrés`;
  return `Elle date du ${roundDay(round.opened_at, now)} et a encore ${recipients}. Pour une autre livraison, cochez ${quoted("Nouvelle tournée")}.`;
}
