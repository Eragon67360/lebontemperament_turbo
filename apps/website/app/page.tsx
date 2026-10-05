import HomeContent from "@/components/HomeContent";
import type { ConcertProject } from "@/types/projects";
import { createPublicClient } from "@/utils/supabase/public";
import type { Project } from "@repo/domain/types/projects";
import { transformProjectForFrontend } from "@repo/domain/utils/projects";
import { Metadata } from "next";

// The concert-story teaser is the page's only data (anon key, no cookies):
// prerendered, served from the cache for five minutes or until the admin's
// story edit calls /api/revalidate.
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: "Ensemble Vocal et Instrumental à Saverne | Le Bon Tempérament",
  },
  description:
    "Découvrez Le Bon Tempérament, ensemble vocal et instrumental renommé à Saverne depuis 1987. Concerts de musique classique, opéras baroques, CDs et événements musicaux en Alsace. Rejoignez-nous pour vivre la passion de la musique classique.",
  keywords:
    "Le Bon Tempérament, ensemble vocal instrumental, musique classique Saverne, concerts baroque, opéra classique, chœur Alsace, Simone Duclos, musique française",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    siteName: "Le Bon Tempérament",
    title: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
    description:
      "Découvrez Le Bon Tempérament, ensemble vocal et instrumental renommé à Saverne depuis 1987. Concerts de musique classique, opéras baroques et événements musicaux.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/home-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

// The four latest stories, like ProjectViewer used to fetch from /api/projects.
async function getLatestStories(): Promise<ConcertProject[] | undefined> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: false })
      .order("date", { ascending: false })
      .limit(4);
    if (error) throw error;
    return (data || []).map((p: Project) => transformProjectForFrontend(p));
  } catch (error) {
    // Unreachable database (CI builds with placeholder credentials): the
    // teaser loads in the browser as before; ISR fills it in afterwards.
    console.error("Error loading concert stories for the home page:", error);
    return undefined;
  }
}

const Home = async () => {
  const stories = await getLatestStories();
  return (
    <>
      <HomeContent stories={stories} />
    </>
  );
};

export default Home;
