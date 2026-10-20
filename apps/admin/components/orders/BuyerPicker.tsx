"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { DeliverableBuyer } from "@/utils/orders/view";

export interface BuyerPickerProps {
  /** The buyers that can join the round (`deliverableBuyers`), by name. */
  buyers: readonly DeliverableBuyer[];
  /** The order ids ticked. */
  selected: ReadonlySet<string>;
  onSelectedChange: (selected: Set<string>) => void;
  disabled?: boolean;
}

/**
 * In « Ajouter à la tournée »: who joins this round. « Tous » ticks or
 * unticks every buyer (a minus when only some are); then one row per buyer,
 * name over address, so a round can take the buyers of one day and leave the
 * others for the next. The list scrolls past about six buyers.
 */
export function BuyerPicker({
  buyers,
  selected,
  onSelectedChange,
  disabled,
}: BuyerPickerProps) {
  const count = buyers.filter((b) => selected.has(b.orderId)).length;
  const all =
    count === 0 ? false : count === buyers.length ? true : "indeterminate";
  const toggle = (orderId: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(orderId);
    else next.delete(orderId);
    onSelectedChange(next);
  };

  return (
    <fieldset className="grid gap-2" aria-describedby="delivery-buyers-count">
      <legend className="mb-2 text-[15px] leading-5 font-medium">
        Acheteurs
      </legend>
      <div className="border-border bg-card overflow-hidden rounded-md border">
        <label
          htmlFor="delivery-buyers-all"
          className="border-border bg-surface-sunken flex min-h-11 cursor-pointer items-center gap-3 border-b px-3.5 py-2"
        >
          <Checkbox
            id="delivery-buyers-all"
            checked={all}
            onCheckedChange={() =>
              onSelectedChange(
                all === true
                  ? new Set()
                  : new Set(buyers.map((b) => b.orderId)),
              )
            }
            disabled={disabled}
          />
          <span className="text-detail font-medium">Tous</span>
          <span
            id="delivery-buyers-count"
            className="text-note text-muted-foreground ml-auto tabular-nums"
          >
            {count} sur {buyers.length}
          </span>
        </label>
        <ul className="divide-border max-h-52 divide-y overflow-y-auto sm:max-h-64">
          {buyers.map((buyer) => {
            const id = `delivery-buyer-${buyer.orderId}`;
            return (
              <li key={buyer.orderId}>
                <label
                  htmlFor={id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-3.5 py-2"
                >
                  <Checkbox
                    id={id}
                    checked={selected.has(buyer.orderId)}
                    onCheckedChange={(value) =>
                      toggle(buyer.orderId, value === true)
                    }
                    disabled={disabled}
                  />
                  <span className="min-w-0">
                    <span className="text-detail block truncate font-medium">
                      {buyer.name}
                    </span>
                    <span className="text-note text-muted-foreground block truncate">
                      {buyer.address}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </fieldset>
  );
}
