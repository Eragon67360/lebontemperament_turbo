"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { fieldLabel } from "@/utils/roster/apply";
import RouteNames from "@/utils/routes";
import type {
  AbsentMember,
  ChangedMember,
  NewMember,
  ToSettle,
  ToSettleKind,
} from "@repo/domain/roster/types";
import { ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

// --- A group with one checkbox per row and « tout sélectionner » -----------

interface SelectableGroupProps<T> {
  id: string;
  title: string;
  description: string;
  emptyText: string;
  items: T[];
  keyOf: (item: T) => string;
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  /** Most rows that may be selected at once; the rest stay unchecked. */
  max?: number;
  /** Shown when the group holds more rows than `max`. */
  maxNote?: string;
  renderItem: (item: T) => ReactNode;
}

function SelectableGroup<T>({
  id,
  title,
  description,
  emptyText,
  items,
  keyOf,
  selected,
  onChange,
  disabled,
  max,
  maxNote,
  renderItem,
}: SelectableGroupProps<T>) {
  const limit = max === undefined ? items.length : Math.min(max, items.length);
  const selectedCount = items.filter((i) => selected.has(keyOf(i))).length;
  const all = limit > 0 && selectedCount >= limit;
  const some = selectedCount > 0;
  const atCap = max !== undefined && selectedCount >= max;

  return (
    <section aria-labelledby={id} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </h2>
        {items.length > 0 && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={all ? true : some ? "indeterminate" : false}
              disabled={disabled}
              onCheckedChange={(value) =>
                onChange(
                  value === true
                    ? new Set(items.slice(0, limit).map(keyOf))
                    : new Set(),
                )
              }
            />
            Tout sélectionner
          </label>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
      {max !== undefined && items.length > max && maxNote && (
        <p className="text-sm font-medium" role="note">
          {maxNote}
        </p>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-sm">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => {
            const key = keyOf(item);
            const checked = selected.has(key);
            return (
              <li key={key}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 px-3 py-2 text-sm">
                  <Checkbox
                    className="mt-1"
                    checked={checked}
                    disabled={disabled || (!checked && atCap)}
                    onCheckedChange={(value) => {
                      const next = new Set(selected);
                      if (value === true) next.add(key);
                      else next.delete(key);
                      onChange(next);
                    }}
                  />
                  <span className="min-w-0 flex-1">{renderItem(item)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// --- Nouveaux ------------------------------------------------------------------

interface NewMembersProps {
  items: NewMember[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  max?: number;
  maxNote?: string;
}

export function NewMembersGroup(props: NewMembersProps) {
  return (
    <SelectableGroup
      id="roster-group-new"
      title="Nouveaux"
      description="Dans le tableau, sans compte sur le site. Les personnes cochées recevront une invitation par email."
      emptyText="Aucun nouveau membre : tout le monde a déjà un compte."
      keyOf={(item) => item.rowId}
      renderItem={(item) => (
        <>
          <span className="block font-medium">{item.displayName}</span>
          <span className="text-muted-foreground block break-all">
            {item.email}
          </span>
          {(item.voices.length > 0 || item.address || item.homePhone) && (
            <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {item.voices.map((voice) => (
                <Badge key={voice} variant="outline">
                  {voice}
                </Badge>
              ))}
              {item.address && <span>{item.address}</span>}
              {item.homePhone && <span>{item.homePhone}</span>}
            </span>
          )}
        </>
      )}
      {...props}
    />
  );
}

// --- Modifiés ------------------------------------------------------------------

interface ChangedMembersProps {
  items: ChangedMember[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}

export function ChangedMembersGroup(props: ChangedMembersProps) {
  return (
    <SelectableGroup
      id="roster-group-changed"
      title="Modifiés"
      description="Comptes dont le nom, l'adresse postale, le téléphone fixe ou la voix diffèrent du tableau. Le tableau fait foi pour ces champs ; le portable et la photo restent au membre."
      emptyText="Aucune fiche à mettre à jour."
      keyOf={(item) => item.profileId}
      renderItem={(item) => (
        <>
          <span className="block font-medium">{item.displayName}</span>
          <span className="text-muted-foreground block break-all">
            {item.email}
          </span>
          <dl className="mt-1 space-y-0.5">
            {item.changes.map((change) => (
              <div key={change.field} className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground capitalize">
                  {fieldLabel(change.field)}
                </dt>
                <dd className="min-w-0 break-words">
                  {change.from ? (
                    <span>{change.from}</span>
                  ) : (
                    <em className="text-muted-foreground">vide</em>
                  )}
                  <span aria-hidden> → </span>
                  <span className="sr-only"> devient </span>
                  <strong>{change.to}</strong>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {...props}
    />
  );
}

// --- À régler ------------------------------------------------------------------

const KIND_LABELS: Record<ToSettleKind, string> = {
  duplicate_email: "Email partagé",
  no_email: "Sans email",
  invalid_email: "Email invalide",
  no_name: "Sans nom",
  email_changed: "Peut-être la même personne",
};

export function ToSettleGroup({ items }: { items: ToSettle[] }) {
  return (
    <section aria-labelledby="roster-group-settle" className="space-y-2">
      <h2
        id="roster-group-settle"
        className="flex items-center gap-2 text-base font-semibold"
      >
        À régler
        <Badge variant="secondary">{items.length}</Badge>
      </h2>
      <p className="text-muted-foreground text-sm">
        Ces lignes demandent une correction dans le tableau avant de pouvoir
        être synchronisées. Rien n&apos;est appliqué pour elles.
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-sm">
          Rien à régler.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item, index) => (
            <li
              key={`${item.kind}-${index}`}
              className="space-y-1 px-3 py-2 text-sm"
            >
              <Badge variant="outline">{KIND_LABELS[item.kind]}</Badge>
              <p>{item.message}</p>
              <ul className="text-muted-foreground list-disc pl-5">
                {item.rows.map((row) => (
                  <li key={row.rowId} className="break-all">
                    {row.name || <em>sans nom</em>}
                    {row.email && ` — ${row.email}`}
                  </li>
                ))}
                {item.profile && (
                  <li className="break-all">
                    Compte existant : {item.profile.displayName} —{" "}
                    {item.profile.email} ({item.profile.status})
                  </li>
                )}
              </ul>
              {item.kind === "email_changed" && item.profile && (
                <Button asChild variant="link" className="h-auto min-h-11 px-0">
                  <Link
                    href={RouteNames.DASHBOARD.ADMIN.USER(
                      item.profile.profileId,
                    )}
                  >
                    Ouvrir la fiche de {item.profile.displayName} pour changer
                    son e-mail
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Absents de la liste ---------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  admin: "administrateur",
  superadmin: "super administrateur",
};

export function AbsentMembersGroup({ items }: { items: AbsentMember[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section aria-labelledby="roster-group-absent" className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-11 w-full justify-start gap-2 px-2"
          >
            <ChevronRight
              aria-hidden
              className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
            />
            <span
              id="roster-group-absent"
              className="flex items-center gap-2 text-base font-semibold"
            >
              Absents de la liste
              <Badge variant="secondary">{items.length}</Badge>
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          <Alert>
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Pour information</AlertTitle>
            <AlertDescription>
              Comptes du site dont l&apos;email n&apos;apparaît plus dans le
              tableau, quel que soit leur statut. La désactivation arrive
              bientôt ; pour supprimer un compte, ouvrez-le depuis la page des
              utilisateurs.
            </AlertDescription>
          </Alert>
          {items.length === 0 ? (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-sm">
              Tous les comptes figurent dans le tableau.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {items.map((item) => (
                <li
                  key={item.profileId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {item.displayName || <em>sans nom</em>}
                    </span>
                    <span className="text-muted-foreground block break-all">
                      {item.email}
                    </span>
                  </span>
                  {ROLE_LABELS[item.role] && (
                    <Badge variant="outline">{ROLE_LABELS[item.role]}</Badge>
                  )}
                  <Badge
                    variant={
                      item.status === "approuvé" ? "secondary" : "outline"
                    }
                  >
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="link" className="h-auto min-h-11 px-0">
            <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
              Ouvrir la page des utilisateurs
            </Link>
          </Button>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
