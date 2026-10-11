// utils/roster/bulkDelete.ts
//
// Bulk deletion of the accounts that are no longer in the member roster
// (« Absents de la liste », yearly clean-up of former members, #354), with its
// dependencies injected so the route stays thin and this logic is unit-tested.
//
// The client only names profile ids. The server re-reads the roster and the
// accounts and deletes an account only if it is *still* absent from the
// roster on that read, with the same permission rule as the single deletion
// (`decideUserDeletion`): superadmin only, never one's own account. Nothing is
// deleted on a roster that fails validation (an empty or broken sheet would
// make everybody « absent »).

import { decideUserDeletion, isUserRole, type UserRole } from "@/utils/access";
import { ROSTER_CHANGED_MESSAGE } from "@/utils/roster/apply";
import type { BuiltReview } from "@/utils/roster/review";

/** Each deletion is a handful of calls; 50 keep one request well inside the route's time limit. */
export const MAX_BULK_DELETIONS = 50;

export interface BulkDeleteRequest {
  fingerprint: string;
  ids: string[];
}

export interface BulkDeleteItemResult {
  /** The profile id. */
  id: string;
  /** Who it concerns: name and email, for the result list. */
  label: string;
  status: "done" | "failed";
  /** French, when `failed`. */
  reason?: string;
}

export interface BulkDeleteSummary {
  done: number;
  failed: number;
}

export type BulkDeleteOutcome =
  | {
      status: 200;
      body: { results: BulkDeleteItemResult[]; summary: BulkDeleteSummary };
    }
  | { status: 400 | 403 | 409; body: { error: string } };

export interface BulkDeleteDeps {
  actor: { id: string; role: UserRole };
  /** Re-reads the roster and the profiles. */
  buildReview: () => Promise<BuiltReview>;
  /**
   * Deletes the account the same way the single deletion does (its Storage
   * files, then the Auth user, which removes the rest). Throws on failure.
   */
  deleteAccount: (profileId: string) => Promise<void>;
  /** One log entry per account deleted. Must not throw. */
  logDeletion: (entry: { profileId: string; role: string }) => void;
}

/** Shape check of the request body; the French message is for the admin. */
export function parseBulkDeleteRequest(
  body: unknown,
): { ok: true; request: BulkDeleteRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Requête invalide." };
  }
  const { fingerprint, ids } = body as Record<string, unknown>;
  if (typeof fingerprint !== "string" || fingerprint === "") {
    return { ok: false, error: "L'empreinte du tableau est requise." };
  }
  if (
    !Array.isArray(ids) ||
    !ids.every((id) => typeof id === "string" && id !== "")
  ) {
    return { ok: false, error: "La liste des comptes est invalide." };
  }
  const unique = Array.from(new Set(ids as string[]));
  if (unique.length === 0) {
    return { ok: false, error: "Aucun compte à supprimer." };
  }
  if (unique.length > MAX_BULK_DELETIONS) {
    return {
      ok: false,
      error: `Au plus ${MAX_BULK_DELETIONS} comptes par suppression : supprimez, puis recommencez.`,
    };
  }
  return { ok: true, request: { fingerprint, ids: unique } };
}

const NOT_ABSENT_REASON =
  "Ce compte n'est plus absent de la liste (ou n'existe plus) : il n'est pas supprimé.";
const DELETE_FAILED_REASON =
  "La suppression a échoué : le compte est conservé.";

export async function deleteAbsentMembers(
  request: BulkDeleteRequest,
  deps: BulkDeleteDeps,
): Promise<BulkDeleteOutcome> {
  // Whether this person may delete accounts at all, before reading anything.
  const general = decideUserDeletion(deps.actor, {
    id: "",
    role: "user",
  });
  if (!general.allowed) {
    return { status: 403, body: { error: general.error } };
  }

  const { review, diff } = await deps.buildReview();
  if (review.validation.errors.length > 0) {
    return {
      status: 409,
      body: {
        error: review.validation.errors[0]?.message ?? ROSTER_CHANGED_MESSAGE,
      },
    };
  }
  if (review.fingerprint !== request.fingerprint) {
    return { status: 409, body: { error: ROSTER_CHANGED_MESSAGE } };
  }

  const absentById = new Map(diff.absents.map((a) => [a.profileId, a]));
  const results: BulkDeleteItemResult[] = [];
  const summary: BulkDeleteSummary = { done: 0, failed: 0 };
  const record = (result: BulkDeleteItemResult) => {
    results.push(result);
    summary[result.status]++;
  };

  for (const id of request.ids) {
    const account = absentById.get(id);
    if (!account) {
      record({ id, label: id, status: "failed", reason: NOT_ABSENT_REASON });
      continue;
    }
    const label = `${account.displayName || "sans nom"} (${account.email})`;
    const decision = decideUserDeletion(deps.actor, {
      id,
      role: isUserRole(account.role) ? account.role : "user",
    });
    if (!decision.allowed) {
      record({ id, label, status: "failed", reason: decision.error });
      continue;
    }
    try {
      await deps.deleteAccount(id);
    } catch (error) {
      console.error(`Bulk deletion: account ${id} not deleted:`, error);
      record({ id, label, status: "failed", reason: DELETE_FAILED_REASON });
      continue;
    }
    deps.logDeletion({ profileId: id, role: account.role });
    record({ id, label, status: "done" });
  }

  return { status: 200, body: { results, summary } };
}
