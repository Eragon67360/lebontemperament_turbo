"use client";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BugReport } from "@/types/bug-reports";
import {
  BUG_REPORT_STATUSES,
  bugReportStatusLabel,
  bugReportStatusTone,
  formatReportDate,
  personName,
  reportOrigin,
  type BugReportStatus,
} from "@/utils/bug-reports/status";
import type { ReactNode } from "react";

/**
 * One signalement of « Signalements »: title, status, who and when, the
 * start of the description, then the status select and the details button
 * (`details`, the dialog's trigger, passed in so the row stays query-free).
 */
export function BugReportRow({
  report,
  onStatusChange,
  details,
}: {
  report: Pick<
    BugReport,
    | "id"
    | "title"
    | "description"
    | "status"
    | "created_at"
    | "profiles"
    | "source"
    | "screenshot_paths"
  >;
  onStatusChange: (status: BugReportStatus) => void;
  details?: ReactNode;
}) {
  const origin = reportOrigin(report);
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-body min-w-0 font-semibold break-words">
            {report.title}
          </h3>
          <StatusBadge tone={bugReportStatusTone(report.status)}>
            {bugReportStatusLabel(report.status)}
          </StatusBadge>
        </div>
        <p className="text-note text-muted-foreground break-words">
          Signalé par{" "}
          <span className="text-foreground font-medium">
            {personName(report.profiles)}
          </span>{" "}
          · {formatReportDate(report.created_at)}
          {origin && <> · {origin}</>}
        </p>
      </div>

      {report.description && (
        <p className="text-detail text-muted-foreground line-clamp-3 break-words whitespace-pre-line">
          {report.description}
        </p>
      )}

      <div className="border-border flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
        <Select
          value={report.status}
          onValueChange={(value) => onStatusChange(value as BugReportStatus)}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label={`Statut du signalement « ${report.title} »`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUG_REPORT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {bugReportStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {details}
      </div>
    </Card>
  );
}
