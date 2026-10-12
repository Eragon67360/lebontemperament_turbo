"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { getFirstName } from "@/lib/membres/names";
import { AppPromoCard } from "./AppPromoCard";
import { HomeRehearsals } from "./HomeRehearsals";
import { HomeTiles } from "./HomeTiles";

/** The members area's home: greeting, next rehearsal, six ways in, the app. */
export const MembresLandingPage = () => {
  const { user } = useAuth();
  const firstName = getFirstName(
    user?.user_metadata?.display_name || user?.user_metadata?.name,
  );

  return (
    <div className="flex flex-col gap-12 md:gap-14">
      <section className="flex flex-col gap-2">
        <h1 className="text-foreground text-[34px] leading-[1.1] font-semibold tracking-tight break-words md:text-[44px]">
          Bonjour{firstName ? ` ${firstName}` : ""}
        </h1>
        <p className="text-muted text-lg md:text-xl">
          Tout ce qu’il te faut pour chanter, au même endroit.
        </p>
      </section>
      <HomeRehearsals />
      <HomeTiles />
      <AppPromoCard />
    </div>
  );
};
