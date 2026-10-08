// Run with: npx tsx lib/deletionRequest.test.ts
import assert from "node:assert/strict";
import {
  DELETION_NOTE_MAX_LENGTH,
  deletionRequestEmails,
  parseDeletionNote,
} from "./deletionRequest";

assert.equal(parseDeletionNote(undefined), null);
assert.equal(parseDeletionNote("   "), null);
assert.equal(parseDeletionNote("  Merci  "), "Merci");
assert.equal(parseDeletionNote(42), false);
assert.equal(
  parseDeletionNote("x".repeat(DELETION_NOTE_MAX_LENGTH + 1)),
  false,
);

const requester = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "alice@example.org",
  name: "Alice <b>MARTIN</b>",
};
const now = new Date("2026-10-09T06:00:00Z");

{
  const { toAssociation, toMember } = deletionRequestEmails(
    requester,
    "Je déménage\n<script>",
    now,
    false,
  );
  // What the member typed is escaped, line breaks kept.
  assert.ok(!toAssociation.html.includes("<script>"));
  assert.ok(!toAssociation.html.includes("<b>MARTIN"));
  assert.ok(toAssociation.html.includes("Je déménage<br>&lt;script&gt;"));
  assert.ok(toAssociation.html.includes(requester.id));
  assert.ok(toAssociation.html.includes("9 octobre 2026"));
  assert.ok(!toAssociation.subject.includes("TEST"));
  assert.ok(toMember.html.includes("un mois"));
}

{
  // Staging and previews share the production mailbox: their requests say so.
  const { toAssociation, toMember } = deletionRequestEmails(
    { ...requester, name: null },
    null,
    now,
    true,
  );
  assert.ok(toAssociation.subject.startsWith("[TEST"));
  assert.ok(toMember.subject.startsWith("[TEST"));
  assert.ok(toAssociation.subject.endsWith("alice@example.org"));
  assert.ok(!toAssociation.html.includes("Message du membre"));
}

console.log("deletionRequest: ok");
