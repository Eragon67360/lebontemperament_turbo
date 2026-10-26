// The conversations behind « Mes signalements » (`app/api/my-bug-reports`):
// the messages of every report of the inbox in one query, summarized per
// report in memory, instead of two queries per report.
import type { createClient } from "@/utils/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** A message as the inbox shows a report's last one. */
export type InboxMessage = {
  id: string;
  created_at: string;
  message: string;
  sender_id: string;
  is_read: boolean;
};

/** What the inbox says of a report's conversation. */
export type MessageSummary = {
  last_message: InboxMessage | null;
  message_count: number;
  unread_count: number;
};

/** The summary of a report nobody has written under yet. */
export const NO_MESSAGES: MessageSummary = {
  last_message: null,
  message_count: 0,
  unread_count: 0,
};

export type MessageRow = InboxMessage & {
  bug_report_id: string;
  receiver_id: string | null;
};

/**
 * Per report, from its messages oldest first: how many, the last one, and
 * how many `userId` received and hasn't read. A report without a message is
 * absent from the map.
 */
export function summarizeMessages(
  rows: readonly MessageRow[],
  userId: string,
): Map<string, MessageSummary> {
  const byReport = new Map<string, MessageSummary>();
  for (const { bug_report_id, receiver_id, ...message } of rows) {
    const summary = byReport.get(bug_report_id) ?? {
      last_message: null,
      message_count: 0,
      unread_count: 0,
    };
    summary.last_message = message;
    summary.message_count += 1;
    if (receiver_id === userId && message.is_read === false) {
      summary.unread_count += 1;
    }
    byReport.set(bug_report_id, summary);
  }
  return byReport;
}

/**
 * The messages of the given reports, oldest first, in one query through the
 * caller's client (so their RLS applies), summarized with `summarizeMessages`.
 */
export async function loadMessageSummaries(
  supabase: Client,
  userId: string,
  bugReportIds: readonly string[],
): Promise<
  | { ok: true; summaries: Map<string, MessageSummary> }
  | { ok: false; error: { message: string } }
> {
  const { data, error } = await supabase
    .from("bug_messages")
    .select(
      "id, bug_report_id, created_at, message, sender_id, receiver_id, is_read",
    )
    .in("bug_report_id", bugReportIds)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error };
  return { ok: true, summaries: summarizeMessages(data, userId) };
}
