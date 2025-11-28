import ConcertPageClient from "@/components/ConcertPageClient";
import projects from "@/public/json/projects.json";
import { ConcertProject } from "@/types/projects";
import type { Metadata } from "next";
import Link from "next/link";
import { IoIosArrowRoundBack } from "react-icons/io";

export async function generateStaticParams() {
  const projectsData = await import("@/public/json/projects.json");
  return projectsData.default.map((project: { slug: string }) => ({
    slug: project.slug,
  }));
}

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
function generateEventSchema(project: ConcertProject, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${project.name} ${project.subName}`,
    description: project.explanation,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${slug}`,
    startDate: project.date,
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
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "EUR",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/contact`,
    },
    keywords: "musique classique, opéra, baroque, concert, Saverne, Alsace",
    audience: {
      "@type": "Audience",
      audienceType: "Tous publics",
    },
  };
}

// Generate Article schema for concert pages
function generateArticleSchema(project: ConcertProject, slug: string) {
  const articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${project.name} ${project.subName}`,
    description:
      project.explanation ||
      `${project.name} ${project.subName} - Concert par Le Bon Tempérament`,
    url: articleUrl,
    author: {
      "@type": project.author ? "Person" : "Organization",
      name: project.author?.name || "Le Bon Tempérament",
    },
    datePublished: project.date,
    dateModified: project.date, // Using date as modified date since no updatedAt field
    publisher: {
      "@type": "Organization",
      name: "Le Bon Tempérament",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/logo",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    image: project.banniere?.url
      ? `https://res.cloudinary.com/dlt2j3dld/image/upload/${project.banniere.url}`
      : "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
    inLanguage: "fr-FR",
    keywords:
      "musique classique, opéra, baroque, concert, Saverne, Alsace, Le Bon Tempérament",
  };
}

// Helper function to find related projects
function findRelatedProjects(
  currentProject: ConcertProject,
  allProjects: ConcertProject[],
  limit: number = 3,
): ConcertProject[] {
  const currentYear = new Date(currentProject.date).getFullYear();
  const currentName = currentProject.name.toLowerCase();
  const currentExplanation = (currentProject.explanation || "").toLowerCase();

  // Keywords to identify themes
  const themes = {
    opera: [
      "opéra",
      "opera",
      "monteverdi",
      "mozart",
      "puccini",
      "bizet",
      "carmen",
    ],
    baroque: ["baroque", "purcell", "monteverdi", "telemann"],
    latino: ["latino", "espagne", "espagnol", "argentine", "misa criolla"],
    tzigane: ["tzigane", "bohémien", "gitane", "brahms", "sarasate"],
  };

  // Find projects from same year or similar themes
  const related = allProjects
    .filter((p) => p.slug !== currentProject.slug)
    .map((project) => {
      let score = 0;
      const projectYear = new Date(project.date).getFullYear();
      const projectExplanation = (project.explanation || "").toLowerCase();
      const projectName = project.name.toLowerCase();

      // Same year = high score
      if (projectYear === currentYear) score += 10;

      // Similar themes = medium score
      Object.values(themes).forEach((keywords) => {
        const currentHasTheme = keywords.some(
          (kw) => currentExplanation.includes(kw) || currentName.includes(kw),
        );
        const projectHasTheme = keywords.some(
          (kw) => projectExplanation.includes(kw) || projectName.includes(kw),
        );
        if (currentHasTheme && projectHasTheme) score += 5;
      });

      // Same year range (±1 year) = low score
      if (Math.abs(projectYear - currentYear) <= 1) score += 2;

      return { project, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.project);

  return related;
}

export default async function ConcertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="dark:bg-background flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-foreground text-4xl font-bold">
          Concert non trouvé
        </h1>
        <p className="text-default-600 dark:text-default-400 mt-4 text-lg">
          Désolé, le concert que vous recherchez n&apos;existe pas ou n&apos;est
          plus disponible.
        </p>
        <Link
          href="/concerts"
          className="bg-primary hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-md px-6 py-3 text-white transition-colors"
        >
          <IoIosArrowRoundBack className="text-xl" />
          Retourner aux concerts
        </Link>
      </div>
    );
  }

  // Find related projects
  const relatedProjects = findRelatedProjects(project, projects, 3);

  const eventSchema = generateEventSchema(project, slug);
  const articleSchema = generateArticleSchema(project, slug);

  return (
    <>
      {/* MusicEvent Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ConcertPageClient project={project} relatedProjects={relatedProjects} />
    </>
  );
}
