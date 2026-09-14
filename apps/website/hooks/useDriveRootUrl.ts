"use client";

import { createClient } from "@/utils/supabase/client";
import { DRIVE_ROOT_SLUG, driveFolderUrl } from "@repo/domain/utils/drive";
import { useEffect, useState } from "react";

/**
 * URL of the "Accès direct au drive" folder, editable from the admin.
 * Returns null until it is known, so callers render nothing rather than a link
 * pointing at the wrong place.
 */
export function useDriveRootUrl() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase
      .from("drive_folders")
      .select("folder_id")
      .eq("slug", DRIVE_ROOT_SLUG)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Error fetching drive root folder:", error);
          return;
        }
        setUrl(driveFolderUrl(data.folder_id));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return url;
}
