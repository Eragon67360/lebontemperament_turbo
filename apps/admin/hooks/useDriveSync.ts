import type {
  DriveSyncMode,
  DriveSyncResult,
  DriveSyncRun,
} from "@/utils/driveSync";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DRIVE_SYNC_RUNS_KEY = ["drive-sync-runs"] as const;

/** The last 10 runs, newest first. */
export function useDriveSyncRuns() {
  return useQuery({
    queryKey: DRIVE_SYNC_RUNS_KEY,
    queryFn: async () => {
      const response = await fetch("/api/drive-sync");
      if (!response.ok) throw new Error("Failed to fetch drive sync runs");
      return response.json() as Promise<DriveSyncRun[]>;
    },
  });
}

/** Runs a dry run or an apply; either way the runs list is refreshed. */
export function useRunDriveSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: DriveSyncMode): Promise<DriveSyncResult> => {
      const response = await fetch("/api/drive-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const body = (await response.json().catch(() => null)) as
        DriveSyncResult | { error?: string } | null;
      if (!response.ok || !body || !("ok" in body) || body.ok !== true) {
        const message =
          body && "error" in body && typeof body.error === "string"
            ? body.error
            : "La synchronisation a échoué";
        throw new Error(message);
      }
      return body;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_SYNC_RUNS_KEY });
    },
  });
}
