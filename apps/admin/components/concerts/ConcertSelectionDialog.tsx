"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cn } from "@/lib/utils";
import type { Tour } from "@/types/tours";
import { concertTitle, formatShortDateFr } from "@/utils/concerts/schedule";
import type { Concert } from "@repo/domain/types/concerts";
import { Loader2, Music2 } from "lucide-react";
import { useState } from "react";

/** Ids of the concerts already assigned to the tour. */
const concertIdsInTour = (concerts: readonly Concert[], tour: Tour | null) =>
  tour ? concerts.filter((c) => c.tour_id === tour.id).map((c) => c.id) : [];

/**
 * « Gérer les concerts » of a tour: tick the concerts that belong to it.
 * The caller writes one update per changed concert and names the ones
 * that fail.
 */
export function ConcertSelectionDialog({
  isOpen,
  onClose,
  tour,
  concerts,
  onConfirm,
  isPending = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  /** The concerts of the tour's period: assignable are those in it or in no tour. */
  concerts: readonly Concert[];
  onConfirm: (ids: string[]) => void;
  isPending?: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    isOpen ? concertIdsInTour(concerts, tour) : [],
  );

  useResetOnChange([isOpen, tour, concerts], () => {
    if (isOpen && tour) setSelectedIds(concertIdsInTour(concerts, tour));
  });

  const availableConcerts = concerts.filter(
    (c) => c.tour_id === tour?.id || !c.tour_id,
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gérer les concerts</DialogTitle>
          <DialogDescription>
            Cochez les concerts qui font partie de la tournée «&nbsp;
            {tour?.name}&nbsp;». Un concert ne peut appartenir qu&apos;à une
            tournée.
          </DialogDescription>
        </DialogHeader>

        {availableConcerts.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="Aucun concert disponible"
            description="Ajoutez d'abord un concert (sans tournée), puis rattachez-le ici."
            className="py-6"
          />
        ) : (
          <ul className="space-y-2">
            {availableConcerts.map((concert) => {
              const checked = selectedIds.includes(concert.id);
              const title = concertTitle(concert);
              return (
                <li key={concert.id} className="list-none">
                  <label
                    className={cn(
                      "border-border flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors motion-reduce:transition-none",
                      checked
                        ? "border-primary-soft-border bg-primary-soft"
                        : "hover:bg-accent",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(concert.id)}
                      className="mt-0.5"
                      disabled={isPending}
                    />
                    <span className="min-w-0 space-y-0.5">
                      <span className="block truncate text-[15px] font-medium">
                        {title}
                      </span>
                      <span className="text-note text-muted-foreground block truncate">
                        {formatShortDateFr(concert.date)} · {concert.place}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={() => onConfirm(selectedIds)}
            disabled={isPending || availableConcerts.length === 0}
            aria-busy={isPending || undefined}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            {isPending
              ? "Enregistrement…"
              : `Enregistrer (${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
