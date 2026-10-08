import ConcertsClient from "@/components/concerts/ConcertsClient";
import { JsonLd } from "@/components/JsonLd";
import {
  CONCERT_COLUMNS,
  CONCERT_EVENT_DATA_COLUMNS,
  EVENT_COLUMNS,
  REHEARSAL_COLUMNS,
  TOUR_COLUMNS,
  type PublicConcert,
  type PublicConcertEventData,
  type PublicRehearsal,
  type PublicTour,
} from "@/lib/publicConcerts";
import { breadcrumbJsonLd, organizationRef } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import { concertEventJsonLd } from "@repo/domain/seo/concertEvent";
import { Event } from "@repo/domain/types/events";
import type { Project } from "@repo/domain/types/projects";
import { parisToday } from "@repo/domain/utils/parisDay";
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
  },
  alternates: {
    canonical: "/concerts",
  },
};

// One top-level MusicEvent per upcoming concert, as Google's event results
// read them (#328); the page itself is a CollectionPage.
const DEFAULT_EVENT_IMAGE = `${process.env.NEXT_PUBLIC_BASE_URL}/opengraph-image`;

function collectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Agenda des concerts - Le Bon Tempérament",
    description:
      "Prochains concerts et tournées de l'ensemble vocal et instrumental Le Bon Tempérament",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts`,
    publisher: organizationRef(),
  };
}

function concertEventSchemas(concerts: AgendaConcert[], tours: PublicTour[]) {
  const posterByTour = new Map(tours.map((t) => [t.id, t.tour_poster]));
  return concerts.map((concert) =>
    concertEventJsonLd(concert, {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "",
      organizer: organizationRef(),
      performer: organizationRef("MusicGroup"),
      defaultImage: DEFAULT_EVENT_IMAGE,
      tourPoster: concert.tour_id ? posterByTour.get(concert.tour_id) : null,
    }),
  );
}

// --- Helper: Fetch All Data ---
const AGENDA_CONCERT_COLUMNS =
  `${CONCERT_COLUMNS}, ${CONCERT_EVENT_DATA_COLUMNS}` as const;
type AgendaConcert = PublicConcert & PublicConcertEventData;

type PageData = {
  projects: ReturnType<typeof transformProjectForFrontend>[];
  concerts: AgendaConcert[];
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
  const today = parisToday(); // YYYY-MM-DD, the Paris day (#490)

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
        .select(AGENDA_CONCERT_COLUMNS)
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
        .select(EVENT_COLUMNS)
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

  return (
    <>
      <JsonLd data={collectionSchema()} />
      {concertEventSchemas(concerts, tours).map((schema) => (
        <JsonLd key={String(schema["@id"])} data={schema} />
      ))}
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
