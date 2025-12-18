import { AnniversaryHero, UpdateAnniversaryHeroDTO } from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get hero content (singleton)
export function useAnniversaryHero() {
  return useQuery({
    queryKey: ["anniversary", "hero"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/hero");
      if (!response.ok) throw new Error("Failed to fetch hero content");
      return response.json() as Promise<AnniversaryHero>;
    },
  });
}

// Update hero content
export function useUpdateAnniversaryHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAnniversaryHeroDTO) => {
      const response = await fetch("/api/anniversary/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update hero content");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anniversary", "hero"] });
    },
  });
}
