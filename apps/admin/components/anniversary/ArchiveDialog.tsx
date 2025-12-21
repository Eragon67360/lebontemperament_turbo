"use client";

import { FileUploader } from "@/components/anniversary/FileUploader";
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
import {
  useCreateArchive,
  useUpdateArchive,
} from "@/hooks/useAnniversaryArchives";
import {
  AnniversaryArchive,
  ARCHIVE_THEMES,
  ARCHIVE_TYPES,
} from "@/types/anniversary";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  "assemblée-générale": "Assemblée Générale",
  "rapport-annuel": "Rapport Annuel",
  "rapport-financier": "Rapport Financier",
  gazette: "Gazette",
  programme: "Programme",
  "document-historique": "Document Historique",
};

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archive?: AnniversaryArchive;
}

export function ArchiveDialog({
  open,
  onOpenChange,
  archive,
}: ArchiveDialogProps) {
  const createArchive = useCreateArchive();
  const updateArchive = useUpdateArchive();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    type: "assemblée-générale" as (typeof ARCHIVE_TYPES)[number],
    theme: "Gouvernance" as string,
    file_url: "",
    file_size: "",
    is_visible: true,
  });

  useEffect(() => {
    if (archive) {
      setFormData({
        title: archive.title,
        description: archive.description,
        year: archive.year,
        type: archive.type,
        theme: archive.theme,
        file_url: archive.file_url,
        file_size: archive.file_size,
        is_visible: archive.is_visible,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        year: new Date().getFullYear(),
        type: "assemblée-générale",
        theme: "Gouvernance",
        file_url: "",
        file_size: "",
        is_visible: true,
      });
    }
  }, [archive, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file_url) {
      toast.error("Veuillez uploader un fichier");
      return;
    }

    try {
      if (archive) {
        await updateArchive.mutateAsync({
          id: archive.id,
          ...formData,
        });
        toast.success("Archive mise à jour avec succès");
      } else {
        await createArchive.mutateAsync(formData);
        toast.success("Archive créée avec succès");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        archive
          ? "Erreur lors de la mise à jour"
          : "Erreur lors de la création",
      );
      console.error("Error:", error);
    }
  };

  const isLoading = createArchive.isPending || updateArchive.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-150">
        <DialogHeader>
          <DialogTitle>
            {archive ? "Modifier l'archive" : "Nouvelle archive"}
          </DialogTitle>
          <DialogDescription>
            {archive
              ? "Modifiez les informations de l'archive"
              : "Ajoutez un nouveau document aux archives"}
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
              placeholder="Assemblée Générale 2023"
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
              placeholder="Rapport complet de l'Assemblée Générale annuelle..."
              rows={3}
              required
            />
          </div>

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
              placeholder="2023"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as (typeof ARCHIVE_TYPES)[number],
                })
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">
              Thème <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.theme}
              onValueChange={(value) =>
                setFormData({ ...formData, theme: value })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Sélectionner un thème" />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_THEMES.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <FileUploader
              value={formData.file_url}
              onChange={(url, fileSize) => {
                setFormData({
                  ...formData,
                  file_url: url,
                  file_size: fileSize,
                });
              }}
              onRemove={() => {
                setFormData({
                  ...formData,
                  file_url: "",
                  file_size: "",
                });
              }}
              label="Document"
              folder="Site/anniversary/archives"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_visible" className="text-base">
                Visible sur le site
              </Label>
              <p className="text-muted-foreground text-sm">
                Afficher cette archive sur la page publique
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {archive ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
