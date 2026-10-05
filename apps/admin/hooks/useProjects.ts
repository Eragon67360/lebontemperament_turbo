import type { OrderWriter } from "@/hooks/useReorder";
import { Project } from "@repo/domain/types/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

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

/**
 * Writes one story's `display_order` through the existing
 * `PUT /api/projects/[id]`, for the generic reorder hook (one request per
 * changed row; partial failures are named by the hook).
 */
export const writeProjectOrder: OrderWriter = async ({ id, display_order }) => {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_order }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export type MigrationResult = {
  message: string;
  migrated: number;
  skipped: number;
  errors?: string[];
};

// One-off import of the former projects.json (existing slugs are skipped)
export function useMigrateProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/projects/migrate", { method: "POST" });
      const data = (await response.json()) as MigrationResult & {
        error?: string;
        details?: string;
      };
      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Le serveur n'a pas répondu.",
        );
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}
