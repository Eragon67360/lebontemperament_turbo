// Navigation.tsx
"use client";
import { LinkButton } from "@/components/LinkButton";
import RouteNames from "@/utils/routes";
import { Link } from "@heroui/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CiLock } from "react-icons/ci";
import DonationCampaignShowcase from "./donations/DonationCampaignShowcase";
import MainLinks from "./links/MainLinks";
import MainMenuLinks from "./links/MainMenuLinks";
import { useAuth } from "./providers/AuthProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

// Avatar menu, drive link, password modal and sign-out, with supabase-js:
// fetched only once a session is known (the server renders neither state).
const UserMenu = dynamic(() => import("./navigation/UserMenu"), {
  ssr: false,
});

const Navigation = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [hasScrolled, setHasScrolled] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const isMembresSection = pathname.startsWith("/membres");
  const isSpecialPath = pathname === "/" || pathname.startsWith("/concerts/");

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY >= window.innerHeight;
      setHasScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Block body scroll while the mobile menu is open (was handled by v2 Navbar)
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Escape closes the mobile menu and gives focus back to its toggle
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsMenuOpen(false);
      menuToggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    !isMembresSection && (
      <nav
        className={`sticky top-0 z-50 w-full overflow-x-hidden transition-colors ${
          isMenuOpen
            ? "bg-background"
            : isSpecialPath && !hasScrolled
              ? "bg-background/0"
              : "bg-background/50 backdrop-blur-lg"
        }`}
        aria-label="Navigation principale"
      >
        <div className="flex h-16 w-full items-center justify-between gap-4 px-6">
          <button
            ref={menuToggleRef}
            type="button"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            aria-controls="main-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={
              isSpecialPath && !hasScrolled && !isMenuOpen
                ? "text-white lg:hidden dark:text-white"
                : "text-black lg:hidden dark:text-white"
            }
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          {/* v2 parity: NavbarBrand was a grow/basis-0 slot, so the logo
              shares leftover space symmetrically with the end slot —
              this is what keeps the centre links centred. */}
          <div className="flex shrink grow basis-0 flex-row flex-nowrap items-center justify-start">
            <Link
              href={RouteNames.ROOT}
              aria-label="Aller à l'accueil - Le Bon Tempérament"
            >
              <Image
                src={"/img/picto.svg"}
                className="transition-opacity hover:opacity-85"
                alt="Logo Le Bon Tempérament"
                width={64}
                height={64}
                priority
              />
            </Link>
          </div>

          <MainLinks
            user={user}
            isLoading={isLoading}
            isLight={isSpecialPath && !hasScrolled}
          />

          <div className="flex shrink grow basis-0 flex-row flex-nowrap items-center justify-end gap-4">
            {/* Donation link - icon only, large screens */}
            <DonationCampaignShowcase isLight={isSpecialPath && !hasScrolled} />
            {/* Theme Switcher - Always visible */}
            <ThemeSwitcher isLight={isSpecialPath && !hasScrolled} />

            {user ? (
              <UserMenu user={user} />
            ) : (
              !isLoading && (
                <LinkButton
                  size="md"
                  variant="primary"
                  aria-label="Se connecter à l'espace membres"
                  href={RouteNames.AUTH.LOGIN}
                >
                  <CiLock aria-hidden="true" />
                  <div>Membres</div>
                </LinkButton>
              )
            )}
          </div>
        </div>

        {isMenuOpen && (
          <MainMenuLinks
            user={user}
            isLoading={isLoading}
            onNavigate={() => setIsMenuOpen(false)}
          />
        )}
      </nav>
    )
  );
};

export default Navigation;
