"use client";

import { AudioMemoryDialog } from "@/components/anniversary/AudioMemoryDialog";
import { AudioMemoryItem } from "@/components/anniversary/AudioMemoryItem";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useAudioMemories,
  useDeleteAudioMemory,
} from "@/hooks/useAnniversaryAudio";
import { AnniversaryAudioMemory } from "@/types/anniversary";
import { Mic, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AudioPage() {
  const {
    data: audioMemories = [],
    isLoading,
    isError,
    refetch,
  } = useAudioMemories();
  const deleteAudio = useDeleteAudioMemory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] =
    useState<AnniversaryAudioMemory | null>(null);

  const handleEdit = (audio: AnniversaryAudioMemory) => {
    setSelectedAudio(audio);
    setDialogOpen(true);
  };

  const handleDelete = (audio: AnniversaryAudioMemory) => {
    setSelectedAudio(audio);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAudio) return;

    try {
      await deleteAudio.mutateAsync(selectedAudio.id);
      toast.success("Mémoire audio supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedAudio(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedAudio(null);
    }
  };

  const maxOrder = audioMemories.reduce(
    (max, audio) => Math.max(max, audio.display_order),
    0,
  );

  return (
    <PageShell
      title="Mémoires audio"
      description="Gérer les témoignages et extraits audio"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un souvenir audio
        </Button>
      }
    >
      {audioMemories.length > 0 && (
        <p className="text-muted-foreground mb-4 text-sm">
          {audioMemories.length} mémoire{audioMemories.length > 1 ? "s" : ""}{" "}
          audio
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={audioMemories.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les mémoires audio n'ont pas pu être chargées."
        skeleton={
          <ListSkeleton rows={4} label="Chargement des mémoires audio…" />
        }
        empty={
          <EmptyState
            icon={Mic}
            title="Aucune mémoire audio"
            description="Ajoutez les témoignages et extraits sonores à faire écouter dans la section des 40 ans."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un souvenir audio
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {audioMemories.map((audio) => (
            <AudioMemoryItem
              key={audio.id}
              audio={audio}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Create/Edit Dialog */}
      <AudioMemoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        audio={selectedAudio || undefined}
        maxOrder={maxOrder}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette mémoire audio ?"
        description={`Êtes-vous sûr de vouloir supprimer "${selectedAudio?.title}" ? Cette action est irréversible.`}
        isLoading={deleteAudio.isPending}
      />
    </PageShell>
  );
}
