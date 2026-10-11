import assert from "node:assert/strict";
import {
  MAX_VOICES,
  MAX_VOICE_LENGTH,
  parseVoiceUpdate,
  voiceChoices,
} from "./voice";

// --- The boxes ---
assert.deepEqual(voiceChoices([]), [
  "Soprane",
  "Alto",
  "Ténor",
  "Basse",
  "Jeune",
  "Orchestre",
]);
assert.deepEqual(voiceChoices(["Alte", "Orchestre", "Cheffe"]).slice(6), [
  "Alte",
  "Cheffe",
]);

// --- Saving ---
assert.deepEqual(parseVoiceUpdate(["Orchestre"]), {
  ok: true,
  voices: ["Orchestre"],
  voice: "Orchestre",
});
assert.deepEqual(parseVoiceUpdate(["jeune", " soprane ", "JEUNE"]), {
  ok: true,
  voices: ["Jeune", "Soprane"],
  voice: "Jeune & Soprane",
});
// An empty selection clears the voice.
assert.deepEqual(parseVoiceUpdate([]), { ok: true, voices: [], voice: null });
assert.deepEqual(parseVoiceUpdate(["", "  "]), {
  ok: true,
  voices: [],
  voice: null,
});
// A value that is not a usual voice is kept as written.
assert.deepEqual(parseVoiceUpdate(["Alte"]), {
  ok: true,
  voices: ["Alte"],
  voice: "Alte",
});

// --- Refused ---
for (const bad of [undefined, null, "Orchestre", [1], [["Alto"]], {}]) {
  assert.equal(parseVoiceUpdate(bad).ok, false);
}
const tooMany = parseVoiceUpdate(
  Array.from({ length: MAX_VOICES + 1 }, (_, i) => `Voix ${i}`),
);
assert.equal(tooMany.ok, false);
assert.equal(parseVoiceUpdate(["x".repeat(MAX_VOICE_LENGTH + 1)]).ok, false);

console.log("voice.test.ts: ok");
