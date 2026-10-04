import assert from "node:assert/strict";
import {
  parseSoloists,
  parseYouTubeInput,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "./youtube";

const ID = "dQw4w9WgXcQ";

// --- Every form an admin pastes, and the bare id the hint promises ---
assert.equal(parseYouTubeInput(`https://www.youtube.com/watch?v=${ID}`), ID);
assert.equal(parseYouTubeInput(`https://youtu.be/${ID}?t=42`), ID);
assert.equal(parseYouTubeInput(`https://youtube.com/shorts/${ID}`), ID);
assert.equal(parseYouTubeInput(`https://www.youtube.com/embed/${ID}`), ID);
assert.equal(parseYouTubeInput(`  ${ID}  `), ID, "a bare id, with spaces");
assert.equal(parseYouTubeInput(ID), ID);

// --- Refusals: empty, too short, not YouTube, an id-length word in a URL ---
assert.equal(parseYouTubeInput(""), null);
assert.equal(parseYouTubeInput(null), null);
assert.equal(parseYouTubeInput("too-short"), null);
assert.equal(parseYouTubeInput("https://vimeo.com/123456789"), null);
assert.equal(parseYouTubeInput("https://youtu.be/too-short"), null);

// --- The stored form keeps working on the website (it reads youtube.com URLs) ---
assert.equal(youtubeWatchUrl(ID), `https://www.youtube.com/watch?v=${ID}`);
assert.equal(parseYouTubeInput(youtubeWatchUrl(ID)), ID, "round trip");
assert.equal(
  youtubeThumbnailUrl(ID),
  `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`,
);

// --- Soloists ---
assert.deepEqual(parseSoloists("Jean, Marie , ,Paul"), [
  "Jean",
  "Marie",
  "Paul",
]);
assert.deepEqual(parseSoloists(""), []);
assert.deepEqual(parseSoloists(undefined), []);

console.log("videos/youtube: all assertions passed");
