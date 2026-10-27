"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import { useEffect, useState } from "react";

/** What the members area shows from the signed-in member's own profile. */
export type MyProfile = {
  /** « Alte », « Orchestre & Ténor »…; null when unknown. */
  voice: string | null;
  /** The name the association knows them by (« Prénom NOM »); null when empty. */
  displayName: string | null;
};

export type MyProfileState =
  { status: "loading" } | ({ status: "ready" } & MyProfile);

const UNKNOWN: MyProfile = { voice: null, displayName: null };

// One read per signed-in user, shared by the header and the page.
const cache = new Map<string, Promise<MyProfile>>();

function readMyProfile(userId: string): Promise<MyProfile> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = loadBrowserClient()
      .then((supabase) =>
        supabase
          .from("profiles")
          .select("voice, display_name")
          .eq("id", userId)
          .single(),
      )
      .then(({ data }) => ({
        voice: data?.voice?.trim() || null,
        displayName: data?.display_name?.trim() || null,
      }))
      .catch(() => UNKNOWN);
    cache.set(userId, pending);
  }
  return pending;
}

/**
 * The signed-in member's voice and name, from their profile row. The name is
 * the one the administrators keep there, never the account's metadata (which
 * the account holder can change). Both are null when unknown: the pages then
 * show everything in grey, and no name.
 */
export function useMyProfile(): MyProfileState {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<({ userId: string } & MyProfile) | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    readMyProfile(userId).then((profile) => {
      if (!cancelled) setState({ userId, ...profile });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // No session at all (should not happen behind the members gate): nothing.
  if (!userId)
    return isLoading ? { status: "loading" } : { status: "ready", ...UNKNOWN };
  if (state?.userId !== userId) return { status: "loading" };
  return {
    status: "ready",
    voice: state.voice,
    displayName: state.displayName,
  };
}
