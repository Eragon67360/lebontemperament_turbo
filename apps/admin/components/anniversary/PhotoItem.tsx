"use client";

import {
  ContentRow,
  Fact,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import type { AnniversaryPhoto } from "@/types/anniversary";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { Calendar, Tag } from "lucide-react";
import Image from "next/image";

export function PhotoItem({
  photo,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  photo: AnniversaryPhoto;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preview = cloudinaryUrl(
    photo.image_url,
    "image",
    cloudName,
    "c_fill,w_600,h_400,g_auto",
  );
  const full = cloudinaryUrl(photo.image_url, "image", cloudName);
  return (
    <ContentRow
      layout="card"
      className="h-full"
      name={photo.title}
      title={photo.title}
      leading={
        <a
          href={full ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="bg-muted relative block aspect-[3/2] w-full overflow-hidden rounded-t-lg"
        >
          {preview && (
            <Image
              src={preview}
              alt={`Ouvrir « ${photo.title} » en taille réelle (nouvel onglet)`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
          )}
        </a>
      }
      description={photo.description}
      meta={
        <>
          {photo.year && <Fact icon={Calendar}>{photo.year}</Fact>}
          <Fact icon={Tag}>{photo.category}</Fact>
        </>
      }
      visible={photo.is_visible}
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}
