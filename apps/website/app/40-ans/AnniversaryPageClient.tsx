"use client";

import AnniversaryLanding from "@/components/anniversary/AnniversaryLanding";
import AnniversaryNavigation from "@/components/anniversary/AnniversaryNavigation";
import AnniversaryTimeline from "@/components/anniversary/AnniversaryTimeline";
import AudioMemories from "@/components/anniversary/AudioMemories";
import MemorySharing from "@/components/anniversary/MemorySharing";
import PhotoCollection from "@/components/anniversary/PhotoCollection";
import VideoGallery from "@/components/anniversary/VideoGallery";
import type { AnniversaryPageData } from "@/types/anniversary";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface AnniversaryPageClientProps {
  data: AnniversaryPageData;
}

export default function AnniversaryPageClient({
  data: initialData,
}: AnniversaryPageClientProps) {
  const [data, setData] = useState<AnniversaryPageData>(initialData);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to all anniversary table changes
    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // Hero (singleton - UPDATE only)
    const heroSub = supabase
      .channel("anniversary_hero_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "anniversary_hero",
        },
        (payload) => {
          setData((prev) => ({
            ...prev,
            hero: payload.new as typeof prev.hero,
          }));
        },
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => heroSub.unsubscribe() });

    // Hero Stats
    const heroStatsSub = supabase
      .channel("anniversary_hero_stats_changes")
      .on(
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
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (stats) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => heroStatsSub.unsubscribe() });

    // Navigation Cards
    const navCardsSub = supabase
      .channel("anniversary_navigation_cards_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_navigation_cards",
        },
        async () => {
          const { data: cards } = await supabase
            .from("anniversary_navigation_cards")
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (cards) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => navCardsSub.unsubscribe() });

    // Timeline Events
    const timelineSub = supabase
      .channel("anniversary_timeline_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_timeline_events",
        },
        async () => {
          const { data: events } = await supabase
            .from("anniversary_timeline_events")
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (events) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => timelineSub.unsubscribe() });

    // Videos
    const videosSub = supabase
      .channel("anniversary_videos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_videos",
        },
        async () => {
          const { data: videos } = await supabase
            .from("anniversary_videos")
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (videos) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => videosSub.unsubscribe() });

    // Audio Memories
    const audioSub = supabase
      .channel("anniversary_audio_memories_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_audio_memories",
        },
        async () => {
          const { data: audioMemories } = await supabase
            .from("anniversary_audio_memories")
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (audioMemories) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => audioSub.unsubscribe() });

    // Photos
    const photosSub = supabase
      .channel("anniversary_photos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_photos",
        },
        async () => {
          const { data: photos } = await supabase
            .from("anniversary_photos")
            .select("*")
            .eq("is_visible", true)
            .order("display_order", { ascending: true });

          if (photos) {
            setData((prev) => ({
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
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => photosSub.unsubscribe() });

    // Form Config (singleton - UPDATE only)
    const formConfigSub = supabase
      .channel("anniversary_form_config_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "anniversary_form_config",
        },
        (payload) => {
          setData((prev) => ({
            ...prev,
            formConfig: payload.new as typeof prev.formConfig,
          }));
        },
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => formConfigSub.unsubscribe() });

    // Memories (for featured memories - INSERT, UPDATE, DELETE)
    const memoriesSub = supabase
      .channel("anniversary_memories_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anniversary_memories",
        },
        async () => {
          // Refetch featured memories
          const { data: featuredMemories } = await supabase
            .from("anniversary_memories")
            .select("id, name, email, message, year, is_featured, created_at")
            .eq("is_approved", true)
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(10);

          if (featuredMemories) {
            setData((prev) => ({
              ...prev,
              featuredMemories: featuredMemories.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                message: m.message,
                year: m.year,
                is_featured: m.is_featured,
                created_at: m.created_at,
              })),
            }));
          }
        },
      )
      .subscribe();

    subscriptions.push({ unsubscribe: () => memoriesSub.unsubscribe() });

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [supabase]);

  return (
    <div className="bg-background min-h-screen">
      <AnniversaryLanding hero={data.hero} stats={data.heroStats} />
      <AnniversaryNavigation cards={data.navigationCards} />
      <AnniversaryTimeline events={data.timelineEvents} />
      <VideoGallery videos={data.videos} />
      <AudioMemories audioMemories={data.audioMemories} />
      <PhotoCollection photos={data.photos} />
      <MemorySharing
        config={data.formConfig}
        featuredMemories={data.featuredMemories}
      />
    </div>
  );
}
