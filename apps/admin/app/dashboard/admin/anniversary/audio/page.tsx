"use client";

import { AudioMemoryDialog } from "@/components/anniversary/AudioMemoryDialog";
import { AudioMemoryItem } from "@/components/anniversary/AudioMemoryItem";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAudioMemories,
  useDeleteAudioMemory,
} from "@/hooks/useAnniversaryAudio";
import { AnniversaryAudioMemory } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AudioPage() {
  const { data: audioMemories, isLoading } = useAudioMemories();
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

  if (isLoading) {
    return (
      <PageShell
        title="Mémoires Audio"
        description="Gérer les témoignages et extraits audio"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageShell>
    );
  }

  const maxOrder =
    audioMemories?.reduce(
      (max, audio) => Math.max(max, audio.display_order),
      0,
    ) || 0;

  return (
    <PageShell
      title="Mémoires Audio"
      description="Gérer les témoignages et extraits audio"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {audioMemories?.length || 0} mémoire(s) audio
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un souvenir audio
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {audioMemories && audioMemories.length > 0 ? (
          <div className="space-y-4 pb-4">
            {audioMemories.map((audio) => (
              <AudioMemoryItem
                key={audio.id}
                audio={audio}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucune mémoire audio. Cliquez sur "Ajouter un souvenir audio" pour
              commencer.
            </p>
          </div>
        )}
      </div>

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
