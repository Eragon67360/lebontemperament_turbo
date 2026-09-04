"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import { ConcertProject } from "@/types/projects";
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
import { Concert, Context, Tour } from "@repo/domain/types/concerts";
import { Event } from "@repo/domain/types/events";
import { Rehearsal } from "@repo/domain/types/rehearsals";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import {
  IoCalendarClearOutline,
  IoEyeOutline,
  IoGlobeOutline,
  IoImageOutline,
  IoLocationOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoTimeOutline,
} from "react-icons/io5";

interface ConcertsClientProps {
  initialConcerts: Concert[];
  initialEvents: Event[];
  initialRehearsals: Rehearsal[];
  initialTours: Tour[];
  initialProjects: ConcertProject[];
}

const contextLabels: Record<Context, string> = {
  orchestre: "Orchestre",
  choeur: "Chœur",
  orchestre_et_choeur: "Orchestre et chœur",
  autre: "Autre",
};

const eventTypeLabels: Record<Event["event_type"], string> = {
  concert: "Concert",
  repetition: "Répétition",
  sejour: "Séjour",
  vente: "Vente",
  autre: "Autre",
};

const InfoRow = ({
  icon: Icon,
  children,
  emphasis = false,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  emphasis?: boolean;
}) => (
  <div
    className={`flex items-center gap-3 text-sm ${
      emphasis
        ? "text-foreground font-medium"
        : "text-default-600 dark:text-default-400"
    }`}
  >
    <Icon className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </div>
);

const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <div className="border-divider bg-default-50/60 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
    <div className="bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-full">
      <IoMusicalNotesOutline
        className="text-primary size-7"
        aria-hidden="true"
      />
    </div>
    <h3 className="text-foreground text-xl font-semibold">{title}</h3>
    <p className="text-default-600 dark:text-default-400 mt-2 max-w-lg">
      {message}
    </p>
  </div>
);

const ConcertCard = ({
  concert,
  featured = false,
  showPoster = true,
  onPosterClick,
}: {
  concert: Concert;
  featured?: boolean;
  showPoster?: boolean;
  onPosterClick: (image: string) => void;
}) => {
  const title = concert.name || `Concert à ${concert.place}`;

  return (
    <article
      className={`border-divider bg-background group overflow-hidden rounded-2xl border ${
        featured && showPoster
          ? "grid md:grid-cols-[minmax(220px,0.8fr)_1.2fr]"
          : "flex h-full flex-col"
      }`}
    >
      {showPoster && (
        <button
          type="button"
          onClick={() => concert.affiche && onPosterClick(concert.affiche)}
          disabled={!concert.affiche}
          aria-label={
            concert.affiche
              ? `Voir l’affiche de ${title}`
              : `Aucune affiche disponible pour ${title}`
          }
          className={`bg-default-100 relative w-full overflow-hidden ${
            featured ? "min-h-64 md:min-h-full" : "h-44"
          } ${concert.affiche ? "cursor-zoom-in" : "cursor-default"}`}
        >
          {concert.affiche ? (
            <Image
              src={concert.affiche}
              alt={`Affiche de ${title}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 40vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
            />
          ) : (
            <span className="text-default-400 flex h-full flex-col items-center justify-center gap-2 text-xs">
              <IoImageOutline className="size-9" aria-hidden="true" />
              Affiche à venir
            </span>
          )}
        </button>
      )}

      <div
        className={`flex flex-1 flex-col ${featured ? "p-7 md:p-10" : "p-6"}`}
      >
        {featured && (
          <span className="text-primary mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
            Prochain rendez-vous
          </span>
        )}
        <h3
          className={`text-foreground font-bold ${
            featured ? "text-3xl md:text-4xl" : "text-xl"
          }`}
        >
          {title}
        </h3>
        <div className={`space-y-3 ${featured ? "mt-7" : "mt-5"}`}>
          <InfoRow icon={IoCalendarClearOutline} emphasis={featured}>
            {format(new Date(concert.date), "EEEE d MMMM yyyy", {
              locale: fr,
            })}
          </InfoRow>
          <InfoRow icon={IoTimeOutline}>
            {concert.time.slice(0, 5).replace(":", "h")}
          </InfoRow>
          <InfoRow icon={IoLocationOutline}>{concert.place}</InfoRow>
        </div>

        {concert.additional_informations && (
          <p className="text-default-600 dark:text-default-400 mt-5 text-sm whitespace-pre-wrap">
            {concert.additional_informations}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-3 pt-7">
          {concert.related_link && (
            <Button
              as={Link}
              href={concert.related_link}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              radius="sm"
              endContent={<IoGlobeOutline aria-hidden="true" />}
            >
              Informations et réservation
            </Button>
          )}
          {concert.affiche && (
            <Button
              variant="bordered"
              radius="sm"
              onPress={() => onPosterClick(concert.affiche as string)}
              startContent={<IoEyeOutline aria-hidden="true" />}
            >
              Voir l’affiche
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

const ConcertsClient = ({
  initialConcerts,
  initialEvents,
  initialRehearsals,
  initialTours,
  initialProjects,
}: ConcertsClientProps) => {
  const concerts = useMemo(
    () =>
      [...initialConcerts].sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime(),
      ),
    [initialConcerts],
  );
  const events = initialEvents;
  const rehearsals = initialRehearsals;
  const tours = initialTours;
  const stories = useMemo(
    () =>
      [...initialProjects].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [initialProjects],
  );

  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const navItems = useMemo(
    () =>
      [
        { id: "agenda", label: "À venir" },
        { id: "histoires", label: "Histoires de concerts" },
        { id: "evenements", label: "Autres rendez-vous" },
      ] as const,
    [],
  );
  const [activeSection, setActiveSection] = useState<string>(navItems[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const sectionIds = useMemo(
    () => new Set<string>(navItems.map((item) => item.id)),
    [navItems],
  );

  const openPoster = (poster: string) => {
    setSelectedPoster(poster);
    onOpen();
  };

  const scrollToSection = useCallback(
    (sectionId: string, behavior: ScrollBehavior = "smooth") => {
      if (!sectionIds.has(sectionId)) return;
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${sectionId}`,
      );
      sectionRefs.current[sectionId]?.scrollIntoView({
        behavior,
        block: "start",
      });
      setActiveSection(sectionId);
    },
    [sectionIds],
  );

  useEffect(() => {
    const legacyHashes: Record<string, string> = {
      concerts: "agenda",
      projets: "histoires",
    };

    const scrollFromHash = () => {
      const rawHash = window.location.hash.slice(1);
      if (!rawHash) return;

      let decodedHash: string;
      try {
        decodedHash = decodeURIComponent(rawHash);
      } catch {
        return;
      }

      const sectionId = legacyHashes[decodedHash] || decodedHash;
      if (!sectionIds.has(sectionId)) return;

      requestAnimationFrame(() => {
        sectionRefs.current[sectionId]?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
        setActiveSection(sectionId);
      });
    };

    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, [sectionIds]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) setActiveSection(visibleEntry.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );

    Object.values(sectionRefs.current).forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const nextConcert = concerts[0];
  const remainingConcerts = concerts.slice(1);
  const standaloneConcerts = remainingConcerts.filter(
    (concert) => !concert.tour_id,
  );
  const toursWithConcerts = tours
    .map((tour) => ({
      tour,
      concerts: remainingConcerts.filter(
        (concert) => concert.tour_id === tour.id,
      ),
    }))
    .filter(({ concerts: tourConcerts }) => tourConcerts.length > 0);

  return (
    <>
      <div className="container mx-auto mb-8 flex w-full flex-col">
        <header className="px-6 py-10 md:px-8 md:py-14 lg:py-20">
          <h1 className="text-title leading-none">
            <span className="text-primary/60 dark:text-primary block font-light">
              Agenda
            </span>{" "}
            <span className="text-foreground block font-bold">
              des concerts
            </span>
          </h1>
          <hr className="border-divider mt-5 lg:mt-8" />
          <p className="text-default-600 dark:text-default-400 mt-5 max-w-2xl text-sm leading-relaxed md:text-base">
            Retrouvez nos prochains concerts et tournées, puis plongez dans les
            histoires, images et programmes qui ont marqué Le Bon Tempérament.
          </p>
        </header>

        <div className="mx-auto w-full max-w-360 px-4 md:px-8">
          <nav
            className="border-divider mb-12 border-b pb-3 lg:hidden"
            aria-label="Sections de l’agenda"
          >
            <div className="no-scrollbar flex gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  aria-current={
                    activeSection === item.id ? "location" : undefined
                  }
                  className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 ${
                    activeSection === item.id
                      ? "bg-primary text-white"
                      : "text-default-600 hover:bg-default-100 hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex flex-col items-start gap-12 lg:flex-row xl:gap-16">
            <div className="flex w-full min-w-0 flex-col gap-16 lg:flex-1">
              <section
                id="agenda"
                ref={(element) => {
                  sectionRefs.current.agenda = element;
                }}
                className="scroll-mt-24"
                aria-labelledby="agenda-title"
              >
                <div className="mb-9 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                      À vos agendas
                    </p>
                    <h2
                      id="agenda-title"
                      className="text-foreground mt-2 text-3xl font-bold md:text-5xl"
                    >
                      Prochains concerts
                    </h2>
                  </div>
                  {concerts.length > 0 && (
                    <p className="text-default-500 text-sm">
                      {`${concerts.length} ${
                        concerts.length > 1
                          ? "dates annoncées"
                          : "date annoncée"
                      }`}
                    </p>
                  )}
                </div>

                {!nextConcert ? (
                  <EmptyState
                    title="La prochaine date se prépare"
                    message="Aucun concert n’est encore annoncé. Découvrez en attendant nos histoires de concerts ou rejoignez-nous pour vivre la musique de l’intérieur."
                  />
                ) : (
                  <div className="space-y-14">
                    <ConcertCard
                      concert={nextConcert}
                      featured
                      showPoster={!nextConcert.tour_id}
                      onPosterClick={openPoster}
                    />

                    {toursWithConcerts.map(
                      ({ tour, concerts: tourConcerts }) => (
                        <section
                          key={tour.id}
                          className="border-divider bg-default-50/60 rounded-2xl border p-5 md:p-8"
                          aria-labelledby={`tour-${tour.id}`}
                        >
                          <div className="grid gap-7 md:grid-cols-[160px_1fr] md:items-center">
                            {tour.tour_poster ? (
                              <Tooltip content="Voir l’affiche de la tournée">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPoster(tour.tour_poster as string)
                                  }
                                  className="relative mx-auto size-40 overflow-hidden rounded-xl"
                                  aria-label={`Voir l’affiche de la tournée ${tour.name}`}
                                >
                                  <Image
                                    src={tour.tour_poster}
                                    alt={`Affiche de la tournée ${tour.name}`}
                                    fill
                                    className="object-cover"
                                    sizes="160px"
                                  />
                                </button>
                              </Tooltip>
                            ) : (
                              <div className="bg-primary/10 text-primary mx-auto flex size-40 items-center justify-center rounded-xl">
                                <IoMusicalNotesOutline
                                  className="size-12"
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                            <div>
                              <span className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                                Tournée
                              </span>
                              <h3
                                id={`tour-${tour.id}`}
                                className="text-foreground mt-2 text-2xl font-bold md:text-3xl"
                              >
                                {tour.name}
                              </h3>
                              {tour.description && (
                                <p className="text-default-600 dark:text-default-400 mt-3 max-w-3xl">
                                  {tour.description}
                                </p>
                              )}
                              <span className="bg-background text-primary mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium">
                                {contextLabels[tour.context as Context]}
                              </span>
                            </div>
                          </div>

                          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {tourConcerts.map((concert) => (
                              <ConcertCard
                                key={concert.id}
                                concert={concert}
                                showPoster={false}
                                onPosterClick={openPoster}
                              />
                            ))}
                          </div>
                        </section>
                      ),
                    )}

                    {standaloneConcerts.length > 0 && (
                      <div>
                        <h3 className="text-foreground mb-6 text-2xl font-bold">
                          Toutes les dates
                        </h3>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                          {standaloneConcerts.map((concert) => (
                            <ConcertCard
                              key={concert.id}
                              concert={concert}
                              onPosterClick={openPoster}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section
                id="histoires"
                ref={(element) => {
                  sectionRefs.current.histoires = element;
                }}
                className="scroll-mt-24"
                aria-labelledby="stories-title"
              >
                <div className="mb-9 max-w-3xl">
                  <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                    Mémoire musicale
                  </p>
                  <h2
                    id="stories-title"
                    className="text-foreground mt-2 text-3xl font-bold md:text-5xl"
                  >
                    Histoires de concerts
                  </h2>
                  <p className="text-default-600 dark:text-default-400 mt-4 leading-relaxed">
                    Programmes, coulisses, photographies et articles de presse :
                    découvrez les projets artistiques qui ont façonné notre
                    histoire.
                  </p>
                </div>

                {stories.length === 0 ? (
                  <EmptyState
                    title="Les histoires arrivent bientôt"
                    message="Nos archives éditoriales sont en cours de préparation."
                  />
                ) : (
                  <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {stories.map((story) => (
                      <article
                        key={story.slug}
                        className="border-divider bg-background group flex flex-col overflow-hidden rounded-2xl border"
                      >
                        <Link
                          href={`/concerts/${story.slug}`}
                          className="relative block h-56 overflow-hidden"
                        >
                          {story.banniere?.url ? (
                            <CloudinaryImage
                              src={story.banniere.url}
                              alt={`Image de ${story.name}`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              width={720}
                              height={440}
                              rounded={RoundedSize.NONE}
                            />
                          ) : (
                            <span className="bg-default-100 text-default-400 flex h-full items-center justify-center">
                              <IoImageOutline
                                className="size-12"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </Link>
                        <div className="flex flex-1 flex-col p-6">
                          <span className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
                            {new Date(story.date).getFullYear()}
                          </span>
                          <h3 className="text-foreground mt-2 text-xl font-bold">
                            {story.name} {story.subName || ""}
                          </h3>
                          {story.explanation && (
                            <p className="text-default-600 dark:text-default-400 mt-3 line-clamp-4 grow text-sm leading-relaxed">
                              {story.explanation}
                            </p>
                          )}
                          <Button
                            as={Link}
                            href={`/concerts/${story.slug}`}
                            color="primary"
                            variant="light"
                            radius="sm"
                            className="mt-5 w-fit"
                            endContent={
                              <IoIosArrowRoundForward aria-hidden="true" />
                            }
                          >
                            Lire l’histoire
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section
                id="evenements"
                ref={(element) => {
                  sectionRefs.current.evenements = element;
                }}
                className="scroll-mt-24"
                aria-labelledby="events-title"
              >
                <div className="mb-9">
                  <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                    Autour de l’ensemble
                  </p>
                  <h2
                    id="events-title"
                    className="text-foreground mt-2 text-3xl font-bold md:text-4xl"
                  >
                    Autres rendez-vous publics
                  </h2>
                </div>

                {events.length === 0 ? (
                  <p className="text-default-500 border-divider border-t py-8">
                    Aucun autre rendez-vous public n’est annoncé pour le moment.
                  </p>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <article
                        key={event.id}
                        className="border-divider bg-default-50/50 flex flex-col rounded-xl border p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-foreground text-lg font-semibold">
                            {event.title}
                          </h3>
                          <span className="bg-primary/10 text-primary shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                            {eventTypeLabels[event.event_type]}
                          </span>
                        </div>
                        <div className="mt-5 grow space-y-3">
                          <InfoRow icon={IoCalendarClearOutline}>
                            {format(new Date(event.date_from), "d MMMM yyyy", {
                              locale: fr,
                            })}
                            {event.date_to &&
                              ` au ${format(
                                new Date(event.date_to),
                                "d MMMM yyyy",
                                {
                                  locale: fr,
                                },
                              )}`}
                          </InfoRow>
                          <InfoRow icon={IoTimeOutline}>
                            {event.time.slice(0, 5).replace(":", "h")}
                          </InfoRow>
                          <InfoRow icon={IoLocationOutline}>
                            {event.location}
                          </InfoRow>
                        </div>
                        {event.description && (
                          <p className="text-default-600 dark:text-default-400 mt-5 text-sm whitespace-pre-wrap">
                            {event.description}
                          </p>
                        )}
                        {event.link && (
                          <Button
                            as={Link}
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color="primary"
                            radius="sm"
                            className="mt-5 w-fit"
                            endContent={<IoGlobeOutline aria-hidden="true" />}
                          >
                            Plus d’informations
                          </Button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="bg-primary/10 border-primary/20 grid gap-7 rounded-2xl border p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
                <div>
                  <div className="flex items-center gap-3">
                    <IoPeopleOutline
                      className="text-primary size-7"
                      aria-hidden="true"
                    />
                    <h2 className="text-foreground text-2xl font-bold">
                      Envie de nous rejoindre ?
                    </h2>
                  </div>
                  <p className="text-default-700 dark:text-default-300 mt-3 max-w-2xl">
                    Les répétitions sont des temps de travail pour les membres
                    et futurs membres. Découvrez le fonctionnement de l’ensemble
                    avant de venir chanter ou jouer avec nous.
                  </p>
                  {rehearsals[0] && (
                    <p className="text-default-600 dark:text-default-400 mt-4 text-sm">
                      Prochaine répétition annoncée :{" "}
                      <strong className="text-foreground">
                        {format(new Date(rehearsals[0].date), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </strong>
                    </p>
                  )}
                </div>
                <Button
                  as={Link}
                  href="/rejoindre#repetitions"
                  color="primary"
                  radius="sm"
                  size="lg"
                  endContent={<IoIosArrowRoundForward aria-hidden="true" />}
                >
                  Découvrir comment participer
                </Button>
              </aside>
            </div>

            <aside
              className="hidden h-fit w-56 shrink-0 self-start lg:block"
              style={{ position: "sticky", top: "6rem" }}
            >
              <nav aria-label="Navigation dans l’agenda">
                <p className="text-default-400 mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
                  Sur cette page
                </p>
                <div className="flex flex-col">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      aria-current={
                        activeSection === item.id ? "location" : undefined
                      }
                      className={`border-l-2 px-5 py-3 text-left text-sm font-medium transition-colors focus-visible:ring-2 ${
                        activeSection === item.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-divider text-default-500 hover:border-primary/40 hover:bg-default-50 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </nav>
            </aside>
          </div>
        </div>
      </div>

      <Modal size="3xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-foreground">
                Affiche du concert
              </ModalHeader>
              <ModalBody className="p-4">
                {selectedPoster && (
                  <div className="flex justify-center">
                    <Image
                      src={selectedPoster}
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
