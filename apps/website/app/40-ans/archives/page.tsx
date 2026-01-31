import { getArchives } from "@/lib/anniversary";
import { Metadata } from "next";
import ArchivesPageClient from "./ArchivesPageClient";

export const metadata: Metadata = {
  title: "Archives - 40 ans du Bon Tempérament | Le Bon Tempérament",
  description:
    "Explorez les archives historiques du Bon Tempérament : rapports d'Assemblée Générale, documents officiels, programmes de concerts et bien plus encore.",
  keywords:
    "archives, Le Bon Tempérament, documents historiques, Assemblée Générale, rapports, programmes",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/40-ans/archives`,
    siteName: "Le Bon Tempérament",
    title: "Archives - 40 ans du Bon Tempérament",
    description:
      "Explorez les archives historiques du Bon Tempérament : rapports, documents officiels et programmes.",
  },
  alternates: {
    canonical: "/40-ans/archives",
  },
};

// Cache page for 60 seconds
export const revalidate = 60;

export default async function ArchivesPage() {
  const archives = await getArchives();

  return <ArchivesPageClient archives={archives} />;
}
