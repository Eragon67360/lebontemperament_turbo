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

/**
 * What the agenda's MusicEvent JSON-LD adds to each concert (#328): the
 * venue, address and price the AI fills when an admin saves a concert.
 */
export const CONCERT_EVENT_DATA_COLUMNS =
  "venue_name, street_address, postal_code, city, country, is_free, price";
export type PublicConcertEventData = Pick<
  Concert,
  | "venue_name"
  | "street_address"
  | "postal_code"
  | "city"
  | "country"
  | "is_free"
  | "price"
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

/**
 * Events as the agenda and the members area show them (`/api/events`): the
 * whole `Event` view-model, which the UI needs in full (`date_to`, contact,
 * link, description all render).
 */
export const EVENT_COLUMNS =
  "id, title, date_from, date_to, time, location, responsible_name, responsible_email, event_type, description, link, is_public, created_at, updated_at";

/** The members' calendar lists rehearsals by group, place and time. */
export const MEMBER_REHEARSAL_COLUMNS =
  "id, name, date, start_time, end_time, place, group_type";
export type MemberRehearsal = Pick<
  Rehearsal,
  "id" | "name" | "date" | "start_time" | "end_time" | "place" | "group_type"
>;
