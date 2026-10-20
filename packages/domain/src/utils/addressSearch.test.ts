import assert from "node:assert/strict";
import {
  addressQuery,
  addressSearchUrl,
  parseAddressSuggestions,
} from "./addressSearch";

assert.equal(addressQuery("  31a  rue des   Vignes "), "31a rue des Vignes");
assert.equal(addressQuery("ru"), null);
assert.equal(addressQuery("  -- rue"), null);
assert.equal(addressQuery("x".repeat(201)), null);

assert.equal(
  addressSearchUrl("31a rue des Vignes"),
  "https://data.geopf.fr/geocodage/search?q=31a+rue+des+Vignes&index=address&autocomplete=1&limit=5",
);

// A real answer's shape (2026-10-16), one feature trimmed to what is read.
const answer = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [7.467488, 48.618999] },
      properties: {
        label: "31a Rue des Vignes 67520 Wangen",
        context: "67, Bas-Rhin, Grand Est",
        type: "housenumber",
      },
    },
    {
      type: "Feature",
      properties: { label: "31a Rue des Vignes 67520 Wangen" },
    },
    { type: "Feature", properties: { label: "Rue des Vignes 67520 Wangen" } },
    { type: "Feature", properties: {} },
    null,
  ],
};
assert.deepEqual(parseAddressSuggestions(answer), [
  {
    label: "31a Rue des Vignes 67520 Wangen",
    context: "67, Bas-Rhin, Grand Est",
  },
  { label: "Rue des Vignes 67520 Wangen", context: null },
]);
assert.deepEqual(parseAddressSuggestions(null), []);
assert.deepEqual(parseAddressSuggestions({ features: "x" }), []);

console.log("addressSearch: ok");
