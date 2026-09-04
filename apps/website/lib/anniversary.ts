import type { AnniversaryPageData, Archive } from "@/types/anniversary";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetches all anniversary page data from the database
 * Used by Server Components with Next.js caching
 */
export async function getAnniversaryPageData(): Promise<AnniversaryPageData | null> {
  try {
    const supabase = await createClient();

    // Fetch all data in parallel for better performance
    const [
      heroResult,
      heroStatsResult,
      navigationCardsResult,
      timelineEventsResult,
      videosResult,
      audioMemoriesResult,
      photosResult,
      formConfigResult,
      memoriesResult,
    ] = await Promise.all([
      // Hero (singleton)
      supabase.from("anniversary_hero").select("*").single(),

      // Hero Stats (visible only, ordered)
      supabase
        .from("anniversary_hero_stats")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Navigation Cards (visible only, ordered)
      supabase
        .from("anniversary_navigation_cards")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Timeline Events (visible only, ordered)
      supabase
        .from("anniversary_timeline_events")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Videos (visible only, ordered)
      supabase
        .from("anniversary_videos")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Audio Memories (visible only, ordered)
      supabase
        .from("anniversary_audio_memories")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Photos (visible only, ordered)
      supabase
        .from("anniversary_photos")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Form Config (singleton)
      supabase.from("anniversary_form_config").select("*").single(),

      // Featured Memories (approved + featured only, ordered by creation date)
      supabase
        .from("anniversary_memories")
        .select("id, name, email, message, year, is_featured, created_at")
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(10), // Limit to 10 featured memories
    ]);

    // Check for critical errors (hero and form config are required)
    if (heroResult.error) {
      console.error("Error fetching hero:", heroResult.error);
      return null;
    }

    if (formConfigResult.error) {
      console.error("Error fetching form config:", formConfigResult.error);
      return null;
    }

    // Log non-critical errors but continue
    if (heroStatsResult.error)
      console.error("Error fetching hero stats:", heroStatsResult.error);
    if (navigationCardsResult.error)
      console.error(
        "Error fetching navigation cards:",
        navigationCardsResult.error,
      );
    if (timelineEventsResult.error)
      console.error(
        "Error fetching timeline events:",
        timelineEventsResult.error,
      );
    if (videosResult.error)
      console.error("Error fetching videos:", videosResult.error);
    if (audioMemoriesResult.error)
      console.error(
        "Error fetching audio memories:",
        audioMemoriesResult.error,
      );
    if (photosResult.error)
      console.error("Error fetching photos:", photosResult.error);
    if (memoriesResult.error)
      console.error("Error fetching memories:", memoriesResult.error);

    // Construct response with fallbacks for optional data
    return {
      hero: heroResult.data as AnniversaryPageData["hero"], // view-model: CMS enforces non-null hero fields
      heroStats: heroStatsResult.data || [],
      navigationCards: navigationCardsResult.data || [],
      timelineEvents: timelineEventsResult.data || [],
      videos: videosResult.data || [],
      audioMemories: audioMemoriesResult.data || [],
      photos: photosResult.data || [],
      formConfig: formConfigResult.data as AnniversaryPageData["formConfig"], // view-model: CMS enforces non-null form labels
      featuredMemories: (memoriesResult.data ||
        []) as AnniversaryPageData["featuredMemories"], // view-model: featured filter guarantees non-null flags
    };
  } catch (error) {
    console.error("Error fetching anniversary data:", error);
    return null;
  }
}

/**
 * Fetches all visible archives from the database
 * Used by Server Components with Next.js caching
 */
export async function getArchives(): Promise<Archive[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("anniversary_archives")
      .select("*")
      .eq("is_visible", true)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching archives:", error);
      return [];
    }

    // Map database fields to Archive type
    return (
      data?.map((archive) => ({
        id: archive.id,
        title: archive.title,
        description: archive.description,
        year: archive.year,
        type: archive.type as Archive["type"],
        theme: archive.theme,
        file_url: archive.file_url,
        file_size: archive.file_size,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching archives:", error);
    return [];
  }
}
