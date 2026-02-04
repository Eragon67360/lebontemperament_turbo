"use client";

import CloudinaryImage from "@/components/CloudinaryImage"; // Check this path relative to your folder structure
import { Concert, Tour } from "@/types/concerts";
import { Event } from "@/types/events";
import { ConcertProject } from "@/types/projects";
import { Rehearsal } from "@/types/rehearsals";
import { RoundedSize } from "@/utils/types";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import {
  IoCalendarClearOutline,
  IoEyeOutline,
  IoGlobeOutline,
  IoImageOutline,
  IoLocationOutline,
  IoMusicalNotesOutline,
  IoTimeOutline,
} from "react-icons/io5";

// --- Interfaces ---
interface ConcertsClientProps {
  initialConcerts: Concert[];
  initialEvents: Event[];
  initialRehearsals: Rehearsal[];
  initialTours: Tour[];
  initialProjects: ConcertProject[];
}

// --- Reusable Components ---
const InfoRow = ({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="text-primary h-5 w-5 shrink-0" />
    <span className="text-default-500 dark:text-default-400">{children}</span>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  children?: React.ReactNode;
}) => (
  <div className="border-divider bg-default-50/50 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
    <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
      <Icon className="text-primary h-8 w-8" />
    </div>
    <h3 className="text-foreground text-xl font-semibold">{title}</h3>
    <p className="text-default-500 dark:text-default-400 mt-2 max-w-md">
      {message}
    </p>
    {children && <div className="mt-6">{children}</div>}
  </div>
);

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    concert: "Concert",
    repetition: "Répétition",
    sejour: "Séjour",
    vente: "Vente",
    autre: "Autre",
  };
  return labels[type] || type;
};

const ConcertsClient = ({
  initialConcerts,
  initialEvents,
  initialRehearsals,
  initialTours,
  initialProjects,
}: ConcertsClientProps) => {
  // --- STATE ---
  // Initialize state with Server-Side Data
  const [concerts] = useState<Array<Concert>>(initialConcerts);
  const [events] = useState<Array<Event>>(initialEvents);
  const [rehearsals] = useState<Array<Rehearsal>>(initialRehearsals);
  const [tours] = useState<Array<Tour>>(initialTours);
  const [projects] = useState<Array<ConcertProject>>(initialProjects);

  const [selectedConcertImage, setSelectedConcertImage] = useState<
    string | null
  >(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const navItems = useMemo(
    () =>
      [
        { id: "concerts", label: "Concerts" },
        { id: "projets", label: "Projets" },
        { id: "evenements", label: "Événements" },
        { id: "repetitions", label: "Répétitions" },
      ] as const,
    [],
  );

  const [activeSection, setActiveSection] = useState<string>(navItems[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // --- INTERACTION ---
  const handleImageClick = (imageUrl: string) => {
    setSelectedConcertImage(imageUrl);
    onOpen();
  };

  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // --- SCROLLSPY ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-30% 0px -70% 0px" },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // --- DERIVED DATA ---
  const standaloneConcerts = concerts.filter((c) => !c.tour_id);
  const hasRenderedTours = tours.some((tour) =>
    concerts.some((c) => c.tour_id === tour.id),
  );

  return (
    <>
      <div className="container mx-auto mb-8 flex w-full flex-col">
        {/* Header Section */}
        <div className="px-8 py-4 md:py-8 lg:py-16">
          <div>
            <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
              Nos
            </h1>
            <h2 className="text-title text-foreground leading-none font-bold">
              Concerts
            </h2>
          </div>
          <hr className="border-divider mt-2 md:mt-4 lg:mt-8" />
          <p className="text-default-600 dark:text-default-400 mt-4 max-w-2xl text-sm md:text-base">
            Découvrez nos prochains concerts, nos projets musicaux en cours, les
            événements à venir et le calendrier des répétitions.
          </p>
        </div>

        {/* Sticky Navigation */}
        <nav className="border-divider bg-background/80 sticky top-0 z-40 mb-8 w-full border-b backdrop-blur-lg">
          <div className="flex gap-1 overflow-x-auto px-8 py-3 md:gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:ring-2 focus:outline-none md:text-base ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-default-600 hover:text-primary focus:text-primary focus:ring-primary/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="mx-0 flex w-full max-w-[1440px] flex-col px-4 md:px-0">
          {/* --- CONCERTS --- */}
          <section
            id="concerts"
            ref={(el) => {
              sectionRefs.current.concerts = el;
            }}
            className="bg-default-50 dark:bg-default-50/5 mb-8 w-full scroll-mt-24 rounded-2xl p-4 md:p-8"
          >
            <h2 className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light">
              Prochains concerts
            </h2>

            {concerts.length === 0 ? (
              <EmptyState
                icon={IoMusicalNotesOutline}
                title="Aucun concert à venir"
                message="Les prochains concerts arriveront bientôt ! En attendant, consultez nos projets en cours ou nos dates de répétitions."
              />
            ) : (
              <div className="space-y-16">
                {tours.map((tour) => {
                  const tourConcerts = concerts.filter(
                    (c) => c.tour_id === tour.id,
                  );
                  if (tourConcerts.length === 0) return null;

                  return (
                    <div key={tour.id} className="space-y-8">
                      {/* Tour Card */}
                      <div className="from-primary/10 to-primary/5 relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 md:p-8">
                        <div className="relative z-10 grid items-center gap-6 md:grid-cols-3">
                          {tour.tour_poster && (
                            <div className="flex justify-center md:col-span-1 md:justify-start">
                              <Tooltip content="Voir l'affiche">
                                <button
                                  onClick={() =>
                                    handleImageClick(tour.tour_poster as string)
                                  }
                                  className="group block"
                                >
                                  <Image
                                    src={tour.tour_poster}
                                    alt={`Affiche de la tournée ${tour.name}`}
                                    width={300}
                                    height={300}
                                    className="h-32 w-32 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-105 md:h-48 md:w-48"
                                  />
                                </button>
                              </Tooltip>
                            </div>
                          )}
                          <div className="space-y-4 text-center md:col-span-2 md:text-left">
                            <h3 className="text-foreground text-3xl font-bold">
                              {tour.name}
                            </h3>
                            <p className="text-default-600 dark:text-default-300">
                              {tour.description}
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-start">
                              {tour.start_date && tour.end_date && (
                                <InfoRow icon={IoCalendarClearOutline}>
                                  Du{" "}
                                  {format(
                                    new Date(tour.start_date),
                                    "dd MMMM",
                                    { locale: fr },
                                  )}{" "}
                                  au{" "}
                                  {format(
                                    new Date(tour.end_date),
                                    "dd MMMM yyyy",
                                    { locale: fr },
                                  )}
                                </InfoRow>
                              )}
                              <span className="bg-background/80 text-primary rounded-full px-3 py-1 text-xs font-medium">
                                {tour.context === "orchestre_et_choeur"
                                  ? "Orchestre et Chœur"
                                  : tour.context}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tour Concerts */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tourConcerts.map((concert) => (
                          <div
                            key={concert.id}
                            className="group border-divider bg-background hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                          >
                            <div className="grow space-y-4 p-6">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-foreground group-hover:text-primary line-clamp-2 text-lg font-semibold transition-colors">
                                  {concert.name || `Concert à ${concert.place}`}
                                </h4>
                                {concert.affiche && (
                                  <Tooltip content="Voir l'affiche">
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      radius="full"
                                      size="sm"
                                      onClick={() =>
                                        handleImageClick(
                                          concert.affiche as string,
                                        )
                                      }
                                    >
                                      <IoEyeOutline className="text-default-500 h-5 w-5" />
                                    </Button>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="space-y-3">
                                <InfoRow icon={IoCalendarClearOutline}>
                                  {format(
                                    new Date(concert.date),
                                    "dd MMMM yyyy",
                                    { locale: fr },
                                  )}
                                </InfoRow>
                                <InfoRow icon={IoTimeOutline}>
                                  {concert.time.slice(0, 5).replace(":", "h")}
                                </InfoRow>
                                <InfoRow icon={IoLocationOutline}>
                                  <span className="font-medium">
                                    {concert.place}
                                  </span>
                                </InfoRow>
                              </div>
                            </div>
                            {concert.additional_informations && (
                              <div className="border-divider bg-default-50/50 dark:bg-default-100/20 border-t px-6 py-4">
                                <p className="text-default-500 dark:text-default-400 text-sm whitespace-pre-wrap italic">
                                  {concert.additional_informations}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Standalone Concerts */}
                {standaloneConcerts.length > 0 && (
                  <div className="space-y-8">
                    {hasRenderedTours && (
                      <h3 className="text-foreground text-2xl font-bold">
                        Autres Concerts
                      </h3>
                    )}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {standaloneConcerts.map((concert) => (
                        <div
                          key={concert.id}
                          className="group border-divider bg-background hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                          {/* Standalone Poster/Placeholder Area */}
                          <div className="bg-default-100 relative h-48 w-full overflow-hidden">
                            {concert.affiche ? (
                              <Image
                                src={concert.affiche}
                                alt={concert.name || "Affiche"}
                                fill
                                className="cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                                onClick={() =>
                                  handleImageClick(concert.affiche as string)
                                }
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                <IoImageOutline className="text-primary/20 h-10 w-10" />
                                <span className="text-default-400 text-xs">
                                  Pas d&apos;affiche
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grow space-y-4 p-6">
                            <h4 className="text-foreground group-hover:text-primary line-clamp-2 text-lg font-semibold transition-colors">
                              {concert.name || `Concert à ${concert.place}`}
                            </h4>
                            <div className="space-y-3">
                              <InfoRow icon={IoCalendarClearOutline}>
                                {format(
                                  new Date(concert.date),
                                  "dd MMMM yyyy",
                                  { locale: fr },
                                )}
                              </InfoRow>
                              <InfoRow icon={IoTimeOutline}>
                                {concert.time.slice(0, 5).replace(":", "h")}
                              </InfoRow>
                              <InfoRow icon={IoLocationOutline}>
                                <span className="font-medium">
                                  {concert.place}
                                </span>
                              </InfoRow>
                              {concert.related_link && (
                                <InfoRow icon={IoGlobeOutline}>
                                  <Link
                                    href={concert.related_link}
                                    target="_blank"
                                    className="hover:text-primary hover:underline"
                                  >
                                    Lien connexe
                                  </Link>
                                </InfoRow>
                              )}
                            </div>
                          </div>
                          {concert.additional_informations && (
                            <div className="border-divider bg-default-50/50 dark:bg-default-100/20 border-t px-6 py-4">
                              <p className="text-default-500 dark:text-default-400 text-sm whitespace-pre-wrap italic">
                                {concert.additional_informations}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* --- PROJECTS --- */}
          <section
            id="projets"
            ref={(el) => {
              sectionRefs.current.projets = el;
            }}
            className="mb-8 w-full scroll-mt-24 p-4 md:p-8"
          >
            <h2 className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light">
              Nos projets
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...projects]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((projet) => (
                  <div
                    key={projet.slug}
                    className="group border-divider bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <Link
                      href={`/concerts/${projet.slug}`}
                      className="relative block h-48 w-full overflow-hidden"
                    >
                      {projet.banniere?.url ? (
                        <CloudinaryImage
                          src={projet.banniere.url}
                          alt={`Bannière ${projet.name}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          width={600}
                          height={300}
                          rounded={RoundedSize.NONE}
                        />
                      ) : (
                        <div className="bg-default-100 flex h-full w-full items-center justify-center">
                          <IoImageOutline className="text-default-400 h-12 w-12" />
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-foreground line-clamp-2 text-lg font-semibold">
                        {projet.name} {projet.subName || ""}
                      </h3>
                      {projet.explanation && (
                        <div
                          className="text-default-500 dark:text-default-400 mt-2 line-clamp-4 grow text-sm"
                          dangerouslySetInnerHTML={{
                            __html: projet.explanation,
                          }}
                        />
                      )}
                      <div className="border-divider mt-4 border-t pt-4">
                        <Button
                          as={Link}
                          href={`/concerts/${projet.slug}`}
                          color="primary"
                          variant="flat"
                          size="sm"
                          endContent={<IoIosArrowRoundForward />}
                        >
                          Voir plus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* --- EVENTS --- */}
          <section
            id="evenements"
            ref={(el) => {
              sectionRefs.current.evenements = el;
            }}
            className="mb-8 w-full scroll-mt-24 p-4 md:p-8"
          >
            <h2 className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light">
              Autres événements
            </h2>
            {events.length === 0 ? (
              <EmptyState
                icon={IoCalendarClearOutline}
                title="Aucun événement public"
                message="Il n'y a pas d'autres événements prévus pour le moment."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border-divider bg-background flex flex-col rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-foreground line-clamp-2 text-lg font-semibold">
                        {event.title}
                      </h4>
                      <span className="bg-primary/10 text-primary shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </div>
                    <div className="mt-4 grow space-y-3">
                      <InfoRow icon={IoCalendarClearOutline}>
                        {format(new Date(event.date_from), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                        {event.date_to &&
                          ` au ${format(new Date(event.date_to), "dd MMMM yyyy", { locale: fr })}`}
                      </InfoRow>
                      <InfoRow icon={IoTimeOutline}>
                        {event.time.slice(0, 5).replace(":", "h")}
                      </InfoRow>
                      <InfoRow icon={IoLocationOutline}>
                        {event.location}
                      </InfoRow>
                    </div>
                    {event.description && (
                      <p className="text-default-500 dark:text-default-400 mt-4 line-clamp-4 text-sm whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                    {event.link && (
                      <div className="border-divider mt-4 border-t pt-4">
                        <Button
                          as={Link}
                          href={event.link}
                          target="_blank"
                          color="primary"
                          variant="light"
                          size="sm"
                          endContent={<IoGlobeOutline />}
                        >
                          Plus d&apos;infos
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* --- REHEARSALS --- */}
          <section
            id="repetitions"
            ref={(el) => {
              sectionRefs.current.repetitions = el;
            }}
            className="bg-default-50 dark:bg-default-50/5 mb-8 w-full scroll-mt-24 rounded-2xl p-4 md:p-8"
          >
            <h2 className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light">
              Prochaines répétitions
            </h2>
            {rehearsals.length === 0 ? (
              <EmptyState
                icon={IoMusicalNotesOutline}
                title="Aucune répétition à venir"
                message="Le calendrier des répétitions sera bientôt mis à jour."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rehearsals.map((rehearsal) => (
                  <div
                    key={rehearsal.id}
                    className="border-divider bg-background rounded-xl border p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-foreground text-lg font-semibold">
                        {rehearsal.name}
                      </h4>
                      <span className="bg-primary/10 text-primary shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                        {rehearsal.group_type}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <InfoRow icon={IoCalendarClearOutline}>
                        {format(new Date(rehearsal.date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </InfoRow>
                      <InfoRow icon={IoTimeOutline}>
                        {rehearsal.start_time.slice(0, 5).replace(":", "h")} -{" "}
                        {rehearsal.end_time.slice(0, 5).replace(":", "h")}
                      </InfoRow>
                      <InfoRow icon={IoLocationOutline}>
                        {rehearsal.place}
                      </InfoRow>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <Modal size="3xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-foreground">Affiche</ModalHeader>
              <ModalBody className="p-4">
                {selectedConcertImage && (
                  <div className="flex justify-center">
                    <Image
                      src={selectedConcertImage}
                      alt="Affiche du concert ou de la tournée"
                      width={800}
                      height={1200}
                      className="h-auto max-h-[80vh] w-full max-w-full rounded-lg object-contain"
                    />
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ConcertsClient;
