// Navigation.tsx
"use client";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { RoundedSize } from "@/utils/types";
import {
  addToast,
  Avatar,
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenuToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@heroui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CiLock } from "react-icons/ci";
import { FaKey } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import ChangePasswordModal from "./ChangePasswordModal";
import CloudinaryImage from "./CloudinaryImage";
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
        addToast({
          description: "Erreur lors du chargement du profil",
          color: "danger",
        });
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

        addToast({
          description: "Déconnexion réussie",
          color: "success",
        });

        router.push(RouteNames.ROOT);
        router.refresh();
      } catch (error) {
        console.error("Error signing out:", error);
        addToast({
          description: "Erreur lors de la déconnexion",
          color: "danger",
        });
      }
    });
  };

  return (
    !isMembresSection && (
      <Navbar
        maxWidth="full"
        onMenuOpenChange={setIsMenuOpen}
        className={`w-full overflow-x-hidden transition-colors ${
          isSpecialPath && !hasScrolled ? "bg-background/0" : "bg-background/50"
        }`}
        role="navigation"
        aria-label="Navigation principale"
      >
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isMenuOpen}
          aria-controls="main-menu"
          className={
            isSpecialPath && !hasScrolled
              ? "text-white lg:hidden dark:text-white"
              : "text-black lg:hidden dark:text-white"
          }
        />
        <NavbarBrand>
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
        </NavbarBrand>

        <MainLinks
          user={user}
          isLoading={isLoading}
          isLight={isSpecialPath && !hasScrolled}
        />

        <NavbarContent justify="end">
          {/* Theme Switcher - Always visible */}
          <ThemeSwitcher isLight={isSpecialPath && !hasScrolled} />

          {user ? (
            <div className="flex items-center gap-4">
              <Tooltip content="Accéder au drive Google">
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
                  />
                </Link>
              </Tooltip>
              <div className="flex w-full justify-center"></div>
              <Popover placement="bottom-start">
                <PopoverTrigger
                  className="flex shrink-0 cursor-pointer items-center gap-1"
                  disabled={isPending}
                  aria-label="Menu utilisateur"
                  aria-expanded="false"
                >
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    src={
                      userProfile?.profile_picture_url ||
                      user.user_metadata?.avatar_url
                    }
                    alt={`Avatar de ${userProfile?.display_name || user.email}`}
                  />
                </PopoverTrigger>
                <PopoverContent
                  className="flex flex-col items-start gap-2"
                  aria-label="Options utilisateur"
                >
                  <div className="flex items-center justify-start gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar
                      className="h-8 w-8 rounded-lg"
                      src={user.user_metadata?.avatar_url}
                      alt={`Avatar de ${userProfile?.display_name || user.email}`}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {userProfile?.display_name}
                      </span>
                      <span className="text-default-500 truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="light"
                    radius="sm"
                    onPress={() => setIsPasswordModalOpen(true)}
                    className="flex w-full cursor-pointer items-center justify-start gap-1"
                    disabled={isPending}
                    aria-label="Changer mon mot de passe"
                  >
                    <FaKey className="mr-2 size-4" aria-hidden="true" />
                    Changer mon mot de passe
                  </Button>
                  <Button
                    variant="light"
                    radius="sm"
                    onPress={handleSignOut}
                    className="flex w-full cursor-pointer items-center justify-start gap-1"
                    disabled={isPending}
                    aria-label="Se déconnecter"
                  >
                    <IoLogOut className="mr-2 size-4" aria-hidden="true" />
                    {isPending ? "Déconnexion..." : "Se déconnecter"}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            !isLoading && (
              <Button
                size="md"
                as={Link}
                href={RouteNames.AUTH.LOGIN}
                radius="sm"
                color="primary"
                aria-label="Se connecter à l'espace membres"
                disabled={isPending}
              >
                <CiLock aria-hidden="true" />
                <div>Membres</div>
              </Button>
            )
          )}
        </NavbarContent>

        <MainMenuLinks user={user} isLoading={isLoading} />

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </Navbar>
    )
  );
};

export default Navigation;
