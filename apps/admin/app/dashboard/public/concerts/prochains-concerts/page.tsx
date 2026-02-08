"use client";

import { ConcertForm } from "@/components/ConcertForm";
import { ConcertPoster } from "@/components/ConcertPoster";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { Concert, Context } from "@/types/concerts";
import { Tour } from "@/types/tours";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  MapPin,
  Music,
  Music2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- Utility Components ---

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-4">
      <div className="bg-muted h-6 w-32 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-muted/40 h-[180px] w-full animate-pulse rounded-2xl border"
          />
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <div className="bg-muted h-6 w-32 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted/40 h-[240px] w-full animate-pulse rounded-2xl border"
          />
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = ({
  onAddConcert,
  onAddTour,
}: {
  onAddConcert: () => void;
  onAddTour: () => void;
}) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-primary/5 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <Music className="text-primary/40 h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">
        Programmation vide
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Aucun concert ni tournée n'est prévu pour le moment.
      </p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button variant="outline" onClick={onAddTour}>
        <Users className="mr-2 h-4 w-4" />
        Créer une tournée
      </Button>
      <Button onClick={onAddConcert}>
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un concert
      </Button>
    </div>
  </div>
);

// --- Sub-Components ---

const TourCard = ({
  tour,
  onEdit,
  onDelete,
  onManageConcerts,
}: {
  tour: Tour;
  onEdit: (t: Tour) => void;
  onDelete: (id: string) => void;
  onManageConcerts: (t: Tour) => void;
}) => {
  const isOrchestra = tour.context === "orchestre_et_choeur";

  return (
    <Card className="bg-card/50 hover:border-primary/50 group relative flex flex-col justify-between overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
      <div className="bg-primary/5 group-hover:bg-primary/10 translate-y--8 absolute top-0 right-0 h-24 w-24 translate-x-8 rounded-full blur-2xl transition-all" />

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-lg font-bold tracking-tight">
              {tour.name}
            </h3>
            <Badge
              variant="outline"
              className={
                isOrchestra
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-600"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-600"
              }
            >
              {isOrchestra ? "Orchestre & Chœur" : "Chœur seul"}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              onClick={() => onEdit(tour)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
              onClick={() => onDelete(tour.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm">
          {tour.description || "Aucune description..."}
        </p>

        <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {tour.start_date
                ? format(new Date(tour.start_date), "dd MMM", { locale: fr })
                : "?"}{" "}
              -{" "}
              {tour.end_date
                ? format(new Date(tour.end_date), "dd MMM yyyy", { locale: fr })
                : "?"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5" />
            <span>{tour.concert_count || 0} concerts</span>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 border-t p-3">
        <Button
          variant="secondary"
          className="bg-background hover:bg-background/80 w-full justify-between"
          size="sm"
          onClick={() => onManageConcerts(tour)}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> Gérer les concerts
          </span>
          <Users className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </div>
    </Card>
  );
};

const ConcertCard = ({
  concert,
  tourName,
  onEdit,
  onDelete,
}: {
  concert: Concert;
  tourName?: string;
  onEdit: (c: Concert) => void;
  onDelete: (id: string) => void;
}) => {
  const dateObj = new Date(concert.date);

  return (
    <Card className="bg-card hover:border-primary/50 group relative flex overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
      {/* Date Tile (Left Side) */}
      <div className="bg-muted/20 hidden flex-col items-center justify-center border-r px-5 py-4 text-center sm:flex">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {format(dateObj, "MMM", { locale: fr })}
        </span>
        <span className="text-foreground text-3xl leading-none font-black">
          {format(dateObj, "dd")}
        </span>
        <span className="text-muted-foreground/80 text-xs font-medium">
          {format(dateObj, "yyyy")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Poster thumbnail (if any) */}
            {concert.affiche ? (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border shadow-sm">
                <ConcertPoster
                  src={concert.affiche}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                <Music2 className="h-6 w-6" />
              </div>
            )}

            <div>
              <h3 className="line-clamp-1 leading-tight font-bold tracking-tight">
                {concert.name || "Concert sans titre"}
              </h3>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                {tourName && (
                  <Badge
                    variant="secondary"
                    className="text-muted-foreground h-5 px-1.5 font-normal"
                  >
                    {tourName}
                  </Badge>
                )}
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {concert.time.slice(0, 5).replace(":", "h")}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex flex-shrink-0 flex-col gap-1 sm:flex-row">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary h-8 w-8"
              onClick={() => onEdit(concert)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
              onClick={() => onDelete(concert.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary/60 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{concert.place}</span>
          </div>
          {concert.related_link && (
            <div className="flex items-center gap-2">
              <LinkIcon className="text-primary/60 h-4 w-4 flex-shrink-0" />
              <a
                href={concert.related_link}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary truncate hover:underline"
              >
                Lien billeterie/info
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// --- Main Page Component ---

export default function ProchainsConcerts() {
  // Queries
  const { data: concerts = [], isLoading: loadingConcerts } = useConcerts();
  const { data: tours = [], isLoading: loadingTours } = useTours();
  const loading = loadingConcerts || loadingTours;

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
        related_link: form.related_link.value,
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
        related_link: formData.get("related_link") as string,
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
      fullHeight
      theme="public"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Prochains concerts"
      description="Gérez la programmation, les dates et les tournées."
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => setCreateTourOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Nouvelle tournée
          </Button>
          <Button
            onClick={() => setCreateConcertOpen(true)}
            className="shadow-md transition-all hover:shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nouveau Concert</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      }
    >
      <ScrollArea className="h-full w-full pr-4">
        {loading ? (
          <LoadingSkeleton />
        ) : upcomingConcerts.length === 0 && upcomingTours.length === 0 ? (
          <EmptyState
            onAddConcert={() => setCreateConcertOpen(true)}
            onAddTour={() => setCreateTourOpen(true)}
          />
        ) : (
          <div className="space-y-10 pb-12">
            {/* TOURS SECTION */}
            {upcomingTours.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Users className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    Tournées en cours
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingTours.map((tour) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      onEdit={setEditTour}
                      onDelete={(id) =>
                        setDeleteDialog({
                          type: "tour",
                          id,
                          name: tour.name,
                        })
                      }
                      onManageConcerts={setManageTour}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CONCERTS SECTION */}
            {upcomingConcerts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Music2 className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    Concerts à venir
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
                      onDelete={(id) =>
                        setDeleteDialog({ type: "concert", id })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

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
              {deleteDialog?.name ? ` "${deleteDialog.name}"` : ""} ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
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

// --- Helper Dialog for Concert Selection ---

function ConcertSelectionDialog({
  isOpen,
  onClose,
  tour,
  concerts,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  concerts: Concert[];
  onConfirm: (ids: string[]) => void;
}) {
  // Local state for checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen && tour) {
      const alreadyInTour = concerts
        .filter((c) => c.tour_id === tour.id)
        .map((c) => c.id);
      setSelectedIds(alreadyInTour);
    }
  }, [isOpen, tour, concerts]);

  // Filter available:
  // Show concerts that are:
  // 1. Assigned to THIS tour
  // 2. OR Not assigned to ANY tour
  const availableConcerts = concerts.filter(
    (c) => c.tour_id === tour?.id || !c.tour_id,
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les concerts</DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des concerts pour la tournée "{tour?.name}".
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mr-4 flex-1 pr-4">
          <div className="space-y-2 p-1">
            {availableConcerts.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Aucun concert disponible.
              </div>
            ) : (
              availableConcerts.map((concert) => {
                const isSelected = selectedIds.includes(concert.id);
                return (
                  <div
                    key={concert.id}
                    onClick={() => handleToggle(concert.id)}
                    className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "bg-primary/5 border-primary/50"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {concert.name || "Concert sans titre"}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>
                          {format(new Date(concert.date), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                        <span>•</span>
                        <span>{concert.place}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => onConfirm(selectedIds)}>
            Enregistrer ({selectedIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
