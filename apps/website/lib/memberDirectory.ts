import type { Database } from "@repo/domain/database.types";
import { isMissingFunctionError } from "@repo/domain/utils/supabaseErrors";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<Database>;

/** One member as the directory shows them: name, email, voice and photo only. */
export type DirectoryRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  voice: string | null;
  profile_picture_url: string | null;
  /** Google avatar kept in the account's metadata, when there is one. */
  auth_avatar_url: string | null;
};

const PAGE_SIZE = 50;

/** Google avatars by account id, paging through the Auth admin API. */
async function authAvatars(admin: Client): Promise<Map<string, string>> {
  const avatars = new Map<string, string>();
  for (let page = 1; ; page++) {
    const {
      data: { users },
      error,
    } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) {
      // Continue without Google avatars rather than failing the directory.
      console.error(`Error fetching users page ${page}:`, error);
      break;
    }
    if (!users || users.length === 0) break;
    for (const user of users) {
      const avatar = user.user_metadata?.avatar_url;
      if (typeof avatar === "string" && avatar) avatars.set(user.id, avatar);
    }
    if (users.length < PAGE_SIZE) break;
  }
  return avatars;
}

/**
 * The members directory, acting as the caller. One database call through
 * member_directory_with_avatars() (#345); until that migration is applied it
 * falls back to member_directory() plus the paged Auth admin API.
 */
export async function loadMemberDirectory(
  supabase: Client,
  admin: Client,
): Promise<{ rows: DirectoryRow[]; error: { message: string } | null }> {
  const withAvatars = await supabase.rpc("member_directory_with_avatars");
  if (!withAvatars.error) {
    return { rows: withAvatars.data ?? [], error: null };
  }
  if (!isMissingFunctionError(withAvatars.error)) {
    return { rows: [], error: withAvatars.error };
  }

  const plain = await supabase.rpc("member_directory");
  if (plain.error) return { rows: [], error: plain.error };
  const avatars = await authAvatars(admin).catch((error) => {
    console.error("Error fetching auth users:", error);
    return new Map<string, string>();
  });
  return {
    rows: (plain.data ?? []).map((row) => ({
      ...row,
      auth_avatar_url: avatars.get(row.id) ?? null,
    })),
    error: null,
  };
}
