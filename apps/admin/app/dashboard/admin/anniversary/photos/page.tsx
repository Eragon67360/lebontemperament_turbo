"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PhotoDialog } from "@/components/anniversary/PhotoDialog";
import { PhotoItem } from "@/components/anniversary/PhotoItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePhoto, usePhotos } from "@/hooks/useAnniversaryPhotos";
import { AnniversaryPhoto } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PhotosPage() {
  const { data: photos, isLoading } = usePhotos();
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

  if (isLoading) {
    return (
      <PageShell
        title="Collection Photos"
        description="Gérer la galerie de photos des 40 ans"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  const maxOrder =
    photos?.reduce((max, photo) => Math.max(max, photo.display_order), 0) || 0;

  return (
    <PageShell
      title="Collection Photos"
      description="Gérer la galerie de photos des 40 ans"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {photos?.length || 0} photo(s)
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une photo
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {photos && photos.length > 0 ? (
          <div className="space-y-4 pb-4">
            {photos.map((photo) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucune photo. Cliquez sur "Ajouter une photo" pour commencer.
            </p>
          </div>
        )}
      </div>

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
