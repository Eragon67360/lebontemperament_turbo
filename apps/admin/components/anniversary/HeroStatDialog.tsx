"use client";

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
import {
  useCreateHeroStat,
  useUpdateHeroStat,
} from "@/hooks/useAnniversaryHeroStats";
import type { AnniversaryHeroStat, IconName } from "@/types/anniversary";
import { useEffect, useState } from "react";
import { IconPicker } from "./IconPicker";

interface HeroStatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stat?: AnniversaryHeroStat;
  maxOrder: number;
}

export function HeroStatDialog({
  open,
  onOpenChange,
  stat,
  maxOrder,
}: HeroStatDialogProps) {
  const createStat = useCreateHeroStat();
  const updateStat = useUpdateHeroStat();

  const [formData, setFormData] = useState<{
    icon_name: IconName;
    number: string;
    label: string;
    display_order: number;
    is_visible: boolean;
  }>({
    icon_name: "FaMusic",
    number: "",
    label: "",
    display_order: 0,
    is_visible: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (stat) {
      setFormData({
        icon_name: stat.icon_name as IconName,
        number: stat.number,
        label: stat.label,
        display_order: stat.display_order,
        is_visible: stat.is_visible,
      });
    } else {
      setFormData({
        icon_name: "FaMusic",
        number: "",
        label: "",
        display_order: maxOrder + 1,
        is_visible: true,
      });
    }
    setErrors({});
  }, [stat, maxOrder, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.icon_name) {
      newErrors.icon_name = "L'icône est requise";
    }
    if (!formData.number.trim()) {
      newErrors.number = "Le nombre est requis";
    }
    if (!formData.label.trim()) {
      newErrors.label = "Le label est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (stat) {
        await updateStat.mutateAsync({
          id: stat.id,
          ...formData,
        });
      } else {
        await createStat.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving hero stat:", error);
    }
  };

  const isLoading = createStat.isPending || updateStat.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stat ? "Modifier" : "Ajouter"} une statistique
          </DialogTitle>
          <DialogDescription>
            {stat
              ? "Modifiez les informations de la statistique"
              : "Ajoutez une nouvelle statistique pour la section héro"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon Picker */}
          <div className="space-y-2">
            <IconPicker
              value={formData.icon_name as IconName}
              onChange={(iconName) =>
                setFormData({ ...formData, icon_name: iconName })
              }
              error={errors.icon_name}
            />
          </div>

          {/* Number */}
          <div className="space-y-2">
            <Label htmlFor="number">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="Ex: 40, 200+, 500+"
              maxLength={20}
            />
            {errors.number && (
              <p className="text-destructive text-sm">{errors.number}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Valeur affichée sur la carte (max 20 caractères)
            </p>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="Ex: Années, Concerts, Membres, CDs"
              maxLength={100}
            />
            {errors.label && (
              <p className="text-destructive text-sm">{errors.label}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Texte affiché sous le nombre (max 100 caractères)
            </p>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">Ordre d'affichage</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value) || 0,
                })
              }
              min={0}
            />
            <p className="text-muted-foreground text-xs">
              Les statistiques sont affichées par ordre croissant
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_visible">Visible sur le site</Label>
              <p className="text-muted-foreground text-sm">
                Afficher cette statistique sur la page anniversaire
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
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
