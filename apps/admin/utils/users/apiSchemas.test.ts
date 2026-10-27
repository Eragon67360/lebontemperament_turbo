// What /api/users (POST, PATCH) and /api/users/email accept (CODE-004): what
// the screens send, and nothing else. Who may create which account or grant
// which role is decided afterwards by utils/access.ts (access.test.ts).
import assert from "node:assert/strict";
import { decideUserCreation } from "../access";
import { parsePatchBody } from "../anniversary/patchSchemas";
import {
  userCreateSchema,
  userEmailPatchSchema,
  userRolePatchSchema,
} from "./apiSchemas";

const USER = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const PASSWORD = "test".repeat(6);

// --- « Ajouter un membre » ---
const created = {
  email: "member@example.com",
  password: PASSWORD,
  role: "user",
  display_name: "Prénom NOM",
};
assert.deepEqual(parsePatchBody(userCreateSchema, created), {
  ok: true,
  data: created,
});
assert.deepEqual(
  parsePatchBody(userCreateSchema, { ...created, role: "admin" }).ok,
  true,
);
// The schema takes every role: refusing an admin's superadmin is
// decideUserCreation's job, after the parse (a 403, not a 400).
const superadmin = parsePatchBody(userCreateSchema, {
  ...created,
  role: "superadmin",
});
assert.equal(superadmin.ok, true);
if (superadmin.ok) {
  assert.deepEqual(decideUserCreation("admin", superadmin.data.role), {
    allowed: false,
    status: 403,
    error: "Seul un super administrateur peut créer un compte administrateur",
  });
}

// Auth options and profile columns are never taken from the body.
for (const key of [
  "email_confirm",
  "user_metadata",
  "app_metadata",
  "id",
  "voice",
]) {
  assert.deepEqual(
    parsePatchBody(userCreateSchema, { ...created, [key]: true }),
    { ok: false, status: 400, error: `Champs non modifiables : ${key}` },
    key,
  );
}
for (const [field, value] of [
  ["email", "pas-un-email"],
  ["email", ""],
  ["password", ""],
  ["password", 123456],
  ["role", "owner"],
  ["display_name", null],
] as const) {
  assert.deepEqual(
    parsePatchBody(userCreateSchema, { ...created, [field]: value }),
    { ok: false, status: 400, error: `Champs invalides : ${field}` },
    `${field} = ${String(value)}`,
  );
}
assert.deepEqual(
  parsePatchBody(userCreateSchema, { email: "member@example.com" }),
  { ok: false, status: 400, error: "Champs invalides : password, role" },
);

// --- « Changer le rôle » ---
assert.deepEqual(
  parsePatchBody(userRolePatchSchema, { userId: USER, role: "admin" }),
  { ok: true, data: { userId: USER, role: "admin" } },
);
assert.deepEqual(
  parsePatchBody(userRolePatchSchema, {
    userId: USER,
    role: "admin",
    display_name: "x",
  }),
  { ok: false, status: 400, error: "Champs non modifiables : display_name" },
);
assert.deepEqual(
  parsePatchBody(userRolePatchSchema, { userId: "me", role: "admin" }),
  { ok: false, status: 400, error: "Champs invalides : userId" },
);
assert.deepEqual(
  parsePatchBody(userRolePatchSchema, { userId: USER, role: "root" }),
  { ok: false, status: 400, error: "Champs invalides : role" },
);

// --- « Changer l'e-mail » ---
assert.deepEqual(
  parsePatchBody(userEmailPatchSchema, {
    userId: USER,
    email: "new@example.com",
  }),
  { ok: true, data: { userId: USER, email: "new@example.com" } },
);
// Any text passes here: checkNewEmail words the refusal of a bad address.
assert.equal(
  parsePatchBody(userEmailPatchSchema, { userId: USER, email: "" }).ok,
  true,
);
assert.deepEqual(
  parsePatchBody(userEmailPatchSchema, {
    userId: USER,
    email: "new@example.com",
    role: "superadmin",
  }),
  { ok: false, status: 400, error: "Champs non modifiables : role" },
);
assert.deepEqual(
  parsePatchBody(userEmailPatchSchema, { email: "new@example.com" }),
  { ok: false, status: 400, error: "Champs invalides : userId" },
);
assert.deepEqual(parsePatchBody(userEmailPatchSchema, undefined), {
  ok: false,
  status: 400,
  error: "Corps de requête invalide",
});

console.log("users apiSchemas: all assertions passed");
