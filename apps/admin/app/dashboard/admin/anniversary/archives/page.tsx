"use client";

import { ArchiveDialog } from "@/components/anniversary/ArchiveDialog";
import { ArchiveItem } from "@/components/anniversary/ArchiveItem";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchives, useDeleteArchive } from "@/hooks/useAnniversaryArchives";
import { AnniversaryArchive } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ArchivesPage() {
  const { data: archives, isLoading } = useArchives();
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

  if (isLoading) {
    return (
      <PageShell
        title="Archives Publiques"
        description="Gérer les documents d'archives (rapports AG, rapports annuels, etc.)"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Archives Publiques"
      description="Gérer les documents d'archives (rapports AG, rapports annuels, gazettes, programmes, etc.)"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {archives?.length || 0} archive(s)
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une archive
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {archives && archives.length > 0 ? (
          <div className="space-y-4 pb-4">
            {archives.map((archive) => (
              <ArchiveItem
                key={archive.id}
                archive={archive}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucune archive. Cliquez sur "Ajouter une archive" pour commencer.
            </p>
          </div>
        )}
      </div>

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
