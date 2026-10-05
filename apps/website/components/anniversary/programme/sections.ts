/**
 * The /40-ans sections as the parts of a concert programme, by element id:
 * the part named above each section and the small-caps mark of its line in
 * « Au programme ».
 */
export const PROGRAMME_PARTS: Record<string, { part: string; mark: string }> = {
  timeline: { part: "Première partie", mark: "1987 — 2027" },
  videos: { part: "Deuxième partie", mark: "Revoir" },
  audio: { part: "Troisième partie", mark: "Réécouter" },
  photos: { part: "Quatrième partie", mark: "Feuilleter" },
  archives: { part: "Cinquième partie", mark: "Documents" },
  memories: { part: "Livre d’or", mark: "Souvenirs" },
};

/**
 * Navigation cards name their target in the admin; the audio section's id
 * is `audio`, while cards created before this page used `audios`.
 */
const SECTION_ALIASES: Record<string, string> = { audios: "audio" };

export function sectionId(target: string): string {
  return SECTION_ALIASES[target] ?? target;
}
