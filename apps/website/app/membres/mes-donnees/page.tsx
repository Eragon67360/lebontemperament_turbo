import { MesDonnees } from "@/components/membres/MesDonnees";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes données",
  description:
    "Téléchargez vos données personnelles ou demandez la suppression de votre compte de l'espace membres du Bon Tempérament.",
  robots: { index: false, follow: false },
};

export default function MesDonneesPage() {
  return <MesDonnees />;
}
