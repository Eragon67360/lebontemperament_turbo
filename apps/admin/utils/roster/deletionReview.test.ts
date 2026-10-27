import type { AbsentMember } from "@repo/domain/roster/types";
import assert from "node:assert/strict";
import {
  RECENT_SIGN_IN_DAYS,
  isAdminAccount,
  reviewDeletion,
  signedInRecently,
} from "./deletionReview";

// Everyone here is fictional.
const NOW = new Date("2026-10-11T12:00:00Z");
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const account = (
  id: string,
  displayName: string,
  extra: Partial<AbsentMember> = {},
): AbsentMember => ({
  profileId: id,
  email: `${id}@example.com`,
  displayName,
  role: "user",
  status: "approuvé",
  lastSignInAt: null,
  ...extra,
});

// Recent means within the window, inclusive; never signed in is not recent.
assert.equal(
  signedInRecently(account("a", "A", { lastSignInAt: daysAgo(3) }), NOW),
  true,
);
assert.equal(
  signedInRecently(
    account("a", "A", { lastSignInAt: daysAgo(RECENT_SIGN_IN_DAYS) }),
    NOW,
  ),
  true,
);
assert.equal(
  signedInRecently(
    account("a", "A", { lastSignInAt: daysAgo(RECENT_SIGN_IN_DAYS + 1) }),
    NOW,
  ),
  false,
);
assert.equal(signedInRecently(account("a", "A"), NOW), false);
assert.equal(
  signedInRecently(account("a", "A", { lastSignInAt: "nope" }), NOW),
  false,
);

assert.equal(isAdminAccount(account("a", "A", { role: "admin" })), true);
assert.equal(isAdminAccount(account("a", "A", { role: "superadmin" })), true);
assert.equal(isAdminAccount(account("a", "A")), false);
// Every kind of role (a profile without one arrives here as "user").
assert.deepEqual(
  Object.fromEntries(
    ["user", "admin", "superadmin", "owner", "Admin", " admin", ""].map(
      (role) => [role, isAdminAccount({ role })],
    ),
  ),
  {
    user: false,
    admin: true,
    superadmin: true,
    owner: false,
    Admin: false,
    " admin": false,
    "": false,
  },
);

const review = reviewDeletion(
  [
    account("old", "Zoé ANCIENNE", { lastSignInAt: daysAgo(400) }),
    account("never", "Alice JAMAIS", { status: "en attente" }),
    account("recent", "Bob RÉCENT", { lastSignInAt: daysAgo(10) }),
    account("boss", "Chloé ADMIN", {
      role: "admin",
      lastSignInAt: daysAgo(500),
    }),
  ],
  NOW,
);
assert.deepEqual(
  review.accounts.map((a) => a.profileId),
  ["boss", "recent", "never", "old"],
  "administrators, then recent sign-ins, then the rest by name",
);
assert.deepEqual(
  review.admins.map((a) => a.profileId),
  ["boss"],
);
assert.deepEqual(
  review.recent.map((a) => a.profileId),
  ["recent"],
);
assert.equal(review.neverSignedIn, 1);

const empty = reviewDeletion([], NOW);
assert.deepEqual(empty, {
  accounts: [],
  admins: [],
  recent: [],
  neverSignedIn: 0,
});
