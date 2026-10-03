import type { Database } from "@repo/domain/database.types";
import { parseBearerToken } from "@repo/domain/utils/bearer";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";

export type AuthorizationResult =
  | {
      authorized: true;
      user: User;
      /**
       * Client acting as the caller (cookie session or bearer token), so
       * row-level security applies to their queries.
       */
      supabase: SupabaseClient<Database>;
    }
  | { authorized: false; error: string; status: 401 };

const UNAUTHENTICATED = {
  authorized: false,
  error: "Non authentifié",
  status: 401,
} as const;

/** Supabase client that sends the caller's access token on every request. */
function createBearerClient(token: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

/**
 * Authenticates the caller of a route handler. The mobile app sends
 * `Authorization: Bearer <Supabase access token>`; browsers send the session
 * cookie. A bearer token, when present, decides on its own (an invalid one is
 * refused rather than falling back to cookies).
 */
export async function checkAuthorization(): Promise<AuthorizationResult> {
  const token = parseBearerToken((await headers()).get("authorization"));

  if (token) {
    const supabase = createBearerClient(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return UNAUTHENTICATED;
    }
    return { authorized: true, user: data.user, supabase };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return UNAUTHENTICATED;
  }
  return { authorized: true, user: data.user, supabase };
}

/**
 * Check if the current authenticated user is an admin or superadmin
 * @param supabase - Supabase client instance
 * @param userId - The user ID to check (from auth.getUser())
 * @returns boolean indicating if user is admin
 */
export async function isAdmin(
  supabase: SupabaseClient<Database>,
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
