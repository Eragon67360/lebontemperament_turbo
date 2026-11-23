"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { EventDialog } from "@/components/season/EventDialog";
import { EventDocumentsDialog } from "@/components/season/EventDocumentsDialog";
import { EventRow } from "@/components/season/EventRow";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EventDocumentsNotInstalled,
  useEventDocuments,
} from "@/hooks/useEventDocuments";
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/hooks/useEvents";
import { useGroups } from "@/hooks/useGroups";
import type { EventFormValues } from "@/utils/formSchemas";
import { audienceLabel, groupFromSearch } from "@/utils/groups/view";
import RouteNames from "@/utils/routes";
import {
  audienceOf,
  eventCountLabel,
  splitEvents,
  toEventPayload,
  withAudience,
} from "@/utils/season/schedule";
import type { Event, EventDocument } from "@repo/domain/types/events";
import { parisToday } from "@repo/domain/utils/parisDay";
import { CalendarDays, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Period = "upcoming" | "past";

export default function EvenementsPage() {
  const eventsQuery = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const documentsQuery = useEventDocuments();
  // Before the event_documents migration the « Documents » button stays hidden.
  const documentsAvailable = !(
    documentsQuery.error instanceof EventDocumentsNotInstalled
  );
  const documentsByEvent = useMemo(() => {
    const byEvent = new Map<string, EventDocument[]>();
    for (const document of documentsQuery.data ?? []) {
      const list = byEvent.get(document.event_id) ?? [];
      list.push(document);
      byEvent.set(document.event_id, list);
    }
    return byEvent;
  }, [documentsQuery.data]);
  // « Pour qui ? »: the member groups, once loaded (before the migration,
  // or while they fail, the dialog has no audience and leaves it alone).
  const groupsQuery = useGroups();
  const groups = groupsQuery.data?.groups;
  const groupNames = useMemo(
    () => new Map((groups ?? []).map((g) => [g.id, g.name])),
    [groups],
  );
  const [documentsFor, setDocumentsFor] = useState<Event | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  const [tab, setTab] = useState<Period>("upcoming");
  const [dialog, setDialog] = useState<{
    open: boolean;
    event: Event | null;
    /** A new event started from a group's page (« Nouvel événement »). */
    audience?: string[];
  }>({
    open: false,
    event: null,
  });

  // « Nouvel événement » of a group page: ?pour=<group id> opens the dialog
  // for that group once the groups are known. Read once on the client (the
  // server renders without it), then dropped from the address.
  const [requestedGroup, setRequestedGroup] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : groupFromSearch(window.location.search),
  );
  if (requestedGroup && groups) {
    setRequestedGroup(null);
    if (groups.some((g) => g.id === requestedGroup && g.archived_at === null)) {
      setDialog({ open: true, event: null, audience: [requestedGroup] });
    }
  }
  useEffect(() => {
    if (groupFromSearch(window.location.search)) {
      window.history.replaceState(
        null,
        "",
        RouteNames.DASHBOARD.MEMBERS.EVENEMENTS,
      );
    }
  }, []);
  // The item stays set while the dialog closes, so its text never empties.
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Today is read when the data changes, so a page left open overnight
  // stays consistent until it refetches (same as the concerts page).
  const events = useMemo(
    () => splitEvents(eventsQuery.data ?? [], parisToday()),
    [eventsQuery.data],
  );

  const save = async (values: EventFormValues) => {
    const editing = dialog.event;
    const forGroups = audienceLabel(audienceOf(values), groupNames);
    if (editing) {
      await updateEvent.mutateAsync(
        withAudience(toEventPayload(values, editing.id), values),
      );
      toast.success(`« ${values.title} » enregistré`);
    } else {
      await createEvent.mutateAsync(
        withAudience(toEventPayload(values), values),
      );
      toast.success(
        forGroups
          ? `« ${values.title} » ajouté, réservé à : ${forGroups}`
          : values.is_public
            ? `« ${values.title} » ajouté à l'agenda et au site public`
            : `« ${values.title} » ajouté à l'agenda des membres`,
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteEvent.mutateAsync(deleting.id);
      toast.success(`« ${deleting.title} » supprimé`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => setDialog({ open: true, event: null });

  const renderPeriod = (key: Period) => {
    const rows = events[key];
    const past = key === "past";
    const heading = past ? "Événements passés" : "Événements à venir";
    return (
      <section aria-labelledby={`${key}-heading`} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`${key}-heading`} className="text-section">
            {heading}
          </h2>
          {rows.length > 0 && (
            <p className="text-note text-muted-foreground">
              {eventCountLabel(rows.length)}
            </p>
          )}
        </div>
        <DataState
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          hasData={!!eventsQuery.data}
          isEmpty={rows.length === 0}
          onRetry={() => eventsQuery.refetch()}
          errorDescription="Les événements n'ont pas pu être chargés."
          skeleton={
            <ListSkeleton rows={4} label="Chargement des événements…" />
          }
          empty={
            <EmptyState
              icon={CalendarDays}
              title={past ? "Aucun événement passé" : "Aucun événement à venir"}
              description={
                past
                  ? "Les événements dont le dernier jour est passé apparaîtront ici, prêts à être corrigés si besoin."
                  : "Aucun événement n'est prévu : un séjour, une vente, une sortie… tout ce qui n'est ni une répétition ni un concert."
              }
              className="py-6"
              action={
                past ? undefined : (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus aria-hidden />
                    Créer un événement
                  </Button>
                )
              }
            />
          }
        >
          <ul className="space-y-3">
            {rows.map((event) => (
              <li key={event.id} className="list-none">
                <EventRow
                  event={event}
                  audience={audienceLabel(event.audience, groupNames)}
                  documents={documentsByEvent.get(event.id) ?? []}
                  onEdit={() => setDialog({ open: true, event })}
                  onDocuments={
                    documentsAvailable
                      ? () => {
                          setDocumentsFor(event);
                          setDocumentsOpen(true);
                        }
                      : undefined
                  }
                  onDelete={() => {
                    setDeleting(event);
                    setConfirmOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>
        </DataState>
      </section>
    );
  };

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Événements"
      description="L'agenda des membres : séjours, ventes, sorties et rendez-vous, publics ou réservés aux membres. Les événements passés restent consultables et corrigeables."
      headerAction={
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Ajouter un événement
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as Period)}>
        <TabsList aria-label="Période">
          <TabsTrigger value="upcoming">À venir</TabsTrigger>
          <TabsTrigger value="past">Passés</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-5">
          {renderPeriod("upcoming")}
        </TabsContent>
        <TabsContent value="past" className="mt-5">
          {renderPeriod("past")}
        </TabsContent>
      </Tabs>

      <EventDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        event={dialog.event}
        onSubmit={save}
        isPending={createEvent.isPending || updateEvent.isPending}
        groups={groups}
        initialAudience={dialog.audience}
      />

      <EventDocumentsDialog
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        event={documentsFor}
        documents={
          documentsFor ? (documentsByEvent.get(documentsFor.id) ?? []) : []
        }
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.title ?? ""} » ?`}
        description={`${
          deleting?.is_public
            ? "L'événement disparaît de l'agenda des membres et du site public"
            : deleting?.audience?.length
              ? "L'événement disparaît de l'agenda des groupes auxquels il est réservé"
              : "L'événement disparaît de l'agenda des membres"
        }${
          deleting && (documentsByEvent.get(deleting.id)?.length ?? 0) > 0
            ? ", avec ses documents."
            : "."
        } Cette action ne peut pas être annulée.`}
        isLoading={isDeleting}
      />
    </PageShell>
  );
}
