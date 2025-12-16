import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import AnniversaryPageClient from "./AnniversaryPageClient";

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

async function getAnniversaryFeatureStatus() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("flag_key", "anniversary_40_years")
      .single();

    if (error) {
      console.error("Error fetching feature flag:", error);
      return false;
    }

    return data?.is_enabled || false;
  } catch (error) {
    console.error("Error fetching feature flag:", error);
    return false;
  }
}

export default async function AnniversaryPage() {
  const isEnabled = await getAnniversaryFeatureStatus();

  // Server-side redirect when feature is disabled
  if (!isEnabled) {
    redirect("/not-found");
  }

  return <AnniversaryPageClient />;
}
