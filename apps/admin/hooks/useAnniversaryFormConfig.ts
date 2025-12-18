import {
  AnniversaryFormConfig,
  UpdateFormConfigDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get form config (singleton)
export function useFormConfig() {
  return useQuery({
    queryKey: ["anniversary", "form-config"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/form-config");
      if (!response.ok) throw new Error("Failed to fetch form config");
      return response.json() as Promise<AnniversaryFormConfig>;
    },
  });
}

// Update form config
export function useUpdateFormConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateFormConfigDTO) => {
      const response = await fetch("/api/anniversary/form-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update form config");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["anniversary", "form-config"],
      });
    },
  });
}
