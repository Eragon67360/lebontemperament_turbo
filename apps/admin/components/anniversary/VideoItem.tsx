"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryVideo } from "@/types/anniversary";
import { Calendar, Edit, Eye, EyeOff, Link2, Tag, Trash2 } from "lucide-react";
import Image from "next/image";

interface VideoItemProps {
  video: AnniversaryVideo;
  onEdit: (video: AnniversaryVideo) => void;
  onDelete: (video: AnniversaryVideo) => void;
}

export function VideoItem({ video, onEdit, onDelete }: VideoItemProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        !video.is_visible && "opacity-60",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full shrink-0 sm:w-48">
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_300,g_auto/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
            />
            {video.video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="rounded-full bg-white/90 p-3">
                  <Link2 className="text-primary h-5 w-5" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{video.title}</h3>
                <Badge
                  variant={video.is_visible ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {video.is_visible ? (
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
                {video.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {video.year && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {video.year}
                  </span>
                )}
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  {video.category}
                </span>
                <span className="text-muted-foreground text-xs">
                  Ordre: {video.display_order}
                </span>
              </div>

              {video.video_url && (
                <p className="text-muted-foreground truncate text-xs">
                  <Link2 className="mr-1 inline h-3 w-3" />
                  {video.video_url}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(video)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(video)}
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
