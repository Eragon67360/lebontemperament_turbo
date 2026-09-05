import { useAdminStatus, useAnniversaryFeature } from "@/hooks/useFeatureFlag";
import RouteNames from "@/utils/routes";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import React from "react";

interface MainMenuLinksProps {
  user: User | null;
  isLoading: boolean;
  onNavigate?: () => void;
}

const MainMenuLinks: React.FC<MainMenuLinksProps> = ({
  user,
  isLoading,
  onNavigate,
}) => {
  const { isEnabled: isAnniversaryEnabled } = useAnniversaryFeature();
  const { isAdmin } = useAdminStatus();

  const itemClass = "text-foreground block w-full py-2";

  return (
    <div id="main-menu" className="border-separator border-t pt-6 lg:hidden">
      <ul className="flex flex-col gap-2 p-4">
        <li>
          <Link
            href={RouteNames.ROOT}
            className={itemClass}
            onClick={onNavigate}
          >
            Accueil
          </Link>
        </li>
        <li>
          <Link
            href={RouteNames.CONCERTS.ROOT}
            className={itemClass}
            onClick={onNavigate}
          >
            Agenda
          </Link>
        </li>
        <li>
          <Link
            href={RouteNames.DECOUVRIR.ROOT}
            className={itemClass}
            onClick={onNavigate}
          >
            Nous découvrir
          </Link>
        </li>
        <li>
          <Link
            href={RouteNames.GALERIE.ROOT}
            className={itemClass}
            onClick={onNavigate}
          >
            Galerie
          </Link>
        </li>
        <li>
          <Link
            href={RouteNames.CONTACT.ROOT}
            className={itemClass}
            onClick={onNavigate}
          >
            Contact
          </Link>
        </li>
        <li>
          <Link href="/don" className={itemClass} onClick={onNavigate}>
            Faire un don
          </Link>
        </li>
        {(isAnniversaryEnabled || isAdmin) && (
          <li>
            <Link
              href="/40-ans"
              onClick={onNavigate}
              className="from-primary-600 via-primary to-primary-400 dark:from-primary-700 dark:via-primary-600 dark:to-primary-500 focus-visible:outline-primary block w-full rounded-lg bg-linear-to-r px-4 py-2 text-center font-bold text-white shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
            >
              🎉 40 ans du Bon Tempérament
            </Link>
          </li>
        )}
        {!isLoading && user && (
          <li>
            <Link
              href={RouteNames.MEMBRES.ROOT}
              className={itemClass}
              onClick={onNavigate}
            >
              Membres
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default MainMenuLinks;
