"use client";

import { PageShell } from "@/components/layouts/PageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VideoForm } from "@/components/VideoForm";
import { YoutubeIframe } from "@/components/YoutubeIframe";
import {
  useCreateVideo,
  useDeleteVideo,
  useUpdateVideo,
  useVideos,
} from "@/hooks/useVideos";
import { Video, VideoFormData } from "@repo/domain/types/videos";
import { extractYouTubeId } from "@repo/domain/utils/youtube";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Film, MapPin, Mic2, Pencil, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// --- Sub-Component: Video Card ---

const VideoCard = ({
  video,
  onEdit,
  onDelete,
}: {
  video: Video;
  onEdit: (v: Video) => void;
  onDelete: (id: string) => void;
}) => {
  const videoId = extractYouTubeId(video.youtube_url);
  const dateObj = new Date(video.performance_date);

  return (
    <Card className="bg-card hover:border-primary/50 flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
      {/* Video Area */}
      <div className="relative aspect-video w-full bg-black">
        {videoId ? (
          <YoutubeIframe videoId={videoId} title={video.title} />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 opacity-20" aria-hidden />
            <span className="sr-only">Lien YouTube invalide</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          {/* Date Tile */}
          <div className="bg-muted/30 hidden shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-center shadow-sm sm:flex">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              {format(dateObj, "MMM", { locale: fr })}
            </span>
            <span className="text-foreground text-2xl leading-none font-black">
              {format(dateObj, "dd")}
            </span>
            <span className="text-muted-foreground/80 text-[10px] font-medium">
              {format(dateObj, "yyyy")}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="line-clamp-2 text-base leading-tight font-bold tracking-tight sm:text-lg">
              {video.title}
            </h2>
            <p className="text-muted-foreground text-xs sm:hidden">
              {format(dateObj, "d MMMM yyyy", { locale: fr })}
            </p>
            {video.composer && (
              <Badge variant="secondary" className="max-w-full font-normal">
                <User
                  className="mr-1 h-3 w-3 shrink-0 opacity-50"
                  aria-hidden
                />
                <span className="truncate">{video.composer}</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="text-muted-foreground mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary/60 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{video.venue}</span>
          </div>
          {video.soloists && video.soloists.length > 0 && (
            <div className="flex items-start gap-2">
              <Mic2
                className="text-primary/60 mt-0.5 h-4 w-4 shrink-0"
                aria-hidden
              />
              <span className="line-clamp-1 min-w-0 italic">
                {video.soloists.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-1 border-t pt-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-primary/10 hover:text-primary size-11"
            onClick={() => onEdit(video)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="sr-only">Modifier « {video.title} »</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-11"
            onClick={() => onDelete(video.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Supprimer « {video.title} »</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

// --- Main Page Component ---

export default function VideosPage() {
  const { data: videos = [], isPending, isError, refetch } = useVideos();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();
  const [open, setOpen] = useState(false);

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleCreate = async (formData: VideoFormData) => {
    try {
      await createVideo.mutateAsync(formData);

      toast.success("Vidéo ajoutée avec succès");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la vidéo");
      console.error(error);
    }
  };

  const handleEdit = async (formData: VideoFormData) => {
    if (!editingVideo) return;

    try {
      await updateVideo.mutateAsync({ id: editingVideo.id, ...formData });

      toast.success("Vidéo modifiée avec succès");
      setEditDialogOpen(false);
      setEditingVideo(null);
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setVideoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideo.mutateAsync(videoToDelete);

      toast.success("Vidéo supprimée");
    } catch (error) {
      toast.error("Impossible de supprimer la vidéo");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  return (
    <PageShell
      theme="public"
      title="Vidéos"
      description="Gérez votre vidéothèque YouTube et les performances passées."
      className="py-4 sm:py-6"
      headerAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-11 w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter une vidéo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter une vidéo</DialogTitle>
              <DialogDescription>
                Copiez l'URL ou l'ID de la vidéo YouTube.
              </DialogDescription>
            </DialogHeader>
            <VideoForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      }
    >
      <DataState
        isLoading={isPending}
        isError={isError}
        isEmpty={videos.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les vidéos n'ont pas pu être chargées."
        skeleton={<CardGridSkeleton cards={6} label="Chargement des vidéos…" />}
        empty={
          <EmptyState
            icon={Film}
            title="Aucune vidéo"
            description="Votre vidéothèque est vide. Ajoutez des liens YouTube pour enrichir votre galerie."
            action={
              <Button
                onClick={() => setOpen(true)}
                className="min-h-11 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une vidéo
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onEdit={(v) => {
                setEditingVideo(v);
                setEditDialogOpen(true);
              }}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </DataState>

      {/* Delete Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vidéo sera retirée de votre
              galerie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 min-h-11 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la vidéo</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <VideoForm onSubmit={handleEdit} initialData={editingVideo} />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
