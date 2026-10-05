"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState, ListSkeleton } from "@/components/ui/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDriveFolders } from "@/hooks/useDriveFolders";
import { useDriveSyncRuns, useRunDriveSync } from "@/hooks/useDriveSync";
import {
  DIFF_GROUPS,
  describeCounts,
  describeRun,
  formatRunDate,
  hasChanges,
  modeLabel,
  triggerLabel,
  type DriveSyncDiffEntry,
  type DriveSyncDiffGroup,
  type DriveSyncResult,
} from "@/utils/driveSync";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

const GROUP_LIMIT = 50;

type DriveSyncState = {
  runSync: ReturnType<typeof useRunDriveSync>;
  preview: DriveSyncResult | null;
  applied: DriveSyncResult | null;
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
  check: () => Promise<void>;
  apply: () => Promise<void>;
};

const DriveSyncContext = createContext<DriveSyncState | null>(null);

function useDriveSyncState(): DriveSyncState {
  const state = useContext(DriveSyncContext);
  if (!state) {
    throw new Error(
      "DriveSyncButton and DriveSyncSection need DriveSyncProvider",
    );
  }
  return state;
}

/**
 * Holds the review-then-apply state so the page header's primary button
 * (« Synchroniser depuis Drive », the dry run) and the section below it
 * (the diff, « Appliquer ces changements », the runs) share one flow.
 */
export function DriveSyncProvider({ children }: { children: ReactNode }) {
  const runSync = useRunDriveSync();
  const [preview, setPreview] = useState<DriveSyncResult | null>(null);
  const [applied, setApplied] = useState<DriveSyncResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const check = async () => {
    setApplied(null);
    try {
      const result = await runSync.mutateAsync("dry_run");
      setPreview(result);
    } catch (error) {
      setPreview(null);
      toast.error(
        error instanceof Error ? error.message : "La vérification a échoué",
      );
    }
  };

  const apply = async () => {
    setConfirmOpen(false);
    try {
      const result = await runSync.mutateAsync("apply");
      setPreview(null);
      setApplied(result);
      toast.success(
        `Index Drive mis à jour : ${describeCounts(result.counts)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "L'application a échoué",
      );
    }
  };

  return (
    <DriveSyncContext.Provider
      value={{
        runSync,
        preview,
        applied,
        confirmOpen,
        setConfirmOpen,
        check,
        apply,
      }}
    >
      {children}
    </DriveSyncContext.Provider>
  );
}

/** True while a reviewed diff waits to be applied: « Appliquer » is then the primary. */
const awaitingApply = (preview: DriveSyncResult | null) =>
  !!preview && hasChanges(preview.counts);

/**
 * The page's primary action: a dry run that lists what changed in Drive.
 * Once changes wait to be applied, it steps back to an outlined « Vérifier
 * à nouveau » so « Appliquer ces changements » is the one filled button.
 */
export function DriveSyncButton() {
  const { runSync, preview, check } = useDriveSyncState();
  const isChecking = runSync.isPending && runSync.variables === "dry_run";
  const secondary = awaitingApply(preview);

  return (
    <Button
      type="button"
      variant={secondary ? "outline" : "default"}
      onClick={check}
      disabled={runSync.isPending}
      aria-busy={isChecking || undefined}
    >
      {isChecking ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <RefreshCw aria-hidden />
      )}
      {preview ? "Vérifier à nouveau" : "Synchroniser depuis Drive"}
    </Button>
  );
}

/**
 * The sync's state and review: when the index was last updated, the diff of
 * the last check with « Appliquer ces changements », and the recent runs.
 */
export function DriveSyncSection({
  status,
}: {
  /** The index's freshness line, from GET /api/drive-index (the page owns that query). */
  status?: ReactNode;
}) {
  const { runSync, preview, applied, confirmOpen, setConfirmOpen, apply } =
    useDriveSyncState();

  const isChecking = runSync.isPending && runSync.variables === "dry_run";
  const isApplying = runSync.isPending && runSync.variables === "apply";

  return (
    <section
      aria-labelledby="drive-sync-heading"
      className="border-border bg-card space-y-5 rounded-lg border p-4 shadow-sm sm:p-6"
    >
      <div className="space-y-1">
        <h2
          id="drive-sync-heading"
          className="text-[17px] leading-6 font-semibold"
        >
          Synchronisation avec Drive
        </h2>
        <p className="text-detail text-muted-foreground">
          « Synchroniser depuis Drive » montre d&apos;abord ce qui a changé ;
          rien n&apos;est modifié tant que vous n&apos;appliquez pas. Une
          synchronisation automatique a lieu chaque nuit vers 3 h 30.
        </p>
      </div>

      {status}

      {isChecking && (
        <ListSkeleton rows={3} label="Lecture des dossiers Drive…" />
      )}

      {preview && !isChecking && <DiffView result={preview} />}

      {awaitingApply(preview) && (
        <div>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={runSync.isPending}
            aria-busy={isApplying || undefined}
          >
            {isApplying ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Check aria-hidden />
            )}
            Appliquer ces changements
          </Button>
        </div>
      )}

      {applied && (
        <Alert>
          <Check className="h-4 w-4" aria-hidden />
          <AlertTitle>Changements appliqués</AlertTitle>
          <AlertDescription>
            {describeCounts(applied.counts)}
            {applied.diff.unreadable_roots.length > 0 &&
              ` — ${applied.diff.unreadable_roots.length} dossier(s) illisible(s) laissé(s) tel(s) quel(s).`}
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Appliquer les changements ?</AlertDialogTitle>
            <AlertDialogDescription>
              {preview
                ? `L'index du site sera mis à jour : ${describeCounts(preview.counts)}. Les éléments retirés restent en mémoire et reviennent s'ils réapparaissent dans Drive. Les dossiers Drive eux-mêmes ne sont jamais modifiés. Le Drive est relu au moment d'appliquer : si quelque chose a changé depuis la vérification, le résultat l'indiquera.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={apply}>Appliquer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <details className="group">
        <summary className="text-primary-text hover:bg-accent -mx-2 flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md px-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden
          />
          Historique des synchronisations
        </summary>
        <div className="pt-3">
          <RecentRuns />
        </div>
      </details>
    </section>
  );
}

function DiffView({ result }: { result: DriveSyncResult }) {
  const { data: folders } = useDriveFolders();
  const labelOf = (slug: string) =>
    folders?.find((f) => f.slug === slug)?.label ?? slug;
  const changes = hasChanges(result.counts);

  return (
    <div className="space-y-4" aria-live="polite">
      <p className="text-sm">
        {changes ? (
          <>
            Changements trouvés :{" "}
            <strong>{describeCounts(result.counts)}</strong>
            {result.counts.unchanged > 0 &&
              ` (${result.counts.unchanged} inchangés).`}
          </>
        ) : (
          <>Aucun changement : l&apos;index est à jour.</>
        )}
      </p>

      {result.diff.unreadable_roots.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>Dossiers illisibles</AlertTitle>
          <AlertDescription>
            <p>
              Le site ne peut pas lire ces dossiers. Partagez chacun d&apos;eux
              avec le compte de service{" "}
              <code className="font-mono text-xs">
                {result.service_account}
              </code>{" "}
              (accès « Lecteur »), puis vérifiez à nouveau. En attendant, leur
              contenu déjà indexé est conservé tel quel.
            </p>
            <ul className="mt-2 list-disc pl-5">
              {result.diff.unreadable_roots.map((root) => (
                <li key={root.slug}>
                  <strong>{labelOf(root.slug)}</strong>
                  <span className="text-muted-foreground">
                    {" "}
                    — {root.reason}
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {DIFF_GROUPS.map(({ key, label }) => (
        <DiffGroup
          key={key}
          group={key}
          label={label}
          entries={result.diff[key]}
          total={result.counts[key]}
        />
      ))}
    </div>
  );
}

function DiffGroup({
  group,
  label,
  entries,
  total,
}: {
  group: DriveSyncDiffGroup;
  label: string;
  entries: DriveSyncDiffEntry[];
  total: number;
}) {
  if (total === 0) return null;
  const shown = entries.slice(0, GROUP_LIMIT);
  const hidden = total - shown.length;

  return (
    <section aria-labelledby={`drive-diff-${group}`}>
      <h3
        id={`drive-diff-${group}`}
        className="mb-2 flex items-center gap-2 text-sm font-medium"
      >
        {label}
        <Badge variant={group === "removed" ? "destructive" : "secondary"}>
          {total}
        </Badge>
      </h3>
      <ul className="divide-y rounded-md border text-sm">
        {shown.map((entry, index) => (
          <li
            key={`${group}-${index}`}
            className="flex flex-col gap-0.5 px-3 py-2"
          >
            <span className="break-words">
              {entry.kind === "folder" ? "Dossier" : "Fichier"} :{" "}
              <span className="font-medium">{entry.path}</span>
            </span>
            {entry.previous_path && entry.previous_path !== entry.path && (
              <span className="text-muted-foreground text-xs break-words">
                Avant : {entry.previous_path}
              </span>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="text-muted-foreground mt-1 text-xs">
          … et {hidden} autre{hidden > 1 ? "s" : ""}.
        </p>
      )}
    </section>
  );
}

function RecentRuns() {
  const { data: runs, isLoading, isError, refetch } = useDriveSyncRuns();

  return (
    <section aria-labelledby="drive-sync-runs" className="space-y-2">
      <h3 id="drive-sync-runs" className="sr-only">
        Dernières synchronisations
      </h3>
      {isError ? (
        <ErrorState
          description="Les dernières synchronisations n'ont pas pu être chargées."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <ListSkeleton rows={3} label="Chargement des synchronisations…" />
      ) : !runs?.length ? (
        <p className="text-muted-foreground text-sm">
          Aucune synchronisation pour l&apos;instant.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Déclencheur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Résultat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatRunDate(run.started_at)}
                  </TableCell>
                  <TableCell>{triggerLabel(run.trigger)}</TableCell>
                  <TableCell>{modeLabel(run.mode)}</TableCell>
                  <TableCell>
                    {run.status === "error" ? (
                      <span className="text-destructive">
                        {describeRun(run)}
                      </span>
                    ) : (
                      describeRun(run)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
