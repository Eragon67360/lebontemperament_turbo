import {
  AnniversaryVideo,
  CreateVideoDTO,
  UpdateVideoDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all videos
export function useVideos() {
  return useQuery({
    queryKey: ["anniversary", "videos"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json() as Promise<AnniversaryVideo[]>;
    },
  });
}

// Create video
export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVideoDTO) => {
      const response = await fetch("/api/anniversary/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "videos"] });
    },
  });
}

// Update video
export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVideoDTO) => {
      const response = await fetch("/api/anniversary/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "videos"] });
    },
  });
}

// Delete video
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/videos?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "videos"] });
    },
  });
}
