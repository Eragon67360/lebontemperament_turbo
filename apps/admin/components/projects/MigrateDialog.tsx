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
import { Callout } from "@/components/ui/callout";
import { useMigrateProjects, type MigrationResult } from "@/hooks/useProjects";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * The one-off import of the former `projects.json` into the stories table
 * (existing addresses are skipped). Confirmed in an `AlertDialog`, never
 * `window.confirm`.
 */
export function MigrateDialog({
  open,
  onOpenChange,
  onResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (result: MigrationResult) => void;
}) {
  const migrate = useMigrateProjects();

  const run = async () => {
    try {
      const result = await migrate.mutateAsync();
      onResult(result);
      toast.success(
        `${result.migrated} histoire${result.migrated > 1 ? "s" : ""} importée${result.migrated > 1 ? "s" : ""}, ${result.skipped} déjà présente${result.skipped > 1 ? "s" : ""}`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error("L'import a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!migrate.isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Importer l&apos;ancien fichier ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les histoires du fichier historique du site (celles d&apos;avant
            l&apos;administration) sont ajoutées à la liste. Une histoire dont
            l&apos;adresse existe déjà est ignorée ; rien n&apos;est remplacé ni
            supprimé. Les histoires ajoutées peuvent ensuite être modifiées ou
            supprimées une par une.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={migrate.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void run();
            }}
            disabled={migrate.isPending}
            aria-busy={migrate.isPending || undefined}
          >
            {migrate.isPending && (
              <Loader2 className="animate-spin" aria-hidden />
            )}
            {migrate.isPending ? "Import en cours…" : "Importer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** What the last import did, shown under the page header. */
export function MigrationResultCallout({
  result,
  onDismiss,
}: {
  result: MigrationResult;
  onDismiss: () => void;
}) {
  const failed = result.errors && result.errors.length > 0;
  return (
    <Callout
      tone={failed ? "warning" : "success"}
      title={failed ? "Import terminé, avec des erreurs" : "Import terminé"}
      role="status"
      actions={
        <button
          type="button"
          className="text-primary-text min-h-10 rounded-sm text-[15px] font-medium underline-offset-[3px] hover:underline"
          onClick={onDismiss}
        >
          Masquer ce message
        </button>
      }
    >
      <p>
        {result.migrated} histoire{result.migrated > 1 ? "s" : ""} importée
        {result.migrated > 1 ? "s" : ""}, {result.skipped} déjà présente
        {result.skipped > 1 ? "s" : ""} (ignorée{result.skipped > 1 ? "s" : ""}
        ).
      </p>
      {failed && (
        <ul className="list-disc pl-5">
          {result.errors!.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </Callout>
  );
}
