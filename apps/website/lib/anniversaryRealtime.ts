/**
 * Live updates for `/40-ans`. One Realtime channel carries a
 * `postgres_changes` listener per CMS table, so an open tab holds one
 * channel join instead of one per table (Supabase caps concurrent
 * connections and joins per plan). The memories table is only followed in
 * the admin preview: row-level security keeps it from visitors and members,
 * so their listener could never fire. The returned function removes the
 * channel, which leaves it and tears it down.
 *
 * Kept out of the component so the wiring can be unit-tested with a fake
 * client (`anniversaryRealtime.test.ts`).
 */

import {
  ANNIVERSARY_AUDIO_MEMORY_COLUMNS,
  ANNIVERSARY_HERO_STAT_COLUMNS,
  ANNIVERSARY_NAVIGATION_CARD_COLUMNS,
  ANNIVERSARY_PHOTO_COLUMNS,
  ANNIVERSARY_TIMELINE_EVENT_COLUMNS,
  ANNIVERSARY_VIDEO_COLUMNS,
} from "@/lib/anniversaryColumns";
import type { AnniversaryPageData, Memory } from "@/types/anniversary";
import type { createClient } from "@/utils/supabase/client";

type AnniversaryClient = ReturnType<typeof createClient>;

/** Applies a state transition, like React's `setState` with an updater. */
export type AnniversaryPageUpdate = (
  updater: (previous: AnniversaryPageData) => AnniversaryPageData,
) => void;

export interface AnniversaryRealtimeOptions {
  /** Admin preview of the page while the feature flag is off. */
  isPreview: boolean;
  update: AnniversaryPageUpdate;
}

/**
 * Subscribes to the anniversary tables and returns the cleanup that
 * removes the channel.
 */
export function subscribeToAnniversaryChanges(
  supabase: AnniversaryClient,
  { isPreview, update }: AnniversaryRealtimeOptions,
): () => void {
  // A topic of its own per subscription: a channel that is still leaving
  // (a quick return to the page) is never handed back for the new join.
  const channel = supabase.channel(
    `anniversary-page-${Math.random().toString(36).slice(2)}`,
  );

  // Hero (singleton - UPDATE only)
  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "anniversary_hero",
    },
    (payload) => {
      update((prev) => ({
        ...prev,
        hero: payload.new as typeof prev.hero,
      }));
    },
  );

  // Hero Stats
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_hero_stats",
    },
    async () => {
      // Refetch visible stats
      const { data: stats } = await supabase
        .from("anniversary_hero_stats")
        .select(ANNIVERSARY_HERO_STAT_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (stats) {
        update((prev) => ({
          ...prev,
          heroStats: stats.map((s) => ({
            id: s.id,
            icon_name: s.icon_name,
            number: s.number,
            label: s.label,
            display_order: s.display_order,
          })),
        }));
      }
    },
  );

  // Navigation Cards
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_navigation_cards",
    },
    async () => {
      const { data: cards } = await supabase
        .from("anniversary_navigation_cards")
        .select(ANNIVERSARY_NAVIGATION_CARD_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (cards) {
        update((prev) => ({
          ...prev,
          navigationCards: cards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            icon_name: c.icon_name,
            target_section_id: c.target_section_id,
            display_order: c.display_order,
          })),
        }));
      }
    },
  );

  // Timeline Events
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_timeline_events",
    },
    async () => {
      const { data: events } = await supabase
        .from("anniversary_timeline_events")
        .select(ANNIVERSARY_TIMELINE_EVENT_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (events) {
        update((prev) => ({
          ...prev,
          timelineEvents: events.map((e) => ({
            id: e.id,
            year: e.year,
            title: e.title,
            description: e.description,
            icon_name: e.icon_name,
            display_order: e.display_order,
          })),
        }));
      }
    },
  );

  // Videos
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_videos",
    },
    async () => {
      const { data: videos } = await supabase
        .from("anniversary_videos")
        .select(ANNIVERSARY_VIDEO_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (videos) {
        update((prev) => ({
          ...prev,
          videos: videos.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            thumbnail_url: v.thumbnail_url,
            video_url: v.video_url,
            year: v.year,
            category: v.category,
            display_order: v.display_order,
          })),
        }));
      }
    },
  );

  // Audio Memories
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_audio_memories",
    },
    async () => {
      const { data: audioMemories } = await supabase
        .from("anniversary_audio_memories")
        .select(ANNIVERSARY_AUDIO_MEMORY_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (audioMemories) {
        update((prev) => ({
          ...prev,
          audioMemories: audioMemories.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            speaker_name: a.speaker_name,
            year: a.year,
            duration: a.duration,
            audio_url: a.audio_url,
            display_order: a.display_order,
          })),
        }));
      }
    },
  );

  // Photos
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "anniversary_photos",
    },
    async () => {
      const { data: photos } = await supabase
        .from("anniversary_photos")
        .select(ANNIVERSARY_PHOTO_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (photos) {
        update((prev) => ({
          ...prev,
          photos: photos.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            year: p.year,
            category: p.category,
            image_url: p.image_url,
            display_order: p.display_order,
          })),
        }));
      }
    },
  );

  // Form Config (singleton - UPDATE only)
  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "anniversary_form_config",
    },
    (payload) => {
      update((prev) => ({
        ...prev,
        formConfig: payload.new as typeof prev.formConfig,
      }));
    },
  );

  // Memories (for featured memories - INSERT, UPDATE, DELETE), admin
  // preview only: the table is hidden from everyone else by RLS.
  if (isPreview) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "anniversary_memories",
      },
      async () => {
        // Refetch through the server, which returns the public columns
        // only. On any failure the memories already rendered stay as they
        // are.
        try {
          const response = await fetch("/api/anniversary/featured-memories");
          if (!response.ok) return;
          const { memories } = (await response.json()) as {
            memories: Memory[];
          };
          if (Array.isArray(memories)) {
            update((prev) => ({ ...prev, featuredMemories: memories }));
          }
        } catch (error) {
          console.error("Error refetching featured memories:", error);
        }
      },
    );
  }

  channel.subscribe((status, error) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error(`[40-ans] Realtime ${status}`, error);
    }
  });

  return () => {
    // Leaves the channel and tears it down (pushes, timers, bindings).
    void supabase.removeChannel(channel);
  };
}
