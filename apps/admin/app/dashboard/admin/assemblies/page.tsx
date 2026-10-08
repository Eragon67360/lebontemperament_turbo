"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AssemblyDialog } from "@/components/assemblies/AssemblyDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { DateBlock } from "@/components/ui/date-block";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  type AssemblyInput,
  type GeneralAssembly,
  useAssemblies,
  useCreateAssembly,
  useDeleteAssembly,
  useUpdateAssembly,
} from "@/hooks/useAssemblies";
import { NotInstalledError, useDocuments } from "@/hooks/useDocuments";
import { WEBSITE_URL } from "@/lib/website";
import {
  type AssemblyForm,
  formForNext,
  formFromAssembly,
} from "@/utils/assemblies/form";
import RouteNames from "@/utils/routes";
import {
  assemblyDateLabel,
  assemblyTitle,
  isAssemblyUpcoming,
} from "@repo/domain/utils/generalAssemblies";
import {
  ExternalLink,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Réessayez dans un instant.";

const PAGE_TITLE = "Assemblée générale";
const PAGE_DESCRIPTION =
  "La page /ag du site : date, lieu, convocation, procuration et rappels. Chaque année, préparez la prochaine à partir de la précédente.";

export default function AssembliesPage() {
  const { data, isLoading, isError, error, refetch } = useAssemblies();
  const documents = useDocuments();
  const createAssembly = useCreateAssembly();
  const updateAssembly = useUpdateAssembly();
  const deleteAssembly = useDeleteAssembly();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralAssembly | null>(null);
  const [initial, setInitial] = useState<AssemblyForm>(() => formForNext());
  const [deleting, setDeleting] = useState<GeneralAssembly | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const assemblies = useMemo(() => data?.assemblies ?? [], [data]);
  const canDelete = data?.canDelete ?? false;
  // What /ag shows: the newest published one.
  const online = assemblies.find((a) => a.status === "published");

  // PDFs of the « Assemblées générales » collection, newest first.
  const agDocuments = useMemo(() => {
    const collection = documents.data?.collections.find((c) => c.slug === "ag");
    if (!collection) return [];
    return (documents.data?.documents ?? [])
      .filter(
        (d) => d.collection_id === collection.id && d.status === "published",
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [documents.data]);
  const documentTitle = (id: string | null) =>
    id
      ? (documents.data?.documents.find((d) => d.id === id)?.title ??
        "PDF retiré")
      : null;

  const openNew = () => {
    setEditing(null);
    setInitial(formForNext(assemblies[0]));
    setDialogOpen(true);
  };
  const openEdit = (assembly: GeneralAssembly) => {
    setEditing(assembly);
    setInitial(formFromAssembly(assembly));
    setDialogOpen(true);
  };

  const handleSubmit = async (values: AssemblyInput) => {
    const title = assemblyTitle(values.held_at);
    try {
      if (editing) {
        await updateAssembly.mutateAsync({ id: editing.id, ...values });
        toast.success(`« ${title} » enregistrée`);
      } else {
        await createAssembly.mutateAsync(values);
        toast.success(
          values.status === "published"
            ? `« ${title} » publiée`
            : `« ${title} » créée en brouillon`,
        );
      }
    } catch (err) {
      toast.error("L'assemblée générale n'a pas pu être enregistrée", {
        description: errorText(err),
      });
      throw err;
    }
  };

  const setStatus = async (
    assembly: GeneralAssembly,
    status: "draft" | "published",
  ) => {
    const title = assemblyTitle(assembly.held_at);
    try {
      await updateAssembly.mutateAsync({ id: assembly.id, status });
      toast.success(
        status === "published"
          ? `« ${title} » publiée`
          : `« ${title} » repassée en brouillon`,
      );
    } catch (err) {
      toast.error("Le changement n'a pas pu être enregistré", {
        description: errorText(err),
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAssembly.mutateAsync(deleting.id);
      toast.success(`« ${assemblyTitle(deleting.held_at)} » supprimée`);
      setConfirmOpen(false);
    } catch (err) {
      toast.error("La suppression a échoué", { description: errorText(err) });
    }
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          Cette page attend une mise à jour de la base de données. En attendant,
          le site affiche l&apos;assemblée générale 2026.
        </Callout>
      </PageShell>
    );
  }

  const busy = updateAssembly.isPending || deleteAssembly.isPending;

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      headerAction={
        <Button
          className="w-full sm:w-auto"
          onClick={openNew}
          disabled={isLoading}
        >
          <Plus aria-hidden />
          Préparer la prochaine AG
        </Button>
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={assemblies.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les assemblées générales n'ont pas pu être chargées."
        skeleton={
          <ListSkeleton rows={2} label="Chargement des assemblées générales…" />
        }
        empty={
          <EmptyState
            icon={Landmark}
            title="Aucune assemblée générale"
            description="Préparez la prochaine : elle s'affichera sur la page /ag une fois publiée."
          />
        }
      >
        <ul className="space-y-3">
          {assemblies.map((assembly) => {
            const title = assemblyTitle(assembly.held_at);
            const isOnline = assembly.id === online?.id;
            const convocation = documentTitle(assembly.convocation_document_id);
            const proxy = documentTitle(assembly.proxy_document_id);
            return (
              <li key={assembly.id}>
                <Card className="flex items-start gap-4 p-4">
                  <DateBlock date={new Date(assembly.held_at)} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-body min-w-0 font-semibold break-words">
                          {title}
                        </h3>
                        {assembly.status === "draft" ? (
                          <StatusBadge tone="neutral">Brouillon</StatusBadge>
                        ) : isOnline ? (
                          <StatusBadge tone="success">Sur le site</StatusBadge>
                        ) : (
                          <StatusBadge tone="info">Publiée</StatusBadge>
                        )}
                        {isOnline && isAssemblyUpcoming(assembly.held_at) && (
                          <StatusBadge tone="accent">
                            Annoncée sur l&apos;accueil
                          </StatusBadge>
                        )}
                      </div>
                      <p className="text-note text-muted-foreground">
                        {assemblyDateLabel(assembly.held_at)} · {assembly.place}
                      </p>
                      <p className="text-note text-muted-foreground">
                        Convocation : {convocation ?? "pas encore"} ·
                        Procuration : {proxy ?? "pas encore"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(assembly)}
                        disabled={busy}
                      >
                        <Pencil aria-hidden />
                        Modifier
                        <span className="sr-only"> « {title} »</span>
                      </Button>
                      {isOnline && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`${WEBSITE_URL}/ag`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir la page
                            <span className="sr-only"> (nouvel onglet)</span>
                            <ExternalLink aria-hidden />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <RowActionsMenu
                    name={title}
                    subject="l'assemblée générale"
                    onDelete={
                      canDelete
                        ? () => {
                            setDeleting(assembly);
                            setConfirmOpen(true);
                          }
                        : undefined
                    }
                    disabled={busy}
                    className="-mt-1 -mr-1 shrink-0"
                  >
                    {assembly.status === "draft" ? (
                      <DropdownMenuItem
                        onSelect={() => setStatus(assembly, "published")}
                      >
                        <Send aria-hidden />
                        Publier
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onSelect={() => setStatus(assembly, "draft")}
                      >
                        <EyeOff aria-hidden />
                        Repasser en brouillon
                      </DropdownMenuItem>
                    )}
                  </RowActionsMenu>
                </Card>
              </li>
            );
          })}
        </ul>
        <p className="text-note text-muted-foreground mt-6">
          La convocation et la procuration se déposent d&apos;abord dans{" "}
          <Link
            href={RouteNames.DASHBOARD.ADMIN.DOCUMENTS}
            className="text-primary-text underline underline-offset-2"
          >
            Documents de l&apos;association
          </Link>{" "}
          (collection « Assemblées générales », visibilité « Public »).
        </p>
      </DataState>

      <AssemblyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isPending={createAssembly.isPending || updateAssembly.isPending}
        initial={initial}
        editing={Boolean(editing)}
        documents={agDocuments}
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !deleteAssembly.isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting ? assemblyTitle(deleting.held_at) : ""} » ?`}
        description="Elle disparaît pour de bon (le site affiche alors la précédente). Pour la retirer du site sans la perdre, repassez-la en brouillon."
        isLoading={deleteAssembly.isPending}
      />
    </PageShell>
  );
}
