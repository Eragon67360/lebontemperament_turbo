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
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  formatDayFr,
  lastSeenLabel,
  ROLE_LABELS,
  type Role,
} from "@/utils/members/list";
import {
  isAdminAccount,
  RECENT_SIGN_IN_DAYS,
  reviewDeletion,
  signedInRecently,
} from "@/utils/roster/deletionReview";
import type { AbsentMember } from "@repo/domain/roster/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

const DELETED = [
  "L’accès au site, à l’espace membres et à l’application (connexion, mot de passe, appareils des notifications).",
  "La fiche : nom, e-mail, adresse, téléphones, voix et photo.",
  "Ses notifications, ses signalements de problème et leurs conversations.",
];

const KEPT = [
  "Les contenus de l’association (concerts, vidéos, comptes rendus, fichiers) restent, sans nom d’auteur.",
  "Le tableau des membres n’est jamais modifié.",
  "Aucun e-mail n’est envoyé à ces personnes.",
];

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The ticked accounts, as the review lists them. */
  accounts: AbsentMember[];
  onConfirm: () => void;
  isPending?: boolean;
  /** Injected so renders are stable in tests. */
  now?: Date;
}

/**
 * The confirmation of a bulk deletion (« Absents de la liste »): names every
 * account, sets the administrators and the recent sign-ins apart, says what
 * goes and what stays, and keeps the confirm disabled until the reading is
 * acknowledged (one tick, plus one for each kind of risky account).
 */
export function BulkDeleteDialog({
  open,
  onOpenChange,
  accounts,
  onConfirm,
  isPending = false,
  now,
}: BulkDeleteDialogProps) {
  const [acknowledged, setAcknowledged] = useState({
    read: false,
    admins: false,
    recent: false,
  });
  // Each opening asks for the ticks again.
  useResetOnChange([open], () =>
    setAcknowledged({ read: false, admins: false, recent: false }),
  );

  const today = now ?? new Date();
  const review = reviewDeletion(accounts, today);
  const count = accounts.length;

  const needsAdmins = review.admins.length > 0;
  const needsRecent = review.recent.length > 0;
  const ready =
    acknowledged.read &&
    (!needsAdmins || acknowledged.admins) &&
    (!needsRecent || acknowledged.recent);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent className="sm:max-w-[680px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count > 1
              ? `Supprimer définitivement ces ${count} comptes ?`
              : "Supprimer définitivement ce compte ?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {plural(count, "compte", "comptes")} ne figur
                {count > 1 ? "ent" : "e"} plus dans le tableau des membres. La
                suppression est immédiate et <strong>irréversible</strong> : il
                n’y a pas de corbeille.
              </p>
              <p>
                Relisez la liste ci-dessous, nom par nom, avant de confirmer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {needsAdmins && (
          <Callout
            tone="danger"
            title={
              review.admins.length > 1
                ? `${review.admins.length} comptes d’administration sont sélectionnés`
                : "Un compte d’administration est sélectionné"
            }
          >
            <p>
              {review.admins.map((a) => a.displayName || a.email).join(", ")}{" "}
              {review.admins.length > 1
                ? "perdent leur accès"
                : "perd son accès"}{" "}
              à cette administration en même temps que{" "}
              {review.admins.length > 1 ? "leur compte" : "son compte"}.
            </p>
          </Callout>
        )}
        {needsRecent && (
          <Callout
            tone="warning"
            title={`${plural(review.recent.length, "personne s’est connectée", "personnes se sont connectées")} ces ${RECENT_SIGN_IN_DAYS} derniers jours`}
          >
            <p>
              {review.recent.length > 1
                ? "Elles utilisent peut-être encore le site ou l’application. Vérifiez qu’elles ont bien quitté l’association avant de continuer."
                : "Cette personne utilise peut-être encore le site ou l’application. Vérifiez qu’elle a bien quitté l’association avant de continuer."}
            </p>
          </Callout>
        )}

        <section aria-labelledby="bulk-delete-list" className="space-y-2">
          <h3 id="bulk-delete-list" className="text-[15px] font-semibold">
            Les {plural(count, "compte", "comptes")} à supprimer
            {review.neverSignedIn > 0 && (
              <span className="text-muted-foreground text-detail font-normal">
                {" "}
                · {review.neverSignedIn} ne{" "}
                {review.neverSignedIn > 1 ? "se sont" : "s’est"} jamais{" "}
                {review.neverSignedIn > 1 ? "connectés" : "connecté"}
              </span>
            )}
          </h3>
          <ul
            className="divide-border border-border max-h-72 divide-y overflow-y-auto rounded-md border"
            tabIndex={0}
            aria-labelledby="bulk-delete-list"
          >
            {review.accounts.map((account) => (
              <AccountLine
                key={account.profileId}
                account={account}
                now={today}
              />
            ))}
          </ul>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <ImpactList title="Ce qui est supprimé" items={DELETED} />
          <ImpactList title="Ce qui reste" items={KEPT} />
        </div>
        <p className="text-muted-foreground text-detail">
          Le tableau est relu au moment de supprimer : si un de ces comptes y
          figure de nouveau ou si le tableau a changé, rien n’est supprimé pour
          lui.
        </p>

        <div className="space-y-2">
          <Acknowledgement
            id="bulk-delete-read"
            checked={acknowledged.read}
            disabled={isPending}
            onChange={(read) => setAcknowledged((a) => ({ ...a, read }))}
          >
            J’ai relu la liste des {plural(count, "compte", "comptes")} et je
            veux les supprimer définitivement
          </Acknowledgement>
          {needsAdmins && (
            <Acknowledgement
              id="bulk-delete-admins"
              checked={acknowledged.admins}
              disabled={isPending}
              onChange={(admins) => setAcknowledged((a) => ({ ...a, admins }))}
            >
              Je confirme supprimer{" "}
              {plural(
                review.admins.length,
                "compte d’administration",
                "comptes d’administration",
              )}
            </Acknowledgement>
          )}
          {needsRecent && (
            <Acknowledgement
              id="bulk-delete-recent"
              checked={acknowledged.recent}
              disabled={isPending}
              onChange={(recent) => setAcknowledged((a) => ({ ...a, recent }))}
            >
              Je confirme supprimer{" "}
              {plural(
                review.recent.length,
                "compte utilisé récemment",
                "comptes utilisés récemment",
              )}
            </Acknowledgement>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!ready || isPending}
            aria-busy={isPending || undefined}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            {isPending
              ? "Suppression…"
              : count > 1
                ? `Supprimer les ${count} comptes`
                : "Supprimer le compte"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AccountLine({ account, now }: { account: AbsentMember; now: Date }) {
  const admin = isAdminAccount(account);
  const recent = signedInRecently(account, now);
  const created = formatDayFr(account.createdAt);
  return (
    <li className="space-y-1 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">
          {account.displayName || <em>sans nom</em>}
        </span>
        {admin && (
          <Badge variant="danger">
            {ROLE_LABELS[account.role as Role] ?? account.role}
          </Badge>
        )}
        {recent && <Badge variant="warning">Connecté récemment</Badge>}
        {account.status === "en attente" && (
          <Badge variant="outline">Invitation non acceptée</Badge>
        )}
      </div>
      <p className="text-muted-foreground break-all">{account.email}</p>
      <p className="text-muted-foreground text-note">
        Dernière connexion : {lastSeenLabel(account.lastSignInAt, now)}
        {created && ` · compte créé le ${created}`}
      </p>
    </li>
  );
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-border space-y-1.5 rounded-md border p-3">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <ul className="text-muted-foreground text-detail list-disc space-y-1 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Acknowledgement({
  id,
  checked,
  disabled,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="border-border bg-card flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
      />
      <span className="text-[15px] leading-5 font-medium">{children}</span>
    </label>
  );
}
