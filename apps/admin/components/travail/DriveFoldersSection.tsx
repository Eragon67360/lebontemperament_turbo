"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState, ListSkeleton } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDriveFolders,
  useUpdateDriveFolder,
  type DriveFolder,
} from "@/hooks/useDriveFolders";
import { driveFolderUrl } from "@repo/domain/utils/drive";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Explains what each row actually drives on the members site. */
const HINTS: Record<string, string> = {
  racine: "Bouton « Accès direct au drive » (navigation et espace membres)",
};

export function DriveFoldersSection() {
  const { data: folders, isLoading, isError, refetch } = useDriveFolders();
  const updateFolder = useUpdateDriveFolder();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (folders) {
      setValues(
        Object.fromEntries(folders.map((f) => [f.id, f.folder_id])) as Record<
          string,
          string
        >,
      );
    }
  }, [folders]);

  const handleSave = async (folder: DriveFolder) => {
    const value = values[folder.id]?.trim();
    if (!value) return;

    setSavingId(folder.id);
    try {
      await updateFolder.mutateAsync({ id: folder.id, folder_id: value });
      toast.success(`Dossier « ${folder.label} » mis à jour`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
      );
      console.error("Update drive folder error:", error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Dossiers Drive (site membres)
        </CardTitle>
        <CardDescription>
          Ces dossiers alimentent la page « Partitions & Documents » du site.
          Collez un identifiant Google Drive ou l&apos;URL complète du dossier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          // A failed load must not render empty inputs: one "Enregistrer" would
          // point a folder at nothing on the live members page.
          <ErrorState
            description="Les dossiers Drive n'ont pas pu être chargés. Rien n'est modifiable tant qu'ils ne sont pas récupérés."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <ListSkeleton rows={6} label="Chargement des dossiers Drive…" />
        ) : (
          <div className="space-y-5">
            {folders?.map((folder) => {
              const inputId = `drive-folder-${folder.slug}`;
              const value = values[folder.id] ?? "";
              const isSaving = savingId === folder.id;
              const isUnchanged = value.trim() === folder.folder_id;

              return (
                <div key={folder.id} className="space-y-2">
                  <Label htmlFor={inputId}>{folder.label}</Label>
                  {HINTS[folder.slug] && (
                    <p className="text-muted-foreground text-xs">
                      {HINTS[folder.slug]}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id={inputId}
                      value={value}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [folder.id]: e.target.value,
                        }))
                      }
                      placeholder="Identifiant ou URL du dossier Drive"
                      className="min-h-11 font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 flex-1 sm:flex-none"
                        asChild
                      >
                        <a
                          href={driveFolderUrl(folder.folder_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          Ouvrir
                          <span className="sr-only">
                            {" "}
                            le dossier {folder.label} dans Drive
                          </span>
                        </a>
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11 flex-1 sm:flex-none"
                        onClick={() => handleSave(folder)}
                        disabled={isSaving || isUnchanged || !value.trim()}
                      >
                        {isSaving ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <Save className="h-4 w-4" aria-hidden />
                        )}
                        Enregistrer
                        <span className="sr-only"> {folder.label}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
