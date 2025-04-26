// app/concerts/ConcertsClient.tsx (Client Component)
"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import projects from "@/public/json/projects.json";
import { Concert } from "@/types/concerts";
import { Event } from "@/types/events";
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
import { useEffect, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import { IoCalendarClear, IoLocationSharp, IoTime } from "react-icons/io5";

const ConcertsClient = () => {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedConcertImage, setSelectedConcertImage] = useState<
    string | null
  >(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const fetchConcerts = async () => {
    try {
      const response = await fetch("/api/prochains-concerts");
      const data = await response.json();
      setConcerts(data);
    } finally {
      setLoading(false);
    }
  };
  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data.filter((event: Event) => event.is_public));
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchConcerts();
    fetchEvents();
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setSelectedConcertImage(imageUrl);
    onOpen();
  };

  return (
    <div className="flex w-full max-w-[1440px] flex-col px-8">
      <div className="py-16">
        <div>
          <h1 className="text-title font-light leading-none text-primary/50">
            Nos
          </h1>
          <h2 className="text-title font-bold leading-none text-[#333]">
            Concerts
          </h2>
          <hr className="mt-8" />
        </div>

        <div className="my-8">
          <h3 className="text-xl font-bold mb-8">Prochains concerts:</h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4 space-y-3 bg-gray-100 rounded-b-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {concerts.map((concert, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-black/5 overflow-hidden transition-all shadow-md hover:shadow-lg duration-300 transform-gpu"
                >
                  {concert.affiche ? (
                    <Tooltip content="Cliquez pour agrandir">
                      <Image
                        src={concert.affiche}
                        alt={concert.name || "Affiche du concert"}
                        width={400}
                        height={200}
                        onClick={() =>
                          handleImageClick(concert.affiche as string)
                        }
                        className="w-full h-48 object-cover cursor-pointer"
                      />
                    </Tooltip>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">
                        Aucune affiche disponible
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <h4 className="font-semibold text-lg text-gray-800 line-clamp-2">
                      {concert.name ||
                        `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })} à ${concert.place}`}
                    </h4>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <IoCalendarClear className="text-primary" />
                        <span>
                          {format(new Date(concert.date), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoTime className="text-primary" />
                        <span>
                          {concert.time.slice(0, 5).replace(":", "h")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoLocationSharp className="text-primary" />
                        <span className="font-medium">{concert.place}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {concert.context === "orchestre_et_choeur"
                          ? "Orchestre et Chœur"
                          : concert.context.charAt(0).toUpperCase() +
                            concert.context.slice(1)}
                      </span>
                    </div>

                    {concert.additional_informations && (
                      <p className="text-sm text-gray-500 italic whitespace-pre-wrap">
                        {concert.additional_informations}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="my-8">
          <h3 className="text-xl font-bold mb-8">Autres événements:</h3>

          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="p-4 space-y-3 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun événement public à venir
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border border-black/5 overflow-hidden transition-all shadow-md hover:shadow-lg duration-300 transform-gpu"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg text-gray-800 line-clamp-2">
                        {event.title}
                      </h4>
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
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
                            ` au ${format(new Date(event.date_to), "dd MMMM yyyy", { locale: fr })}`}
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
                      <p className="text-sm text-gray-500 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}

                    {event.link && (
                      <div className="pt-2">
                        <Link
                          href={event.link}
                          target="_blank"
                          className="text-primary hover:underline text-sm"
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
        </div>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent className="lg:scale-125 lg:w-[800px]">
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
                        className="max-w-full max-h-[500px] object-contain"
                      />
                    </div>
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        <div className="my-16 w-full h-px bg-gray-200" />
        <div className="my-6 flex w-full flex-col gap-14">
          {projects.map((projet) => (
            <div
              className="flex w-full flex-col bg-[#f2f2f2] lg:flex-row"
              key={projet.slug}
            >
              <Link
                href={`/concerts/${projet.slug}`}
                className="w-full transition-all duration-200 hover:scale-95 hover:opacity-60 lg:w-[57%]"
              >
                <CloudinaryImage
                  src={projet.banniere}
                  alt={`Image bannière ${projet.name} ${projet.subName}`}
                  className="h-full object-cover object-left"
                  width={1000}
                  height={500}
                  rounded={RoundedSize.NONE}
                />
              </Link>

              <div className="flex w-full flex-col justify-between gap-8 py-8 pl-8 pr-8 md:pr-12 lg:w-[43%] lg:pr-16">
                <h2 className="text-lg font-light text-[#BDBDBD] md:text-2xl lg:text-[40px]">
                  {projet.name} {projet.subName}
                </h2>
                <p
                  className="w-full text-justify text-xs font-light text-black md:text-sm lg:text-base"
                  dangerouslySetInnerHTML={{ __html: projet.explanation }}
                ></p>
                <div className="flex">
                  <Link
                    href={`/concerts/${projet.slug}`}
                    aria-label={`Lien vers ${projet.name} ${projet.subName}`}
                    className="flex items-center justify-start space-x-[18px] bg-white px-[20px] py-[18px] text-[#333] transition-all hover:bg-[#333] hover:text-[#F2F2F2]"
                  >
                    <span className="text-[12px] uppercase tracking-[2.4px]">
                      Voir plus
                    </span>
                    <IoIosArrowRoundForward className="scale-110" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          <div className="flex w-full flex-col bg-[#f2f2f2] lg:flex-row">
            <Link
              href={`/concerts/autres`}
              className="w-full transition-all duration-200 hover:scale-95 hover:opacity-60 lg:w-[57%]"
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

            <div className="flex w-full flex-col justify-between gap-8 py-8 pl-8 pr-16 lg:w-[43%]">
              <h2 className="text-lg font-light text-[#BDBDBD] md:text-2xl lg:text-[40px]">
                Autres concerts
              </h2>
              <p className="w-full text-justify text-xs font-light text-black md:text-sm lg:text-base">
                Découvrez notre riche histoire musicale avec la section dédiée
                aux concerts antérieurs à 2022 du Bon Tempérament. Revivez les
                moments forts et explorez les performances mémorables qui ont
                marqué notre parcours artistique, témoignant de notre passion et
                de notre engagement envers la musique classique.
              </p>
              <div className="flex">
                <Link
                  href={`/concerts/autres`}
                  aria-label={`Lien vers autres projets`}
                  className="flex items-center justify-start space-x-[18px] bg-white px-[20px] py-[18px] text-[#333] transition-all hover:bg-[#333] hover:text-[#F2F2F2]"
                >
                  <span className="text-[12px] uppercase tracking-[2.4px]">
                    Voir plus
                  </span>
                  <IoIosArrowRoundForward className="scale-110" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertsClient;
