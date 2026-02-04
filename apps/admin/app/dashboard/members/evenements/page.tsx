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
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/hooks/useEvents";

const loadingMessages = [
  "Préparation des événements... 📅",
  "Consultation de l'agenda... 📆",
  "Organisation en cours... 🗓️",
  "Synchronisation du calendrier... ⏰",
  "Mise à jour des dates... 📅",
];

export default function Evenements() {
  // Queries
  const { data: events = [], isLoading: loadingEvents } = useEvents();

  // Mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const loading = loadingEvents;

  const [open, setOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLoadingMessage(
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)],
      );
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const eventData = {
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

    try {
      await createEvent.mutateAsync(eventData);

      toast.success("Événement ajouté avec succès");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'événement");
      console.error(error);
    }
  };

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const eventData = {
      id: editingEvent!.id,
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

    try {
      await updateEvent.mutateAsync(eventData);

      toast.success("Événement modifié avec succès");
      setEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent.mutateAsync(eventToDelete);

      toast.success("Événement supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Loading State Component
  const LoadingState = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8">
      <div className="bg-primary/10 animate-pulse rounded-full p-4">
        <Calendar className="text-primary h-12 w-12" />
      </div>
      <p className="text-muted-foreground animate-pulse text-sm">
        {loadingMessage || loadingMessages[0]}
      </p>
    </div>
  );

  const EmptyState = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
      <div className="space-y-4 text-center">
        <div className="bg-primary/5 inline-block rounded-full p-4">
          <Calendar className="text-primary/30 h-16 w-16" />
        </div>
        <h2 className="text-xl font-medium">Aucun événement</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Aucun événement n&apos;est prévu pour le moment.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="px-6">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un événement
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );

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
            <Button className="px-6">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                Ajouter un nouvel événement
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Entrez les informations pour cet événement
              </DialogDescription>
            </DialogHeader>
            <EventForm
              onSubmit={handleCreate}
              loading={createEvent.isPending}
              initialData={null}
              submitLabel="Ajouter l'événement"
            />
          </DialogContent>
        </Dialog>
      }
    >
      <ScrollArea className="pr-2">
        {loading ? (
          <LoadingState />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden rounded-2xl border-0 bg-white/50 shadow-lg backdrop-blur-xl transition-all duration-200 hover:shadow-xl dark:bg-black/50"
              >
                <div className="p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatEventDate(event)} à{" "}
                            {event.time.slice(0, 5).replace(":", "h")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium">{event.location}</p>
                        <p className="text-muted-foreground text-sm">
                          Responsable : {event.responsible_name}
                          {event.responsible_email && (
                            <span className="text-primary/70">
                              {` (${event.responsible_email})`}
                            </span>
                          )}
                        </p>
                        {event.description && (
                          <p className="text-muted-foreground text-sm">
                            {event.description}
                          </p>
                        )}
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                          >
                            Voir plus
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingEvent(event);
                          setEditDialogOpen(true);
                        }}
                        className="hover:bg-primary/10 rounded-full"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(event.id)}
                        className="hover:bg-destructive/10 text-destructive rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;événement sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;événement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;événement
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onSubmit={handleEdit}
            loading={updateEvent.isPending}
            initialData={editingEvent}
            submitLabel="Modifier l'événement"
          />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
