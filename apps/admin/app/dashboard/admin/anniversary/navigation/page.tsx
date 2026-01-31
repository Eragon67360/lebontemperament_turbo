"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { NavigationCardDialog } from "@/components/anniversary/NavigationCardDialog";
import { NavigationCardItem } from "@/components/anniversary/NavigationCardItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteNavigationCard,
  useNavigationCards,
} from "@/hooks/useAnniversaryNavigation";
import { AnniversaryNavigationCard } from "@/types/anniversary";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NavigationPage() {
  const { data: cards, isLoading } = useNavigationCards();
  const deleteCard = useDeleteNavigationCard();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<AnniversaryNavigationCard | null>(null);

  const handleEdit = (card: AnniversaryNavigationCard) => {
    setSelectedCard(card);
    setDialogOpen(true);
  };

  const handleDelete = (card: AnniversaryNavigationCard) => {
    setSelectedCard(card);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCard) return;

    try {
      await deleteCard.mutateAsync(selectedCard.id);
      toast.success("Carte supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedCard(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Delete error:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedCard(null);
    }
  };

  if (isLoading) {
    return (
      <PageShell
        title="Cartes de Navigation"
        description="Gérer les cartes de navigation vers les différentes sections"
        theme="anniversary"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageShell>
    );
  }

  const maxOrder =
    cards?.reduce((max, card) => Math.max(max, card.display_order), 0) || 0;

  return (
    <PageShell
      title="Cartes de Navigation"
      description="Gérer les cartes de navigation vers les différentes sections"
      theme="anniversary"
      fullHeight={true}
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {cards?.length || 0} carte(s) de navigation
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une carte
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {cards && cards.length > 0 ? (
          <div className="space-y-4 pb-4">
            {cards.map((card) => (
              <NavigationCardItem
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-muted/50 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucune carte de navigation. Cliquez sur "Ajouter une carte" pour
              commencer.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <NavigationCardDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        card={selectedCard || undefined}
        maxOrder={maxOrder}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette carte ?"
        description={`Êtes-vous sûr de vouloir supprimer la carte "${selectedCard?.title}" ? Cette action est irréversible.`}
        isLoading={deleteCard.isPending}
      />
    </PageShell>
  );
}
