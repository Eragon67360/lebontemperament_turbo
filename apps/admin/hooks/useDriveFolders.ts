import type { Database } from "@repo/domain/database.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DriveFolder = Database["public"]["Tables"]["drive_folders"]["Row"];

export function useDriveFolders() {
  return useQuery({
    queryKey: ["drive-folders"],
    queryFn: async () => {
      const response = await fetch("/api/drive-folders");
      if (!response.ok) throw new Error("Failed to fetch drive folders");
      return response.json() as Promise<DriveFolder[]>;
    },
  });
}

export function useUpdateDriveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; folder_id: string }) => {
      const response = await fetch("/api/drive-folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update drive folder");
      }

      return response.json() as Promise<DriveFolder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-folders"] });
    },
  });
}
