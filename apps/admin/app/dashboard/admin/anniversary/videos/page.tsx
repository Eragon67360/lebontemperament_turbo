"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { VideoDialog } from "@/components/anniversary/VideoDialog";
import { VideoItem } from "@/components/anniversary/VideoItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { useDeleteVideo, useVideos } from "@/hooks/useAnniversaryVideos";
import { AnniversaryVideo } from "@/types/anniversary";
import { Plus, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VideosPage() {
  const { data: videos = [], isLoading, isError, refetch } = useVideos();
  const deleteVideo = useDeleteVideo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<AnniversaryVideo | null>(
    null,
  );

  const handleEdit = (video: AnniversaryVideo) => {
    setSelectedVideo(video);
    setDialogOpen(true);
  };

  const handleDelete = (video: AnniversaryVideo) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedVideo) return;

    try {
      await deleteVideo.mutateAsync(selectedVideo.id);
      toast.success("Vidéo supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedVideo(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedVideo(null);
    }
  };

  const maxOrder = videos.reduce(
    (max, video) => Math.max(max, video.display_order),
    0,
  );

  return (
    <PageShell
      title="Galerie vidéo"
      description="Gérer les vidéos de concerts, témoignages et documentaires"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une vidéo
        </Button>
      }
    >
      {videos.length > 0 && (
        <p className="text-muted-foreground mb-4 text-sm">
          {videos.length} vidéo{videos.length > 1 ? "s" : ""}
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={videos.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les vidéos n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={4} label="Chargement des vidéos…" />}
        empty={
          <EmptyState
            icon={Video}
            title="Aucune vidéo"
            description="Ajoutez les vidéos de concerts, témoignages et documentaires à afficher dans la galerie des 40 ans."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une vidéo
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoItem
              key={video.id}
              video={video}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Create/Edit Dialog */}
      <VideoDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        video={selectedVideo || undefined}
        maxOrder={maxOrder}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette vidéo ?"
        description={`Êtes-vous sûr de vouloir supprimer la vidéo "${selectedVideo?.title}" ? Cette action est irréversible.`}
        isLoading={deleteVideo.isPending}
      />
    </PageShell>
  );
}
