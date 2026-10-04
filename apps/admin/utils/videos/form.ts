// What the gallery video form stores (Phase 4 wave 3, #480): the YouTube
// link normalised to the watch URL the website reads, the soloists split.
import type { GalleryVideoFormValues } from "@/utils/formSchemas";
import {
  parseSoloists,
  parseYouTubeInput,
  youtubeWatchUrl,
} from "@/utils/videos/youtube";
import type { VideoFormData } from "@repo/domain/types/videos";
import { format } from "date-fns";

/** The row to store: the link normalised, the soloists split, text trimmed. */
export function toVideoFormData(values: GalleryVideoFormValues): VideoFormData {
  const id = parseYouTubeInput(values.youtube_url);
  return {
    title: values.title.trim(),
    composer: values.composer.trim(),
    youtube_url: id ? youtubeWatchUrl(id) : values.youtube_url.trim(),
    performance_date: format(values.performance_date, "yyyy-MM-dd"),
    venue: values.venue.trim(),
    soloists: parseSoloists(values.soloists),
  };
}
