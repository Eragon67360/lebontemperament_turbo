import type { GroupType } from "@repo/domain/types/rehearsals";
import { normalize } from "./directory";

/**
 * The voices of « Les Pupitres »: each member's voice gives their colour,
 * their place in the choir and the rehearsals that concern them. A voice is
 * free text from the roster (« Alte », « Orchestre & Ténor », « jeune &
 * basse »), so everything here reads words, never exact values.
 */
export type VoiceKey =
  "soprane" | "alte" | "tenor" | "basse" | "orchestre" | "jeune";

/** Choir voices first: they decide the colour of « Orchestre & Alte ». */
const ORDER: readonly VoiceKey[] = [
  "soprane",
  "alte",
  "tenor",
  "basse",
  "orchestre",
  "jeune",
];

const WORDS: Record<VoiceKey, readonly string[]> = {
  soprane: ["soprane", "sopranes", "soprano"],
  alte: ["alte", "altes", "alto"],
  tenor: ["tenor", "tenors"],
  basse: ["basse", "basses", "baryton"],
  orchestre: ["orchestre", "musicien", "musicienne"],
  jeune: ["jeune", "jeunes", "enfant", "enfants"],
};

/** Plural labels, as members say them (« Ta voix · Altes »). */
export const VOICE_LABEL: Record<VoiceKey, string> = {
  soprane: "Sopranes",
  alte: "Altes",
  tenor: "Ténors",
  basse: "Basses",
  orchestre: "Orchestre",
  jeune: "Jeunes",
};

/** Every voice a roster value names, in the order above. */
export function voiceKeys(voice: string | null | undefined): VoiceKey[] {
  const words = normalize(voice ?? "")
    .split(/[^a-z]+/)
    .filter(Boolean);
  return ORDER.filter((key) => WORDS[key].some((w) => words.includes(w)));
}

/** The voice that gives a member their colour, or null when unknown. */
export function mainVoice(voice: string | null | undefined): VoiceKey | null {
  return voiceKeys(voice)[0] ?? null;
}

/** « Altes · Orchestre » for « Orchestre & Alte ». */
export function voicesLabel(voice: string | null | undefined): string {
  return voiceKeys(voice)
    .map((key) => VOICE_LABEL[key])
    .join(" · ");
}

/**
 * The rehearsal groups that concern a member, as the mobile app counts them
 * (`groupsConcerning` in my_groups_provider.dart): their own ensembles,
 * « Tous », and the full choir for the men and the women. Null when the
 * voice says nothing: then every rehearsal concerns them.
 */
export function groupsForVoice(
  voice: string | null | undefined,
): Set<GroupType> | null {
  const keys = voiceKeys(voice);
  const mine = new Set<GroupType>();
  if (keys.includes("soprane") || keys.includes("alte")) mine.add("Femmes");
  if (keys.includes("tenor") || keys.includes("basse")) mine.add("Hommes");
  if (keys.includes("orchestre")) mine.add("Orchestre");
  if (keys.includes("jeune")) mine.add("Jeunes/Enfants");
  if (mine.size === 0) return null;
  mine.add("Tous");
  if (mine.has("Femmes") || mine.has("Hommes")) mine.add("Choeur complet");
  return mine;
}

/** The score folder (`drive_folders.slug`) a member most likely wants. */
export function scoreFolderFor(
  voice: string | null | undefined,
): string | null {
  const keys = voiceKeys(voice);
  if (keys.includes("jeune")) return "jeunes";
  if (keys.some((k) => k !== "orchestre")) return "adultes";
  if (keys.includes("orchestre")) return "orchestre";
  return null;
}
