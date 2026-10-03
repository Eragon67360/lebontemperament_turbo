"use client";

import { createClient } from "@/utils/supabase/client";
import { DRIVE_ROOT_SLUG, driveFolderUrl } from "@repo/domain/utils/drive";
import { useEffect, useState } from "react";

/**
 * URL of the "Accès direct au drive" folder, editable from the admin.
 * Returns null until it is known, so callers render nothing rather than a link
 * pointing at the wrong place.
 *
 * Only members can read `drive_folders`, so the query runs once a session
 * exists (at mount, or when the visitor signs in later): anonymous visitors
 * used to get a 406 and a console error on every public page.
 */
export function useDriveRootUrl() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const fetchRootFolder = async () => {
      const { data, error } = await supabase
        .from("drive_folders")
        .select("folder_id")
        .eq("slug", DRIVE_ROOT_SLUG)
        .maybeSingle();
      if (!isMounted) return;
      if (error) {
        console.error("Error fetching drive root folder:", error);
        return;
      }
      if (data) setUrl(driveFolderUrl(data.folder_id));
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session) fetchRootFolder();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) fetchRootFolder();
      if (event === "SIGNED_OUT") setUrl(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return url;
}
