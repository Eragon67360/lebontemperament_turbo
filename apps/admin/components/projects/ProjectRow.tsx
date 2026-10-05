"use client";

import {
  ContentRow,
  Fact,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import { Button } from "@/components/ui/button";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { formatShortDateFr } from "@/utils/concerts/schedule";
import type { Project } from "@repo/domain/types/projects";
import { Calendar, ExternalLink, FileText, ImageIcon } from "lucide-react";
import Image from "next/image";

export const PROJECTS_HREF = "/dashboard/public/concerts/projets";

/** The admin preview of a story, opened in a new tab. */
export function previewHref(slug: string) {
  return `${PROJECTS_HREF}/preview/${slug}`;
}

/** « 3 images », « 1 bloc de texte » for the facts line. */
export function storyFacts(project: Project): string[] {
  const images = [
    project.image,
    project.banniere,
    project.image2,
    project.image3,
  ].filter(Boolean).length;
  const texts = [project.explanation, project.text1, project.text2].filter(
    Boolean,
  ).length;
  const facts: string[] = [];
  facts.push(
    images === 0 ? "Aucune image" : `${images} image${images > 1 ? "s" : ""}`,
  );
  facts.push(
    texts === 0 ? "Aucun texte" : `${texts} texte${texts > 1 ? "s" : ""}`,
  );
  return facts;
}

/**
 * One concert story of the list: thumbnail, name and subtitle, date and
 * what it contains, « Prévisualiser », « Modifier », « Supprimer », and
 * the order controls.
 */
export function ProjectRow({
  project,
  reorder,
  busy,
  onEdit,
  onDelete,
}: {
  project: Project;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const thumbnail = cloudinaryUrl(
    project.image,
    "image",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    "c_fill,w_320,h_240,g_auto",
  );
  const [images, texts] = storyFacts(project);
  return (
    <ContentRow
      name={project.name}
      title={project.name}
      showStatus={false}
      visible
      leading={
        <div className="bg-surface-sunken relative aspect-[4/3] w-full overflow-hidden rounded-md sm:w-32">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 128px"
              className="object-cover"
            />
          ) : (
            <ImageIcon
              className="text-foreground-faint absolute inset-0 m-auto size-6"
              aria-hidden
            />
          )}
        </div>
      }
      description={project.sub_name || project.explanation || undefined}
      meta={
        <>
          {project.date && (
            <Fact icon={Calendar}>{formatShortDateFr(project.date)}</Fact>
          )}
          <Fact icon={ImageIcon}>{images}</Fact>
          <Fact icon={FileText}>{texts}</Fact>
        </>
      }
      extraActions={
        <Button variant="outline" size="sm" asChild>
          <a
            href={previewHref(project.slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden />
            Prévisualiser
            <span className="sr-only"> « {project.name} » (nouvel onglet)</span>
          </a>
        </Button>
      }
      reorder={reorder}
      busy={busy}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
