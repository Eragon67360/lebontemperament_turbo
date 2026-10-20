"use client";

import { RoundChoice } from "@/components/orders/RoundChoice";
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
import { Callout } from "@/components/ui/callout";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { offersNewRound } from "@/utils/orders/round";
import type { DeliveryResult, Driver } from "@/utils/orders/types";
import { deliveryResultLine } from "@/utils/orders/view";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Buyers to be delivered with an address and no stop yet. */
  ready: number;
  /** Buyers to be delivered without an address: they will be left out. */
  withoutAddress: number;
  drivers: readonly Driver[];
  /** The signed-in superadmin, the default driver. */
  me: string | null;
  /**
   * Runs the add, in a new round when `newRound`; resolves with what the
   * database reports.
   */
  onConfirm: (driverId: string, newRound: boolean) => Promise<DeliveryResult>;
  isPending: boolean;
}

/**
 * « Ajouter à la tournée »: names how many buyers join whose round, lets the
 * admin pick another superadmin as the driver, says which round that is (its
 * sales, its progress, a warning when it looks forgotten) and offers « Nouvelle
 * tournée » when it has stops, then reports « 12 ajoutés · 2 sans adresse ».
 * The app shows the new stops when the round is opened or pulled down.
 */
export function DeliveryDialog({
  open,
  onOpenChange,
  ready,
  withoutAddress,
  drivers,
  me,
  onConfirm,
  isPending,
}: DeliveryDialogProps) {
  // The driver picked in this opening; the caller (or the first superadmin)
  // until then, so the default follows the list as it loads.
  const [chosen, setChosen] = useState<string | null>(null);
  const [newRound, setNewRound] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useResetOnChange([open], () => {
    setChosen(null);
    setNewRound(false);
    setResult(null);
    setProblem(null);
  });
  const driverId = chosen ?? me ?? drivers[0]?.id ?? "";
  // Another driver, another round: « Nouvelle tournée » starts unticked again.
  useResetOnChange([driverId], () => setNewRound(false));

  const selected = drivers.find((d) => d.id === driverId);
  const driverName = selected?.name ?? "ce livreur";
  const buyers =
    ready === 1
      ? "1 acheteur à livrer sera ajouté"
      : `${ready} acheteurs à livrer seront ajoutés`;

  const confirm = async () => {
    setProblem(null);
    try {
      // The box only counts while it is offered.
      setResult(
        await onConfirm(driverId, offersNewRound(selected?.round) && newRound),
      );
    } catch (error) {
      setProblem(
        error instanceof Error && error.message
          ? error.message
          : "Le serveur n'a pas répondu.",
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ajouter à la tournée</AlertDialogTitle>
          <AlertDialogDescription>
            {result
              ? deliveryResultLine(result)
              : ready === 0
                ? "Aucun acheteur à ajouter : tous ceux à livrer sont déjà dans une tournée, ou n'ont pas d'adresse."
                : `${buyers} à la tournée de ${driverName}, avec leur adresse et leur téléphone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {result ? (
          <p className="text-detail text-muted-foreground">
            Dans l&apos;application, la tournée montre les nouveaux
            destinataires à son ouverture, ou en tirant l&apos;écran vers le
            bas.
            {result.without_address > 0 &&
              " Les acheteurs sans adresse apparaîtront ici dès qu'elle sera renseignée."}
          </p>
        ) : (
          <div className="space-y-4">
            {ready > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="delivery-driver">Livreur</Label>
                <Select value={driverId} onValueChange={setChosen}>
                  <SelectTrigger id="delivery-driver">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                        {driver.id === me ? " (vous)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <RoundChoice
                  round={selected?.round}
                  now={new Date()}
                  newRound={newRound}
                  onNewRoundChange={setNewRound}
                  disabled={isPending}
                />
              </div>
            )}
            {withoutAddress > 0 && (
              <Callout tone="warning" title="Sans adresse">
                {withoutAddress === 1
                  ? "1 acheteur à livrer n'a pas d'adresse : il ne sera pas ajouté."
                  : `${withoutAddress} acheteurs à livrer n'ont pas d'adresse : ils ne seront pas ajoutés.`}
              </Callout>
            )}
            {problem && (
              <Callout tone="danger" title="L'ajout a échoué" role="alert">
                <p>{problem}</p>
              </Callout>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {result ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Fermer
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isPending}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void confirm();
                }}
                disabled={isPending || ready === 0 || !driverId}
                aria-busy={isPending || undefined}
              >
                {isPending && <Loader2 className="animate-spin" aria-hidden />}
                {isPending ? "Ajout…" : "Ajouter à la tournée"}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
