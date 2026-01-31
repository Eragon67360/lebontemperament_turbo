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

export interface CreateBugMessageDTO {
  bug_report_id: string;
  message: string;
  receiver_id?: string; // Optional, will be auto-set by API if not provided
}

export interface UpdateBugMessageDTO {
  id: string;
  message: string;
}

export interface GetBugMessagesParams {
  bug_report_id: string;
}
