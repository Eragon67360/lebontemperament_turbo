import ConcertsClient from "@/components/concerts/ConcertsClient";
import { DatabaseProject } from "@/types/projects";
import { transformProjectForFrontend } from "@/utils/projects";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

// Generate CollectionPage schema for concerts listing
async function generateCollectionPageSchema() {
  try {
    const supabase = await createClient();
    const { data: dbProjects } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: false })
      .order("date", { ascending: false });

    if (!dbProjects) {
      return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Concerts - Le Bon Tempérament",
        description:
          "Collection de concerts et événements musicaux de l'ensemble vocal et instrumental Le Bon Tempérament à Saverne, Alsace",
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: 0,
          itemListElement: [],
        },
        publisher: {
          "@type": "Organization",
          name: "Le Bon Tempérament",
          url: process.env.NEXT_PUBLIC_BASE_URL,
        },
      };
    }

    const projects = dbProjects.map((p: DatabaseProject) =>
      transformProjectForFrontend(p),
    );

    const concerts = projects.map((project) => ({
      "@type": "MusicEvent",
      name: `${project.name} ${project.subName || ""}`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${project.slug}`,
      startDate: project.date,
      description: project.explanation,
      organizer: {
        "@type": "Organization",
        name: "Le Bon Tempérament",
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
      performer: {
        "@type": "MusicGroup",
        name: "Le Bon Tempérament",
        description: "Ensemble vocal et instrumental",
      },
      eventStatus: "https://schema.org/EventScheduled",
    }));

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Concerts - Le Bon Tempérament",
      description:
        "Collection de concerts et événements musicaux de l'ensemble vocal et instrumental Le Bon Tempérament à Saverne, Alsace",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: concerts.length,
        itemListElement: concerts.map((concert, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: concert,
        })),
      },
      publisher: {
        "@type": "Organization",
        name: "Le Bon Tempérament",
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
    };
  } catch (error) {
    console.error("Error generating collection schema:", error);
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Concerts - Le Bon Tempérament",
      description:
        "Collection de concerts et événements musicaux de l'ensemble vocal et instrumental Le Bon Tempérament à Saverne, Alsace",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 0,
        itemListElement: [],
      },
      publisher: {
        "@type": "Organization",
        name: "Le Bon Tempérament",
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
    };
  }
}

export const metadata: Metadata = {
  title: "Concerts - Le Bon Tempérament",
  description:
    "Découvrez tous les concerts et événements de l'ensemble vocal et instrumental Le Bon Tempérament à Saverne. Musique classique, opéra baroque et tournées musicales depuis 1987.",
  keywords:
    "concerts musique classique Saverne, événements musicaux Alsace, opéra baroque, tournées musicales, Le Bon Tempérament concerts",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
    siteName: "Le Bon Tempérament",
    title: "Concerts - Le Bon Tempérament",
    description:
      "Découvrez tous les concerts et événements de l'ensemble vocal et instrumental Le Bon Tempérament.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
        width: 800,
        height: 600,
        alt: "Concerts Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/concerts",
  },
};

const Projets = async () => {
  const collectionSchema = await generateCollectionPageSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <ConcertsClient />
    </>
  );
};

export default Projets;
