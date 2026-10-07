import assert from "node:assert/strict";
import { eventDataSummary, touchesEventDataInputs } from "./eventDataSummary";

const filled = {
  venue_name: "Église Saint-Paul",
  street_address: null,
  postal_code: "67200",
  city: "Strasbourg",
  is_free: true,
  price: null,
  event_data_generated_at: "2026-10-07T00:00:00Z",
};

// --- Summary line ---
assert.equal(
  eventDataSummary(filled),
  "Église Saint-Paul, 67200 Strasbourg · Entrée libre",
);
assert.equal(
  eventDataSummary({ ...filled, is_free: false, price: 15 }),
  "Église Saint-Paul, 67200 Strasbourg · Plein tarif 15 €",
);
assert.equal(
  eventDataSummary({ ...filled, is_free: false, price: null }),
  "Église Saint-Paul, 67200 Strasbourg · Entrée payante, tarif non trouvé",
);
assert.equal(
  eventDataSummary({
    ...filled,
    venue_name: null,
    postal_code: null,
    city: null,
    is_free: null,
  }),
  "Adresse non trouvée · Tarif non trouvé",
);
// Not generated yet (new concert, or saved before #328): nothing to show.
assert.equal(
  eventDataSummary({ ...filled, event_data_generated_at: null }),
  null,
);
assert.equal(eventDataSummary(null), null);

// --- Which updates ask the AI again ---
assert.equal(touchesEventDataInputs({ place: "Saverne" }), true);
assert.equal(touchesEventDataInputs({ affiche: null }), true);
assert.equal(touchesEventDataInputs({ tour_id: "x" }), false); // « Gérer les concerts »
assert.equal(
  touchesEventDataInputs({ date: "2027-01-01", time: "20:00" }),
  false,
);

console.log("eventDataSummary.test.ts: ok");
