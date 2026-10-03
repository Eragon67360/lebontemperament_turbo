import { Project } from "@repo/domain/types/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Impossible de récupérer les projets");
  return response.json();
}

// Fetch projects, ordered by display_order
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

// One project by slug, derived from the cached list (the API has no slug lookup)
export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    select: (projects) => projects.find((p) => p.slug === slug) ?? null,
    enabled: !!slug,
  });
}

// display_order to give a new project: one past the current maximum
export function useNextProjectDisplayOrder() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    select: (projects) =>
      projects.length > 0
        ? Math.max(...projects.map((p) => p.display_order ?? 0)) + 1
        : 0,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }
      return response.json() as Promise<Project>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Project>;
    }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }
      return response.json() as Promise<Project>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Reorder projects mutation: takes the list in its new order, shows it at
// once and writes each display_order; a failure restores the previous order.
export function useReorderProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordered: Project[]) => {
      await Promise.all(
        ordered.map(async (project, index) => {
          const response = await fetch(`/api/projects/${project.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: index }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to reorder projects");
          }
        }),
      );
    },
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);
      queryClient.setQueryData<Project[]>(
        ["projects"],
        ordered.map((project, index) => ({ ...project, display_order: index })),
      );
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
