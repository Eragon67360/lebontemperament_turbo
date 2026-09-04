import ConcertsClient from "@/components/concerts/ConcertsClient";
import { JsonLd } from "@/components/JsonLd";
import { DatabaseProject } from "@/types/projects";
import { breadcrumbJsonLd } from "@/utils/seo";
import { createClient } from "@/utils/supabase/server";
import { Concert } from "@repo/domain/types/concerts";
import { transformProjectForFrontend } from "@repo/domain/utils/projects";
import type { Metadata } from "next";

// --- Metadata Configuration ---
export const metadata: Metadata = {
  title: "Concerts de Musique Classique en Alsace",
  description:
    "Consultez les prochains concerts, tournées et rendez-vous publics du Bon Tempérament à Saverne, puis découvrez les histoires de nos concerts.",
  keywords:
    "concerts musique classique Saverne, événements musicaux Alsace, opéra baroque, tournées musicales, Le Bon Tempérament concerts",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
    siteName: "Le Bon Tempérament",
    title: "Agenda des concerts - Le Bon Tempérament",
    description:
      "Prochains concerts, tournées et rendez-vous publics du Bon Tempérament.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
        width: 800,
        height: 600,
        alt: "Agenda des concerts du Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/concerts",
  },
};

// Generate structured data from actual upcoming agenda occurrences.
function generateSchema(concerts: Concert[]) {
  const musicEvents = concerts.map((concert) => ({
    "@type": "MusicEvent",
    name: concert.name || `Concert à ${concert.place}`,
    url:
      concert.related_link ||
      `${process.env.NEXT_PUBLIC_BASE_URL}/concerts#agenda`,
    startDate: `${concert.date}T${concert.time}`,
    description: concert.additional_informations || undefined,
    location: {
      "@type": "Place",
      name: concert.place,
    },
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
    image:
      "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Agenda des concerts - Le Bon Tempérament",
    description:
      "Prochains concerts et tournées de l'ensemble vocal et instrumental Le Bon Tempérament",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: musicEvents.length,
      itemListElement: musicEvents.map((concert, index) => ({
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
}

// --- Helper: Fetch All Data ---
async function getPageData() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Fetch all required data in parallel for optimal performance
  const [
    { data: dbProjects },
    { data: concerts },
    { data: tours },
    { data: events },
    { data: rehearsals },
  ] = await Promise.all([
    // Projects: ordered by display_order then date
    supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: false })
      .order("date", { ascending: false }),

    // Concerts: Only future or today
    supabase
      .from("concerts")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true }),

    // Tours: Active tours (end_date >= today OR end_date is null)
    supabase
      .from("tours")
      .select("*")
      .or(`end_date.gte.${today},end_date.is.null`),

    // Events: From today onwards
    supabase
      .from("events")
      .select("*")
      .gte("date_from", today)
      .eq("is_public", true)
      .order("date_from", { ascending: true }),

    // Rehearsals: From today onwards
    supabase
      .from("rehearsals")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true }),
  ]);

  // Transform projects using the utility
  const projects = (dbProjects || []).map((p: DatabaseProject) =>
    transformProjectForFrontend(p),
  );

  return {
    projects: projects,
    concerts: concerts || [],
    tours: tours || [],
    events: events || [],
    rehearsals: rehearsals || [],
  };
}

// --- Main Page Component ---
const ConcertsPage = async () => {
  // Fetch data on the server
  const { projects, concerts, tours, events, rehearsals } = await getPageData();

  const collectionSchema = generateSchema(concerts);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Concerts", path: "/concerts" }])}
      />
      <ConcertsClient
        initialProjects={projects}
        initialConcerts={concerts}
        initialTours={tours}
        initialEvents={events}
        initialRehearsals={rehearsals}
      />
    </>
  );
};

export default ConcertsPage;
