export interface BugMessage {
  id: string;
  bug_report_id: string;
  sender_id: string;
  receiver_id: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
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
