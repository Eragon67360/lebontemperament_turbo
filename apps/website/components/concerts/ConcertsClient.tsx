"use client";

import projects from "@/public/json/projects.json";
import { Concert, Tour } from "@/types/concerts";
import { Event } from "@/types/events";
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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { IoIosArrowRoundDown, IoIosArrowRoundForward } from "react-icons/io";
import {
  IoCalendarClear,
  IoEye,
  IoGlobeSharp,
  IoImageOutline,
  IoLocationSharp,
  IoMusicalNotes,
  IoTime,
} from "react-icons/io5";
import CloudinaryImage from "../CloudinaryImage";

const ConcertsClient = () => {
  const [concerts, setConcerts] = useState<Array<Concert>>([]);
  const [events, setEvents] = useState<Array<Event>>([]);
  const [rehearsals, setRehearsals] = useState<Array<Rehearsal>>([]);
  const [tours, setTours] = useState<Array<Tour>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcertImage, setSelectedConcertImage] = useState<
    string | null
  >(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const fetchData = async (
      endpoint: string,
      setState:
        | Dispatch<SetStateAction<Concert[]>>
        | Dispatch<SetStateAction<Event[]>>
        | Dispatch<SetStateAction<Rehearsal[]>>
        | Dispatch<SetStateAction<Tour[]>>,
    ) => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureItems = data.filter(
          (item: {
            date: number | string | Date;
            date_from: number | string | Date;
          }) => {
            const itemDate = new Date(item.date || item.date_from);
            return itemDate >= today;
          },
        );

        setState(futureItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTours = async () => {
      try {
        const response = await fetch("/api/tours");
        const data = await response.json();

        // Tours might not need date filtering, or use different logic
        // If you want to filter by end_date:
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeTours = data.filter((tour: Tour) => {
          // Show tours that haven't ended yet, or tours without dates
          if (!tour.end_date) return true;
          const endDate = new Date(tour.end_date);
          return endDate >= today;
        });

        setTours(activeTours);
      } catch (error) {
        console.error("Error fetching tours:", error);
      }
    };

    fetchData("/api/prochains-concerts", setConcerts);
    fetchData("/api/events", setEvents);
    fetchData("/api/rehearsals", setRehearsals);
    fetchTours();
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setSelectedConcertImage(imageUrl);
    onOpen();
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* Hero Section */}
      <section className="bg-background flex w-full justify-center py-16">
        <div className="w-full max-w-[1440px] px-8 lg:px-24">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
                Nos
              </h1>
              <h2 className="text-title text-foreground leading-none font-bold">
                Concerts
              </h2>
            </div>
            <Button
              variant="light"
              radius="sm"
              onClick={() => {
                const el = document.getElementById("projects-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-default-400 hover:text-default-500 flex items-center gap-2 text-xl font-light md:text-2xl lg:text-3xl"
              aria-label="Voir les projets"
            >
              <span>Voir projets</span>
              <IoIosArrowRoundDown />
            </Button>
          </div>
          <hr className="border-divider mt-8" />
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-0 flex w-full max-w-[1440px] flex-col">
        {/* Upcoming Concerts Section with Tours */}
        <section
          className="bg-default-50 w-full px-8 py-16 lg:px-24"
          aria-labelledby="upcoming-concerts-title"
        >
          <h2
            id="upcoming-concerts-title"
            className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light"
          >
            Prochains concerts
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-default-200 h-48 rounded-lg"></div>
                  <div className="bg-default-100 mt-4 space-y-3 rounded-lg p-4">
                    <div className="bg-default-200 h-4 w-3/4 rounded"></div>
                    <div className="bg-default-200 h-4 w-1/2 rounded"></div>
                    <div className="bg-default-200 h-4 w-2/3 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : concerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16">
              <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full sm:mb-6 sm:h-20 sm:w-20">
                <IoMusicalNotes className="text-primary h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="text-foreground mb-3 text-center text-xl font-semibold sm:mb-4 sm:text-2xl">
                Aucun concert à venir pour le moment
              </h3>
              <div className="text-default-600 w-full max-w-2xl space-y-3 text-center text-sm sm:space-y-4 sm:text-base">
                <p className="text-base sm:text-lg">
                  Ne vous inquiétez pas, les prochains concerts arriveront très
                  vite !
                </p>
                <p className="leading-relaxed">
                  En attendant, vous pouvez{" "}
                  <button
                    onClick={() => {
                      const el = document.getElementById("projects-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    suivre nos projets
                  </button>
                  , ou bien{" "}
                  <button
                    onClick={() => {
                      const el = document.getElementById("rehearsals-title");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    voir quand sont nos prochaines répétitions
                  </button>
                  .
                </p>
                <p className="text-primary text-sm font-medium sm:text-base">
                  Restez attentif, les prochains concerts viendront très vite !
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {tours.map((tour) => {
                const tourConcerts = concerts.filter(
                  (c) => c.tour_id === tour.id,
                );

                if (tourConcerts.length === 0) return null;

                return (
                  <div key={tour.id} className="space-y-6">
                    {/* Tour Header */}
                    <div className="from-primary/10 to-primary/5 relative overflow-hidden rounded-2xl bg-gradient-to-r p-4 sm:p-6 lg:p-8">
                      <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-start sm:gap-6">
                        {/* Tour Poster */}

                        {tour.tour_poster && (
                          <Tooltip
                            content="Voir l'affiche"
                            className="shrink-0"
                          >
                            <Button
                              isIconOnly
                              variant="light"
                              radius="sm"
                              onClick={() =>
                                handleImageClick(tour.tour_poster as string)
                              }
                              className="h-20 w-20 cursor-zoom-in rounded-lg p-0 shadow-md sm:h-24 sm:w-24 lg:h-[120px] lg:w-[120px]"
                              aria-label="Voir l'affiche du concert"
                            >
                              <Image
                                src={tour.tour_poster}
                                alt={`Affiche de la tournée ${tour.name}`}
                                width={120}
                                height={120}
                                className="h-20 w-20 rounded-lg shadow-md sm:h-24 sm:w-24 lg:h-[120px] lg:w-[120px]"
                              />
                            </Button>
                          </Tooltip>
                        )}

                        {/* Tour Info */}
                        <div className="flex flex-1 flex-col items-center text-center sm:items-start md:text-start">
                          <h3 className="text-foreground mb-2 text-2xl font-bold sm:text-3xl">
                            {tour.name}
                          </h3>
                          {tour.description && (
                            <p className="text-default-600 mb-4 text-sm sm:text-base">
                              {tour.description}
                            </p>
                          )}
                          <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:gap-6">
                            {tour.start_date && tour.end_date && (
                              <div className="flex items-center gap-2">
                                <IoCalendarClear className="text-primary" />
                                <span className="text-default-600">
                                  Du{" "}
                                  {format(
                                    new Date(tour.start_date),
                                    "dd MMMM",
                                    {
                                      locale: fr,
                                    },
                                  )}{" "}
                                  au{" "}
                                  {format(
                                    new Date(tour.end_date),
                                    "dd MMMM yyyy",
                                    { locale: fr },
                                  )}
                                </span>
                              </div>
                            )}
                            <span className="text-primary inline-block rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium">
                              {tour.context === "orchestre_et_choeur"
                                ? "Orchestre et Chœur"
                                : tour.context.charAt(0).toUpperCase() +
                                  tour.context.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Decorative element */}
                      <div className="bg-primary/10 absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl" />
                      <div className="bg-primary/5 absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl" />
                    </div>

                    {/* Tour Concerts Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tourConcerts.map((concert) => (
                        <div
                          key={concert.id}
                          className="group border-divider bg-background relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <h4 className="group-hover:text-primary text-foreground line-clamp-2 text-lg font-semibold transition-colors">
                                {concert.name || `Concert à ${concert.place}`}
                              </h4>
                              {concert.affiche && (
                                <Tooltip content="Voir l'affiche">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    radius="sm"
                                    size="sm"
                                    onClick={() =>
                                      handleImageClick(
                                        concert.affiche as string,
                                      )
                                    }
                                    className="ml-2"
                                    aria-label="Voir l'affiche du concert"
                                  >
                                    <IoEye className="text-primary h-4 w-4" />
                                  </Button>
                                </Tooltip>
                              )}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <IoCalendarClear className="text-primary shrink-0" />
                                <span>
                                  {format(
                                    new Date(concert.date),
                                    "dd MMMM yyyy",
                                    {
                                      locale: fr,
                                    },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IoTime className="text-primary shrink-0" />
                                <span>
                                  {concert.time.slice(0, 5).replace(":", "h")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IoLocationSharp className="text-primary shrink-0" />
                                <span className="font-medium">
                                  {concert.place}
                                </span>
                              </div>
                              {concert.related_link && (
                                <div className="flex items-center gap-2">
                                  <IoGlobeSharp className="text-primary shrink-0" />
                                  <Link
                                    href={concert.related_link}
                                    target="_blank"
                                    className="hover:text-primary font-medium"
                                  >
                                    Lien connexe
                                  </Link>
                                </div>
                              )}
                            </div>

                            {concert.additional_informations && (
                              <p className="border-divider text-default-500 border-t pt-2 text-sm whitespace-pre-wrap italic">
                                {concert.additional_informations}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Standalone Concerts (not in tours) */}
              {(() => {
                const standaloneConcerts = concerts.filter((c) => !c.tour_id);
                if (standaloneConcerts.length === 0) return null;

                return (
                  <div className="space-y-6">
                    {tours.length > 0 && (
                      <h3 className="text-foreground text-2xl font-semibold">
                        Autres concerts
                      </h3>
                    )}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {standaloneConcerts.map((concert, index) => (
                        <div
                          key={concert.id}
                          className={`border-divider bg-background relative flex flex-col overflow-hidden rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md ${
                            index === 0 && tours.length === 0
                              ? "md:col-span-2 md:row-span-2"
                              : ""
                          }`}
                        >
                          {concert.affiche ? (
                            <Tooltip content="Cliquez pour agrandir">
                              <Image
                                src={concert.affiche}
                                alt={concert.name || "Affiche du concert"}
                                width={400}
                                height={600}
                                onClick={() =>
                                  handleImageClick(concert.affiche as string)
                                }
                                className={`cursor-pointer object-cover ${
                                  index === 0 && tours.length === 0
                                    ? "h-[400px] md:h-[600px]"
                                    : "h-48"
                                } w-full`}
                              />
                            </Tooltip>
                          ) : (
                            <div
                              className={`flex w-full flex-col items-center justify-center gap-3 ${
                                index === 0 && tours.length === 0
                                  ? "h-[400px] md:h-[600px]"
                                  : "h-48"
                              } from-default-50 to-default-100 bg-gradient-to-br`}
                            >
                              <div className="bg-primary/10 flex items-center justify-center rounded-full p-4">
                                <IoImageOutline className="text-primary/60 h-8 w-8 sm:h-10 sm:w-10" />
                              </div>
                              <span className="text-primary/80 text-center text-sm font-medium sm:text-base">
                                Affiche en cours de création...
                              </span>
                            </div>
                          )}
                          <div className="flex flex-1 flex-col justify-start space-y-3 p-6">
                            <h4 className="text-foreground line-clamp-2 text-lg font-semibold">
                              {concert.name ||
                                `Concert du ${format(
                                  new Date(concert.date),
                                  "dd MMMM yyyy",
                                  {
                                    locale: fr,
                                  },
                                )} à ${concert.place}`}
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <IoCalendarClear className="text-primary shrink-0" />
                                <span>
                                  {format(
                                    new Date(concert.date),
                                    "dd MMMM yyyy",
                                    {
                                      locale: fr,
                                    },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IoTime className="text-primary shrink-0" />
                                <span>
                                  {concert.time.slice(0, 5).replace(":", "h")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IoLocationSharp className="text-primary shrink-0" />
                                <span className="font-medium">
                                  {concert.place}
                                </span>
                              </div>
                              {concert.related_link && (
                                <div className="flex items-center gap-2">
                                  <IoGlobeSharp className="text-primary shrink-0" />
                                  <Link
                                    href={concert.related_link}
                                    target="_blank"
                                    className="hover:text-primary font-medium"
                                  >
                                    Lien connexe
                                  </Link>
                                </div>
                              )}
                            </div>
                            <div className="pt-2">
                              <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-medium">
                                {concert.context === "orchestre_et_choeur"
                                  ? "Orchestre et Chœur"
                                  : concert.context.charAt(0).toUpperCase() +
                                    concert.context.slice(1)}
                              </span>
                            </div>
                            {concert.additional_informations && (
                              <p className="text-default-500 text-sm whitespace-pre-wrap italic">
                                {concert.additional_informations}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section
          id="projects-section"
          className="bg-background w-full px-8 py-16 lg:px-24"
          aria-labelledby="projects-title"
        >
          <h2
            id="projects-title"
            className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light"
          >
            Nos projets
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((projet) => (
              <div
                className="border-divider bg-background flex flex-col overflow-hidden rounded-lg border shadow-none transition-all duration-300 hover:shadow-md"
                key={projet.slug}
              >
                <Link
                  href={`/concerts/${projet.slug}`}
                  className="relative block h-48 w-full"
                >
                  <CloudinaryImage
                    src={projet.banniere}
                    alt={`Image bannière ${projet.name} ${projet.subName}`}
                    className="h-full w-full object-cover object-left"
                    width={1000}
                    height={500}
                    rounded={RoundedSize.NONE}
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <h3 className="text-foreground line-clamp-2 text-lg font-semibold">
                    {projet.name} {projet.subName}
                  </h3>
                  <p
                    className="text-default-500 dark:text-foreground flex-1 overflow-hidden text-sm font-normal dark:font-light"
                    dangerouslySetInnerHTML={{ __html: projet.explanation }}
                  ></p>
                  <div className="flex">
                    <Button
                      as={Link}
                      href={`/concerts/${projet.slug}`}
                      aria-label={`Lien vers ${projet.name} ${projet.subName}`}
                      color="primary"
                      variant="light"
                      radius="sm"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <span>Voir plus</span>
                      <IoIosArrowRoundForward className="scale-110" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-divider bg-background flex flex-col overflow-hidden rounded-lg border shadow-none transition-all duration-300 hover:shadow-md">
              <Link
                href={`/concerts/autres`}
                className="relative block h-48 w-full"
              >
                <CloudinaryImage
                  src={"Site/concerts/bannieres/2022"}
                  alt={`Image bannière autres concerts`}
                  className="h-full w-full object-cover object-center"
                  width={1000}
                  height={500}
                  rounded={RoundedSize.NONE}
                />
              </Link>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <h3 className="text-foreground line-clamp-2 text-lg font-semibold">
                  Autres concerts
                </h3>
                <p className="text-default-500 dark:text-foreground flex-1 overflow-hidden text-sm font-normal dark:font-light">
                  Découvrez notre riche histoire musicale avec la section dédiée
                  aux concerts antérieurs à 2022 du Bon Tempérament. Revivez les
                  moments forts et explorez les performances mémorables qui ont
                  marqué notre parcours artistique, témoignant de notre passion
                  et de notre engagement envers la musique classique.
                </p>
                <div className="flex">
                  <Button
                    as={Link}
                    href={`/concerts/autres`}
                    aria-label={`Lien vers autres projets`}
                    color="primary"
                    variant="light"
                    radius="sm"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <span>Voir plus</span>
                    <IoIosArrowRoundForward className="scale-110 font-bold" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Events Section */}
        <section
          className="bg-background w-full px-8 py-16 lg:px-24"
          aria-labelledby="other-events-title"
        >
          <h2
            id="other-events-title"
            className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light"
          >
            Autres événements
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-default-100 space-y-3 rounded-lg p-4">
                    <div className="bg-default-200 h-4 w-3/4 rounded"></div>
                    <div className="bg-default-200 h-4 w-1/2 rounded"></div>
                    <div className="bg-default-200 h-4 w-2/3 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-default-500 py-8 text-center">
              Aucun événement public à venir
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border-divider bg-background overflow-hidden rounded-lg border shadow-none transition-all duration-300 hover:shadow-md"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="text-foreground line-clamp-2 text-lg font-semibold">
                        {event.title}
                      </h4>
                      <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-medium">
                        {event.event_type === "concert"
                          ? "Concert"
                          : event.event_type === "repetition"
                            ? "Répétition"
                            : event.event_type === "vente"
                              ? "Vente"
                              : "Autre"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <IoCalendarClear className="text-primary" />
                        <span>
                          {format(new Date(event.date_from), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                          {event.date_to &&
                            ` au ${format(
                              new Date(event.date_to),
                              "dd MMMM yyyy",
                              { locale: fr },
                            )}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoTime className="text-primary" />
                        <span>{event.time.slice(0, 5).replace(":", "h")}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoLocationSharp className="text-primary" />
                        <span className="font-medium">{event.location}</span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-default-500 text-sm whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}

                    {event.link && (
                      <div className="pt-2">
                        <Link
                          href={event.link}
                          target="_blank"
                          className="text-primary text-sm hover:underline"
                        >
                          Plus d&apos;informations
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rehearsals Section */}
        <section
          className="bg-default-50 mb-8 w-full px-8 py-16 lg:px-24"
          aria-labelledby="rehearsals-title"
        >
          <h2
            id="rehearsals-title"
            className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light"
          >
            Prochaines répétitions
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-default-100 space-y-3 rounded-lg p-4">
                    <div className="bg-default-200 h-4 w-3/4 rounded"></div>
                    <div className="bg-default-200 h-4 w-1/2 rounded"></div>
                    <div className="bg-default-200 h-4 w-2/3 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : rehearsals.length === 0 ? (
            <div className="text-default-500 py-8 text-center">
              Aucune répétition à venir
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rehearsals.map((rehearsal) => (
                <div
                  key={rehearsal.id}
                  className="border-divider bg-background overflow-hidden rounded-lg border shadow-none transition-all duration-300 hover:shadow-md"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="text-foreground line-clamp-2 text-lg font-semibold">
                        {rehearsal.name}
                      </h4>
                      <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-medium">
                        {rehearsal.group_type}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <IoCalendarClear className="text-primary" />
                        <span>
                          {format(new Date(rehearsal.date), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoTime className="text-primary" />
                        <span>
                          {rehearsal.start_time.slice(0, 5).replace(":", "h")} -
                          {rehearsal.end_time.slice(0, 5).replace(":", "h")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoLocationSharp className="text-primary" />
                        <span className="font-medium">{rehearsal.place}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="lg:w-[800px] lg:scale-125">
          {() => (
            <>
              <ModalHeader>
                {selectedConcertImage && "Affiche du concert"}
              </ModalHeader>
              <ModalBody>
                {selectedConcertImage && (
                  <div className="flex justify-center">
                    <Image
                      src={selectedConcertImage}
                      alt="Concert poster"
                      width={600}
                      height={600}
                      className="max-h-[500px] max-w-full object-contain"
                    />
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ConcertsClient;
