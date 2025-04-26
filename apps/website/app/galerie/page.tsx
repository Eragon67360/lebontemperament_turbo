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
    <div className="px-8 max-w-[1440px] w-full flex flex-col mb-32">
      <div id="photos">
        <div className="pt-16 pb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-title text-primary/50 font-light leading-none">
                Galerie
              </h1>
              <h2 className="text-title text-[#333] font-bold leading-none">
                Photos
              </h2>
            </div>
            <Link
              href="#videos"
              className=" text-[#C4C4C4] hover:text-[#c4c4c4a2] text-xl md:text-2xl lg:text-3xl font-light p-2 flex rounded-lg justify-center items-center gap-2"
            >
              <span>Voir vidéos </span> <FaArrowDown />
            </Link>
          </div>
          <hr className="mt-8" />
        </div>
        <div>
          <PhotoGallery />
        </div>
      </div>

      <div id="videos">
        <div className="py-16">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-title text-primary/50 font-light leading-none">
                Galerie
              </h1>
              <h2 className="text-title text-[#333] font-bold leading-none">
                Vidéos
              </h2>
            </div>
            <Link
              href="#photos"
              className=" text-[#C4C4C4] hover:text-[#c4c4c4a2] text-xl md:text-2xl lg:text-3xl font-light p-2 flex rounded-lg justify-center items-center gap-2"
            >
              <span>Voir photos </span> <FaArrowUp />
            </Link>
          </div>

          <hr className="mt-8" />
        </div>
        <YoutubeVideos />
      </div>
    </div>
  );
};

export default Galerie;
