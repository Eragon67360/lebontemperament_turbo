/**
 * The musical mark of each /40-ans section, by its element id. The media
 * sections are the four movements of the work; the timeline opens it and
 * the memory form closes it.
 */
export const SECTION_MARKS: Record<string, string> = {
  timeline: "Prélude",
  videos: "I · Allegro",
  audio: "II · Andante",
  photos: "III · Scherzo",
  archives: "IV · Adagio",
  memories: "Coda",
};

/**
 * Navigation cards name their target in the admin; the audio section's id
 * is `audio`, while cards created before this page used `audios`.
 */
const SECTION_ALIASES: Record<string, string> = { audios: "audio" };

export function sectionId(target: string): string {
  return SECTION_ALIASES[target] ?? target;
}
