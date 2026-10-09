import assert from "node:assert/strict";
import { checkNewEmail, isEmailTakenError } from "./emailChange";

// Normalised like the roster: trimmed, lower-cased.
assert.deepEqual(checkNewEmail("old@example.org", "  New.Name@Example.ORG "), {
  ok: true,
  email: "new.name@example.org",
});
assert.equal(checkNewEmail(null, "a@b.fr").ok, true);

// Refused: empty, not a string, malformed, unchanged (case aside).
assert.equal(checkNewEmail("old@example.org", "").ok, false);
assert.equal(checkNewEmail("old@example.org", "   ").ok, false);
assert.equal(checkNewEmail("old@example.org", undefined).ok, false);
assert.equal(checkNewEmail("old@example.org", 42).ok, false);
assert.equal(checkNewEmail("old@example.org", "pas-une-adresse").ok, false);
assert.equal(checkNewEmail("old@example.org", "a@b").ok, false);
assert.equal(checkNewEmail("old@example.org", "a b@c.fr").ok, false);
assert.equal(checkNewEmail("Old@Example.org", " old@example.ORG").ok, false);

// Supabase Auth's « address taken » answers.
assert.equal(isEmailTakenError({ code: "email_exists" }), true);
assert.equal(
  isEmailTakenError({
    message: "A user with this email address has already been registered",
  }),
  true,
);
assert.equal(isEmailTakenError({ code: "validation_failed" }), false);
assert.equal(isEmailTakenError(null), false);
assert.equal(isEmailTakenError("email_exists"), false);

console.log("emailChange.test.ts: all assertions passed");
