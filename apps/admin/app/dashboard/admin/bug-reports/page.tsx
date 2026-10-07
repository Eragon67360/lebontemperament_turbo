// app/dashboard/admin/bug-reports/page.tsx
"use client";

import { BugReportDetailsDialog } from "@/components/BugReportDetailsDialog";
import { BugReportRow } from "@/components/bug-reports/BugReportRow";
import { PageShell } from "@/components/layouts/PageShell";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useBugReports,
  useMarkBugReportsAsRead,
  useUpdateBugReportStatus,
} from "@/hooks/useBugReports";
import type { BugReportStatus } from "@/utils/bug-reports/status";
import { MessageSquareWarning } from "lucide-react";
import { useEffect } from "react";

export default function BugReportsPage() {
  const { data: reports = [], isPending, isError, refetch } = useBugReports();
  const updateStatus = useUpdateBugReportStatus();
  const markAsRead = useMarkBugReportsAsRead();

  useEffect(() => {
    if (reports.length > 0) {
      const hasUnread = reports.some((r) => !r.is_read);
      if (hasUnread) {
        markAsRead.mutate();
      }
    }
  }, [reports, markAsRead]);

  const handleUpdateStatus = async (id: string, status: BugReportStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Signalements"
      description="Les problèmes et les idées envoyés depuis « Signaler un problème » : suivez leur statut et répondez à leur auteur."
    >
      <section aria-labelledby="reports-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="reports-heading" className="text-section">
            Tous les signalements
          </h2>
          {reports.length > 0 && (
            <p className="text-note text-muted-foreground">
              {reports.length}{" "}
              {reports.length === 1 ? "signalement" : "signalements"}
            </p>
          )}
        </div>
        <DataState
          isLoading={isPending}
          isError={isError}
          isEmpty={reports.length === 0}
          onRetry={() => refetch()}
          errorDescription="Les signalements n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
          skeleton={
            <ListSkeleton rows={4} label="Chargement des signalements…" />
          }
          empty={
            <EmptyState
              icon={MessageSquareWarning}
              title="Aucun signalement"
              description="Quand un membre de l'équipe signale un problème ou propose une idée depuis son menu, il apparaît ici."
              className="py-6"
            />
          }
        >
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="list-none">
                <BugReportRow
                  report={report}
                  onStatusChange={(status) =>
                    handleUpdateStatus(report.id, status)
                  }
                  details={<BugReportDetailsDialog report={report} />}
                />
              </li>
            ))}
          </ul>
        </DataState>
      </section>
    </PageShell>
  );
}
