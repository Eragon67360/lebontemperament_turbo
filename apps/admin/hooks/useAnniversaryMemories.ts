import { AnniversaryMemory, UpdateMemoryDTO } from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get memories with optional status filter ('approved', 'pending', 'all')
export function useMemories(status: "approved" | "pending" | "all" = "all") {
  return useQuery({
    queryKey: ["anniversary", "memories", status],
    queryFn: async () => {
      const response = await fetch(
        `/api/anniversary/memories?status=${status}`,
      );
      if (!response.ok) throw new Error("Failed to fetch memories");
      return response.json() as Promise<AnniversaryMemory[]>;
    },
  });
}

// Update memory (approve/feature)
export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemoryDTO) => {
      const response = await fetch("/api/anniversary/memories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update memory");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all memories queries (all statuses)
      queryClient.invalidateQueries({ queryKey: ["anniversary", "memories"] });
    },
  });
}

// Delete memory
export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/memories?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete memory");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all memories queries (all statuses)
      queryClient.invalidateQueries({ queryKey: ["anniversary", "memories"] });
    },
  });
}
