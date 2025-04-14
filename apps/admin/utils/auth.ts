import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export async function checkAuthorization() {
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

  if (!userProfile || !["admin", "superadmin"].includes(userProfile.role)) {
    return { authorized: false, error: "Non autorisé", status: 403 };
  }

  return { authorized: true, user: data.user };
}

// utils/auth.ts
export async function isAdmin(supabase: SupabaseClient) {
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
