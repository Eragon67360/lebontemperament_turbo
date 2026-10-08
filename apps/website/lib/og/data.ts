import { cloudinaryPublicId } from "@/lib/cloudinaryImage";
import { createPublicClient } from "@/utils/supabase/public";
import { parisToday } from "@repo/domain/utils/parisDay";
import type { ConcertStory, NextConcert } from "./cards";
import { clampText, concertDateParts, concertTitle, storyYear } from "./text";

/**
 * Data behind the dynamic link-preview cards. Public data only (anon key,
 * same rows an anonymous visitor reads). Any failure (CI builds with
 * placeholder credentials, a Cloudinary hiccup) falls back to a card
 * without the missing piece rather than a broken image.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlt2j3dld";

/** The first concert from today on (Paris day), as the agenda shows it. */
export async function fetchNextConcert(): Promise<NextConcert | null> {
  try {
    const { data } = await createPublicClient()
      .from("concerts")
      .select("name, place, date, time")
      .gte("date", parisToday())
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const parts = concertDateParts(data.date, data.time);
    return {
      title: clampText(concertTitle(data.name, data.place), 60),
      day: parts.day,
      month: parts.month,
      year: parts.year,
      when: parts.line,
      place: clampText(data.place, 56),
    };
  } catch (error) {
    console.error("Open Graph: next concert unavailable", error);
    return null;
  }
}

/** A concert story's card data; `null` for an unknown slug. */
export async function fetchStory(slug: string): Promise<ConcertStory | null> {
  try {
    const { data } = await createPublicClient()
      .from("projects")
      .select("name, sub_name, date, banniere")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return {
      title: clampText(data.name, 40),
      subtitle: data.sub_name ? clampText(data.sub_name, 60) : null,
      year: storyYear(data.date),
      banner: data.banniere ? await fetchBanner(data.banniere) : null,
    };
  } catch (error) {
    console.error("Open Graph: story unavailable", error);
    return null;
  }
}

/** The banner cropped to the card's 1200 × 360 strip, as a data URL. */
async function fetchBanner(banniere: string): Promise<string | null> {
  const id = encodeURI(cloudinaryPublicId(banniere)).replace(/,/g, "%2C");
  const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,g_center,w_1200,h_360/f_jpg/q_80/v1/${id}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
