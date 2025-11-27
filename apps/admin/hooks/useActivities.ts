import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: string;
  type: string;
  user_id: string;
  target_id: string | null;
  title: string;
  description: string;
  created_at: string;
  metadata: Record<string, any> | null;
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
