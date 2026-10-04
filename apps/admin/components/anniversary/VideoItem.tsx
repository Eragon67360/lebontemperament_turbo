"use client";

import {
  ContentRow,
  Fact,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import { Button } from "@/components/ui/button";
import type { AnniversaryVideo } from "@/types/anniversary";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { Calendar, ExternalLink, Tag } from "lucide-react";
import Image from "next/image";

export function VideoItem({
  video,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  video: AnniversaryVideo;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const thumbnail = cloudinaryUrl(
    video.thumbnail_url,
    "image",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    "c_fill,w_400,h_225,g_auto",
  );
  return (
    <ContentRow
      name={video.title}
      title={video.title}
      leading={
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md sm:w-40">
          {thumbnail && (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 160px"
              className="object-cover"
            />
          )}
        </div>
      }
      description={video.description}
      meta={
        <>
          {video.year && <Fact icon={Calendar}>{video.year}</Fact>}
          <Fact icon={Tag}>{video.category}</Fact>
          {!video.video_url && (
            <Fact>Sans lien : la vignette ne s&apos;ouvre pas</Fact>
          )}
        </>
      }
      visible={video.is_visible}
      extraActions={
        video.video_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.video_url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Voir la vidéo
              <span className="sr-only">
                {" "}
                « {video.title} » (nouvel onglet)
              </span>
            </a>
          </Button>
        )
      }
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}
