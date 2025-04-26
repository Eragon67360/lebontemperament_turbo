// Define possible sort fields
export type SortBy = "email" | "display_name" | "created_at" | "invite_status";

// Define possible sort directions
export type SortOrder = "asc" | "desc";

// Define the structure of sort configuration
export interface SortConfig {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// Define the user structure
export type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin" | "superadmin";
  created_at: string;
  invite_status: "en attente" | "approuvé";
  avatar?: string;
};

export interface InvitationProgress {
  current: number;
  total: number;
  percentage: number;
}
