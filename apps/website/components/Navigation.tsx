// Navigation.tsx
"use client";
import { LinkButton } from "@/components/LinkButton";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { RoundedSize } from "@/utils/types";
import { Avatar, Button, Link, Popover, toast, Tooltip } from "@heroui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CiLock } from "react-icons/ci";
import { FaKey } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import ChangePasswordModal from "./ChangePasswordModal";
import CloudinaryImage from "./CloudinaryImage";
import DonationCampaignShowcase from "./donations/DonationCampaignShowcase";
import MainLinks from "./links/MainLinks";
import MainMenuLinks from "./links/MainMenuLinks";
import { useAuth } from "./providers/AuthProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

type UserProfile = {
  id: string;
  display_name: string | null;
  profile_picture_url: string | null;
};

const Navigation = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasScrolled, setHasScrolled] = useState(false);
  const isMembresSection = pathname.startsWith("/membres");
  const isSpecialPath = pathname === "/" || pathname.startsWith("/concerts/");
  const supabase = createClient();
  const router = useRouter();

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, display_name, profile_picture_url")
            .eq("id", currentUser.id)
            .single();

          if (error) throw error;
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.danger("Erreur lors du chargement du profil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [setUser, supabase]);

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        setUser(null);
        setUserProfile(null);

        toast.success("Déconnexion réussie");

        router.push(RouteNames.ROOT);
        router.refresh();
      } catch (error) {
        console.error("Error signing out:", error);
        toast.danger("Erreur lors de la déconnexion");
      }
    });
  };

  return (
    !isMembresSection && (
      <nav
        className={`sticky top-0 z-50 w-full overflow-x-hidden transition-colors ${
          isSpecialPath && !hasScrolled
            ? "bg-background/0"
            : "bg-background/50 backdrop-blur-lg"
        }`}
        aria-label="Navigation principale"
      >
        <div className="relative flex h-16 w-full items-center gap-4 px-4">
          <button
            type="button"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            aria-controls="main-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={
              isSpecialPath && !hasScrolled
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

          <MainLinks
            user={user}
            isLoading={isLoading}
            isLight={isSpecialPath && !hasScrolled}
          />

          <div className="ml-auto flex items-center gap-6">
            {/* Donation link - icon only, large screens */}
            <DonationCampaignShowcase isLight={isSpecialPath && !hasScrolled} />
            {/* Theme Switcher - Always visible */}
            <ThemeSwitcher isLight={isSpecialPath && !hasScrolled} />

            {user ? (
              <div className="flex items-center gap-4">
                <Tooltip>
                  <Tooltip.Trigger>
                    <Link
                      href={
                        "https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ouvrir le drive Google dans un nouvel onglet"
                      className="bg-primary/20 hover:bg-primary/40 dark:bg-primary/30 dark:hover:bg-primary/50 size-8 h-full shrink-0 rounded-md p-2 transition-colors"
                    >
                      <CloudinaryImage
                        src={"Site/membres/logos/drive"}
                        alt="Icône Google Drive"
                        width={16}
                        height={16}
                        rounded={RoundedSize.NONE}
                        className="size-4"
                      />
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p>Accéder au drive Google</p>
                  </Tooltip.Content>
                </Tooltip>
                <Popover>
                  <Popover.Trigger
                    className="flex shrink-0 cursor-pointer items-center gap-1"
                    aria-label="Menu utilisateur"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <Avatar.Image
                        src={
                          userProfile?.profile_picture_url ||
                          user.user_metadata?.avatar_url
                        }
                        alt={`Avatar de ${userProfile?.display_name || user.email}`}
                      />
                      <Avatar.Fallback>
                        {userProfile?.display_name?.charAt(0) ||
                          user.email?.charAt(0)}
                      </Avatar.Fallback>
                    </Avatar>
                  </Popover.Trigger>
                  <Popover.Content placement="bottom start">
                    <Popover.Dialog
                      className="flex flex-col items-start gap-2"
                      aria-label="Options utilisateur"
                    >
                      <div className="flex items-center justify-start gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <Avatar.Image
                            src={user.user_metadata?.avatar_url}
                            alt={`Avatar de ${userProfile?.display_name || user.email}`}
                          />
                          <Avatar.Fallback>
                            {userProfile?.display_name?.charAt(0) ||
                              user.email?.charAt(0)}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {userProfile?.display_name}
                          </span>
                          <span className="text-muted truncate text-xs">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onPress={() => setIsPasswordModalOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-start gap-1"
                        isDisabled={isPending}
                        aria-label="Changer mon mot de passe"
                      >
                        <FaKey className="mr-2 size-4" aria-hidden="true" />
                        Changer mon mot de passe
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={handleSignOut}
                        className="flex w-full cursor-pointer items-center justify-start gap-1"
                        isDisabled={isPending}
                        aria-label="Se déconnecter"
                      >
                        <IoLogOut className="mr-2 size-4" aria-hidden="true" />
                        {isPending ? "Déconnexion..." : "Se déconnecter"}
                      </Button>
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </div>
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

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </nav>
    )
  );
};

export default Navigation;
