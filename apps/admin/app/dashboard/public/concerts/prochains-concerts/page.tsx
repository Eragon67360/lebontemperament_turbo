"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { ConcertDialog } from "@/components/concerts/ConcertDialog";
import { ConcertRow } from "@/components/concerts/ConcertRow";
import { ConcertSelectionDialog } from "@/components/concerts/ConcertSelectionDialog";
import { TourDialog } from "@/components/concerts/TourDialog";
import { TourRow } from "@/components/concerts/TourRow";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { Tour } from "@/types/tours";
import {
  concertCountLabel,
  concertTitle,
  splitConcerts,
  splitTours,
  todayIso,
} from "@/utils/concerts/schedule";
import type { ConcertFormValues, TourFormValues } from "@/utils/formSchemas";
import type { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { Music2, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/** Uploads a poster through the existing route and returns its public URL. */
async function uploadPoster(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  if (!response.ok) throw new Error("L'affiche n'a pas pu être envoyée.");
  const { url } = (await response.json()) as { url: string };
  return url;
}

type Period = "upcoming" | "past";

type DeleteTarget =
  { type: "concert"; item: Concert } | { type: "tour"; item: Tour };

export default function ConcertsAndToursPage() {
  const concertsQuery = useConcerts();
  const toursQuery = useTours();
  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const deleteConcert = useDeleteConcert();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  const [tab, setTab] = useState<Period>("upcoming");
  const [concertDialog, setConcertDialog] = useState<{
    open: boolean;
    concert: Concert | null;
  }>({ open: false, concert: null });
  const [tourDialog, setTourDialog] = useState<{
    open: boolean;
    tour: Tour | null;
  }>({ open: false, tour: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manageTour, setManageTour] = useState<Tour | null>(null);

  // Memoised: ConcertSelectionDialog re-seeds its ticks when its concerts
  // array changes, so a fresh array on every render would drop the admin's
  // unsaved selection. Today is read when the data changes, so a page left
  // open overnight stays consistent until it refetches.
  const concerts = useMemo(
    () => splitConcerts(concertsQuery.data ?? [], todayIso()),
    [concertsQuery.data],
  );
  const tours = useMemo(
    () => splitTours(toursQuery.data ?? [], todayIso()),
    [toursQuery.data],
  );
  const tourNames = useMemo(
    () => new Map((toursQuery.data ?? []).map((t) => [t.id, t.name])),
    [toursQuery.data],
  );

  // --- Concerts ---

  const saveConcert = async (
    values: ConcertFormValues,
    poster: File | null,
  ) => {
    const editing = concertDialog.concert;
    setSaving(true);
    try {
      const affiche = poster
        ? await uploadPoster(poster)
        : (editing?.affiche ?? null);
      const data = {
        place: values.place,
        date: format(values.date, "yyyy-MM-dd"),
        time: values.time,
        context: values.context,
        name: values.concertName,
        additional_informations: values.additional_informations,
        related_link: values.related_link || null,
        tour_id: values.tour_id || null,
        affiche,
      };
      const title = concertTitle({
        name: values.concertName,
        place: values.place,
      });
      if (editing) {
        await updateConcert.mutateAsync({ id: editing.id, ...data });
        toast.success(`« ${title} » enregistré`);
      } else {
        await createConcert.mutateAsync(data);
        toast.success(`« ${title} » ajouté aux prochains concerts`);
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Tours ---

  const saveTour = async (values: TourFormValues, poster: File | null) => {
    const editing = tourDialog.tour;
    setSaving(true);
    try {
      const tour_poster = poster
        ? await uploadPoster(poster)
        : (editing?.tour_poster ?? null);
      const data = {
        name: values.tourName,
        description: values.description,
        context: values.context,
        start_date: values.start_date
          ? format(values.start_date, "yyyy-MM-dd")
          : undefined,
        end_date: values.end_date
          ? format(values.end_date, "yyyy-MM-dd")
          : undefined,
        tour_poster,
      };
      if (editing) {
        await updateTour.mutateAsync({ id: editing.id, ...data });
        toast.success(`« ${values.tourName} » enregistrée`);
      } else {
        await createTour.mutateAsync(data);
        toast.success(`« ${values.tourName} » créée`);
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Deletion ---

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      if (deleting.type === "concert") {
        await deleteConcert.mutateAsync(deleting.item.id);
        toast.success(`« ${concertTitle(deleting.item)} » supprimé`);
      } else {
        await deleteTour.mutateAsync(deleting.item.id);
        toast.success(`« ${deleting.item.name} » supprimée`);
      }
      setDeleting(null);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- « Gérer les concerts »: one PATCH per concert, partial failures named ---

  const updateTourConcerts = async (concertIds: string[]) => {
    if (!manageTour) return;
    const all = concertsQuery.data ?? [];
    const toRemove = all.filter(
      (c) => c.tour_id === manageTour.id && !concertIds.includes(c.id),
    );
    const toAdd = all.filter(
      (c) => concertIds.includes(c.id) && c.tour_id !== manageTour.id,
    );
    const changes = [
      ...toRemove.map((c) => ({ concert: c, tour_id: null })),
      ...toAdd.map((c) => ({ concert: c, tour_id: manageTour.id })),
    ];
    if (changes.length === 0) {
      setManageTour(null);
      return;
    }
    const results = await Promise.allSettled(
      changes.map((change) =>
        updateConcert.mutateAsync({
          id: change.concert.id,
          tour_id: change.tour_id,
        }),
      ),
    );
    const failed = changes.filter((_, i) => results[i]!.status === "rejected");
    if (failed.length === 0) {
      toast.success(`Concerts de « ${manageTour.name} » mis à jour`);
      setManageTour(null);
      return;
    }
    toast.error(
      failed.length === changes.length
        ? "Aucun changement n'a été enregistré"
        : "Une partie des changements n'a pas été enregistrée",
      {
        description: `Non enregistré : ${failed
          .map((f) => `« ${concertTitle(f.concert)} »`)
          .join(", ")}. La liste a été rechargée.`,
      },
    );
    await Promise.all([concertsQuery.refetch(), toursQuery.refetch()]);
  };

  const openCreateConcert = () =>
    setConcertDialog({ open: true, concert: null });
  const openCreateTour = () => setTourDialog({ open: true, tour: null });

  // --- Render ---

  const renderPeriod = (key: Period) => {
    const periodTours = tours[key];
    const periodConcerts = concerts[key];
    const past = key === "past";
    return (
      <div className="space-y-8">
        <section aria-labelledby={`${key}-tours-heading`} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`${key}-tours-heading`} className="text-section">
              {past ? "Tournées passées" : "Tournées"}
            </h2>
            {periodTours.length > 0 && (
              <p className="text-note text-muted-foreground">
                {periodTours.length} tournée{periodTours.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <DataState
            isLoading={toursQuery.isLoading}
            isError={toursQuery.isError}
            isEmpty={periodTours.length === 0}
            onRetry={() => toursQuery.refetch()}
            errorDescription="Les tournées n'ont pas pu être chargées."
            skeleton={
              <ListSkeleton rows={1} label="Chargement des tournées…" />
            }
            empty={
              <EmptyState
                icon={Users}
                title={
                  past ? "Aucune tournée passée" : "Aucune tournée à venir"
                }
                description={
                  past
                    ? "Les tournées dont le dernier concert est passé apparaîtront ici."
                    : "Une tournée regroupe plusieurs concerts sous un même nom ; vous pourrez en préciser les dates plus tard."
                }
                className="py-6"
                action={
                  past ? undefined : (
                    <Button variant="outline" onClick={openCreateTour}>
                      <Users aria-hidden />
                      Créer une tournée
                    </Button>
                  )
                }
              />
            }
          >
            <ul className="space-y-3">
              {periodTours.map((tour) => (
                <li key={tour.id} className="list-none">
                  <TourRow
                    tour={tour}
                    onEdit={() => setTourDialog({ open: true, tour })}
                    onDelete={() => setDeleting({ type: "tour", item: tour })}
                    onManageConcerts={() => setManageTour(tour)}
                  />
                </li>
              ))}
            </ul>
          </DataState>
        </section>

        <section
          aria-labelledby={`${key}-concerts-heading`}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`${key}-concerts-heading`} className="text-section">
              {past ? "Concerts passés" : "Concerts à venir"}
            </h2>
            {periodConcerts.length > 0 && (
              <p className="text-note text-muted-foreground">
                {concertCountLabel(periodConcerts.length)}
              </p>
            )}
          </div>
          <DataState
            isLoading={concertsQuery.isLoading}
            isError={concertsQuery.isError}
            isEmpty={periodConcerts.length === 0}
            onRetry={() => concertsQuery.refetch()}
            errorDescription="Les concerts n'ont pas pu être chargés."
            skeleton={
              <ListSkeleton rows={3} label="Chargement des concerts…" />
            }
            empty={
              <EmptyState
                icon={Music2}
                title={past ? "Aucun concert passé" : "Aucun concert à venir"}
                description={
                  past
                    ? "Les concerts dont la date est passée apparaîtront ici, prêts à être corrigés si besoin."
                    : "Aucune date n'est programmée : le site public affiche « Aucun concert à venir » en attendant."
                }
                className="py-6"
                action={
                  past ? undefined : (
                    <Button variant="outline" onClick={openCreateConcert}>
                      <Plus aria-hidden />
                      Programmer un concert
                    </Button>
                  )
                }
              />
            }
          >
            <ul className="space-y-3">
              {periodConcerts.map((concert) => (
                <li key={concert.id} className="list-none">
                  <ConcertRow
                    concert={concert}
                    tourName={
                      concert.tour_id
                        ? tourNames.get(concert.tour_id)
                        : undefined
                    }
                    onEdit={() => setConcertDialog({ open: true, concert })}
                    onDelete={() =>
                      setDeleting({ type: "concert", item: concert })
                    }
                  />
                </li>
              ))}
            </ul>
          </DataState>
        </section>
      </div>
    );
  };

  const deleteTitle =
    deleting?.type === "tour"
      ? `Supprimer la tournée « ${deleting.item.name} » ?`
      : `Supprimer « ${deleting ? concertTitle(deleting.item) : ""} » ?`;
  // The tours route deletes the row only; the database then clears the
  // concerts' tour_id (ON DELETE SET NULL per app/api/tours/route.ts).
  const deleteDescription =
    deleting?.type === "tour"
      ? `${
          deleting.item.concert_count
            ? `Ses ${concertCountLabel(deleting.item.concert_count)} restent programmés, sans tournée. `
            : "Elle ne contient aucun concert. "
        }La tournée disparaît du site public. Cette action ne peut pas être annulée.`
      : "Le concert disparaît du site public et son affiche est effacée. Cette action ne peut pas être annulée.";

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Concerts et tournées"
      description="Les concerts annoncés sur le site public, regroupés en tournées quand ils le sont. Les concerts passés restent consultables et corrigeables."
      headerAction={
        <>
          <Button variant="outline" onClick={openCreateTour}>
            <Users aria-hidden />
            Nouvelle tournée
          </Button>
          <Button onClick={openCreateConcert}>
            <Plus aria-hidden />
            Ajouter un concert
          </Button>
        </>
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

      <ConcertDialog
        open={concertDialog.open}
        onOpenChange={(open) =>
          setConcertDialog((current) => ({ ...current, open }))
        }
        concert={concertDialog.concert}
        tours={tours.upcoming}
        onSubmit={saveConcert}
        isPending={saving}
      />

      <TourDialog
        open={tourDialog.open}
        onOpenChange={(open) =>
          setTourDialog((current) => ({ ...current, open }))
        }
        tour={tourDialog.tour}
        onSubmit={saveTour}
        isPending={saving}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={deleteTitle}
        description={deleteDescription}
        isLoading={isDeleting}
      />

      <ConcertSelectionDialog
        isOpen={manageTour !== null}
        onClose={() => setManageTour(null)}
        tour={manageTour}
        concerts={
          manageTour && tours.past.some((t) => t.id === manageTour.id)
            ? concerts.past
            : concerts.upcoming
        }
        onConfirm={updateTourConcerts}
        isPending={updateConcert.isPending}
      />
    </PageShell>
  );
}
