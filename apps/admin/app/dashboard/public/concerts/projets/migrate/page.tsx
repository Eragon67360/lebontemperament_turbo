"use client";

import { PageShell } from "@/components/layouts/PageShell";
import {
  MigrateDialog,
  MigrationResultCallout,
} from "@/components/projects/MigrateDialog";
import { PROJECTS_HREF } from "@/components/projects/ProjectRow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MigrationResult } from "@/hooks/useProjects";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * The one-off import page, kept at its address (it is linked from old
 * bookmarks): the same confirmation and result as the « Plus » menu of
 * the stories list.
 */
export default function MigrateStoriesPage() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Importer l'ancien fichier des histoires"
      description="Les histoires du site d'avant l'administration sont ajoutées à la liste ; celles déjà présentes sont ignorées."
      headerAction={
        <Button variant="outline" asChild>
          <Link href={PROJECTS_HREF}>
            <ArrowLeft aria-hidden />
            Retour aux histoires
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        {result && (
          <MigrationResultCallout
            result={result}
            onDismiss={() => setResult(null)}
          />
        )}
        <Card className="space-y-4 p-4 sm:p-6">
          <p className="text-body">
            L&apos;import ne remplace et ne supprime rien : une histoire dont
            l&apos;adresse existe déjà est laissée telle quelle. Vous pourrez
            modifier ou supprimer les histoires importées une par une.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Download aria-hidden />
            Importer l&apos;ancien fichier
          </Button>
        </Card>
      </div>

      <MigrateDialog open={open} onOpenChange={setOpen} onResult={setResult} />
    </PageShell>
  );
}
