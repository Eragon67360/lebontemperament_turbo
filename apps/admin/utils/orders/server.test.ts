// How /api/orders answers a database error: the migration's own French
// messages pass through with the right status, an ordered product can't be
// deleted (409), a missing table says the migration is not applied (503).
import assert from "node:assert/strict";
import {
  describeDbError,
  isMissingTable,
  NOT_INSTALLED_MESSAGE,
} from "./server";

assert.equal(isMissingTable({ code: "42P01" }), true);
assert.equal(isMissingTable({ code: "PGRST205" }), true);
assert.equal(isMissingTable({ code: "23503" }), false);
assert.equal(isMissingTable(null), false);

assert.deepEqual(describeDbError({ code: "PGRST205" }, "x"), {
  status: 503,
  error: NOT_INSTALLED_MESSAGE,
  notInstalled: true,
});
assert.match(NOT_INSTALLED_MESSAGE, /migration/);

// The functions' own refusals keep their words.
assert.deepEqual(
  describeDbError({ code: "42501", message: "Réservé aux superadmins" }, "x"),
  { status: 403, error: "Réservé aux superadmins" },
);
assert.deepEqual(
  describeDbError({ code: "P0002", message: "Commande introuvable" }, "x"),
  { status: 404, error: "Commande introuvable" },
);
assert.deepEqual(
  describeDbError(
    { code: "22023", message: "Le livreur doit être superadmin" },
    "x",
  ),
  { status: 400, error: "Le livreur doit être superadmin" },
);
assert.deepEqual(
  describeDbError(
    { code: "23514", message: "Ce produit n'appartient pas à cette vente" },
    "x",
  ),
  { status: 400, error: "Ce produit n'appartient pas à cette vente" },
);

// A product that is ordered: the page offers to make it unavailable instead.
const fk = describeDbError({ code: "23503", message: "violates fk" }, "x");
assert.equal(fk.status, 409);
assert.match(fk.error, /indisponible/);

// Anything else: the route's own sentence, never the raw Postgres text.
assert.deepEqual(
  describeDbError(
    { code: "XX000", message: "internal" },
    "La vente n'a pas pu être enregistrée",
  ),
  { status: 500, error: "La vente n'a pas pu être enregistrée" },
);
assert.equal(describeDbError(null, "fallback").status, 500);

console.log("orders/server: all assertions passed");
