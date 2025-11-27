import { Concert, CreateConcertDTO, UpdateConcertDTO } from "@/types/concerts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useConcerts() {
  return useQuery({
    queryKey: ["concerts"],
    queryFn: async () => {
      const response = await fetch("/api/prochains-concerts");
      if (!response.ok) throw new Error("Failed to fetch concerts");
      return response.json() as Promise<Concert[]>;
    },
  });
}

// Create concert mutation
export function useCreateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConcertDTO) => {
      const response = await fetch("/api/prochains-concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create concert");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
      // Also invalidate activities as creating a concert might log an activity
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Update concert mutation
export function useUpdateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateConcertDTO) => {
      const response = await fetch("/api/prochains-concerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update concert");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

// Delete concert mutation
export function useDeleteConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/prochains-concerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete concert");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concerts"] });
    },
  });
}
