import { JsonLd } from "@/components/JsonLd";
import PhotoGallery from "@/components/PhotoGallery";
import { YoutubeVideos } from "@/components/YoutubeVideos";
import { tryGetGalleryImages } from "@/lib/galleryImages";
import { breadcrumbJsonLd, organizationRef } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import { Video } from "@repo/domain/types/videos";
import { extractYouTubeId } from "@repo/domain/utils/youtube";
import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

// Public data only (anon key, no cookies): prerendered and served from the
// cache for five minutes, or until the admin's edit calls /api/revalidate.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Galerie - Photos et vidéos",
  description:
    "Galerie photos et vidéos de Le Bon Tempérament : concerts, événements et répétitions. Découvrez nos performances musicales à Saverne et en Alsace.",
  keywords:
    "galerie Le Bon Tempérament, photos concerts musique classique, vidéos ensemble vocal Saverne, galerie photos musique Alsace",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/galerie`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/galerie-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/galerie",
  },
};

// Helper function to format date as ISO 8601 with timezone
function formatDateWithTimezone(dateString: string): string {
  if (!dateString) return new Date().toISOString();

  // If the date string is already in ISO format with timezone, return it
  if (
    dateString.includes("T") &&
    (dateString.includes("Z") || dateString.includes("+"))
  ) {
    return dateString;
  }

  // Parse the date string and convert to ISO 8601 with timezone
  // Handle date-only strings (YYYY-MM-DD) by adding time and timezone
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  // Return ISO 8601 format with timezone (UTC)
  return date.toISOString();
}

// What the schema below reads; the list itself is loaded by YoutubeVideos.
const GALLERY_VIDEO_COLUMNS =
  "id, title, composer, venue, youtube_url, performance_date, created_at";
type GalleryVideo = Pick<
  Video,
  | "id"
  | "title"
  | "composer"
  | "venue"
  | "youtube_url"
  | "performance_date"
  | "created_at"
>;

// Generate VideoObject schema for videos
function generateVideoSchemas(videos: GalleryVideo[]) {
  return videos.map((video) => {
    const videoId = extractYouTubeId(video.youtube_url);
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Use performance_date if available, otherwise created_at
    const uploadDate = formatDateWithTimezone(
      video.performance_date || video.created_at,
    );

    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: `${video.title} par Le Bon Tempérament. Compositeur: ${video.composer}. Lieu: ${video.venue}.`,
      thumbnailUrl: thumbnailUrl,
      uploadDate: uploadDate,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      publisher: organizationRef(),
      ...(video.composer && {
        creator: {
          "@type": "Person",
          name: video.composer,
        },
      }),
    };

    // Only include duration if we have valid duration data
    // Since we don't have duration, we omit it rather than using invalid "PT0M0S"
    // Google prefers no duration over invalid duration

    return schema;
  });
}

async function getVideos(): Promise<GalleryVideo[]> {
  try {
    const supabase = createPublicClient();
    const { data: videos, error } = await supabase
      .from("youtube_links")
      .select(GALLERY_VIDEO_COLUMNS)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching videos:", error);
      return [];
    }

    return (videos || []) as GalleryVideo[]; // view-model: youtube_links nullability handled by UI defaults
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}

const Galerie = async () => {
  // The Cloudinary listings are cached for an hour (lib/galleryImages.ts);
  // when one is unavailable the gallery loads that folder in the browser.
  const [videos, concertPhotos, lifePhotos] = await Promise.all([
    getVideos(),
    tryGetGalleryImages("concerts"),
    tryGetGalleryImages("vie_bt"),
  ]);
  const videoSchemas = generateVideoSchemas(videos);

  return (
    <>
      {/* VideoObject Schemas */}
      {videoSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Galerie", path: "/galerie" }])}
      />
      <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
        <div id="photos">
          <div className="">
            <div className="flex items-end justify-between">
              <div>
                <h1>
                  <span className="text-title text-primary-400 dark:text-primary block leading-none font-light">
                    Galerie
                  </span>
                  <span className="text-title text-foreground block leading-none font-bold">
                    Photos
                  </span>
                </h1>
              </div>
              <Link
                href="#videos"
                className="text-muted hover:text-muted flex items-center justify-center gap-2 rounded-lg p-2 text-xl font-light md:text-2xl lg:text-3xl"
              >
                <span>Voir vidéos </span> <FaArrowDown />
              </Link>
            </div>
            <hr className="border-separator mt-8" />
          </div>
          <div>
            <PhotoGallery
              initialConcerts={concertPhotos}
              initialVieBT={lifePhotos}
            />
          </div>
        </div>

        <div id="videos">
          <div className="py-4 md:py-8 lg:py-16">
            <div className="flex items-end justify-between">
              <div>
                <h2>
                  <span className="text-title text-primary-400 dark:text-primary block leading-none font-light">
                    Galerie
                  </span>
                  <span className="text-title text-foreground block leading-none font-bold">
                    Vidéos
                  </span>
                </h2>
              </div>
              <Link
                href="#photos"
                className="text-muted hover:text-muted flex items-center justify-center gap-2 rounded-lg p-2 text-xl font-light md:text-2xl lg:text-3xl"
              >
                <span>Voir photos </span> <FaArrowUp />
              </Link>
            </div>

            <hr className="border-separator mt-8" />
          </div>
          <YoutubeVideos />
        </div>
      </div>
    </>
  );
};

export default Galerie;
