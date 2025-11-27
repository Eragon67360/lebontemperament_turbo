export interface BugReport {
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
}

export interface UpdateBugReportStatusDTO {
  id: string;
  status: "pending" | "in_progress" | "resolved";
}
