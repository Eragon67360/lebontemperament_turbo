import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BugReport, UpdateBugReportStatusDTO } from "@/types/bug-reports";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch bug reports
export function useBugReports() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  return useQuery({
    queryKey: ["bug-reports", user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bug_reports")
        .select(
          `
                *,
                profiles:reported_by(email, display_name)
            `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BugReport[];
    },
    enabled: !!user,
  });
}

// Update bug report status mutation
export function useUpdateBugReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateBugReportStatusDTO) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("bug_reports")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-reports"] });
    },
  });
}

// Mark bug reports as read mutation
export function useMarkBugReportsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("bug_reports")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-reports"] });
    },
  });
}
