import assert from "node:assert/strict";
import { errorSummaryItems } from "./formErrors";

const labels = {
  title: { label: "Titre", id: "x-title" },
  year: { label: "Année", id: "x-year" },
  image_url: { label: "Image", id: "x-image" },
};

// Rows follow the form's order and link to the field ids.
assert.deepEqual(
  errorSummaryItems(
    {
      image_url: { message: "Ajoutez une image" },
      title: { message: "Le titre est requis" },
    },
    labels,
  ),
  [
    { fieldId: "x-title", label: "Titre", message: "Le titre est requis" },
    { fieldId: "x-image", label: "Image", message: "Ajoutez une image" },
  ],
);

// No errors, no rows; errors without a message are skipped.
assert.deepEqual(errorSummaryItems({}, labels), []);
assert.deepEqual(
  errorSummaryItems({ year: { message: undefined } }, labels),
  [],
);

console.log("formErrors.test.ts: ok");
