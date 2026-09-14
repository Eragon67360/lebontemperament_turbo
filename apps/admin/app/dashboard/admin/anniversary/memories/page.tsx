"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { MemoryItem } from "@/components/anniversary/MemoryItem";
import { PageShell } from "@/components/layouts/PageShell";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteMemory,
  useMemories,
  useUpdateMemory,
} from "@/hooks/useAnniversaryMemories";
import { AnniversaryMemory } from "@/types/anniversary";
import { MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type MemoryFilter = "pending" | "approved" | "all";

const EMPTY_DESCRIPTIONS: Record<MemoryFilter, string> = {
  pending: "Aucun témoignage n'attend de modération pour le moment.",
  approved: "Aucun témoignage n'a encore été approuvé.",
  all: "Les témoignages soumis par les visiteurs apparaîtront ici.",
};

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<MemoryFilter>("pending");
  const {
    data: memories = [],
    isLoading,
    isError,
    refetch,
  } = useMemories(activeTab);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] =
    useState<AnniversaryMemory | null>(null);

  const handleApprove = async (memory: AnniversaryMemory) => {
    try {
      await updateMemory.mutateAsync({
        id: memory.id,
        is_approved: true,
      });
      toast.success("Témoignage approuvé avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
      console.error("Approve error:", error);
    }
  };

  const handleFeature = async (memory: AnniversaryMemory) => {
    try {
      await updateMemory.mutateAsync({
        id: memory.id,
        is_featured: !memory.is_featured,
      });
      toast.success(
        memory.is_featured
          ? "Témoignage retiré de la une"
          : "Témoignage mis à la une",
      );
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Feature error:", error);
    }
  };

  const handleDelete = (memory: AnniversaryMemory) => {
    setSelectedMemory(memory);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMemory) return;

    try {
      await deleteMemory.mutateAsync(selectedMemory.id);
      toast.success("Témoignage supprimé avec succès");
      setDeleteDialogOpen(false);
      setSelectedMemory(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const memoryList = (
    <DataState
      isLoading={isLoading}
      isError={isError}
      isEmpty={memories.length === 0}
      onRetry={() => refetch()}
      errorDescription="Les témoignages n'ont pas pu être chargés."
      skeleton={<ListSkeleton rows={3} label="Chargement des témoignages…" />}
      empty={
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucun témoignage"
          description={EMPTY_DESCRIPTIONS[activeTab]}
        />
      }
    >
      <div className="space-y-4">
        {memories.map((memory) => (
          <MemoryItem
            key={memory.id}
            memory={memory}
            onApprove={handleApprove}
            onFeature={handleFeature}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DataState>
  );

  return (
    <PageShell
      title="Modération des témoignages"
      description="Approuver et gérer les témoignages soumis par les visiteurs"
      theme="anniversary"
      className="py-4 sm:py-6"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MemoryFilter)}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            aria-label="Filtrer les témoignages par statut"
            className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto"
          >
            <TabsTrigger value="pending" className="min-h-11">
              En attente
            </TabsTrigger>
            <TabsTrigger value="approved" className="min-h-11">
              Approuvés
            </TabsTrigger>
            <TabsTrigger value="all" className="min-h-11">
              Tous
            </TabsTrigger>
          </TabsList>
          {!isLoading && !isError && (
            <p className="text-muted-foreground text-sm">
              {memories.length} témoignage{memories.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <TabsContent value="pending" className="mt-0">
          {memoryList}
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          {memoryList}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          {memoryList}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer ce témoignage ?"
        description={`Êtes-vous sûr de vouloir supprimer le témoignage de « ${selectedMemory?.name} » ? Cette action est irréversible.`}
        isLoading={deleteMemory.isPending}
      />
    </PageShell>
  );
}
