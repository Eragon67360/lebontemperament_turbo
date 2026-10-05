"use client";

import { AudioMemoryDialog } from "@/components/anniversary/AudioMemoryDialog";
import { AudioMemoryItem } from "@/components/anniversary/AudioMemoryItem";
import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
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
  useAudioMemories,
  useDeleteAudioMemory,
  useUpdateAudioMemory,
} from "@/hooks/useAnniversaryAudio";
import type { AnniversaryAudioMemory } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { Mic } from "lucide-react";

const nameOf = (audio: AnniversaryAudioMemory) => audio.title;

export default function AudioPage() {
  const {
    data: memories = [],
    isLoading,
    isError,
    refetch,
  } = useAudioMemories();
  const update = useUpdateAudioMemory();
  const remove = useDeleteAudioMemory();
  const list = useListActions<AnniversaryAudioMemory>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Souvenirs audio"
      description="Les témoignages et extraits sonores à écouter sur la page des 40 ans."
      headerAction={
        <AddButton label="Ajouter un souvenir" onClick={list.openCreate} />
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={memories.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les souvenirs audio n'ont pas pu être chargés."
        skeleton={
          <ListSkeleton rows={4} label="Chargement des souvenirs audio…" />
        }
        empty={
          <EmptyState
            icon={Mic}
            title="Aucun souvenir audio"
            description="Un enregistrement de quelques minutes, une personne qui raconte : les visiteurs l'écoutent directement sur la page."
            action={
              <AddButton
                label="Ajouter un souvenir"
                onClick={list.openCreate}
              />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(memories, "souvenir", "souvenirs")}
        </p>
        <CampaignList
          items={memories}
          endpoint="/api/anniversary/audio"
          queryKey={["anniversary", "audio"]}
          nameOf={nameOf}
          renderItem={(audio, reorder) => (
            <AudioMemoryItem
              audio={audio}
              reorder={reorder}
              busy={list.busyId === audio.id}
              onEdit={() => list.openEdit(audio)}
              onToggleVisibility={() => list.toggleVisibility(audio)}
              onDelete={() => list.askDelete(audio)}
            />
          )}
        />
      </DataState>

      <AudioMemoryDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        audio={list.editing}
        nextOrder={nextOrder(memories)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » ?`}
        description="Le souvenir disparaît de la page et son fichier audio est effacé. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
