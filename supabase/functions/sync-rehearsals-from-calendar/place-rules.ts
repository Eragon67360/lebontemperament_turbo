import type { GoogleCalendarEvent, GroupType, LlmExtraction } from "./types.ts";

/**
 * Where the choir always rehearses. The Google event often carries only the
 * village (« Nordheim »), which sends « Itinéraire » to the middle of the
 * village, so these rehearsals get their real address whatever the AI said.
 *
 * Sources (checked 2026-10-09; confirm with the association before relying on
 * a house number):
 * - Nordheim: nordheim.fr, « Salle des fêtes », place de la Mairie (no number
 *   published; the town hall is 8 place de la Mairie, 67520).
 * - Wangen salle des fêtes: jds.fr, « Salle polyvalente », rue des Vignes,
 *   67520 (no number published).
 * - Freihof: Mappy, « Le Refuge Freihof », 45 rue des Vignerons, 67520 Wangen.
 * - Conservatoire: strasbourg.eu, 1 place Dauphine, Strasbourg.
 */
export interface KnownPlace {
  id: string;
  /** The situation, in French, for the AI prompt. */
  when: string;
  /** Short name shown with the rehearsal. */
  place: string;
  /** Complete address handed to the maps app. */
  address: string;
  /** Word (accent- and case-folded) the event text must mention. */
  keyword: string;
  /** The rehearsal's group; omitted = any group. */
  groups?: readonly GroupType[];
}

export const KNOWN_PLACES: readonly KnownPlace[] = [
  {
    id: "nordheim_salle_des_fetes",
    when: "Nordheim, répétition des femmes",
    place: "Salle des fêtes, Nordheim",
    address: "Salle des fêtes, place de la Mairie, 67520 Nordheim",
    keyword: "nordheim",
    groups: ["Femmes"],
  },
  {
    id: "wangen_salle_des_fetes",
    when: "Wangen, répétition du chœur complet (dimanche)",
    place: "Salle des fêtes, Wangen",
    address: "Salle des fêtes, rue des Vignes, 67520 Wangen",
    keyword: "wangen",
    groups: ["Choeur complet"],
  },
  {
    id: "wangen_freihof",
    when: "Wangen, répétition des hommes (samedi)",
    place: "Freihof, Wangen",
    address: "Le Freihof, 45 rue des Vignerons, 67520 Wangen",
    keyword: "wangen",
    groups: ["Hommes"],
  },
  {
    id: "conservatoire_strasbourg",
    when: "Conservatoire de Strasbourg (orchestre)",
    place: "Conservatoire de Strasbourg",
    address: "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg",
    keyword: "conservatoire",
  },
];

/** « Salle 12 », « salle B12 », « Salle n° 104 »: a room inside a building. */
const ROOM_PATTERN = /\bsalle\s+(?:n[°o]\s*)?([A-Za-z]?\d{1,3}[A-Za-z]?)\b/i;

/** The « lieux habituels » lines of the AI prompt, from KNOWN_PLACES. */
export function knownPlacesPrompt(): string {
  return KNOWN_PLACES.map(
    (known) =>
      `  - ${known.when} → place "${known.place}", address "${known.address}".`,
  ).join("\n");
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** « Salle 12 » when the text names a numbered room, else null. */
export function findRoom(...texts: Array<string | undefined>): string | null {
  for (const text of texts) {
    const match = text ? ROOM_PATTERN.exec(text) : null;
    if (match) return `Salle ${match[1].toUpperCase()}`;
  }
  return null;
}

/** The text without its numbered room, and without the separator it leaves. */
export function removeRoom(text: string): string {
  return text
    .replace(new RegExp(`[\\s,;:(–-]*${ROOM_PATTERN.source}[)\\s]*`, "i"), " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:–-]+|[\s,;:–-]+$/g, "")
    .trim();
}

/** True when the text already looks like a street address (it has a number). */
function hasStreetNumber(text: string): boolean {
  return /\d/.test(text);
}

/**
 * The known place this event is at, or null. An admin who typed a full
 * address (with a street number) is never overridden.
 */
export function matchKnownPlace(
  event: GoogleCalendarEvent,
  group: GroupType,
): KnownPlace | null {
  const location = removeRoom(event.location ?? "");
  if (hasStreetNumber(location)) return null;

  const text = fold(
    [event.summary, location, event.description].filter(Boolean).join(" "),
  );
  return (
    KNOWN_PLACES.find(
      (candidate) =>
        text.includes(candidate.keyword) &&
        (!candidate.groups || candidate.groups.includes(group)),
    ) ?? null
  );
}

/**
 * Settles place, address and room after the AI answered:
 * - the room is moved out of place and address into its own field;
 * - a known place replaces whatever the AI wrote for place and address;
 * - elsewhere the AI's address is kept only for a rehearsal, as is.
 */
export function applyPlaceRules(
  event: GoogleCalendarEvent,
  result: LlmExtraction,
): LlmExtraction {
  if (!result.is_rehearsal) return result;

  const room =
    findRoom(event.location, event.description, event.summary) ??
    (result.room.trim() || "");
  const settled: LlmExtraction = {
    ...result,
    place: removeRoom(result.place) || result.place,
    address: removeRoom(result.address),
    room,
  };

  const known = matchKnownPlace(event, settled.group_type);
  if (known) {
    return { ...settled, place: known.place, address: known.address };
  }
  return settled;
}
