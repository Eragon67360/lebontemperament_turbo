import type { VoiceKey } from "@/lib/membres/voices";
import { mainVoice } from "@/lib/membres/voices";
import type { GroupType } from "@repo/domain/types/rehearsals";

/**
 * The colours of « Les Pupitres », in one place. Each voice has a bright
 * fill (ink text, the same in both themes: avatars, the seating plan, the
 * home's big block) and a soft tint for panels (ink text in the light theme,
 * pale text in the dark one). Every coloured thing also says its name, so
 * colour is never the only cue. (Full class names on purpose: Tailwind only
 * generates what it can read.)
 */
export const VOICE_FILL: Record<VoiceKey | "none", string> = {
  soprane: "bg-[#ff8e72] text-[#17171c]",
  alte: "bg-[#ffc94a] text-[#17171c]",
  tenor: "bg-[#7db8f5] text-[#17171c]",
  basse: "bg-[#6ccb96] text-[#17171c]",
  orchestre: "bg-[#c3a6f2] text-[#17171c]",
  jeune: "bg-[#7fd3cf] text-[#17171c]",
  none: "bg-[#d9d9df] text-[#17171c]",
};

/** The raw fill colours, for the seating plan's dots. */
export const VOICE_HEX: Record<VoiceKey | "none", string> = {
  soprane: "#ff8e72",
  alte: "#ffc94a",
  tenor: "#7db8f5",
  basse: "#6ccb96",
  orchestre: "#c3a6f2",
  jeune: "#7fd3cf",
  none: "#d9d9df",
};

export const VOICE_TINT: Record<VoiceKey | "none", string> = {
  soprane: "bg-[#ffe6de] dark:bg-[#3a241e]",
  alte: "bg-[#fff4d6] dark:bg-[#3a3020]",
  tenor: "bg-[#e2effd] dark:bg-[#1e2a3a]",
  basse: "bg-[#ddf3e6] dark:bg-[#1e3326]",
  orchestre: "bg-[#efe7fc] dark:bg-[#2c2440]",
  jeune: "bg-[#ddf4f3] dark:bg-[#1d3333]",
  none: "bg-members-band",
};

/** A member's fill, from their roster voice (grey when unknown). */
export function voiceFill(voice: string | null | undefined): string {
  return VOICE_FILL[mainVoice(voice) ?? "none"];
}

/** Soft chips (events, concerts): a tint with ink text, pale in the dark. */
export const TONES = {
  red: "bg-[#ffe6de] text-[#17171c] dark:bg-[#3a241e] dark:text-[#ffd2c5]",
  rose: "bg-[#ffe6de] text-[#17171c] dark:bg-[#3a241e] dark:text-[#ffd2c5]",
  orange: "bg-[#fff4d6] text-[#17171c] dark:bg-[#3a3020] dark:text-[#ffe3a3]",
  amber: "bg-[#fff4d6] text-[#17171c] dark:bg-[#3a3020] dark:text-[#ffe3a3]",
  green: "bg-[#ddf3e6] text-[#17171c] dark:bg-[#1e3326] dark:text-[#b5e8cb]",
  teal: "bg-[#ddf4f3] text-[#17171c] dark:bg-[#1d3333] dark:text-[#b7ecea]",
  blue: "bg-[#e2effd] text-[#17171c] dark:bg-[#1e2a3a] dark:text-[#bfdcfb]",
  purple: "bg-[#efe7fc] text-[#17171c] dark:bg-[#2c2440] dark:text-[#ddcdf9]",
  slate: "bg-members-band text-foreground",
  ink: "bg-members-ink text-members-ink-foreground",
} as const;

export type Tone = keyof typeof TONES;

/**
 * Rehearsal groups: the women take the sopranos' coral, the men the tenors'
 * blue, the orchestra its lilac; the full choir is ink, everyone grey.
 */
export const GROUP_TONE: Record<GroupType, Tone> = {
  "Choeur complet": "ink",
  Orchestre: "purple",
  Hommes: "blue",
  Femmes: "rose",
  "Jeunes/Enfants": "teal",
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
