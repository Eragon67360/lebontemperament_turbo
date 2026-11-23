"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cn } from "@/lib/utils";
import { matchMembers, type MemberOption } from "@/utils/orders/members";
import {
  formatEuros,
  heldLine,
  type SellerTotal,
} from "@repo/domain/utils/orders";
import { Loader2, Plus, Search, Store, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";

export interface SellersSectionProps {
  /** One total per seller, listed sellers first (`sellerTotals`). */
  totals: readonly SellerTotal[];
  /** The sale's sellers (« Vendeurs »): the others are former or occasional. */
  listed: readonly string[];
  /** Display names by id. */
  names: Readonly<Record<string, string>>;
  /** Every member, for « Ajouter un vendeur ». */
  members: readonly MemberOption[];
  onAdd: (memberId: string) => Promise<void>;
  onRemove: (memberId: string, name: string) => void;
  /** « Voir ses acheteurs »: the buyers' tab, searched on this name. */
  onShowBuyers: (name: string) => void;
  /** The seller whose write is running. */
  busyId?: string | null;
}

/**
 * « Vendeurs »: who sells for this sale, and what each sold, collected and
 * still has to collect, with the cash and cheques they hold for the
 * treasurer. Orders « vendu par » someone no longer listed, and those sold
 * by nobody, get their own rows, so the column totals are the sale's.
 */
export function SellersSection({
  totals,
  listed,
  names,
  members,
  onAdd,
  onRemove,
  onShowBuyers,
  busyId,
}: SellersSectionProps) {
  const [adding, setAdding] = useState(false);
  const listedSet = useMemo(() => new Set(listed), [listed]);
  const nameOf = (id: string | null) =>
    id ? (names[id] ?? "Membre") : "Sans vendeur";

  const sum = (pick: (t: SellerTotal) => number) =>
    totals.reduce((s, t) => s + pick(t), 0);
  const allHeld = heldLine({
    heldCashCents: sum((t) => t.heldCashCents),
    heldChequeCents: sum((t) => t.heldChequeCents),
    heldChequeCount: sum((t) => t.heldChequeCount),
  });

  const actions = (t: SellerTotal) => {
    const name = nameOf(t.sellerId);
    return (
      <div className="flex items-center justify-end gap-1">
        {t.sellerId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onShowBuyers(name)}
            disabled={t.summary.orderCount === 0}
          >
            Voir ses acheteurs
            <span className="sr-only"> : {name}</span>
          </Button>
        )}
        {t.sellerId && listedSet.has(t.sellerId) && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-danger-foreground"
            onClick={() => onRemove(t.sellerId!, name)}
            disabled={busyId === t.sellerId}
          >
            <UserMinus aria-hidden />
            <span className="sr-only">Retirer {name} des vendeurs</span>
          </Button>
        )}
      </div>
    );
  };

  const who = (t: SellerTotal) => (
    <span className="min-w-0">
      <span
        className={cn(
          "block truncate font-medium",
          !t.sellerId && "text-muted-foreground font-normal",
        )}
      >
        {nameOf(t.sellerId)}
      </span>
      {t.sellerId && !listedSet.has(t.sellerId) && (
        <span className="text-note text-muted-foreground block">
          Ne vend plus pour cette vente
        </span>
      )}
    </span>
  );

  return (
    <section aria-labelledby="sellers-heading" className="space-y-0">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between lg:px-6 lg:pt-5">
        <div className="min-w-0 space-y-1">
          <h2
            id="sellers-heading"
            className="text-[17px] leading-6 font-semibold"
          >
            Vendeurs
            <span className="text-note text-muted-foreground ml-2 font-normal">
              {listed.length === 0
                ? "aucun"
                : listed.length === 1
                  ? "1 vendeur"
                  : `${listed.length} vendeurs`}
            </span>
          </h2>
          <p className="text-detail text-muted-foreground max-w-[64ch]">
            Chaque vendeur se connecte à l&apos;administration et note ses
            acheteurs et ses encaissements dans « Mes ventes ». Il ne voit que
            les siens, rien d&apos;autre de l&apos;administration.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => setAdding(true)}
        >
          <Plus aria-hidden />
          Ajouter un vendeur
        </Button>
      </div>

      <div className="border-border border-t">
        {totals.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Personne ne vend encore pour cette vente"
            description="Ajoutez les membres qui vendent : ils noteront eux-mêmes leurs acheteurs et leurs paiements."
            className="py-8"
          />
        ) : (
          <>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="pl-4 lg:pl-6">
                    Vendeur
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Acheteurs
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Vendu
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Encaissé
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Reste
                  </TableHead>
                  <TableHead scope="col">À remettre au trésorier</TableHead>
                  <TableHead scope="col" className="pr-4 lg:pr-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totals.map((t) => (
                  <TableRow key={t.sellerId ?? "none"}>
                    <TableCell className="max-w-56 py-2 pl-4 lg:pl-6">
                      {who(t)}
                    </TableCell>
                    <TableCell className="py-2 text-right tabular-nums">
                      {t.summary.orderCount}
                    </TableCell>
                    <TableCell className="py-2 text-right whitespace-nowrap tabular-nums">
                      {formatEuros(t.summary.totalCents)}
                    </TableCell>
                    <TableCell className="py-2 text-right whitespace-nowrap tabular-nums">
                      {formatEuros(t.summary.paidCents)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-2 text-right font-medium whitespace-nowrap tabular-nums",
                        t.summary.dueCents > 0 && "text-warning-foreground",
                      )}
                    >
                      {formatEuros(t.summary.dueCents)}
                    </TableCell>
                    <TableCell className="text-detail py-2">
                      {heldLine(t) ?? (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">Rien</span>
                        </>
                      )}
                    </TableCell>
                    <TableCell className="py-2 pr-4 lg:pr-6">
                      {actions(t)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-2 pl-4 font-semibold lg:pl-6">
                    Total
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold tabular-nums">
                    {sum((t) => t.summary.orderCount)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatEuros(sum((t) => t.summary.totalCents))}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatEuros(sum((t) => t.summary.paidCents))}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatEuros(sum((t) => t.summary.dueCents))}
                  </TableCell>
                  <TableCell className="text-detail py-2 font-semibold">
                    {allHeld ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 pr-4 lg:pr-6" />
                </TableRow>
              </TableFooter>
            </Table>

            <ul className="divide-border divide-y md:hidden">
              {totals.map((t) => (
                <li
                  key={t.sellerId ?? "none"}
                  className="flex flex-col gap-2 px-4 py-3"
                >
                  {who(t)}
                  <p className="text-detail tabular-nums">
                    {t.summary.orderCount}{" "}
                    {t.summary.orderCount > 1 ? "acheteurs" : "acheteur"}
                    {" · "}
                    {formatEuros(t.summary.totalCents)}
                    <span className="text-muted-foreground">
                      {" · encaissé "}
                      {formatEuros(t.summary.paidCents)}
                      {" · reste "}
                    </span>
                    <span className="font-medium">
                      {formatEuros(t.summary.dueCents)}
                    </span>
                  </p>
                  {heldLine(t) && (
                    <p className="text-note text-muted-foreground">
                      À remettre : {heldLine(t)}
                    </p>
                  )}
                  {actions(t)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <AddSellerDialog
        open={adding}
        onOpenChange={setAdding}
        members={members.filter((m) => !listedSet.has(m.id))}
        onAdd={onAdd}
      />
    </section>
  );
}

/** « Ajouter un vendeur »: a member found by name or e-mail. */
function AddSellerDialog({
  open,
  onOpenChange,
  members,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: readonly MemberOption[];
  onAdd: (memberId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useResetOnChange([open], () => {
    if (open) {
      setQuery("");
      setError(null);
    }
  });
  const matches = useMemo(
    () => matchMembers(members, query, 8),
    [members, query],
  );

  const pick = async (member: MemberOption) => {
    setPending(member.id);
    setError(null);
    try {
      await onAdd(member.id);
      onOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Le vendeur n'a pas été ajouté",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un vendeur</DialogTitle>
          <DialogDescription>
            Le membre pourra se connecter à l&apos;administration avec son
            compte habituel et noter ses acheteurs pour cette vente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="seller-search" className="sr-only">
              Nom ou e-mail du membre
            </label>
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
            />
            <Input
              id="seller-search"
              type="search"
              autoComplete="off"
              autoFocus
              placeholder="Nom ou e-mail du membre"
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-detail text-danger-foreground">
              {error}
            </p>
          )}
          {query.trim().length >= 2 && matches.length === 0 ? (
            <p className="text-detail text-muted-foreground">
              Aucun membre ne correspond.
            </p>
          ) : (
            <ul className="divide-border border-border divide-y rounded-md border empty:hidden">
              {matches.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => pick(member)}
                    disabled={pending !== null}
                    className="hover:bg-muted/60 focus-visible:outline-ring flex min-h-11 w-full items-center gap-3 px-3.5 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {member.name}
                      </span>
                      {member.email && (
                        <span className="text-note text-muted-foreground block truncate">
                          {member.email}
                        </span>
                      )}
                    </span>
                    {pending === member.id ? (
                      <Loader2
                        className="text-muted-foreground size-4 animate-spin motion-reduce:animate-none"
                        aria-hidden
                      />
                    ) : (
                      <Plus className="text-primary size-4" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
