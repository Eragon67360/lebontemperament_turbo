// Run with: npx tsx components/anniversary/VideoModal.test.ts
import assert from "node:assert/strict";
import { getEmbed } from "./VideoModal";

// A made-up 11-character YouTube id, like the real ones.
const ID = "AbCdEfGh123";
const PLAYER = `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0`;

// Every link form an admin can paste opens the cookie-free player on the id.
const youTubeLinks: Record<string, string> = {
  watch: `https://www.youtube.com/watch?v=${ID}`,
  "watch without www": `https://youtube.com/watch?v=${ID}`,
  "watch on mobile": `https://m.youtube.com/watch?v=${ID}&t=30s`,
  "watch, more parameters after the id": `https://www.youtube.com/watch?v=${ID}&list=PL123&index=2`,
  "watch, share parameter after the id": `https://www.youtube.com/watch?v=${ID}&si=AbC123`,
  "watch, share parameter before the id": `https://www.youtube.com/watch?feature=share&v=${ID}`,
  "watch, time fragment": `https://www.youtube.com/watch?v=${ID}#t=10`,
  "short link": `https://youtu.be/${ID}`,
  "short link, share parameter": `https://youtu.be/${ID}?si=AbC123`,
  "short link, time parameter": `https://youtu.be/${ID}?t=42`,
  "short link, time fragment": `https://youtu.be/${ID}#t=10`,
  "short link, no scheme": `youtu.be/${ID}`,
  shorts: `https://www.youtube.com/shorts/${ID}`,
  "shorts, share parameter": `https://youtube.com/shorts/${ID}?si=AbC123`,
  embed: `https://www.youtube.com/embed/${ID}`,
  "embed, parameters": `https://www.youtube.com/embed/${ID}?start=10&rel=0`,
  "embed, privacy domain": `https://www.youtube-nocookie.com/embed/${ID}`,
  "padded with spaces": `  https://youtu.be/${ID}  `,
};
for (const [name, link] of Object.entries(youTubeLinks)) {
  assert.deepEqual(
    getEmbed(link),
    { url: PLAYER, provider: "YouTube" },
    `YouTube ${name}`,
  );
}

// Vimeo keeps its own player, with the do-not-track flag.
assert.deepEqual(getEmbed("https://vimeo.com/123456789"), {
  url: "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1",
  provider: "Vimeo",
});
assert.deepEqual(getEmbed("https://vimeo.com/123456789?share=copy"), {
  url: "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1",
  provider: "Vimeo",
});

// Anything else, or an id that is not 11 characters, stays an iframe of the link.
for (const link of [
  "https://example.com/film.mp4",
  "https://youtu.be/too-short",
  "https://www.youtube.com/watch?v=",
  "https://www.youtube.com/@some-channel",
  "",
]) {
  assert.deepEqual(
    getEmbed(link),
    { url: link, provider: "le lecteur externe" },
    `external player: ${link || "(empty)"}`,
  );
}

console.log("VideoModal getEmbed: all assertions passed");
