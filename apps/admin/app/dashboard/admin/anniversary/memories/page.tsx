"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { MemoryItem } from "@/components/anniversary/MemoryItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteMemory,
  useMemories,
  useUpdateMemory,
} from "@/hooks/useAnniversaryMemories";
import { AnniversaryMemory } from "@/types/anniversary";
import { useState } from "react";
import { toast } from "sonner";

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">(
    "pending",
  );
  const { data: memories, isLoading } = useMemories(activeTab);
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

  if (isLoading) {
    return (
      <PageShell
        title="Modération des Témoignages"
        description="Approuver et gérer les témoignages soumis par les visiteurs"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageShell>
    );
  }

  const renderMemories = () => {
    if (!memories || memories.length === 0) {
      return (
        <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Aucun témoignage à afficher.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-4">
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
    );
  };

  return (
    <PageShell
      title="Modération des Témoignages"
      description="Approuver et gérer les témoignages soumis par les visiteurs"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex h-full flex-col"
      >
        <div className="mb-6 flex flex-shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Approuvés</TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
          </TabsList>
          <div className="text-muted-foreground text-sm">
            {memories?.length || 0} témoignage(s)
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="pending" className="mt-0">
            {renderMemories()}
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            {renderMemories()}
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            {renderMemories()}
          </TabsContent>
        </div>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer ce témoignage ?"
        description={`Êtes-vous sûr de vouloir supprimer le témoignage de "${selectedMemory?.name}" ? Cette action est irréversible.`}
        isLoading={deleteMemory.isPending}
      />
    </PageShell>
  );
}
