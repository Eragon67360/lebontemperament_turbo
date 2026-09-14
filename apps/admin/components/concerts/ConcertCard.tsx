import { ConcertPoster } from "@/components/ConcertPoster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Link as LinkIcon,
  MapPin,
  Music2,
  Pencil,
  Trash2,
} from "lucide-react";

export function ConcertCard({
  concert,
  tourName,
  onEdit,
  onDelete,
}: {
  concert: Concert;
  tourName?: string;
  onEdit: (concert: Concert) => void;
  onDelete: (id: string) => void;
}) {
  const dateObj = new Date(concert.date);
  const title = concert.name || "Concert sans titre";

  return (
    <Card className="bg-card hover:border-primary/50 flex overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
      {/* Date tile: phones get the date in the meta row instead. */}
      <div className="bg-muted/20 hidden w-[88px] shrink-0 flex-col items-center justify-center border-r px-4 py-4 text-center sm:flex">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {format(dateObj, "MMM", { locale: fr })}
        </span>
        <span className="text-foreground text-3xl leading-none font-black">
          {format(dateObj, "dd")}
        </span>
        <span className="text-muted-foreground/80 text-xs font-medium">
          {format(dateObj, "yyyy")}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            {concert.affiche ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border shadow-sm">
                <ConcertPoster
                  src={concert.affiche}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
                <Music2 className="h-6 w-6" aria-hidden />
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <h3 className="truncate leading-tight font-bold tracking-tight">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {tourName && (
                  <Badge
                    variant="secondary"
                    className="text-muted-foreground max-w-full truncate px-1.5 font-normal"
                  >
                    {tourName}
                  </Badge>
                )}
                <span className="text-muted-foreground flex items-center gap-1 sm:hidden">
                  <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                  {format(dateObj, "dd MMM yyyy", { locale: fr })}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                  {concert.time.slice(0, 5).replace(":", "h")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary size-11 rounded-full"
              onClick={() => onEdit(concert)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="sr-only">Modifier « {title} »</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-11 rounded-full"
              onClick={() => onDelete(concert.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Supprimer « {title} »</span>
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="text-muted-foreground grid gap-1 text-sm sm:grid-cols-2 sm:gap-2">
          <div className="flex min-h-11 min-w-0 items-center gap-2 sm:min-h-0">
            <MapPin className="text-primary/60 h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{concert.place}</span>
          </div>
          {concert.related_link && (
            <div className="flex min-h-11 min-w-0 items-center gap-2 sm:min-h-0">
              <LinkIcon
                className="text-primary/60 h-4 w-4 shrink-0"
                aria-hidden
              />
              <a
                href={concert.related_link}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary truncate transition-colors duration-150 ease-out hover:underline motion-reduce:transition-none"
              >
                Lien billetterie/info
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
