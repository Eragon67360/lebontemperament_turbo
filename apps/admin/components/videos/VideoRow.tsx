"use client";

import {
  ContentRow,
  Fact,
  type ReorderControls,
} from "@/components/anniversary/ContentRow";
import { Button } from "@/components/ui/button";
import { formatShortDateFr } from "@/utils/concerts/schedule";
import {
  parseYouTubeInput,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "@/utils/videos/youtube";
import type { Video } from "@repo/domain/types/videos";
import {
  Calendar,
  ExternalLink,
  Film,
  MapPin,
  Mic2,
  Play,
  User,
} from "lucide-react";

/**
 * One video of the public gallery: YouTube's own thumbnail (a plain,
 * lazy image, no player on the list), the play link opening YouTube in a
 * new tab, title, composer, date, venue and soloists, then « Modifier »,
 * the « Plus d'actions » menu (« Supprimer… ») and the order controls.
 */
export function VideoRow({
  video,
  reorder,
  busy,
  onEdit,
  onDelete,
}: {
  video: Video;
  reorder: ReorderControls;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const id = parseYouTubeInput(video.youtube_url);
  const watchUrl = id ? youtubeWatchUrl(id) : null;

  return (
    <ContentRow
      name={video.title}
      title={video.title}
      showStatus={false}
      visible
      leading={
        watchUrl ? (
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-surface-sunken group relative block aspect-video w-full overflow-hidden rounded-md sm:w-44"
          >
            {/* YouTube's thumbnail, served by YouTube: a plain lazy image,
                not the optimiser (external host, nothing to gain). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumbnailUrl(id!)}
              alt=""
              loading="lazy"
              width={480}
              height={360}
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="bg-primary-strong text-primary-foreground grid size-11 place-items-center rounded-full shadow-md">
                <Play className="ml-0.5 size-5 fill-current" aria-hidden />
              </span>
            </span>
            <span className="sr-only">
              Regarder « {video.title} » sur YouTube (nouvel onglet)
            </span>
          </a>
        ) : (
          <div className="bg-surface-sunken relative aspect-video w-full overflow-hidden rounded-md sm:w-44">
            <Film
              className="text-foreground-faint absolute inset-0 m-auto size-6"
              aria-hidden
            />
          </div>
        )
      }
      meta={
        <>
          {video.composer && <Fact icon={User}>{video.composer}</Fact>}
          {video.performance_date && (
            <Fact icon={Calendar}>
              {formatShortDateFr(video.performance_date)}
            </Fact>
          )}
          {video.venue && <Fact icon={MapPin}>{video.venue}</Fact>}
          {video.soloists && video.soloists.length > 0 && (
            <Fact icon={Mic2}>{video.soloists.join(", ")}</Fact>
          )}
          {!watchUrl && <Fact>Lien YouTube illisible : à corriger</Fact>}
        </>
      }
      extraActions={
        watchUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={watchUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Voir sur YouTube
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
      onDelete={onDelete}
    />
  );
}
