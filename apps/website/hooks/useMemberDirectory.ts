"use client";

import type { Member } from "@/lib/membres/directory";
import { useEffect, useState } from "react";

export type MemberDirectoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; members: Member[] };

/** The members of `/api/membres` (name, e-mail, voice, photo), cleaned up. */
export function useMemberDirectory(): MemberDirectoryState {
  const [state, setState] = useState<MemberDirectoryState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/membres")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch members");
        const members: unknown = await response.json();
        if (!Array.isArray(members)) throw new Error("Not a list");
        // Filter out empty rows and normalize data
        const validData: Member[] = (members as Member[])
          .filter((member) => member["NOM Prénom"]?.trim())
          .map((member) => ({
            "NOM Prénom": member["NOM Prénom"]?.trim() || "",
            "Adresse mail": member["Adresse mail"]?.trim() || "",
            Voix: member.Voix?.trim() || "",
            photoUrl: member.photoUrl,
          }));
        if (!cancelled) setState({ status: "ready", members: validData });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
