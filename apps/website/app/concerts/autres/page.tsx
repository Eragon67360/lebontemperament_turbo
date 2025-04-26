import React from "react";
import CDsViewer from "@/components/cds/CDsViewer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CDs",
  description:
    "Découvrez les projets passionnants de l'ensemble vocal et instrumental Le Bon Tempérament, basé en Alsace. Nos initiatives embrassent des concerts, des tournées annuelles et des répétitions qui reflètent notre passion pour la musique et notre engagement envers la communauté. Explorez notre histoire depuis 1987, nos membres dévoués, et la façon unique dont nous partageons notre amour pour la musique. Rejoignez-nous pour célébrer l'esprit convivial et familial qui nous définit.",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/autres`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/concerts/autres",
  },
};

const page = () => {
  return (
    <div className=" mx-8 max-w-[1440px] w-full flex flex-col pb-8">
      <div className="py-16">
        <div>
          <h1 className="text-title text-primary/50 font-light leading-none">
            Concerts
          </h1>
          <h2 className="text-title text-[#333] font-bold leading-none">CDs</h2>
          <hr className="mt-8" />
        </div>
      </div>

      <CDsViewer />
    </div>
  );
};

export default page;
