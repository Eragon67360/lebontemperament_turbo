"use client";

import { AudioUploader } from "@/components/anniversary/AudioUploader";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAudioMemory,
  useUpdateAudioMemory,
} from "@/hooks/useAnniversaryAudio";
import { AnniversaryAudioMemory } from "@/types/anniversary";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AudioMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audio?: AnniversaryAudioMemory;
  maxOrder: number;
}

export function AudioMemoryDialog({
  open,
  onOpenChange,
  audio,
  maxOrder,
}: AudioMemoryDialogProps) {
  const createAudio = useCreateAudioMemory();
  const updateAudio = useUpdateAudioMemory();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    speaker_name: "",
    year: null as number | null,
    duration: "",
    audio_url: "",
    display_order: maxOrder + 1,
    is_visible: true,
  });

  useEffect(() => {
    if (audio) {
      setFormData({
        title: audio.title,
        description: audio.description,
        speaker_name: audio.speaker_name || "",
        year: audio.year,
        duration: audio.duration,
        audio_url: audio.audio_url,
        display_order: audio.display_order,
        is_visible: audio.is_visible,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        speaker_name: "",
        year: null,
        duration: "",
        audio_url: "",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
  }, [audio, maxOrder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.audio_url) {
      toast.error("Veuillez uploader un fichier audio");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        speaker_name: formData.speaker_name || null,
      };

      if (audio) {
        await updateAudio.mutateAsync({
          id: audio.id,
          ...dataToSubmit,
        });
        toast.success("Mémoire audio mise à jour avec succès");
      } else {
        await createAudio.mutateAsync(dataToSubmit);
        toast.success("Mémoire audio ajoutée avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        audio ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createAudio.isPending || updateAudio.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {audio ? "Modifier la mémoire audio" : "Nouvelle mémoire audio"}
          </DialogTitle>
          <DialogDescription>
            {audio
              ? "Modifiez les informations de la mémoire audio"
              : "Ajoutez un nouveau témoignage ou extrait audio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audio Upload */}
          <AudioUploader
            value={formData.audio_url}
            onChange={(url) => setFormData({ ...formData, audio_url: url })}
            onRemove={() => setFormData({ ...formData, audio_url: "" })}
            label="Fichier audio"
            folder="Site/anniversary/audio"
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
              placeholder="Simone se souvient : Novembre 1984"
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
              placeholder="Simone Duclos raconte avec émotion..."
              rows={4}
              required
            />
          </div>

          {/* Speaker Name & Year */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="speaker_name">Intervenant</Label>
              <Input
                id="speaker_name"
                value={formData.speaker_name}
                onChange={(e) =>
                  setFormData({ ...formData, speaker_name: e.target.value })
                }
                placeholder="Simone Duclos, Fondatrice"
              />
            </div>

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
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Durée <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              placeholder="5:32"
              pattern="[0-9]+:[0-9]{2}"
              required
            />
            <p className="text-muted-foreground text-xs">
              Format: MM:SS (ex: 5:32)
            </p>
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
                Afficher cette mémoire audio sur le site
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
                  {audio ? "Mise à jour..." : "Ajout..."}
                </>
              ) : (
                <>{audio ? "Mettre à jour" : "Ajouter"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
