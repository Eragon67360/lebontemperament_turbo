"use client";

import { EventForm } from "@/components/EventForm";
import { PageShell } from "@/components/layouts/PageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Event } from "@repo/domain/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/hooks/useEvents";

// --- Main Component ---

export default function Evenements() {
  // Queries
  const {
    data: events = [],
    isLoading: loadingEvents,
    isError: eventsFailed,
    refetch: refetchEvents,
  } = useEvents();

  // Mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // State
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Derived state
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcomingEvents = events.filter(
    (e) => (e.date_to ?? e.date_from) >= todayStr,
  );

  // Helper to extract form data safely
  const prepareEventData = (
    formData: FormData,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
    id?: string,
  ) => {
    return {
      id: id,
      title: formData.get("title") as string,
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : null,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      responsible_name: formData.get("responsible_name") as string,
      responsible_email: (formData.get("responsible_email") as string) || null,
      event_type: formData.get("event_type") as Event["event_type"],
      description: (formData.get("description") as string) || null,
      link: (formData.get("link") as string) || null,
      is_public: formData.get("is_public") === "on",
    };
  };

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();
    const eventData = prepareEventData(
      new FormData(e.currentTarget),
      dateFrom,
      dateTo,
    );

    try {
      await createEvent.mutateAsync(eventData);
      toast.success("Événement ajouté avec succès");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    }
  };

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();
    if (!editingEvent?.id) return;
    const eventData = prepareEventData(
      new FormData(e.currentTarget),
      dateFrom,
      dateTo,
      editingEvent.id,
    );

    try {
      await updateEvent.mutateAsync({ ...eventData, id: editingEvent.id });
      toast.success("Événement modifié");
      setEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent.mutateAsync(eventToDelete);
      toast.success("Événement supprimé");
    } catch (error) {
      toast.error("Impossible de supprimer l'événement");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  return (
    <PageShell
      theme="members"
      className="py-4 sm:py-6"
      title="Gestion des événements"
      description="Gérez vos événements et leur programmation."
      headerAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-11 w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Ajouter un événement
              </DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous pour créer un nouvel événement
                dans l&apos;agenda.
              </DialogDescription>
            </DialogHeader>
            <EventForm
              onSubmit={handleCreate}
              loading={createEvent.isPending}
              initialData={null}
              submitLabel="Créer l'événement"
            />
          </DialogContent>
        </Dialog>
      }
    >
      <DataState
        isLoading={loadingEvents}
        isError={eventsFailed}
        isEmpty={upcomingEvents.length === 0}
        onRetry={() => refetchEvents()}
        errorDescription="Les événements n'ont pas pu être chargés."
        skeleton={
          <CardGridSkeleton cards={6} label="Chargement des événements…" />
        }
        empty={
          <EmptyState
            icon={Calendar}
            title="Agenda vide"
            description="Aucun événement n'est prévu pour le moment. Commencez par en créer un nouveau."
            action={
              <Button className="min-h-11" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Créer un événement
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={(e) => {
                setEditingEvent(e);
                setEditDialogOpen(true);
              }}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </DataState>

      {/* Delete Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;événement sera retiré de
              l&apos;agenda et visible par personne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 min-h-11 text-white"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;événement</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onSubmit={handleEdit}
            loading={updateEvent.isPending}
            initialData={editingEvent}
            submitLabel="Enregistrer les modifications"
          />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// --- Sub-component: Event Card ---

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: (e: Event) => void;
  onDelete: (id: string) => void;
}) {
  const startDate = new Date(event.date_from);
  const dayNumber = format(startDate, "dd");
  const monthName = format(startDate, "MMM", { locale: fr });
  const isMultiDay = !!event.date_to;

  const dateToFormatted = event.date_to
    ? format(new Date(event.date_to), "dd MMM yyyy", { locale: fr })
    : null;

  return (
    <Card className="group bg-card text-card-foreground hover:border-primary/50 dark:bg-card/90 relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
      {/* Type Badge & Visibility */}
      <div className="absolute top-3 right-3 flex gap-2">
        <div
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            event.is_public
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-secondary text-secondary-foreground border-transparent"
          }`}
        >
          {event.is_public ? (
            <Globe className="mr-1 h-3 w-3" aria-hidden />
          ) : (
            <Lock className="mr-1 h-3 w-3" aria-hidden />
          )}
          {event.is_public ? "Public" : "Privé"}
        </div>
      </div>

      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-4">
          {/* Date Tile */}
          <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 shadow-sm transition-colors duration-150 ease-out motion-reduce:transition-none">
            <span className="text-xs font-bold tracking-wider uppercase">
              {monthName}
            </span>
            <span className="text-2xl leading-none font-black">
              {dayNumber}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1 pt-1 pr-14">
            <h2 className="line-clamp-2 text-lg leading-tight font-bold tracking-tight">
              {event.title}
            </h2>
            <div className="border-input bg-background text-muted-foreground inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm">
              <span className="truncate">{event.event_type}</span>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground mt-5 space-y-3 text-sm">
          {isMultiDay && (
            <div className="text-primary/80 flex min-w-0 items-center gap-2 font-medium">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Jusqu&apos;au {dateToFormatted}</span>
            </div>
          )}

          <div className="flex min-w-0 items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">
              {event.time.slice(0, 5).replace(":", "h")}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex min-w-0 items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground/80 truncate font-medium">
                {event.responsible_name}
              </span>
              {event.responsible_email && (
                <span className="truncate text-xs opacity-70">
                  {event.responsible_email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Separator / Spacer */}
        <div className="flex-1 py-4">
          {event.description && (
            <p className="text-muted-foreground/80 line-clamp-2 text-sm italic">
              « {event.description} »
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
          {event.link ? (
            <Button
              variant="link"
              className="text-primary min-h-11 min-w-0 px-0"
              asChild
            >
              <a href={event.link} target="_blank" rel="noreferrer">
                <span className="truncate">Voir plus</span>
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </Button>
          ) : (
            <span /> /* Spacer */
          )}

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(event)}
              className="hover:bg-primary/10 hover:text-primary size-11 rounded-full"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="sr-only">Modifier « {event.title} »</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(event.id)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-11 rounded-full"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Supprimer « {event.title} »</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
