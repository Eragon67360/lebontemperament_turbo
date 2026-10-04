"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { RehearsalDialog } from "@/components/season/RehearsalDialog";
import { RehearsalRow } from "@/components/season/RehearsalRow";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateRehearsal,
  useDeleteRehearsal,
  useRehearsals,
  useUpdateRehearsal,
} from "@/hooks/useRehearsals";
import type { RehearsalFormValues } from "@/utils/formSchemas";
import {
  formatLongDateFr,
  rehearsalCountLabel,
  splitRehearsals,
  todayIso,
  toRehearsalPayloads,
} from "@/utils/season/schedule";
import {
  GROUP_TYPES,
  type GroupType,
  type Rehearsal,
} from "@repo/domain/types/rehearsals";
import { Music, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Period = "upcoming" | "past";
type GroupFilter = GroupType | "all";

export default function RepetitionsPage() {
  const rehearsalsQuery = useRehearsals();
  const createRehearsal = useCreateRehearsal();
  const updateRehearsal = useUpdateRehearsal();
  const deleteRehearsal = useDeleteRehearsal();

  const [tab, setTab] = useState<Period>("upcoming");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [dialog, setDialog] = useState<{
    open: boolean;
    rehearsal: Rehearsal | null;
  }>({ open: false, rehearsal: null });
  const [deleting, setDeleting] = useState<Rehearsal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Today is read when the data changes, so a page left open overnight
  // stays consistent until it refetches (same as the concerts page).
  const rehearsals = useMemo(() => {
    const all = rehearsalsQuery.data ?? [];
    const filtered =
      group === "all" ? all : all.filter((r) => r.group_type === group);
    return splitRehearsals(filtered, todayIso());
  }, [rehearsalsQuery.data, group]);

  const save = async (values: RehearsalFormValues) => {
    const editing = dialog.rehearsal;
    const rows = toRehearsalPayloads(values);
    if (editing) {
      // One row: the edit form has no repeat.
      await updateRehearsal.mutateAsync({ id: editing.id, ...rows[0]! });
      toast.success(`« ${values.name} » enregistrée`);
    } else if (rows.length === 1) {
      await createRehearsal.mutateAsync(rows[0]!);
      toast.success(`« ${values.name} » ajoutée au calendrier`);
    } else {
      await createRehearsal.mutateAsync(rows);
      toast.success(
        `${rehearsalCountLabel(rows.length)} « ${values.name} » ajoutées au calendrier`,
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteRehearsal.mutateAsync(deleting.id);
      toast.success(`« ${deleting.name} » supprimée`);
      setDeleting(null);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => setDialog({ open: true, rehearsal: null });

  const renderPeriod = (key: Period) => {
    const rows = rehearsals[key];
    const past = key === "past";
    const heading = past ? "Répétitions passées" : "Répétitions à venir";
    return (
      <section aria-labelledby={`${key}-heading`} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`${key}-heading`} className="text-section">
            {heading}
          </h2>
          {rows.length > 0 && (
            <p className="text-note text-muted-foreground">
              {rehearsalCountLabel(rows.length)}
              {group !== "all" ? ` · ${group}` : ""}
            </p>
          )}
        </div>
        <DataState
          isLoading={rehearsalsQuery.isLoading}
          isError={rehearsalsQuery.isError}
          isEmpty={rows.length === 0}
          onRetry={() => rehearsalsQuery.refetch()}
          errorDescription="Les répétitions n'ont pas pu être chargées."
          skeleton={
            <ListSkeleton rows={4} label="Chargement des répétitions…" />
          }
          empty={
            <EmptyState
              icon={Music}
              title={
                group !== "all"
                  ? `Aucune répétition ${past ? "passée" : "à venir"} pour « ${group} »`
                  : past
                    ? "Aucune répétition passée"
                    : "Aucune répétition à venir"
              }
              description={
                group !== "all"
                  ? "Ce groupe n'a pas de séance ici ; les autres groupes en ont peut-être."
                  : past
                    ? "Les séances dont la date est passée apparaîtront ici, prêtes à être corrigées si besoin."
                    : "Le calendrier des membres est vide : ajoutez la prochaine séance, ou une série hebdomadaire en une fois."
              }
              className="py-6"
              action={
                group !== "all" ? (
                  <Button variant="outline" onClick={() => setGroup("all")}>
                    Voir tous les groupes
                  </Button>
                ) : past ? undefined : (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus aria-hidden />
                    Planifier une répétition
                  </Button>
                )
              }
            />
          }
        >
          <ul className="space-y-3">
            {rows.map((rehearsal) => (
              <li key={rehearsal.id} className="list-none">
                <RehearsalRow
                  rehearsal={rehearsal}
                  onEdit={() => setDialog({ open: true, rehearsal })}
                  onDelete={() => setDeleting(rehearsal)}
                />
              </li>
            ))}
          </ul>
        </DataState>
      </section>
    );
  };

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Répétitions"
      description="Les séances du calendrier des membres, sur le site et dans l'application. Les séances passées restent consultables et corrigeables."
      headerAction={
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Ajouter une répétition
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as Period)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList aria-label="Période">
            <TabsTrigger value="upcoming">À venir</TabsTrigger>
            <TabsTrigger value="past">Passées</TabsTrigger>
          </TabsList>
          <Select
            value={group}
            onValueChange={(value) => setGroup(value as GroupFilter)}
          >
            <SelectTrigger
              className="w-full sm:w-64"
              aria-label="Filtrer par groupe"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {GROUP_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TabsContent value="upcoming" className="mt-5">
          {renderPeriod("upcoming")}
        </TabsContent>
        <TabsContent value="past" className="mt-5">
          {renderPeriod("past")}
        </TabsContent>
      </Tabs>

      <RehearsalDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        rehearsal={dialog.rehearsal}
        onSubmit={save}
        isPending={createRehearsal.isPending || updateRehearsal.isPending}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.name ?? ""} » ?`}
        description={`La séance du ${
          deleting
            ? formatLongDateFr(deleting.date).toLocaleLowerCase("fr-FR")
            : ""
        } disparaît du calendrier des membres, sur le site et dans l'application. Cette action ne peut pas être annulée.`}
        isLoading={isDeleting}
      />
    </PageShell>
  );
}
