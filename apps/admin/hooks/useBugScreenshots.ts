import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** How long a screenshot link works: long enough to read a report. */
const LINK_SECONDS = 60 * 60;

export interface BugScreenshot {
  path: string;
  url: string;
}

/**
 * Short-lived links to a report's screenshots, from the private bucket
 * `bug-screenshots` (only superadmins and the author may read them). A file
 * that can't be signed (deleted, no right) is left out.
 */
export function useBugScreenshots(paths: string[] | undefined) {
  const list = paths ?? [];
  return useQuery({
    queryKey: ["bug-screenshots", list],
    queryFn: async (): Promise<BugScreenshot[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("bug-screenshots")
        .createSignedUrls(list, LINK_SECONDS);
      if (error) throw error;
      return (data ?? []).flatMap((d) =>
        d.signedUrl && d.path ? [{ path: d.path, url: d.signedUrl }] : [],
      );
    },
    enabled: list.length > 0,
    // Refetch before the links expire.
    staleTime: (LINK_SECONDS - 5 * 60) * 1000,
  });
}
