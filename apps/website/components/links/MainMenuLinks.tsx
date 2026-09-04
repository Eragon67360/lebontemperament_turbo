import { useAdminStatus, useAnniversaryFeature } from "@/hooks/useFeatureFlag";
import RouteNames from "@/utils/routes";
import { Link, NavbarMenu, NavbarMenuItem } from "@heroui/react";
import { User } from "@supabase/supabase-js";
import React from "react";

interface MainMenuLinksProps {
  user: User | null;
  isLoading: boolean;
}

const MainMenuLinks: React.FC<MainMenuLinksProps> = ({ user, isLoading }) => {
  const { isEnabled: isAnniversaryEnabled } = useAnniversaryFeature();
  const { isAdmin } = useAdminStatus();

  return (
    <NavbarMenu className="pt-6">
      <NavbarMenuItem>
        <Link href={RouteNames.ROOT} className="w-full" color="foreground">
          Accueil
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={RouteNames.CONCERTS.ROOT}
          className="w-full"
          color="foreground"
        >
          Agenda
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={RouteNames.DECOUVRIR.ROOT}
          className="w-full"
          color="foreground"
        >
          Nous découvrir
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={RouteNames.GALERIE.ROOT}
          className="w-full"
          color="foreground"
        >
          Galerie
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={RouteNames.CONTACT.ROOT}
          className="w-full"
          color="foreground"
        >
          Contact
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link href="/don" className="w-full" color="foreground">
          Faire un don
        </Link>
      </NavbarMenuItem>
      {(isAnniversaryEnabled || isAdmin) && (
        <NavbarMenuItem>
          <Link
            href="/40-ans"
            className="from-primary-600 via-primary to-primary-400 dark:from-primary-700 dark:via-primary-600 dark:to-primary-500 focus-visible:outline-primary w-full rounded-lg bg-linear-to-r px-4 py-2 text-center font-bold text-white shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
          >
            🎉 40 ans du Bon Tempérament
          </Link>
        </NavbarMenuItem>
      )}
      {!isLoading && user && (
        <NavbarMenuItem>
          <Link
            href={RouteNames.MEMBRES.ROOT}
            className="w-full"
            color="foreground"
          >
            Membres
          </Link>
        </NavbarMenuItem>
      )}
    </NavbarMenu>
  );
};

export default MainMenuLinks;
