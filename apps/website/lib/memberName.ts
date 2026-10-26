import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The name the association knows a member by: their profile's
 * `display_name`, set when the account is created and changed by the
 * administrators. Names shown to other people or sent to the association come
 * from here, never from the account's metadata, which the account holder can
 * edit. Null when the profile has no name or can't be read: each caller keeps
 * its own fallback (the e-mail address, « Non renseigné »).
 *
 * `db` acts as the member (row-level security lets them read their own row)
 * or is the service-role client.
 */
export async function readProfileName(
  db: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await db
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.warn("Profile name unavailable:", error.message);
      return null;
    }
    return data?.display_name?.trim() || null;
  } catch (error) {
    console.warn("Profile name unavailable:", error);
    return null;
  }
}
