// utils/invitations.ts
//
// Sends account invitations through Supabase Auth (its SMTP setting), in
// throttled batches. Shared by POST /api/invite-users and the roster sync's
// apply route so both take the same path and the same pace. Each invited
// account gets its member profile here, right after the invitation.

import {
  ensureMemberProfile,
  type ProfileClient,
} from "@/utils/users/memberProfile";
import { normalizeName } from "@repo/domain/roster/normalize";

export const INVITE_BATCH_SIZE = 10;
export const INVITE_BATCH_DELAY_MS = 1000;

export interface InvitationEntry {
  email: string;
  displayName: string;
}

export interface InvitationProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface InvitationResult extends InvitationEntry {
  success: boolean;
  error?: string;
  /** The auth account invited, when Supabase returned it. */
  userId?: string;
  progress: InvitationProgress;
}

/** French, for the admin: the e-mail went out, the profile did not. */
export const PROFILE_NOT_CREATED =
  "Invitation envoyée, mais la fiche du membre n'a pas pu être créée : renvoyez l'invitation.";

/** The slice of the service-role client the sender needs (fakeable in tests). */
export interface InviteClient extends ProfileClient {
  auth: {
    admin: {
      inviteUserByEmail(
        email: string,
        options: {
          data?: Record<string, unknown>;
          redirectTo?: string;
        },
      ): Promise<{
        data: { user: { id: string; email?: string } | null };
        error: { message: string } | null;
      }>;
    };
  };
}

export interface SendInvitationsOptions {
  /** Shown to the member as who invited them (stored in user metadata). */
  invitedBy: string;
  redirectTo: string;
  batchSize?: number;
  delayMs?: number;
  /** Injected for tests; defaults to a real pause between batches. */
  sleep?: (ms: number) => Promise<void>;
}

/** Where the invitation link lands: the website's profile-creation page. */
export function inviteRedirectUrl(): string {
  return process.env.VERCEL_ENV === "production"
    ? "https://www.lebontemperament.com/auth/create-profile"
    : "https://dev.lebontemperament.com/auth/create-profile";
}

function chunk<T>(array: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function sendInvitations(
  client: InviteClient,
  entries: readonly InvitationEntry[],
  options: SendInvitationsOptions,
): Promise<InvitationResult[]> {
  const batchSize = options.batchSize ?? INVITE_BATCH_SIZE;
  const delayMs = options.delayMs ?? INVITE_BATCH_DELAY_MS;
  const sleep = options.sleep ?? defaultSleep;
  const batches = chunk(entries, batchSize);
  const total = entries.length;
  let processed = 0;
  const results: InvitationResult[] = [];

  const progress = (): InvitationProgress => ({
    current: processed,
    total,
    percentage: total === 0 ? 100 : Math.round((processed / total) * 100),
  });

  for (const [index, batch] of batches.entries()) {
    const batchResults = await Promise.all(
      batch.map(async (entry): Promise<InvitationResult> => {
        const { email } = entry;
        // One order everywhere: « Prénom NOM », whatever was typed.
        const displayName = normalizeName(entry.displayName);
        const outcome = await inviteOne(client, email, displayName, options);
        processed++;
        return { email, displayName, ...outcome, progress: progress() };
      }),
    );
    results.push(...batchResults);
    if (index < batches.length - 1) await sleep(delayMs);
  }

  return results;
}

type InviteOutcome = Pick<InvitationResult, "success" | "error" | "userId">;

/** One invitation, then the invited account's member profile (role `user`). */
async function inviteOne(
  client: InviteClient,
  email: string,
  displayName: string,
  options: SendInvitationsOptions,
): Promise<InviteOutcome> {
  let user: { id: string; email?: string } | null;
  try {
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_by: options.invitedBy,
        display_name: displayName,
      },
      redirectTo: options.redirectTo,
    });
    if (error) return { success: false, error: error.message };
    user = data.user;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }

  // Someone invited again keeps the profile they already have, role included.
  try {
    if (!user) throw new Error("the invitation returned no account");
    await ensureMemberProfile(client, {
      id: user.id,
      email: user.email ?? email,
      role: "user",
      displayName: displayName || email.split("@")[0] || email,
    });
  } catch (error) {
    console.error(
      `Invitation sent, profile not written (${user?.id ?? "no account id"}):`,
      error,
    );
    return { success: false, error: PROFILE_NOT_CREATED, userId: user?.id };
  }
  return { success: true, userId: user.id };
}
