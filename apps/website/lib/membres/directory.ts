import { foldAccents } from "@repo/domain/utils/slug";

/** One member as `/api/membres` returns them (« Prénom NOM » in one field). */
export interface Member {
  "NOM Prénom": string;
  "Adresse mail": string;
  Voix: string;
  photoUrl?: string;
}

/**
 * Lower case without accents or ligatures, to compare and sort « Élise »
 * with « elise » and « Lœb » with « loeb ».
 */
export function normalize(text: string): string {
  return foldAccents(text).toLowerCase();
}

const isUpperWord = (word: string) =>
  word === word.toUpperCase() && word !== word.toLowerCase();

/**
 * The family name of « Prénom NOM »: the trailing UPPERCASE word(s), or the
 * last word when none is in capitals. « Anne-Sophie KLEIN » → « KLEIN »,
 * « Jean DE LA FONTAINE » → « DE LA FONTAINE ».
 */
export function lastNameOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  let start = words.length;
  while (start > 0 && isUpperWord(words[start - 1]!)) start--;
  // No capitals at all, or everything in capitals: the last word.
  if (start === words.length || start === 0) return words[words.length - 1]!;
  return words.slice(start).join(" ");
}

/** The voice words found in the data (« jeune & basse » → jeune, basse). */
export function extractVoiceWords(voices: string[]): string[] {
  const words = new Set<string>();
  for (const voice of voices) {
    if (!voice) continue;
    for (const part of voice.toLowerCase().split(/[&\s,]+/)) {
      if (part.trim().length > 0) words.add(part.trim());
    }
  }
  return Array.from(words).sort();
}

/** The words of a member's voice, normalized. */
function voiceTokens(voice: string): string[] {
  return normalize(voice)
    .split(/[&\s,]+/)
    .filter(Boolean);
}

export function hasVoice(member: Member, word: string): boolean {
  return voiceTokens(member.Voix).includes(normalize(word));
}

const VOICE_LABELS: Record<string, string> = {
  soprane: "Sopranes",
  alte: "Altes",
  tenor: "Ténors",
  basse: "Basses",
  orchestre: "Orchestre",
};

/** The label of a voice filter: « soprane » → « Sopranes », unknown words as-is. */
export function voiceFilterLabel(word: string): string {
  const known = VOICE_LABELS[normalize(word)];
  if (known) return known;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Name, e-mail or voice contains the search words, ignoring accents and case. */
export function matchesSearch(member: Member, term: string): boolean {
  const query = normalize(term).trim();
  if (!query) return true;
  const haystack = normalize(
    [member["NOM Prénom"], member["Adresse mail"], member.Voix].join(" "),
  );
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

export interface LetterGroup {
  letter: string;
  members: Member[];
}

/** Members sorted by family name, then grouped under the letter it starts with. */
export function groupByLastName(members: Member[]): LetterGroup[] {
  const keyed = members.map((member) => {
    const last = normalize(lastNameOf(member["NOM Prénom"]));
    return { member, last, full: normalize(member["NOM Prénom"]) };
  });
  keyed.sort(
    (a, b) =>
      a.last.localeCompare(b.last, "fr") || a.full.localeCompare(b.full, "fr"),
  );
  const groups: LetterGroup[] = [];
  for (const { member, last } of keyed) {
    const first = last.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const current = groups[groups.length - 1];
    if (current && current.letter === letter) current.members.push(member);
    else groups.push({ letter, members: [member] });
  }
  return groups;
}
