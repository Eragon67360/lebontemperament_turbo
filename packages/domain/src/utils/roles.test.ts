import assert from "node:assert/strict";
import { decideAccess, isAdminRole, isUserRole, USER_ROLES } from "./roles";

const someone = { id: "11111111-1111-4111-8111-111111111111" };
const describe = (decision: ReturnType<typeof decideAccess>) =>
  decision.allowed
    ? `200 ${decision.role}`
    : `${decision.status} ${decision.error}`;

// --- Role matrix: each kind of caller against each rule ---
const callers: Record<string, [user: typeof someone | null, role: unknown]> = {
  anonymous: [null, undefined],
  user: [someone, "user"],
  admin: [someone, "admin"],
  superadmin: [someone, "superadmin"],
  "no role": [someone, null],
  "unknown role": [someone, "owner"],
};
const matrix = Object.fromEntries(
  Object.entries(callers).map(([who, [user, role]]) => [
    who,
    {
      isUserRole: isUserRole(role),
      isAdminRole: isAdminRole(role),
      admin: describe(decideAccess(user, role)),
      superadmin: describe(decideAccess(user, role, "superadmin")),
    },
  ]),
);
const SUPERADMIN_ONLY = "403 Non autorisé - Rôle superadmin requis";
assert.deepEqual(matrix, {
  anonymous: {
    isUserRole: false,
    isAdminRole: false,
    admin: "401 Non authentifié",
    superadmin: "401 Non authentifié",
  },
  user: {
    isUserRole: true,
    isAdminRole: false,
    admin: "403 Non autorisé",
    superadmin: SUPERADMIN_ONLY,
  },
  admin: {
    isUserRole: true,
    isAdminRole: true,
    admin: "200 admin",
    superadmin: SUPERADMIN_ONLY,
  },
  superadmin: {
    isUserRole: true,
    isAdminRole: true,
    admin: "200 superadmin",
    superadmin: "200 superadmin",
  },
  "no role": {
    isUserRole: false,
    isAdminRole: false,
    admin: "403 Non autorisé",
    superadmin: SUPERADMIN_ONLY,
  },
  "unknown role": {
    isUserRole: false,
    isAdminRole: false,
    admin: "403 Non autorisé",
    superadmin: SUPERADMIN_ONLY,
  },
});

// Signed out stays 401 whatever role is passed.
for (const role of USER_ROLES) {
  assert.equal(describe(decideAccess(null, role)), "401 Non authentifié");
  assert.equal(
    describe(decideAccess(undefined, role, "superadmin")),
    "401 Non authentifié",
  );
}

// Near misses are unknown roles too: exact, case-sensitive strings only.
const nearMisses = [
  "Admin",
  "SUPERADMIN",
  " admin",
  "admin ",
  "super admin",
  "",
  0,
  true,
  {},
  ["admin"],
];
for (const role of nearMisses) {
  assert.equal(isUserRole(role), false, String(role));
  assert.equal(isAdminRole(role), false, String(role));
  assert.equal(describe(decideAccess(someone, role)), "403 Non autorisé");
}
assert.deepEqual(USER_ROLES, ["user", "admin", "superadmin"]);

// isAdminRole answers what the inline `role === "admin" || role ===
// "superadmin"` checks it replaced answered, for every value above.
for (const role of [undefined, null, ...USER_ROLES, "owner", ...nearMisses]) {
  assert.equal(isAdminRole(role), role === "admin" || role === "superadmin");
}

// A granted decision hands back the caller's own account and role.
{
  const granted = decideAccess(someone, "superadmin", "superadmin");
  assert.ok(granted.allowed);
  assert.equal(granted.user, someone);
  assert.equal(granted.role, "superadmin");
}

console.log("roles: all assertions passed");
