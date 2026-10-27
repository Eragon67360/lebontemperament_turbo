import type { EventDocument } from "@repo/domain/types/events";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

const KEY = ["event-documents"];

/** Thrown by the list when the table isn't on this database yet. */
export class EventDocumentsNotInstalled extends Error {}

async function send<T>(method: string, body: unknown): Promise<T> {
  const response = await fetch("/api/events/documents", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    // No answer at all (no network, a reset connection): the server may or
    // may not have done the work.
    throw new Error("Le serveur n'a pas répondu. Vérifiez votre connexion.");
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Le document n'a pas pu être enregistré",
    );
  }
  return data as T;
}

async function fetchEventDocuments(): Promise<EventDocument[]> {
  const response = await fetch("/api/events/documents");
  const data = await response.json().catch(() => ({}));
  if (response.status === 503 && data.notInstalled) {
    throw new EventDocumentsNotInstalled(data.error);
  }
  if (!response.ok) throw new Error("Failed to fetch event documents");
  return data as EventDocument[];
}

/** Every event's files, oldest first within an event. */
export function useEventDocuments() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchEventDocuments,
    retry: (count, error) =>
      !(error instanceof EventDocumentsNotInstalled) && count < 2,
  });
}

/**
 * The server's list read again now, whatever the cache's age or an
 * in-flight refetch; the cache takes it so the page shows it. For a save
 * whose answer was lost: it tells whether the row exists after all.
 */
export async function refetchEventDocuments(
  queryClient: QueryClient,
): Promise<EventDocument[]> {
  const documents = await fetchEventDocuments();
  queryClient.setQueryData(KEY, documents);
  return documents;
}

export type EventDocumentCreate = Pick<
  EventDocument,
  "event_id" | "label" | "file_name" | "storage_key" | "mime_type"
>;

export function useCreateEventDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EventDocumentCreate) =>
      send<EventDocument>("POST", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRenameEventDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; label: string }) =>
      send<EventDocument>("PATCH", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEventDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => send<{ ok: true }>("DELETE", { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
