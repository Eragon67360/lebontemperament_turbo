import assert from "node:assert/strict";
import {
  addressCountLabel,
  DEFAULT_GROUP_EMAIL,
  groupLabel,
  groupsWithDefault,
  memberEmails,
  readAtLabel,
} from "./members";

// --- An empty groups answer still offers the newsletter group ---
assert.deepEqual(groupsWithDefault(undefined), [
  {
    email: DEFAULT_GROUP_EMAIL,
    name: DEFAULT_GROUP_EMAIL,
    description: null,
  },
]);
assert.deepEqual(
  groupsWithDefault([]).map((g) => g.email),
  [DEFAULT_GROUP_EMAIL],
);
{
  const groups = [
    { email: "choeur@googlegroups.com", name: "Chœur", description: null },
  ];
  assert.equal(groupsWithDefault(groups), groups);
}

// --- The address shows under the name only when they differ ---
assert.deepEqual(
  groupLabel({
    email: "choeur@googlegroups.com",
    name: "Chœur",
    description: null,
  }),
  { name: "Chœur", email: "choeur@googlegroups.com" },
);
assert.deepEqual(
  groupLabel({
    email: "a@googlegroups.com",
    name: "a@googlegroups.com",
    description: null,
  }),
  { name: "a@googlegroups.com", email: null },
);

// --- Members come as strings or objects ---
assert.deepEqual(memberEmails(["a@example.org", { email: "b@example.org" }]), [
  "a@example.org",
  "b@example.org",
]);
assert.deepEqual(memberEmails(undefined), []);

assert.equal(addressCountLabel(1), "1 adresse");
assert.equal(addressCountLabel(42), "42 adresses");
assert.equal(readAtLabel("2026-10-08T07:55:00Z"), "8 octobre 2026 à 09:55");

console.log("google-groups/members: ok");
