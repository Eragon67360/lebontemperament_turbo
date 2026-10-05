"use client";

import { useGridReorder } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
import { PhotoDialog } from "@/components/anniversary/PhotoDialog";
import { PhotoItem } from "@/components/anniversary/PhotoItem";
import {
  countLine,
  useListActions,
} from "@/components/anniversary/useListActions";
import { PageShell } from "@/components/layouts/PageShell";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  useDeletePhoto,
  usePhotos,
  useUpdatePhoto,
} from "@/hooks/useAnniversaryPhotos";
import type { AnniversaryPhoto } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { Images } from "lucide-react";

const nameOf = (photo: AnniversaryPhoto) => photo.title;

export default function PhotosPage() {
  const { data: photos = [], isLoading, isError, refetch } = usePhotos();
  const update = useUpdatePhoto();
  const remove = useDeletePhoto();
  const list = useListActions<AnniversaryPhoto>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
    feminine: true,
  });
  const grid = useGridReorder({
    items: photos,
    endpoint: "/api/anniversary/photos",
    queryKey: ["anniversary", "photos"],
    nameOf,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Photos"
      description="La collection de photos des 40 ans, dans l'ordre où la page les montre."
      headerAction={
        <AddButton label="Ajouter une photo" onClick={list.openCreate} />
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={photos.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les photos n'ont pas pu être chargées."
        skeleton={<CardGridSkeleton cards={6} label="Chargement des photos…" />}
        empty={
          <EmptyState
            icon={Images}
            title="Aucune photo"
            description="Concerts, répétitions, tournées : chaque photo a un titre et, si vous la connaissez, son année."
            action={
              <AddButton label="Ajouter une photo" onClick={list.openCreate} />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(photos, "photo", "photos")}
        </p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grid.ordered.map((photo, index) => (
            <li key={photo.id} className="list-none">
              <PhotoItem
                photo={photo}
                reorder={grid.controlsFor(photo, index)}
                busy={list.busyId === photo.id}
                onEdit={() => list.openEdit(photo)}
                onToggleVisibility={() => list.toggleVisibility(photo)}
                onDelete={() => list.askDelete(photo)}
              />
            </li>
          ))}
        </ul>
      </DataState>

      <PhotoDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        photo={list.editing}
        nextOrder={nextOrder(photos)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » ?`}
        description="La photo disparaît de la collection et son fichier est effacé. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
