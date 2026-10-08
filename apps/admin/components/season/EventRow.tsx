"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateBlock } from "@/components/ui/date-block";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  eventPeriodLabel,
  eventTypeLabel,
  excerpt,
  formatTimeFr,
  parseIsoDate,
} from "@/utils/season/schedule";
import type { Event } from "@repo/domain/types/events";
import {
  CalendarOff,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  User,
} from "lucide-react";

/**
 * One event of the « À venir » or « Passés » list: date block, title, type
 * chip, « Public » or « Membres » visibility, period, time, place and the
 * person in charge, an excerpt of the description, then the link,
 * « Modifier » and the « Plus d'actions » menu (« Supprimer… »).
 */
export function EventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = parseIsoDate(event.date_from);
  const time = formatTimeFr(event.time);
  const description = excerpt(event.description);
  const contact = event.responsible_email
    ? `${event.responsible_name} (${event.responsible_email})`
    : event.responsible_name;

  return (
    <Card className="flex items-start gap-4 p-4">
      <DateBlock date={date} icon={CalendarOff} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {event.title}
            </h3>
            <StatusBadge tone="accent" dot={false}>
              {eventTypeLabel(event.event_type)}
            </StatusBadge>
            {event.is_public ? (
              <StatusBadge tone="success">Public</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Membres</StatusBadge>
            )}
          </div>
          <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{eventPeriodLabel(event)}</span>
            {time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                {time}
              </span>
            )}
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            {event.responsible_name && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <User className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{contact}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="text-detail text-muted-foreground line-clamp-2 break-words">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {event.link && (
            <Button variant="outline" size="sm" asChild>
              <a href={event.link} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Ouvrir le lien
                <span className="sr-only">
                  {" "}
                  de « {event.title} » (nouvel onglet)
                </span>
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {event.title} »</span>
          </Button>
          <RowActionsMenu name={event.title} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  );
}
