"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import { useEffect, useState } from "react";

export type MyVoiceState =
  { status: "loading" } | { status: "ready"; voice: string | null };

// One read per signed-in user, shared by the header and the page.
const cache = new Map<string, Promise<string | null>>();

function readVoice(userId: string): Promise<string | null> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = loadBrowserClient()
      .then((supabase) =>
        supabase.from("profiles").select("voice").eq("id", userId).single(),
      )
      .then(({ data }) => data?.voice?.trim() || null)
      .catch(() => null);
    cache.set(userId, pending);
  }
  return pending;
}

/**
 * The signed-in member's voice from their profile (« Alte », « Orchestre &
 * Ténor »…), which colours the members area. Null when unknown: the pages
 * then show everything, in grey.
 */
export function useMyVoice(): MyVoiceState {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<{
    userId: string;
    voice: string | null;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    readVoice(userId).then((voice) => {
      if (!cancelled) setState({ userId, voice });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // No session at all (should not happen behind the members gate): no voice.
  if (!userId)
    return isLoading ? { status: "loading" } : { status: "ready", voice: null };
  if (state?.userId !== userId) return { status: "loading" };
  return { status: "ready", voice: state.voice };
}
