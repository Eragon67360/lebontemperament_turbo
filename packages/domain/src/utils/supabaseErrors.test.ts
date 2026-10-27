import assert from "node:assert/strict";
import {
  describeDatabaseError,
  isMissingFunctionError,
} from "./supabaseErrors";

assert.equal(isMissingFunctionError({ code: "PGRST202" }), true);
assert.equal(isMissingFunctionError({ code: "42883" }), true);
assert.equal(isMissingFunctionError({ code: "42501" }), false); // permission denied
assert.equal(isMissingFunctionError({ code: "PGRST301" }), false);
assert.equal(isMissingFunctionError({ code: null }), false);
assert.equal(isMissingFunctionError({}), false);
assert.equal(isMissingFunctionError(null), false);
assert.equal(isMissingFunctionError(undefined), false);

console.log("isMissingFunctionError: all assertions passed");

// --- describeDatabaseError: a French answer, never the database's message ---
const FALLBACK = "Erreur lors de l'enregistrement";
const REFUSED = {
  status: 400,
  error: "Valeurs refusées par la base de données",
};

// Values the database refuses are the request's fault.
for (const code of [
  "22P02", // invalid text representation: a malformed uuid, enum or boolean
  "22007", // invalid datetime format
  "22008", // datetime field out of range: 2026-02-30, 25:00
  "22001", // too long for a varchar(255)
  "23502", // a NOT NULL column left empty
  "23514", // a check constraint (events.event_type)
]) {
  assert.deepEqual(
    describeDatabaseError(
      { code, message: 'invalid input syntax for type uuid: "x"' },
      FALLBACK,
    ),
    REFUSED,
    code,
  );
}
assert.deepEqual(describeDatabaseError({ code: "PGRST116" }, FALLBACK), {
  status: 404,
  error: "Élément introuvable",
});
assert.deepEqual(describeDatabaseError({ code: "23505" }, FALLBACK), {
  status: 409,
  error: "Cet élément existe déjà",
});
assert.deepEqual(describeDatabaseError({ code: "42501" }, FALLBACK), {
  status: 403,
  error: "Action non autorisée",
});

// Anything else is the server's: the caller's fallback, still no raw message.
for (const error of [
  { code: "23503", message: "violates foreign key constraint" },
  { code: "PGRST204", message: "Could not find the 'x' column" },
  { code: "XX000", message: "internal error" },
  { message: "fetch failed" },
  { code: 42 },
  new Error("boom"),
  "boom",
  null,
  undefined,
]) {
  assert.deepEqual(
    describeDatabaseError(error, FALLBACK),
    { status: 500, error: FALLBACK },
    JSON.stringify(error),
  );
}

console.log("describeDatabaseError: all assertions passed");
