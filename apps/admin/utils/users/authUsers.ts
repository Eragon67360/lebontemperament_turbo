// utils/users/authUsers.ts
//
// Auth users, read with the service-role client: the admin needs them to tell
// an invited account (« en attente ») from a confirmed one (« approuvé »).
//
// listAuthSummaries() reads the few fields the admin uses in one query
// (auth_user_summaries(), #345). Until that migration is applied it falls back
// to paging through the Auth admin API, as before.

import type { createAdminClient } from "@/utils/supabase/admin";
import { isMissingFunctionError } from "@repo/domain/utils/supabaseErrors";
import type { User } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createAdminClient>;

const PAGE_SIZE = 50;

/** Every auth user, page by page (the API caps a page at 50 by default). */
export async function listAllAuthUsers(client: AdminClient): Promise<User[]> {
  const all: User[] = [];
  let page = 1;
  for (;;) {
    const {
      data: { users },
      error,
    } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    if (!users || users.length === 0) break;
    all.push(...users);
    if (users.length < PAGE_SIZE) break;
    page++;
  }
  return all;
}

/** The Auth fields the admin reads. */
export type AuthSummary = {
  id: string;
  invited_at: string | null;
  confirmed_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  avatar_url: string | null;
};

export function summaryOf(user: User): AuthSummary {
  const avatar = user.user_metadata?.avatar_url;
  return {
    id: user.id,
    invited_at: user.invited_at ?? null,
    confirmed_at: user.confirmed_at ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    avatar_url: typeof avatar === "string" ? avatar : null,
  };
}

/**
 * Every account's Auth summary: one database call through
 * auth_user_summaries(), or, when the function is not there yet (the
 * migration is applied by hand), the paged Auth admin API.
 */
export async function listAuthSummaries(
  client: AdminClient,
): Promise<AuthSummary[]> {
  const { data, error } = await client.rpc("auth_user_summaries");
  if (!error) return data ?? [];
  if (!isMissingFunctionError(error)) throw error;
  return (await listAllAuthUsers(client)).map(summaryOf);
}

export type InviteStatus = "en attente" | "approuvé";

/** « approuvé » once the member confirmed their email or accepted the invitation. */
export function inviteStatusOf(
  authUser: AuthSummary | undefined,
): InviteStatus {
  if (!authUser) return "en attente";
  if (
    (authUser.invited_at && authUser.confirmed_at) ||
    authUser.email_confirmed_at
  ) {
    return "approuvé";
  }
  return "en attente";
}
