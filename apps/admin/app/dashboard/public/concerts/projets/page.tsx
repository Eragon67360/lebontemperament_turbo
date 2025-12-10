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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Database,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Music2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const loadingMessages = [
  "Chargement des projets... 🎵",
  "Préparation des contenus... 📝",
  "Organisation des données... 🎭",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      if (selectedProject) {
        // Update
        const response = await fetch(`/api/projects/${selectedProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Échec de la mise à jour");

        toast.success("Projet mis à jour avec succès");
      } else {
        // Create
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Échec de la création");

        toast.success("Projet créé avec succès");
      }

      fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        selectedProject
          ? "Impossible de mettre à jour le projet"
          : "Impossible de créer le projet",
      );
      throw err;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newProjects = arrayMove(projects, oldIndex, newIndex);
    setProjects(newProjects);

    // Update display_order for all affected projects
    try {
      const updates = newProjects.map((project: Project, index: number) => ({
        id: project.id,
        display_order: index,
      }));

      const updatePromises = updates.map(
        (update: { id: string; display_order: number }) =>
          fetch(`/api/projects/${update.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: update.display_order }),
          }),
      );

      await Promise.all(updatePromises);
      toast.success("Ordre des projets mis à jour");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour de l'ordre");
      // Revert on error
      fetchProjects();
    }
  };

  // Loading State Component
  const LoadingState = () => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
      const intervalId = setInterval(() => {
        setLoadingMessage(
          loadingMessages[Math.floor(Math.random() * loadingMessages.length)],
        );
      }, 2000);

      return () => clearInterval(intervalId);
    }, []);

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Music2 className="text-primary/50 mx-auto h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground text-sm">
            {loadingMessage || loadingMessages[0]}
          </p>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
      <div className="space-y-4 text-center">
        <FileText className="text-primary/30 mx-auto h-16 w-16" />
        <h2 className="text-xl font-medium">Aucun projet</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Commencez par créer votre premier projet ou migrez les projets
          existants depuis le fichier JSON
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/public/concerts/projets/migrate">
            <Database className="mr-2 h-4 w-4" />
            Migrer depuis JSON
          </Link>
        </Button>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un projet
        </Button>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="space-y-2 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={fetchProjects} variant="outline">
          Réessayer
        </Button>
      </div>
    </div>
  );

  const SortableProjectCard = ({ project }: { project: Project }) => {
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
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <ProjectCard
          project={project}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  };

  const ProjectCard = ({
    project,
    dragHandleProps,
  }: {
    project: Project;
    dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  }) => (
    <div className="border-border/50 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-black">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {dragHandleProps && (
              <button
                {...dragHandleProps}
                className="text-muted-foreground hover:text-foreground mb-2 cursor-grab active:cursor-grabbing"
                type="button"
              >
                <GripVertical className="h-5 w-5" />
              </button>
            )}
            <div>
              <h3 className="text-xl font-medium tracking-tight">
                {project.name}
              </h3>
              {project.sub_name && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {project.sub_name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {project.date && (
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.date), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </Badge>
              )}
              <Badge variant="outline">Ordre: {project.display_order}</Badge>
            </div>
          </div>
          <div className="ml-4 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => handleEdit(project)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive rounded-full"
              onClick={() => handleDeleteClick(project.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {project.explanation && (
          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
            {project.explanation}
          </p>
        )}

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {project.banniere && (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>Bannière</span>
            </div>
          )}
          {project.image2 && (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>Image 2</span>
            </div>
          )}
          {project.image3 && (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>Image 3</span>
            </div>
          )}
          {project.text1 && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Texte 1</span>
            </div>
          )}
          {project.text2 && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Texte 2</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t pt-4">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link
              href={`/dashboard/public/concerts/projets/preview/${project.slug}`}
              target="_blank"
            >
              <Eye className="mr-2 h-4 w-4" />
              Prévisualiser
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(project)}
            className="flex-1"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell
      fullHeight
      theme="public"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Projets"
      description="Gérez vos projets artistiques et concerts passés. Créez, modifiez et organisez vos contenus."
      headerAction={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <Link href="/dashboard/public/concerts/projets/migrate">
              <Database className="mr-2 h-4 w-4" />
              Migrer depuis JSON
            </Link>
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un projet
          </Button>
        </div>
      }
    >
      <ScrollArea className="pr-4">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {projects.map((project) => (
                  <SortableProjectCard key={project.id} project={project} />
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
