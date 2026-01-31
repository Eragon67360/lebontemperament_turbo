import {
  AnniversaryArchive,
  CreateArchiveDTO,
  UpdateArchiveDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all archives
export function useArchives() {
  return useQuery({
    queryKey: ["anniversary", "archives"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/archives");
      if (!response.ok) throw new Error("Failed to fetch archives");
      return response.json() as Promise<AnniversaryArchive[]>;
    },
  });
}

// Create archive
export function useCreateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArchiveDTO) => {
      const response = await fetch("/api/anniversary/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create archive");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "archives"] });
    },
  });
}

// Update archive
export function useUpdateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateArchiveDTO) => {
      const response = await fetch("/api/anniversary/archives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update archive");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "archives"] });
    },
  });
}

// Delete archive
export function useDeleteArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/archives?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete archive");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "archives"] });
    },
  });
}
