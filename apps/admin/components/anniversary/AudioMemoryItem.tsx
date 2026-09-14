"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryAudioMemory } from "@/types/anniversary";
import { Calendar, Clock, Edit, Eye, EyeOff, Mic, Trash2 } from "lucide-react";

interface AudioMemoryItemProps {
  audio: AnniversaryAudioMemory;
  onEdit: (audio: AnniversaryAudioMemory) => void;
  onDelete: (audio: AnniversaryAudioMemory) => void;
}

export function AudioMemoryItem({
  audio,
  onEdit,
  onDelete,
}: AudioMemoryItemProps) {
  return (
    <Card className={cn(!audio.is_visible && "opacity-60")}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className="bg-primary/10 text-primary shrink-0 rounded-lg p-3">
            <Mic className="h-6 w-6" aria-hidden />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold">
                {audio.title}
              </h2>
              <Badge
                variant={audio.is_visible ? "default" : "secondary"}
                className="shrink-0"
              >
                {audio.is_visible ? (
                  <>
                    <Eye className="mr-1 h-3 w-3" aria-hidden />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-1 h-3 w-3" aria-hidden />
                    Masqué
                  </>
                )}
              </Badge>
            </div>

            <p className="text-muted-foreground line-clamp-2 text-sm">
              {audio.description}
            </p>

            <div className="flex flex-wrap gap-3">
              {audio.speaker_name && (
                <span className="text-muted-foreground min-w-0 truncate text-xs">
                  <Mic className="mr-1 inline h-3 w-3" aria-hidden />
                  {audio.speaker_name}
                </span>
              )}
              {audio.year && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {audio.year}
                </span>
              )}
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" aria-hidden />
                {audio.duration}
              </span>
              <span className="text-muted-foreground text-xs">
                Ordre: {audio.display_order}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => onEdit(audio)}
          >
            <Edit className="h-4 w-4" aria-hidden />
            <span className="sr-only">Modifier « {audio.title} »</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(audio)}
            className="text-destructive hover:bg-destructive/10 size-11"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Supprimer « {audio.title} »</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
