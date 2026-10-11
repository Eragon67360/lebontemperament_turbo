"use client";

import type { MemberRehearsal } from "@/lib/publicConcerts";
import { useEffect, useState } from "react";

export type MemberRehearsalsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rehearsals: MemberRehearsal[] };

/** The rehearsals of `/api/rehearsals`, shared by the home page and the calendar. */
export function useMemberRehearsals(): MemberRehearsalsState {
  const [state, setState] = useState<MemberRehearsalsState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rehearsals")
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Not a list");
        if (!cancelled) {
          setState({
            status: "ready",
            rehearsals: data as MemberRehearsal[],
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching rehearsals:", error);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
