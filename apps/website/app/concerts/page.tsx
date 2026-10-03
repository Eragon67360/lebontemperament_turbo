import ConcertsClient from "@/components/concerts/ConcertsClient";
import { JsonLd } from "@/components/JsonLd";
import {
  CONCERT_COLUMNS,
  REHEARSAL_COLUMNS,
  TOUR_COLUMNS,
  type PublicConcert,
  type PublicRehearsal,
  type PublicTour,
} from "@/lib/publicConcerts";
import { breadcrumbJsonLd, organizationRef } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import { Event } from "@repo/domain/types/events";
import type { Project } from "@repo/domain/types/projects";
import { transformProjectForFrontend } from "@repo/domain/utils/projects";
import type { Metadata } from "next";

// Public data only (anon key, no cookies): prerendered and served from the
// cache for five minutes, or until the admin's edit calls /api/revalidate.
export const revalidate = 300;

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
function generateSchema(concerts: PublicConcert[]) {
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
    organizer: organizationRef(),
    performer: organizationRef("MusicGroup"),
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
    publisher: organizationRef(),
  };
}

// --- Helper: Fetch All Data ---
type PageData = {
  projects: ReturnType<typeof transformProjectForFrontend>[];
  concerts: PublicConcert[];
  tours: PublicTour[];
  events: Event[];
  rehearsals: PublicRehearsal[];
};

const EMPTY_PAGE_DATA: PageData = {
  projects: [],
  concerts: [],
  tours: [],
  events: [],
  rehearsals: [],
};

async function getPageData(): Promise<PageData> {
  const supabase = createPublicClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // Fetch all required data in parallel for optimal performance
    const [
      { data: dbProjects },
      { data: concerts },
      { data: tours },
      { data: events },
      { data: rehearsals },
    ] = await Promise.all([
      // Projects: ordered by display_order then date (every column: the
      // story view-model is built by transformProjectForFrontend)
      supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: false })
        .order("date", { ascending: false }),

      // Concerts: Only future or today
      supabase
        .from("concerts")
        .select(CONCERT_COLUMNS)
        .gte("date", today)
        .order("date", { ascending: true }),

      // Tours: Active tours (end_date >= today OR end_date is null)
      supabase
        .from("tours")
        .select(TOUR_COLUMNS)
        .or(`end_date.gte.${today},end_date.is.null`),

      // Events: From today onwards
      supabase
        .from("events")
        .select("*")
        .gte("date_from", today)
        .eq("is_public", true)
        .order("date_from", { ascending: true }),

      // Rehearsals: only the next one is shown
      supabase
        .from("rehearsals")
        .select(REHEARSAL_COLUMNS)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1),
    ]);

    // Transform projects using the utility
    const projects = (dbProjects || []).map((p: Project) =>
      transformProjectForFrontend(p),
    );

    return {
      projects: projects,
      concerts: concerts || [],
      tours: tours || [],
      events: (events || []) as Event[], // view-model: deliberate Event type; also narrows event_type from string to a 5-value union
      rehearsals: rehearsals || [],
    };
  } catch (error) {
    // Unreachable database (CI builds with placeholder credentials): the
    // page's empty states render and the next revalidation fills the data.
    console.error("Error loading the concerts page data:", error);
    return EMPTY_PAGE_DATA;
  }
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
