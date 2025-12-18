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
  useCreateNavigationCard,
  useUpdateNavigationCard,
} from "@/hooks/useAnniversaryNavigation";
import { AnniversaryNavigationCard, IconName } from "@/types/anniversary";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NavigationCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: AnniversaryNavigationCard;
  maxOrder: number;
}

export function NavigationCardDialog({
  open,
  onOpenChange,
  card,
  maxOrder,
}: NavigationCardDialogProps) {
  const createCard = useCreateNavigationCard();
  const updateCard = useUpdateNavigationCard();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon_name: "FaMusic" as IconName,
    target_section_id: "",
    display_order: maxOrder + 1,
    is_visible: true,
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description,
        icon_name: card.icon_name as IconName,
        target_section_id: card.target_section_id,
        display_order: card.display_order,
        is_visible: card.is_visible,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        icon_name: "FaMusic",
        target_section_id: "",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
  }, [card, maxOrder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (card) {
        await updateCard.mutateAsync({
          id: card.id,
          ...formData,
        });
        toast.success("Carte mise à jour avec succès");
      } else {
        await createCard.mutateAsync(formData);
        toast.success("Carte créée avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        card ? "Erreur lors de la mise à jour" : "Erreur lors de la création",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createCard.isPending || updateCard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {card ? "Modifier la carte" : "Nouvelle carte"}
          </DialogTitle>
          <DialogDescription>
            {card
              ? "Modifiez les informations de la carte de navigation"
              : "Ajoutez une nouvelle carte de navigation vers une section"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Notre Histoire"
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
              placeholder="Parcourez 40 ans de moments marquants..."
              rows={3}
              required
            />
          </div>

          {/* Icon Picker */}
          <IconPicker
            value={formData.icon_name}
            onChange={(icon) => setFormData({ ...formData, icon_name: icon })}
          />

          {/* Target Section ID */}
          <div className="space-y-2">
            <Label htmlFor="target_section_id">
              ID de la section cible <span className="text-destructive">*</span>
            </Label>
            <Input
              id="target_section_id"
              value={formData.target_section_id}
              onChange={(e) =>
                setFormData({ ...formData, target_section_id: e.target.value })
              }
              placeholder="timeline"
              required
            />
            <p className="text-muted-foreground text-xs">
              L'ID HTML de la section vers laquelle naviguer (ex: "timeline")
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
                Afficher cette carte sur le site
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
                  {card ? "Mise à jour..." : "Création..."}
                </>
              ) : (
                <>{card ? "Mettre à jour" : "Créer"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
