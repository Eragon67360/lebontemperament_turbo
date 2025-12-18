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
        "transition-all hover:shadow-md",
        !card.is_visible && "opacity-60",
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="bg-primary/10 text-primary rounded-lg p-3">
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold">{card.title}</h3>
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
          <div className="flex items-center gap-3 pt-2">
            <span className="text-muted-foreground text-xs">
              Cible:{" "}
              <code className="bg-muted rounded px-1 py-0.5">
                {card.target_section_id}
              </code>
            </span>
            <span className="text-muted-foreground text-xs">
              Ordre: {card.display_order}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(card)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(card)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
