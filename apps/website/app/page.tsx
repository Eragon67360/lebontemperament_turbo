import HomeContent from "@/components/HomeContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accueil | Le Bon Tempérament",
  description:
    "Découvrez Le Bon Tempérament, ensemble vocal et instrumental renommé à Saverne depuis 1987. Concerts de musique classique, opéras baroques, CDs et événements musicaux en Alsace. Rejoignez-nous pour vivre la passion de la musique classique.",
  keywords:
    "Le Bon Tempérament, ensemble vocal instrumental, musique classique Saverne, concerts baroque, opéra classique, chœur Alsace, Simone Duclos, musique française",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    siteName: "Le Bon Tempérament",
    title: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
    description:
      "Découvrez Le Bon Tempérament, ensemble vocal et instrumental renommé à Saverne depuis 1987. Concerts de musique classique, opéras baroques et événements musicaux.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/home-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

const Home = () => {
  return (
    <>
      <HomeContent />;
    </>
  );
};

export default Home;
