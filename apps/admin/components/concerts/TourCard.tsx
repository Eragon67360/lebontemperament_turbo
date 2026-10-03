import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Tour } from "@/types/tours";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ListChecks, Music2, Pencil, Trash2 } from "lucide-react";

const CONTEXT_LABELS: Record<string, string> = {
  orchestre: "Orchestre",
  choeur: "Chœur",
  orchestre_et_choeur: "Orchestre & Chœur",
  autre: "Autre",
};

export function TourCard({
  tour,
  onEdit,
  onDelete,
  onManageConcerts,
}: {
  tour: Tour;
  onEdit: (tour: Tour) => void;
  onDelete: (id: string) => void;
  onManageConcerts: (tour: Tour) => void;
}) {
  const isOrchestra = tour.context === "orchestre_et_choeur";
  const concertCount = tour.concert_count ?? 0;
  const period = `${
    tour.start_date
      ? format(new Date(tour.start_date), "dd MMM", { locale: fr })
      : "?"
  } – ${
    tour.end_date
      ? format(new Date(tour.end_date), "dd MMM yyyy", { locale: fr })
      : "?"
  }`;

  return (
    <Card className="bg-card hover:border-primary/50 flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h3 className="truncate text-base font-bold tracking-tight sm:text-lg">
              {tour.name}
            </h3>
            <Badge
              variant="outline"
              className={
                isOrchestra
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-700"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-700"
              }
            >
              {CONTEXT_LABELS[tour.context] ?? "Autre"}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-11 rounded-full"
              onClick={() => onEdit(tour)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="sr-only">Modifier « {tour.name} »</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-11 rounded-full"
              onClick={() => onDelete(tour.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Supprimer « {tour.name} »</span>
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
          {tour.description || "Aucune description."}
        </p>

        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium">
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{period}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {concertCount} concert{concertCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="bg-muted/30 mt-auto border-t p-3">
        <Button
          variant="secondary"
          className="bg-background hover:bg-background/80 min-h-11 w-full justify-between transition-colors duration-150 ease-out motion-reduce:transition-none"
          onClick={() => onManageConcerts(tour)}
        >
          <span className="min-w-0 truncate">Gérer les concerts</span>
          <ListChecks className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </div>
    </Card>
  );
}
