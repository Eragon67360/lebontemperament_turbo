import { CreateFileDTO, FileRecord } from "@/types/files";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch the files of one folder (root when folderId is undefined)
export function useFiles(
  programId: string,
  groupId: string,
  folderId?: string,
) {
  return useQuery({
    queryKey: ["files", programId, groupId, folderId ?? null],
    queryFn: async () => {
      const response = await fetch(
        `/api/files?programId=${programId}&groupId=${groupId}${
          folderId ? `&folderId=${folderId}` : ""
        }`,
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json() as Promise<FileRecord[]>;
    },
  });
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
