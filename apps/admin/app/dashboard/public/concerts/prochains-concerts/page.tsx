"use client";

import { ConcertForm } from "@/components/ConcertForm";
import { ConcertCard } from "@/components/concerts/ConcertCard";
import { ConcertSelectionDialog } from "@/components/concerts/ConcertSelectionDialog";
import { TourCard } from "@/components/concerts/TourCard";
import { PageShell } from "@/components/layouts/PageShell";
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
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  useConcerts,
  useCreateConcert,
  useDeleteConcert,
  useUpdateConcert,
} from "@/hooks/useConcerts";
import {
  useCreateTour,
  useDeleteTour,
  useTours,
  useUpdateTour,
} from "@/hooks/useTours";
import { Tour } from "@/types/tours";
import { Concert, Context } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { Music2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProchainsConcerts() {
  // Queries
  const concertsQuery = useConcerts();
  const toursQuery = useTours();
  const concerts = concertsQuery.data ?? [];
  const tours = toursQuery.data ?? [];

  // Mutations
  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const deleteConcert = useDeleteConcert();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  // State
  const [createConcertOpen, setCreateConcertOpen] = useState(false);
  const [createTourOpen, setCreateTourOpen] = useState(false);
  const [editConcert, setEditConcert] = useState<Concert | null>(null);
  const [editTour, setEditTour] = useState<Tour | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "concert" | "tour";
    id: string;
    name?: string;
  } | null>(null);

  // Manage Tour State
  const [manageTour, setManageTour] = useState<Tour | null>(null);

  // Derived Data
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcomingConcerts = concerts.filter((c) => c.date >= todayStr);
  const upcomingTours = tours.filter(
    (t) => (t.end_date ?? t.start_date ?? "") >= todayStr,
  );

  // Handlers - Concerts
  const handleCreateConcert = async (
    e: React.FormEvent<HTMLFormElement>,
    formDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
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
        if (!uploadResponse.ok) throw new Error("Upload failed");
        const { url } = await uploadResponse.json();
        affiche = url;
      }

      const concertData = {
        place: form.place.value,
        date: formDate ? format(formDate, "yyyy-MM-dd") : "",
        time: form.time.value,
        context: form.context.value,
        name: form.concertName.value,
        additional_informations: form.additional_informations.value,
        related_link: form.related_link.value || null,
        affiche,
      };

      await createConcert.mutateAsync(concertData);
      toast.success("Concert ajouté");
      setCreateConcertOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleEditConcert = async (
    e: React.FormEvent<HTMLFormElement>,
    formDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    if (!editConcert) return;
    try {
      let affiche = editConcert.affiche;
      const formData = new FormData(e.currentTarget);

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileData,
        });
        if (!uploadResponse.ok) throw new Error("Upload failed");
        const { url } = await uploadResponse.json();
        affiche = url;
      }

      const concertData = {
        id: editConcert.id,
        place: formData.get("place") as string,
        date: formDate ? format(formDate, "yyyy-MM-dd") : editConcert.date,
        time: formData.get("time") as string,
        context: formData.get("context") as Context,
        name: formData.get("concertName") as string,
        additional_informations: formData.get(
          "additional_informations",
        ) as string,
        related_link: (formData.get("related_link") as string) || null,
        affiche,
      };

      await updateConcert.mutateAsync(concertData);
      toast.success("Concert modifié");
      setEditConcert(null);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification");
    }
  };

  // Handlers - Tours
  const handleCreateTour = async (
    e: React.FormEvent<HTMLFormElement>,
    startDate: Date | undefined,
    endDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      let tour_poster = null;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fileData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        tour_poster = url;
      }

      await createTour.mutateAsync({
        name: form.tourName.value,
        description: form.description.value,
        context: form.context.value,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        tour_poster,
      });

      toast.success("Tournée créée");
      setCreateTourOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur création tournée");
    }
  };

  const handleEditTour = async (
    e: React.FormEvent<HTMLFormElement>,
    startDate: Date | undefined,
    endDate: Date | undefined,
    selectedFile: File | null,
  ) => {
    e.preventDefault();
    if (!editTour) return;
    try {
      const form = e.target as HTMLFormElement;
      let tour_poster = editTour.tour_poster;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fileData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        tour_poster = url;
      }

      await updateTour.mutateAsync({
        id: editTour.id,
        name: form.tourName.value,
        description: form.description.value,
        context: form.context.value,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        tour_poster,
      });

      toast.success("Tournée mise à jour");
      setEditTour(null);
    } catch (error) {
      console.error(error);
      toast.error("Erreur modification tournée");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.type === "concert") {
        await deleteConcert.mutateAsync(deleteDialog.id);
        toast.success("Concert supprimé");
      } else {
        await deleteTour.mutateAsync(deleteDialog.id);
        toast.success("Tournée supprimée");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleUpdateTourConcerts = async (concertIds: string[]) => {
    if (!manageTour) return;
    try {
      // Logic:
      // 1. Find concerts currently in this tour that are NOT in concertIds -> remove them (set tour_id null)
      // 2. Find concerts in concertIds -> set tour_id to manageTour.id

      // Current concerts in this tour
      const currentTourConcerts = concerts.filter(
        (c) => c.tour_id === manageTour.id,
      );

      // To Remove:
      const toRemove = currentTourConcerts.filter(
        (c) => !concertIds.includes(c.id),
      );
      // To Add:
      const toAddIds = concertIds; // simpler to just update all selected to ensure they are assigned

      const promises = [
        ...toRemove.map((c) =>
          updateConcert.mutateAsync({ id: c.id, tour_id: null }),
        ),
        ...toAddIds.map((id) =>
          updateConcert.mutateAsync({ id, tour_id: manageTour.id }),
        ),
      ];

      await Promise.all(promises);
      toast.success("Liste des concerts mise à jour");
      setManageTour(null);
    } catch (error) {
      console.error(error);
      toast.error("Erreur mise à jour concerts");
    }
  };

  // --- Render ---

  return (
    <PageShell
      theme="public"
      className="py-4 sm:py-6"
      title="Prochains concerts"
      description="Gérez la programmation, les dates et les tournées."
      headerAction={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => setCreateTourOpen(true)}
          >
            <Users className="h-4 w-4" aria-hidden />
            Nouvelle tournée
          </Button>
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => setCreateConcertOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau concert
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* TOURS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight">
              Tournées en cours
            </h2>
          </div>
          <DataState
            isLoading={toursQuery.isLoading}
            isError={toursQuery.isError}
            isEmpty={upcomingTours.length === 0}
            onRetry={() => toursQuery.refetch()}
            errorDescription="Les tournées n'ont pas pu être chargées."
            skeleton={
              <CardGridSkeleton cards={2} label="Chargement des tournées…" />
            }
            empty={
              <EmptyState
                icon={Users}
                title="Aucune tournée à venir"
                description="Une tournée regroupe plusieurs concerts sous un même nom."
                className="py-8"
                action={
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setCreateTourOpen(true)}
                  >
                    <Users className="h-4 w-4" aria-hidden />
                    Créer une tournée
                  </Button>
                }
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingTours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onEdit={setEditTour}
                  onDelete={(id) =>
                    setDeleteDialog({ type: "tour", id, name: tour.name })
                  }
                  onManageConcerts={setManageTour}
                />
              ))}
            </div>
          </DataState>
        </section>

        {/* CONCERTS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="text-primary h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight">
              Concerts à venir
            </h2>
          </div>
          <DataState
            isLoading={concertsQuery.isLoading}
            isError={concertsQuery.isError}
            isEmpty={upcomingConcerts.length === 0}
            onRetry={() => concertsQuery.refetch()}
            errorDescription="Les concerts n'ont pas pu être chargés."
            skeleton={
              <CardGridSkeleton cards={3} label="Chargement des concerts…" />
            }
            empty={
              <EmptyState
                icon={Music2}
                title="Aucun concert à venir"
                description="Aucune date n'est programmée pour le moment."
                className="py-8"
                action={
                  <Button
                    className="min-h-11"
                    onClick={() => setCreateConcertOpen(true)}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Ajouter un concert
                  </Button>
                }
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingConcerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  tourName={
                    concert.tour_id
                      ? tours.find((t) => t.id === concert.tour_id)?.name
                      : undefined
                  }
                  onEdit={setEditConcert}
                  onDelete={(id) => setDeleteDialog({ type: "concert", id })}
                />
              ))}
            </div>
          </DataState>
        </section>
      </div>

      {/* --- DIALOGS --- */}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              {deleteDialog?.type === "tour" ? "la tournée" : "le concert"}
              {deleteDialog?.name ? ` « ${deleteDialog.name} »` : ""} ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 min-h-11 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Concert */}
      <Dialog open={createConcertOpen} onOpenChange={setCreateConcertOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un concert</DialogTitle>
            <DialogDescription>
              Renseignez les détails du nouvel événement.
            </DialogDescription>
          </DialogHeader>
          <ConcertForm
            onSubmit={handleCreateConcert}
            loading={createConcert.isPending}
            initialData={null}
            submitLabel="Créer le concert"
            onClose={() => setCreateConcertOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Concert */}
      <Dialog
        open={!!editConcert}
        onOpenChange={(open) => !open && setEditConcert(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le concert</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de ce concert.
            </DialogDescription>
          </DialogHeader>
          {editConcert && (
            <ConcertForm
              initialData={editConcert}
              onSubmit={handleEditConcert}
              loading={updateConcert.isPending}
              submitLabel="Enregistrer"
              onClose={() => setEditConcert(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Tour */}
      <Dialog open={createTourOpen} onOpenChange={setCreateTourOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouvelle tournée</DialogTitle>
            <DialogDescription>
              Une tournée permet de regrouper plusieurs concerts.
            </DialogDescription>
          </DialogHeader>
          <TourForm
            onSubmit={handleCreateTour}
            loading={createTour.isPending}
            initialData={null}
            submitLabel="Créer la tournée"
            onClose={() => setCreateTourOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Tour */}
      <Dialog
        open={!!editTour}
        onOpenChange={(open) => !open && setEditTour(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier la tournée</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de cette tournée.
            </DialogDescription>
          </DialogHeader>
          {editTour && (
            <TourForm
              initialData={editTour}
              onSubmit={handleEditTour}
              loading={updateTour.isPending}
              submitLabel="Enregistrer"
              onClose={() => setEditTour(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Concerts in Tour */}
      <ConcertSelectionDialog
        isOpen={!!manageTour}
        onClose={() => setManageTour(null)}
        tour={manageTour}
        concerts={upcomingConcerts} // Only show upcoming concerts for assignment
        onConfirm={handleUpdateTourConcerts}
      />
    </PageShell>
  );
}
