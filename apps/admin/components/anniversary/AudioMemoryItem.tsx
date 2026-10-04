"use client";

import {
  ContentRow,
  Fact,
  IconTile,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import type { AnniversaryAudioMemory } from "@/types/anniversary";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { Calendar, Clock, Mic } from "lucide-react";

export function AudioMemoryItem({
  audio,
  reorder,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  audio: AnniversaryAudioMemory;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const src = cloudinaryUrl(
    audio.audio_url,
    "raw",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  return (
    <ContentRow
      name={audio.title}
      title={audio.title}
      leading={
        <IconTile>
          <Mic className="size-6" aria-hidden />
        </IconTile>
      }
      description={audio.description}
      meta={
        <>
          {audio.speaker_name && <Fact icon={Mic}>{audio.speaker_name}</Fact>}
          {audio.year && <Fact icon={Calendar}>{audio.year}</Fact>}
          <Fact icon={Clock}>{audio.duration}</Fact>
        </>
      }
      visible={audio.is_visible}
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    >
      {/* The file could not be heard from the admin before: the player
          reads the same Cloudinary URL as the public page. */}
      {src && (
        <audio
          controls
          preload="none"
          src={src}
          className="h-10 w-full max-w-md"
          aria-label={`Écouter « ${audio.title} »`}
        >
          <a href={src} target="_blank" rel="noreferrer">
            Écouter « {audio.title} »
          </a>
        </audio>
      )}
    </ContentRow>
  );
}
