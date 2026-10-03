"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryNavigationCard } from "@/types/anniversary";
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

interface NavigationCardItemProps {
  card: AnniversaryNavigationCard;
  onEdit: (card: AnniversaryNavigationCard) => void;
  onDelete: (card: AnniversaryNavigationCard) => void;
}

export function NavigationCardItem({
  card,
  onEdit,
  onDelete,
}: NavigationCardItemProps) {
  const IconComponent = iconMap[card.icon_name as keyof typeof iconMap];

  return (
    <Card
      className={cn(
        "transition-shadow duration-150 ease-out hover:shadow-md motion-reduce:transition-none",
        !card.is_visible && "opacity-60",
      )}
    >
      <CardContent className="flex flex-wrap items-start gap-4 p-4">
        {/* Icon */}
        <div className="bg-primary/10 text-primary shrink-0 rounded-lg p-3">
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 basis-48 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 text-base font-semibold break-words">
              {card.title}
            </h2>
            <Badge
              variant={card.is_visible ? "default" : "secondary"}
              className="shrink-0"
            >
              {card.is_visible ? (
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
            {card.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
            <span className="text-muted-foreground min-w-0 text-xs">
              Cible:{" "}
              <code className="bg-muted rounded px-1 py-0.5 break-all">
                {card.target_section_id}
              </code>
            </span>
            <span className="text-muted-foreground text-xs">
              Ordre: {card.display_order}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => onEdit(card)}
          >
            <Edit aria-hidden />
            <span className="sr-only">Modifier « {card.title} »</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(card)}
            className="text-destructive hover:bg-destructive/10 size-11"
          >
            <Trash2 aria-hidden />
            <span className="sr-only">Supprimer « {card.title} »</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
