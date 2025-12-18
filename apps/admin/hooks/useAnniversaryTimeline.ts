import {
  AnniversaryTimelineEvent,
  CreateTimelineEventDTO,
  UpdateTimelineEventDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all timeline events
export function useTimelineEvents() {
  return useQuery({
    queryKey: ["anniversary", "timeline"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/timeline");
      if (!response.ok) throw new Error("Failed to fetch timeline events");
      return response.json() as Promise<AnniversaryTimelineEvent[]>;
    },
  });
}

// Create timeline event
export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimelineEventDTO) => {
      const response = await fetch("/api/anniversary/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create timeline event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "timeline"] });
    },
  });
}

// Update timeline event
export function useUpdateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTimelineEventDTO) => {
      const response = await fetch("/api/anniversary/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update timeline event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "timeline"] });
    },
  });
}

// Delete timeline event
export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/timeline?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete timeline event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "timeline"] });
    },
  });
}
