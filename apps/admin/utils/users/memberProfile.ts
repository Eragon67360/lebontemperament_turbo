// utils/users/memberProfile.ts
//
// A member is an account with a `profiles` row: the website's sign-in signs
// out an account without one and the admin refuses it. The database does not
// add that row for new auth users (audit SEC-006): the admin's server code
// writes it with the service role right after it creates the account, here
// for « Créer un compte » (POST /api/users) and in utils/invitations.ts for
// every invitation (POST /api/invite-users, the roster sync's apply).

import type { UserRole } from "@/utils/access";
import type { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createAdminClient>;

/** The profile row written with a new account. */
export interface NewMemberProfile {
  id: string;
  email: string;
  role: UserRole;
  /** « Prénom NOM », already normalised. */
  displayName: string;
}

/** The slice of the service-role client that writes the row (fakeable in tests). */
export interface ProfileClient {
  from(table: "profiles"): {
    upsert(
      row: { id: string; email: string; role: UserRole; display_name: string },
      options: { onConflict: "id"; ignoreDuplicates: true },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
}

/**
 * Adds the member's profile row unless one exists. An existing row is left
 * exactly as it is, role and name included: calling this twice, re-inviting
 * someone, or running while the database still adds the row itself changes
 * nothing. Throws when the row could not be written.
 */
export async function ensureMemberProfile(
  client: ProfileClient,
  member: NewMemberProfile,
): Promise<void> {
  const { error } = await client.from("profiles").upsert(
    {
      id: member.id,
      email: member.email,
      role: member.role,
      display_name: member.displayName,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`Profile ${member.id} not written: ${error.message}`);
  }
}

export interface NewAccount {
  email: string;
  password: string;
  role: UserRole;
  /** « Prénom NOM », already normalised. */
  displayName: string;
}

/**
 * « Créer un compte »: the auth account (e-mail confirmed, name in its
 * metadata) and its profile with the role the admin chose. When the profile
 * cannot be written, the new account is deleted again, so no account is left
 * without a profile and the admin can simply try again.
 */
export async function createMemberAccount(
  client: AdminClient,
  account: NewAccount,
): Promise<User> {
  const { data, error } = await client.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { display_name: account.displayName },
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error("createUser returned no account");

  try {
    await ensureMemberProfile(client, {
      id: user.id,
      email: user.email ?? account.email,
      role: account.role,
      displayName: account.displayName,
    });
    // The account is new, so a row that already exists can only be the one
    // the database added before the 2026-10-26 migration (role `user`): the
    // role and name chosen here go over it.
    const { error: roleError } = await client
      .from("profiles")
      .update({ role: account.role, display_name: account.displayName })
      .eq("id", user.id);
    if (roleError) {
      throw new Error(`Profile ${user.id} not written: ${roleError.message}`);
    }
  } catch (profileError) {
    try {
      const { error: deleteError } = await client.auth.admin.deleteUser(
        user.id,
      );
      if (deleteError) throw deleteError;
    } catch (deleteError) {
      console.error(
        `Account ${user.id} has no profile and could not be deleted:`,
        deleteError,
      );
    }
    throw profileError;
  }

  return user;
}
