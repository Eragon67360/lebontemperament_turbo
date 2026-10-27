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
import type { EventFormValues } from "@/utils/formSchemas";
import {
  eventCountLabel,
  splitEvents,
  toEventPayload,
} from "@/utils/season/schedule";
import type { Event, EventDocument } from "@repo/domain/types/events";
import { parisToday } from "@repo/domain/utils/parisDay";
import { CalendarDays, Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [documentsFor, setDocumentsFor] = useState<Event | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  const [tab, setTab] = useState<Period>("upcoming");
  const [dialog, setDialog] = useState<{ open: boolean; event: Event | null }>({
    open: false,
    event: null,
  });
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
    if (editing) {
      await updateEvent.mutateAsync(toEventPayload(values, editing.id));
      toast.success(`« ${values.title} » enregistré`);
    } else {
      await createEvent.mutateAsync(toEventPayload(values));
      toast.success(
        values.is_public
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
