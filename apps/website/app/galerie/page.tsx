import PhotoGallery from "@/components/PhotoGallery";
import { YoutubeVideos } from "@/components/YoutubeVideos";
import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Explorez la galerie de Le Bon Tempérament pour une immersion dans nos moments musicaux les plus mémorables. Photos et vidéos de concerts, événements et répétitions, témoignant de notre passion pour la musique.",
  keywords:
    " Galerie Le Bon Tempérament, photos musique, vidéos concerts, événements musique française, moments musicaux",
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

// async function getVideos(): Promise<Video[]> {
//     const response = await fetch('/api/prochains-concerts')
//     const data = await response.json()

//     return data.json()
// }

const Galerie = () => {
  return (
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
              className="text-default-400 hover:text-default-500 flex items-center justify-center gap-2 rounded-lg p-2 text-xl font-light md:text-2xl lg:text-3xl"
            >
              <span>Voir vidéos </span> <FaArrowDown />
            </Link>
          </div>
          <hr className="border-divider mt-8" />
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
              className="text-default-400 hover:text-default-500 flex items-center justify-center gap-2 rounded-lg p-2 text-xl font-light md:text-2xl lg:text-3xl"
            >
              <span>Voir photos </span> <FaArrowUp />
            </Link>
          </div>

          <hr className="border-divider mt-8" />
        </div>
        <YoutubeVideos />
      </div>
    </div>
  );
};

export default Galerie;
