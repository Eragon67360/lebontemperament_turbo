"use client";

import { ArchiveDialog } from "@/components/anniversary/ArchiveDialog";
import { ArchiveItem } from "@/components/anniversary/ArchiveItem";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
import {
  countLine,
  useListActions,
} from "@/components/anniversary/useListActions";
import { PageShell } from "@/components/layouts/PageShell";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useArchives,
  useDeleteArchive,
  useUpdateArchive,
} from "@/hooks/useAnniversaryArchives";
import type { AnniversaryArchive } from "@/types/anniversary";
import { FileText } from "lucide-react";

const nameOf = (archive: AnniversaryArchive) => archive.title;

export default function ArchivesPage() {
  const { data: archives = [], isLoading, isError, refetch } = useArchives();
  const update = useUpdateArchive();
  const remove = useDeleteArchive();
  const list = useListActions<AnniversaryArchive>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
    feminine: true,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Archives"
      description="Les documents à consulter sur la page des 40 ans, classés de l'année la plus récente à la plus ancienne."
      headerAction={
        <AddButton label="Ajouter une archive" onClick={list.openCreate} />
      }
    >
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
            description="Comptes rendus d'assemblée générale, gazettes, programmes : un PDF ou un document Word par archive."
            action={
              <AddButton
                label="Ajouter une archive"
                onClick={list.openCreate}
              />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(archives, "archive", "archives")}
        </p>
        <ul className="space-y-3">
          {archives.map((archive) => (
            <li key={archive.id} className="list-none">
              <ArchiveItem
                archive={archive}
                busy={list.busyId === archive.id}
                onEdit={() => list.openEdit(archive)}
                onToggleVisibility={() => list.toggleVisibility(archive)}
                onDelete={() => list.askDelete(archive)}
              />
            </li>
          ))}
        </ul>
      </DataState>

      <ArchiveDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        archive={list.editing}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » ?`}
        description="L'archive disparaît de la page et son document est effacé. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
