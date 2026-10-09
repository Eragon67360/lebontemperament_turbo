import { KNOWN_PLACES } from "./place-rules.ts";
import type { GoogleCalendarEvent, RehearsalRow } from "./types.ts";

/** Two timestamps closer than this are the same database statement. */
const SAME_STATEMENT_MS = 1000;

/** The placeholder admins know; never written into a calendar. */
const PLACEHOLDER_PLACE = "À confirmer";

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s,;.]+$/g, "")
    .trim();
}

/**
 * True when someone edited the row by hand (admin panel) after the sync last
 * wrote or confirmed it: the table's trigger sets `updated_at` on every update
 * and the sync stamps `calendar_synced_at` in the same statement, so a later
 * `updated_at` can only be an edit.
 */
export function editedByHand(row: RehearsalRow): boolean {
  if (!row.calendar_synced_at || !row.updated_at) return false;
  return (
    Date.parse(row.updated_at) - Date.parse(row.calendar_synced_at) >
    SAME_STATEMENT_MS
  );
}

/**
 * The admin's edit wins only while Google has not changed since: if the event
 * was edited in Google after the admin's edit, the calendar is the newer word
 * and the normal sync (calendar → database) applies.
 */
export function adminEditIsNewest(
  row: RehearsalRow,
  event: GoogleCalendarEvent,
): boolean {
  return (
    editedByHand(row) && Date.parse(event.updated) <= Date.parse(row.updated_at)
  );
}

/**
 * What the Google event's `location` should say for this row, or `null` when
 * the row cannot be trusted to name one place (nothing is written then).
 *
 * The admin form of release 2.0.140 changes `place` and leaves `address`
 * alone, so an edited row can carry the address of the place it used to be:
 *
 * - the place is a known place: its own address, whatever the row holds;
 * - the address names the place (« Le Freihof, 45 rue… » for « Freihof,
 *   Wangen »): the address;
 * - the address is a known place's address but the place is another one: the
 *   address is stale, the place alone is written;
 * - no address: the place;
 * - any other address (a street for a place that does not name it): the
 *   place then the address when Google does not say that street yet (typed
 *   with the place), `null` when it does (it may be the old place's).
 *
 * The room is added at the end. Empty when the row only holds the
 * placeholder.
 */
export function locationFromRow(
  row: Pick<RehearsalRow, "place" | "address" | "room">,
  currentLocation = "",
): string | null {
  const place = row.place.trim();
  const address = (row.address ?? "").trim();
  const room = (row.room ?? "").trim();

  let base: string;
  if (place === PLACEHOLDER_PLACE || !place) {
    return "";
  } else if (!address) {
    base = place;
  } else {
    const known = KNOWN_PLACES.find(
      (candidate) => fold(candidate.place) === fold(place),
    );
    const shortName = fold(place.split(",")[0]);
    if (known) {
      base = known.address;
    } else if (shortName && fold(address).includes(shortName)) {
      base = address;
    } else if (
      KNOWN_PLACES.some(
        (candidate) => fold(candidate.address) === fold(address),
      )
    ) {
      base = place;
    } else if (fold(currentLocation).includes(fold(address.split(",")[0]))) {
      // Google already says this street: the address was not typed with the
      // new place, so it may be the old place's.
      return null;
    } else {
      base = `${place}, ${address}`;
    }
  }
  return room ? `${base}, ${room}` : base;
}

/** True when two location texts say the same thing (case, accents, spacing). */
export function sameLocation(a: string, b: string): boolean {
  return fold(a) === fold(b);
}
