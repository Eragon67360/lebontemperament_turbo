import type { Tables } from "@repo/domain/database.types";

/** A message of a report's thread (public.bug_messages) with its sender. */
export interface BugMessage extends Tables<"bug_messages"> {
  sender: {
    email: string;
    display_name: string | null;
  };
}

/** What POST /api/bug-messages accepts; the route sets the sender and receiver. */
export interface CreateBugMessageDTO {
  bug_report_id: string;
  message: string;
}

export interface UpdateBugMessageDTO {
  id: string;
  message: string;
}

export interface GetBugMessagesParams {
  bug_report_id: string;
}
