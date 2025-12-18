import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export async function checkAuthorization() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Non authentifié", status: 401 };
  }
  return { authorized: true, user: data.user };
}

/**
 * Check if the current authenticated user is an admin or superadmin
 * @param supabase - Supabase client instance
 * @param userId - The user ID to check (from auth.getUser())
 * @returns boolean indicating if user is admin
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return profile?.role === "admin" || profile?.role === "superadmin";
}

/**
 * Check if the current user is authenticated and is an admin
 * Used in server components to check admin status
 * @returns Object with isAdmin boolean and user object (or null)
 */
export async function checkAdminAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { isAdmin: false, user: null };
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const isAdminUser =
    userProfile?.role === "admin" || userProfile?.role === "superadmin";

  return {
    isAdmin: isAdminUser,
    user: data.user,
  };
}
