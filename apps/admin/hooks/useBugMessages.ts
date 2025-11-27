import {
  BugMessage,
  CreateBugMessageDTO,
  GetBugMessagesParams,
  UpdateBugMessageDTO,
} from "@/types/bugMessages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useBugMessages(params: GetBugMessagesParams) {
  return useQuery({
    queryKey: ["bug-messages", params.bug_report_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/bug-messages?bug_report_id=${params.bug_report_id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch bug messages");
      return response.json() as Promise<BugMessage[]>;
    },
    enabled: !!params.bug_report_id,
  });
}

// Create bug message mutation
export function useCreateBugMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBugMessageDTO) => {
      const response = await fetch("/api/bug-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create bug message");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific bug report's messages
      queryClient.invalidateQueries({
        queryKey: ["bug-messages", variables.bug_report_id],
      });
    },
  });
}

// Update bug message mutation
export function useUpdateBugMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBugMessageDTO) => {
      const response = await fetch("/api/bug-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update bug message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all bug messages queries (we could be more specific if needed)
      queryClient.invalidateQueries({
        queryKey: ["bug-messages"],
      });
    },
  });
}

// Delete bug message mutation
export function useDeleteBugMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/bug-messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete bug message");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all bug messages queries
      queryClient.invalidateQueries({
        queryKey: ["bug-messages"],
      });
    },
  });
}

// Mark messages as read mutation
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bug_report_id: string) => {
      const response = await fetch("/api/bug-messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bug_report_id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark messages as read");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate bug messages and bug reports to update unread counts
      queryClient.invalidateQueries({
        queryKey: ["bug-messages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-bug-reports"],
      });
    },
  });
}
