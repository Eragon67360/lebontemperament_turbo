"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { NavigationCardDialog } from "@/components/anniversary/NavigationCardDialog";
import { NavigationCardItem } from "@/components/anniversary/NavigationCardItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useDeleteNavigationCard,
  useNavigationCards,
} from "@/hooks/useAnniversaryNavigation";
import { AnniversaryNavigationCard } from "@/types/anniversary";
import { Compass, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NavigationPage() {
  const {
    data: cards = [],
    isLoading,
    isError,
    refetch,
  } = useNavigationCards();
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

  const maxOrder = cards.reduce(
    (max, card) => Math.max(max, card.display_order),
    0,
  );

  return (
    <PageShell
      title="Cartes de navigation"
      description="Gérer les cartes de navigation vers les différentes sections"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une carte
        </Button>
      }
    >
      {!isLoading && !isError && (
        <p className="text-muted-foreground mb-4 text-sm">
          {cards.length} carte{cards.length > 1 ? "s" : ""} de navigation
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={cards.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les cartes de navigation n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={4} label="Chargement des cartes…" />}
        empty={
          <EmptyState
            icon={Compass}
            title="Aucune carte de navigation"
            description="Ajoutez une carte pour guider les visiteurs vers les sections de la page anniversaire."
            action={
              <Button className="min-h-11" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une carte
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {cards.map((card) => (
            <NavigationCardItem
              key={card.id}
              card={card}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

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
        description={`Êtes-vous sûr de vouloir supprimer la carte « ${selectedCard?.title} » ? Cette action est irréversible.`}
        isLoading={deleteCard.isPending}
      />
    </PageShell>
  );
}
