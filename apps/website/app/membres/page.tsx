import { MembresLandingPage } from "@/components/membres/MembresLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membres",
  description:
    "Accédez à l'espace Membres du Bon Tempérament, accédez à de multiples ressources comme des partitions, des gazettes, etc... ",
  keywords: "Espace membres, gazette, travail, règlement, drive",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/membres`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/membres-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
};

const Membres = () => {
  return (
    <div className="container m-auto px-2 flex flex-col size-full h-full overflow-x-hidden">
      <MembresLandingPage />
    </div>
  );
};

export default Membres;
