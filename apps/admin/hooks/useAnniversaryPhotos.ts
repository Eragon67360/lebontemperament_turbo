import {
  AnniversaryPhoto,
  CreatePhotoDTO,
  UpdatePhotoDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all photos
export function usePhotos() {
  return useQuery({
    queryKey: ["anniversary", "photos"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/photos");
      if (!response.ok) throw new Error("Failed to fetch photos");
      return response.json() as Promise<AnniversaryPhoto[]>;
    },
  });
}

// Create photo
export function useCreatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePhotoDTO) => {
      const response = await fetch("/api/anniversary/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create photo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "photos"] });
    },
  });
}

// Update photo
export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePhotoDTO) => {
      const response = await fetch("/api/anniversary/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update photo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "photos"] });
    },
  });
}

// Delete photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/photos?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete photo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "photos"] });
    },
  });
}
