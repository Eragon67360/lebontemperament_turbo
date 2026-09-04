import { CreateCADTO } from "@/types/ca";
import { CA } from "@repo/domain/types/ca";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch CAs
export function useCAs() {
  return useQuery({
    queryKey: ["cas"],
    queryFn: async () => {
      const response = await fetch("/api/cas");
      if (!response.ok) throw new Error("Failed to fetch CAs");
      return response.json() as Promise<CA[]>;
    },
  });
}

// Create CA mutation
export function useCreateCA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCADTO) => {
      const response = await fetch("/api/cas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create CA");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cas"] });
    },
  });
}

// Delete CA mutation
export function useDeleteCA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/cas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete CA");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cas"] });
    },
  });
}
