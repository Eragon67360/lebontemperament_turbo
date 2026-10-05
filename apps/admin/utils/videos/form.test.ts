import assert from "node:assert/strict";
import { toVideoFormData } from "./form";

const base = {
  title: "  Requiem ",
  composer: "Fauré",
  youtube_url: "https://youtu.be/dQw4w9WgXcQ?t=42",
  performance_date: new Date(2025, 5, 1),
  venue: "Église Saint-Test",
  soloists: "Prénom Un, Prénom Deux, ",
};

// --- The stored link is the canonical watch URL, whatever was pasted ---
const stored = toVideoFormData(base);
assert.equal(stored.youtube_url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
assert.equal(
  toVideoFormData({ ...base, youtube_url: "dQw4w9WgXcQ" }).youtube_url,
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "a bare id is stored as a URL the website can read",
);

// --- Local date, trimmed text, soloists split ---
assert.equal(stored.performance_date, "2025-06-01");
assert.equal(stored.title, "Requiem");
assert.deepEqual(stored.soloists, ["Prénom Un", "Prénom Deux"]);
assert.deepEqual(toVideoFormData({ ...base, soloists: "" }).soloists, []);

console.log("videos/form: all assertions passed");
