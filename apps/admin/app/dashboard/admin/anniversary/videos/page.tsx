"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { VideoDialog } from "@/components/anniversary/VideoDialog";
import { VideoItem } from "@/components/anniversary/VideoItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteVideo, useVideos } from "@/hooks/useAnniversaryVideos";
import { AnniversaryVideo } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VideosPage() {
  const { data: videos, isLoading } = useVideos();
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

  if (isLoading) {
    return (
      <PageShell
        title="Galerie Vidéo"
        description="Gérer les vidéos de concerts, témoignages et documentaires"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageShell>
    );
  }

  const maxOrder =
    videos?.reduce((max, video) => Math.max(max, video.display_order), 0) || 0;

  return (
    <PageShell
      title="Galerie Vidéo"
      description="Gérer les vidéos de concerts, témoignages et documentaires"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {videos?.length || 0} vidéo(s)
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une vidéo
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {videos && videos.length > 0 ? (
          <div className="space-y-4 pb-4">
            {videos.map((video) => (
              <VideoItem
                key={video.id}
                video={video}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucune vidéo. Cliquez sur "Ajouter une vidéo" pour commencer.
            </p>
          </div>
        )}
      </div>

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
