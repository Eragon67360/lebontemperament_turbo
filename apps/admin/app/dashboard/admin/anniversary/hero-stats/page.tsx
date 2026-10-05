"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { HeroStatDialog } from "@/components/anniversary/HeroStatDialog";
import { HeroStatItem } from "@/components/anniversary/HeroStatItem";
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
  useAnniversaryHeroStats,
  useDeleteHeroStat,
  useUpdateHeroStat,
} from "@/hooks/useAnniversaryHeroStats";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { BarChart3 } from "lucide-react";

const nameOf = (stat: AnniversaryHeroStat) => `${stat.number} ${stat.label}`;

export default function HeroStatsPage() {
  const {
    data: stats = [],
    isLoading,
    isError,
    refetch,
  } = useAnniversaryHeroStats();
  const update = useUpdateHeroStat();
  const remove = useDeleteHeroStat();
  const list = useListActions<AnniversaryHeroStat>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Chiffres clés"
      description="Les quelques chiffres affichés sous l'en-tête de la page des 40 ans, dans l'ordre ci-dessous."
      headerAction={
        <AddButton label="Ajouter un chiffre" onClick={list.openCreate} />
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={stats.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les chiffres clés n'ont pas pu être chargés."
        skeleton={
          <ListSkeleton rows={4} label="Chargement des chiffres clés…" />
        }
        empty={
          <EmptyState
            icon={BarChart3}
            title="Aucun chiffre clé"
            description="Trois ou quatre chiffres suffisent : les années, les concerts, les membres… Ils s'affichent sous l'en-tête de la page."
            action={
              <AddButton label="Ajouter un chiffre" onClick={list.openCreate} />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(stats, "chiffre", "chiffres")}
        </p>
        <CampaignList
          items={stats}
          endpoint="/api/anniversary/hero-stats"
          queryKey={["anniversary", "hero-stats"]}
          nameOf={nameOf}
          renderItem={(stat, reorder) => (
            <HeroStatItem
              stat={stat}
              reorder={reorder}
              busy={list.busyId === stat.id}
              onEdit={() => list.openEdit(stat)}
              onToggleVisibility={() => list.toggleVisibility(stat)}
              onDelete={() => list.askDelete(stat)}
            />
          )}
        />
      </DataState>

      <HeroStatDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        stat={list.editing}
        nextOrder={nextOrder(stats)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting ? nameOf(list.deleting) : ""} » ?`}
        description="Le chiffre disparaît de la page des 40 ans et d'ici. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
