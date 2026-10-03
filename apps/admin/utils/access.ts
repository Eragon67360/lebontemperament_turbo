// utils/access.ts
// Pure authorization rules for the admin (no I/O, unit-tested in access.test.ts).
// The API routes and the dashboard layout call these through utils/auth.ts.
import type { Database } from "@repo/domain/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type AdminRole = Extract<UserRole, "admin" | "superadmin">;

export const USER_ROLES = [
  "user",
  "admin",
  "superadmin",
] as const satisfies readonly UserRole[];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "superadmin";
}

export type Denied = {
  allowed: false;
  status: 400 | 401 | 403;
  error: string;
};
export type Decision = { allowed: true } | Denied;

const deny = (status: Denied["status"], error: string): Denied => ({
  allowed: false,
  status,
  error,
});

/**
 * Who may use the admin: a signed-in user whose profile role is admin or
 * superadmin (`required: "admin"`, the default), or superadmin only.
 */
export function decideAccess<U extends { id: string }>(
  user: U | null | undefined,
  role: unknown,
  required: AdminRole = "admin",
):
  | { allowed: true; user: U; role: AdminRole }
  | (Denied & { status: 401 | 403 }) {
  if (!user) {
    return { allowed: false, status: 401, error: "Non authentifié" };
  }
  if (required === "superadmin" && role !== "superadmin") {
    return {
      allowed: false,
      status: 403,
      error: "Non autorisé - Rôle superadmin requis",
    };
  }
  if (!isAdminRole(role)) {
    return { allowed: false, status: 403, error: "Non autorisé" };
  }
  return { allowed: true, user, role };
}

type Actor = { id: string; role: UserRole };
type Target = { id: string; role: UserRole };

const SUPERADMIN_ONLY =
  "Seul un super administrateur peut attribuer ou retirer le rôle super administrateur";

/**
 * Role changes (PATCH /api/users): admins switch other users between `user`
 * and `admin`; only a superadmin grants or revokes `superadmin`; nobody
 * changes their own role.
 */
export function decideRoleChange(
  actor: Actor,
  target: Target,
  newRole: unknown,
): Decision {
  if (!isUserRole(newRole)) return deny(400, "Rôle invalide");
  if (!isAdminRole(actor.role)) return deny(403, "Non autorisé");
  if (actor.id === target.id) {
    return deny(403, "Vous ne pouvez pas modifier votre propre rôle");
  }
  if (
    (target.role === "superadmin" || newRole === "superadmin") &&
    actor.role !== "superadmin"
  ) {
    return deny(403, SUPERADMIN_ONLY);
  }
  return { allowed: true };
}

/**
 * Account creation (POST /api/users): admins create `user` accounts; only a
 * superadmin creates admins or superadmins.
 */
export function decideUserCreation(
  actorRole: UserRole,
  requestedRole: unknown,
): Decision {
  if (!isUserRole(requestedRole)) return deny(400, "Rôle invalide");
  if (!isAdminRole(actorRole)) return deny(403, "Non autorisé");
  if (requestedRole !== "user" && actorRole !== "superadmin") {
    return deny(
      403,
      "Seul un super administrateur peut créer un compte administrateur",
    );
  }
  return { allowed: true };
}

/**
 * Account deletion (DELETE /api/users): deleting a superadmin revokes that
 * role, so only a superadmin may do it; nobody deletes their own account here.
 */
export function decideUserDeletion(actor: Actor, target: Target): Decision {
  if (!isAdminRole(actor.role)) return deny(403, "Non autorisé");
  if (actor.id === target.id) {
    return deny(403, "Vous ne pouvez pas supprimer votre propre compte");
  }
  if (target.role === "superadmin" && actor.role !== "superadmin") {
    return deny(
      403,
      "Seul un super administrateur peut supprimer un super administrateur",
    );
  }
  return { allowed: true };
}
