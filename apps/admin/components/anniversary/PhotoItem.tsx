"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryPhoto } from "@/types/anniversary";
import { Calendar, Edit, Eye, EyeOff, Tag, Trash2 } from "lucide-react";
import Image from "next/image";

interface PhotoItemProps {
  photo: AnniversaryPhoto;
  onEdit: (photo: AnniversaryPhoto) => void;
  onDelete: (photo: AnniversaryPhoto) => void;
}

export function PhotoItem({ photo, onEdit, onDelete }: PhotoItemProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden",
        !photo.is_visible && "opacity-60",
      )}
    >
      {/* Image Preview */}
      <div className="bg-muted relative aspect-video w-full">
        <Image
          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_300,g_auto/${photo.image_url}`}
          alt={photo.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold">
            {photo.title}
          </h2>
          <Badge
            variant={photo.is_visible ? "default" : "secondary"}
            className="shrink-0"
          >
            {photo.is_visible ? (
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

        {photo.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {photo.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {photo.year && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" aria-hidden />
              {photo.year}
            </span>
          )}
          <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{photo.category}</span>
          </span>
          <span className="text-muted-foreground text-xs">
            Ordre: {photo.display_order}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => onEdit(photo)}
          >
            <Edit className="h-4 w-4" aria-hidden />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(photo)}
            className="text-destructive hover:bg-destructive/10 min-h-11"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
