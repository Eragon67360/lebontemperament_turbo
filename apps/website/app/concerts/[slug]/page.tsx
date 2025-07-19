import ConcertPageClient from "@/components/ConcertPageClient";
import projects from "@/public/json/projects.json";
import { Project } from "@/types/projects";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Concert non trouvé",
      description: "Le concert n'a pas pu être trouvé dans la base de données",
      alternates: {
        canonical: `/concerts/404`,
      },
    };
  }

  return {
    title: `${project.name} ${project.subName}`,
    description: `${project?.explanation}`,
    keywords:
      "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${slug}`,
      siteName: "Le Bon Tempérament",
      title: `${project.name} ${project.subName} - Le Bon Tempérament`,
      description: `${project?.explanation}`,
      images: [
        {
          url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
          width: 1200,
          height: 630,
          alt: `${project.name} ${project.subName} - Le Bon Tempérament`,
        },
      ],
    },
    alternates: {
      canonical: `/concerts/${slug}`,
    },
  };
}

// Generate structured data for events
function generateStructuredData(project: Project, slug: string) {
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${project.name} ${project.subName}`,
    description: project.explanation,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${slug}`,
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
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "fr-FR",
    location: {
      "@type": "Place",
      name: "Saverne, France",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Saverne",
        addressCountry: "FR",
      },
    },
  };

  return eventSchema;
}

export default async function ConcertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return <div>Concert non trouvé</div>;
  }

  const structuredData = generateStructuredData(project, slug);

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <ConcertPageClient project={project} />
    </>
  );
}
