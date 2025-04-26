"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Project } from "@/types/projects";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const { id } = useParams();

  // const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Impossible de récupérer le projet");

      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération du projet");
      // router.push(RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [fetchProject, id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour");

      toast.success("Projet mis à jour avec succès");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le projet");
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!project) return <div>Projet non trouvé</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Détails du projet</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <Label>Nom du projet</Label>
          <Input
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            required
          />
        </div>
        {/* Add similar input fields for other project properties */}
        <Button type="submit">Mettre à jour</Button>
      </form>
    </div>
  );
}
