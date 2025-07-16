import ConcertPageClient from "@/components/ConcertPageClient";
import projects from "@/public/json/projects.json";
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
      images: [
        {
          url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
          width: 800,
          height: 600,
          alt: "Le Bon Tempérament",
        },
      ],
    },
    alternates: {
      canonical: `/concerts/${slug}`,
    },
  };
}

const ProjectPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const project = projects.find((p) => `${p.slug}` === slug);

  if (!project) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div role="status" aria-live="polite">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Concert non trouvé
          </h1>
          <p className="text-gray-600">
            Ce concert n&apos;a pas pu être trouvé dans la base de données.
          </p>
        </div>
      </main>
    );
  }

  return <ConcertPageClient project={project} />;
};

export default ProjectPage;
