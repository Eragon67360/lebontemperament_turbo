"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnniversaryHero } from "@/hooks/useAnniversaryHero";

export default function HeroPage() {
  const { data: hero, isLoading } = useAnniversaryHero();

  if (isLoading) {
    return (
      <PageShell
        title="Section Hero"
        description="Gérer le contenu de la section d'accueil de la page anniversaire"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Section Hero"
      description="Gérer le contenu de la section d'accueil de la page anniversaire"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Les composants seront ajoutés à l'étape 3
        </p>
        {hero && (
          <p className="text-muted-foreground mt-2 text-sm">
            Données chargées : {hero.hero_number} {hero.hero_subtitle}
          </p>
        )}
      </div>
    </PageShell>
  );
}
