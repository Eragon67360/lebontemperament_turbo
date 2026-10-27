"use client";

import { PageShell } from "@/components/layouts/PageShell";
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
import { Callout } from "@/components/ui/callout";
import { ErrorState, ListSkeleton } from "@/components/ui/data-state";
import { Stepper, type Step } from "@/components/ui/stepper";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  RosterChangedError,
  useApplyRosterSync,
  useDeleteAbsentAccounts,
  useRosterReview,
  type ApplyResponse,
  type BulkDeleteResponse,
} from "@/hooks/useRosterSync";
import { MAX_APPLY_INVITES, type ApplyRequest } from "@/utils/roster/apply";
import { MAX_BULK_DELETIONS } from "@/utils/roster/bulkDelete";
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
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import {
  AbsentMembersGroup,
  ChangedMembersGroup,
  NewMembersGroup,
  ToSettleGroup,
} from "./RosterSyncGroups";

const STEPS: Step[] = [
  { label: "Vérifier" },
  { label: "Choisir" },
  { label: "Appliquer" },
];

const EMPTY_SET: ReadonlySet<string> = new Set();

interface Selection {
  /** The review this selection belongs to; a re-read starts from nothing. */
  fingerprint: string;
  invites: ReadonlySet<string>;
  updates: ReadonlySet<string>;
  /** Accounts ticked under « Absents de la liste » for deletion. */
  deletions: ReadonlySet<string>;
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
  const deleteAccounts = useDeleteAbsentAccounts();
  const { data: currentUser } = useCurrentUser();
  const { data: currentProfile } = useCurrentProfile();
  // Deleting an account is for superadmins (the server checks it again).
  const canDelete = currentProfile?.role === "superadmin";
  const [selection, setSelection] = useState<Selection | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outcome, setOutcome] = useState<ApplyResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOutcome, setDeleteOutcome] = useState<BulkDeleteResponse | null>(
    null,
  );

  const data = review.data;
  const fingerprint = data?.fingerprint;
  const current =
    selection && selection.fingerprint === fingerprint ? selection : null;
  const invites = current?.invites ?? EMPTY_SET;
  const updates = current?.updates ?? EMPTY_SET;
  // Only accounts the review still lists as absent can stay ticked.
  const absents = data?.groups.absents ?? [];
  const deletions = new Set(
    absents
      .map((account) => account.profileId)
      .filter((id) => current?.deletions.has(id)),
  );
  const accountsToDelete = absents.filter((account) =>
    deletions.has(account.profileId),
  );

  const select = (
    next: Partial<Pick<Selection, "invites" | "updates" | "deletions">>,
  ) => {
    if (!fingerprint) return;
    setSelection({ fingerprint, invites, updates, deletions, ...next });
  };
  // At most 100 invitations per apply (the server refuses more): keep the
  // first ones in the group's order.
  const selectInvites = (next: Set<string>) => {
    if (!data) return;
    const capped = data.groups.nouveaux
      .map((member) => member.rowId)
      .filter((rowId) => next.has(rowId))
      .slice(0, MAX_APPLY_INVITES);
    select({ invites: new Set(capped) });
  };

  const hasErrors = (data?.validation.errors.length ?? 0) > 0;
  const step = !data || review.isError || hasErrors ? 0 : outcome ? 2 : 1;
  const busy = review.isFetching || apply.isPending || deleteAccounts.isPending;

  const reread = () => {
    setOutcome(null);
    setDeleteOutcome(null);
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

  const handleDelete = async () => {
    if (!data) return;
    try {
      const response = await deleteAccounts.mutateAsync({
        fingerprint: data.fingerprint,
        ids: accountsToDelete.map((account) => account.profileId),
      });
      setDeleteOpen(false);
      select({ deletions: new Set() });
      setDeleteOutcome(response);
      if (response.summary.failed === 0) {
        toast.success(
          `${plural(response.summary.done, "compte supprimé", "comptes supprimés")}.`,
        );
      } else {
        toast.warning(
          `${plural(response.summary.done, "compte supprimé", "comptes supprimés")}, ${plural(response.summary.failed, "échec", "échecs")}.`,
        );
      }
    } catch (error) {
      setDeleteOpen(false);
      // A 409 already triggered a re-read; the stale selection is dropped.
      if (error instanceof RosterChangedError) setSelection(null);
      toast.error(
        error instanceof Error ? error.message : "La suppression a échoué",
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
      <Stepper
        aria-label="Étapes de la synchronisation"
        steps={STEPS}
        current={step}
      />

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
                  onChange={selectInvites}
                  disabled={busy}
                  max={MAX_APPLY_INVITES}
                  maxNote={`${MAX_APPLY_INVITES} invitations maximum par envoi : appliquez, puis recommencez.`}
                />
                <ChangedMembersGroup
                  items={data.groups.modifies}
                  selected={updates}
                  onChange={(next) => select({ updates: next })}
                  disabled={busy}
                />
                <ToSettleGroup items={data.groups.aRegler} />
                {deleteOutcome && (
                  <DeleteOutcome
                    outcome={deleteOutcome}
                    onDismiss={() => setDeleteOutcome(null)}
                  />
                )}
                <AbsentMembersGroup
                  items={data.groups.absents}
                  deletion={
                    canDelete
                      ? {
                          selected: deletions,
                          onChange: (next) => select({ deletions: next }),
                          onDelete: () => setDeleteOpen(true),
                          currentUserId: currentUser?.id,
                          disabled: busy,
                          max: MAX_BULK_DELETIONS,
                        }
                      : undefined
                  }
                />
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
      <BulkDeleteDialog
        open={deleteOpen && accountsToDelete.length > 0}
        onOpenChange={setDeleteOpen}
        accounts={accountsToDelete}
        onConfirm={handleDelete}
        isPending={deleteAccounts.isPending}
      />
    </PageShell>
  );
}

function ValidationPanel({ review }: { review: RosterReview }) {
  const { errors, warnings } = review.validation;
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* A failure (nothing can be applied): announced when it appears. */}
      {errors.length > 0 && (
        <Callout
          tone="danger"
          role="alert"
          title="Le tableau ne peut pas être synchronisé"
        >
          <ul className="list-disc pl-5">
            {errors.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}</li>
            ))}
          </ul>
          <p className="mt-2">
            Corrigez le tableau, puis cliquez sur « Relire le tableau ».
          </p>
        </Callout>
      )}
      {warnings.length > 0 && (
        <Callout
          tone="warning"
          title={`${plural(warnings.length, "point à vérifier", "points à vérifier")} dans le tableau`}
        >
          <ul className="list-disc pl-5">
            {warnings.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </Callout>
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
      {/* Announced only when something failed; a success is already toasted. */}
      <Callout
        tone={summary.failed > 0 ? "danger" : "success"}
        role={summary.failed > 0 ? "alert" : undefined}
        title={
          <span id="roster-apply-result">
            {summary.failed > 0
              ? `${plural(summary.done, "élément appliqué", "éléments appliqués")}, ${plural(summary.failed, "échec", "échecs")}`
              : `Synchronisation appliquée : ${describeSelection(summary.invited, summary.updated)}`}
          </span>
        }
      >
        <p>
          Le détail de chaque élément est ci-dessous. Relisez le tableau pour
          vérifier le résultat ou continuer.
        </p>
      </Callout>

      <ul className="divide-y rounded-md border text-sm">
        {[...failed, ...done].map((result) => (
          <li
            key={`${result.kind}-${result.id}`}
            className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2"
          >
            <span className="mt-0.5 shrink-0">
              {result.status === "done" ? (
                <>
                  <Check className="text-primary h-4 w-4" aria-hidden />
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
              {result.warning && (
                <span className="block text-xs">
                  Attention : {result.warning}
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

function DeleteOutcome({
  outcome,
  onDismiss,
}: {
  outcome: BulkDeleteResponse;
  onDismiss: () => void;
}) {
  const { results, summary } = outcome;
  const failed = results.filter((r) => r.status === "failed");
  const done = results.filter((r) => r.status === "done");

  return (
    <section aria-labelledby="roster-delete-result" className="space-y-3">
      {/* Announced only when something failed; a success is already toasted. */}
      <Callout
        tone={summary.failed > 0 ? "danger" : "success"}
        role={summary.failed > 0 ? "alert" : undefined}
        title={
          <span id="roster-delete-result">
            {summary.failed > 0
              ? `${plural(summary.done, "compte supprimé", "comptes supprimés")}, ${plural(summary.failed, "échec", "échecs")}`
              : `${plural(summary.done, "compte supprimé", "comptes supprimés")}`}
          </span>
        }
      >
        <p>
          Le détail de chaque compte est ci-dessous. Les comptes en échec sont
          conservés.
        </p>
      </Callout>
      <ul className="divide-y rounded-md border text-sm">
        {[...failed, ...done].map((result) => (
          <li
            key={result.id}
            className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2"
          >
            <span className="mt-0.5 shrink-0">
              {result.status === "done" ? (
                <>
                  <Check className="text-primary h-4 w-4" aria-hidden />
                  <span className="sr-only">Supprimé :</span>
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
              <span className="block break-words">{result.label}</span>
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
        onClick={onDismiss}
      >
        Fermer ce résumé
      </Button>
    </section>
  );
}
