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
 * What the Google event's `location` should say for this row: the address,
 * with the place's short name in front unless the address already names it,
 * then the room. Empty when the row only holds the placeholder.
 */
export function locationFromRow(
  row: Pick<RehearsalRow, "place" | "address" | "room">,
): string {
  const place = row.place.trim();
  const address = (row.address ?? "").trim();
  const room = (row.room ?? "").trim();

  let base = "";
  if (address) {
    // « Salle des fêtes, Nordheim » + « Salle des fêtes, place de la Mairie… »:
    // the address already names the place, so it stands alone.
    const shortName = fold(place.split(",")[0]);
    base =
      shortName && fold(address).includes(shortName)
        ? address
        : `${place}, ${address}`;
  } else if (place && place !== PLACEHOLDER_PLACE) {
    base = place;
  }
  if (!base) return "";
  return room ? `${base}, ${room}` : base;
}

/** True when two location texts say the same thing (case, accents, spacing). */
export function sameLocation(a: string, b: string): boolean {
  return fold(a) === fold(b);
}
