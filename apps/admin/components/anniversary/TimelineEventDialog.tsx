"use client";

import { IconPicker } from "@/components/anniversary/IconPicker";
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
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
} from "@/hooks/useAnniversaryTimeline";
import { AnniversaryTimelineEvent, IconName } from "@/types/anniversary";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TimelineEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AnniversaryTimelineEvent;
  maxOrder: number;
}

export function TimelineEventDialog({
  open,
  onOpenChange,
  event,
  maxOrder,
}: TimelineEventDialogProps) {
  const createEvent = useCreateTimelineEvent();
  const updateEvent = useUpdateTimelineEvent();

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    title: "",
    description: "",
    icon_name: "FaMusic" as IconName,
    display_order: maxOrder + 1,
    is_visible: true,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        year: event.year,
        title: event.title,
        description: event.description,
        icon_name: event.icon_name as IconName,
        display_order: event.display_order,
        is_visible: event.is_visible ?? true,
      });
    } else {
      setFormData({
        year: new Date().getFullYear(),
        title: "",
        description: "",
        icon_name: "FaMusic",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
  }, [event, maxOrder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          ...formData,
        });
        toast.success("Événement mis à jour avec succès");
      } else {
        await createEvent.mutateAsync(formData);
        toast.success("Événement créé avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        event ? "Erreur lors de la mise à jour" : "Erreur lors de la création",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Nouvel événement"}
          </DialogTitle>
          <DialogDescription>
            {event
              ? "Modifiez les informations de l'événement de la chronologie"
              : "Ajoutez un nouvel événement marquant à la chronologie"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year">
              Année <span className="text-destructive">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              min="1984"
              max="2100"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
              placeholder="2024"
              required
            />
          </div>

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
              placeholder="La Création"
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
              placeholder="Un dimanche de novembre 1984..."
              rows={5}
              required
            />
          </div>

          {/* Icon Picker */}
          <IconPicker
            value={formData.icon_name}
            onChange={(icon) => setFormData({ ...formData, icon_name: icon })}
          />

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
                Afficher cet événement sur le site
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
                  {event ? "Mise à jour..." : "Création..."}
                </>
              ) : (
                <>{event ? "Mettre à jour" : "Créer"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
