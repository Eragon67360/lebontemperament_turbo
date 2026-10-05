"use client";

import { loadBrowserClient, type BrowserClient } from "@/utils/supabase/lazy";
import { DRIVE_ROOT_SLUG, driveFolderUrl } from "@repo/domain/utils/drive";
import { useEffect, useState } from "react";

/**
 * URL of the "Accès direct au drive" folder, editable from the admin.
 * Returns null until it is known, so callers render nothing rather than a link
 * pointing at the wrong place.
 *
 * Only members can read `drive_folders`, so the query runs once a session
 * exists (at mount, or when the visitor signs in later): anonymous visitors
 * used to get a 406 and a console error on every public page. The callers
 * (the signed-in user menu, the members' landing page) only mount for
 * members, so loading supabase-js here costs visitors nothing.
 */
export function useDriveRootUrl() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const fetchRootFolder = async (supabase: BrowserClient) => {
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

    loadBrowserClient().then((supabase) => {
      if (!isMounted) return;

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (isMounted && session) fetchRootFolder(supabase);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) fetchRootFolder(supabase);
        if (event === "SIGNED_OUT") setUrl(null);
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return url;
}
