// Run with: npx tsx lib/og/text.test.ts
//
// Text helpers of the link-preview cards: the next concert's date block and
// line, the story year, and the clamp that keeps admin-typed text on a card.
import assert from "node:assert/strict";
import { clampText, concertDateParts, concertTitle, storyYear } from "./text";

// Date block and line, in French, whatever the server's time zone
{
  const parts = concertDateParts("2026-11-22", "18:00:00");
  assert.equal(parts.day, "22");
  assert.equal(parts.month, "nov.");
  assert.equal(parts.year, "2026");
  assert.equal(parts.line, "Dimanche 22 novembre · 18 h 00");
}
{
  const parts = concertDateParts("2027-05-01", null);
  assert.equal(parts.day, "1");
  assert.equal(parts.month, "mai");
  assert.equal(parts.line, "Samedi 1er mai");
}

// Same fallback title as the agenda's cards
assert.equal(concertTitle(null, "Saverne"), "Concert à Saverne");
assert.equal(concertTitle("Requiem", "Saverne"), "Requiem");

// Story year from the date column
assert.equal(storyYear("2022-06-18"), "2022");
assert.equal(storyYear(null), null);
assert.equal(storyYear(""), null);

// Clamp: untouched when short, cut at a word with an ellipsis when long
assert.equal(
  clampText("  Concert   de printemps ", 40),
  "Concert de printemps",
);
const long = clampText(
  "Foyer de l'étudiant catholique (FEC) Strasbourg, salle des fêtes",
  40,
);
assert.ok(long.length <= 40, long);
assert.ok(long.endsWith("…"), long);
assert.ok(!long.includes(" …"), long);

console.log("lib/og/text.test.ts: all assertions passed");
