import { MembresLandingPage } from "@/components/membres/MembresLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace membres",
  description:
    "Accédez à l'espace Membres du Bon Tempérament, accédez à de multiples ressources comme des partitions, des gazettes, etc... ",
  keywords: "Espace membres, gazette, travail, règlement, drive",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/membres`,
    siteName: "Le Bon Tempérament",
  },
};

const Membres = () => {
  return <MembresLandingPage />;
};

export default Membres;
