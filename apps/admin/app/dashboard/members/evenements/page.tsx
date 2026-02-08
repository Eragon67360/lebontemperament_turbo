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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Event } from "@/types/events";
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

// --- Utility Components & Helpers ---

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[240px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-primary/5 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <Calendar className="text-primary/40 h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">Agenda vide</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Aucun événement n'est prévu pour le moment. Commencez par en créer un
        nouveau.
      </p>
    </div>
    <Button onClick={onAdd} className="px-8">
      <Plus className="mr-2 h-4 w-4" />
      Créer un événement
    </Button>
  </div>
);

// --- Main Component ---

export default function Evenements() {
  // Queries
  const { data: events = [], isLoading: loadingEvents } = useEvents();

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
      fullHeight
      theme="members"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Gestion des événements"
      description="Gérez vos événements et leur programmation."
      headerAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="px-6 shadow-md transition-all hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Ajouter un événement
              </DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous pour créer un nouvel événement
                dans l'agenda.
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
      <ScrollArea className="h-full w-full py-2 pr-4">
        {loadingEvents ? (
          <LoadingSkeleton />
        ) : upcomingEvents.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 px-1 pt-2 pb-12 md:grid-cols-2 xl:grid-cols-3">
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
        )}
      </ScrollArea>

      {/* Delete Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'événement sera retiré de l'agenda
              et visible par personne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
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
            <DialogTitle>Modifier l'événement</DialogTitle>
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
    <Card className="group bg-card text-card-foreground hover:border-primary/50 dark:bg-card/90 relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      {/* Type Badge & Visibility */}
      <div className="absolute top-3 right-3 flex gap-2">
        <div
          className={`focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
            event.is_public
              ? "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent"
          }`}
        >
          {event.is_public ? (
            <Globe className="mr-1 h-3 w-3" />
          ) : (
            <Lock className="mr-1 h-3 w-3" />
          )}
          {event.is_public ? "Public" : "Privé"}
        </div>
      </div>

      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-4">
          {/* Date Tile */}
          <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex flex-col items-center justify-center rounded-xl px-3 py-2 shadow-sm transition-colors duration-300">
            <span className="text-xs font-bold tracking-wider uppercase">
              {monthName}
            </span>
            <span className="text-2xl leading-none font-black">
              {dayNumber}
            </span>
          </div>

          <div className="space-y-1 pt-1 pr-14">
            <h3 className="line-clamp-2 text-lg leading-tight font-bold tracking-tight">
              {event.title}
            </h3>
            <div className="border-input bg-background text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm">
              {event.event_type}
            </div>
          </div>
        </div>

        <div className="text-muted-foreground mt-5 space-y-3 text-sm">
          {isMultiDay && (
            <div className="text-primary/80 flex items-center gap-2 font-medium">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Jusqu'au {dateToFormatted}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{event.time.slice(0, 5).replace(":", "h")}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground/80 font-medium">
                {event.responsible_name}
              </span>
              {event.responsible_email && (
                <span className="text-xs opacity-70">
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
              "{event.description}"
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex items-center justify-between border-t pt-4">
          {event.link ? (
            <Button
              variant="link"
              size="sm"
              className="text-primary h-auto p-0"
              asChild
            >
              <a href={event.link} target="_blank" rel="noreferrer">
                Voir plus <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          ) : (
            <span /> /* Spacer */
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(event)}
              className="hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-full p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Modifier</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(event.id)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full p-0"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
