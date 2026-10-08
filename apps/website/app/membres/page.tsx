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
  },
};

const Membres = () => {
  return (
    <div className="container m-auto flex w-full flex-col overflow-x-hidden px-0 md:px-2">
      <MembresLandingPage />
    </div>
  );
};

export default Membres;
