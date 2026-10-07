import type { StatusTone } from "@/components/ui/status-badge";

/**
 * Words and tones of a signalement's status, shared by « Signalements »,
 * the report's details dialog and the account menu's Messages dialog, so
 * the three say the same thing in the same colour.
 */
export type BugReportStatus = "pending" | "in_progress" | "resolved";

export const BUG_REPORT_STATUSES: readonly BugReportStatus[] = [
  "pending",
  "in_progress",
  "resolved",
];

const STATUS: Record<BugReportStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "En attente", tone: "warning" },
  in_progress: { label: "En cours", tone: "info" },
  resolved: { label: "Résolu", tone: "success" },
};

/** An unknown value reads as « En attente », like the old page did. */
function statusOf(status: string) {
  return STATUS[status as BugReportStatus] ?? STATUS.pending;
}

export function bugReportStatusLabel(status: string): string {
  return statusOf(status).label;
}

export function bugReportStatusTone(status: string): StatusTone {
  return statusOf(status).tone;
}

/** « 7 octobre 2026 à 14:05 », in the admin's time zone. */
export function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** « 1 message », « 3 messages ». */
export function messageCountLabel(count: number): string {
  return `${count} ${count === 1 ? "message" : "messages"}`;
}

/** Who sent a report or a message: the display name, else the e-mail. */
export function personName(
  person: { display_name: string | null; email: string } | null | undefined,
): string {
  return person?.display_name || person?.email || "Quelqu'un";
}
