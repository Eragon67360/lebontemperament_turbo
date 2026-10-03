import { getArchives, isAnniversaryFeatureEnabled } from "@/lib/anniversary";
import { checkAdminAuth } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ArchivesPageClient from "./ArchivesPageClient";

export const metadata: Metadata = {
  title: "Archives des 40 ans",
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
  // Same gate as /40-ans: public only while the anniversary flag is on,
  // admins may preview; everyone else gets a real 404.
  const supabase = await createClient();
  const isEnabled = await isAnniversaryFeatureEnabled(supabase);

  if (!isEnabled) {
    const { isAdmin } = await checkAdminAuth();
    if (!isAdmin) {
      notFound();
    }
  }

  const archives = await getArchives();

  return (
    <ArchivesPageClient archives={archives} showAnniversaryLink={isEnabled} />
  );
}
