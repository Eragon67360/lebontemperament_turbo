import assert from "node:assert/strict";
import {
  describeGroupError,
  GROUPS_NOT_INSTALLED_MESSAGE,
  isNotInstalled,
  personOf,
} from "./server";

const fallback = "Le groupe n'a pas pu être créé";

// Before the migration: tables or functions missing, 503 notInstalled.
for (const code of ["42P01", "PGRST205", "42883", "PGRST202"]) {
  assert.equal(isNotInstalled({ code }), true, code);
  assert.deepEqual(describeGroupError({ code }, fallback), {
    status: 503,
    error: GROUPS_NOT_INSTALLED_MESSAGE,
    notInstalled: true,
  });
}
assert.equal(isNotInstalled(null), false);

// The migration's own French messages pass; a constraint's never does.
assert.deepEqual(
  describeGroupError(
    {
      code: "23514",
      message: "Un événement réservé à des groupes ne peut pas être public",
    },
    fallback,
  ),
  {
    status: 400,
    error: "Un événement réservé à des groupes ne peut pas être public",
  },
);
assert.deepEqual(
  describeGroupError(
    { code: "22023", message: "Groupe inconnu ou archivé" },
    fallback,
  ),
  { status: 400, error: "Groupe inconnu ou archivé" },
);
assert.deepEqual(
  describeGroupError(
    {
      code: "23514",
      message:
        'new row for relation "member_groups" violates check constraint "member_groups_color_check"',
    },
    fallback,
  ),
  { status: 400, error: "Valeurs refusées par la base de données" },
);
assert.deepEqual(
  describeGroupError(
    { code: "P0002", message: "Événement introuvable" },
    fallback,
  ),
  { status: 404, error: "Événement introuvable" },
);
assert.equal(
  describeGroupError({ code: "23505", message: "duplicate key" }, fallback)
    .error,
  "Un autre groupe porte déjà ce nom",
);
assert.equal(describeGroupError({ code: "23503" }, fallback).status, 400);
assert.equal(describeGroupError({ code: "42501" }, fallback).status, 403);
assert.deepEqual(describeGroupError({ code: "XX000" }, fallback), {
  status: 500,
  error: fallback,
});
assert.deepEqual(describeGroupError(null, fallback), {
  status: 500,
  error: fallback,
});

// A profile as the pages show it.
assert.deepEqual(
  personOf({
    id: "p",
    display_name: " Claire MARTIN ",
    email: "claire@example.test",
    profile_picture_url: "",
  }),
  {
    id: "p",
    name: "Claire MARTIN",
    email: "claire@example.test",
    avatar: null,
  },
);
assert.equal(
  personOf({
    id: "p",
    display_name: null,
    email: "jean@example.test",
    profile_picture_url: null,
  }).name,
  "jean",
);
assert.equal(
  personOf({
    id: "p",
    display_name: null,
    email: null,
    profile_picture_url: null,
  }).name,
  "Membre",
);

console.log("groups server: all tests passed");
