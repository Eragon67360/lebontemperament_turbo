import CloudinaryImage from "@/components/CloudinaryImage";
import projects from "@/public/json/projects.json";
import { RoundedSize } from "@/utils/types";
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
      <div>Ce concert n&apos;a pas pu être trouvé dans la base de données</div>
    );
  }

  return (
    <>
      <div className=" mx-8 max-w-[1440px] w-full flex flex-col pb-8">
        <div className="py-16">
          <div>
            <h1 className="text-title text-primary/50 font-light leading-none">
              {project.name}
            </h1>
            <h2 className="text-title text-[#333] font-bold leading-none">
              {project.subName}
            </h2>
            <hr className="mt-8" />
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <div className="h-full">
            <CloudinaryImage
              src={project.banniere}
              alt={project.name}
              className="fill-image"
              width={2000}
              height={500}
              rounded={RoundedSize.NONE}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
            <div className="w-full lg:w-1/3 order-2 lg:order-1">
              <CloudinaryImage
                src={project.image2}
                width={600}
                alt={`Image de ${project.name} ${project.subName}`}
                height={500}
                rounded={RoundedSize.NONE}
              />
            </div>
            <div
              className="w-full lg:w-2/3 pl-0 lg:pl-8 text-justify order-1 lg:order-2"
              dangerouslySetInnerHTML={{ __html: project.text1 }}
            ></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
            <div
              className="w-full lg:w-2/3 pr-0 lg:pr-8 text-justify"
              dangerouslySetInnerHTML={{ __html: project.text2 }}
            ></div>
            <div className="w-full lg:w-1/3">
              <CloudinaryImage
                src={project.image3}
                width={600}
                alt={`Image de ${project.name} ${project.subName}`}
                height={500}
                rounded={RoundedSize.NONE}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectPage;
