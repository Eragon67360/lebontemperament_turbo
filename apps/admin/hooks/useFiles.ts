import { CreateFileDTO, FileRecord } from "@/types/files";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

const filesKey = (programId: string, groupId: string, folderId?: string) =>
  ["files", programId, groupId, folderId ?? null] as const;

async function fetchFiles(
  programId: string,
  groupId: string,
  folderId?: string,
): Promise<FileRecord[]> {
  const response = await fetch(
    `/api/files?programId=${programId}&groupId=${groupId}${
      folderId ? `&folderId=${folderId}` : ""
    }`,
  );
  if (!response.ok) throw new Error("Failed to fetch files");
  return response.json() as Promise<FileRecord[]>;
}

// Fetch the files of one folder (root when folderId is undefined)
export function useFiles(
  programId: string,
  groupId: string,
  folderId?: string,
) {
  return useQuery({
    queryKey: filesKey(programId, groupId, folderId),
    queryFn: () => fetchFiles(programId, groupId, folderId),
  });
}

/**
 * The folder's files read again now, whatever the cache's age or an
 * in-flight refetch; the cache takes them so the explorer shows them. For
 * a save whose answer was lost: it tells whether the row exists after all.
 */
export async function refetchFiles(
  queryClient: QueryClient,
  programId: string,
  groupId: string,
  folderId?: string,
): Promise<FileRecord[]> {
  const files = await fetchFiles(programId, groupId, folderId);
  queryClient.setQueryData(filesKey(programId, groupId, folderId), files);
  return files;
}

// Create file record mutation (the upload to storage happens before)
export function useCreateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFileDTO) => {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Impossible de téléverser le fichier");
      }
      return response.json() as Promise<FileRecord>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Impossible de supprimer le fichier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
