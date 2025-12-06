import { CreateRehearsalDTO, Rehearsal } from "@/types/rehearsals";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch rehearsals
export function useRehearsals() {
  return useQuery({
    queryKey: ["rehearsals"],
    queryFn: async () => {
      const response = await fetch("/api/rehearsals");
      if (!response.ok) throw new Error("Failed to fetch rehearsals");
      return response.json() as Promise<Rehearsal[]>;
    },
  });
}

// Create rehearsal mutation
export function useCreateRehearsal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRehearsalDTO | CreateRehearsalDTO[]) => {
      const response = await fetch("/api/rehearsals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create rehearsal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals"] });
    },
  });
}

// Update rehearsal mutation
export function useUpdateRehearsal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateRehearsalDTO> & { id: string }) => {
      const response = await fetch("/api/rehearsals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update rehearsal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals"] });
    },
  });
}

// Delete rehearsal mutation
export function useDeleteRehearsal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/rehearsals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete rehearsal");
      }

      // DELETE returns 204 No Content, so no JSON to parse
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals"] });
    },
  });
}
