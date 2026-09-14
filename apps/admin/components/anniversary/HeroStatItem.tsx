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
    <Card className="p-4 transition-shadow duration-150 ease-out hover:shadow-md motion-reduce:transition-none sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        {/* Icon & Content */}
        <div className="flex min-w-0 flex-1 basis-48 items-start gap-4">
          {/* Icon */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A878D] to-[#0D6B70]">
            <IconComponent className="text-3xl text-white" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-foreground text-2xl font-bold break-words">
                {stat.number}
              </h2>
              <Badge variant={stat.is_visible ? "default" : "secondary"}>
                {stat.is_visible ? "Visible" : "Masqué"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </p>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>Icône: {stat.icon_name}</span>
              <span>Ordre: {stat.display_order}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex flex-shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(stat)}
            className="size-11"
          >
            <FaEdit aria-hidden />
            <span className="sr-only">
              Modifier « {stat.number} {stat.label} »
            </span>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(stat)}
            className="size-11"
          >
            <FaTrash aria-hidden />
            <span className="sr-only">
              Supprimer « {stat.number} {stat.label} »
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
