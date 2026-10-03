import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type CurrentProfile = {
  role: "user" | "admin" | "superadmin" | null;
  profile_picture_url: string | null;
};

/** The signed-in user's own profile row (role + avatar), cached for the session. */
export function useCurrentProfile() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["currentProfile", user?.id],
    queryFn: async (): Promise<CurrentProfile> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("role, profile_picture_url")
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      return data as CurrentProfile;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
