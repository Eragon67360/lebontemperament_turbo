import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin" | "superadmin";
  created_at: string;
  invite_status: "en attente" | "approuvé";
  avatar?: string;
};

interface UseUsersOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  search?: string;
}

export function useUsers(options?: UseUsersOptions) {
  const params = new URLSearchParams();
  if (options?.sortBy) params.append("sortBy", options.sortBy);
  if (options?.sortOrder) params.append("sortOrder", options.sortOrder);
  if (options?.search) params.append("search", options.search);

  const queryString = params.toString();

  return useQuery({
    queryKey: ["users", options],
    queryFn: async () => {
      const url = `/api/users${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data as User[];
    },
  });
}

// CREATE user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      role: "user" | "admin";
      display_name: string;
    }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all users queries to refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// DELETE user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// UPDATE user role mutation
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; role: "user" | "admin" }) => {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user role");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// UPDATE user display name mutation
export function useUpdateUserDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; display_name: string }) => {
      const response = await fetch("/api/users/display-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update display name");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Also invalidate current user in case they updated their own name
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
