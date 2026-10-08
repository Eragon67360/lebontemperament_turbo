import type {
  DocumentCollection,
  SiteDocument,
} from "@repo/domain/types/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DocumentsData = {
  collections: DocumentCollection[];
  documents: SiteDocument[];
  canDelete: boolean;
};

export type DocumentRevision = {
  id: number;
  operation: "UPDATE" | "DELETE";
  old_row: unknown;
  changed_by: string | null;
  changed_at: string;
};

export class NotInstalledError extends Error {}

const KEY = ["site-documents"];

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

export function useDocuments() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => send<DocumentsData>("/api/documents", "GET"),
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

export type DocumentCreate = {
  collection_id: string;
  title: string;
  file_name: string;
  storage_key: string;
  document_date: string | null;
  date_precision: "day" | "month" | "year" | null;
  visibility: "public" | "members";
};

export type DocumentPatch = Partial<
  Pick<
    DocumentCreate,
    "title" | "document_date" | "date_precision" | "visibility" | "storage_key"
  > & { status: "published" | "archived" }
>;

export const useCreateDocument = () =>
  useInvalidating((body: DocumentCreate) =>
    send<SiteDocument>("/api/documents", "POST", body),
  );

export const useUpdateDocument = () =>
  useInvalidating(({ id, ...patch }: DocumentPatch & { id: string }) =>
    send<SiteDocument>(`/api/documents/${id}`, "PATCH", patch),
  );

export const useDeleteDocument = () =>
  useInvalidating((id: string) => send(`/api/documents/${id}`, "DELETE"));

export function useDocumentRevisions(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "revisions", id],
    queryFn: () =>
      send<DocumentRevision[]>(`/api/documents/${id}/revisions`, "GET"),
    enabled: Boolean(id),
  });
}

export function useRestoreRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revisionId }: { id: string; revisionId: number }) =>
      send<SiteDocument>(`/api/documents/${id}/revisions`, "POST", {
        revision_id: revisionId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useCreateCollection = () =>
  useInvalidating(
    (body: { label: string; description: string | null; slug: string }) =>
      send<DocumentCollection>("/api/documents/collections", "POST", body),
  );

export const useUpdateCollection = () =>
  useInvalidating(
    (body: { id: string; label?: string; description?: string | null }) =>
      send<DocumentCollection>("/api/documents/collections", "PATCH", body),
  );

export const useDeleteCollection = () =>
  useInvalidating((id: string) =>
    send("/api/documents/collections", "DELETE", { id }),
  );
