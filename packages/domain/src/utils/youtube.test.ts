import assert from "node:assert/strict";
import { extractYouTubeId } from "./youtube";

assert.equal(
  extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  "dQw4w9WgXcQ",
);
assert.equal(
  extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=42"),
  "dQw4w9WgXcQ",
);
assert.equal(extractYouTubeId("https://youtu.be/too-short"), "");
assert.equal(
  extractYouTubeId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"),
  "dQw4w9WgXcQ",
);
assert.equal(
  extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
  "dQw4w9WgXcQ",
);
assert.equal(
  extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
  "dQw4w9WgXcQ",
);

console.log("extractYouTubeId: all assertions passed");
