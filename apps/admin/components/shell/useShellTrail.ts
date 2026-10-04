"use client";

import { buildNavSections } from "@/lib/navigation";
import { buildTrail, programIdFromPathname, type TrailItem } from "@/lib/trail";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

/** The header's « Vous êtes ici » for the current route, programme name included. */
export function useShellTrail(): TrailItem[] {
  const pathname = usePathname();
  // Labels only, so include role-gated entries: the crumb for a page you are
  // already on should read the same as its nav entry.
  const sections = useMemo(() => buildNavSections({ isSuperAdmin: true }), []);
  const programId = programIdFromPathname(pathname);
  const { data: programName } = useProgramName(programId);

  return useMemo(
    () => buildTrail({ pathname, sections, programId, programName }),
    [pathname, sections, programId, programName],
  );
}

function useProgramName(programId?: string) {
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
