import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user as User | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 1, // Only retry once for auth failures
  });
}
