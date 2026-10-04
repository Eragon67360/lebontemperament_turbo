"use client";

import { PageShell } from "@/components/layouts/PageShell";
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
import { Button } from "@/components/ui/button";
import { ErrorState, ListSkeleton } from "@/components/ui/data-state";
import {
  RosterChangedError,
  useApplyRosterSync,
  useRosterReview,
  type ApplyResponse,
} from "@/hooks/useRosterSync";
import { cn } from "@/lib/utils";
import type { ApplyRequest } from "@/utils/roster/apply";
import RouteNames from "@/utils/routes";
import type { RosterReview } from "@repo/domain/roster/types";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AbsentMembersGroup,
  ChangedMembersGroup,
  NewMembersGroup,
  ToSettleGroup,
} from "./RosterSyncGroups";

const STEPS = ["Vérifier", "Choisir", "Appliquer"] as const;

const EMPTY_SET: ReadonlySet<string> = new Set();

interface Selection {
  /** The review this selection belongs to; a re-read starts from nothing. */
  fingerprint: string;
  invites: ReadonlySet<string>;
  updates: ReadonlySet<string>;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** « 3 invitations, 5 fiches mises à jour ». */
export function describeSelection(invites: number, updates: number): string {
  const parts: string[] = [];
  if (invites > 0) parts.push(plural(invites, "invitation", "invitations"));
  if (updates > 0) {
    parts.push(plural(updates, "fiche mise à jour", "fiches mises à jour"));
  }
  return parts.join(", ") || "aucune sélection";
}

export function RosterSyncReview() {
  const review = useRosterReview();
  const apply = useApplyRosterSync();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outcome, setOutcome] = useState<ApplyResponse | null>(null);

  const data = review.data;
  const fingerprint = data?.fingerprint;
  const current =
    selection && selection.fingerprint === fingerprint ? selection : null;
  const invites = current?.invites ?? EMPTY_SET;
  const updates = current?.updates ?? EMPTY_SET;

  const select = (next: Partial<Pick<Selection, "invites" | "updates">>) => {
    if (!fingerprint) return;
    setSelection({ fingerprint, invites, updates, ...next });
  };

  const hasErrors = (data?.validation.errors.length ?? 0) > 0;
  const step = !data || review.isError || hasErrors ? 0 : outcome ? 2 : 1;
  const busy = review.isFetching || apply.isPending;

  const reread = () => {
    setOutcome(null);
    setSelection(null);
    void review.refetch();
  };

  const handleApply = async () => {
    setConfirmOpen(false);
    if (!data) return;
    const request: ApplyRequest = {
      fingerprint: data.fingerprint,
      invite: [...invites],
      update: data.groups.modifies
        .filter((member) => updates.has(member.profileId))
        .map((member) => ({
          profileId: member.profileId,
          fields: member.changes.map((change) => change.field),
        })),
    };
    try {
      const response = await apply.mutateAsync(request);
      setSelection(null);
      setOutcome(response);
      if (response.summary.failed === 0) {
        toast.success(
          `Synchronisation appliquée : ${describeSelection(
            response.summary.invited,
            response.summary.updated,
          )}`,
        );
      } else {
        toast.warning(
          `${plural(response.summary.failed, "élément n'a", "éléments n'ont")} pas pu être appliqué${response.summary.failed > 1 ? "s" : ""}.`,
        );
      }
    } catch (error) {
      // A 409 already triggered a re-read; the stale selection is dropped.
      if (error instanceof RosterChangedError) setSelection(null);
      toast.error(
        error instanceof Error ? error.message : "L'application a échoué",
      );
    }
  };

  return (
    <PageShell
      theme="admin"
      className="px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8"
      title="Synchronisation de la liste des membres"
      description="Compare le tableau des membres avec les comptes du site. Rien n'est modifié tant que vous n'appliquez pas votre sélection."
      headerAction={
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="min-h-11 sm:h-9 sm:min-h-0"
          >
            <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
              <ArrowLeft aria-hidden />
              Utilisateurs
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:h-9 sm:min-h-0"
            onClick={reread}
            disabled={busy}
          >
            {review.isFetching ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <RefreshCw aria-hidden />
            )}
            Relire le tableau
          </Button>
        </div>
      }
    >
      <Stepper current={step} />

      {review.isLoading ? (
        <ListSkeleton rows={4} label="Lecture du tableau des membres…" />
      ) : review.isError ? (
        <ErrorState
          title="Le tableau n'a pas pu être lu"
          description={review.error.message}
          onRetry={reread}
        />
      ) : data ? (
        <>
          <ValidationPanel review={data} />
          {!hasErrors && outcome && (
            <ApplyOutcome outcome={outcome} onRestart={reread} />
          )}
          {!hasErrors && !outcome && (
            <>
              <p className="text-muted-foreground text-sm" aria-live="polite">
                {plural(data.rowCount, "ligne lue", "lignes lues")},{" "}
                {plural(data.unchanged, "compte inchangé", "comptes inchangés")}
                .
              </p>
              <div className="space-y-8">
                <NewMembersGroup
                  items={data.groups.nouveaux}
                  selected={invites}
                  onChange={(next) => select({ invites: next })}
                  disabled={busy}
                />
                <ChangedMembersGroup
                  items={data.groups.modifies}
                  selected={updates}
                  onChange={(next) => select({ updates: next })}
                  disabled={busy}
                />
                <ToSettleGroup items={data.groups.aRegler} />
                <AbsentMembersGroup items={data.groups.absents} />
              </div>
              <div className="bg-card sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 shadow-sm">
                <p className="text-sm" aria-live="polite">
                  Sélection :{" "}
                  <strong>
                    {describeSelection(invites.size, updates.size)}
                  </strong>
                </p>
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy || invites.size + updates.size === 0}
                >
                  {apply.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Check aria-hidden />
                  )}
                  Appliquer
                </Button>
              </div>
            </>
          )}
        </>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Appliquer la synchronisation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {describeSelection(invites.size, updates.size)}
              {invites.size > 0 &&
                ` : ${invites.size > 1 ? "les personnes cochées recevront" : "la personne cochée recevra"} un email d'invitation`}
              {updates.size > 0 &&
                `${invites.size > 0 ? " ;" : " :"} les champs cochés (nom, adresse postale, téléphone fixe, voix) seront remplacés par ceux du tableau`}
              . Aucun compte n&apos;est supprimé ni désactivé. Le tableau est
              relu au moment d&apos;appliquer : s&apos;il a changé depuis la
              vérification, rien n&apos;est fait et il faudra choisir à nouveau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply}>
              Appliquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Étapes de la synchronisation">
      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-sm",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                  done &&
                    "bg-primary-600 text-primary-foreground border-transparent",
                  active && "border-primary-600 text-primary-600",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="sr-only">
                {done
                  ? "Étape terminée : "
                  : active
                    ? "Étape en cours : "
                    : "Étape à venir : "}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ValidationPanel({ review }: { review: RosterReview }) {
  const { errors, warnings } = review.validation;
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>Le tableau ne peut pas être synchronisé</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {errors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
            <p className="mt-2">
              Corrigez le tableau, puis cliquez sur « Relire le tableau ».
            </p>
          </AlertDescription>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>
            {plural(warnings.length, "point à vérifier", "points à vérifier")}{" "}
            dans le tableau
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {warnings.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ApplyOutcome({
  outcome,
  onRestart,
}: {
  outcome: ApplyResponse;
  onRestart: () => void;
}) {
  const { results, summary } = outcome;
  const failed = results.filter((r) => r.status === "failed");
  const done = results.filter((r) => r.status === "done");

  return (
    <section aria-labelledby="roster-apply-result" className="space-y-4">
      <Alert variant={summary.failed > 0 ? "destructive" : "default"}>
        {summary.failed > 0 ? (
          <AlertTriangle className="h-4 w-4" aria-hidden />
        ) : (
          <Check className="h-4 w-4" aria-hidden />
        )}
        <AlertTitle id="roster-apply-result">
          {summary.failed > 0
            ? `${plural(summary.done, "élément appliqué", "éléments appliqués")}, ${plural(summary.failed, "échec", "échecs")}`
            : `Synchronisation appliquée : ${describeSelection(summary.invited, summary.updated)}`}
        </AlertTitle>
        <AlertDescription>
          Le détail de chaque élément est ci-dessous. Relisez le tableau pour
          vérifier le résultat ou continuer.
        </AlertDescription>
      </Alert>

      <ul className="divide-y rounded-md border text-sm">
        {[...failed, ...done].map((result) => (
          <li
            key={`${result.kind}-${result.id}`}
            className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2"
          >
            <span className="mt-0.5 shrink-0">
              {result.status === "done" ? (
                <>
                  <Check className="text-primary-600 h-4 w-4" aria-hidden />
                  <span className="sr-only">Fait :</span>
                </>
              ) : (
                <>
                  <AlertTriangle
                    className="text-destructive h-4 w-4"
                    aria-hidden
                  />
                  <span className="sr-only">Échec :</span>
                </>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words">
                {result.kind === "invite" ? "Invitation" : "Mise à jour"} —{" "}
                {result.label}
              </span>
              {result.status === "done" && result.fields && (
                <span className="text-muted-foreground block text-xs">
                  Champs : {result.fields.join(", ")}
                </span>
              )}
              {result.reason && (
                <span className="text-destructive block text-xs">
                  {result.reason}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={onRestart}
      >
        <RefreshCw aria-hidden />
        Relire le tableau
      </Button>
    </section>
  );
}
