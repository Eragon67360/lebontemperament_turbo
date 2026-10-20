"use client";

import { BuyerPicker } from "@/components/orders/BuyerPicker";
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
import { type DeliverableBuyer, deliveryResultLine } from "@/utils/orders/view";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Buyers to be delivered with an address and no stop yet (`deliverableBuyers`). */
  buyers: readonly DeliverableBuyer[];
  /**
   * The order to tick alone when the dialog opens (a buyer's « Ajouter à la
   * tournée… »); every buyer is ticked when null.
   */
  only?: string | null;
  /** Buyers to be delivered without an address: they will be left out. */
  withoutAddress: number;
  drivers: readonly Driver[];
  /** The signed-in superadmin, the default driver. */
  me: string | null;
  /**
   * Runs the add of the ticked orders (null: every buyer, as the add of the
   * whole sale), in a new round when `newRound`; resolves with what the
   * database reports.
   */
  onConfirm: (
    driverId: string,
    newRound: boolean,
    orderIds: string[] | null,
  ) => Promise<DeliveryResult>;
  isPending: boolean;
}

/**
 * « Ajouter à la tournée »: lets the admin tick who joins (every buyer, or
 * the one whose row opened it), names how many join whose round, lets them
 * pick another superadmin as the driver, says which round that is (its
 * sales, its progress, a warning when it looks forgotten) and offers « Nouvelle
 * tournée » when it has stops, then reports « 12 ajoutés · 2 sans adresse ».
 * The app shows the new stops when the round is opened or pulled down.
 */
export function DeliveryDialog({
  open,
  onOpenChange,
  buyers,
  only = null,
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
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(only !== null ? [only] : buyers.map((b) => b.orderId)),
  );
  // Buyers left unticked by the add that ran, for its report.
  const [leftOut, setLeftOut] = useState(0);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useResetOnChange([open, only], () => {
    setChosen(null);
    setNewRound(false);
    setSelected(new Set(only !== null ? [only] : buyers.map((b) => b.orderId)));
    setResult(null);
    setLeftOut(0);
    setProblem(null);
  });
  const driverId = chosen ?? me ?? drivers[0]?.id ?? "";
  // Another driver, another round: « Nouvelle tournée » starts unticked again.
  useResetOnChange([driverId], () => setNewRound(false));

  const driver = drivers.find((d) => d.id === driverId);
  const driverName = driver?.name ?? "ce livreur";
  const ready = buyers.length;
  // Ticked buyers still in the list (one added meanwhile elsewhere is gone).
  const ticked = buyers.filter((b) => selected.has(b.orderId));
  const joining =
    ticked.length === 1
      ? "1 acheteur à livrer sera ajouté"
      : `${ticked.length} acheteurs à livrer seront ajoutés`;

  const confirm = async () => {
    setProblem(null);
    try {
      // The box only counts while it is offered. Everyone ticked is the add
      // of the whole sale, as before there was a list.
      const left = ready - ticked.length;
      setResult(
        await onConfirm(
          driverId,
          offersNewRound(driver?.round) && newRound,
          left === 0 ? null : ticked.map((b) => b.orderId),
        ),
      );
      setLeftOut(left);
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
                : ticked.length === 0
                  ? "Cochez les acheteurs à ajouter à cette tournée."
                  : `${joining} à la tournée de ${driverName}, avec ${ticked.length === 1 ? "son adresse et son téléphone" : "leur adresse et leur téléphone"}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {result ? (
          <p className="text-detail text-muted-foreground">
            Dans l&apos;application, la tournée montre les nouveaux
            destinataires à son ouverture, ou en tirant l&apos;écran vers le
            bas.
            {leftOut > 0 &&
              (leftOut === 1
                ? " L'acheteur non coché reste à ajouter, à cette tournée ou à une prochaine."
                : ` Les ${leftOut} acheteurs non cochés restent à ajouter, à cette tournée ou à une prochaine.`)}
            {result.without_address > 0 &&
              " Les acheteurs sans adresse apparaîtront ici dès qu'elle sera renseignée."}
          </p>
        ) : (
          <div className="space-y-4">
            {ready > 0 && (
              <BuyerPicker
                buyers={buyers}
                selected={selected}
                onSelectedChange={setSelected}
                disabled={isPending}
              />
            )}
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
                  round={driver?.round}
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
                disabled={isPending || ticked.length === 0 || !driverId}
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
