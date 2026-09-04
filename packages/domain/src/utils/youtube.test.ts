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
