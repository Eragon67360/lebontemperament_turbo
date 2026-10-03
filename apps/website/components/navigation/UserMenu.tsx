"use client";

import ChangePasswordModal from "@/components/ChangePasswordModal";
import CloudinaryImage from "@/components/CloudinaryImage";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDriveRootUrl } from "@/hooks/useDriveRootUrl";
import RouteNames from "@/utils/routes";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import { RoundedSize } from "@/utils/types";
import { Avatar, Button, Link, Popover, toast, Tooltip } from "@heroui/react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FaKey } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";

type UserProfile = {
  id: string;
  display_name: string | null;
  profile_picture_url: string | null;
};

/**
 * The signed-in part of the navigation bar: drive shortcut, avatar menu,
 * password change and sign-out. Loaded by `Navigation` only once a session is
 * known, so public pages carry neither supabase-js nor these HeroUI overlays
 * for anonymous visitors.
 */
const UserMenu = ({ user }: { user: User }) => {
  const { setUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const driveUrl = useDriveRootUrl();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const fetchUserProfile = async () => {
      try {
        const supabase = await loadBrowserClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, display_name, profile_picture_url")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (!cancelled) setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.danger("Erreur lors du chargement du profil");
      }
    };

    fetchUserProfile();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        const supabase = await loadBrowserClient();
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
    <>
      <div className="flex items-center gap-4">
        {driveUrl && (
          <Tooltip>
            <Tooltip.Trigger>
              <Link
                href={driveUrl}
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
        )}
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

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default UserMenu;
