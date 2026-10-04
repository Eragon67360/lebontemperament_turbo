import assert from "node:assert/strict";
import {
  firstTabWithError,
  STORY_FIELD_LABELS,
  STORY_TAB_OF,
  tabOfFieldId,
  uploadProgressLabel,
} from "./form";

// --- Every field has a tab, and the summary's link knows which to open ---
for (const name of Object.keys(STORY_FIELD_LABELS) as Array<
  keyof typeof STORY_FIELD_LABELS
>) {
  assert.ok(STORY_TAB_OF[name], `${name} has a tab`);
  assert.equal(tabOfFieldId(STORY_FIELD_LABELS[name].id), STORY_TAB_OF[name]);
}
assert.equal(tabOfFieldId("unknown-field"), undefined);

// --- An invalid submit opens the tab of the first error, in form order ---
assert.equal(firstTabWithError({}), undefined);
assert.equal(firstTabWithError({ text1: { message: "x" } }), "content");
assert.equal(
  firstTabWithError({ image2_photographer_url: { message: "x" } }),
  "media",
);
assert.equal(
  firstTabWithError({ text1: { message: "x" }, slug: { message: "y" } }),
  "general",
  "Général comes first even when Contenu also has an error",
);

// --- Upload progress wording: no field keys, a count the admin can follow ---
assert.equal(uploadProgressLabel(2, 4), "Envoi de l'image 2 sur 4…");
assert.equal(uploadProgressLabel(1, 1), "Envoi de l'image…");

// --- Plain labels: no jargon in what the admin reads ---
for (const { label } of Object.values(STORY_FIELD_LABELS)) {
  assert.doesNotMatch(label, /slug|url|ordre/i, label);
}

console.log("projects/form: all assertions passed");
