export type ActivityType =
  | "user_created"
  | "user_role_changed"
  | "concert_created"
  | "concert_updated"
  | "concert_deleted"
  | "poster_updated"
  | "group_updated";

export type Activity = {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  profiles: {
    // Changed from user to profiles
    display_name: string | null;
    email: string;
  } | null;
};
