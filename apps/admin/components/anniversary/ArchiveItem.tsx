"use client";

import {
  ContentRow,
  Fact,
  IconTile,
} from "@/components/anniversary/ContentRow";
import { Button } from "@/components/ui/button";
import type { AnniversaryArchive } from "@/types/anniversary";
import { archiveTypeLabel } from "@/utils/anniversary/labels";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { Calendar, ExternalLink, FileText } from "lucide-react";

export function ArchiveItem({
  archive,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  archive: AnniversaryArchive;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  // The stored value is the Cloudinary public_id (or, for older rows, a full
  // URL): the link used to use it as a relative path and led nowhere.
  const href = cloudinaryUrl(
    archive.file_url,
    "raw",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  return (
    <ContentRow
      name={archive.title}
      title={archive.title}
      leading={
        <IconTile>
          <FileText className="size-6" aria-hidden />
        </IconTile>
      }
      description={archive.description}
      meta={
        <>
          <Fact icon={Calendar}>{archive.year}</Fact>
          <Fact>{archiveTypeLabel(archive.type)}</Fact>
          <Fact>{archive.theme}</Fact>
          {archive.file_size && <Fact>{archive.file_size}</Fact>}
        </>
      }
      visible={archive.is_visible}
      extraActions={
        href && (
          <Button variant="outline" size="sm" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Voir le document
              <span className="sr-only">
                {" "}
                « {archive.title} » (nouvel onglet)
              </span>
            </a>
          </Button>
        )
      }
      busy={busy}
      onEdit={onEdit}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    />
  );
}
