import ConcertsClient from "@/components/concerts/ConcertsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concerts",
  description:
    "Découvrez les projets passionnants de l'ensemble vocal et instrumental Le Bon Tempérament, basé en Alsace. Nos initiatives embrassent des concerts, des tournées annuelles et des répétitions qui reflètent notre passion pour la musique et notre engagement envers la communauté. Explorez notre histoire depuis 1987, nos membres dévoués, et la façon unique dont nous partageons notre amour pour la musique. Rejoignez-nous pour célébrer l'esprit convivial et familial qui nous définit.",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
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
    canonical: "/concerts",
  },
};

// function truncateText(text: string, limit: number) {
//   const wordArray = text.split(' ');
//   if (wordArray.length > limit) {
//     return wordArray.slice(0, limit).join(' ') + '...';
//   }
//   return text;
// }

const Projets = () => {
  return <ConcertsClient />;
};

export default Projets;
