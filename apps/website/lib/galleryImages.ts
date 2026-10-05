import { cloudinary } from "@/cloudinary.config";
import { CACHE_TAGS } from "@/lib/cacheTags";
import type { ImageResourceProps, PhotoData } from "@/utils/types";
import { unstable_cache } from "next/cache";

export const GALLERY_FOLDERS = {
  concerts: "Photo de concert",
  vie_bt: "Photo de la vie de l'ensemble",
} as const;

export type GalleryFolder = keyof typeof GALLERY_FOLDERS;

export function isGalleryFolder(
  folder: string | null | undefined,
): folder is GalleryFolder {
  return typeof folder === "string" && folder in GALLERY_FOLDERS;
}

/**
 * Lists one gallery folder through the Cloudinary Admin API (rate-limited
 * per hour and shared with the admin's uploads), cached for an hour per
 * folder. The admin's gallery uploads and deletes expire the tag through
 * `POST /api/revalidate`. Errors propagate: nothing is cached for them.
 */
export const getGalleryImages = unstable_cache(
  async (folder: GalleryFolder): Promise<PhotoData[]> => {
    const label = GALLERY_FOLDERS[folder];
    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: `Site/galerie/${folder}`,
      max_results: 50,
    });

    return resources.resources.map(
      (resource: ImageResourceProps, index: number) => ({
        key: resource.public_id,
        src: resource.secure_url,
        width: resource.width,
        height: resource.height,
        // ponytail: generic fallback until Cloudinary DAM alt text is backfilled (context.custom.alt)
        alt: `${label} ${index + 1} — Le Bon Tempérament`,
      }),
    );
  },
  ["gallery-images"],
  { tags: [CACHE_TAGS.galleryImages], revalidate: 3600 },
);

/**
 * Same listing for server rendering: `undefined` on failure (build with
 * placeholder credentials, Cloudinary outage) so the page can fall back to
 * loading the folder in the browser instead of failing the render.
 */
export async function tryGetGalleryImages(
  folder: GalleryFolder,
): Promise<PhotoData[] | undefined> {
  try {
    return await getGalleryImages(folder);
  } catch (error) {
    console.error(`Error listing gallery folder ${folder}:`, error);
    return undefined;
  }
}
