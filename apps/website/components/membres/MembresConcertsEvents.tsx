"use client";

import MusicList from "@/components/MusicList";
import { Concert } from "@/types/concerts";
import { Event } from "@/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { IoCalendarClear, IoLocationSharp, IoTime } from "react-icons/io5";
import { MdOpenInNew } from "react-icons/md";

const MembresConcertsEvents = () => {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [concertsResponse, eventsResponse] = await Promise.all([
        fetch("/api/prochains-concerts"),
        fetch("/api/events"),
      ]);

      const [concertsData, eventsData] = await Promise.all([
        concertsResponse.json(),
        eventsResponse.json(),
      ]);

      setConcerts(concertsData);
      setEvents(eventsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatEventDate = (event: Event) => {
    const dateFrom = format(new Date(event.date_from), "dd MMMM yyyy", {
      locale: fr,
    });
    if (event.date_to) {
      const dateTo = format(new Date(event.date_to), "dd MMMM yyyy", {
        locale: fr,
      });
      return `Du ${dateFrom} au ${dateTo}`;
    }
    return dateFrom;
  };

  const getEventTypeLabel = (type: string) => {
    const types = {
      concert: "Concert",
      repetition: "Répétition",
      vente: "Vente",
      autre: "Autre",
    };
    return types[type as keyof typeof types] || type;
  };

  const LoadingCard = () => (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-4">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );

  return (
    <div className="px-8 max-w-[1440px] w-full flex flex-col">
      <div className="py-8">
        <h1 className="text-title text-primary/50 font-light leading-none">
          Nos
        </h1>
        <h2 className="text-title text-[#333] font-bold leading-none">
          Prochains concerts
        </h2>
        <hr className="my-8" />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concerts.map((concert, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  {concert.name ||
                    `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })}`}
                </h3>

                <div className="space-y-3 text-sm text-gray-600">
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
                    <span>{concert.time.slice(0, 5).replace(":", "h")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary" />
                    <span className="font-medium">{concert.place}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {concert.context === "orchestre_et_choeur"
                      ? "Orchestre et Chœur"
                      : concert.context.charAt(0).toUpperCase() +
                        concert.context.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="py-8">
        <h1 className="text-title text-primary/50 font-light leading-none">
          Nos
        </h1>
        <h2 className="text-title text-[#333] font-bold leading-none">
          Événements à venir
        </h2>
        <hr className="my-8" />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  {event.title}
                </h3>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <IoCalendarClear className="text-primary" />
                    <span>{formatEventDate(event)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IoTime className="text-primary" />
                    <span>{event.time.slice(0, 5).replace(":", "h")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary" />
                    <span className="font-medium">{event.location}</span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  {event.responsible_email && (
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Contact: {event.responsible_name}
                    </span>
                  )}
                </div>
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-2 px-3 py-1 mt-4 w-fit items-center text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                  >
                    <span>Infos</span> <MdOpenInNew />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="py-8">
        <h1 className="text-title text-primary/50 font-light leading-none">
          Concert
        </h1>
        <h2 className="text-title text-[#333] font-bold leading-none">
          Anniversaire
        </h2>
        <hr className="my-8" />
        <h2 className="text-base md:text-lg lg:text-xl">
          L&apos;album ci-dessous est un enregistrement d&apos;un concert
          anniversaire pour les 20 ans du Bon Tempérament
        </h2>
        <div className="mt-8">
          <MusicList />
        </div>
      </div>
    </div>
  );
};

export default MembresConcertsEvents;
