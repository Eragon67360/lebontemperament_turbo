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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoForm } from "@/components/VideoForm";
import { YoutubeIframe } from "@/components/YoutubeIframe";
import { extractYouTubeId } from "@/utils/youtube";
import { Video, VideoFormData } from "@repo/domain/types/videos";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Film, MapPin, Mic2, Pencil, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- Utility Components ---

const LoadingSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[320px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-primary/5 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <Film className="text-primary/40 h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">Vidéothèque vide</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Aucune vidéo n'est disponible pour le moment. Ajoutez des liens YouTube
        pour enrichir votre galerie.
      </p>
    </div>
    <Button onClick={onAdd} className="px-8">
      <Plus className="mr-2 h-4 w-4" />
      Ajouter une vidéo
    </Button>
  </div>
);

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
    <Card className="group bg-card hover:border-primary/50 flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
      {/* Video Area */}
      <div className="relative aspect-video w-full bg-black">
        {videoId ? (
          <YoutubeIframe videoId={videoId} title={video.title} />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 opacity-20" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex gap-4">
          {/* Date Tile */}
          <div className="bg-muted/30 hidden flex-col items-center justify-center rounded-xl px-3 py-2 text-center shadow-sm sm:flex">
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

          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-lg leading-tight font-bold tracking-tight">
                {video.title}
              </h3>
            </div>
            {video.composer && (
              <Badge variant="secondary" className="font-normal">
                <User className="mr-1 h-3 w-3 opacity-50" />
                {video.composer}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-muted-foreground mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary/60 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{video.venue}</span>
          </div>
          {video.soloists && video.soloists.length > 0 && (
            <div className="flex items-start gap-2">
              <Mic2 className="text-primary/60 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1 italic">
                {video.soloists.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-1 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 w-8"
            onClick={() => onEdit(video)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
            onClick={() => onDelete(video.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// --- Main Page Component ---

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les vidéos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleCreate = async (formData: VideoFormData) => {
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error adding video");

      toast.success("Vidéo ajoutée avec succès");
      setOpen(false);
      fetchVideos();
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la vidéo");
      console.error(error);
    }
  };

  const handleEdit = async (formData: VideoFormData) => {
    if (!editingVideo) return;

    try {
      const response = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVideo.id,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Error updating video");

      toast.success("Vidéo modifiée avec succès");
      setEditDialogOpen(false);
      setEditingVideo(null);
      fetchVideos();
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
      const response = await fetch("/api/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoToDelete }),
      });

      if (!response.ok) throw new Error("Error deleting video");

      toast.success("Vidéo supprimée");
      fetchVideos();
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
      fullHeight
      theme="public"
      title="Vidéos"
      description="Gérez votre vidéothèque YouTube et les performances passées."
      className="px-4 py-8 sm:px-6 lg:px-8"
      headerAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md transition-all hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
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
      <ScrollArea className="h-full w-full pr-4">
        {loading ? (
          <LoadingSkeleton />
        ) : videos.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <div className="grid gap-6 pb-12 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
        )}
      </ScrollArea>

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
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
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
