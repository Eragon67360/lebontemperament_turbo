import assert from "node:assert/strict";
import { classifyNewsletterRequest } from "./newsletter";

assert.deepEqual(classifyNewsletterRequest({ email: "member@example.com" }), {
  kind: "subscribe",
  email: "member@example.com",
});
assert.deepEqual(
  classifyNewsletterRequest({ email: "  member@example.com ", website: "" }),
  { kind: "subscribe", email: "member@example.com" },
);

// Honeypot filled: a bot, whatever the address looks like.
assert.deepEqual(
  classifyNewsletterRequest({
    email: "member@example.com",
    website: "https://example.com",
  }),
  { kind: "bot" },
);
assert.deepEqual(
  classifyNewsletterRequest({ email: "not-an-email", website: "x" }),
  { kind: "bot" },
);
assert.deepEqual(
  classifyNewsletterRequest({ email: "member@example.com", website: 1 }),
  { kind: "bot" },
);

// Invalid addresses and bodies.
for (const body of [
  {},
  null,
  "member@example.com",
  { email: "" },
  { email: "member@example" },
  { email: "member example@example.com" },
  { email: 42 },
  { email: `${"a".repeat(250)}@example.com` },
]) {
  assert.deepEqual(classifyNewsletterRequest(body), { kind: "invalid" });
}

console.log("classifyNewsletterRequest: all assertions passed");
