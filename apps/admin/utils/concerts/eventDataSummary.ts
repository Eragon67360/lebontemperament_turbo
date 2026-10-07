// What the concert dialog shows of the event data Google receives (#328):
// venue, address and entry, as the AI filled them at the last save. Pure, so
// the dialog (a client component) and its test can use it.
import type { Concert } from "@repo/domain/types/concerts";

/** The fields the AI reads: a change to one of them asks it again. */
export const EVENT_DATA_INPUTS = [
  "place",
  "name",
  "additional_informations",
  "affiche",
  "related_link",
] as const;

/** Whether a concert update changes what the AI reads. */
export function touchesEventDataInputs(update: Record<string, unknown>) {
  return EVENT_DATA_INPUTS.some((key) => key in update);
}

export type EventDataLike = Pick<
  Concert,
  | "venue_name"
  | "street_address"
  | "postal_code"
  | "city"
  | "is_free"
  | "price"
  | "event_data_generated_at"
>;

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/**
 * One line, e.g. « Église Saint-Paul, 67200 Strasbourg · Entrée libre », or
 * null when the AI hasn't filled anything yet.
 */
export function eventDataSummary(
  concert: Partial<EventDataLike> | null | undefined,
): string | null {
  if (!concert?.event_data_generated_at) return null;

  const town = [concert.postal_code, concert.city].filter(Boolean).join(" ");
  const address = [concert.venue_name, concert.street_address, town]
    .filter(Boolean)
    .join(", ");

  const price =
    concert.price === null || concert.price === undefined
      ? null
      : Number(concert.price);
  const entry =
    concert.is_free === true
      ? "Entrée libre"
      : price !== null && Number.isFinite(price) && price > 0
        ? `Plein tarif ${euros.format(price)}`
        : concert.is_free === false
          ? "Entrée payante, tarif non trouvé"
          : "Tarif non trouvé";

  return [address || "Adresse non trouvée", entry].join(" · ");
}
