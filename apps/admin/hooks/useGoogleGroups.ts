// hooks/useGoogleGroups.ts
import { useQuery } from "@tanstack/react-query";

export interface GoogleGroupMember {
  email: string;
}

export interface GoogleGroupStats {
  total: number;
  groupEmail: string;
  groupName: string;
  description: string | null;
  retrievedAt: string;
}

export interface GoogleGroupResponse {
  success: boolean;
  message: string;
  data: GoogleGroupMember[] | string[];
  stats?: GoogleGroupStats;
}

export interface GoogleGroup {
  email: string;
  name: string;
  description: string | null;
}

export interface GoogleGroupsListResponse {
  success: boolean;
  message: string;
  data: GoogleGroup[];
  stats?: {
    total: number;
    retrievedAt: string;
  };
}

export function useGoogleGroupMembers(groupEmail?: string) {
  return useQuery<GoogleGroupResponse>({
    queryKey: ["google-groups", "members", groupEmail],
    queryFn: async () => {
      const url = new URL("/api/google-groups", window.location.origin);
      if (groupEmail) {
        url.searchParams.append("groupEmail", groupEmail);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch group members");
      }
      return response.json();
    },
    enabled: !!groupEmail,
    refetchOnWindowFocus: false,
  });
}

export function useGoogleGroupsList() {
  return useQuery<GoogleGroupsListResponse>({
    queryKey: ["google-groups", "list"],
    queryFn: async () => {
      const url = new URL("/api/google-groups", window.location.origin);
      url.searchParams.append("action", "list-groups");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch groups list");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
}
