// MainLinks.tsx
import RouteNames from "@/utils/routes";
import { NavbarContent, NavbarItem } from "@heroui/react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface MainLinksProps {
  user: User | null;
  isLoading: boolean;
}

const MainLinks: React.FC<MainLinksProps> = ({ user, isLoading }) => {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const getLinkClassName = (path: string) => `
        py-1 px-2 transition-all duration-300 
        ${
          isActive(path)
            ? "border-primary/65 border-y-2"
            : "border-transparent hover:border-primary/65 border-y-2"
        }
    `;

  return (
    <NavbarContent
      justify="center"
      className="hidden lg:flex items-center text-[16px] uppercase gap-8 tracking-[2.4px] select-none"
    >
      <NavbarItem>
        <Link
          href={RouteNames.ROOT}
          aria-label="Aller à l'accueil"
          className={getLinkClassName("/")}
        >
          Accueil
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={RouteNames.CONCERTS.ROOT}
          aria-label="Aller à la page Nos Concerts"
          className={getLinkClassName("/concerts")}
        >
          Nos concerts
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={RouteNames.DECOUVRIR.ROOT}
          aria-label="Aller à la page Nous Découvrir"
          className={getLinkClassName("/decouvrir")}
        >
          Nous découvrir
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={RouteNames.GALERIE.ROOT}
          aria-label="Aller à la galerie"
          className={getLinkClassName("/galerie")}
        >
          Galerie
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={RouteNames.CONTACT.ROOT}
          aria-label="Aller à la page Contact"
          className={getLinkClassName("/contact")}
        >
          Contact
        </Link>
      </NavbarItem>

      {!isLoading && user && (
        <NavbarItem>
          <Link
            href={RouteNames.MEMBRES.ROOT}
            className={getLinkClassName("/membres")}
          >
            Membres
          </Link>
        </NavbarItem>
      )}
    </NavbarContent>
  );
};

export default MainLinks;
