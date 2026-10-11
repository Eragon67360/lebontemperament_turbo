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
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark } from "@/components/ui/label";
import { ProvenanceNote } from "@/components/ui/provenance-note";
import {
  useMailingListComparison,
  useMailingListException,
  useToggleMailingListComparison,
} from "@/hooks/useMailingListComparison";
import { readAtLabel } from "@/utils/google-groups/members";
import {
  addressesForClipboard,
  comparisonHeadline,
  withoutEmailNote,
} from "@/utils/mailing-list/labels";
import type { KeptAddress } from "@repo/domain/roster/mailingList";
import { ChevronRight, Clock, Copy, FileSpreadsheet } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

const HEADING_ID = "roster-comparison-heading";

/**
 * « Comparaison avec le tableau des membres »: for the selected Google Group,
 * who is in the roster but not on the list, and who is on the list but not
 * in the roster. Changes are made in Google Groups (no API can write a
 * @googlegroups.com group); this card says what to change and lets admins
 * keep a difference on purpose.
 */
export function RosterComparisonSection({
  groupEmail,
}: {
  groupEmail: string;
}) {
  const { data, error, isLoading, isFetching, refetch } =
    useMailingListComparison(groupEmail);
  const toggle = useToggleMailingListComparison(groupEmail);

  const setEnabled = (enabled: boolean) =>
    toggle.mutate(enabled, {
      onSuccess: () =>
        toast.success(
          enabled
            ? "Comparaison activée"
            : "Comparaison arrêtée pour ce groupe",
        ),
      onError: (e) => toast.error(e.message),
    });

  let body: ReactNode;
  if (isLoading) {
    body = (
      <Card>
        <ListSkeleton
          rows={3}
          className="p-4 sm:p-5"
          label="Comparaison en cours…"
        />
      </Card>
    );
  } else if (error) {
    body = error.notInstalled ? (
      <Callout title="Pas encore disponible">{error.message}</Callout>
    ) : (
      <Card>
        <ErrorState
          title="La comparaison n'a pas pu être chargée"
          description={error.message}
          onRetry={() => refetch()}
        />
      </Card>
    );
  } else if (!data?.enabled) {
    body = (
      <Card>
        <EmptyState
          icon={FileSpreadsheet}
          title="Comparer ce groupe au tableau des membres"
          description="Chaque semaine, l'admin compare les adresses du tableau des membres avec celles de ce groupe et prévient les superadmins quand il faut ajouter ou retirer quelqu'un."
          action={
            <Button
              onClick={() => setEnabled(true)}
              disabled={toggle.isPending}
            >
              Activer la comparaison
            </Button>
          }
        />
      </Card>
    );
  } else if (!data.ok) {
    body = (
      <Callout
        tone="danger"
        role="alert"
        title="La comparaison a échoué"
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Réessayer
          </Button>
        }
      >
        {data.error}
      </Callout>
    );
  } else {
    const { missing, extra, kept, rosterWithoutEmail } = data.comparison;
    const upToDate = missing.length === 0 && extra.length === 0;
    const note = withoutEmailNote(rosterWithoutEmail);
    body = (
      <div className="space-y-4">
        <Callout
          tone={upToDate ? "success" : "warning"}
          title={comparisonHeadline(missing.length, extra.length)}
        >
          <p>
            {upToDate
              ? "Toutes les personnes du tableau des membres sont dans le groupe, et le groupe ne contient personne d'autre."
              : "Le tableau des membres fait foi : faites ces changements dans Google Groups, puis actualisez cette page."}
          </p>
          {note && <p>{note}</p>}
        </Callout>

        {missing.length > 0 && (
          <AddressList
            id="roster-missing"
            title="À ajouter dans le groupe"
            description="Dans le tableau des membres, mais pas dans le groupe."
            emails={missing.map((m) => m.email)}
            keepLabel="Ne pas ajouter"
            keepTitle="Ne pas ajouter cette personne au groupe ?"
            keepDescription="Elle ne sera plus signalée comme manquante. Indiquez pourquoi, pour les autres admins."
            groupEmail={groupEmail}
            rows={missing.map((m) => ({
              email: m.email,
              primary: m.name || m.email,
              secondary: m.name ? m.email : null,
            }))}
          />
        )}

        {extra.length > 0 && (
          <AddressList
            id="roster-extra"
            title="À retirer du groupe"
            description="Dans le groupe, mais pas dans le tableau des membres (ancien membre, ou adresse changée)."
            emails={extra.map((e) => e.email)}
            keepLabel="Garder"
            keepTitle="Garder cette adresse dans le groupe ?"
            keepDescription="Pour une personne qui reçoit les messages sans être membre (chef de chœur, partenaire). Elle ne sera plus signalée."
            groupEmail={groupEmail}
            rows={extra.map((e) => ({
              email: e.email,
              primary: e.email,
              secondary: null,
            }))}
          />
        )}

        {kept.length > 0 && <KeptList kept={kept} groupEmail={groupEmail} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProvenanceNote icon={Clock}>
            Comparé le {readAtLabel(data.checkedAt)}. Vérification automatique
            chaque lundi
            {data.cronCheckedAt
              ? ` (dernière le ${readAtLabel(data.cronCheckedAt)})`
              : ""}
            .
          </ProvenanceNote>
          <StopComparisonButton
            disabled={toggle.isPending}
            onConfirm={() => setEnabled(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby={HEADING_ID} className="space-y-3">
      <h2 id={HEADING_ID} className="text-section">
        Comparaison avec le tableau des membres
      </h2>
      {body}
    </section>
  );
}

interface AddressRow {
  email: string;
  primary: string;
  secondary: string | null;
}

function AddressList({
  id,
  title,
  description,
  emails,
  rows,
  keepLabel,
  keepTitle,
  keepDescription,
  groupEmail,
}: {
  id: string;
  title: string;
  description: string;
  emails: string[];
  rows: AddressRow[];
  keepLabel: string;
  keepTitle: string;
  keepDescription: string;
  groupEmail: string;
}) {
  const [keeping, setKeeping] = useState<AddressRow | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addressesForClipboard(emails));
      toast.success(
        emails.length === 1 ? "Adresse copiée" : "Adresses copiées",
      );
    } catch {
      toast.error("La copie a échoué : sélectionnez les adresses à la main.");
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3
            id={id}
            className="flex items-center gap-2 text-base font-semibold"
          >
            {title}
            <Badge variant="secondary">{rows.length}</Badge>
          </h3>
          <p className="text-detail text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy aria-hidden />
          Copier les adresses
        </Button>
      </div>
      <ul aria-labelledby={id} className="divide-border divide-y">
        {rows.map((row) => (
          <li
            key={row.email}
            className="flex min-h-(--row-h) items-center gap-3 px-4 py-2 sm:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="text-detail text-foreground block truncate font-medium">
                {row.primary}
              </span>
              {row.secondary && (
                <span className="text-note text-muted-foreground block truncate">
                  {row.secondary}
                </span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setKeeping(row)}
              aria-label={`${keepLabel} : ${row.primary}`}
            >
              {keepLabel}
            </Button>
          </li>
        ))}
      </ul>
      <KeepDialog
        row={keeping}
        title={keepTitle}
        description={keepDescription}
        groupEmail={groupEmail}
        onClose={() => setKeeping(null)}
      />
    </Card>
  );
}

function KeepDialog({
  row,
  title,
  description,
  groupEmail,
  onClose,
}: {
  row: AddressRow | null;
  title: string;
  description: string;
  groupEmail: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const keep = useMailingListException(groupEmail);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!row) return;
    keep.mutate(
      { email: row.email, keep: true, note: note.trim() || null },
      {
        onSuccess: () => {
          toast.success("Ce sera gardé tel quel");
          setNote("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog
      open={row !== null}
      onOpenChange={(open) => {
        if (!open && !keep.isPending) {
          setNote("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form id="keep-address-form" onSubmit={submit} className="space-y-2">
          <p className="text-detail text-foreground font-medium break-all">
            {row?.email}
          </p>
          <Label htmlFor="keep-address-note">
            Pourquoi <OptionalMark />
          </Label>
          <Input
            id="keep-address-note"
            value={note}
            maxLength={200}
            placeholder="Par exemple : chef de chœur"
            onChange={(event) => setNote(event.target.value)}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={keep.isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="keep-address-form"
            disabled={keep.isPending}
          >
            Garder ainsi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeptList({
  kept,
  groupEmail,
}: {
  kept: KeptAddress[];
  groupEmail: string;
}) {
  const unkeep = useMailingListException(groupEmail);

  const stopKeeping = (email: string) =>
    unkeep.mutate(
      { email, keep: false },
      {
        onSuccess: () =>
          toast.success("Cette différence sera de nouveau signalée"),
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger className="group flex min-h-(--row-h) w-full items-center gap-2 px-4 text-left sm:px-5">
          <ChevronRight
            className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none"
            aria-hidden
          />
          <span className="text-base font-semibold">
            Différences gardées volontairement
          </span>
          <Badge variant="secondary">{kept.length}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="divide-border divide-y border-t">
            {kept.map((item) => (
              <li
                key={item.email}
                className="flex min-h-(--row-h) items-center gap-3 px-4 py-2 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="text-detail text-foreground block truncate font-medium">
                    {item.email}
                  </span>
                  <span className="text-note text-muted-foreground block truncate">
                    {item.side === "list"
                      ? "Gardée dans le groupe sans être dans le tableau"
                      : "Dans le tableau, volontairement absente du groupe"}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unkeep.isPending}
                  onClick={() => stopKeeping(item.email)}
                  aria-label={`Ne plus garder : ${item.email}`}
                >
                  Ne plus garder
                </Button>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function StopComparisonButton({
  disabled,
  onConfirm,
}: {
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Arrêter la comparaison
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Arrêter la comparaison de ce groupe ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              La vérification de chaque lundi et ses alertes s&apos;arrêtent
              pour ce groupe, et les différences gardées volontairement sont
              oubliées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              Arrêter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
