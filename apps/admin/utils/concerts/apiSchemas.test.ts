import assert from "node:assert/strict";
import { parsePatchBody } from "../anniversary/patchSchemas";
import {
  concertCreateSchema,
  concertPatchSchema,
  tourCreateSchema,
  tourPatchSchema,
} from "./apiSchemas";

const ID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";

// --- What the screen sends is accepted ---
const concert = {
  place: "Saverne",
  date: "2026-12-12",
  time: "20:00",
  context: "Concert",
  name: "",
  additional_informations: "Entrée libre",
  related_link: null,
  tour_id: null,
  affiche: null,
};
assert.equal(parsePatchBody(concertCreateSchema, concert).ok, true);
assert.equal(
  parsePatchBody(concertPatchSchema, { id: ID, ...concert }).ok,
  true,
);
// « Gérer les concerts »
assert.equal(
  parsePatchBody(concertPatchSchema, { id: ID, tour_id: ID }).ok,
  true,
);
assert.equal(
  parsePatchBody(concertPatchSchema, { id: ID, tour_id: null }).ok,
  true,
);

const tour = {
  name: "Tournée d'été",
  description: "",
  context: "Tournée",
  start_date: "2027-06-01",
  end_date: null,
  tour_poster: null,
};
assert.equal(parsePatchBody(tourCreateSchema, tour).ok, true);
// Clearing both dates on edit sends null (wave 3 review fix).
assert.equal(
  parsePatchBody(tourPatchSchema, {
    id: ID,
    ...tour,
    start_date: null,
    end_date: null,
  }).ok,
  true,
);

// --- Columns the screen never sends are refused, by name ---
assert.deepEqual(
  parsePatchBody(concertPatchSchema, { id: ID, created_by: ID }),
  { ok: false, status: 400, error: "Champs non modifiables : created_by" },
);
assert.deepEqual(
  parsePatchBody(tourCreateSchema, { ...tour, id: ID, created_at: "x" }),
  { ok: false, status: 400, error: "Champs non modifiables : id, created_at" },
);

// --- Wrong shapes ---
const missingPlace = parsePatchBody(concertCreateSchema, {
  ...concert,
  place: " ",
});
assert.equal(missingPlace.ok, false);
assert.equal(
  parsePatchBody(concertPatchSchema, { id: ID, date: "12/12/2026" }).ok,
  false,
);
assert.equal(
  parsePatchBody(tourPatchSchema, { id: "nope", name: "x" }).ok,
  false,
);
assert.deepEqual(parsePatchBody(tourPatchSchema, { id: ID }), {
  ok: false,
  status: 400,
  error: "Aucun champ à modifier",
});

console.log("concerts/apiSchemas: all assertions passed");
