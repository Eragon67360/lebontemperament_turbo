"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/projects";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectPreviewPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      const projects = await response.json();
      const projectData = Array.isArray(projects)
        ? projects.find((p: Project) => p.slug === slug)
        : null;
      if (projectData) {
        setProject(projectData);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell
        theme="public"
        className="px-4 py-8 sm:px-6 lg:px-8"
        title="Chargement..."
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <Loader2 className="text-primary/50 mx-auto h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Chargement de la prévisualisation...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell
        theme="public"
        className="px-4 py-8 sm:px-6 lg:px-8"
        title="Projet non trouvé"
      >
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-medium">Projet non trouvé</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Le projet avec le slug &quot;{slug}&quot; n&apos;a pas pu être
              trouvé dans la base de données.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/public/concerts/projets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
            </Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  // Use iframe to show the actual website preview
  const previewUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3002"}/concerts/${slug}`;

  return (
    <PageShell
      fullHeight
      theme="public"
      className="flex h-screen flex-col overflow-hidden px-0 py-0"
      title={`Prévisualisation: ${project.name} ${project.sub_name || ""}`}
      description="Aperçu du projet tel qu'il apparaîtra sur le site public"
      headerAction={
        <Button variant="outline" asChild>
          <Link href="/dashboard/public/concerts/projets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Link>
        </Button>
      }
    >
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={previewUrl}
          className="absolute inset-0 h-full w-full border-0"
          title={`Prévisualisation: ${project.name}`}
          allow="fullscreen"
        />
      </div>
    </PageShell>
  );
}
