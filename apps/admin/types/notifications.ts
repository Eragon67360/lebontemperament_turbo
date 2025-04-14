// types/notifications.ts
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: "bug_status" | "bug_message" | "system";
  reference_id?: string; // For linking to specific bug reports
};
