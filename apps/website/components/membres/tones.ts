import type { GroupType } from "@repo/domain/types/rehearsals";

/**
 * The members area's chip colours, in one place: a pale tint with dark text
 * in the light theme, a deep tint with pale text in the dark one. No purple.
 * Every chip also carries its text label, so colour is never the only cue.
 * (Full class names on purpose: Tailwind only generates what it can read.)
 */
export const TONES = {
  red: "bg-[#fdecec] text-[#8f2b2b] dark:bg-[#3d1f1f] dark:text-[#f5b8b8]",
  rose: "bg-[#fbe7ef] text-[#8a2350] dark:bg-[#3d1c2b] dark:text-[#f2b0ca]",
  orange: "bg-[#fcebdc] text-[#8a3f10] dark:bg-[#3d2512] dark:text-[#f3bf96]",
  amber: "bg-[#fbf0dc] text-[#7a5210] dark:bg-[#38290d] dark:text-[#f0cd84]",
  green: "bg-[#e4eee2] text-[#2f5d2a] dark:bg-[#1d3019] dark:text-[#aedaa7]",
  teal: "bg-[#e1f0f0] text-[#105155] dark:bg-[#17393b] dark:text-[#9fdadd]",
  blue: "bg-[#e3f0fb] text-[#1d5b8f] dark:bg-[#17304a] dark:text-[#a3cdf0]",
  slate: "bg-[#eaeff0] text-[#34484a] dark:bg-[#26393a] dark:text-[#cfdcdd]",
} as const;

export type Tone = keyof typeof TONES;

/** Rehearsal groups: one tone each, and the words members read. */
export const GROUP_TONE: Record<GroupType, Tone> = {
  "Choeur complet": "red",
  Orchestre: "amber",
  Hommes: "blue",
  Femmes: "rose",
  "Jeunes/Enfants": "green",
  Tous: "slate",
};

export const GROUP_LABEL: Record<GroupType, string> = {
  "Choeur complet": "Chœur complet",
  Orchestre: "Orchestre",
  Hommes: "Hommes",
  Femmes: "Femmes",
  "Jeunes/Enfants": "Jeunes et enfants",
  Tous: "Pour tous",
};

/** Voices in the directory (free text such as « Alte », « Orchestre & Ténor »). */
export function voiceTone(voice: string | null | undefined): Tone {
  const text = (voice ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (text.includes("soprane")) return "rose";
  if (text.includes("alte")) return "orange";
  if (text.includes("tenor")) return "blue";
  if (text.includes("basse")) return "green";
  if (text.includes("orchestre")) return "amber";
  if (text.includes("jeune") || text.includes("enfant")) return "teal";
  return "slate";
}
