"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideos } from "@/hooks/useAnniversaryVideos";
import { Plus } from "lucide-react";

export default function VideosPage() {
  const { data: videos, isLoading } = useVideos();

  if (isLoading) {
    return (
      <PageShell
        title="Galerie Vidéo"
        description="Gérer les vidéos de concerts, témoignages et documentaires"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-64 w-full" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Galerie Vidéo"
      description="Gérer les vidéos de concerts, témoignages et documentaires"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {videos?.length || 0} vidéo(s)
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une vidéo
        </Button>
      </div>

      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Les composants seront ajoutés à l'étape 3
        </p>
      </div>
    </PageShell>
  );
}
