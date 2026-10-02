import type { User } from "@supabase/supabase-js";
import { decideAccess, type AdminRole } from "./access";
import { createClient } from "./supabase/server";

export type AuthorizationResult =
  | { authorized: true; user: User; role: AdminRole }
  | { authorized: false; error: string; status: 401 | 403 };

async function authorize(required: AdminRole): Promise<AuthorizationResult> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  let role: unknown = null;
  if (data.user) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    role = userProfile?.role;
  }

  const decision = decideAccess(data.user, role, required);
  if (!decision.allowed) {
    return {
      authorized: false,
      error: decision.error,
      status: decision.status,
    };
  }
  return { authorized: true, user: decision.user, role: decision.role };
}

/**
 * Signed-in admin or superadmin. Every admin API handler starts with this
 * (401 when signed out, 403 for any other role) before touching data.
 */
export function checkAuthorization() {
  return authorize("admin");
}

/** Superadmin only. */
export function checkDriverAuthorization() {
  return authorize("superadmin");
}
