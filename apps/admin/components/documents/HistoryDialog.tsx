"use client";

import { Button } from "@/components/ui/button";
import { DataState, ListSkeleton } from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocumentRevisions, useRestoreRevision } from "@/hooks/useDocuments";
import { revisionSummary } from "@/utils/documents/history";
import type { SiteDocument } from "@repo/domain/types/documents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History } from "lucide-react";
import { toast } from "sonner";

/** « Historique »: the document's previous versions, each restorable. */
export function HistoryDialog({
  document,
  open,
  onOpenChange,
}: {
  document: SiteDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useDocumentRevisions(open ? (document?.id ?? null) : null);
  const restore = useRestoreRevision();

  const handleRestore = async (revisionId: number) => {
    if (!document) return;
    try {
      await restore.mutateAsync({ id: document.id, revisionId });
      toast.success("Version restaurée");
      onOpenChange(false);
    } catch (error) {
      toast.error("La version n'a pas pu être restaurée", {
        description:
          error instanceof Error ? error.message : "Réessayez dans un instant.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historique de « {document?.title} »</DialogTitle>
          <DialogDescription>
            Chaque modification garde la version d&apos;avant. Restaurer une
            version remet son titre, sa date, sa visibilité et son fichier.
          </DialogDescription>
        </DialogHeader>
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={data.length === 0}
          onRetry={() => refetch()}
          errorDescription="L'historique n'a pas pu être chargé."
          skeleton={
            <ListSkeleton rows={3} label="Chargement de l'historique…" />
          }
          empty={
            <p className="text-note text-muted-foreground flex items-center gap-2 py-4">
              <History className="size-4" aria-hidden />
              Aucune modification pour l&apos;instant.
            </p>
          }
        >
          <ol className="max-h-[50vh] space-y-2 overflow-y-auto">
            {data.map((revision) => (
              <li
                key={revision.id}
                className="border-border flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-note text-muted-foreground">
                    Avant le{" "}
                    {format(
                      new Date(revision.changed_at),
                      "d MMMM yyyy 'à' HH:mm",
                      {
                        locale: fr,
                      },
                    )}
                  </p>
                  <p className="text-detail break-words">
                    {revisionSummary(revision.old_row)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={restore.isPending}
                  onClick={() => handleRestore(revision.id)}
                >
                  Restaurer
                </Button>
              </li>
            ))}
          </ol>
        </DataState>
      </DialogContent>
    </Dialog>
  );
}
