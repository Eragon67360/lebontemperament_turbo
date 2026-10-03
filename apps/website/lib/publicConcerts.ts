import type { Concert, Tour } from "@repo/domain/types/concerts";
import type { Rehearsal } from "@repo/domain/types/rehearsals";

/**
 * Column lists for the public agenda (`/concerts`): only what the page shows.
 * `Pick` types next to each list keep the client component honest about what
 * it receives; the typed Supabase client checks the strings against them.
 */

export const CONCERT_COLUMNS =
  "id, name, place, date, time, context, additional_informations, affiche, tour_id, related_link";
export type PublicConcert = Pick<
  Concert,
  | "id"
  | "name"
  | "place"
  | "date"
  | "time"
  | "context"
  | "additional_informations"
  | "affiche"
  | "tour_id"
  | "related_link"
>;

export const TOUR_COLUMNS =
  "id, name, description, context, tour_poster, start_date, end_date";
export type PublicTour = Pick<
  Tour,
  | "id"
  | "name"
  | "description"
  | "context"
  | "tour_poster"
  | "start_date"
  | "end_date"
>;

/** The agenda only shows the date of the next rehearsal. */
export const REHEARSAL_COLUMNS = "id, date";
export type PublicRehearsal = Pick<Rehearsal, "id" | "date">;
