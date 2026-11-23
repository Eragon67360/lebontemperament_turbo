// « Groupes »: the list, one group's page and their changes (/api/groups).
// Before the migration the list throws NotInstalledError and the pages say
// so; the event dialog then leaves « Pour qui ? » out.
import { NotInstalledError } from "@/hooks/useDocuments";
import type { GroupDetail, GroupsData } from "@/utils/groups/types";
import type {
  GroupMemberRole,
  MemberGroup,
} from "@repo/domain/types/memberGroups";
import type { GroupInput, GroupPatch } from "@repo/domain/utils/memberGroups";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const GROUPS_KEY = ["groups"];
const groupKey = (id: string) => ["groups", id];

/** A refused write, with the field the server named (shown on that field). */
export class GroupApiError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

async function send<T>(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new Error("Le serveur n'a pas répondu. Vérifiez votre connexion.");
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    if (json?.notInstalled) throw new NotInstalledError(json.error);
    throw new GroupApiError(
      json?.error || `Erreur ${response.status}`,
      json?.field,
    );
  }
  return json as T;
}

const noRetryWhenMissing = (count: number, error: Error) =>
  !(error instanceof NotInstalledError) && count < 2;

/** Every group, archived ones included. */
export function useGroups(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: () => send<GroupsData>("/api/groups"),
    retry: noRetryWhenMissing,
    ...options,
  });
}

/** One group's page; idle without an id (the trail outside a group page). */
export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKey(id ?? ""),
    queryFn: () => send<GroupDetail>(`/api/groups/${encodeURIComponent(id!)}`),
    retry: noRetryWhenMissing,
    enabled: !!id,
  });
}

/** After any write: the list, the page and the events (their audience labels). */
function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: GROUPS_KEY }),
      queryClient.invalidateQueries({ queryKey: ["events"] }),
    ]);
}

export function useCreateGroup() {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (body: GroupInput) =>
      send<MemberGroup>("/api/groups", "POST", body),
    onSuccess: invalidate,
  });
}

export function useUpdateGroup(id: string) {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (body: GroupPatch) =>
      send<MemberGroup>(`/api/groups/${encodeURIComponent(id)}`, "PATCH", body),
    onSuccess: invalidate,
  });
}

const membersUrl = (id: string) =>
  `/api/groups/${encodeURIComponent(id)}/members`;

export function useAddGroupMembers(id: string) {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (body: { profile_ids: string[]; role?: GroupMemberRole }) =>
      send<{ added: number }>(membersUrl(id), "POST", body),
    onSuccess: invalidate,
  });
}

export function useUpdateGroupMember(id: string) {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (body: {
      profile_id: string;
      role?: GroupMemberRole;
      title?: string | null;
    }) => send<unknown>(membersUrl(id), "PATCH", body),
    onSuccess: invalidate,
  });
}

export function useRemoveGroupMember(id: string) {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (profileId: string) =>
      send<{ removed: number }>(membersUrl(id), "DELETE", {
        profile_id: profileId,
      }),
    onSuccess: invalidate,
  });
}
