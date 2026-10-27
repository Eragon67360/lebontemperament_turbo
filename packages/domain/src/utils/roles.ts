// Account roles (`profiles.role`) and who may use the admin: pure rules shared
// by the website and the admin, unit-tested in roles.test.ts. The edge
// functions (Deno) keep their own copy in
// supabase/functions/_shared/caller-auth.ts.
import type { Database } from "../database.types";

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

/**
 * An administrator: exactly `admin` or `superadmin`. Anything else is not: a
 * member, a missing profile or role, an unknown or misspelt role.
 */
export function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "superadmin";
}

export type AccessDenied = {
  allowed: false;
  status: 401 | 403;
  error: string;
};

/**
 * Who may use the admin: a signed-in user whose profile role is admin or
 * superadmin (`required: "admin"`, the default), or superadmin only.
 */
export function decideAccess<U extends { id: string }>(
  user: U | null | undefined,
  role: unknown,
  required: AdminRole = "admin",
): { allowed: true; user: U; role: AdminRole } | AccessDenied {
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
