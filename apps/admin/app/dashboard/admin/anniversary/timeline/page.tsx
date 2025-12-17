"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { TimelineEventDialog } from "@/components/anniversary/TimelineEventDialog";
import { TimelineEventItem } from "@/components/anniversary/TimelineEventItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteTimelineEvent,
  useTimelineEvents,
} from "@/hooks/useAnniversaryTimeline";
import { AnniversaryTimelineEvent } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TimelinePage() {
  const { data: events, isLoading } = useTimelineEvents();
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

  if (isLoading) {
    return (
      <PageShell
        title="Chronologie - 40 Ans d'Histoire"
        description="Gérer les événements marquants de la chronologie"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  const maxOrder =
    events?.reduce((max, event) => Math.max(max, event.display_order), 0) || 0;

  return (
    <PageShell
      title="Chronologie - 40 Ans d'Histoire"
      description="Gérer les événements marquants de la chronologie"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {events?.length || 0} événement(s)
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>

      <div className="flex max-h-full min-h-0 flex-1 flex-col overflow-y-auto">
        {events && events.length > 0 ? (
          <div className="space-y-4 pb-4">
            {events.map((event) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucun événement. Cliquez sur "Ajouter un événement" pour
              commencer.
            </p>
          </div>
        )}
      </div>

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
        description={`Êtes-vous sûr de vouloir supprimer l'événement "${selectedEvent?.title}" (${selectedEvent?.year}) ? Cette action est irréversible.`}
        isLoading={deleteEvent.isPending}
      />
    </PageShell>
  );
}
