"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import {
  FaCalendarAlt,
  FaEdit,
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaMusic,
  FaTrash,
  FaTrophy,
  FaUsers,
  FaVideo,
} from "react-icons/fa";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaMusic,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaHistory,
  FaVideo,
  FaHeadphones,
  FaImages,
  FaHeart,
};

interface HeroStatItemProps {
  stat: AnniversaryHeroStat;
  onEdit: (stat: AnniversaryHeroStat) => void;
  onDelete: (stat: AnniversaryHeroStat) => void;
}

export function HeroStatItem({ stat, onEdit, onDelete }: HeroStatItemProps) {
  const IconComponent = iconMap[stat.icon_name] || FaMusic;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Icon & Content */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A878D] to-[#0D6B70]">
            <IconComponent className="text-3xl text-white" />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-foreground text-2xl font-bold">
                {stat.number}
              </h3>
              <Badge variant={stat.is_visible ? "default" : "secondary"}>
                {stat.is_visible ? "Visible" : "Masqué"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </p>
            <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
              <span>Icône: {stat.icon_name}</span>
              <span>Ordre: {stat.display_order}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(stat)}
            className="h-9 w-9 p-0"
          >
            <FaEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(stat)}
            className="h-9 w-9 p-0"
          >
            <FaTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
