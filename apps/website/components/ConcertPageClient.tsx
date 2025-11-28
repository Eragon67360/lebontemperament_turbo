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
  IoCalendarClear,
  IoCamera,
  IoHelpCircle,
  IoLocationSharp,
  IoLogoFacebook,
  IoLogoLinkedin,
  IoLogoTwitter,
  IoLogoWhatsapp,
  IoMusicalNotes,
  IoNewspaper,
  IoPencil,
  IoShareSocial,
  IoTicket,
  IoTime,
} from "react-icons/io5";
import ReactMarkdown from "react-markdown";

interface ConcertPageClientProps {
  project: ConcertProject;
  relatedProjects?: ConcertProject[];
}

const ConcertPageClient: React.FC<ConcertPageClientProps> = ({
  project,
  relatedProjects = [],
}) => {
  const hasText1 = project.text1 && project.text1.trim().length > 0;
  const hasText2 = project.text2 && project.text2.trim().length > 0;
  const hasImage2 =
    project.image2 &&
    project.image2.url &&
    project.image2.url.trim().length > 0;
  const hasImage3 =
    project.image3 &&
    project.image3.url &&
    project.image3.url.trim().length > 0;

  // Collect all unique photographers from all images
  const getAllPhotographers = () => {
    const photographers: Array<{ name: string; url: string }> = [];
    const seen = new Set<string>();

    [project.banniere, project.image2, project.image3].forEach((image) => {
      if (image?.photographer && !seen.has(image.photographer.name)) {
        photographers.push(image.photographer);
        seen.add(image.photographer.name);
      }
    });

    return photographers;
  };

  const photographers = getAllPhotographers();

  // Calculate read time (approx 200 words per minute)
  const calculateReadTime = () => {
    const text = (project.text1 || "") + (project.text2 || "");
    const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  const readTime = calculateReadTime();

  // Check if concert is in the past
  const isPastConcert = () => {
    const concertDate = new Date(project.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return concertDate < today;
  };

  const isPast = isPastConcert();

  // Construct the share URL using the project slug
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/concerts/${project.slug}`
      : "";

  const handleShare = (platform: string) => {
    if (typeof window === "undefined") return;

    const text = `Découvrez le concert ${project.name} ${project.subName} par Le Bon Tempérament`;
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`;
        break;
    }

    if (url) window.open(url, "_blank");
  };

  return (
    <main className="dark:bg-background relative min-h-screen w-full bg-gray-50">
      <Hero
        title={project.name ?? "Concert"}
        subtitle={project.subName}
        description={project.explanation}
        bannerSrc={project.banniere?.url}
        dataTestId="hero"
      />

      <div className="dark:bg-background relative z-10 mx-auto mt-[100dvh] flex w-full flex-col bg-white py-12 lg:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Article Header */}
          <MotionSection className="border-divider mb-12 border-b pb-8">
            <div className="text-default-500 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <IoCalendarClear className="text-primary text-lg" />
                <span className="text-foreground font-medium">
                  {format(new Date(project.date), "d MMMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="bg-foreground/50 h-1 w-1 rounded-full" />
              <div className="flex items-center gap-2">
                <IoTime className="text-primary text-lg" />
                <span className="text-foreground/50">
                  {readTime} min de lecture
                </span>
              </div>
              {project.author && (
                <>
                  <div className="bg-foreground/50 h-1 w-1 rounded-full" />
                  <div className="flex items-center gap-2">
                    <IoPencil className="text-primary text-lg" />
                    <p className="text-foreground/50">
                      Article par{" "}
                      <span className="text-primary font-medium hover:underline">
                        {project.author.name}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </MotionSection>

          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* Main Content */}
            <div className="w-full lg:w-3/4">
              {(hasText1 || hasImage2) && (
                <MotionSection
                  className="mb-12 flex flex-col gap-8"
                  dataTestId="section1"
                >
                  {/* Text 1 */}
                  {hasText1 && (
                    <div className="prose prose-lg dark:prose-invert max-w-none text-justify leading-relaxed">
                      <ReactMarkdown>{project.text1 as string}</ReactMarkdown>
                    </div>
                  )}

                  {/* Image 2 */}
                  <div className="my-4">
                    {hasImage2 && project.image2 ? (
                      <figure>
                        <CloudinaryImage
                          src={project.image2.url}
                          width={1000}
                          alt={`Image du concert ${project.name} ${project.subName || ""}`}
                          height={600}
                          rounded={RoundedSize.MD}
                          className="w-full shadow-lg"
                        />
                        {project.image2.photographer && (
                          <figcaption className="text-foreground/50 mt-2 text-right text-xs italic">
                            Photo : {project.image2.photographer.name}
                          </figcaption>
                        )}
                      </figure>
                    ) : (
                      <SkeletonImage
                        width={1000}
                        height={600}
                        dataTestId="skeleton-image-2"
                      />
                    )}
                  </div>
                </MotionSection>
              )}

              {(hasText2 || hasImage3) && (
                <MotionSection
                  className="flex flex-col gap-8"
                  dataTestId="section2"
                  delay={0.2}
                >
                  {/* Text 2 */}
                  {hasText2 && (
                    <div className="prose prose-lg dark:prose-invert max-w-none text-justify leading-relaxed">
                      <ReactMarkdown>{project.text2 as string}</ReactMarkdown>
                    </div>
                  )}

                  {/* Image 3 */}
                  <div className="my-4">
                    {hasImage3 && project.image3 ? (
                      <figure>
                        <CloudinaryImage
                          src={project.image3.url}
                          width={1000}
                          alt={`Image du concert ${project.name} ${project.subName || ""}`}
                          height={600}
                          rounded={RoundedSize.MD}
                          className="w-full shadow-lg"
                        />
                        {project.image3.photographer && (
                          <figcaption className="text-foreground/50 mt-2 text-right text-xs italic">
                            Photo : {project.image3.photographer.name}
                          </figcaption>
                        )}
                      </figure>
                    ) : (
                      <SkeletonImage
                        width={1000}
                        height={600}
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

              {/* Informations pratiques - Q&A Section */}
              <MotionSection
                className="bg-default-50 border-divider mt-12 flex flex-col gap-6 rounded-xl border p-8"
                dataTestId="practical-info"
                delay={0.3}
              >
                <h2 className="text-foreground mb-4 flex items-center gap-3 text-2xl font-semibold">
                  <IoHelpCircle className="text-primary text-3xl" />
                  Informations pratiques
                </h2>
                <div
                  className="space-y-6"
                  itemScope
                  itemType="https://schema.org/FAQPage"
                >
                  {/* Question 1: Quand */}
                  <div
                    className="border-divider bg-background rounded-lg border p-6"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h3
                      className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold"
                      itemProp="name"
                    >
                      <IoCalendarClear className="text-primary shrink-0" />
                      {isPast
                        ? "Quand a eu lieu ce concert?"
                        : "Quand a lieu ce concert?"}
                    </h3>
                    <div
                      className="text-default-600 dark:text-default-400 text-base leading-relaxed"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <p itemProp="text">
                        {isPast ? (
                          <>
                            Ce concert a eu lieu le{" "}
                            <strong className="text-foreground font-semibold">
                              {format(new Date(project.date), "d MMMM yyyy", {
                                locale: fr,
                              })}
                            </strong>
                            . Pour découvrir nos prochains concerts, consultez
                            notre{" "}
                            <Link
                              href="/concerts"
                              className="text-primary font-medium hover:underline"
                            >
                              page concerts
                            </Link>{" "}
                            ou{" "}
                            <Link
                              href="/contact"
                              className="text-primary font-medium hover:underline"
                            >
                              contactez-nous
                            </Link>{" "}
                            pour être informé de nos prochaines dates.
                          </>
                        ) : (
                          <>
                            Ce concert aura lieu le{" "}
                            <strong className="text-foreground font-semibold">
                              {format(new Date(project.date), "d MMMM yyyy", {
                                locale: fr,
                              })}
                            </strong>
                            . Pour connaître l&apos;heure exacte et les détails
                            du programme, nous vous invitons à{" "}
                            <Link
                              href="/contact"
                              className="text-primary font-medium hover:underline"
                            >
                              nous contacter
                            </Link>{" "}
                            ou à consulter notre{" "}
                            <Link
                              href="/concerts"
                              className="text-primary font-medium hover:underline"
                            >
                              page concerts
                            </Link>{" "}
                            pour les dernières informations.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Question 2: Où */}
                  <div
                    className="border-divider bg-background hidden rounded-lg border p-6"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h3
                      className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold"
                      itemProp="name"
                    >
                      <IoLocationSharp className="text-primary shrink-0" />
                      {isPast
                        ? "Où s'est déroulé ce concert?"
                        : "Où se déroule le concert?"}
                    </h3>
                    <div
                      className="text-default-600 dark:text-default-400 text-base leading-relaxed"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <p itemProp="text">
                        {isPast ? (
                          <>
                            Ce concert s&apos;est déroulé à{" "}
                            <strong className="text-foreground font-semibold">
                              Saverne ou dans la région Alsace
                            </strong>
                            . Le Bon Tempérament organise ses concerts
                            principalement dans cette région, mais peut
                            également se produire dans d&apos;autres régions de
                            France lors de tournées. Nos concerts peuvent avoir
                            lieu dans des églises, des salles de spectacle, ou
                            lors de festivals. Pour connaître les lieux de nos
                            prochains concerts, consultez notre{" "}
                            <Link
                              href="/concerts"
                              className="text-primary font-medium hover:underline"
                            >
                              page concerts
                            </Link>{" "}
                            ou{" "}
                            <Link
                              href="/contact"
                              className="text-primary font-medium hover:underline"
                            >
                              contactez-nous
                            </Link>
                            .
                          </>
                        ) : (
                          <>
                            Nos concerts se déroulent principalement à{" "}
                            <strong className="text-foreground font-semibold">
                              Saverne et dans la région Alsace
                            </strong>
                            . Le lieu exact de ce concert sera indiqué sur
                            l&apos;affiche du concert et communiqué lors de la
                            réservation. Certains concerts peuvent également
                            avoir lieu dans des églises, des salles de
                            spectacle, ou lors de festivals. Pour connaître le
                            lieu précis, contactez-nous ou consultez notre page
                            concerts.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Question 3: Comment réserver / En savoir plus */}
                  <div
                    className="border-divider bg-background rounded-lg border p-6"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h3
                      className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold"
                      itemProp="name"
                    >
                      <IoTicket className="text-primary shrink-0" />
                      {isPast
                        ? "Où puis-je en savoir plus sur ce concert?"
                        : "Comment réserver?"}
                    </h3>
                    <div
                      className="text-default-600 dark:text-default-400 text-base leading-relaxed"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      {isPast ? (
                        <p itemProp="text">
                          Pour en savoir plus sur ce concert passé, vous pouvez
                          consulter les détails sur cette page. Si vous
                          souhaitez découvrir nos prochains concerts et
                          événements, n&apos;hésitez pas à{" "}
                          <Link
                            href="/contact"
                            className="text-primary font-medium hover:underline"
                          >
                            nous contacter
                          </Link>{" "}
                          ou à consulter notre{" "}
                          <Link
                            href="/concerts"
                            className="text-primary font-medium hover:underline"
                          >
                            page concerts
                          </Link>{" "}
                          pour connaître nos prochaines dates. Vous pouvez
                          également consulter notre{" "}
                          <Link
                            href="/galerie"
                            className="text-primary font-medium hover:underline"
                          >
                            galerie
                          </Link>{" "}
                          pour voir des photos et vidéos de nos concerts.
                        </p>
                      ) : (
                        <>
                          <p itemProp="text" className="mb-3">
                            Pour réserver votre place, vous pouvez :
                          </p>
                          <ul className="text-default-600 dark:text-default-400 ml-6 list-disc space-y-2">
                            <li>
                              Nous{" "}
                              <Link
                                href="/contact"
                                className="text-primary font-medium hover:underline"
                              >
                                contacter par email
                              </Link>{" "}
                              à lebontemperament@gmail.com
                            </li>
                            <li>
                              Nous appeler au{" "}
                              <a
                                href="tel:+33952395789"
                                className="text-primary font-medium hover:underline"
                              >
                                (+33) 09 52 39 57 89
                              </a>
                            </li>
                            <li>
                              Consulter les informations sur l&apos;affiche du
                              concert pour les modalités de réservation
                              spécifiques
                            </li>
                          </ul>
                          <p itemProp="text" className="mt-3">
                            Les tarifs et modalités de réservation varient selon
                            les concerts. Certains événements sont gratuits,
                            d&apos;autres nécessitent une réservation avec un
                            tarif d&apos;entrée.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question 4: Programme */}
                  <div
                    className="border-divider bg-background rounded-lg border p-6"
                    itemScope
                    itemType="https://schema.org/Question"
                  >
                    <h3
                      className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold"
                      itemProp="name"
                    >
                      <IoTime className="text-primary shrink-0" />
                      {isPast
                        ? "Quel était le programme de ce concert?"
                        : "Quel est le programme de ce concert?"}
                    </h3>
                    <div
                      className="text-default-600 dark:text-default-400 text-base leading-relaxed"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <p itemProp="text" className="mb-3">
                        {project.explanation ? (
                          <>
                            <strong className="text-foreground font-semibold">
                              {project.name} {project.subName}
                            </strong>{" "}
                            : {project.explanation}
                          </>
                        ) : (
                          <>
                            {isPast
                              ? "Le programme de ce concert passé est détaillé ci-dessus. "
                              : "Le programme détaillé de ce concert sera disponible prochainement. "}
                            Pour plus d&apos;informations sur le répertoire et
                            les œuvres interprétées, n&apos;hésitez pas à{" "}
                            <Link
                              href="/contact"
                              className="text-primary font-medium hover:underline"
                            >
                              nous contacter
                            </Link>
                            .
                          </>
                        )}
                      </p>
                      {project.explanation && (
                        <p itemProp="text" className="mt-3">
                          {isPast ? (
                            <>
                              Ce concert faisait partie du répertoire varié du
                              Bon Tempérament, allant de la musique classique
                              sacrée et profane à des pièces populaires et
                              folkloriques, couvrant une large période musicale
                              de la Renaissance à nos jours. Pour découvrir nos
                              prochains concerts, consultez notre{" "}
                              <Link
                                href="/concerts"
                                className="text-primary font-medium hover:underline"
                              >
                                page concerts
                              </Link>
                              .
                            </>
                          ) : (
                            <>
                              Le Bon Tempérament interprète un répertoire varié
                              allant de la musique classique sacrée et profane à
                              des pièces populaires et folkloriques, couvrant
                              une large période musicale de la Renaissance à nos
                              jours.
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </MotionSection>

              {/* Related Projects Section - Only show if there are related projects */}
              {relatedProjects.length > 0 && (
                <MotionSection
                  className="mt-12 flex flex-col gap-6"
                  dataTestId="related-projects"
                  delay={0.4}
                >
                  <h2 className="text-foreground mb-4 flex items-center gap-3 text-2xl font-semibold">
                    <IoMusicalNotes className="text-primary text-3xl" />
                    Concerts similaires
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {relatedProjects.map((relatedProject) => (
                      <Link
                        key={relatedProject.slug}
                        href={`/concerts/${relatedProject.slug}`}
                        className="group border-divider bg-default-50 hover:bg-default-100 flex flex-col rounded-lg border p-6 transition-all duration-300 hover:shadow-md"
                      >
                        <h3 className="group-hover:text-primary text-foreground mb-2 line-clamp-2 text-lg font-semibold transition-colors">
                          {relatedProject.name} {relatedProject.subName}
                        </h3>
                        <p className="text-default-600 dark:text-default-400 mb-3 line-clamp-2 text-sm">
                          {relatedProject.explanation}
                        </p>
                        <div className="text-default-500 mt-auto flex items-center gap-2 text-xs">
                          <IoCalendarClear className="text-primary shrink-0" />
                          <span>
                            {format(
                              new Date(relatedProject.date),
                              "d MMMM yyyy",
                              {
                                locale: fr,
                              },
                            )}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </MotionSection>
              )}
            </div>

            {/* Sidebar */}
            <div className="mt-12 w-full space-y-8 lg:sticky lg:top-24 lg:mt-0 lg:w-1/4 lg:self-start">
              {/* Share Section */}
              <div className="border-divider bg-default-50 dark:bg-default-50 rounded-xl border p-6">
                <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                  <IoShareSocial className="text-primary" />
                  Partager
                </h3>
                <div className="grid grid-cols-4 gap-2 lg:grid-cols-2 xl:grid-cols-4">
                  <Tooltip content="Partager sur X">
                    <Button
                      isIconOnly
                      variant="flat"
                      className="text-foreground bg-black/10 dark:bg-white/10"
                      onClick={() => handleShare("twitter")}
                    >
                      <IoLogoTwitter className="text-xl" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Partager sur Facebook">
                    <Button
                      isIconOnly
                      variant="flat"
                      className="bg-blue-600/10 text-blue-600 dark:text-blue-400"
                      onClick={() => handleShare("facebook")}
                    >
                      <IoLogoFacebook className="text-xl" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Partager sur LinkedIn">
                    <Button
                      isIconOnly
                      variant="flat"
                      className="bg-blue-700/10 text-blue-700 dark:text-blue-500"
                      onClick={() => handleShare("linkedin")}
                    >
                      <IoLogoLinkedin className="text-xl" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Partager sur WhatsApp">
                    <Button
                      isIconOnly
                      variant="flat"
                      className="bg-green-500/10 text-green-600 dark:text-green-500"
                      onClick={() => handleShare("whatsapp")}
                    >
                      <IoLogoWhatsapp className="text-xl" />
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Credits Section */}
              {(photographers.length > 0 || project.author) && (
                <div className="border-divider bg-default-50 dark:bg-default-50 rounded-xl border p-6">
                  <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                    <IoCamera className="text-primary" />
                    Crédits
                  </h3>
                  <div className="space-y-4">
                    {photographers.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-foreground/50 text-xs tracking-wider uppercase">
                          Photographies
                        </span>
                        {photographers.map((photographer, index) => (
                          <Link
                            key={index}
                            href={photographer.url}
                            target="_blank"
                            className="text-foreground hover:text-primary font-medium transition-colors"
                          >
                            {photographer.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {project.author && (
                      <div className="flex flex-col">
                        <span className="text-foreground/50 text-xs tracking-wider uppercase">
                          Rédaction
                        </span>
                        <p className="text-foreground hover:text-primary font-medium transition-colors">
                          {" "}
                          {project.author.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Press Section */}
              {project.press_articles && project.press_articles.length > 0 && (
                <div className="border-divider bg-default-50 dark:bg-default-50 rounded-xl border p-6">
                  <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                    <IoNewspaper className="text-primary" />
                    Ils parlent de nous
                  </h3>
                  <div className="flex flex-col gap-3">
                    {project.press_articles.map((article, index) => (
                      <Link
                        key={index}
                        href={article.url}
                        target="_blank"
                        className="group bg-background hover:border-primary/20 flex flex-col rounded-lg border border-transparent p-3 shadow-sm transition-all hover:shadow-md"
                      >
                        <span className="text-foreground group-hover:text-primary line-clamp-2 font-medium transition-colors">
                          {article.title}
                        </span>
                        <span className="text-default-500 mt-1 text-xs">
                          {article.source}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConcertPageClient;
