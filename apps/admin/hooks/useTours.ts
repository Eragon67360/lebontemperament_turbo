import { CreateTourDTO, Tour, UpdateTourDTO } from "@/types/tours";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch tours
export function useTours() {
  return useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const response = await fetch("/api/tours");
      if (!response.ok) throw new Error("Failed to fetch tours");
      return response.json() as Promise<Tour[]>;
    },
  });
}

// Create tour mutation
export function useCreateTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTourDTO) => {
      const response = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tour");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Update tour mutation
export function useUpdateTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTourDTO) => {
      const response = await fetch("/api/tours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tour");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}

// Delete tour mutation
export function useDeleteTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/tours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tour");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}
