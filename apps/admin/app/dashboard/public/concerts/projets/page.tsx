"use client";

import { CampaignList } from "@/components/anniversary/CampaignList";
import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { PageShell } from "@/components/layouts/PageShell";
import {
  MigrateDialog,
  MigrationResultCallout,
} from "@/components/projects/MigrateDialog";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ProjectRow } from "@/components/projects/ProjectRow";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PROJECTS_QUERY_KEY,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
  writeProjectOrder,
  type MigrationResult,
} from "@/hooks/useProjects";
import { nextOrder } from "@/utils/anniversary/reorder";
import type { Project } from "@repo/domain/types/projects";
import { BookOpen, Download, MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const nameOf = (project: Project) => project.name;

/** The list with every order a number, as the reorder planner expects. */
function withOrder(projects: readonly Project[]) {
  return projects.map((project) => ({
    ...project,
    display_order: project.display_order ?? 0,
  }));
}

export default function StoriesPage() {
  const { data: projects = [], isPending, isError, refetch } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [dialog, setDialog] = useState<{ open: boolean; project?: Project }>({
    open: false,
  });
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migration, setMigration] = useState<MigrationResult | null>(null);

  const ordered = useMemo(() => withOrder(projects), [projects]);

  const save = async (data: Partial<Project>) => {
    if (dialog.project) {
      await updateProject.mutateAsync({ id: dialog.project.id, data });
      toast.success(`« ${data.name ?? dialog.project.name} » enregistrée`);
    } else {
      await createProject.mutateAsync(data);
      toast.success(`« ${data.name ?? "Histoire"} » ajoutée`);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteProject.mutateAsync(deleting.id);
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

  const openCreate = () => setDialog({ open: true });

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Histoires de concerts"
      description="Les pages des concerts passés sur le site public : un récit, des images et leurs crédits, dans l'ordre où vous les rangez ici."
      headerAction={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal aria-hidden />
                Plus
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setMigrateOpen(true)}>
                <Download aria-hidden />
                Importer l&apos;ancien fichier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Ajouter une histoire
          </Button>
        </>
      }
    >
      {migration && (
        <div className="mb-5">
          <MigrationResultCallout
            result={migration}
            onDismiss={() => setMigration(null)}
          />
        </div>
      )}

      <DataState
        isLoading={isPending}
        isError={isError}
        isEmpty={projects.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les histoires n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={4} label="Chargement des histoires…" />}
        empty={
          <EmptyState
            icon={BookOpen}
            title="Aucune histoire"
            description="Chaque concert passé peut avoir sa page : un récit, des images et leurs crédits. Les histoires du site d'avant l'administration s'importent depuis « Plus »."
            action={
              <Button variant="outline" onClick={openCreate}>
                <Plus aria-hidden />
                Écrire la première histoire
              </Button>
            }
          />
        }
      >
        <p className="text-note text-muted-foreground mb-3">
          {projects.length} histoire{projects.length > 1 ? "s" : ""}
        </p>
        <CampaignList
          items={ordered}
          write={writeProjectOrder}
          queryKey={PROJECTS_QUERY_KEY}
          nameOf={nameOf}
          renderItem={(project, reorder) => (
            <ProjectRow
              project={project}
              reorder={reorder}
              busy={false}
              onEdit={() => setDialog({ open: true, project })}
              onDelete={() => setDeleting(project)}
            />
          )}
        />
      </DataState>

      <ProjectDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        project={dialog.project}
        nextOrder={nextOrder(ordered)}
        onSubmit={save}
        isPending={createProject.isPending || updateProject.isPending}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.name ?? ""} » ?`}
        description="La page disparaît du site public et ses images sont effacées. Cette action ne peut pas être annulée."
        isLoading={isDeleting}
      />

      <MigrateDialog
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
        onResult={setMigration}
      />
    </PageShell>
  );
}
