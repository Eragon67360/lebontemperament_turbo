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
import { useCreatePhoto, useUpdatePhoto } from "@/hooks/useAnniversaryPhotos";
import { AnniversaryPhoto, PHOTO_CATEGORIES } from "@/types/anniversary";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo?: AnniversaryPhoto;
  maxOrder: number;
}

export function PhotoDialog({
  open,
  onOpenChange,
  photo,
  maxOrder,
}: PhotoDialogProps) {
  const createPhoto = useCreatePhoto();
  const updatePhoto = useUpdatePhoto();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year: null as number | null,
    category: "Concert" as string,
    image_url: "",
    display_order: maxOrder + 1,
    is_visible: true,
  });

  useEffect(() => {
    if (photo) {
      setFormData({
        title: photo.title,
        description: photo.description || "",
        year: photo.year,
        category: photo.category,
        image_url: photo.image_url,
        display_order: photo.display_order,
        is_visible: photo.is_visible,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        year: null,
        category: "Concert",
        image_url: "",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
  }, [photo, maxOrder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      toast.error("Veuillez uploader une image");
      return;
    }

    try {
      if (photo) {
        await updatePhoto.mutateAsync({
          id: photo.id,
          ...formData,
        });
        toast.success("Photo mise à jour avec succès");
      } else {
        await createPhoto.mutateAsync(formData);
        toast.success("Photo ajoutée avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        photo ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createPhoto.isPending || updatePhoto.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {photo ? "Modifier la photo" : "Nouvelle photo"}
          </DialogTitle>
          <DialogDescription>
            {photo
              ? "Modifiez les informations de la photo"
              : "Ajoutez une nouvelle photo à la collection"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <ImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            onRemove={() => setFormData({ ...formData, image_url: "" })}
            label="Image"
            folder="Site/anniversary/photos"
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
              placeholder="Concert Inaugural 1984"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Le tout premier concert du Bon Tempérament..."
              rows={3}
            />
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
                  {PHOTO_CATEGORIES.map((cat) => (
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
                Afficher cette photo sur le site
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
                  {photo ? "Mise à jour..." : "Ajout..."}
                </>
              ) : (
                <>{photo ? "Mettre à jour" : "Ajouter"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
