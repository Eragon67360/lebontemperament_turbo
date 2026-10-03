// app/dashboard/bug-reports/page.tsx
"use client";

import { BugReportDetailsDialog } from "@/components/BugReportDetailsDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBugReports,
  useMarkBugReportsAsRead,
  useUpdateBugReportStatus,
} from "@/hooks/useBugReports";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useEffect } from "react";

const getStatusConfig = (status: string) => {
  const config = {
    pending: {
      label: "En attente",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: AlertCircle,
    },
    in_progress: {
      label: "En cours",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    },
    resolved: {
      label: "Résolu",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
    },
  };
  return config[status as keyof typeof config] || config.pending;
};

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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({
        id,
        status: status as "pending" | "in_progress" | "resolved",
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <PageShell
      theme="admin"
      className="py-4 sm:py-6"
      title="Rapports de bugs"
      description="Gérez les rapports de bugs et demandes de fonctionnalités soumis par l'équipe."
    >
      <DataState
        isLoading={isPending}
        isError={isError}
        isEmpty={reports.length === 0}
        onRetry={() => refetch()}
        errorDescription="Impossible de charger les rapports de bugs. Vérifiez votre connexion, puis réessayez."
        skeleton={
          <CardGridSkeleton cards={6} label="Chargement des rapports…" />
        }
        empty={
          <EmptyState
            icon={AlertCircle}
            title="Aucun rapport de bug"
            description="Les rapports de bugs et demandes de fonctionnalités apparaîtront ici."
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const statusConfig = getStatusConfig(report.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={report.id}>
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold text-gray-900">
                      {report.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`flex shrink-0 items-center gap-1 whitespace-nowrap ${statusConfig.className}`}
                    >
                      <StatusIcon className="h-3 w-3" aria-hidden />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <p className="text-xs break-words text-gray-500">
                      Rapporté par{" "}
                      <span className="font-medium text-gray-700">
                        {report.profiles?.display_name ||
                          report.profiles?.email}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(report.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Description Preview */}
                  <p className="line-clamp-3 text-sm break-words text-gray-600">
                    {report.description}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
                    <Select
                      value={report.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(report.id, value)
                      }
                    >
                      <SelectTrigger
                        className="h-11 w-full text-sm sm:w-[150px]"
                        aria-label={`Statut du rapport « ${report.title} »`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                      </SelectContent>
                    </Select>
                    <BugReportDetailsDialog report={report} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DataState>
    </PageShell>
  );
}
