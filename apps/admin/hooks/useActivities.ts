import { useQuery } from "@tanstack/react-query";

export interface Activity {
  id: string;
  type: string;
  user_id: string;
  target_id: string | null;
  title: string;
  description: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

export function useActivities(limit = 15) {
  return useQuery({
    queryKey: ["activities", limit],
    queryFn: async () => {
      const response = await fetch(`/api/activities?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json() as Promise<Activity[]>;
    },
  });
}

/** What happened to one account (invitation, creation, role changes), newest first. */
export function useMemberActivity(profileId: string | undefined) {
  return useQuery({
    queryKey: ["activities", "target", profileId],
    queryFn: async () => {
      const response = await fetch(
        `/api/activities?limit=20&targetId=${encodeURIComponent(profileId!)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json() as Promise<Activity[]>;
    },
    enabled: !!profileId,
  });
}
