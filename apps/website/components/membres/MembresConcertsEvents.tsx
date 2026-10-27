"use client";

import { EventDocumentLinks } from "@/components/events/EventDocumentLinks";
import MusicList from "@/components/MusicList";
import type { PublicConcert } from "@/lib/publicConcerts";
import type { Event, EventWithDocuments } from "@repo/domain/types/events";
import { format, isAfter, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  IoCalendarClearOutline,
  IoLocationOutline,
  IoOpenOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { MembersCard } from "./MembersCard";
import { TONES, type Tone } from "./tones";

const SectionTitle = ({ id, title }: { id: string; title: string }) => (
  <h2
    id={id}
    className="text-foreground mb-5 text-2xl font-semibold sm:text-3xl"
  >
    {title}
  </h2>
);

const LoadingCard = () => (
  <MembersCard className="animate-pulse p-5 sm:p-6">
    <div className="bg-primary/10 mb-4 h-6 w-3/4 rounded-lg"></div>
    <div className="space-y-3">
      <div className="bg-primary/10 h-5 w-1/2 rounded-lg"></div>
      <div className="bg-primary/10 h-5 w-2/3 rounded-lg"></div>
      <div className="bg-primary/10 h-5 w-3/4 rounded-lg"></div>
    </div>
  </MembersCard>
);

const EmptyCard = ({ children }: { children: string }) => (
  <MembersCard className="p-6 sm:p-8">
    <p>{children}</p>
  </MembersCard>
);

const Detail = ({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <Icon aria-hidden="true" className="text-primary mt-1 h-5 w-5 shrink-0" />
    <span className="min-w-0 break-words">{children}</span>
  </div>
);

const MembresConcertsEvents = () => {
  const [concerts, setConcerts] = useState<PublicConcert[]>([]);
  const [events, setEvents] = useState<EventWithDocuments[]>([]);
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
      const futureConcerts = concertsData.filter((concert: PublicConcert) =>
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
        (a: PublicConcert, b: PublicConcert) =>
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
    const colors: Record<string, Tone> = {
      concert: "blue",
      repetition: "green",
      sejour: "amber",
      vente: "rose",
      autre: "slate",
    };
    return TONES[colors[type] ?? "slate"];
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Concerts Section */}
      <section id="concerts" aria-labelledby="concerts-title">
        <SectionTitle id="concerts-title" title="Prochains concerts" />
        {!loading && concerts.length === 0 && (
          <EmptyCard>Aucun concert à venir pour le moment.</EmptyCard>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert, index) => (
              <MembersCard
                as="article"
                key={index}
                className="flex flex-col gap-4 p-5 sm:p-6"
              >
                <h3 className="text-[21px] leading-snug font-semibold">
                  {concert.name ||
                    `Concert du ${format(new Date(concert.date), "dd MMMM yyyy", { locale: fr })}`}
                </h3>

                <div className="flex flex-col gap-2.5">
                  <Detail icon={IoCalendarClearOutline}>
                    {format(new Date(concert.date), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </Detail>
                  <Detail icon={IoTimeOutline}>
                    {concert.time.slice(0, 5).replace(":", "h")}
                  </Detail>
                  <Detail icon={IoLocationOutline}>{concert.place}</Detail>
                </div>

                <span
                  className={`mt-auto self-start rounded-full px-3 py-1 text-base font-medium ${TONES.teal}`}
                >
                  {concert.context === "orchestre_et_choeur"
                    ? "Orchestre et Chœur"
                    : concert.context.charAt(0).toUpperCase() +
                      concert.context.slice(1)}
                </span>
              </MembersCard>
            ))}
          </div>
        )}
      </section>

      {/* Events Section */}
      <section id="evenements" aria-labelledby="evenements-title">
        <SectionTitle id="evenements-title" title="Événements à venir" />
        {!loading && events.length === 0 && (
          <EmptyCard>Aucun événement à venir pour le moment.</EmptyCard>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <MembersCard
                as="article"
                key={index}
                className="flex flex-col gap-4 p-5 sm:p-6"
              >
                <div className="flex flex-col items-start gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-base font-medium ${getEventTypeColor(event.event_type)}`}
                  >
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <h3 className="text-[21px] leading-snug font-semibold">
                    {event.title}
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Detail icon={IoCalendarClearOutline}>
                    {formatEventDate(event)}
                  </Detail>
                  <Detail icon={IoTimeOutline}>
                    {event.time.slice(0, 5).replace(":", "h")}
                  </Detail>
                  <Detail icon={IoLocationOutline}>{event.location}</Detail>
                </div>

                {event.description && (
                  <p className="text-muted">{event.description}</p>
                )}

                <EventDocumentLinks
                  documents={event.documents ?? []}
                  eventTitle={event.title}
                  large
                />

                {(event.responsible_email || event.link) && (
                  <div className="mt-auto flex flex-col items-start gap-1">
                    {event.responsible_email && (
                      <p>
                        Contact :{" "}
                        <a
                          href={`mailto:${event.responsible_email}`}
                          className="text-primary-text font-medium underline underline-offset-2 hover:no-underline"
                        >
                          {event.responsible_name || event.responsible_email}
                        </a>
                      </p>
                    )}
                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-text inline-flex min-h-12 items-center gap-2 font-medium underline underline-offset-2 hover:no-underline"
                      >
                        Plus d’infos
                        <IoOpenOutline aria-hidden="true" className="h-5 w-5" />
                        <span className="sr-only">(nouvel onglet)</span>
                      </a>
                    )}
                  </div>
                )}
              </MembersCard>
            ))}
          </div>
        )}
      </section>

      {/* Anniversary Concert Section */}
      <section aria-labelledby="anniversaire-title">
        <MembersCard className="p-5 sm:p-8">
          <SectionTitle id="anniversaire-title" title="Concert anniversaire" />
          <p className="text-muted mb-6">
            Enregistrement du concert anniversaire pour les 20 ans du Bon
            Tempérament.
          </p>
          <MusicList variant="members" />
        </MembersCard>
      </section>
    </div>
  );
};

export default MembresConcertsEvents;
