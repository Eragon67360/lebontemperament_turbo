import type { Tables } from "@repo/domain/database.types";

export type Notification = Tables<"notifications"> & {
  // TODO: phantom field — the table has bug_report_id, not reference_id, so this is
  // always undefined and the bug-report link never renders (pre-existing). Fix
  // NotificationsPopover to use bug_report_id, then remove this.
  reference_id?: string;
};
