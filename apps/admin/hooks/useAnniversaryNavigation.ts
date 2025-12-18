import {
  AnniversaryNavigationCard,
  CreateNavigationCardDTO,
  UpdateNavigationCardDTO,
} from "@/types/anniversary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all navigation cards
export function useNavigationCards() {
  return useQuery({
    queryKey: ["anniversary", "navigation"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/navigation");
      if (!response.ok) throw new Error("Failed to fetch navigation cards");
      return response.json() as Promise<AnniversaryNavigationCard[]>;
    },
  });
}

// Create navigation card
export function useCreateNavigationCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNavigationCardDTO) => {
      const response = await fetch("/api/anniversary/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create navigation card");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["anniversary", "navigation"],
      });
    },
  });
}

// Update navigation card
export function useUpdateNavigationCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNavigationCardDTO) => {
      const response = await fetch("/api/anniversary/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update navigation card");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["anniversary", "navigation"],
      });
    },
  });
}

// Delete navigation card
export function useDeleteNavigationCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/anniversary/navigation?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete navigation card");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["anniversary", "navigation"],
      });
    },
  });
}
