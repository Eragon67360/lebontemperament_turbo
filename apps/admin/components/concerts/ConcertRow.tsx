"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  concertTitle,
  contextLabel,
  excerpt,
  formatTimeFr,
  parseIsoDate,
} from "@/utils/concerts/schedule";
import type { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  ExternalLink,
  MapPin,
  Music2,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";

/**
 * One concert of the « À venir » or « Passés » list: date block, poster,
 * title, type and tour chips, place and time, an excerpt of the public
 * information, then « Modifier » and « Supprimer ».
 */
export function ConcertRow({
  concert,
  tourName,
  onEdit,
  onDelete,
}: {
  concert: Concert;
  tourName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title = concertTitle(concert);
  const date = parseIsoDate(concert.date);
  const info = excerpt(concert.additional_informations);

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <div className="flex shrink-0 items-center gap-4">
        <div
          className="bg-primary-soft text-primary-text grid size-14 shrink-0 place-items-center rounded-md"
          aria-hidden
        >
          {date ? (
            <span className="flex flex-col items-center leading-none">
              <span className="text-xl font-semibold">
                {format(date, "d", { locale: fr })}
              </span>
              <span className="text-note mt-0.5 uppercase">
                {format(date, "MMM", { locale: fr })}
              </span>
            </span>
          ) : (
            <Music2 className="size-6" />
          )}
        </div>
        <div className="bg-surface-sunken relative h-14 w-10 shrink-0 overflow-hidden rounded-sm">
          {concert.affiche ? (
            <Image
              src={concert.affiche}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <Music2
              className="text-foreground-faint absolute inset-0 m-auto size-5"
              aria-hidden
            />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {title}
            </h3>
            <StatusBadge tone="accent" dot={false}>
              {contextLabel(concert.context)}
            </StatusBadge>
            {tourName && (
              <StatusBadge tone="neutral" dot={false}>
                {tourName}
              </StatusBadge>
            )}
          </div>
          <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {date && (
              <span className="inline-flex items-center gap-1">
                {format(date, "EEEE d MMMM yyyy", { locale: fr })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {formatTimeFr(concert.time)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{concert.place}</span>
            </span>
          </div>
          {info && (
            <p className="text-detail text-muted-foreground line-clamp-2 break-words">
              {info}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {concert.related_link && (
            <Button variant="outline" size="sm" asChild>
              <a href={concert.related_link} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Billetterie
                <span className="sr-only"> de « {title} » (nouvel onglet)</span>
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {title} »</span>
          </Button>
          <Button
            type="button"
            variant="destructive-outline"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 aria-hidden />
            Supprimer
            <span className="sr-only"> « {title} »</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
