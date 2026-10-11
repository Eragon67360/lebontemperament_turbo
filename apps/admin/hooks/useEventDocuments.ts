import type { EventDocument } from "@repo/domain/types/events";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const KEY = ["event-documents"];

/** Thrown by the list when the table isn't on this database yet. */
export class EventDocumentsNotInstalled extends Error {}

async function send<T>(method: string, body: unknown): Promise<T> {
  const response = await fetch("/api/events/documents", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

/** Every event's files, oldest first within an event. */
export function useEventDocuments() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const response = await fetch("/api/events/documents");
      const data = await response.json().catch(() => ({}));
      if (response.status === 503 && data.notInstalled) {
        throw new EventDocumentsNotInstalled(data.error);
      }
      if (!response.ok) throw new Error("Failed to fetch event documents");
      return data as EventDocument[];
    },
    retry: (count, error) =>
      !(error instanceof EventDocumentsNotInstalled) && count < 2,
  });
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
