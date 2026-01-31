import {
  AnniversaryAudioMemory,
  CreateAudioMemoryDTO,
  UpdateAudioMemoryDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all audio memories
export function useAudioMemories() {
  return useQuery({
    queryKey: ["anniversary", "audio"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/audio");
      if (!response.ok) throw new Error("Failed to fetch audio memories");
      return response.json() as Promise<AnniversaryAudioMemory[]>;
    },
  });
}

// Create audio memory
export function useCreateAudioMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAudioMemoryDTO) => {
      const response = await fetch("/api/anniversary/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create audio memory");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "audio"] });
    },
  });
}

// Update audio memory
export function useUpdateAudioMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAudioMemoryDTO) => {
      const response = await fetch("/api/anniversary/audio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update audio memory");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "audio"] });
    },
  });
}

// Delete audio memory
export function useDeleteAudioMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/audio?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete audio memory");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "audio"] });
    },
  });
}
