import assert from "node:assert/strict";
import {
  decideAccess,
  decideRoleChange,
  decideUserCreation,
  decideUserDeletion,
  isAdminRole,
  isUserRole,
  type UserRole,
} from "./access";

const status = (decision: { allowed: boolean; status?: number }) =>
  decision.allowed ? 200 : decision.status;

// --- Roles ---
assert.equal(isUserRole("user"), true);
assert.equal(isUserRole("admin"), true);
assert.equal(isUserRole("superadmin"), true);
assert.equal(isUserRole("Admin"), false);
assert.equal(isUserRole("owner"), false);
assert.equal(isUserRole(""), false);
assert.equal(isUserRole(undefined), false);
assert.equal(isUserRole(["admin"]), false);
assert.equal(isAdminRole("admin"), true);
assert.equal(isAdminRole("superadmin"), true);
assert.equal(isAdminRole("user"), false);
assert.equal(isAdminRole(null), false);

// --- Admin access (every admin API route and the dashboard) ---
const someone = { id: "11111111-1111-4111-8111-111111111111" };
assert.equal(status(decideAccess(null, null)), 401); // anonymous
assert.equal(status(decideAccess(undefined, "admin")), 401);
assert.equal(status(decideAccess(someone, "user")), 403); // member
assert.equal(status(decideAccess(someone, null)), 403); // no profile
assert.equal(status(decideAccess(someone, "owner")), 403);
assert.equal(status(decideAccess(someone, "admin")), 200);
assert.equal(status(decideAccess(someone, "superadmin")), 200);
// Superadmin-only checks
assert.equal(status(decideAccess(someone, "admin", "superadmin")), 403);
assert.equal(status(decideAccess(someone, "superadmin", "superadmin")), 200);
assert.equal(status(decideAccess(null, "superadmin", "superadmin")), 401);
{
  const granted = decideAccess(someone, "admin");
  assert.ok(granted.allowed);
  assert.equal(granted.user, someone);
  assert.equal(granted.role, "admin");
}

// --- Role changes ---
const admin = { id: "a", role: "admin" as UserRole };
const superadmin = { id: "s", role: "superadmin" as UserRole };
const member = { id: "m", role: "user" as UserRole };
const otherAdmin = { id: "a2", role: "admin" as UserRole };
const otherSuperadmin = { id: "s2", role: "superadmin" as UserRole };

// Admins switch other users between user and admin.
assert.equal(status(decideRoleChange(admin, member, "admin")), 200);
assert.equal(status(decideRoleChange(admin, otherAdmin, "user")), 200);
assert.equal(status(decideRoleChange(admin, member, "user")), 200); // no-op
// Admins never grant or revoke superadmin.
assert.equal(status(decideRoleChange(admin, member, "superadmin")), 403);
assert.equal(status(decideRoleChange(admin, otherAdmin, "superadmin")), 403);
assert.equal(status(decideRoleChange(admin, otherSuperadmin, "admin")), 403);
assert.equal(status(decideRoleChange(admin, otherSuperadmin, "user")), 403);
// Nobody changes their own role, superadmins included.
assert.equal(status(decideRoleChange(admin, admin, "superadmin")), 403);
assert.equal(status(decideRoleChange(admin, admin, "user")), 403);
assert.equal(status(decideRoleChange(superadmin, superadmin, "admin")), 403);
// Superadmins grant and revoke superadmin.
assert.equal(status(decideRoleChange(superadmin, member, "superadmin")), 200);
assert.equal(
  status(decideRoleChange(superadmin, otherAdmin, "superadmin")),
  200,
);
assert.equal(
  status(decideRoleChange(superadmin, otherSuperadmin, "admin")),
  200,
);
assert.equal(status(decideRoleChange(superadmin, member, "admin")), 200);
// Invalid roles are a bad request, whoever asks.
assert.equal(status(decideRoleChange(admin, member, "owner")), 400);
assert.equal(status(decideRoleChange(superadmin, member, "SUPERADMIN")), 400);
assert.equal(status(decideRoleChange(admin, member, 42)), 400);
assert.equal(status(decideRoleChange(admin, member, null)), 400);
// A member can't change roles at all (the route's admin check comes first).
assert.equal(status(decideRoleChange(member, otherAdmin, "user")), 403);

// --- Account creation ---
assert.equal(status(decideUserCreation("admin", "user")), 200);
assert.equal(status(decideUserCreation("admin", "admin")), 403);
assert.equal(status(decideUserCreation("admin", "superadmin")), 403);
assert.equal(status(decideUserCreation("superadmin", "user")), 200);
assert.equal(status(decideUserCreation("superadmin", "admin")), 200);
assert.equal(status(decideUserCreation("superadmin", "superadmin")), 200);
assert.equal(status(decideUserCreation("admin", "root")), 400);
assert.equal(status(decideUserCreation("admin", undefined)), 400);
assert.equal(status(decideUserCreation("user", "user")), 403);

// --- Account deletion ---
// Permanent deletion is superadmin-only (#433).
assert.equal(status(decideUserDeletion(admin, member)), 403);
assert.equal(status(decideUserDeletion(admin, otherAdmin)), 403);
assert.equal(status(decideUserDeletion(superadmin, member)), 200);
assert.equal(status(decideUserDeletion(superadmin, otherAdmin)), 200);
assert.equal(status(decideUserDeletion(admin, otherSuperadmin)), 403);
assert.equal(status(decideUserDeletion(admin, admin)), 403);
assert.equal(status(decideUserDeletion(superadmin, otherSuperadmin)), 200);
assert.equal(status(decideUserDeletion(superadmin, superadmin)), 403);
assert.equal(status(decideUserDeletion(member, otherAdmin)), 403);

console.log("access.test.ts: all assertions passed");
