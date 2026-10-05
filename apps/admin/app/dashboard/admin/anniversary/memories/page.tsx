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
import type { AnniversaryMemory } from "@/types/anniversary";
import { MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type MemoryFilter = "pending" | "approved" | "all";

const EMPTY: Record<MemoryFilter, { title: string; description: string }> = {
  pending: {
    title: "Rien à relire",
    description:
      "Les souvenirs envoyés par les visiteurs arrivent ici ; ils ne sont publiés qu'après votre relecture.",
  },
  approved: {
    title: "Aucun témoignage publié",
    description:
      "Publiez un témoignage en attente pour qu'il apparaisse sur la page.",
  },
  all: {
    title: "Aucun témoignage reçu",
    description:
      "Dès qu'un visiteur partage un souvenir par le formulaire, il apparaît ici.",
  },
};

export default function MemoriesPage() {
  const [tab, setTab] = useState<MemoryFilter>("pending");
  const { data: memories = [], isLoading, isError, refetch } = useMemories(tab);
  const update = useUpdateMemory();
  const remove = useDeleteMemory();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AnniversaryMemory | null>(null);

  const change = async (
    memory: AnniversaryMemory,
    data: { is_approved?: boolean; is_featured?: boolean },
    done: string,
  ) => {
    setBusyId(memory.id);
    try {
      await update.mutateAsync({ id: memory.id, ...data });
      toast.success(done);
    } catch (error) {
      toast.error("Le changement n'a pas été enregistré", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`Témoignage de ${deleting.name} supprimé`);
      setDeleting(null);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const list = (
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
          title={EMPTY[tab].title}
          description={EMPTY[tab].description}
        />
      }
    >
      <ul className="space-y-3">
        {memories.map((memory) => (
          <li key={memory.id} className="list-none">
            <MemoryItem
              memory={memory}
              busy={busyId === memory.id}
              onPublish={() =>
                change(
                  memory,
                  { is_approved: true },
                  `Témoignage de ${memory.name} publié`,
                )
              }
              // Back to « En attente »: the same PATCH the approval uses,
              // with the feature flag cleared so it leaves the home too.
              onUnpublish={() =>
                change(
                  memory,
                  { is_approved: false, is_featured: false },
                  `Témoignage de ${memory.name} retiré de la publication`,
                )
              }
              onFeature={() =>
                change(
                  memory,
                  { is_featured: !memory.is_featured },
                  memory.is_featured
                    ? `Témoignage de ${memory.name} retiré de la une`
                    : `Témoignage de ${memory.name} mis à la une`,
                )
              }
              onDelete={() => setDeleting(memory)}
            />
          </li>
        ))}
      </ul>
    </DataState>
  );

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Modération"
      description="Relisez les souvenirs envoyés par les visiteurs : un témoignage n'apparaît sur la page qu'une fois publié."
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as MemoryFilter)}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            aria-label="Filtrer les témoignages"
            className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto"
          >
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Publiés</TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
          </TabsList>
          {!isLoading && !isError && (
            <p className="text-note text-muted-foreground">
              {memories.length} témoignage{memories.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <TabsContent value="pending" className="mt-0">
          {list}
        </TabsContent>
        <TabsContent value="approved" className="mt-0">
          {list}
        </TabsContent>
        <TabsContent value="all" className="mt-0">
          {list}
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer le témoignage de ${deleting?.name ?? ""} ?`}
        description="Le texte et l'adresse e-mail de la personne sont effacés définitivement. Pour le garder sans l'afficher, retirez-le plutôt de la publication."
        isLoading={remove.isPending}
      />
    </PageShell>
  );
}
