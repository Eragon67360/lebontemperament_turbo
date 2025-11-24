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
        isAfter(new Date(concert.date), today),
      );

      // Filter out past events
      const futureEvents = eventsData.filter((event: Event) => {
        const eventEnd = event.date_to
          ? new Date(event.date_to)
          : new Date(event.date_from);
        return isAfter(eventEnd, today);
      });

      // Sort concerts by date
      const sortedConcerts = futureConcerts.sort(
        (a: Concert, b: Concert) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Sort events by date
      const sortedEvents = futureEvents.sort(
        (a: Event, b: Event) =>
          new Date(a.date_from).getTime() - new Date(b.date_from).getTime(),
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
      concert:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      repetition:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      vente:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      autre: "bg-default-100 text-default-700",
    };
    return (
      colors[type as keyof typeof colors] || "bg-default-100 text-default-700"
    );
  };

  const SectionTitle = ({
    subtitle,
    title,
  }: {
    subtitle: string;
    title: string;
  }) => (
    <div className="mb-6">
      <p className="text-default-500 text-sm">{subtitle}</p>
      <h2 className="text-foreground text-xl font-semibold">{title}</h2>
    </div>
  );

  const LoadingCard = () => (
    <div className="bg-content1 animate-pulse rounded-lg p-4 shadow-md">
      <div className="bg-default-200 mb-4 h-6 w-3/4 rounded"></div>
      <div className="space-y-3">
        <div className="bg-default-200 h-4 w-1/2 rounded"></div>
        <div className="bg-default-200 h-4 w-2/3 rounded"></div>
        <div className="bg-default-200 h-4 w-3/4 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto flex w-full flex-col space-y-8 p-2 md:p-4 lg:p-6">
      {/* Concerts Section */}
      <section className="bg-content1 rounded-xl p-4 shadow-sm md:p-4 lg:p-6">
        <SectionTitle subtitle="Agenda" title="Prochains concerts" />
        {!loading && concerts.length === 0 && (
          <div className="text-default-500 py-8 text-center">
            Aucun concert à venir pour le moment.
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert, index) => (
              <div
                key={index}
                className="hover:border-primary/20 border-divider bg-content2 rounded-lg border p-4 transition-all duration-300"
              >
                <h3 className="text-foreground mb-3 text-base font-medium">
                  {concert.name ||
                    `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })}`}
                </h3>

                <div className="text-default-600 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IoCalendarClear className="text-primary h-4 w-4" />
                    <span>
                      {format(new Date(concert.date), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTime className="text-primary h-4 w-4" />
                    <span>{concert.time.slice(0, 5).replace(":", "h")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary h-4 w-4" />
                    <span>{concert.place}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="bg-primary/10 text-primary inline-block rounded-md px-2 py-1 text-xs font-medium">
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
      <section className="bg-content1 rounded-xl p-4 shadow-sm md:p-4 lg:p-6">
        <SectionTitle subtitle="Calendrier" title="Événements à venir" />
        {!loading && events.length === 0 && (
          <div className="text-default-500 py-8 text-center">
            Aucun événement à venir pour le moment.
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <div
                key={index}
                className="hover:border-primary/20 border-divider bg-content2 rounded-lg border p-4 transition-all duration-300"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-foreground text-base font-medium">
                    {event.title}
                  </h3>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${getEventTypeColor(event.event_type)}`}
                  >
                    {getEventTypeLabel(event.event_type)}
                  </span>
                </div>

                <div className="text-default-600 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IoCalendarClear className="text-primary h-4 w-4" />
                    <span>{formatEventDate(event)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTime className="text-primary h-4 w-4" />
                    <span>{event.time.slice(0, 5).replace(":", "h")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-primary h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="text-default-500 mt-2 text-xs">
                    {event.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {event.responsible_email && (
                    <span className="bg-default-100 text-default-600 rounded-md px-2 py-1 text-xs">
                      Contact:{" "}
                      <a
                        href={`mailto:${event.responsible_email}`}
                        className="text-primary hover:underline"
                      >
                        {event.responsible_name || event.responsible_email}
                      </a>
                    </span>
                  )}
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-default-100 text-default-600 hover:bg-default-200 flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                    >
                      <span>Infos</span> <MdOpenInNew className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anniversary Concert Section */}
      <section className="bg-content1 rounded-xl p-4 shadow-sm md:p-4 lg:p-6">
        <SectionTitle subtitle="Archives" title="Concert Anniversaire" />
        <p className="text-default-600 mb-6 text-sm">
          Enregistrement du concert anniversaire pour les 20 ans du Bon
          Tempérament
        </p>
        <MusicList />
      </section>
    </div>
  );
};

export default MembresConcertsEvents;
