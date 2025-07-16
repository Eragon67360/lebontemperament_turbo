"use client";
import CloudinaryImage from "@/components/CloudinaryImage";
import Hero from "@/components/Hero";
import MotionSection from "@/components/MotionSection";
import SkeletonImage from "@/components/SkeletonImage";
import { RoundedSize } from "@/utils/types";

interface ConcertPageClientProps {
  project: {
    name: string;
    subName?: string;
    explanation?: string;
    banniere?: string;
    text1?: string;
    text2?: string;
    image2?: string;
    image3?: string;
  };
}

const ConcertPageClient: React.FC<ConcertPageClientProps> = ({ project }) => {
  const hasText1 = project.text1 && project.text1.trim().length > 0;
  const hasText2 = project.text2 && project.text2.trim().length > 0;
  const hasImage2 = project.image2 && project.image2.trim().length > 0;
  const hasImage3 = project.image3 && project.image3.trim().length > 0;

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <Hero
        title={project.name ?? "Concert"}
        subtitle={project.subName}
        description={project.explanation}
        bannerSrc={project.banniere}
        dataTestId="hero"
      />

      {/* Main Content */}
      <div className="container mx-auto mt-24 flex w-full flex-col px-8 pb-8 lg:px-24">
        {/* First Content Section */}
        {(hasText1 || hasImage2) && (
          <MotionSection
            className="mb-12 flex flex-col gap-4 lg:flex-row lg:gap-8"
            dataTestId="section1"
          >
            {/* Image */}
            <div className="order-2 w-full lg:order-1 lg:w-1/3">
              {hasImage2 && project.image2 ? (
                <CloudinaryImage
                  src={project.image2}
                  width={600}
                  alt={`Image du concert ${project.name} ${project.subName || ""}`}
                  height={500}
                  rounded={RoundedSize.SM}
                />
              ) : (
                <SkeletonImage
                  width={600}
                  height={500}
                  dataTestId="skeleton-image-2"
                />
              )}
            </div>

            {/* Text */}
            {hasText1 && (
              <div className="order-1 w-full text-justify lg:order-2 lg:w-2/3 lg:pl-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.text1 as string }}
                />
              </div>
            )}
          </MotionSection>
        )}

        {/* Second Content Section */}
        {(hasText2 || hasImage3) && (
          <MotionSection
            className="flex flex-col gap-4 lg:flex-row lg:gap-8"
            dataTestId="section2"
            delay={0.2}
          >
            {/* Text */}
            {hasText2 && (
              <div className="order-1 w-full text-justify lg:w-2/3 lg:pr-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.text2 as string }}
                />
              </div>
            )}

            {/* Image */}
            <div className="order-2 w-full lg:w-1/3">
              {hasImage3 && project.image3 ? (
                <CloudinaryImage
                  src={project.image3}
                  width={600}
                  alt={`Image du concert ${project.name} ${project.subName || ""}`}
                  height={500}
                  rounded={RoundedSize.SM}
                />
              ) : (
                <SkeletonImage
                  width={600}
                  height={500}
                  dataTestId="skeleton-image-3"
                />
              )}
            </div>
          </MotionSection>
        )}

        {/* Status message for screen readers when content is missing */}
        {!hasText1 && !hasText2 && (
          <div className="sr-only" role="status" aria-live="polite">
            Aucun contenu textuel disponible pour ce concert.
          </div>
        )}
      </div>
    </main>
  );
};

export default ConcertPageClient;
