"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryTimelineEvent } from "@/types/anniversary";
import { Edit, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  FaCalendarAlt,
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaMusic,
  FaTrophy,
  FaUsers,
  FaVideo,
} from "react-icons/fa";

const iconMap = {
  FaMusic: FaMusic,
  FaTrophy: FaTrophy,
  FaUsers: FaUsers,
  FaCalendarAlt: FaCalendarAlt,
  FaHistory: FaHistory,
  FaVideo: FaVideo,
  FaHeadphones: FaHeadphones,
  FaImages: FaImages,
  FaHeart: FaHeart,
};

interface TimelineEventItemProps {
  event: AnniversaryTimelineEvent;
  onEdit: (event: AnniversaryTimelineEvent) => void;
  onDelete: (event: AnniversaryTimelineEvent) => void;
}

export function TimelineEventItem({
  event,
  onEdit,
  onDelete,
}: TimelineEventItemProps) {
  const IconComponent = iconMap[event.icon_name as keyof typeof iconMap];

  return (
    <Card
      className={cn(
        "transition-shadow duration-150 ease-out hover:shadow-md motion-reduce:transition-none",
        !event.is_visible && "opacity-60",
      )}
    >
      <CardContent className="flex flex-wrap items-start gap-4 p-4">
        {/* Year Badge & Icon */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="bg-primary/10 rounded-lg px-3 py-1.5">
            <span className="text-primary text-sm font-bold">{event.year}</span>
          </div>
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            {IconComponent && <IconComponent className="h-5 w-5" />}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 basis-48 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 text-base font-semibold break-words">
              {event.title}
            </h2>
            <Badge
              variant={event.is_visible ? "default" : "secondary"}
              className="shrink-0"
            >
              {event.is_visible ? (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  Masqué
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {event.description}
          </p>
          <div className="pt-2">
            <span className="text-muted-foreground text-xs">
              Ordre: {event.display_order}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => onEdit(event)}
          >
            <Edit aria-hidden />
            <span className="sr-only">Modifier « {event.title} »</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(event)}
            className="text-destructive hover:bg-destructive/10 size-11"
          >
            <Trash2 aria-hidden />
            <span className="sr-only">Supprimer « {event.title} »</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
