// A member's voices as an admin sets them (PATCH /api/users/voice): the
// checked boxes of the « Voix » dialog in, the stored text out. Pure and
// unit-tested (voice.test.ts); the dialog and the route share it.
import {
  DEFAULT_KNOWN_VOICES,
  isKnownVoice,
  joinVoices,
  normalizeText,
  splitVoices,
} from "@repo/domain/roster/normalize";

export const MAX_VOICES = 6;
export const MAX_VOICE_LENGTH = 40;

/**
 * The boxes of the dialog: the usual voices, then any other value the
 * account already carries (« Alte », « Cheffe »…), so saving never drops one
 * by accident.
 */
export function voiceChoices(current: readonly string[]): string[] {
  const extras = current.filter((voice) => !isKnownVoice(voice));
  return [...DEFAULT_KNOWN_VOICES, ...extras];
}

export type VoiceUpdate =
  | { ok: true; voices: string[]; voice: string | null }
  | { ok: false; error: string };

/**
 * Checks the voices sent by the dialog. Duplicates collapse and the usual
 * voices get their usual spelling; an empty list clears the voice (`voice`
 * is then null, as for an account the roster never described).
 */
export function parseVoiceUpdate(input: unknown): VoiceUpdate {
  if (
    !Array.isArray(input) ||
    !input.every((voice) => typeof voice === "string")
  ) {
    return { ok: false, error: "La liste des voix est invalide." };
  }
  const voices = splitVoices(
    input.map((voice) => normalizeText(voice)).join(" & "),
  );
  if (voices.length > MAX_VOICES) {
    return { ok: false, error: `Au plus ${MAX_VOICES} voix par membre.` };
  }
  if (voices.some((voice) => voice.length > MAX_VOICE_LENGTH)) {
    return { ok: false, error: "Une des voix est trop longue." };
  }
  return {
    ok: true,
    voices,
    voice: voices.length > 0 ? joinVoices(voices) : null,
  };
}
