"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { ProjectModal } from "@/components/modals/project-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project } from "@repo/domain/types/projects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MIGRATE_HREF = "/dashboard/public/concerts/projets/migrate";

// --- Sortable Item Wrapper ---

const SortableProjectItem = ({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <ProjectCard
        project={project}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

// --- Project Card Component ---

const ProjectCard = ({
  project,
  dragHandleProps,
  onEdit,
  onDelete,
}: {
  project: Project;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) => {
  const dateObj = project.date ? new Date(project.date) : null;
  const imageCount = [project.banniere, project.image2, project.image3].filter(
    Boolean,
  ).length;
  const textCount = [project.text1, project.text2].filter(Boolean).length;

  return (
    <Card className="bg-card text-card-foreground hover:border-primary/50 relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md motion-reduce:transition-none">
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Date/Icon Tile */}
          {dateObj ? (
            <div className="bg-primary/10 text-primary flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs font-bold tracking-wider uppercase">
                {format(dateObj, "MMM", { locale: fr })}
              </span>
              <span className="text-2xl leading-none font-black">
                {format(dateObj, "yyyy")}
              </span>
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
              <FolderOpen className="h-6 w-6" aria-hidden />
              <span className="sr-only">Sans date</span>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 min-w-0 text-base leading-tight font-bold tracking-tight sm:text-lg">
                {project.name}
              </h3>
              {/* Drag Handle */}
              <button
                type="button"
                {...dragHandleProps}
                className="text-muted-foreground hover:text-foreground flex size-11 shrink-0 cursor-grab items-center justify-center transition-colors duration-150 ease-out active:cursor-grabbing motion-reduce:transition-none"
              >
                <GripVertical className="h-5 w-5" aria-hidden />
                <span className="sr-only">
                  Déplacer « {project.name} » dans la liste
                </span>
              </button>
            </div>
            {project.sub_name && (
              <p className="text-muted-foreground truncate text-sm font-medium">
                {project.sub_name}
              </p>
            )}
            <div className="pt-1">
              <Badge variant="outline" className="text-[10px] font-normal">
                Ordre : {project.display_order}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="mt-4 flex-1">
          {project.explanation ? (
            <p className="text-muted-foreground/80 line-clamp-3 text-sm">
              {project.explanation}
            </p>
          ) : (
            <p className="text-muted-foreground/60 text-sm italic">
              Aucune description
            </p>
          )}
        </div>

        {/* Assets Indicators */}
        {(imageCount > 0 || textCount > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed pt-3">
            {imageCount > 0 && (
              <span className="bg-secondary/50 text-secondary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                <ImageIcon className="h-3 w-3" aria-hidden />
                {imageCount} image{imageCount > 1 ? "s" : ""}
              </span>
            )}
            {textCount > 0 && (
              <span className="bg-secondary/50 text-secondary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                <FileText className="h-3 w-3" aria-hidden />
                {textCount} bloc{textCount > 1 ? "s" : ""} de texte
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-muted/20 flex items-center justify-between gap-2 border-t px-2 py-2 sm:px-4">
        <Button
          variant="ghost"
          className="text-primary hover:bg-primary/10 hover:text-primary min-h-11 min-w-0 gap-1 text-xs font-medium"
          asChild
        >
          <Link
            href={`/dashboard/public/concerts/projets/preview/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            <span className="truncate">Prévisualiser</span>
            <span className="sr-only">(nouvel onglet)</span>
          </Link>
        </Button>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary size-11"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="sr-only">Modifier « {project.name} »</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-11"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Supprimer « {project.name} »</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

// --- Main Page Component ---

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid triggering drag on small clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Impossible de récupérer les projets");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProject(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      const response = await fetch(`/api/projects/${projectToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Échec de la suppression");
      toast.success("Projet supprimé avec succès");
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer le projet");
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleSubmit = async (data: Partial<Project>) => {
    try {
      const isUpdate = !!selectedProject;
      const url = isUpdate
        ? `/api/projects/${selectedProject.id}`
        : "/api/projects";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Échec de l'opération`);

      toast.success(
        isUpdate ? "Projet mis à jour avec succès" : "Projet créé avec succès",
      );
      fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'enregistrement");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(newProjects);

    // Optimistic UI update done, now sync with server
    try {
      const updates = newProjects.map((project, index) => ({
        id: project.id,
        display_order: index,
      }));

      await Promise.all(
        updates.map((u) =>
          fetch(`/api/projects/${u.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: u.display_order }),
          }),
        ),
      );
      toast.success("Ordre mis à jour");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de synchronisation de l'ordre");
      fetchProjects(); // Revert on error
    }
  };

  return (
    <PageShell
      theme="public"
      className="py-4 sm:py-6"
      title="Projets"
      description="Gérez vos projets artistiques et concerts passés. Créez, modifiez et organisez vos contenus."
      headerAction={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            asChild
            className="min-h-11 w-full sm:w-auto"
          >
            <Link href={MIGRATE_HREF}>
              <Database className="h-4 w-4" aria-hidden />
              Migrer JSON
            </Link>
          </Button>
          <Button onClick={handleCreate} className="min-h-11 w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Nouveau projet
          </Button>
        </div>
      }
    >
      <DataState
        isLoading={loading}
        isError={!!error}
        isEmpty={projects.length === 0}
        onRetry={fetchProjects}
        errorDescription={error ?? "Les projets n'ont pas pu être chargés."}
        skeleton={
          <CardGridSkeleton cards={6} label="Chargement des projets…" />
        }
        empty={
          <EmptyState
            icon={FolderOpen}
            title="Aucun projet"
            description="Votre portfolio est vide. Créez votre premier projet ou importez vos données existantes."
            action={
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  asChild
                  className="min-h-11 w-full sm:w-auto"
                >
                  <Link href={MIGRATE_HREF}>
                    <Database className="h-4 w-4" aria-hidden />
                    Migrer JSON
                  </Link>
                </Button>
                <Button
                  onClick={handleCreate}
                  className="min-h-11 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Nouveau projet
                </Button>
              </div>
            }
          />
        }
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </DataState>

      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce
              projet seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 min-h-11 text-white"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
