import type {
  ApplyItemResult,
  ApplyRequest,
  ApplySummary,
} from "@/utils/roster/apply";
import type { RosterReview } from "@repo/domain/roster/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const ROSTER_REVIEW_KEY = ["users-sync"] as const;

export interface ApplyResponse {
  results: ApplyItemResult[];
  summary: ApplySummary;
}

/** The roster changed since the review: re-read it and choose again. */
export class RosterChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterChangedError";
  }
}

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  return body && typeof body.error === "string" ? body.error : fallback;
}

/**
 * The reviewed diff between the roster and the accounts. The sheet is read
 * on the server each time, so the result is kept for a while and never
 * refetched on focus: the admin re-reads it with the page's button.
 */
export function useRosterReview() {
  return useQuery({
    queryKey: ROSTER_REVIEW_KEY,
    queryFn: async (): Promise<RosterReview> => {
      const response = await fetch("/api/users/sync");
      if (!response.ok) {
        throw new Error(
          await errorMessage(
            response,
            "La comparaison avec le tableau des membres a échoué.",
          ),
        );
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
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
