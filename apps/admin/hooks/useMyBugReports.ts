import { useQuery } from "@tanstack/react-query";

export interface MyBugReport {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  reported_by: string;
  created_at: string;
  is_read: boolean;
  profiles: {
    email: string;
    display_name: string | null;
  };
  last_message: {
    id: string;
    created_at: string;
    message: string;
    sender_id: string;
  } | null;
  message_count: number;
  unread_count: number;
}

export function useMyBugReports() {
  return useQuery({
    queryKey: ["my-bug-reports"],
    queryFn: async () => {
      const response = await fetch("/api/my-bug-reports");
      if (!response.ok) throw new Error("Failed to fetch bug reports");
      return response.json() as Promise<MyBugReport[]>;
    },
  });
}
