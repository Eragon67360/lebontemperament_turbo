import type {
  AnniversaryHeroStat,
  CreateHeroStatDTO,
  UpdateHeroStatDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["anniversary", "hero-stats"];

// Fetch all hero stats
export function useAnniversaryHeroStats() {
  return useQuery<AnniversaryHeroStat[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/anniversary/hero-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch hero stats");
      }
      return response.json();
    },
  });
}

// Create hero stat
export function useCreateHeroStat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHeroStatDTO) => {
      const response = await fetch("/api/anniversary/hero-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create hero stat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// Update hero stat
export function useUpdateHeroStat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateHeroStatDTO) => {
      const response = await fetch("/api/anniversary/hero-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update hero stat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// Delete hero stat
export function useDeleteHeroStat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/hero-stats?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete hero stat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
