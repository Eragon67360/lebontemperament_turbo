import { NotInstalledError } from "@/hooks/useDocuments";
import type { Tables } from "@repo/domain/database.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type GeneralAssembly = Omit<
  Tables<"general_assemblies">,
  "created_by" | "updated_by" | "status"
> & { status: "draft" | "published" };

export type AssembliesData = {
  assemblies: GeneralAssembly[];
  canDelete: boolean;
};

export type AssemblyInput = Pick<
  GeneralAssembly,
  | "held_at"
  | "place"
  | "practical_note"
  | "reminders"
  | "voting_rights"
  | "agenda"
  | "afterwards"
  | "convocation_document_id"
  | "proxy_document_id"
  | "status"
>;

const KEY = ["general-assemblies"];

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

export function useAssemblies() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => send<AssembliesData>("/api/assemblies", "GET"),
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

export const useCreateAssembly = () =>
  useInvalidating((body: AssemblyInput) =>
    send<GeneralAssembly>("/api/assemblies", "POST", body),
  );

export const useUpdateAssembly = () =>
  useInvalidating(({ id, ...patch }: Partial<AssemblyInput> & { id: string }) =>
    send<GeneralAssembly>(`/api/assemblies/${id}`, "PATCH", patch),
  );

export const useDeleteAssembly = () =>
  useInvalidating((id: string) => send(`/api/assemblies/${id}`, "DELETE"));
