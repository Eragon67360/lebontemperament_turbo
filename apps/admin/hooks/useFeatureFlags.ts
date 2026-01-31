import { FeatureFlag, UpdateFeatureFlagDTO } from "@/types/feature-flags";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all feature flags
export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const response = await fetch("/api/feature-flags");
      if (!response.ok) throw new Error("Failed to fetch feature flags");
      return response.json() as Promise<FeatureFlag[]>;
    },
  });
}

// Get a specific feature flag
export function useFeatureFlag(flagKey: string) {
  return useQuery({
    queryKey: ["feature-flags", flagKey],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags?flag_key=${flagKey}`);
      if (!response.ok) throw new Error("Failed to fetch feature flag");
      return response.json() as Promise<FeatureFlag>;
    },
    enabled: !!flagKey,
  });
}

// Update feature flag mutation
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateFeatureFlagDTO) => {
      const response = await fetch("/api/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update feature flag");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all feature flags queries
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      // Also invalidate specific feature flag
      queryClient.invalidateQueries({
        queryKey: ["feature-flags", variables.flag_key],
      });
    },
  });
}
