import RouteNames from "@/utils/routes";
import { Link, NavbarMenu, NavbarMenuItem } from "@heroui/react";
import { User } from "@supabase/supabase-js";
import React from "react";

interface MainMenuLinksProps {
  user: User | null;
  isLoading: boolean;
}

const MainMenuLinks: React.FC<MainMenuLinksProps> = ({ user, isLoading }) => {
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
          Nos prochains concerts
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
        <Link
          href="/40-ans"
          className="w-full rounded-lg bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] px-4 py-2 text-center font-bold text-white shadow-lg"
        >
          🎉 40 ans du Bon Tempérament
        </Link>
      </NavbarMenuItem>
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
