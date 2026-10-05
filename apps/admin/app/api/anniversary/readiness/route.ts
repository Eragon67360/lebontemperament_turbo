// GET /api/anniversary/readiness: the facts behind the publication checklist
// of « Vue d'ensemble et publication », read-only, admin only. One request
// instead of ten from the browser; the computation itself is pure
// (utils/anniversary/readiness.ts) and unit-tested.
import {
  computeReadiness,
  type ReadinessFacts,
} from "@/utils/anniversary/readiness";
import { isPageSectionId } from "@/utils/anniversary/sections";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type VisibleRow = { is_visible: boolean | null };

function counts(rows: VisibleRow[] | null) {
  const list = rows ?? [];
  return {
    total: list.length,
    visible: list.filter((row) => row.is_visible !== false).length,
  };
}

export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = await createClient();
    const [
      hero,
      heroStats,
      navigation,
      timeline,
      videos,
      audio,
      photos,
      archives,
      form,
      memories,
    ] = await Promise.all([
      supabase
        .from("anniversary_hero")
        .select("hero_number, hero_subtitle, cta_text, cta_target_section")
        .limit(1)
        .maybeSingle(),
      supabase.from("anniversary_hero_stats").select("is_visible"),
      supabase
        .from("anniversary_navigation_cards")
        .select("is_visible, target_section_id"),
      supabase.from("anniversary_timeline_events").select("is_visible, year"),
      supabase.from("anniversary_videos").select("is_visible"),
      supabase.from("anniversary_audio_memories").select("is_visible"),
      supabase.from("anniversary_photos").select("is_visible"),
      supabase.from("anniversary_archives").select("is_visible"),
      supabase
        .from("anniversary_form_config")
        .select("section_title, section_description, is_enabled")
        .limit(1)
        .maybeSingle(),
      supabase.from("anniversary_memories").select("is_approved"),
    ]);

    const failed = [
      hero,
      heroStats,
      navigation,
      timeline,
      videos,
      audio,
      photos,
      archives,
      form,
      memories,
    ].find((result) => result.error);
    if (failed?.error) {
      console.error("Error reading readiness facts:", failed.error);
      return NextResponse.json(
        { error: "Failed to compute readiness" },
        { status: 500 },
      );
    }

    const facts: ReadinessFacts = {
      hero: {
        exists: !!hero.data,
        complete: !!(
          hero.data?.hero_number?.trim() &&
          hero.data?.hero_subtitle?.trim() &&
          hero.data?.cta_text?.trim()
        ),
        targetKnown: isPageSectionId(hero.data?.cta_target_section),
      },
      heroStats: counts(heroStats.data),
      navigation: {
        ...counts(navigation.data),
        unknownTargets: (navigation.data ?? []).filter(
          (row) => !isPageSectionId(row.target_section_id),
        ).length,
      },
      timeline: {
        ...counts(timeline.data),
        withoutYear: (timeline.data ?? []).filter((row) => !row.year).length,
      },
      videos: counts(videos.data),
      audio: counts(audio.data),
      photos: counts(photos.data),
      archives: counts(archives.data),
      form: {
        exists: !!form.data,
        enabled: form.data?.is_enabled !== false,
        complete: !!(
          form.data?.section_title?.trim() &&
          form.data?.section_description?.trim()
        ),
      },
      memories: {
        pending: (memories.data ?? []).filter((row) => !row.is_approved).length,
        approved: (memories.data ?? []).filter((row) => row.is_approved).length,
      },
    };

    return NextResponse.json({
      facts,
      ...computeReadiness(facts),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/anniversary/readiness:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
