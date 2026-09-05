"use client";

import { ImageUploader } from "@/components/anniversary/ImageUploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateVideo, useUpdateVideo } from "@/hooks/useAnniversaryVideos";
import { AnniversaryVideo, VIDEO_CATEGORIES } from "@/types/anniversary";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: AnniversaryVideo;
  maxOrder: number;
}

export function VideoDialog({
  open,
  onOpenChange,
  video,
  maxOrder,
}: VideoDialogProps) {
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    video_url: "",
    year: null as number | null,
    category: "Concert" as string,
    display_order: maxOrder + 1,
    is_visible: true,
  });

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        video_url: video.video_url || "",
        year: video.year,
        category: video.category,
        display_order: video.display_order,
        is_visible: video.is_visible ?? true,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        thumbnail_url: "",
        video_url: "",
        year: null,
        category: "Concert",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
  }, [video, maxOrder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.thumbnail_url) {
      toast.error("Veuillez uploader une miniature");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        video_url: formData.video_url || null,
      };

      if (video) {
        await updateVideo.mutateAsync({
          id: video.id,
          ...dataToSubmit,
        });
        toast.success("Vidéo mise à jour avec succès");
      } else {
        await createVideo.mutateAsync(dataToSubmit);
        toast.success("Vidéo ajoutée avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        video ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createVideo.isPending || updateVideo.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {video ? "Modifier la vidéo" : "Nouvelle vidéo"}
          </DialogTitle>
          <DialogDescription>
            {video
              ? "Modifiez les informations de la vidéo"
              : "Ajoutez une nouvelle vidéo à la galerie"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thumbnail Upload */}
          <ImageUploader
            value={formData.thumbnail_url}
            onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
            onRemove={() => setFormData({ ...formData, thumbnail_url: "" })}
            label="Miniature de la vidéo"
            folder="Site/anniversary/videos/thumbnails"
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Concert d'Anniversaire 2024"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Le grand concert du 15 juin 2024..."
              rows={4}
              required
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="video_url">URL de la vidéo</Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) =>
                setFormData({ ...formData, video_url: e.target.value })
              }
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-muted-foreground text-xs">
              URL YouTube ou lien direct vers la vidéo (optionnel)
            </p>
          </div>

          {/* Year & Category */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                min="1984"
                max="2100"
                value={formData.year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Catégorie <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">Ordre d'affichage</Label>
            <Input
              id="display_order"
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          {/* Visibility Toggle */}
          <div className="border-border bg-muted/50 flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_visible" className="text-base">
                Visible
              </Label>
              <p className="text-muted-foreground text-sm">
                Afficher cette vidéo sur le site
              </p>
            </div>
            <Switch
              id="is_visible"
              checked={formData.is_visible}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_visible: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {video ? "Mise à jour..." : "Ajout..."}
                </>
              ) : (
                <>{video ? "Mettre à jour" : "Ajouter"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
