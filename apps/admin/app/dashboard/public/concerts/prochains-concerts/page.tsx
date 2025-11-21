"use client";

import { ConcertForm } from "@/components/ConcertForm";
import { ConcertPoster } from "@/components/ConcertPoster";
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { TourForm } from "@/components/TourForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Concert, Context } from "@/types/concerts";
import { Tour } from "@/types/tours";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  Clock,
  LucideIcon,
  MapPin,
  Music2,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Users,
  Link,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layouts/PageShell";

const loadingMessages = [
  "La musique se réchauffe... 🎵",
  "Accord des instruments en cours... 🎻",
  "Le chef d'orchestre arrive... 🎭",
  "On monte sur scène... 🎪",
  "Les partitions s'envolent... 📝",
  "La chorale s'échauffe... 🎶",
];

export default function ProchainsConcerts() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [concertToDelete, setConcertToDelete] = useState<string | null>(null);
  const [editingConcert, setEditingConcert] = useState<Concert | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditingConcert, setIsEditingConcert] = useState(false);
  const [isCreatingConcert, setIsCreatingConcert] = useState(false);
  const [tourDialogOpen, setTourDialogOpen] = useState(false);
  const [isCreatingTour, setIsCreatingTour] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editTourDialogOpen, setEditTourDialogOpen] = useState(false);
  const [isEditingTour, setIsEditingTour] = useState(false);
  const [addConcertToTourDialogOpen, setAddConcertToTourDialogOpen] =
    useState(false);
  const [selectedTourForConcerts, setSelectedTourForConcerts] =
    useState<Tour | null>(null);

  const fetchConcerts = async () => {
    try {
      const response = await fetch("/api/prochains-concerts");
      const data = await response.json();
      setConcerts(data);
    } finally {
      setLoading(false);
    }
  };
  const fetchTours = async () => {
    try {
      const response = await fetch("/api/tours");
      const data = await response.json();
      setTours(data);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Erreur lors du chargement des tournées");
    }
  };

  useEffect(() => {
    Promise.all([fetchConcerts(), fetchTours()]);
    setIsEditingConcert(false);
    setIsCreatingConcert(false);
  }, []);

  const handleDeleteClick = (id: string) => {
    setConcertToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    formDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    setIsCreatingConcert(true);

    try {
      let affiche = null;
      const form = e.target as HTMLFormElement;

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload de l'image");
        const { url } = await uploadResponse.json();

        affiche = url;
      }

      // Get form values directly from the form elements
      const concertData = {
        place: form.place.value,
        date: formDate ? format(formDate, "yyyy-MM-dd") : "",
        time: form.time.value,
        context: form.context.value,
        name: form.concertName.value,
        additional_informations: form.additional_informations.value,
        related_link: form.related_link.value,
      };

      const response = await fetch("/api/prochains-concerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...concertData,
          affiche,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout du concert");

      await fetchConcerts();
      toast.success("Concert ajouté avec succès");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du concert");
      console.error(error);
    } finally {
      setIsCreatingConcert(false);
    }
  };

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
    formDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    setIsEditingConcert(true);

    const formData = new FormData(e.currentTarget);
    const concertData = {
      id: editingConcert!.id,
      place: formData.get("place") as string,
      date: formDate ? format(formDate, "yyyy-MM-dd") : editingConcert!.date,
      time: formData.get("time") as string,
      context: formData.get("context") as Context,
      name: formData.get("concertName") as string,
      additional_informations: formData.get(
        "additional_informations",
      ) as string,
      related_link: formData.get("related_link"),
    };

    try {
      let affiche = editingConcert?.affiche;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload de l'image");

        const { url } = await uploadResponse.json();
        affiche = url;
      }

      const response = await fetch("/api/prochains-concerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...concertData,
          affiche,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la modification");

      toast.success("Concert modifié avec succès");
      setEditDialogOpen(false);
      setEditingConcert(null);
      fetchConcerts();
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } finally {
      setIsEditingConcert(false);
    }
  };

  const handleCreateTour = async (
    e: React.FormEvent<HTMLFormElement>,
    startDate: Date | undefined,
    endDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    setIsCreatingTour(true);

    try {
      let tour_poster = null;
      const form = e.target as HTMLFormElement;

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload de l'image");
        const { url } = await uploadResponse.json();
        tour_poster = url;
      }

      const tourData = {
        name: form.tourName.value,
        description: form.description.value,
        context: form.context.value,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        tour_poster,
      };

      const response = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tourData),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout de la tournée");

      await fetchTours();
      toast.success("Tournée ajoutée avec succès");
      setTourDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la tournée");
      console.error(error);
    } finally {
      setIsCreatingTour(false);
    }
  };

  const handleEditTour = async (
    e: React.FormEvent<HTMLFormElement>,
    startDate: Date | undefined,
    endDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    setIsEditingTour(true);

    try {
      const form = e.target as HTMLFormElement;
      let tour_poster = editingTour?.tour_poster;

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload de l'image");
        const { url } = await uploadResponse.json();
        tour_poster = url;
      }

      const tourData = {
        id: editingTour!.id,
        name: form.tourName.value,
        description: form.description.value,
        context: form.context.value,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        tour_poster,
      };

      const response = await fetch("/api/tours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tourData),
      });

      if (!response.ok)
        throw new Error("Erreur lors de la modification de la tournée");

      await fetchTours();
      toast.success("Tournée modifiée avec succès");
      setEditTourDialogOpen(false);
      setEditingTour(null);
    } catch (error) {
      toast.error("Erreur lors de la modification de la tournée");
      console.error(error);
    } finally {
      setIsEditingTour(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!concertToDelete) return;

    try {
      const response = await fetch("/api/prochains-concerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: concertToDelete }),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Concert supprimé avec succès");
      fetchConcerts();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setConcertToDelete(null);
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    try {
      const response = await fetch("/api/tours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tourId }),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Tournée supprimée avec succès");
      await fetchTours();
      await fetchConcerts(); // Refresh concerts to update their tour_id display
    } catch (error) {
      toast.error("Erreur lors de la suppression de la tournée");
      console.error(error);
    }
  };

  const handleAddConcertsToTour = async (concertIds: string[]) => {
    try {
      // Update each selected concert with the tour_id
      const updatePromises = concertIds.map((concertId) =>
        fetch("/api/prochains-concerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: concertId,
            tour_id: selectedTourForConcerts?.id,
          }),
        }),
      );

      await Promise.all(updatePromises);

      toast.success(`${concertIds.length} concert(s) ajouté(s) à la tournée`);
      setAddConcertToTourDialogOpen(false);
      setSelectedTourForConcerts(null);
      await fetchConcerts();
      await fetchTours();
    } catch (error) {
      toast.error("Erreur lors de l'ajout des concerts à la tournée");
      console.error(error);
    }
  };

  // Loading State Component
  const LoadingState = () => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        setLoadingMessage(
          loadingMessages[Math.floor(Math.random() * loadingMessages.length)],
        );
      }, 2000);

      return () => clearInterval(intervalId);
    }, []);

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Music2 className="text-primary/50 mx-auto h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground text-sm">
            {loadingMessage || loadingMessages[0]}
          </p>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
      <div className="space-y-4 text-center">
        <Music2 className="text-primary/30 mx-auto h-16 w-16" />
        <h2 className="text-xl font-medium">Aucun concert prévu</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Commencez par ajouter votre premier concert pour créer votre
          programmation
        </p>
      </div>
      <AddConcertButton />
    </div>
  );

  const AddConcertButton = () => (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!loading) {
          setOpen(newOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="px-6">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un concert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouveau concert</DialogTitle>
          <DialogDescription>
            Remplissez les informations du concert
          </DialogDescription>
        </DialogHeader>
        <ConcertForm
          onSubmit={handleCreate}
          loading={isCreatingConcert}
          initialData={null}
          submitLabel="Ajouter"
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );

  const AddTourButton = () => (
    <Dialog open={tourDialogOpen} onOpenChange={setTourDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="px-6">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une tournée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouvelle tournée</DialogTitle>
          <DialogDescription>
            Créez une nouvelle tournée pour regrouper plusieurs concerts
          </DialogDescription>
        </DialogHeader>
        <TourForm
          onSubmit={handleCreateTour}
          loading={isCreatingTour}
          initialData={null}
          submitLabel="Créer la tournée"
          onClose={() => setTourDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );

  const ConcertCard = ({ concert }: { concert: Concert }) => (
    <div className="border-border/50 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-black">
      <div className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {concert.affiche && (
            <div className="w-full flex-shrink-0 md:w-48">
              <div className="aspect-[3/4] overflow-hidden rounded-lg">
                <ConcertPoster
                  src={concert.affiche}
                  alt={`Affiche du concert ${concert.name || "sans nom"}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-medium tracking-tight">
                {concert.name || "Concert sans titre"}
              </h3>

              <div className="space-y-3">
                <InfoItem icon={MapPin} text={concert.place} />
                <InfoItem
                  icon={Calendar}
                  text={format(new Date(concert.date), "dd MMMM yyyy", {
                    locale: fr,
                  })}
                />
                <InfoItem
                  icon={Clock}
                  text={concert.time.slice(0, 5).replace(":", "h")}
                />
                <InfoItem
                  icon={Tags}
                  text={
                    concert.context === "orchestre_et_choeur"
                      ? "Orchestre et Chœur"
                      : concert.context.charAt(0).toUpperCase() +
                        concert.context.slice(1)
                  }
                />
                {concert.tour_id && (
                  <InfoItem
                    icon={Users}
                    text={
                      tours.find((t) => t.id === concert.tour_id)?.name ||
                      "Tournée"
                    }
                  />
                )}
                {concert.related_link && (
                  <InfoItem icon={Link} text={concert.related_link} />
                )}
              </div>
            </div>

            {concert.additional_informations && (
              <div className="border-border/50 border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  {concert.additional_informations}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 md:flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setEditingConcert(concert);
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive rounded-full"
              onClick={() => handleDeleteClick(concert.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const TourCard = ({ tour }: { tour: Tour }) => (
    <div className="border-border/50 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-black">
      <div className="p-6">
        <div className="mb-4 flex flex-col items-start gap-4 md:flex-row md:justify-between">
          <div>
            <h3 className="text-xl font-medium tracking-tight">{tour.name}</h3>
            {tour.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {tour.description}
              </p>
            )}
          </div>
          <Badge variant="secondary">
            {tour.context === "orchestre_et_choeur"
              ? "Orchestre et Chœur"
              : tour.context.charAt(0).toUpperCase() + tour.context.slice(1)}
          </Badge>
        </div>

        <div className="text-muted-foreground mb-4 flex flex-col items-start gap-2 text-sm md:flex-row md:items-center md:gap-4">
          {tour.start_date && tour.end_date && (
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              {format(new Date(tour.start_date), "dd MMM", {
                locale: fr,
              })}{" "}
              - {format(new Date(tour.end_date), "dd MMM yyyy", { locale: fr })}
            </div>
          )}
          <div className="flex items-center">
            <Music2 className="mr-2 h-4 w-4" />
            {tour.concert_count || 0} concert
            {(tour.concert_count || 0) > 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTourForConcerts(tour);
              setAddConcertToTourDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter des concerts existants
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditingTour(tour);
              setEditTourDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive rounded-full"
            onClick={() => {
              if (
                confirm(
                  `Êtes-vous sûr de vouloir supprimer la tournée "${tour.name}" ? Les concerts ne seront pas supprimés.`,
                )
              ) {
                handleDeleteTour(tour.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const ConcertSelectionDialog = () => {
    const [selectedConcerts, setSelectedConcerts] = useState<string[]>([]);

    // Filter concerts that are not already in a tour or are in the current tour
    const availableConcerts = concerts.filter(
      (concert) =>
        !concert.tour_id || concert.tour_id === selectedTourForConcerts?.id,
    );

    return (
      <Dialog
        open={addConcertToTourDialogOpen}
        onOpenChange={(open) => {
          setAddConcertToTourDialogOpen(open);
          if (!open) {
            setSelectedConcerts([]);
            setSelectedTourForConcerts(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter des concerts à la tournée</DialogTitle>
            <DialogDescription>
              Sélectionnez les concerts à ajouter à &quot;
              {selectedTourForConcerts?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] space-y-4 overflow-y-auto">
            {availableConcerts.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Aucun concert disponible à ajouter
              </p>
            ) : (
              availableConcerts.map((concert) => (
                <div
                  key={concert.id}
                  className="hover:bg-accent/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3"
                  onClick={() => {
                    setSelectedConcerts((prev) =>
                      prev.includes(concert.id)
                        ? prev.filter((id) => id !== concert.id)
                        : [...prev, concert.id],
                    );
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedConcerts.includes(concert.id)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {concert.name || "Concert sans titre"}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      <span>{concert.place}</span>
                      <span>
                        {format(new Date(concert.date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAddConcertToTourDialogOpen(false);
                setSelectedConcerts([]);
                setSelectedTourForConcerts(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleAddConcertsToTour(selectedConcerts)}
              disabled={selectedConcerts.length === 0}
            >
              Ajouter{" "}
              {selectedConcerts.length > 0 && `(${selectedConcerts.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const InfoItem = ({
    icon: Icon,
    text,
  }: {
    icon: LucideIcon;
    text: string;
  }) => (
    <div className="text-muted-foreground flex items-center text-sm">
      <Icon className="text-muted-foreground/70 mr-3 h-4 w-4" />
      <span>{text}</span>
    </div>
  );

  return (
    <PageShell
      fullHeight
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Gestion des concerts"
      description="Gérez les concerts à venir, leur date et leur lieu."
      headerAction={
        <div className="flex flex-col gap-4 md:flex-row md:gap-2">
          <AddTourButton />
          <AddConcertButton />
        </div>
      }
    >
      <ScrollArea className="pr-4">
        {tours.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-semibold">Tournées</h2>
            <div className="space-y-4">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <LoadingState />
        ) : concerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-semibold">Concerts</h2>
            <div className="space-y-4">
              {concerts.map((concert) => (
                <ConcertCard key={concert.id} concert={concert} />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce concert ? Cette action est
              irréversible.
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

      {/* Edit Concert Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Modifier le concert</DialogTitle>
            <DialogDescription>
              Modifiez les informations du concert
            </DialogDescription>
          </DialogHeader>
          {editingConcert && (
            <ConcertForm
              onSubmit={handleEdit}
              loading={isEditingConcert}
              initialData={editingConcert}
              submitLabel="Sauvegarder"
              onClose={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tour Dialog */}
      <Dialog open={editTourDialogOpen} onOpenChange={setEditTourDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Modifier la tournée</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la tournée
            </DialogDescription>
          </DialogHeader>
          {editingTour && (
            <TourForm
              onSubmit={handleEditTour}
              loading={isEditingTour}
              initialData={editingTour}
              submitLabel="Sauvegarder"
              onClose={() => setEditTourDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConcertSelectionDialog />
    </PageShell>
  );
}
