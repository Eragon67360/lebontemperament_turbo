import { NotInstalledError } from "@/hooks/useDocuments";
import type { Tables } from "@repo/domain/database.types";
import type { AnnouncementPlacement } from "@repo/domain/utils/announcements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type SiteAnnouncement = Omit<
  Tables<"site_announcements">,
  "created_by" | "updated_by" | "status" | "placement"
> & {
  placement: AnnouncementPlacement;
  status: "draft" | "published" | "archived";
};

export type AnnouncementsData = {
  announcements: SiteAnnouncement[];
  canDelete: boolean;
};

export type AnnouncementInput = Pick<
  SiteAnnouncement,
  | "placement"
  | "title"
  | "body"
  | "link_label"
  | "link_url"
  | "starts_on"
  | "ends_on"
  | "status"
>;

const KEY = ["site-announcements"];

async function send<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (json?.notInstalled) throw new NotInstalledError(json.error);
    throw new Error(json?.error || `Erreur ${response.status}`);
  }
  return json as T;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => send<AnnouncementsData>("/api/announcements", "GET"),
    retry: (count, error) => !(error instanceof NotInstalledError) && count < 2,
  });
}

function useInvalidating<V, R>(fn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useCreateAnnouncement = () =>
  useInvalidating((body: AnnouncementInput) =>
    send<SiteAnnouncement>("/api/announcements", "POST", body),
  );

export const useUpdateAnnouncement = () =>
  useInvalidating(
    ({ id, ...patch }: Partial<AnnouncementInput> & { id: string }) =>
      send<SiteAnnouncement>(`/api/announcements/${id}`, "PATCH", patch),
  );

export const useDeleteAnnouncement = () =>
  useInvalidating((id: string) => send(`/api/announcements/${id}`, "DELETE"));
