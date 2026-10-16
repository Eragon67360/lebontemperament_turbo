"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  DRIVE_FIXED_SLUGS,
  DRIVE_LABEL_MAX_LENGTH,
  DRIVE_ROOT_SLUG,
  driveFolderUrl,
  extractDriveFolderId,
  slugifyDriveLabel,
} from "@repo/domain/utils/drive";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface FolderDraft {
  label: string;
  folderId: string;
}

/** One editable draft per stored folder row. */
const draftsFromFolders = (folders: DriveFolder[] | undefined) =>
  folders
    ? (Object.fromEntries(
        folders.map((f) => [f.id, { label: f.label, folderId: f.folder_id }]),
      ) as Record<string, FolderDraft>)
    : {};

export function DriveFoldersSection() {
  const { data, isLoading, isError, refetch } = useDriveFolders();
  // The whole-Drive row feeds the sync only: nobody edits it here.
  const folders = useMemo(
    () => data?.filter((f) => f.slug !== DRIVE_ROOT_SLUG),
    [data],
  );
  const updateFolder = useUpdateDriveFolder();
  const [drafts, setDrafts] = useState<Record<string, FolderDraft>>(() =>
    draftsFromFolders(folders),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<DriveFolder | null>(null);

  // Loaded (or refetched) rows replace the fields, as before.
  useResetOnChange([folders], () => {
    if (folders) setDrafts(draftsFromFolders(folders));
  });

  const setDraft = (id: string, change: Partial<FolderDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { label: "", folderId: "" }), ...change },
    }));

  const save = async (folder: DriveFolder) => {
    const draft = drafts[folder.id];
    if (!draft) return;
    const label = draft.label.trim().replace(/\s+/g, " ");
    const folderId = extractDriveFolderId(draft.folderId);

    setSavingId(folder.id);
    try {
      const result = await updateFolder.mutateAsync({
        id: folder.id,
        ...(label !== folder.label ? { label } : {}),
        ...(folderId && folderId !== folder.folder_id
          ? { folder_id: folderId }
          : {}),
      });
      toast.success(`Dossier « ${result.folder.label} » mis à jour`, {
        description:
          result.indexCleared !== null && result.indexCleared > 0
            ? "Cliquez sur « Synchroniser depuis Drive » pour lister les fichiers du nouveau dossier (sinon, la synchronisation de la nuit s'en charge)."
            : undefined,
      });
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

  const handleSave = (folder: DriveFolder) => {
    const draft = drafts[folder.id];
    const folderId = draft ? extractDriveFolderId(draft.folderId) : "";
    // A new Drive folder changes what members see at once: ask first.
    if (folderId && folderId !== folder.folder_id) setConfirming(folder);
    else void save(folder);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Dossiers Drive (site membres)
        </CardTitle>
        <CardDescription>
          Ces dossiers alimentent la page « Partitions & Documents » du site et
          de l&apos;application. Vous pouvez changer le nom d&apos;un dossier,
          puis le dossier Drive qu&apos;il ouvre : collez un identifiant Google
          Drive ou l&apos;URL complète du dossier.
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
          <ListSkeleton rows={5} label="Chargement des dossiers Drive…" />
        ) : (
          <div className="divide-border divide-y">
            {folders?.map((folder) => {
              const draft = drafts[folder.id] ?? {
                label: folder.label,
                folderId: folder.folder_id,
              };
              const labelId = `drive-folder-label-${folder.slug}`;
              const idId = `drive-folder-id-${folder.slug}`;
              const isSaving = savingId === folder.id;
              const label = draft.label.trim().replace(/\s+/g, " ");
              const folderId = extractDriveFolderId(draft.folderId);
              const fixed = DRIVE_FIXED_SLUGS.includes(folder.slug);
              const nextSlug = fixed ? folder.slug : slugifyDriveLabel(label);
              const invalidLabel = !label || !nextSlug;
              const invalidFolder = !folderId;
              const isUnchanged =
                label === folder.label && folderId === folder.folder_id;

              return (
                <div key={folder.id} className="space-y-3 py-5 first:pt-0">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <div className="space-y-2">
                      <Label htmlFor={labelId}>Nom</Label>
                      <Input
                        id={labelId}
                        value={draft.label}
                        maxLength={DRIVE_LABEL_MAX_LENGTH}
                        onChange={(e) =>
                          setDraft(folder.id, { label: e.target.value })
                        }
                        aria-describedby={`${labelId}-hint`}
                        className="min-h-11"
                      />
                      <p
                        id={`${labelId}-hint`}
                        className="text-muted-foreground text-xs"
                      >
                        {fixed
                          ? `Identifiant interne : « ${folder.slug} » (ne change pas).`
                          : nextSlug
                            ? `Identifiant interne : « ${nextSlug} » (suit le nom).`
                            : "Le nom doit contenir une lettre ou un chiffre."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={idId}>Dossier Drive</Label>
                      <Input
                        id={idId}
                        value={draft.folderId}
                        onChange={(e) =>
                          setDraft(folder.id, { folderId: e.target.value })
                        }
                        placeholder="Identifiant ou URL du dossier Drive"
                        aria-invalid={invalidFolder}
                        aria-describedby={
                          invalidFolder ? `${idId}-hint` : undefined
                        }
                        className="min-h-11 font-mono text-sm"
                      />
                      {invalidFolder && (
                        <p
                          id={`${idId}-hint`}
                          className="text-danger-foreground text-xs"
                        >
                          Collez l&apos;identifiant ou l&apos;URL d&apos;un
                          dossier Google Drive.
                        </p>
                      )}
                    </div>
                  </div>
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
                    {/* Outlined: « Synchroniser depuis Drive » is the page's one primary. */}
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 flex-1 sm:flex-none"
                      onClick={() => handleSave(folder)}
                      disabled={
                        isSaving || isUnchanged || invalidLabel || invalidFolder
                      }
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Save className="h-4 w-4" aria-hidden />
                      )}
                      Enregistrer
                      <span className="sr-only"> {folder.label}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Changer le dossier Drive de « {confirming?.label} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les membres verront tout de suite le contenu du nouveau dossier,
              sur le site comme dans l&apos;application. Les anciens fichiers
              restent dans Drive, mais ne s&apos;affichent plus ici ni chez les
              membres, et leurs liens directs cessent de fonctionner. Rien
              n&apos;est supprimé dans Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const folder = confirming;
                setConfirming(null);
                if (folder) void save(folder);
              }}
            >
              Changer de dossier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
