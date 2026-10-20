"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BALANCE_TONES,
  type BuyerRow,
  canJoinRound,
  fulfilmentLabel,
} from "@/utils/orders/view";
import { BALANCE_LABELS, formatEuros } from "@repo/domain/utils/orders";
import { Banknote, PackageCheck, Pencil, Truck, Undo2 } from "lucide-react";

export interface BuyersListProps {
  rows: BuyerRow[];
  onEdit: (row: BuyerRow) => void;
  onPay: (row: BuyerRow) => void;
  onHandOver: (row: BuyerRow, handedOver: boolean) => void;
  /** « Ajouter à la tournée… » for this buyer alone; offered when `canJoinRound`. */
  onAddToRound?: (row: BuyerRow) => void;
  onDelete: (row: BuyerRow) => void;
  /** The id of the order whose write is running: its row waits. */
  busyOrderId?: string | null;
}

/**
 * « Acheteurs »: a table from `md` (name, mode, vendu par, total, payé,
 * reste, state and chips, actions), stacked rows on phones. « Modifier »
 * stays visible; payments, « Ajouter à la tournée… » (a buyer to be
 * delivered, with an address and no stop yet), « Remis » and deletion are in
 * the row's menu.
 */
export function BuyersList({
  rows,
  onEdit,
  onPay,
  onHandOver,
  onAddToRound,
  onDelete,
  busyOrderId,
}: BuyersListProps) {
  const actions = (row: BuyerRow) => {
    const busy = busyOrderId === row.orderId;
    return (
      <div className="ml-auto flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(row)}
          disabled={busy}
        >
          <Pencil aria-hidden />
          Modifier
          <span className="sr-only"> la commande de « {row.buyerName} »</span>
        </Button>
        <RowActionsMenu
          name={row.buyerName}
          subject={`la commande de « ${row.buyerName} »`}
          onDelete={() => onDelete(row)}
          disabled={busy}
        >
          <DropdownMenuItem onSelect={() => setTimeout(() => onPay(row), 0)}>
            <Banknote aria-hidden />
            Enregistrer un paiement…
          </DropdownMenuItem>
          {onAddToRound && canJoinRound(row.order) && (
            <DropdownMenuItem
              onSelect={() => setTimeout(() => onAddToRound(row), 0)}
            >
              <Truck aria-hidden />
              Ajouter à la tournée…
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => onHandOver(row, !row.handedOver)}>
            {row.handedOver ? (
              <>
                <Undo2 aria-hidden />
                Annuler la remise
              </>
            ) : (
              <>
                <PackageCheck aria-hidden />
                Marquer comme remis
              </>
            )}
          </DropdownMenuItem>
        </RowActionsMenu>
      </div>
    );
  };

  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pl-4 lg:pl-6">
              Acheteur
            </TableHead>
            <TableHead scope="col">Mode</TableHead>
            <TableHead scope="col" className="hidden lg:table-cell">
              Vendu par
            </TableHead>
            <TableHead scope="col" className="text-right">
              Total
            </TableHead>
            <TableHead scope="col" className="text-right">
              Payé
            </TableHead>
            <TableHead scope="col" className="text-right">
              Reste
            </TableHead>
            <TableHead scope="col">État</TableHead>
            <TableHead scope="col" className="w-40 pr-4 lg:pr-6">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.orderId}>
              <TableCell className="max-w-64 py-2 pl-4 lg:pl-6">
                <span className="block truncate font-medium">
                  {row.buyerName}
                </span>
                {row.order.buyer_phone && (
                  <span className="text-note text-muted-foreground block truncate">
                    {row.order.buyer_phone}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-2 whitespace-nowrap">
                {fulfilmentLabel(row.fulfilment)}
              </TableCell>
              <TableCell className="text-muted-foreground hidden max-w-40 py-2 lg:table-cell">
                <span className="block truncate">
                  {row.soldBy ?? (
                    <>
                      <span aria-hidden>—</span>
                      <span className="sr-only">Personne</span>
                    </>
                  )}
                </span>
              </TableCell>
              <TableCell className="py-2 text-right whitespace-nowrap tabular-nums">
                {formatEuros(row.totalCents)}
              </TableCell>
              <TableCell className="py-2 text-right whitespace-nowrap tabular-nums">
                {formatEuros(row.paidCents)}
              </TableCell>
              <TableCell className="py-2 text-right font-medium whitespace-nowrap tabular-nums">
                {formatEuros(Math.max(row.dueCents, 0))}
              </TableCell>
              <TableCell className="py-2">
                <Chips row={row} />
              </TableCell>
              <TableCell className="py-2 pr-4 lg:pr-6">
                {actions(row)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="divide-border divide-y md:hidden">
        {rows.map((row) => (
          <li key={row.orderId} className="flex flex-col gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.buyerName}</p>
              <p className="text-note text-muted-foreground truncate">
                {[fulfilmentLabel(row.fulfilment), row.soldBy]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-detail tabular-nums">
                {formatEuros(row.totalCents)}
                <span className="text-muted-foreground">
                  {" · payé "}
                  {formatEuros(row.paidCents)}
                  {" · reste "}
                </span>
                <span className="font-medium">
                  {formatEuros(Math.max(row.dueCents, 0))}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chips row={row} />
              {actions(row)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The state in one word, then « Dans la tournée » and « Remis » when true. */
function Chips({ row }: { row: BuyerRow }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={BALANCE_TONES[row.status]}>
        {BALANCE_LABELS[row.status]}
      </StatusBadge>
      {row.inRound && (
        <StatusBadge tone="accent" dot={false}>
          Dans la tournée
        </StatusBadge>
      )}
      {row.handedOver && (
        <StatusBadge tone="neutral" dot={false}>
          Remis
        </StatusBadge>
      )}
    </div>
  );
}
