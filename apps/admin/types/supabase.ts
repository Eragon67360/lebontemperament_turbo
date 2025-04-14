// types/supabase.ts
export type Profile = {
  id: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  created_at: string;
};
