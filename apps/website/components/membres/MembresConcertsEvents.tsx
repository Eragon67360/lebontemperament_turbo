"use client";

import MusicList from "@/components/MusicList";
import { Concert } from "@/types/concerts";
import { Event } from "@/types/events";
import { format, isAfter, startOfDay } from "date-fns";
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

      const today = startOfDay(new Date());
      const futureConcerts = concertsData.filter((concert: Concert) =>
        isAfter(new Date(concert.date), today)
      );

      // Filter out past events
      const futureEvents = eventsData.filter((event: Event) =>
        isAfter(new Date(event.date_from), today)
      );

      // Sort concerts by date
      const sortedConcerts = futureConcerts.sort(
        (a: Concert, b: Concert) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Sort events by date
      const sortedEvents = futureEvents.sort(
        (a: Event, b: Event) =>
          new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
      );

      setConcerts(sortedConcerts);
      setEvents(sortedEvents);
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
  const getEventTypeColor = (type: string) => {
    const colors = {
      concert: "bg-blue-100 text-blue-700",
      repetition: "bg-green-100 text-green-700",
      vente: "bg-purple-100 text-purple-700",
      autre: "bg-gray-100 text-gray-700",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  const SectionTitle = ({
    subtitle,
    title,
  }: {
    subtitle: string;
    title: string;
  }) => (
    <div className="mb-6">
      <p className="text-sm text-gray-500">{subtitle}</p>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
  );

  const LoadingCard = () => (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-4 ">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto w-full flex flex-col p-6 space-y-8">
      {/* Concerts Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <SectionTitle subtitle="Agenda" title="Prochains concerts" />
        {!loading && concerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun concert à venir pour le moment.
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concerts.map((concert, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg p-4 hover:border-primary/20 transition-all duration-300"
              >
                <h3 className="text-base font-medium text-gray-800 mb-3">
                  {concert.name ||
                    `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })}`}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <IoCalendarClear className="text-primary w-4 h-4" />
                    <span>
                      {format(new Date(concert.date), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTime className="text-primary w-4 h-4" />
                    <span>{concert.time.slice(0, 5).replace(":", "h")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary w-4 h-4" />
                    <span>{concert.place}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md">
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
      </section>

      {/* Events Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <SectionTitle subtitle="Calendrier" title="Événements à venir" />
        {!loading && events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun événement à venir pour le moment.
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg p-4 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-medium text-gray-800">
                    {event.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-md ${getEventTypeColor(event.event_type)}`}
                  >
                    {getEventTypeLabel(event.event_type)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <IoCalendarClear className="text-primary w-4 h-4" />
                    <span>{formatEventDate(event)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTime className="text-primary w-4 h-4" />
                    <span>{event.time.slice(0, 5).replace(":", "h")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-gray-500 mt-2">
                    {event.description}
                  </p>
                )}

                <div className="mt-3 flex gap-2 flex-wrap">
                  {event.responsible_email && (
                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                      Contact: {event.responsible_name}
                    </span>
                  )}
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                    >
                      <span>Infos</span> <MdOpenInNew className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anniversary Concert Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <SectionTitle subtitle="Archives" title="Concert Anniversaire" />
        <p className="text-sm text-gray-600 mb-6">
          Enregistrement du concert anniversaire pour les 20 ans du Bon
          Tempérament
        </p>
        <MusicList />
      </section>
    </div>
  );
};

export default MembresConcertsEvents;
