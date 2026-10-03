import { JsonLd } from "@/components/JsonLd";
import {
  getAnniversaryPageData,
  isAnniversaryFeatureEnabled,
} from "@/lib/anniversary";
import { checkAdminAuth } from "@/utils/auth";
import { breadcrumbJsonLd } from "@/utils/seo";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import AnniversaryPageClient from "./AnniversaryPageClient";

export const metadata: Metadata = {
  title: "40 ans de l'ensemble",
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

export const revalidate = 60; // Cache page for 60 seconds

export default async function AnniversaryPage() {
  const supabase = await createClient();
  const isEnabled = await isAnniversaryFeatureEnabled(supabase);

  // If feature is disabled, check if user is admin
  if (!isEnabled) {
    const { isAdmin } = await checkAdminAuth();

    // Only allow access if user is admin (preview mode): everyone else gets
    // a real 404 (status + noindex) instead of a redirect to /not-found.
    if (!isAdmin) {
      notFound();
    }
  }

  const data = await getAnniversaryPageData();

  if (!data) {
    // Show error state or fallback
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Erreur de chargement</h1>
          <p className="text-muted-foreground mt-2">
            Impossible de charger les données de la page anniversaire.
          </p>
        </div>
      </div>
    );
  }

  // Determine if this is preview mode (feature disabled but admin viewing)
  const isPreview = !isEnabled;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "40 ans du Bon Tempérament", path: "/40-ans" },
        ])}
      />
      <AnniversaryPageClient data={data} isPreview={isPreview} />
    </>
  );
}
