"use client";

import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  isOldRound,
  offersNewRound,
  oldRoundWarning,
  roundLine,
} from "@/utils/orders/round";
import type { DriverRound } from "@/utils/orders/types";

export interface RoundChoiceProps {
  /** The driver's current round: null when they have none, undefined when it could not be read. */
  round: DriverRound | null | undefined;
  /** Injected so renders are stable in tests. */
  now: Date;
  /** « Nouvelle tournée » is ticked. */
  newRound: boolean;
  onNewRoundChange: (newRound: boolean) => void;
  disabled?: boolean;
}

/**
 * Under the « Livreur » select of « Ajouter à la tournée »: which round the
 * buyers join, a warning when that round looks forgotten (until the box is
 * ticked) and, when it has stops, the box that opens a new round instead (the
 * old one stays in the app).
 */
export function RoundChoice({
  round,
  now,
  newRound,
  onNewRoundChange,
  disabled,
}: RoundChoiceProps) {
  // The box only counts while it is offered (as in the dialog's confirm).
  const ticked = offersNewRound(round) && newRound;
  return (
    <div className="grid gap-4">
      <p className="text-note text-muted-foreground">
        {roundLine(round, now, ticked)}
      </p>
      {round && !ticked && isOldRound(round, now) && (
        <Callout tone="warning" title="Tournée ancienne">
          {oldRoundWarning(round, now)}
        </Callout>
      )}
      {offersNewRound(round) && (
        <div className="grid gap-2">
          <Label
            htmlFor="delivery-new-round"
            className="border-border bg-card flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5"
          >
            <Checkbox
              id="delivery-new-round"
              checked={newRound}
              onCheckedChange={(value) => onNewRoundChange(value === true)}
              disabled={disabled}
              aria-describedby="delivery-new-round-note"
            />
            Nouvelle tournée
          </Label>
          <p
            id="delivery-new-round-note"
            className="text-note text-muted-foreground"
          >
            L&apos;ancienne tournée reste dans l&apos;historique de
            l&apos;application, avec ses destinataires.
          </p>
        </div>
      )}
    </div>
  );
}
