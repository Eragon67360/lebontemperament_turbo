// utils/invitations.ts
//
// Sends account invitations through Supabase Auth (its SMTP setting), in
// throttled batches. Shared by POST /api/invite-users and the roster sync's
// apply route so both take the same path and the same pace.

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
  /** The auth user created by the invitation, when it succeeded. */
  userId?: string;
  progress: InvitationProgress;
}

/** The slice of the service-role client the sender needs (fakeable in tests). */
export interface InviteClient {
  auth: {
    admin: {
      inviteUserByEmail(
        email: string,
        options: {
          data?: Record<string, unknown>;
          redirectTo?: string;
        },
      ): Promise<{
        data: { user: { id: string } | null };
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
        try {
          const { data, error } = await client.auth.admin.inviteUserByEmail(
            email,
            {
              data: {
                invited_by: options.invitedBy,
                display_name: displayName,
              },
              redirectTo: options.redirectTo,
            },
          );
          processed++;
          if (error) {
            return {
              email,
              displayName,
              success: false,
              error: error.message,
              progress: progress(),
            };
          }
          return {
            email,
            displayName,
            success: true,
            userId: data.user?.id,
            progress: progress(),
          };
        } catch (error) {
          processed++;
          return {
            email,
            displayName,
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            progress: progress(),
          };
        }
      }),
    );
    results.push(...batchResults);
    if (index < batches.length - 1) await sleep(delayMs);
  }

  return results;
}
