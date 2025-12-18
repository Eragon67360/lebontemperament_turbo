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
        "overflow-hidden transition-all hover:shadow-md",
        !photo.is_visible && "opacity-60",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Preview */}
          <div className="relative aspect-video w-full shrink-0 sm:w-48">
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_300,g_auto/${photo.image_url}`}
              alt={photo.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{photo.title}</h3>
                <Badge
                  variant={photo.is_visible ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {photo.is_visible ? (
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

              {photo.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {photo.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {photo.year && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {photo.year}
                  </span>
                )}
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  {photo.category}
                </span>
                <span className="text-muted-foreground text-xs">
                  Ordre: {photo.display_order}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(photo)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(photo)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
