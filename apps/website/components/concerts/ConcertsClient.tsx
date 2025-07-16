"use client";

import projects from "@/public/json/projects.json";
import { Concert } from "@/types/concerts";
import { Event } from "@/types/events";
import { Rehearsal } from "@/types/rehearsals";
import { RoundedSize } from "@/utils/types";
import {
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
import { IoCalendarClear, IoLocationSharp, IoTime } from "react-icons/io5";
import CloudinaryImage from "../CloudinaryImage";

const ConcertsClient = () => {
  const [concerts, setConcerts] = useState<Array<Concert>>([]);
  const [events, setEvents] = useState<Array<Event>>([]);
  const [rehearsals, setRehearsals] = useState<Array<Rehearsal>>([]);
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
        | Dispatch<SetStateAction<Rehearsal[]>>,
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

    fetchData("/api/prochains-concerts", setConcerts);
    fetchData("/api/events", setEvents);
    fetchData("/api/rehearsals", setRehearsals);
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setSelectedConcertImage(imageUrl);
    onOpen();
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* Hero Section */}
      <section className="flex w-full justify-center bg-white py-16">
        <div className="w-full max-w-[1440px] px-8 lg:px-24">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-title text-primary/50 leading-none font-light">
                Nos
              </h1>
              <h2 className="text-title leading-none font-bold text-[#333]">
                Concerts
              </h2>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("projects-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center justify-center gap-2 rounded-lg border-none bg-transparent p-2 text-xl font-light text-gray-400 hover:text-gray-500 md:text-2xl lg:text-3xl"
              aria-label="Voir les projets"
            >
              <span>Voir projets</span>
              <IoIosArrowRoundDown />
            </button>
          </div>
          <hr className="mt-8" />
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-0 flex w-full max-w-[1440px] flex-col">
        {/* Upcoming Concerts Section with Bento Layout */}
        <section
          className="w-full bg-gray-100 px-8 py-16 lg:px-24"
          aria-labelledby="upcoming-concerts-title"
        >
          <h2
            id="upcoming-concerts-title"
            className="text-primary/50 text-title mb-14 leading-none font-light"
          >
            Prochains concerts
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 rounded-lg bg-gray-200"></div>
                  <div className="mt-4 space-y-3 rounded-lg bg-gray-100 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : concerts.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun concert à venir
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {concerts.map((concert, index) => (
                <div
                  key={concert.id}
                  className={`relative flex flex-col overflow-hidden rounded-lg border border-black/5 bg-white p-4 shadow-none transition-all duration-300 hover:shadow-md ${
                    index === 0 ? "col-span-2 row-span-2" : "!h-full"
                  }`}
                  style={{
                    gridArea: index === 0 ? "span 2 / span 2" : "auto",
                  }}
                >
                  {concert.affiche ? (
                    <Tooltip content="Cliquez pour agrandir">
                      <Image
                        src={concert.affiche}
                        alt={concert.name || "Affiche du concert"}
                        width={200}
                        height={600}
                        onClick={() =>
                          handleImageClick(concert.affiche as string)
                        }
                        className={`cursor-pointer !rounded-lg object-center ${
                          index === 0
                            ? "!h-[600px] !w-auto object-contain"
                            : "!h-48 !w-full object-cover"
                        }`} // Allow full height for the first item
                        style={{
                          flexGrow: index === 0 ? 1 : 0, // Allow the image to grow in the first item
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <div
                      className={`flex w-full items-center justify-center ${
                        index === 0 ? "h-full" : "h-48"
                      } bg-gray-200`}
                    >
                      <span className="text-gray-400">
                        Aucune affiche disponible
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex flex-1 flex-col justify-start space-y-3 p-4 ${
                      index === 0 ? "h-auto" : ""
                    }`}
                  >
                    <h4 className="line-clamp-2 text-lg font-semibold text-gray-800">
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
                          {format(new Date(concert.date), "dd MMMM yyyy", {
                            locale: fr,
                          })}
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
                        <span className="font-medium">{concert.place}</span>
                      </div>
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
                      <p className="text-sm whitespace-pre-wrap text-gray-500 italic">
                        {concert.additional_informations}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section
          id="projects-section"
          className="w-full bg-white px-8 py-16 lg:px-24"
          aria-labelledby="projects-title"
        >
          <h2
            id="projects-title"
            className="text-primary/50 text-title mb-14 leading-none font-light"
          >
            Nos projets
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((projet) => (
              <div
                className="flex flex-col overflow-hidden rounded-lg border border-black/5 bg-white shadow-none transition-all duration-300 hover:shadow-md"
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
                  <h3 className="line-clamp-2 text-lg font-semibold text-gray-800">
                    {projet.name} {projet.subName}
                  </h3>
                  <p
                    className="line-clamp-4 flex-1 overflow-hidden text-sm text-gray-500"
                    dangerouslySetInnerHTML={{ __html: projet.explanation }}
                  ></p>
                  <div className="flex">
                    <Link
                      href={`/concerts/${projet.slug}`}
                      aria-label={`Lien vers ${projet.name} ${projet.subName}`}
                      className="bg-primary flex items-center justify-start space-x-[18px] rounded-lg px-[20px] py-[10px] text-xs tracking-[2.4px] text-white uppercase transition-all hover:bg-[#333]"
                    >
                      <span>Voir plus</span>
                      <IoIosArrowRoundForward className="scale-110" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-col overflow-hidden rounded-lg border border-black/5 bg-white shadow-none transition-all duration-300 hover:shadow-md">
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
                <h3 className="line-clamp-2 text-lg font-semibold text-gray-800">
                  Autres concerts
                </h3>
                <p className="line-clamp-4 flex-1 overflow-hidden text-sm text-gray-500">
                  Découvrez notre riche histoire musicale avec la section dédiée
                  aux concerts antérieurs à 2022 du Bon Tempérament. Revivez les
                  moments forts et explorez les performances mémorables qui ont
                  marqué notre parcours artistique, témoignant de notre passion
                  et de notre engagement envers la musique classique.
                </p>
                <div className="flex">
                  <Link
                    href={`/concerts/autres`}
                    aria-label={`Lien vers autres projets`}
                    className="bg-primary flex items-center justify-start space-x-[18px] rounded-lg px-[20px] py-[10px] text-xs tracking-[2.4px] text-white uppercase transition-all hover:bg-[#333]"
                  >
                    <span>Voir plus</span>
                    <IoIosArrowRoundForward className="scale-110" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Events Section */}
        <section
          className="w-full bg-white px-8 py-16 lg:px-24"
          aria-labelledby="other-events-title"
        >
          <h2
            id="other-events-title"
            className="text-primary/50 text-title mb-14 leading-none font-light"
          >
            Autres événements
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="space-y-3 rounded-lg bg-gray-100 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun événement public à venir
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-none transition-all duration-300 hover:shadow-md"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="line-clamp-2 text-lg font-semibold text-gray-800">
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
                      <p className="text-sm whitespace-pre-wrap text-gray-500">
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
          className="w-full bg-gray-100 px-8 py-16 lg:px-24"
          aria-labelledby="rehearsals-title"
        >
          <h2
            id="rehearsals-title"
            className="text-primary/50 text-title mb-14 leading-none font-light"
          >
            Prochaines répétitions
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="space-y-3 rounded-lg bg-gray-100 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : rehearsals.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucune répétition à venir
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rehearsals.map((rehearsal) => (
                <div
                  key={rehearsal.id}
                  className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-none transition-all duration-300 hover:shadow-md"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="line-clamp-2 text-lg font-semibold text-gray-800">
                        {rehearsal.name}
                      </h4>
                      <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-medium">
                        {rehearsal.group_type}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
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
