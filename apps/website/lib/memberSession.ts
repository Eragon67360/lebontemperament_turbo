// lib/memberSession.ts
//
// Who may hold a session on the website: an account (never an anonymous
// sign-in) that has a `profiles` row. Only the admin writes that row, with
// the account or the invitation (audit SEC-006); the database does not add
// one for every new auth user. The sign-in paths keep a session only for
// such a member and sign anything else out at once, as the app does after
// Google and Apple sign-in.

import { ERROR_CODES } from "@repo/domain/consts/errorMessages";
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type Client = SupabaseClient<Database>;

/** A signed-in account, not an anonymous sign-in (`is_anonymous`). */
export function isAccountUser<U extends Pick<User, "is_anonymous">>(
  user: U | null | undefined,
): user is U {
  return !!user && user.is_anonymous !== true;
}

/**
 * Ends this browser's session. Only this one: a member whose profile read
 * failed for a moment keeps their other sessions (the app's included).
 */
async function endSession(supabase: Client): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.error("Sign-out failed:", error.message);
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
}

/**
 * True when the signed-in `user` is a member: an account with a profile row.
 * Otherwise the session is signed out and false is returned. A failed read
 * counts as no profile: the member can simply sign in again.
 */
export async function keepMemberSession(
  supabase: Client,
  user: Pick<User, "id" | "is_anonymous">,
): Promise<boolean> {
  if (isAccountUser(user)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data) return true;
  }
  await endSession(supabase);
  return false;
}

/** What the sign-in form reads: `result?.success` or `result?.error`. */
export type SignInResult =
  | { success: true; error?: undefined }
  | {
      success?: undefined;
      error:
        | typeof ERROR_CODES.INVALID_CREDENTIALS
        | typeof ERROR_CODES.PROFILE_NOT_FOUND;
    };

/**
 * The e-mail and password sign-in: refused with INVALID_CREDENTIALS by
 * Supabase, or PROFILE_NOT_FOUND (and signed out) when the account is not a
 * member's.
 */
export async function signInMember(
  supabase: Client,
  credentials: { email: string; password: string },
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error || !data.user) {
    return { error: ERROR_CODES.INVALID_CREDENTIALS };
  }
  if (!(await keepMemberSession(supabase, data.user))) {
    return { error: ERROR_CODES.PROFILE_NOT_FOUND };
  }
  return { success: true };
}
