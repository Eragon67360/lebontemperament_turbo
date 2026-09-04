"use client";

import MusicList from "@/components/MusicList";
import { Concert } from "@repo/domain/types/concerts";
import { Event } from "@repo/domain/types/events";
import { format, isAfter, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "motion/react";
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
      sejour: "Séjour",
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
      sejour:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <p className="text-foreground/60 text-sm md:text-base">{subtitle}</p>
      <h2 className="from-primary via-foreground mt-1 bg-gradient-to-r to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
        {title}
      </h2>
    </motion.div>
  );

  const LoadingCard = () => (
    <div className="bg-default-100/80 animate-pulse rounded-xl p-4 backdrop-blur-sm md:p-6">
      <div className="bg-default-200/80 mb-4 h-6 w-3/4 rounded-lg"></div>
      <div className="space-y-3">
        <div className="bg-default-200/80 h-4 w-1/2 rounded-lg"></div>
        <div className="bg-default-200/80 h-4 w-2/3 rounded-lg"></div>
        <div className="bg-default-200/80 h-4 w-3/4 rounded-lg"></div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto flex w-full flex-col space-y-8 px-2 py-6 md:px-4 md:py-8 lg:px-6 lg:py-12">
      {/* Concerts Section */}
      <motion.section
        id="concerts"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-xl"
      >
        <SectionTitle subtitle="Agenda" title="Prochains concerts" />
        {!loading && concerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-foreground/60 bg-default-100/80 rounded-xl py-12 text-center backdrop-blur-sm"
          >
            Aucun concert à venir pour le moment.
          </motion.div>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-xl"
              >
                <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-br to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 p-4 backdrop-blur-sm transition-all duration-300 md:p-6">
                  <h3 className="text-foreground mb-4 text-lg font-bold">
                    {concert.name ||
                      `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })}`}
                  </h3>

                  <div className="text-foreground/70 space-y-3 text-sm md:text-base">
                    <div className="flex items-center gap-3">
                      <IoCalendarClear className="text-primary h-5 w-5" />
                      <span>
                        {format(new Date(concert.date), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IoTime className="text-primary h-5 w-5" />
                      <span>{concert.time.slice(0, 5).replace(":", "h")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IoLocationSharp className="text-primary h-5 w-5" />
                      <span>{concert.place}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="from-primary/20 text-primary inline-block rounded-lg bg-gradient-to-r to-purple-500/20 px-3 py-1.5 text-xs font-semibold md:text-sm">
                      {concert.context === "orchestre_et_choeur"
                        ? "Orchestre et Chœur"
                        : concert.context.charAt(0).toUpperCase() +
                          concert.context.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Events Section */}
      <motion.section
        id="evenements"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-xl"
      >
        <SectionTitle subtitle="Calendrier" title="Événements à venir" />
        {!loading && events.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-foreground/60 bg-default-100/80 rounded-xl py-12 text-center backdrop-blur-sm"
          >
            Aucun événement à venir pour le moment.
          </motion.div>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-xl"
              >
                <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-br to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 p-4 backdrop-blur-sm transition-all duration-300 md:p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="text-foreground flex-1 text-lg font-bold">
                      {event.title}
                    </h3>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap ${getEventTypeColor(event.event_type)}`}
                    >
                      {getEventTypeLabel(event.event_type)}
                    </span>
                  </div>

                  <div className="text-foreground/70 space-y-3 text-sm md:text-base">
                    <div className="flex items-center gap-3">
                      <IoCalendarClear className="text-primary h-5 w-5" />
                      <span>{formatEventDate(event)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IoTime className="text-primary h-5 w-5" />
                      <span>{event.time.slice(0, 5).replace(":", "h")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IoLocationSharp className="text-primary h-5 w-5" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-foreground/60 mt-3 text-sm">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.responsible_email && (
                      <span className="bg-default-50/80 text-foreground/70 rounded-lg px-3 py-1.5 text-xs">
                        Contact:{" "}
                        <a
                          href={`mailto:${event.responsible_email}`}
                          className="text-primary font-medium hover:underline"
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
                        className="from-primary/20 hover:from-primary/30 text-primary flex items-center gap-1 rounded-lg bg-gradient-to-r to-purple-500/20 px-3 py-1.5 text-xs font-medium transition-all hover:to-purple-500/30"
                      >
                        <span>Infos</span> <MdOpenInNew className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Anniversary Concert Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 p-4 backdrop-blur-sm transition-all duration-300 md:p-6 lg:p-8">
          <SectionTitle subtitle="Archives" title="Concert Anniversaire" />
          <p className="text-foreground/70 mb-6 text-sm md:text-base">
            Enregistrement du concert anniversaire pour les 20 ans du Bon
            Tempérament
          </p>
          <MusicList />
        </div>
      </motion.section>
    </div>
  );
};

export default MembresConcertsEvents;
