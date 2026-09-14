"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { HeroStatDialog } from "@/components/anniversary/HeroStatDialog";
import { HeroStatItem } from "@/components/anniversary/HeroStatItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  useAnniversaryHeroStats,
  useDeleteHeroStat,
} from "@/hooks/useAnniversaryHeroStats";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import { BarChart3, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HeroStatsPage() {
  const {
    data: stats = [],
    isLoading,
    isError,
    refetch,
  } = useAnniversaryHeroStats();
  const deleteStat = useDeleteHeroStat();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<
    AnniversaryHeroStat | undefined
  >(undefined);

  const openCreateDialog = () => {
    setSelectedStat(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (stat: AnniversaryHeroStat) => {
    setSelectedStat(stat);
    setDialogOpen(true);
  };

  const handleDelete = (stat: AnniversaryHeroStat) => {
    setSelectedStat(stat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStat) return;

    try {
      await deleteStat.mutateAsync(selectedStat.id);
      toast.success("Statistique supprimée");
      setDeleteDialogOpen(false);
      setSelectedStat(undefined);
    } catch (error) {
      // A failed delete used to only reach the console: the dialog closed and
      // the row stayed, which reads as "it worked, then came back".
      toast.error("La suppression a échoué");
      console.error("Error deleting hero stat:", error);
    }
  };

  const maxOrder = stats.reduce(
    (max, stat) => Math.max(max, stat.display_order),
    0,
  );

  return (
    <PageShell
      title="Statistiques héro"
      description="Gérez les cartes de statistiques affichées dans la section héro de la page anniversaire"
      theme="anniversary"
      className="py-4 sm:py-6"
      headerAction={
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une statistique
        </Button>
      }
    >
      {!isLoading && !isError && (
        <p className="text-muted-foreground mb-4 text-sm">
          {stats.length} statistique{stats.length > 1 ? "s" : ""} configurée
          {stats.length > 1 ? "s" : ""}
        </p>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={stats.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les statistiques n'ont pas pu être chargées."
        skeleton={
          <ListSkeleton rows={4} label="Chargement des statistiques…" />
        }
        empty={
          <EmptyState
            icon={BarChart3}
            title="Aucune statistique"
            description="Mettez en avant quelques chiffres clés dans la section héro de la page anniversaire."
            action={
              <Button className="min-h-11" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une statistique
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {stats.map((stat) => (
            <HeroStatItem
              key={stat.id}
              stat={stat}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DataState>

      {/* Dialogs */}
      <HeroStatDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stat={selectedStat}
        maxOrder={maxOrder}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer cette statistique ?"
        description={
          selectedStat
            ? `Êtes-vous sûr de vouloir supprimer la statistique « ${selectedStat.number} ${selectedStat.label} » ? Cette action est irréversible.`
            : ""
        }
        isLoading={deleteStat.isPending}
      />
    </PageShell>
  );
}
