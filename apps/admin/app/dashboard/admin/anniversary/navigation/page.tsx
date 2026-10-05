"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AddButton } from "@/components/anniversary/ListPageHeaderAction";
import { NavigationCardDialog } from "@/components/anniversary/NavigationCardDialog";
import { NavigationCardItem } from "@/components/anniversary/NavigationCardItem";
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
  useDeleteNavigationCard,
  useNavigationCards,
  useUpdateNavigationCard,
} from "@/hooks/useAnniversaryNavigation";
import type { AnniversaryNavigationCard } from "@/types/anniversary";
import { nextOrder } from "@/utils/anniversary/reorder";
import { Compass } from "lucide-react";

const nameOf = (card: AnniversaryNavigationCard) => card.title;

export default function NavigationPage() {
  const {
    data: cards = [],
    isLoading,
    isError,
    refetch,
  } = useNavigationCards();
  const update = useUpdateNavigationCard();
  const remove = useDeleteNavigationCard();
  const list = useListActions<AnniversaryNavigationCard>({
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    nameOf,
    feminine: true,
  });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Cartes de navigation"
      description="Les cartes en haut de la page des 40 ans, qui emmènent le visiteur vers chacune de ses sections."
      headerAction={
        <AddButton label="Ajouter une carte" onClick={list.openCreate} />
      }
    >
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
            description="Une carte par section de la page (chronologie, vidéos, photos…) aide le visiteur à s'y retrouver."
            action={
              <AddButton label="Ajouter une carte" onClick={list.openCreate} />
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {countLine(cards, "carte", "cartes")}
        </p>
        <CampaignList
          items={cards}
          endpoint="/api/anniversary/navigation"
          queryKey={["anniversary", "navigation"]}
          nameOf={nameOf}
          renderItem={(card, reorder) => (
            <NavigationCardItem
              card={card}
              reorder={reorder}
              busy={list.busyId === card.id}
              onEdit={() => list.openEdit(card)}
              onToggleVisibility={() => list.toggleVisibility(card)}
              onDelete={() => list.askDelete(card)}
            />
          )}
        />
      </DataState>

      <NavigationCardDialog
        open={list.dialogOpen}
        onOpenChange={list.onDialogOpenChange}
        card={list.editing}
        nextOrder={nextOrder(cards)}
      />

      <DeleteConfirmDialog
        open={list.deleting !== null}
        onOpenChange={list.cancelDelete}
        onConfirm={list.confirmDelete}
        title={`Supprimer « ${list.deleting?.title ?? ""} » ?`}
        description="La carte disparaît de la page des 40 ans et d'ici. Cette action ne peut pas être annulée."
        isLoading={list.isDeleting}
      />
    </PageShell>
  );
}
