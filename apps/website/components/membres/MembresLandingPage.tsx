"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useMemberDirectory } from "@/hooks/useMemberDirectory";
import { useMemberRehearsals } from "@/hooks/useMemberRehearsals";
import { useMyVoice } from "@/hooks/useMyVoice";
import { getFirstName } from "@/lib/membres/names";
import { upcomingRehearsals } from "@/lib/membres/rehearsals";
import {
  groupsForVoice,
  mainVoice,
  scoreFolderFor,
  voicesLabel,
} from "@/lib/membres/voices";
import { AppPromoCard } from "./AppPromoCard";
import { HomeDesk } from "./HomeDesk";
import { HomeHero } from "./HomeHero";
import { HomeLater } from "./HomeLater";
import { HomeTiles } from "./HomeTiles";

/**
 * The members home, « Les Pupitres »: everything starts from the member's
 * voice. Their colour and next rehearsal, the ones after it (their groups
 * only, as in the app), their section, then the ways in.
 */
export const MembresLandingPage = () => {
  const { user } = useAuth();
  const firstName = getFirstName(
    user?.user_metadata?.display_name || user?.user_metadata?.name,
  );
  const myVoice = useMyVoice();
  const rehearsalsState = useMemberRehearsals();
  const directory = useMemberDirectory();

  const rawVoice = myVoice.status === "ready" ? myVoice.voice : null;
  const voice = mainVoice(rawVoice);
  const groups = groupsForVoice(rawVoice);

  const mine =
    rehearsalsState.status === "ready" && myVoice.status === "ready"
      ? upcomingRehearsals(rehearsalsState.rehearsals).filter(
          (rehearsal) => groups === null || groups.has(rehearsal.group_type),
        )
      : [];
  const [next, ...later] = mine;

  const heroRehearsals =
    rehearsalsState.status === "error"
      ? ({ status: "error" } as const)
      : rehearsalsState.status === "ready" && myVoice.status === "ready"
        ? ({ status: "ready", next: next ?? null } as const)
        : ({ status: "loading" } as const);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <HomeHero
        firstName={firstName}
        voice={voice}
        voiceLabel={voicesLabel(rawVoice)}
        rehearsals={heroRehearsals}
      />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {heroRehearsals.status === "ready" && next ? (
          <HomeLater
            voice={voice}
            rehearsals={later.slice(0, 3)}
            personal={groups !== null}
          />
        ) : null}
        <HomeDesk
          voice={voice === "jeune" ? null : voice}
          directory={directory}
        />
      </div>
      <HomeTiles scoreFolder={scoreFolderFor(rawVoice)} />
      <AppPromoCard />
    </div>
  );
};
