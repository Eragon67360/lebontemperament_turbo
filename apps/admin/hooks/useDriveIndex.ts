import type { SyncRunLike } from "@/utils/drive/format";
import type { DriveIndexNode, DriveRootFolder } from "@/utils/drive/tree";
import { useQuery } from "@tanstack/react-query";

export const DRIVE_INDEX_KEY = ["drive-index"] as const;

export interface DriveIndexResponse {
  nodes: DriveIndexNode[];
  /** True when the index has more rows than the route reads (never expected). */
  truncated: boolean;
  roots: DriveRootFolder[];
  /** The last applies (the runs that write the index), newest first. */
  applies: SyncRunLike[];
}

/**
 * The live Drive index, read once and shared by the three « Partitions et
 * documents » screens and the shell's trail; refreshed after a sync applies.
 */
export function useDriveIndex({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: DRIVE_INDEX_KEY,
    queryFn: async () => {
      const response = await fetch("/api/drive-index");
      if (!response.ok) throw new Error("Failed to fetch the Drive index");
      return response.json() as Promise<DriveIndexResponse>;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
