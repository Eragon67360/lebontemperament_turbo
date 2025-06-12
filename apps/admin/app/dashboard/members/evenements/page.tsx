"use client";

import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { EventForm } from "@/components/EventForm";
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
import { Event } from "@/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const loadingMessages = [
  "Préparation des événements... 📅",
  "Consultation de l'agenda... 📆",
  "Organisation en cours... 🗓️",
  "Synchronisation du calendrier... ⏰",
  "Mise à jour des dates... 📅",
];

export default function Evenements() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);

      toast.error("Erreur lors du chargement des événements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get("title") as string,
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      responsible_name: formData.get("responsible_name") as string,
      responsible_email: (formData.get("responsible_email") as string) || null,
      event_type: formData.get("event_type") as string,
      description: (formData.get("description") as string) || null,
      link: (formData.get("link") as string) || null,
      is_public: formData.get("is_public") === "on",
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok)
        throw new Error("Erreur lors de l'ajout de l'événement");

      toast.success("Événement ajouté avec succès");
      setOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'événement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const eventData = {
      id: editingEvent!.id,
      title: formData.get("title") as string,
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      responsible_name: formData.get("responsible_name") as string,
      responsible_email: (formData.get("responsible_email") as string) || null,
      event_type: formData.get("event_type") as string,
      description: (formData.get("description") as string) || null,
      link: (formData.get("link") as string) || null,
      is_public: formData.get("is_public") === "on",
    };

    try {
      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Erreur lors de la modification");

      toast.success("Événement modifié avec succès");
      setEditDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventToDelete }),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Événement supprimé avec succès");
      fetchEvents();
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="p-4 bg-primary/10 rounded-full animate-pulse">
        <Calendar className="h-12 w-12 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        {loadingMessage || loadingMessages[0]}
      </p>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-4">
        <div className="p-4 bg-primary/5 rounded-full inline-block">
          <Calendar className="h-16 w-16 text-primary/30" />
        </div>
        <h2 className="text-xl font-medium">Aucun événement</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aucun événement n&apos;est prévu pour le moment.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-full px-6">
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
    <div className="container px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
        <div className="space-y-1.5">
          <DashboardPageHeader
            title="Gestion des événements"
            description="Gérez vos événements et leur programmation."
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6">
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
              loading={loading}
              initialData={null}
              submitLabel="Ajouter l'événement"
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatEventDate(event)} à{" "}
                          {event.time.slice(0, 5).replace(":", "h")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">{event.location}</p>
                      <p className="text-sm text-muted-foreground">
                        Responsable : {event.responsible_name}
                        {event.responsible_email && (
                          <span className="text-primary/70">
                            {` (${event.responsible_email})`}
                          </span>
                        )}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
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
                      className="rounded-full hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(event.id)}
                      className="rounded-full hover:bg-destructive/10 text-destructive"
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            loading={loading}
            initialData={editingEvent}
            submitLabel="Modifier l'événement"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
