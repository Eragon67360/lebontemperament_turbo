"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { HeroStatDialog } from "@/components/anniversary/HeroStatDialog";
import { HeroStatItem } from "@/components/anniversary/HeroStatItem";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnniversaryHeroStats,
  useDeleteHeroStat,
} from "@/hooks/useAnniversaryHeroStats";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

export default function HeroStatsPage() {
  const { data: stats, isLoading } = useAnniversaryHeroStats();
  const deleteStat = useDeleteHeroStat();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<
    AnniversaryHeroStat | undefined
  >(undefined);

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
      setDeleteDialogOpen(false);
      setSelectedStat(undefined);
    } catch (error) {
      console.error("Error deleting hero stat:", error);
    }
  };

  const maxOrder =
    stats?.reduce((max, stat) => Math.max(max, stat.display_order), 0) || 0;

  return (
    <PageShell
      title="Statistiques Héro"
      description="Gérez les cartes de statistiques affichées dans la section héro de la page anniversaire"
      theme="anniversary"
      className="flex h-full flex-col px-4 py-8 sm:px-6 lg:px-8"
      fullHeight={true}
    >
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          {!isLoading && stats && (
            <p className="text-muted-foreground text-sm">
              {stats.length} statistique{stats.length !== 1 ? "s" : ""}{" "}
              {stats.length !== 1 ? "configurées" : "configurée"}
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setSelectedStat(undefined);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <FaPlus /> Ajouter
        </Button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !stats || stats.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <p className="text-muted-foreground">
                Aucune statistique configurée
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSelectedStat(undefined);
                  setDialogOpen(true);
                }}
                className="mt-2"
              >
                Ajouter la première statistique
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </div>

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
            ? `Êtes-vous sûr de vouloir supprimer la statistique "${selectedStat.number} ${selectedStat.label}" ? Cette action est irréversible.`
            : ""
        }
        isLoading={deleteStat.isPending}
      />
    </PageShell>
  );
}
