"use client";

import { GroupCard } from "@/components/groups/GroupCard";
import { GroupDialog } from "@/components/groups/GroupDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { NotInstalledError } from "@/hooks/useDocuments";
import { useCreateGroup, useGroups } from "@/hooks/useGroups";
import { groupFormToBody, type GroupFormValues } from "@/utils/groups/form";
import {
  canManageGroups,
  filterByKind,
  KIND_FILTERS,
  splitGroups,
  type KindFilter,
} from "@/utils/groups/view";
import RouteNames from "@/utils/routes";
import { ChevronRight, Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_TITLE = "Groupes";
const PAGE_DESCRIPTION =
  "Le conseil d'administration, les commissions, les équipes : qui en fait partie, et les événements qui leur sont réservés. Seuls leurs membres voient ces événements et en reçoivent la notification.";

export default function GroupsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useGroups();
  const { data: profile } = useCurrentProfile();
  const manages = canManageGroups(profile?.role);
  const createGroup = useCreateGroup();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<KindFilter>("all");

  const { active, archived } = useMemo(
    () => splitGroups(data?.groups ?? []),
    [data],
  );
  // Only the tabs that hold a group; none at all when one kind covers them.
  const filters = useMemo(
    () =>
      KIND_FILTERS.filter(
        (f) => f.value === "all" || active.some((g) => g.kind === f.value),
      ),
    [active],
  );
  const shown = filterByKind(
    active,
    filters.some((f) => f.value === kind) ? kind : "all",
  );

  const create = async (values: GroupFormValues) => {
    const group = await createGroup.mutateAsync(groupFormToBody(values));
    toast.success(`« ${group.name} » créé : ajoutez-y ses membres`);
    router.push(RouteNames.DASHBOARD.ADMIN.GROUP(group.id));
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          {error.message}
        </Callout>
      </PageShell>
    );
  }

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      headerAction={
        manages ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            Nouveau groupe
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {!manages && profile && (
          <p className="text-detail text-muted-foreground">
            Vous ajoutez et retirez les membres des groupes ; les
            super-administrateurs les créent, les renomment et les archivent.
          </p>
        )}

        {filters.length > 2 && (
          <Tabs
            value={kind}
            onValueChange={(value) => setKind(value as KindFilter)}
          >
            <TabsList aria-label="Type de groupe">
              {filters.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <section aria-labelledby="groups-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="groups-heading" className="text-section">
              Groupes actifs
            </h2>
            {shown.length > 0 && (
              <p className="text-note text-muted-foreground">
                {shown.length} {shown.length === 1 ? "groupe" : "groupes"}
              </p>
            )}
          </div>
          <DataState
            isLoading={isLoading}
            isError={isError && !data}
            hasData={!!data}
            isEmpty={shown.length === 0}
            onRetry={() => refetch()}
            errorDescription="Les groupes n'ont pas pu être chargés."
            skeleton={
              <CardGridSkeleton cards={3} label="Chargement des groupes…" />
            }
            empty={
              <EmptyState
                icon={UsersRound}
                title="Aucun groupe actif"
                description={
                  manages
                    ? "Créez un groupe pour le CA, une commission ou une équipe, puis réservez-lui des événements."
                    : "Un super-administrateur crée les groupes ; vous pourrez ensuite y ajouter des membres."
                }
                className="py-6"
                action={
                  manages ? (
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus aria-hidden />
                      Nouveau groupe
                    </Button>
                  ) : undefined
                }
              />
            }
          >
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((group) => (
                <li key={group.id} className="list-none">
                  <GroupCard group={group} />
                </li>
              ))}
            </ul>
          </DataState>
        </section>

        {archived.length > 0 && (
          <details className="group">
            <summary className="text-primary-text hover:bg-accent flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md px-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                aria-hidden
              />
              {archived.length === 1
                ? "1 groupe archivé"
                : `${archived.length} groupes archivés`}
            </summary>
            <p className="text-detail text-muted-foreground mt-2 max-w-[64ch] px-2">
              Un groupe archivé ne se choisit plus pour un nouvel événement ;
              ses anciens événements restent réservés à ses membres.
            </p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archived.map((group) => (
                <li key={group.id} className="list-none">
                  <GroupCard group={group} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {manages && (
        <GroupDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={create}
          isPending={createGroup.isPending}
        />
      )}
    </PageShell>
  );
}
