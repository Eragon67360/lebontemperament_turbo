"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/types/projects";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateProjectPage() {
  const router = useRouter();
  const [projectData, setProjectData] = useState<Partial<Project>>({
    name: "",
    sub_name: "",
    display_order: 0,
    explanation: "",
    slug: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) throw new Error("Échec de la création du projet");

      const newProject = await response.json();
      toast.success("Projet créé avec succès");
      router.push(`/admin/projects/${newProject.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer le projet");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Créer un nouveau projet</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nom du projet</Label>
          <Input
            value={projectData.name}
            onChange={(e) =>
              setProjectData({ ...projectData, name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label>Sous-titre</Label>
          <Input
            value={projectData.sub_name || ""}
            onChange={(e) =>
              setProjectData({ ...projectData, sub_name: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Ordre d&apos;affichage</Label>
          <Input
            type="number"
            value={projectData.display_order || 0}
            onChange={(e) =>
              setProjectData({
                ...projectData,
                display_order: Number(e.target.value),
              })
            }
            required
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={projectData.slug || ""}
            onChange={(e) =>
              setProjectData({ ...projectData, slug: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label>Explication</Label>
          <Textarea
            value={projectData.explanation || ""}
            onChange={(e) =>
              setProjectData({ ...projectData, explanation: e.target.value })
            }
          />
        </div>
        <Button type="submit">Créer le projet</Button>
      </form>
    </div>
  );
}
