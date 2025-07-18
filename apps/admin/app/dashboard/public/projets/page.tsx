"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/projects";
import RouteNames from "@/utils/routes";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Impossible de récupérer les projets");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      toast.error("Échec de la récupération des projets");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="mt-10 text-center">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="mt-10 text-center">
        <p>{error}</p>
        <Button onClick={fetchProjects} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-0 md:mx-4 lg:mx-8 xl:mx-12 2xl:mx-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-base font-bold md:text-lg xl:text-xl">Projets</h1>
        <Link href={RouteNames.DASHBOARD.PUBLIC.PROJETS.CREATE}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un projet
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-muted-foreground text-center">
          Aucun projet trouvé
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <Link
                    href={RouteNames.DASHBOARD.PUBLIC.PROJETS.PROJET(
                      project.id,
                    )}
                  >
                    {project.name}
                  </Link>
                  <span className="text-muted-foreground text-sm">
                    Ordre : {project.display_order}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{project.sub_name || "Pas de sous-titre"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
