// app/dashboard/public/videos/page.tsx
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { VideoForm } from '@/components/VideoForm'
import { YoutubeIframe } from "@/components/YoutubeIframe"
import { Video, VideoFormData } from '@/types/video'
import { extractYouTubeId } from "@/utils/youtube"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Music2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const loadingMessages = [
  "Chargement des vidéos... 🎥",
  "Préparation de la playlist... 🎵",
  "Les musiciens s'accordent... 🎻",
  "La scène se prépare... 🎭",
]

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      const data = await response.json()
      setVideos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleCreate = async (formData: VideoFormData) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error adding video');

      toast.success('Vidéo ajoutée avec succès');
      setOpen(false);
      fetchVideos();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la vidéo');
      console.error(error);
    }
  };


  const handleEdit = async (formData: VideoFormData) => {
    if (!editingVideo) return;

    try {
      const response = await fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVideo.id,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Error updating video');

      toast.success('Vidéo modifiée avec succès');
      setEditDialogOpen(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      toast.error('Erreur lors de la modification');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return

    try {
      const response = await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: videoToDelete }),
      })

      if (!response.ok) throw new Error('Error deleting video')

      toast.success('Vidéo supprimée avec succès')
      fetchVideos()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    } finally {
      setDeleteDialogOpen(false)
      setVideoToDelete(null)
    }
  }

  const LoadingState = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
      }, 2000);
      return () => clearInterval(intervalId);
    }, []);

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <Music2 className="h-12 w-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    );
  };
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-4">
        <Music2 className="h-16 w-16 text-primary/30 mx-auto" />
        <h2 className="text-xl font-medium">Aucune vidéo</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Commencez par ajouter votre première vidéo pour créer votre collection
        </p>
      </div>
      <AddVideoButton />
    </div>
  )
  const AddVideoButton = () => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full px-6">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une vidéo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle vidéo</DialogTitle>
          <DialogDescription>
            Entrez les informations pour cette vidéo
          </DialogDescription>
        </DialogHeader>
        <VideoForm onSubmit={handleCreate} />
      </DialogContent>
    </Dialog>
  )
  const VideoCard = ({ video }: { video: Video }) => {
    const videoId = extractYouTubeId(video.youtube_url)


    return (
      <div className="bg-white dark:bg-black rounded-2xl overflow-hidden shadow-sm border border-border/50">
        <div className="aspect-video">
          <YoutubeIframe key={videoId} videoId={videoId} />
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium leading-none">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.composer}</p>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{format(new Date(video.performance_date), 'dd MMMM yyyy', { locale: fr })}</p>
            <p>{video.venue}</p>
            {video.soloists?.length > 0 && (
              <p className="italic">{video.soloists.join(', ')}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setEditingVideo(video)
                setEditDialogOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-destructive"
              onClick={() => {
                setVideoToDelete(video.id)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingState />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">Vidéos</h1>
        <AddVideoButton />
      </header>

      {loading ? (
        <LoadingState />
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vidéo sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la vidéo</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la vidéo
            </DialogDescription>
          </DialogHeader>
          <VideoForm onSubmit={handleEdit} initialData={editingVideo} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
