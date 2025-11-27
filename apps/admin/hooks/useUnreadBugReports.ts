import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useUnreadBugReports() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["unread-bug-reports", user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("bug_reports")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) {
        return 0;
      }

      return count || 0;
    },
    // Refetch every minute to keep the count fresh
    refetchInterval: 60 * 1000,
    enabled: !!user,
  });
}
