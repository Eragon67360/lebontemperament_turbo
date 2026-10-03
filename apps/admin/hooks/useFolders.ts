import { CreateFolderDTO, Folder } from "@/types/files";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch every folder of a program group (the tree is filtered client-side)
export function useFolders(programId: string, groupId: string) {
  return useQuery({
    queryKey: ["folders", programId, groupId],
    queryFn: async () => {
      const response = await fetch(
        `/api/folders?programId=${programId}&groupId=${groupId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch folders");
      return response.json() as Promise<Folder[]>;
    },
  });
}

// Create folder mutation
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFolderDTO) => {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Impossible de créer le dossier");
      }
      return response.json() as Promise<Folder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

// Delete folder mutation (the API also removes the files it holds)
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Impossible de supprimer le dossier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
