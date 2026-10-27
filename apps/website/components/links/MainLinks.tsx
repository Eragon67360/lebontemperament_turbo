// MainLinks.tsx
import { AnniversaryNavLink } from "@/components/anniversary/AnniversaryEntry";
import { useAdminStatus, useAnniversaryFeature } from "@/hooks/useFeatureFlag";
import { useSitePathname } from "@/hooks/useSitePathname";
import RouteNames from "@/utils/routes";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import React from "react";

interface MainLinksProps {
  user: User | null;
  isLight?: boolean;
  isLoading: boolean;
}

const MainLinks: React.FC<MainLinksProps> = ({ user, isLoading, isLight }) => {
  const pathname = useSitePathname();
  const { isEnabled: isAnniversaryEnabled } = useAnniversaryFeature();
  const { isAdmin } = useAdminStatus();

  const isActive = (href: string) => pathname === href;

  const getLinkClassName = (path: string) => `
        py-1 px-2 transition-all duration-300 
        ${isLight ? "text-white dark:text-white" : "text-foreground dark:text-foreground"}
        ${
          isActive(path)
            ? "border-primary/65 dark:border-primary/80 border-y-2"
            : "border-transparent hover:border-primary/65 dark:hover:border-primary/80 border-y-2"
        }
    `;

  return (
    <ul className="text-foreground dark:text-foreground hidden h-full flex-row flex-nowrap items-center justify-center gap-6 text-[16px] tracking-[2.4px] uppercase select-none lg:flex">
      <li>
        <Link
          href={RouteNames.ROOT}
          aria-label="Aller à l'accueil"
          className={getLinkClassName("/")}
        >
          Accueil
        </Link>
      </li>
      <li>
        <Link
          href={RouteNames.CONCERTS.ROOT}
          aria-label="Consulter l’agenda des concerts"
          className={getLinkClassName("/concerts")}
        >
          Agenda
        </Link>
      </li>
      <li>
        <Link
          href={RouteNames.DECOUVRIR.ROOT}
          aria-label="Aller à la page Nous Découvrir"
          className={getLinkClassName("/decouvrir")}
        >
          Nous découvrir
        </Link>
      </li>
      <li>
        <Link
          href={RouteNames.GALERIE.ROOT}
          aria-label="Aller à la galerie"
          className={getLinkClassName("/galerie")}
        >
          Galerie
        </Link>
      </li>
      <li>
        <Link
          href={RouteNames.CONTACT.ROOT}
          aria-label="Aller à la page Contact"
          className={getLinkClassName("/contact")}
        >
          Contact
        </Link>
      </li>
      {(isAnniversaryEnabled || isAdmin) && (
        <li>
          <AnniversaryNavLink
            isLight={isLight}
            isActive={isActive("/40-ans")}
          />
        </li>
      )}
      {!isLoading && user && (
        <li>
          <Link
            href={RouteNames.MEMBRES.ROOT}
            className={getLinkClassName("/membres")}
          >
            Membres
          </Link>
        </li>
      )}
    </ul>
  );
};

export default MainLinks;
