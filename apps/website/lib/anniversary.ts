import {
  ANNIVERSARY_ARCHIVE_COLUMNS,
  ANNIVERSARY_AUDIO_MEMORY_COLUMNS,
  ANNIVERSARY_FORM_CONFIG_COLUMNS,
  ANNIVERSARY_HERO_COLUMNS,
  ANNIVERSARY_HERO_STAT_COLUMNS,
  ANNIVERSARY_NAVIGATION_CARD_COLUMNS,
  ANNIVERSARY_PHOTO_COLUMNS,
  ANNIVERSARY_TIMELINE_EVENT_COLUMNS,
  ANNIVERSARY_VIDEO_COLUMNS,
} from "@/lib/anniversaryColumns";
import {
  FEATURED_MEMORIES_LIMIT,
  PUBLIC_MEMORY_SELECT,
  toPublicMemory,
} from "@/lib/anniversaryMemories";
import type { AnniversaryPageData, Archive, Memory } from "@/types/anniversary";
import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export { ANNIVERSARY_FLAG_KEY } from "@/lib/featureFlags";

/**
 * The featured memories shown on `/40-ans`, public columns only.
 *
 * Row-level security lets visitors insert memories but not read them (only
 * admins may), so the anon key returns nothing here. The server reads the
 * approved, featured rows with the service role instead, restricted to the
 * public columns: the author's email never leaves the database this way.
 * Server-only: never call this from a client component.
 */
export async function getFeaturedMemories(): Promise<Memory[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("anniversary_memories")
      .select(PUBLIC_MEMORY_SELECT)
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(FEATURED_MEMORIES_LIMIT);

    if (error) {
      console.error("Error fetching featured memories:", error);
      return [];
    }

    return (data ?? []).map(toPublicMemory);
  } catch (error) {
    console.error("Error fetching featured memories:", error);
    return [];
  }
}

/**
 * Server-side read of the `anniversary_40_years` feature flag. Pass the
 * cookie-bound server client from pages, or the admin client from routes
 * that must stay cacheable (sitemap). Any error counts as "disabled".
 */
export async function isAnniversaryFeatureEnabled(
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("flag_key", "anniversary_40_years")
      .single();

    if (error) {
      console.error("Error fetching feature flag:", error);
      return false;
    }

    return data?.is_enabled || false;
  } catch (error) {
    console.error("Error fetching feature flag:", error);
    return false;
  }
}

/**
 * Fetches all anniversary page data from the database. Public rows only
 * (anon key, no cookies), so the pages can be cached with `revalidate`.
 */
export async function getAnniversaryPageData(): Promise<AnniversaryPageData | null> {
  try {
    const supabase = createPublicClient();

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
      featuredMemories,
    ] = await Promise.all([
      // Hero (singleton)
      supabase
        .from("anniversary_hero")
        .select(ANNIVERSARY_HERO_COLUMNS)
        .single(),

      // Hero Stats (visible only, ordered)
      supabase
        .from("anniversary_hero_stats")
        .select(ANNIVERSARY_HERO_STAT_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Navigation Cards (visible only, ordered)
      supabase
        .from("anniversary_navigation_cards")
        .select(ANNIVERSARY_NAVIGATION_CARD_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Timeline Events (visible only, ordered)
      supabase
        .from("anniversary_timeline_events")
        .select(ANNIVERSARY_TIMELINE_EVENT_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Videos (visible only, ordered)
      supabase
        .from("anniversary_videos")
        .select(ANNIVERSARY_VIDEO_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Audio Memories (visible only, ordered)
      supabase
        .from("anniversary_audio_memories")
        .select(ANNIVERSARY_AUDIO_MEMORY_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Photos (visible only, ordered)
      supabase
        .from("anniversary_photos")
        .select(ANNIVERSARY_PHOTO_COLUMNS)
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),

      // Form Config (singleton)
      supabase
        .from("anniversary_form_config")
        .select(ANNIVERSARY_FORM_CONFIG_COLUMNS)
        .single(),

      // Featured memories: public columns through the service role (see above)
      getFeaturedMemories(),
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
      featuredMemories,
    };
  } catch (error) {
    console.error("Error fetching anniversary data:", error);
    return null;
  }
}

/**
 * Fetches all visible archives from the database (anon key, no cookies).
 */
export async function getArchives(): Promise<Archive[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("anniversary_archives")
      .select(ANNIVERSARY_ARCHIVE_COLUMNS)
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
