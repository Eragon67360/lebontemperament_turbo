import { NotInstalledError } from "@/hooks/useDocuments";
import type { Tables } from "@repo/domain/database.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Status = { status: "published" | "archived" };

export type FaqItem = Omit<
  Tables<"faq_items">,
  "created_by" | "updated_by" | "created_at" | "status"
> &
  Status;

export type JoiningSlot = Omit<
  Tables<"joining_slots">,
  "created_by" | "updated_by" | "created_at" | "status"
> &
  Status;

export type JoiningContentData = {
  slots: JoiningSlot[];
  faq: FaqItem[];
  canDelete: boolean;
};

export type FaqInput = Pick<
  FaqItem,
  "question" | "answer" | "link_href" | "link_label"
>;
export type SlotInput = Pick<
  JoiningSlot,
  "group_name" | "day" | "time_label" | "place" | "rhythm"
>;

const KEY = ["joining-content"];
const BASE = "/api/joining-content";

async function send<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (json?.notInstalled) throw new NotInstalledError(json.error);
    throw new Error(json?.error || `Erreur ${response.status}`);
  }
  return json as T;
}

export function useJoiningContent() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => send<JoiningContentData>(BASE, "GET"),
    retry: (count, error) => !(error instanceof NotInstalledError) && count < 2,
  });
}

function useInvalidating<V, R>(fn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

type Kind = "faq" | "slots";
type Patch = Record<string, unknown> & { id: string };

export const useCreateJoiningRow = () =>
  useInvalidating(
    ({ kind, body }: { kind: Kind; body: FaqInput | SlotInput }) =>
      send(`${BASE}/${kind}`, "POST", body),
  );

/** One or several edits (a move updates two rows). */
export const useUpdateJoiningRows = () =>
  useInvalidating(
    async ({ kind, patches }: { kind: Kind; patches: Patch[] }) => {
      for (const { id, ...patch } of patches) {
        await send(`${BASE}/${kind}/${id}`, "PATCH", patch);
      }
    },
  );

export const useDeleteJoiningRow = () =>
  useInvalidating(({ kind, id }: { kind: Kind; id: string }) =>
    send(`${BASE}/${kind}/${id}`, "DELETE"),
  );
