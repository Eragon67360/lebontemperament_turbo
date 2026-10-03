"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { TimelineEventDialog } from "@/components/anniversary/TimelineEventDialog";
import { TimelineEventItem } from "@/components/anniversary/TimelineEventItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useDeleteTimelineEvent,
  useTimelineEvents,
} from "@/hooks/useAnniversaryTimeline";
import { AnniversaryTimelineEvent } from "@/types/anniversary";
import { Clock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TimelinePage() {
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useTimelineEvents();
  const deleteEvent = useDeleteTimelineEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<AnniversaryTimelineEvent | null>(null);

  const handleEdit = (event: AnniversaryTimelineEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleDelete = (event: AnniversaryTimelineEvent) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;

    try {
      await deleteEvent.mutateAsync(selectedEvent.id);
      toast.success("Événement supprimé avec succès");
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
    }
  };

  const maxOrder = events.reduce(
    (max, event) => Math.max(max, event.display_order),
    0,
  );

  return (
    <PageShell
      title="Chronologie - 40 ans d'histoire"
      description="Gérer les événements marquants de la chronologie"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un événement
        </Button>
      }
    >
      {!isLoading && !isError && (
        <p className="text-muted-foreground mb-4 text-sm">
          {events.length} événement{events.length > 1 ? "s" : ""}
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={events.length === 0}
        onRetry={() => refetch()}
        errorDescription="La chronologie n'a pas pu être chargée."
        skeleton={
          <ListSkeleton rows={4} label="Chargement de la chronologie…" />
        }
        empty={
          <EmptyState
            icon={Clock}
            title="Aucun événement"
            description="Retracez les moments marquants des 40 ans en ajoutant un premier événement."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un événement
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {events.map((event) => (
            <TimelineEventItem
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Create/Edit Dialog */}
      <TimelineEventDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        event={selectedEvent || undefined}
        maxOrder={maxOrder}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cet événement ?"
        description={`Êtes-vous sûr de vouloir supprimer l'événement « ${selectedEvent?.title} » (${selectedEvent?.year}) ? Cette action est irréversible.`}
        isLoading={deleteEvent.isPending}
      />
    </PageShell>
  );
}
