import { Metadata } from "next";

import AnniversaryLanding from "@/components/anniversary/AnniversaryLanding";
import AnniversaryNavigation from "@/components/anniversary/AnniversaryNavigation";
import AnniversaryTimeline from "@/components/anniversary/AnniversaryTimeline";
import AudioMemories from "@/components/anniversary/AudioMemories";
import MemorySharing from "@/components/anniversary/MemorySharing";
import PhotoCollection from "@/components/anniversary/PhotoCollection";
import VideoGallery from "@/components/anniversary/VideoGallery";

export const metadata: Metadata = {
  title: "40 ans du Bon Tempérament | Le Bon Tempérament",
  description:
    "Célébrons les 40 ans du Bon Tempérament ! Découvrez notre histoire, nos souvenirs, témoignages et moments mémorables à travers les décennies.",
  keywords:
    "Le Bon Tempérament, 40 ans, anniversaire, histoire, musique classique, Saverne, souvenirs, témoignages",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/40-ans`,
    siteName: "Le Bon Tempérament",
    title: "40 ans du Bon Tempérament - Célébration",
    description:
      "Célébrons les 40 ans du Bon Tempérament ! Découvrez notre histoire, nos souvenirs et témoignages.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/home-og.png",
        width: 1200,
        height: 630,
        alt: "40 ans du Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/40-ans",
  },
};

const AnniversaryPage = () => {
  return (
    <div className="bg-background min-h-screen">
      <AnniversaryLanding />
      <AnniversaryNavigation />
      <AnniversaryTimeline />
      <VideoGallery />
      <AudioMemories />
      <PhotoCollection />
      <MemorySharing />
    </div>
  );
};

export default AnniversaryPage;
