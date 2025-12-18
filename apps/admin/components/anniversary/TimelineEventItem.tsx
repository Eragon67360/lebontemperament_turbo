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
        "transition-all hover:shadow-md",
        !event.is_visible && "opacity-60",
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        {/* Year Badge & Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-primary/10 rounded-lg px-3 py-1.5">
            <span className="text-primary text-sm font-bold">{event.year}</span>
          </div>
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            {IconComponent && <IconComponent className="h-5 w-5" />}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold">{event.title}</h3>
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
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(event)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
