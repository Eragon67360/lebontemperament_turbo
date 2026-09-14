"use client";

import { ArchiveDialog } from "@/components/anniversary/ArchiveDialog";
import { ArchiveItem } from "@/components/anniversary/ArchiveItem";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { useArchives, useDeleteArchive } from "@/hooks/useAnniversaryArchives";
import { AnniversaryArchive } from "@/types/anniversary";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ArchivesPage() {
  const { data: archives = [], isLoading, isError, refetch } = useArchives();
  const deleteArchive = useDeleteArchive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] =
    useState<AnniversaryArchive | null>(null);

  const handleEdit = (archive: AnniversaryArchive) => {
    setSelectedArchive(archive);
    setDialogOpen(true);
  };

  const handleDelete = (archive: AnniversaryArchive) => {
    setSelectedArchive(archive);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedArchive) return;

    try {
      await deleteArchive.mutateAsync(selectedArchive.id);
      toast.success("Archive supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedArchive(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedArchive(null);
    }
  };

  return (
    <PageShell
      title="Archives publiques"
      description="Gérer les documents d'archives (rapports AG, rapports annuels, gazettes, programmes, etc.)"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une archive
        </Button>
      }
    >
      {archives.length > 0 && (
        <p className="text-muted-foreground mb-4 text-sm">
          {archives.length} archive{archives.length > 1 ? "s" : ""}
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={archives.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les archives n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={4} label="Chargement des archives…" />}
        empty={
          <EmptyState
            icon={FileText}
            title="Aucune archive"
            description="Ajoutez les rapports d'assemblée générale, gazettes et programmes à rendre publics."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une archive
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {archives.map((archive) => (
            <ArchiveItem
              key={archive.id}
              archive={archive}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Create/Edit Dialog */}
      <ArchiveDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        archive={selectedArchive || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette archive ?"
        description={`Êtes-vous sûr de vouloir supprimer l'archive "${selectedArchive?.title}" ? Cette action est irréversible.`}
        isLoading={deleteArchive.isPending}
      />
    </PageShell>
  );
}
