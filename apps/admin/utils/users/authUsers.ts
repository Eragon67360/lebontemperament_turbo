// utils/users/authUsers.ts
//
// Auth users, read with the service-role client: the admin needs them to tell
// an invited account (« en attente ») from a confirmed one (« approuvé »).

import type { createAdminClient } from "@/utils/supabase/admin";
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

export type InviteStatus = "en attente" | "approuvé";

/** « approuvé » once the member confirmed their email or accepted the invitation. */
export function inviteStatusOf(authUser: User | undefined): InviteStatus {
  if (!authUser) return "en attente";
  if (
    (authUser.invited_at && authUser.confirmed_at) ||
    authUser.email_confirmed_at
  ) {
    return "approuvé";
  }
  return "en attente";
}
