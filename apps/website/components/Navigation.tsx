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

type UserProfile = {
  id: string;
  display_name: string | null;
};

const Navigation = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isMembresSection = pathname.startsWith("/membres");
  const supabase = createClient();
  const router = useRouter();

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
            .select("id, display_name")
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
        className="bg-background/50"
      >
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="lg:hidden"
        />
        <NavbarBrand>
          <Link href={RouteNames.ROOT}>
            <Image
              src={"/img/picto.svg"}
              className="hover:opacity-85"
              alt={"BT Logo"}
              width={64}
              height={64}
            />
          </Link>
        </NavbarBrand>

        <MainLinks user={user} isLoading={isLoading} />

        <NavbarContent justify="end">
          {user ? (
            <div className="flex items-center gap-4">
              <Tooltip content="Accéder au drive">
                <Link
                  href={
                    "https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU"
                  }
                  target="_blank"
                  rel="noopener"
                  className="bg-primary/20 rounded-md h-full size-8 p-2 hover:bg-primary/40 shrink-0"
                >
                  <CloudinaryImage
                    src={"Site/membres/logos/drive"}
                    alt="Drive icon"
                    width={16}
                    height={16}
                    rounded={RoundedSize.NONE}
                  />
                </Link>
              </Tooltip>
              <div className="flex w-full justify-center"></div>
              <Popover placement="bottom-start">
                <PopoverTrigger
                  className="flex gap-1 items-center shrink-0 cursor-pointer"
                  disabled={isPending}
                >
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    src={user.user_metadata?.avatar_url}
                  />
                </PopoverTrigger>
                <PopoverContent className="flex flex-col gap-2 items-start">
                  <div className="flex items-center justify-start gap-2 px-1 py-1.5 text-left text-sm ">
                    <Avatar
                      className="h-8 w-8 rounded-lg"
                      src={user.user_metadata?.avatar_url}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {userProfile?.display_name}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="light"
                    radius="sm"
                    onPress={() => setIsPasswordModalOpen(true)}
                    className="flex gap-1 items-center justify-start cursor-pointer w-full"
                    disabled={isPending}
                  >
                    <FaKey className="mr-2 size-4" />
                    Changer mon mot de passe
                  </Button>
                  <Button
                    variant="light"
                    radius="sm"
                    onPress={handleSignOut}
                    className="flex gap-1 items-center justify-start cursor-pointer w-full"
                    disabled={isPending}
                  >
                    <IoLogOut className="mr-2 size-4" />
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
                aria-label="Voir nos concerts"
                disabled={isPending}
              >
                <CiLock />
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
