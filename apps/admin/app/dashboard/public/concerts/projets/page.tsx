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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Project } from "@/types/projects";
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

// --- Utility Components ---

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[280px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

const EmptyState = ({
  onCreate,
  onMigrate,
}: {
  onCreate: () => void;
  onMigrate: () => void;
}) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-primary/5 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <FolderOpen className="text-primary/40 h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">Aucun projet</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Votre portfolio est vide. Créez votre premier projet ou importez vos
        données existantes.
      </p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button variant="outline" onClick={onMigrate} className="gap-2">
        <Database className="h-4 w-4" />
        Migrer JSON
      </Button>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Nouveau projet
      </Button>
    </div>
  </div>
);

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

  return (
    <Card className="group bg-card text-card-foreground hover:border-primary/50 relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          {/* Date/Icon Tile */}
          {dateObj ? (
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex flex-col items-center justify-center rounded-xl px-3 py-2 shadow-sm transition-colors duration-300">
              <span className="text-xs font-bold tracking-wider uppercase">
                {format(dateObj, "MMM", { locale: fr })}
              </span>
              <span className="text-2xl leading-none font-black">
                {format(dateObj, "yyyy")}
              </span>
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-xl">
              <FolderOpen className="h-6 w-6" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-lg leading-tight font-bold tracking-tight">
                {project.name}
              </h3>
              {/* Drag Handle */}
              <button
                {...dragHandleProps}
                className="text-muted-foreground/30 hover:text-foreground cursor-grab transition-colors active:cursor-grabbing"
                title="Déplacer"
              >
                <GripVertical className="h-5 w-5" />
              </button>
            </div>
            {project.sub_name && (
              <p className="text-muted-foreground text-sm font-medium">
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
            <p className="text-muted-foreground/40 text-sm italic">
              Aucune description...
            </p>
          )}
        </div>

        {/* Assets Indicators */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed pt-3">
          {(project.banniere || project.image2 || project.image3) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-secondary/50 text-secondary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                    <ImageIcon className="h-3 w-3" />
                    <span>
                      {
                        [
                          project.banniere,
                          project.image2,
                          project.image3,
                        ].filter(Boolean).length
                      }
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Images associées</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {(project.text1 || project.text2) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-secondary/50 text-secondary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                    <FileText className="h-3 w-3" />
                    <span>
                      {[project.text1, project.text2].filter(Boolean).length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Blocs de texte</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-muted/20 flex items-center justify-between border-t px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-primary/10 hover:text-primary h-8 gap-1 text-xs font-medium"
          asChild
        >
          <Link
            href={`/dashboard/public/concerts/projets/preview/${project.slug}`}
            target="_blank"
          >
            <ExternalLink className="h-3 w-3" />
            Prévisualiser
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary h-8 w-8"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4" />
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
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Impossible de récupérer les projets");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      toast.error("Échec de la récupération des projets");
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
      fullHeight
      theme="public"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Projets"
      description="Gérez vos projets artistiques et concerts passés. Créez, modifiez et organisez vos contenus."
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/dashboard/public/concerts/projets/migrate">
              <Database className="mr-2 h-4 w-4" />
              Migrer JSON
            </Link>
          </Button>
          <Button
            onClick={handleCreate}
            className="shadow-md transition-all hover:shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nouveau Projet</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      }
    >
      <ScrollArea className="h-full w-full pr-4">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={fetchProjects} variant="outline">
              Réessayer
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            onCreate={handleCreate}
            onMigrate={() =>
              (window.location.href =
                "/dashboard/public/concerts/projets/migrate")
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 px-1 pt-2 pb-12 md:grid-cols-2 xl:grid-cols-3">
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
        )}
      </ScrollArea>

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
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
