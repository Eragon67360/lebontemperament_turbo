import { JsonLd } from "@/components/JsonLd";
import PhotoGallery from "@/components/PhotoGallery";
import { YoutubeVideos } from "@/components/YoutubeVideos";
import { breadcrumbJsonLd } from "@/utils/seo";
import { createClient } from "@/utils/supabase/server";
import { Video } from "@repo/domain/types/videos";
import { extractYouTubeId } from "@repo/domain/utils/youtube";
import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Galerie - Photos et Vidéos | Le Bon Tempérament",
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

// Generate VideoObject schema for videos
function generateVideoSchemas(videos: Video[]) {
  return videos.map((video) => {
    const videoId = extractYouTubeId(video.youtube_url);
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Use performance_date if available, otherwise created_at
    const uploadDate = formatDateWithTimezone(
      video.performance_date || video.created_at,
    );

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: `${video.title} par Le Bon Tempérament. Compositeur: ${video.composer}. Lieu: ${video.venue}.`,
      thumbnailUrl: thumbnailUrl,
      uploadDate: uploadDate,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      publisher: {
        "@type": "Organization",
        name: "Le Bon Tempérament",
        url: process.env.NEXT_PUBLIC_BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/logo",
        },
      },
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

async function getVideos(): Promise<Video[]> {
  try {
    const supabase = await createClient();
    const { data: videos, error } = await supabase
      .from("youtube_links")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching videos:", error);
      return [];
    }

    return (videos || []) as Video[]; // view-model: youtube_links nullability handled by UI defaults
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}

const Galerie = async () => {
  const videos = await getVideos();
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
                <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
                  Galerie
                </h1>
                <h2 className="text-title text-foreground leading-none font-bold">
                  Photos
                </h2>
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
            <PhotoGallery />
          </div>
        </div>

        <div id="videos">
          <div className="py-4 md:py-8 lg:py-16">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
                  Galerie
                </h1>
                <h2 className="text-title text-foreground leading-none font-bold">
                  Vidéos
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
