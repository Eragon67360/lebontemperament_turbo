// components/modals/project-modal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/types/projects";
import { toast } from "sonner";

interface ProjectFormData {
  name: string;
  sub_name: string;
  image: string;
  slug: string;
  explanation: string;
  banniere: string;
  image2: string;
  image3: string;
  text1: string;
  text2: string;
  display_order: number;
}

export function ProjectModal({
  project,
  isOpen,
  onClose,
  onSubmit,
}: {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => Promise<void>;
}) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    sub_name: "",
    image: "",
    slug: "",
    explanation: "",
    banniere: "",
    image2: "",
    image3: "",
    text1: "",
    text2: "",
    display_order: 0,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        sub_name: project.sub_name || "",
        image: project.image || "",
        slug: project.slug || "",
        explanation: project.explanation || "",
        banniere: project.banniere || "",
        image2: project.image2 || "",
        image3: project.image3 || "",
        text1: project.text1 || "",
        text2: project.text2 || "",
        display_order: project.display_order,
      });
    } else {
      // Fetch the current number of projects to set display_order
      fetchDisplayOrder();
    }
  }, [project]);

  const fetchDisplayOrder = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const projects = await response.json();
      const newDisplayOrder = projects.length;
      setFormData((prev) => ({ ...prev, display_order: newDisplayOrder }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to set display order");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name) {
      toast.error("Le nom du projet est requis");
      return;
    }

    if (!formData.slug) {
      toast.error("Le slug est requis");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde du projet");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {project ? "Modifier le projet" : "Créer un projet"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Name and Sub-name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    slug: generateSlug(newName),
                  });
                }}
                placeholder="Nom du projet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_name">Sous-titre</Label>
              <Input
                id="sub_name"
                value={formData.sub_name}
                onChange={(e) =>
                  setFormData({ ...formData, sub_name: e.target.value })
                }
                placeholder="Sous-titre du projet"
              />
            </div>

            {/* Slug and Display Order */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="slug-du-projet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordre d&apos;affichage</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: parseInt(e.target.value),
                  })
                }
                disabled
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Description</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              placeholder="Description du projet"
              rows={3}
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image principale</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="URL de l'image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banniere">Bannière</Label>
              <Input
                id="banniere"
                value={formData.banniere}
                onChange={(e) =>
                  setFormData({ ...formData, banniere: e.target.value })
                }
                placeholder="URL de la bannière"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image2">Image 2</Label>
              <Input
                id="image2"
                value={formData.image2}
                onChange={(e) =>
                  setFormData({ ...formData, image2: e.target.value })
                }
                placeholder="URL de l'image 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image3">Image 3</Label>
              <Input
                id="image3"
                value={formData.image3}
                onChange={(e) =>
                  setFormData({ ...formData, image3: e.target.value })
                }
                placeholder="URL de l'image 3"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-2">
            <Label htmlFor="text1">Texte 1</Label>
            <Textarea
              id="text1"
              value={formData.text1}
              onChange={(e) =>
                setFormData({ ...formData, text1: e.target.value })
              }
              placeholder="Premier paragraphe"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text2">Texte 2</Label>
            <Textarea
              id="text2"
              value={formData.text2}
              onChange={(e) =>
                setFormData({ ...formData, text2: e.target.value })
              }
              placeholder="Second paragraphe"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">{project ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
