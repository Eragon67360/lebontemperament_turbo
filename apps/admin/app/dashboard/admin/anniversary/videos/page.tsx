"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
import {
  countLine,
  useListActions,
} from "@/components/anniversary/useListActions";
import { VideoDialog } from "@/components/anniversary/VideoDialog";
import { VideoItem } from "@/components/anniversary/VideoItem";
import { PageShell } from "@/components/layouts/PageShell";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useDeleteVideo,
  useUpdateVideo,
  useVideos,
} from "@/hooks/useAnniversaryVideos";
import type { AnniversaryVideo } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { Video } from "lucide-react";

const nameOf = (video: AnniversaryVideo) => video.title;

export default function VideosPage() {
  const { data: videos = [], isLoading, isError, refetch } = useVideos();
  const update = useUpdateVideo();
  const remove = useDeleteVideo();
  const list = useListActions<AnniversaryVideo>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
    feminine: true,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Vidéos"
      description="Les vidéos de concerts, témoignages et documentaires de la galerie des 40 ans."
      headerAction={
        <AddButton label="Ajouter une vidéo" onClick={list.openCreate} />
      }
    >
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
            description="Une vidéo, c'est une vignette et un lien YouTube. Les visiteurs la regardent sans quitter la page."
            action={
              <AddButton label="Ajouter une vidéo" onClick={list.openCreate} />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(videos, "vidéo", "vidéos")}
        </p>
        <CampaignList
          items={videos}
          endpoint="/api/anniversary/videos"
          queryKey={["anniversary", "videos"]}
          nameOf={nameOf}
          renderItem={(video, reorder) => (
            <VideoItem
              video={video}
              reorder={reorder}
              busy={list.busyId === video.id}
              onEdit={() => list.openEdit(video)}
              onToggleVisibility={() => list.toggleVisibility(video)}
              onDelete={() => list.askDelete(video)}
            />
          )}
        />
      </DataState>

      <VideoDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        video={list.editing}
        nextOrder={nextOrder(videos)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » ?`}
        description="La vidéo disparaît de la galerie et sa miniature est effacée. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
