"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormConfig } from "@/hooks/useAnniversaryFormConfig";

export default function FormConfigPage() {
  const { data: formConfig, isLoading } = useFormConfig();

  if (isLoading) {
    return (
      <PageShell
        title="Configuration du Formulaire"
        description="Personnaliser le formulaire de partage de souvenirs"
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
      title="Configuration du Formulaire"
      description="Personnaliser le formulaire de partage de souvenirs"
      theme="anniversary"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Les composants seront ajoutés à l'étape 3
        </p>
        {formConfig && (
          <p className="text-muted-foreground mt-2 text-sm">
            Données chargées : {formConfig.section_title}
          </p>
        )}
      </div>
    </PageShell>
  );
}
