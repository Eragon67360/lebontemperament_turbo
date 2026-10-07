"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MyBugReport } from "@/hooks/useMyBugReports";
import { cn } from "@/lib/utils";
import {
  bugReportStatusLabel,
  bugReportStatusTone,
  messageCountLabel,
} from "@/utils/bug-reports/status";

/**
 * One conversation of the Messages dialog's list: the signalement's title
 * and status, the last message, the day and the counts. The selected one
 * is `aria-current` with the soft teal background.
 */
export function ConversationRow({
  report,
  selected,
  onSelect,
}: {
  report: Pick<
    MyBugReport,
    | "id"
    | "title"
    | "status"
    | "created_at"
    | "last_message"
    | "message_count"
    | "unread_count"
  >;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full min-w-0 flex-col gap-1.5 rounded-md border p-3 text-left transition-colors motion-reduce:transition-none",
        selected
          ? "border-primary-soft-border bg-primary-soft"
          : "hover:bg-card border-transparent",
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="text-detail text-foreground min-w-0 flex-1 truncate font-medium">
          {report.title}
        </span>
        <StatusBadge
          tone={bugReportStatusTone(report.status)}
          className="shrink-0"
        >
          {bugReportStatusLabel(report.status)}
        </StatusBadge>
      </span>
      {report.last_message ? (
        <span className="text-note text-muted-foreground truncate">
          {report.last_message.message}
        </span>
      ) : (
        <span className="text-note text-muted-foreground italic">
          Aucun message
        </span>
      )}
      <span className="text-note text-muted-foreground flex min-w-0 items-center justify-between gap-2">
        <span className="shrink-0">
          {new Date(report.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {report.message_count > 0 && (
            <span className="whitespace-nowrap">
              {messageCountLabel(report.message_count)}
            </span>
          )}
          {report.unread_count > 0 && (
            <Badge>
              {report.unread_count}
              <span className="sr-only">
                {report.unread_count === 1 ? " non lu" : " non lus"}
              </span>
            </Badge>
          )}
        </span>
      </span>
    </button>
  );
}

/** One message of the conversation: mine on the right in teal, theirs on the left. */
export function MessageBubble({
  message,
  isMine,
}: {
  message: {
    message: string;
    created_at: string;
    sender: { display_name: string | null; email: string };
  };
  isMine: boolean;
}) {
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-2 shadow-sm sm:max-w-[70%]",
          isMine
            ? "bg-primary-strong text-primary-foreground rounded-br-sm"
            : "border-border bg-card text-foreground rounded-bl-sm border",
        )}
      >
        {!isMine && (
          <p className="text-note text-muted-foreground mb-1 font-medium">
            {message.sender.display_name || message.sender.email}
          </p>
        )}
        <p className="text-detail break-words whitespace-pre-wrap">
          {message.message}
        </p>
        <p
          className={cn(
            "text-note mt-1",
            isMine ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {new Date(message.created_at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
