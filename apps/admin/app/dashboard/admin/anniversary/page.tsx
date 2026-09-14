"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataState } from "@/components/ui/data-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useFeatureFlag, useUpdateFeatureFlag } from "@/hooks/useFeatureFlags";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AnniversaryAdminPage() {
  const {
    data: featureFlag,
    isLoading,
    isError,
    refetch,
  } = useFeatureFlag("anniversary_40_years");
  const updateFeatureFlag = useUpdateFeatureFlag();

  // Toggle feature flag
  const handleToggle = async (enabled: boolean) => {
    try {
      await updateFeatureFlag.mutateAsync({
        flag_key: "anniversary_40_years",
        is_enabled: enabled,
      });

      toast.success(
        enabled
          ? "Page anniversaire activée avec succès"
          : "Page anniversaire désactivée avec succès",
      );
    } catch (error) {
      console.error("Error updating feature flag:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du statut",
      );
    }
  };

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Anniversaire 40 ans"
      description="Gérer l'affichage de la page anniversaire et des éléments associés"
      theme="anniversary"
    >
      <DataState
        isLoading={isLoading}
        isError={isError || (!isLoading && !featureFlag)}
        onRetry={() => refetch()}
        errorDescription="Les paramètres de la fonctionnalité n'ont pas pu être chargés."
        skeleton={
          <div role="status" aria-busy>
            <span className="sr-only">Chargement des paramètres…</span>
            <Skeleton className="h-56 w-full rounded-2xl" aria-hidden />
          </div>
        }
      >
        {featureFlag && (
          <div className="grid gap-4">
            {/* Warning Card */}
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500">
                    <span className="text-xs font-bold text-white">⚠</span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold text-red-900">
                      ⚠️ ATTENTION - Ne pas activer sans autorisation
                    </p>
                    <p className="text-xs font-medium text-red-800 sm:text-sm">
                      Cette fonctionnalité ne doit PAS être activée sans
                      l&apos;autorisation explicite de Thomas. Veuillez
                      contacter Thomas avant toute activation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Toggle Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-xl">
                        {featureFlag.flag_name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {featureFlag.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={featureFlag.is_enabled ? "default" : "secondary"}
                    className="flex w-fit items-center gap-1.5 px-3 py-1"
                  >
                    {featureFlag.is_enabled ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Activé
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Désactivé
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <Label
                      htmlFor="anniversary-toggle"
                      className="text-sm font-medium sm:text-base"
                    >
                      Visibilité de la page
                    </Label>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      {featureFlag.is_enabled
                        ? "La page est actuellement visible par tous les utilisateurs"
                        : "La page est actuellement masquée et redirige vers la page 404"}
                    </p>
                  </div>
                  <Switch
                    id="anniversary-toggle"
                    checked={featureFlag.is_enabled}
                    onCheckedChange={handleToggle}
                    disabled={updateFeatureFlag.isPending}
                    className="self-start sm:self-auto"
                  />
                </div>

                {featureFlag.updated_at && (
                  <p className="mt-4 text-xs text-gray-500">
                    Dernière modification :{" "}
                    {new Date(featureFlag.updated_at).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Éléments affectés</CardTitle>
                <CardDescription>
                  Ces éléments seront automatiquement masqués lorsque la page
                  est désactivée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="flex-1">
                      Page{" "}
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] sm:text-xs">
                        /40-ans
                      </code>{" "}
                      (redirection vers 404)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="flex-1">
                      Lien dans la navigation principale du site
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="flex-1">
                      Section anniversaire dans le hero de la page
                      d&apos;accueil
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-primary/10 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="flex-1">
                      Bouton flottant «&nbsp;40 ans&nbsp;» sur toutes les pages
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Two separate coloured notice cards said two small things; one muted
            card keeps the page's only real warning (the red one) loud. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bon à savoir</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                <p>
                  Les administrateurs connectés accèdent à la page anniversaire
                  par son URL même lorsque la fonctionnalité est désactivée
                  (version preview).
                </p>
                <p>
                  Les changements s&apos;appliquent immédiatement sur le site :
                  la navigation s&apos;affiche ou se masque en temps réel pour
                  les visiteurs connectés.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </PageShell>
  );
}
