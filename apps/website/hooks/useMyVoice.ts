"use client";

import { useMyProfile } from "@/hooks/useMyProfile";

export type MyVoiceState =
  { status: "loading" } | { status: "ready"; voice: string | null };

/**
 * The signed-in member's voice from their profile (« Alte », « Orchestre &
 * Ténor »…), which colours the members area. Null when unknown: the pages
 * then show everything, in grey. Same read as useMyProfile.
 */
export function useMyVoice(): MyVoiceState {
  const profile = useMyProfile();
  return profile.status === "ready"
    ? { status: "ready", voice: profile.voice }
    : profile;
}
