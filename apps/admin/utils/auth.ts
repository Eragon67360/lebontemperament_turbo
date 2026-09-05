import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export async function checkAuthorization() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Non authentifié", status: 401 } as const;
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!["admin", "superadmin"].includes(userProfile?.role ?? "user")) {
    return { authorized: false, error: "Non autorisé", status: 403 } as const;
  }

  return { authorized: true, user: data.user } as const;
}

// utils/auth.ts
export async function isAdmin(supabase: SupabaseClient<Database>) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return profile?.role === "admin" || profile?.role === "superadmin";
}

export async function checkDriverAuthorization() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Non authentifié", status: 401 };
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!userProfile || userProfile.role !== "superadmin") {
    return {
      authorized: false,
      error: "Non autorisé - Rôle superadmin requis",
      status: 403,
    };
  }

  return { authorized: true, user: data.user };
}
