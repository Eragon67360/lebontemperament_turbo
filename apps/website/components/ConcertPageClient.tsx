"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import Hero from "@/components/Hero";
import MotionSection from "@/components/MotionSection";
import SkeletonImage from "@/components/SkeletonImage";
import { ConcertProject } from "@/types/projects";
import { RoundedSize } from "@/utils/types";
import { Button, Link, Tooltip } from "@heroui/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  IoArrowBack,
  IoCalendarClear,
  IoCamera,
  IoLogoFacebook,
  IoLogoLinkedin,
  IoLogoTwitter,
  IoLogoWhatsapp,
  IoMusicalNotes,
  IoNewspaper,
  IoPencil,
  IoShareSocial,
  IoTime,
} from "react-icons/io5";
import ReactMarkdown from "react-markdown";

interface ConcertPageClientProps {
  project: ConcertProject;
  relatedProjects?: ConcertProject[];
}

const ConcertPageClient = ({
  project,
  relatedProjects = [],
}: ConcertPageClientProps) => {
  const hasText1 = Boolean(project.text1?.trim());
  const hasText2 = Boolean(project.text2?.trim());
  const hasImage2 = Boolean(project.image2?.url?.trim());
  const hasImage3 = Boolean(project.image3?.url?.trim());

  const photographers = [
    project.banniere?.photographer,
    project.image2?.photographer,
    project.image3?.photographer,
  ].filter(
    (
      photographer,
      index,
      all,
    ): photographer is NonNullable<typeof photographer> =>
      Boolean(photographer) &&
      all.findIndex((item) => item?.name === photographer?.name) === index,
  );

  const articleText = `${project.text1 || ""} ${project.text2 || ""}`;
  const wordCount = articleText
    .replace(/<[^>]*>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/concerts/${project.slug}`
      : "";

  const share = (platform: string) => {
    const text = `Découvrez ${project.name} ${project.subName || ""}, une histoire de concert du Bon Tempérament`;
    const destinations: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
    };

    const destination = destinations[platform];
    if (destination) window.open(destination, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dark:bg-background relative min-h-screen w-full bg-gray-50">
      <Hero
        title={project.name || "Histoire de concert"}
        subtitle={project.subName}
        description={project.explanation}
        bannerSrc={project.banniere?.url}
        dataTestId="hero"
      />

      <div className="dark:bg-background relative z-10 mx-auto mt-[100dvh] w-full bg-white py-12 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <Link
            href="/concerts#histoires"
            className="text-muted hover:text-primary mb-8 inline-flex items-center gap-2 text-sm"
          >
            <IoArrowBack aria-hidden="true" />
            Toutes les histoires de concerts
          </Link>

          <MotionSection className="border-separator mb-12 border-b pb-8">
            <p className="text-primary mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
              Histoire de concert
            </p>
            <div className="text-muted flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <IoCalendarClear className="text-primary text-lg" />
                <span className="text-foreground font-medium">
                  {format(new Date(project.date), "d MMMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IoTime className="text-primary text-lg" />
                <span>{readTime} min de lecture</span>
              </div>
              {project.author && (
                <div className="flex items-center gap-2">
                  <IoPencil className="text-primary text-lg" />
                  <span>Article par {project.author.name}</span>
                </div>
              )}
            </div>
          </MotionSection>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
            <article className="min-w-0">
              {hasText1 ? (
                <MotionSection dataTestId="section1">
                  <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{project.text1 as string}</ReactMarkdown>
                  </div>
                </MotionSection>
              ) : (
                project.explanation && (
                  <p className="text-foreground text-lg leading-relaxed">
                    {project.explanation}
                  </p>
                )
              )}

              {(hasImage2 || project.image2) && (
                <MotionSection className="my-10">
                  {hasImage2 && project.image2 ? (
                    <figure>
                      <CloudinaryImage
                        src={project.image2.url}
                        width={1000}
                        height={650}
                        alt={`Photographie de ${project.name}`}
                        rounded={RoundedSize.MD}
                        className="w-full"
                      />
                      {project.image2.photographer && (
                        <figcaption className="text-muted mt-2 text-right text-xs italic">
                          Photo : {project.image2.photographer.name}
                        </figcaption>
                      )}
                    </figure>
                  ) : (
                    <SkeletonImage
                      width={1000}
                      height={650}
                      dataTestId="skeleton-image-2"
                    />
                  )}
                </MotionSection>
              )}

              {hasText2 && (
                <MotionSection dataTestId="section2" delay={0.1}>
                  <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{project.text2 as string}</ReactMarkdown>
                  </div>
                </MotionSection>
              )}

              {(hasImage3 || project.image3) && (
                <MotionSection className="my-10" delay={0.2}>
                  {hasImage3 && project.image3 ? (
                    <figure>
                      <CloudinaryImage
                        src={project.image3.url}
                        width={1000}
                        height={650}
                        alt={`Photographie de ${project.name}`}
                        rounded={RoundedSize.MD}
                        className="w-full"
                      />
                      {project.image3.photographer && (
                        <figcaption className="text-muted mt-2 text-right text-xs italic">
                          Photo : {project.image3.photographer.name}
                        </figcaption>
                      )}
                    </figure>
                  ) : (
                    <SkeletonImage
                      width={1000}
                      height={650}
                      dataTestId="skeleton-image-3"
                    />
                  )}
                </MotionSection>
              )}

              {relatedProjects.length > 0 && (
                <MotionSection
                  className="border-separator mt-14 border-t pt-10"
                  dataTestId="related-projects"
                  delay={0.2}
                >
                  <h2 className="text-foreground flex items-center gap-3 text-2xl font-bold">
                    <IoMusicalNotes
                      className="text-primary"
                      aria-hidden="true"
                    />
                    D&apos;autres histoires de concerts
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {relatedProjects.map((relatedProject) => (
                      <Link
                        key={relatedProject.slug}
                        href={`/concerts/${relatedProject.slug}`}
                        className="border-separator bg-surface-secondary hover:border-primary/40 group rounded-xl border p-5"
                      >
                        <span className="text-primary text-xs font-semibold">
                          {new Date(relatedProject.date).getFullYear()}
                        </span>
                        <h3 className="text-foreground group-hover:text-primary mt-2 line-clamp-2 font-semibold">
                          {relatedProject.name} {relatedProject.subName}
                        </h3>
                      </Link>
                    ))}
                  </div>
                </MotionSection>
              )}
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="border-separator bg-surface-secondary rounded-xl border p-5">
                <h2 className="text-foreground flex items-center gap-2 font-semibold">
                  <IoShareSocial className="text-primary" aria-hidden="true" />
                  Partager
                </h2>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    {
                      name: "twitter",
                      label: "Partager sur X",
                      icon: IoLogoTwitter,
                    },
                    {
                      name: "facebook",
                      label: "Partager sur Facebook",
                      icon: IoLogoFacebook,
                    },
                    {
                      name: "linkedin",
                      label: "Partager sur LinkedIn",
                      icon: IoLogoLinkedin,
                    },
                    {
                      name: "whatsapp",
                      label: "Partager sur WhatsApp",
                      icon: IoLogoWhatsapp,
                    },
                  ].map(({ name, label, icon: Icon }) => (
                    <Tooltip key={name}>
                      <Button
                        isIconOnly
                        variant="ghost"
                        className="bg-default/40"
                        aria-label={label}
                        onPress={() => share(name)}
                      >
                        <Icon className="text-lg" aria-hidden="true" />
                      </Button>
                      <Tooltip.Content>{label}</Tooltip.Content>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {(photographers.length > 0 || project.author) && (
                <div className="border-separator bg-surface-secondary rounded-xl border p-5">
                  <h2 className="text-foreground flex items-center gap-2 font-semibold">
                    <IoCamera className="text-primary" aria-hidden="true" />
                    Crédits
                  </h2>
                  <div className="mt-4 space-y-4 text-sm">
                    {photographers.length > 0 && (
                      <div>
                        <p className="text-muted text-xs tracking-wider uppercase">
                          Photographies
                        </p>
                        {photographers.map((photographer) => (
                          <Link
                            key={photographer.name}
                            href={photographer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary mt-1 block font-medium"
                          >
                            {photographer.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {project.author && (
                      <div>
                        <p className="text-muted text-xs tracking-wider uppercase">
                          Rédaction
                        </p>
                        <p className="text-foreground mt-1 font-medium">
                          {project.author.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {project.press_articles && project.press_articles.length > 0 && (
                <div className="border-separator bg-surface-secondary rounded-xl border p-5">
                  <h2 className="text-foreground flex items-center gap-2 font-semibold">
                    <IoNewspaper className="text-primary" aria-hidden="true" />
                    Ils parlent de nous
                  </h2>
                  <div className="mt-4 space-y-3">
                    {project.press_articles.map((pressArticle) => (
                      <Link
                        key={`${pressArticle.source}-${pressArticle.url}`}
                        href={pressArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-separator bg-background hover:border-primary/40 block rounded-lg border p-3"
                      >
                        <span className="text-foreground line-clamp-2 text-sm font-medium">
                          {pressArticle.title}
                        </span>
                        <span className="text-muted mt-1 block text-xs">
                          {pressArticle.source}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertPageClient;
