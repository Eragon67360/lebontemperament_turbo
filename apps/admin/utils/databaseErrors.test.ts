// How the CODE-004 routes answer a database error: the status and French
// wording of @repo/domain's describeDatabaseError, the raw error logged on
// the server and never sent back.
import assert from "node:assert/strict";
import { databaseErrorResponse } from "./databaseErrors";

const logged: unknown[][] = [];
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  logged.push(args);
};

try {
  const raw = {
    code: "22P02",
    message: 'invalid input syntax for type uuid: "x"',
    details: null,
    hint: null,
  };
  const refused = databaseErrorResponse(raw, "Erreur lors de la création");
  assert.equal(refused.status, 400);
  assert.deepEqual(await refused.json(), {
    error: "Valeurs refusées par la base de données",
  });
  assert.deepEqual(logged.at(-1), ["Erreur lors de la création", raw]);

  const missing = databaseErrorResponse({ code: "PGRST116" }, "x");
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "Élément introuvable" });

  // The server's own failures keep the route's wording, never the message.
  const failed = databaseErrorResponse(
    { code: "XX000", message: "relation public.cas does not exist" },
    "Erreur lors de la création du CA",
  );
  assert.equal(failed.status, 500);
  const body = await failed.json();
  assert.deepEqual(body, { error: "Erreur lors de la création du CA" });
  assert.doesNotMatch(JSON.stringify(body), /relation|public\.cas/);
} finally {
  console.error = consoleError;
}

console.log("databaseErrorResponse: all assertions passed");
