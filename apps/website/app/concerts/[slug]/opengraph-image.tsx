import {
  brandImage,
  OG_CONTENT_TYPE,
  OG_SIZE,
  storyImage,
} from "@/lib/og/cards";
import { fetchStory } from "@/lib/og/data";

// Rendered on demand for each story and cached like the story page.
export const revalidate = 300;

export const alt = "Histoire de concert du Bon Tempérament";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await fetchStory(slug);
  return story ? storyImage(story, `/concerts/${slug}`) : brandImage();
}

// No story is prerendered: each card is drawn on its first request, then
// served from the cache like the story page (ISR).
export function generateStaticParams() {
  return [];
}
