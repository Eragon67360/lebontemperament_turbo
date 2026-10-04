"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Tour } from "@/types/tours";
import {
  concertCountLabel,
  contextLabel,
  excerpt,
  tourPeriodLabel,
} from "@/utils/concerts/schedule";
import {
  CalendarDays,
  ListChecks,
  Music2,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";

/**
 * One tour of the list: poster thumbnail, name, type chip, period (or
 * « Dates à préciser »), concert count, then « Gérer les concerts »,
 * « Modifier » and « Supprimer ».
 */
export function TourRow({
  tour,
  onEdit,
  onDelete,
  onManageConcerts,
}: {
  tour: Tour;
  onEdit: () => void;
  onDelete: () => void;
  onManageConcerts: () => void;
}) {
  const period = tourPeriodLabel(tour);
  const undated = !tour.start_date && !tour.end_date;
  const description = excerpt(tour.description);

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <div className="bg-surface-sunken relative h-24 w-16 shrink-0 overflow-hidden rounded-md">
        {tour.tour_poster ? (
          <Image
            src={tour.tour_poster}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <Users
            className="text-foreground-faint absolute inset-0 m-auto size-6"
            aria-hidden
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {tour.name}
            </h3>
            <StatusBadge tone="accent" dot={false}>
              {contextLabel(tour.context)}
            </StatusBadge>
            {undated && (
              <StatusBadge tone="warning">Dates à préciser</StatusBadge>
            )}
          </div>
          <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {!undated && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                {period}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Music2 className="size-3.5 shrink-0" aria-hidden />
              {concertCountLabel(tour.concert_count ?? 0)}
            </span>
          </div>
          {description && (
            <p className="text-detail text-muted-foreground line-clamp-2 break-words">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageConcerts}
          >
            <ListChecks aria-hidden />
            Gérer les concerts
            <span className="sr-only"> de « {tour.name} »</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {tour.name} »</span>
          </Button>
          <Button
            type="button"
            variant="destructive-outline"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 aria-hidden />
            Supprimer
            <span className="sr-only"> « {tour.name} »</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
