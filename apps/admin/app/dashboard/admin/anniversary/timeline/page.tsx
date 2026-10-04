"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
import { TimelineEventDialog } from "@/components/anniversary/TimelineEventDialog";
import { TimelineEventItem } from "@/components/anniversary/TimelineEventItem";
import {
  countLine,
  useListActions,
} from "@/components/anniversary/useListActions";
import { PageShell } from "@/components/layouts/PageShell";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useDeleteTimelineEvent,
  useTimelineEvents,
  useUpdateTimelineEvent,
} from "@/hooks/useAnniversaryTimeline";
import type { AnniversaryTimelineEvent } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { Clock } from "lucide-react";

const nameOf = (event: AnniversaryTimelineEvent) => event.title;

export default function TimelinePage() {
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useTimelineEvents();
  const update = useUpdateTimelineEvent();
  const remove = useDeleteTimelineEvent();
  const list = useListActions<AnniversaryTimelineEvent>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Chronologie"
      description="Les moments marquants de 40 ans d'histoire, dans l'ordre où la page les raconte."
      headerAction={
        <AddButton label="Ajouter un événement" onClick={list.openCreate} />
      }
    >
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
            description="Commencez par la création en 1984, puis les grandes étapes : premiers concerts, tournées, anniversaires."
            action={
              <AddButton
                label="Ajouter un événement"
                onClick={list.openCreate}
              />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(events, "événement", "événements")} · l&apos;ordre
          ci-dessous est celui de la page, pas celui des années
        </p>
        <CampaignList
          items={events}
          endpoint="/api/anniversary/timeline"
          queryKey={["anniversary", "timeline"]}
          nameOf={nameOf}
          renderItem={(event, reorder) => (
            <TimelineEventItem
              event={event}
              reorder={reorder}
              busy={list.busyId === event.id}
              onEdit={() => list.openEdit(event)}
              onToggleVisibility={() => list.toggleVisibility(event)}
              onDelete={() => list.askDelete(event)}
            />
          )}
        />
      </DataState>

      <TimelineEventDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        event={list.editing}
        nextOrder={nextOrder(events)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » (${list.deleting?.year ?? ""}) ?`}
        description="L'événement disparaît de la chronologie et d'ici. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
