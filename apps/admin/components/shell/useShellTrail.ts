"use client";

import { useDriveIndex } from "@/hooks/useDriveIndex";
import { useUsers } from "@/hooks/useUsers";
import { buildNavSections } from "@/lib/navigation";
import {
  buildTrail,
  groupSegmentFromPathname,
  memberIdFromPathname,
  programIdFromPathname,
  type TrailItem,
} from "@/lib/trail";
import { isLegacyProgramId } from "@/utils/drive/tree";
import { memberName as nameOfMember } from "@/utils/members/list";
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

  // A member page: the same list query as the page (shared cache).
  const memberId = memberIdFromPathname(pathname);
  const users = useUsers(undefined, { enabled: !!memberId });
  const memberName = useMemo(() => {
    if (!memberId || !users.data) return undefined;
    const found = users.data.find((user) => user.id === memberId);
    return found ? nameOfMember(found) : null;
  }, [memberId, users.data]);

  const names = useMemo(() => {
    if (legacy) return { programName: legacyName, groupName: undefined };
    const nodes = driveIndex.data?.nodes;
    if (!nodes || !programId)
      return { programName: undefined, groupName: undefined };
    // null once the index has loaded without the id: the crumb then reads
    // « Programme introuvable », like the page.
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
        memberId,
        memberName,
      }),
    [pathname, sections, programId, groupId, names, memberId, memberName],
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
