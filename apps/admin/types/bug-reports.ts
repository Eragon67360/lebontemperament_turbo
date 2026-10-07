export interface BugReport {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  reported_by: string;
  created_at: string;
  is_read: boolean;
  /** Up to 3 object names in the private bucket `bug-screenshots`. */
  screenshot_paths?: string[];
  /** Where it was written: the admin or the mobile app. */
  source?: "admin" | "app";
  /** App version and system, for reports sent from the app. */
  app_info?: string | null;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

export interface UpdateBugReportStatusDTO {
  id: string;
  status: "pending" | "in_progress" | "resolved";
}
