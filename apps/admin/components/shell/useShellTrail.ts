"use client";

import { useDriveIndex } from "@/hooks/useDriveIndex";
import { buildNavSections } from "@/lib/navigation";
import {
  buildTrail,
  groupSegmentFromPathname,
  programIdFromPathname,
  type TrailItem,
} from "@/lib/trail";
import { isLegacyProgramId } from "@/utils/drive/tree";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

/** The header's « Vous êtes ici » for the current route, programme and group names included. */
export function useShellTrail(): TrailItem[] {
  const pathname = usePathname();
  // Labels only, so include role-gated entries: the crumb for a page you are
  // already on should read the same as its nav entry.
  const sections = useMemo(() => buildNavSections({ isSuperAdmin: true }), []);
  const programId = programIdFromPathname(pathname);
  // A UUID is an old Storage programme (`programs`); anything else is a Drive
  // folder of the index, and so is its group segment.
  const legacy = !!programId && isLegacyProgramId(programId);
  const { data: legacyName } = useLegacyProgramName(
    legacy ? programId : undefined,
  );
  const driveIndex = useDriveIndex({ enabled: !!programId && !legacy });
  const groupId =
    programId && !legacy ? groupSegmentFromPathname(pathname) : undefined;

  const names = useMemo(() => {
    if (legacy) return { programName: legacyName, groupName: undefined };
    const nodes = driveIndex.data?.nodes;
    if (!nodes || !programId)
      return { programName: undefined, groupName: undefined };
    const nameOf = (id?: string) =>
      id
        ? (nodes.find((node) => node.drive_id === id)?.name ?? null)
        : undefined;
    return { programName: nameOf(programId), groupName: nameOf(groupId) };
  }, [legacy, legacyName, driveIndex.data, programId, groupId]);

  return useMemo(
    () =>
      buildTrail({
        pathname,
        sections,
        programId,
        programName: names.programName,
        groupId,
        groupName: names.groupName,
      }),
    [pathname, sections, programId, groupId, names],
  );
}

function useLegacyProgramName(programId?: string) {
  return useQuery({
    queryKey: ["program-name", programId],
    queryFn: async () => {
      const { data } = await createClient()
        .from("programs")
        .select("name")
        .eq("id", programId!)
        .single();

      return data?.name ?? null;
    },
    enabled: !!programId,
    staleTime: Infinity,
  });
}
