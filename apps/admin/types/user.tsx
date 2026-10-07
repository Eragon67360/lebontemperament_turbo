// Define the user structure
export type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin" | "superadmin";
  created_at: string;
  invite_status: "en attente" | "approuvé";
  avatar?: string;
  address?: string | null;
  home_phone?: string | null;
  mobile_phone?: string | null;
  /** Stored as « Soprane & Jeune » (the roster's separator). */
  voice?: string | null;
  /** Last sign-in to the site, the app or this admin; null if never. */
  last_sign_in_at?: string | null;
  /** When the last invitation e-mail went out, if any. */
  invited_at?: string | null;
  isMissingInExcel?: boolean; // Flag to indicate user is not in Excel
  isMissingInDatabase?: boolean; // Flag to indicate user is missing from database
};

export interface InvitationProgress {
  current: number;
  total: number;
  percentage: number;
}
