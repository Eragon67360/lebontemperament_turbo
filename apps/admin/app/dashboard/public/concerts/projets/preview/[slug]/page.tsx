"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { PROJECTS_HREF } from "@/components/projects/ProjectRow";
import { Button } from "@/components/ui/button";
import { DataState, EmptyState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/hooks/useProjects";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * The public page of a story, framed. It opens in a new tab from the
 * list, so « Retour aux histoires » is a link that works here and the
 * intro says the tab can simply be closed.
 */
export default function StoryPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isPending, isError, refetch } = useProject(slug);

  const previewUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3002"}/concerts/${slug}`;

  return (
    <PageShell
      fullHeight
      className="flex flex-col px-0 py-4 sm:py-6"
      title={
        project
          ? `Aperçu de « ${project.name}${project.sub_name ? ` ${project.sub_name}` : ""} »`
          : "Aperçu d'une histoire"
      }
      description="La page telle que le site public la montre en ce moment. Cet aperçu s'est ouvert dans un nouvel onglet : fermez-le pour revenir à la liste, ou utilisez le bouton."
      headerAction={
        <Button variant="outline" asChild>
          <Link href={PROJECTS_HREF}>
            <ArrowLeft aria-hidden />
            Retour aux histoires
          </Link>
        </Button>
      }
    >
      <DataState
        isLoading={isPending}
        isError={isError}
        isEmpty={!project}
        onRetry={() => refetch()}
        errorDescription="L'histoire n'a pas pu être chargée : le serveur n'a pas répondu."
        skeleton={
          <div role="status" aria-busy className="flex-1">
            <span className="sr-only">Chargement de l&apos;aperçu…</span>
            <Skeleton className="h-full min-h-[60vh] w-full rounded-lg" />
          </div>
        }
        empty={
          <EmptyState
            icon={BookOpen}
            title="Cette histoire n'existe pas"
            description={`Aucune histoire n'a l'adresse « ${slug} ». Elle a peut-être été supprimée, ou son adresse a changé.`}
            action={
              <Button variant="outline" asChild>
                <Link href={PROJECTS_HREF}>
                  <ArrowLeft aria-hidden />
                  Retour aux histoires
                </Link>
              </Button>
            }
          />
        }
      >
        <div className="border-border relative min-h-[60vh] flex-1 overflow-hidden rounded-lg border">
          <iframe
            src={previewUrl}
            className="absolute inset-0 h-full w-full border-0"
            title={`Aperçu de « ${project?.name ?? slug} » sur le site public`}
            allow="fullscreen"
          />
        </div>
      </DataState>
    </PageShell>
  );
}
