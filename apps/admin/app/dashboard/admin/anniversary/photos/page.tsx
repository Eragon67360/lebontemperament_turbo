"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PhotoDialog } from "@/components/anniversary/PhotoDialog";
import { PhotoItem } from "@/components/anniversary/PhotoItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import { useDeletePhoto, usePhotos } from "@/hooks/useAnniversaryPhotos";
import { AnniversaryPhoto } from "@/types/anniversary";
import { Images, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PhotosPage() {
  const { data: photos = [], isLoading, isError, refetch } = usePhotos();
  const deletePhoto = useDeletePhoto();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<AnniversaryPhoto | null>(
    null,
  );

  const handleEdit = (photo: AnniversaryPhoto) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const handleDelete = (photo: AnniversaryPhoto) => {
    setSelectedPhoto(photo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPhoto) return;

    try {
      await deletePhoto.mutateAsync(selectedPhoto.id);
      toast.success("Photo supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedPhoto(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedPhoto(null);
    }
  };

  const maxOrder = photos.reduce(
    (max, photo) => Math.max(max, photo.display_order),
    0,
  );

  return (
    <PageShell
      title="Collection photos"
      description="Gérer la galerie de photos des 40 ans"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une photo
        </Button>
      }
    >
      {photos.length > 0 && (
        <p className="text-muted-foreground mb-4 text-sm">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </p>
      )}

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
            description="Ajoutez les photos de concerts, de répétitions et de tournées à afficher dans la galerie des 40 ans."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une photo
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Create/Edit Dialog */}
      <PhotoDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        photo={selectedPhoto || undefined}
        maxOrder={maxOrder}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette photo ?"
        description={`Êtes-vous sûr de vouloir supprimer la photo "${selectedPhoto?.title}" ? Cette action est irréversible.`}
        isLoading={deletePhoto.isPending}
      />
    </PageShell>
  );
}
