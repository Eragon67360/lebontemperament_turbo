// hooks/useMailingListComparison.ts
import type { MailingListComparison } from "@repo/domain/roster/mailingList";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type MailingListComparisonResponse =
  | { enabled: false }
  | {
      enabled: true;
      cronCheckedAt: string | null;
      ok: true;
      checkedAt: string;
      comparison: MailingListComparison;
    }
  | {
      enabled: true;
      cronCheckedAt: string | null;
      ok: false;
      checkedAt: string;
      error: string;
    };

/** An answer the route refused, with its French message. */
export class ComparisonRequestError extends Error {
  readonly notInstalled: boolean;

  constructor(message: string, notInstalled = false) {
    super(message);
    this.name = "ComparisonRequestError";
    this.notInstalled = notInstalled;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    notInstalled?: boolean;
  };
  if (!response.ok) {
    throw new ComparisonRequestError(
      body.error ?? "La requête a échoué.",
      body.notInstalled === true,
    );
  }
  return body as T;
}

export const mailingListComparisonKey = (groupEmail: string) =>
  ["mailing-list-comparison", groupEmail] as const;

/** Runs the comparison of the group with the roster (when it is enabled). */
export function useMailingListComparison(groupEmail: string) {
  return useQuery<MailingListComparisonResponse, ComparisonRequestError>({
    queryKey: mailingListComparisonKey(groupEmail),
    queryFn: () =>
      request(
        `/api/mailing-list-comparison?groupEmail=${encodeURIComponent(groupEmail)}`,
      ),
    enabled: !!groupEmail,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useToggleMailingListComparison(groupEmail: string) {
  const queryClient = useQueryClient();
  return useMutation<{ enabled: boolean }, ComparisonRequestError, boolean>({
    mutationFn: (enabled) =>
      request("/api/mailing-list-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupEmail, enabled }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mailingListComparisonKey(groupEmail),
      }),
  });
}

export function useMailingListException(groupEmail: string) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    ComparisonRequestError,
    { email: string; keep: boolean; note?: string | null }
  >({
    mutationFn: ({ email, keep, note }) =>
      request("/api/mailing-list-comparison/exceptions", {
        method: keep ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          keep
            ? { groupEmail, email, note: note ?? null }
            : { groupEmail, email },
        ),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mailingListComparisonKey(groupEmail),
      }),
  });
}
