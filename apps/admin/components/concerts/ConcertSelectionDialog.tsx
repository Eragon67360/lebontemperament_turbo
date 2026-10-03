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
import type { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Music2 } from "lucide-react";
import { useState } from "react";

/** Ids of the concerts already assigned to the tour. */
const concertIdsInTour = (concerts: Concert[], tour: Tour | null) =>
  tour ? concerts.filter((c) => c.tour_id === tour.id).map((c) => c.id) : [];

export function ConcertSelectionDialog({
  isOpen,
  onClose,
  tour,
  concerts,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  concerts: Concert[];
  onConfirm: (ids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    isOpen ? concertIdsInTour(concerts, tour) : [],
  );

  // Reset selection when modal opens
  useResetOnChange([isOpen, tour, concerts], () => {
    if (isOpen && tour) setSelectedIds(concertIdsInTour(concerts, tour));
  });

  // Assignable concerts: already in this tour, or not in any tour yet.
  const availableConcerts = concerts.filter(
    (c) => c.tour_id === tour?.id || !c.tour_id,
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les concerts</DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des concerts pour la tournée «&nbsp;
            {tour?.name}&nbsp;».
          </DialogDescription>
        </DialogHeader>

        {availableConcerts.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="Aucun concert disponible"
            description="Créez un concert à venir pour pouvoir l'ajouter à cette tournée."
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {availableConcerts.map((concert) => {
              const isSelected = selectedIds.includes(concert.id);
              return (
                <label
                  key={concert.id}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150 ease-out motion-reduce:transition-none",
                    isSelected
                      ? "border-primary/50 bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(concert.id)}
                    className="mt-0.5 size-5 shrink-0"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block truncate text-sm font-medium">
                      {concert.name || "Concert sans titre"}
                    </span>
                    <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
                      <span>
                        {format(new Date(concert.date), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      <span aria-hidden>•</span>
                      <span className="truncate">{concert.place}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => onConfirm(selectedIds)}
          >
            Enregistrer ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
