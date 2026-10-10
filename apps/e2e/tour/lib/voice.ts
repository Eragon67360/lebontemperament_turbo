import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Scene } from "./script.ts";

/** When each character of the narration is spoken, in seconds from its start. */
export type Narration = {
  sceneId: string;
  text: string;
  duration: number;
  charStarts: number[];
  /** Absent in a silent draft. */
  audioFile?: string;
};

export type VoiceConfig = {
  apiKey: string;
  voiceId: string;
  modelId: string;
};

const API = "https://api.elevenlabs.io/v1";

// French at the pace ElevenLabs reads it, for drafts without audio (estimated).
const DRAFT_CHARS_PER_SECOND = 15;

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0,
  use_speaker_boost: true,
};

// Voices one scene, or reuses the cached take when its text and settings have
// not changed, so editing one line only re-voices that scene.
export async function narrate(
  scene: Scene,
  config: VoiceConfig,
  audioDir: string,
  neighbours: { previous?: string; next?: string },
): Promise<Narration> {
  const hash = createHash("sha256")
    .update(
      JSON.stringify([
        scene.voice,
        config.voiceId,
        config.modelId,
        VOICE_SETTINGS,
      ]),
    )
    .digest("hex")
    .slice(0, 12);
  const base = path.join(audioDir, `${scene.id}-${hash}`);

  if (!existsSync(`${base}.json`)) {
    const response = await fetch(
      `${API}/text-to-speech/${config.voiceId}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": config.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: scene.voice,
          model_id: config.modelId,
          voice_settings: VOICE_SETTINGS,
          previous_text: neighbours.previous,
          next_text: neighbours.next,
        }),
      },
    );
    if (!response.ok) {
      // The body explains quota or voice errors; it never echoes the key.
      throw new Error(
        `ElevenLabs refused scene ${scene.id}: ${response.status} ${await response.text()}`,
      );
    }
    const body = (await response.json()) as {
      audio_base64: string;
      alignment: {
        characters: string[];
        character_start_times_seconds: number[];
        character_end_times_seconds: number[];
      };
    };
    writeFileSync(`${base}.mp3`, Buffer.from(body.audio_base64, "base64"));
    writeFileSync(`${base}.json`, JSON.stringify(body.alignment));
  }

  const alignment = JSON.parse(readFileSync(`${base}.json`, "utf8")) as {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
  return {
    sceneId: scene.id,
    text: alignment.characters.join(""),
    duration: alignment.character_end_times_seconds.at(-1) ?? 0,
    charStarts: alignment.character_start_times_seconds,
    audioFile: `${base}.mp3`,
  };
}

// A silent stand-in with the estimated length, to rehearse the tour and the
// timing before the voice exists.
export function draftNarration(scene: Scene): Narration {
  const text = scene.voice;
  return {
    sceneId: scene.id,
    text,
    duration: text.length / DRAFT_CHARS_PER_SECOND,
    charStarts: [...text].map((_, i) => i / DRAFT_CHARS_PER_SECOND),
  };
}

/** Seconds into the narration where `phrase` starts, or undefined. */
export function cueTime(
  narration: Narration,
  phrase: string,
): number | undefined {
  const index = narration.text.indexOf(phrase);
  return index < 0 ? undefined : narration.charStarts[index];
}
