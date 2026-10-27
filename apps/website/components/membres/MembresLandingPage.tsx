"use client";

import { useMemberDirectory } from "@/hooks/useMemberDirectory";
import { useMemberRehearsals } from "@/hooks/useMemberRehearsals";
import { useMyProfile } from "@/hooks/useMyProfile";
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
import { HomeOrder } from "./HomeOrder";
import { HomeTiles } from "./HomeTiles";

/**
 * The members home, « Les Pupitres »: everything starts from the member's
 * voice. Their colour and next rehearsal, the ones after it (their groups
 * only, as in the app), their section, then the ways in. An order still to
 * come (« Ta commande ») shows under the voice block.
 */
export const MembresLandingPage = () => {
  // Voice and name from the member's profile, not the account's metadata.
  const me = useMyProfile();
  const firstName = getFirstName(me.status === "ready" ? me.displayName : null);
  const rehearsalsState = useMemberRehearsals();
  const directory = useMemberDirectory();

  const rawVoice = me.status === "ready" ? me.voice : null;
  const voice = mainVoice(rawVoice);
  const groups = groupsForVoice(rawVoice);

  const mine =
    rehearsalsState.status === "ready" && me.status === "ready"
      ? upcomingRehearsals(rehearsalsState.rehearsals).filter(
          (rehearsal) => groups === null || groups.has(rehearsal.group_type),
        )
      : [];
  const [next, ...later] = mine;

  const heroRehearsals =
    rehearsalsState.status === "error"
      ? ({ status: "error" } as const)
      : rehearsalsState.status === "ready" && me.status === "ready"
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
      <HomeOrder />
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
