"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { VideoDialog } from "@/components/videos/VideoDialog";
import { VideoRow } from "@/components/videos/VideoRow";
import {
  useCreateVideo,
  useDeleteVideo,
  useUpdateVideo,
  useVideos,
  VIDEOS_QUERY_KEY,
} from "@/hooks/useVideos";
import { nextOrder } from "@/utils/anniversary/reorder";
import type { Video, VideoFormData } from "@repo/domain/types/videos";
import { Film, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const nameOf = (video: Video) => video.title;

/** The list with every order a number, as the reorder planner expects. */
function withOrder(videos: readonly Video[]) {
  return videos.map((video) => ({
    ...video,
    display_order: video.display_order ?? 0,
  }));
}

export default function GalleryVideosPage() {
  const { data: videos = [], isPending, isError, refetch } = useVideos();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const [dialog, setDialog] = useState<{ open: boolean; video?: Video }>({
    open: false,
  });
  const [deleting, setDeleting] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ordered = useMemo(() => withOrder(videos), [videos]);

  const save = async (data: VideoFormData) => {
    if (dialog.video) {
      await updateVideo.mutateAsync({ id: dialog.video.id, ...data });
      toast.success(`« ${data.title} » enregistrée`);
    } else {
      await createVideo.mutateAsync({
        ...data,
        display_order: nextOrder(ordered),
      });
      toast.success(`« ${data.title} » ajoutée à la galerie`);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteVideo.mutateAsync(deleting.id);
      toast.success(`« ${deleting.title} » supprimée`);
      setDeleting(null);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => setDialog({ open: true });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Vidéos"
      description="Les vidéos YouTube de la galerie du site public, dans l'ordre où elle les montre."
      headerAction={
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Ajouter une vidéo
        </Button>
      }
    >
      <DataState
        isLoading={isPending}
        isError={isError}
        isEmpty={videos.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les vidéos n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={4} label="Chargement des vidéos…" />}
        empty={
          <EmptyState
            icon={Film}
            title="Aucune vidéo"
            description="Une vidéo, c'est un lien YouTube, un titre, un compositeur et le concert d'où elle vient. Les visiteurs la regardent sur le site."
            action={
              <Button variant="outline" onClick={openCreate}>
                <Plus aria-hidden />
                Ajouter la première vidéo
              </Button>
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {videos.length} vidéo{videos.length > 1 ? "s" : ""}
        </p>
        <CampaignList
          items={ordered}
          endpoint="/api/videos"
          queryKey={VIDEOS_QUERY_KEY}
          nameOf={nameOf}
          renderItem={(video, reorder) => (
            <VideoRow
              video={video}
              reorder={reorder}
              busy={false}
              onEdit={() => setDialog({ open: true, video })}
              onDelete={() => setDeleting(video)}
            />
          )}
        />
      </DataState>

      <VideoDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        video={dialog.video}
        onSubmit={save}
        isPending={createVideo.isPending || updateVideo.isPending}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.title ?? ""} » ?`}
        description="La vidéo disparaît de la galerie du site public ; elle reste sur YouTube. Cette action ne peut pas être annulée."
        isLoading={isDeleting}
      />
    </PageShell>
  );
}
