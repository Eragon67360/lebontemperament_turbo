import type {
  ApplyItemResult,
  ApplyRequest,
  ApplySummary,
} from "@/utils/roster/apply";
import type {
  BulkDeleteItemResult,
  BulkDeleteRequest,
  BulkDeleteSummary,
} from "@/utils/roster/bulkDelete";
import type { RosterReview } from "@repo/domain/roster/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const ROSTER_REVIEW_KEY = ["users-sync"] as const;

export interface ApplyResponse {
  results: ApplyItemResult[];
  summary: ApplySummary;
}

export interface BulkDeleteResponse {
  results: BulkDeleteItemResult[];
  summary: BulkDeleteSummary;
}

/** The roster changed since the review: re-read it and choose again. */
export class RosterChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterChangedError";
  }
}

/**
 * The server reads the roster in production only (utils/memberLists.ts):
 * elsewhere it answers 403 with `productionOnly`, and asking again changes
 * nothing.
 */
export class RosterUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterUnavailableError";
  }
}

async function errorBody(response: Response) {
  return (await response.json().catch(() => null)) as {
    error?: unknown;
    productionOnly?: unknown;
  } | null;
}

async function errorMessage(response: Response, fallback: string) {
  const body = await errorBody(response);
  return body && typeof body.error === "string" ? body.error : fallback;
}

/** Reads the review; throws `RosterUnavailableError` outside production. */
export async function fetchRosterReview(): Promise<RosterReview> {
  const response = await fetch("/api/users/sync");
  if (!response.ok) {
    const body = await errorBody(response);
    const message =
      body && typeof body.error === "string"
        ? body.error
        : "La comparaison avec le tableau des membres a échoué.";
    throw body?.productionOnly === true
      ? new RosterUnavailableError(message)
      : new Error(message);
  }
  return response.json();
}

/** One retry after a failure, none after a refusal outside production. */
export function retryRosterReview(failureCount: number, error: Error) {
  return !(error instanceof RosterUnavailableError) && failureCount < 1;
}

/**
 * The reviewed diff between the roster and the accounts. The sheet is read
 * on the server each time, so the result is kept for a while and never
 * refetched on focus: the admin re-reads it with the page's button.
 */
export function useRosterReview() {
  return useQuery({
    queryKey: ROSTER_REVIEW_KEY,
    queryFn: fetchRosterReview,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: retryRosterReview,
  });
}

/** Applies the chosen invitations and updates; both lists are refreshed after. */
export function useApplyRosterSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ApplyRequest): Promise<ApplyResponse> => {
      const response = await fetch("/api/users/sync/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (response.status === 409) {
        throw new RosterChangedError(
          await errorMessage(
            response,
            "Le tableau des membres a changé depuis la vérification.",
          ),
        );
      }
      if (!response.ok) {
        throw new Error(
          await errorMessage(
            response,
            "L'application de la synchronisation a échoué.",
          ),
        );
      }
      return response.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ROSTER_REVIEW_KEY });
    },
  });
}

/**
 * Deletes the chosen accounts among « Absents de la liste » (superadmin
 * only, checked again on the server). The review is read again afterwards.
 */
export function useDeleteAbsentAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: BulkDeleteRequest,
    ): Promise<BulkDeleteResponse> => {
      const response = await fetch("/api/users/sync/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (response.status === 409) {
        throw new RosterChangedError(
          await errorMessage(
            response,
            "Le tableau des membres a changé depuis la vérification.",
          ),
        );
      }
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "La suppression des comptes a échoué."),
        );
      }
      return response.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ROSTER_REVIEW_KEY });
    },
  });
}
