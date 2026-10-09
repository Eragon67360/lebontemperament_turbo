"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateBlock } from "@/components/ui/date-block";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatLongDateFr,
  parseIsoDate,
  timeRangeFr,
} from "@/utils/season/schedule";
import type { Rehearsal } from "@repo/domain/types/rehearsals";
import { CalendarOff, Clock, MapPin, Pencil } from "lucide-react";

/**
 * One rehearsal of the « À venir » or « Passées » list: date block, name,
 * group chip, « Google Agenda » when the row came from the calendar sync,
 * day, hours and place, then « Modifier » and the « Plus d'actions »
 * menu (« Supprimer… »).
 */
export function RehearsalRow({
  rehearsal,
  onEdit,
  onDelete,
}: {
  rehearsal: Rehearsal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = parseIsoDate(rehearsal.date);
  const hours = timeRangeFr(rehearsal.start_time, rehearsal.end_time);

  return (
    <Card className="flex items-start gap-4 p-4">
      <DateBlock date={date} icon={CalendarOff} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {rehearsal.name}
            </h3>
            <StatusBadge tone="accent" dot={false}>
              {rehearsal.group_type}
            </StatusBadge>
            {rehearsal.event_id && (
              <StatusBadge tone="info" dot={false}>
                Google Agenda
              </StatusBadge>
            )}
          </div>
          <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatLongDateFr(rehearsal.date)}</span>
            {hours && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                {hours}
              </span>
            )}
            {rehearsal.place && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {rehearsal.room
                    ? `${rehearsal.place} · ${rehearsal.room}`
                    : rehearsal.place}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {rehearsal.name} »</span>
          </Button>
          <RowActionsMenu name={rehearsal.name} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  );
}
