import type {
  BugReportSource,
  BugReportStatus,
} from "@/utils/bug-reports/status";
import type { Tables } from "@repo/domain/database.types";

/**
 * A signalement as « Signalements » reads it (hooks/useBugReports.ts): the
 * row with the reporter's account. Every row carries a status and a read
 * flag, so the two nullable columns are read as filled, as before, and
 * `source` is one of the two values the table's CHECK allows.
 * `screenshot_paths` holds up to 3 object names of the private bucket
 * `bug-screenshots`; `app_info` is the app version and system of a mobile
 * report.
 */
export type BugReport = Omit<
  Tables<"bug_reports">,
  "status" | "is_read" | "source"
> & {
  status: BugReportStatus;
  is_read: boolean;
  source: BugReportSource;
  profiles: {
    email: string;
    display_name: string | null;
  };
};

export interface UpdateBugReportStatusDTO {
  id: string;
  status: BugReportStatus;
}
