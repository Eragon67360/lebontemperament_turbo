"use client";

import { useDensity } from "@/components/DensityProvider";
import { CountBadge } from "@/components/shell/NavBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { parseDensity } from "@/lib/density";
import { getRoleLabel } from "@/utils/roleUtils";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LifeBuoy, LogOut, Mail } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

/**
 * The header's account menu (direction B): who is signed in, Messages with
 * its unread count (also pinned to the avatar), Signaler un problème, the
 * theme, the list density, Se déconnecter. Both dialogs are mounted by the shell, outside
 * this menu, so they survive the menu closing.
 */
export function AccountMenu({
  unreadMessages,
  onOpenMessages,
  onOpenBugReport,
}: {
  unreadMessages: number;
  onOpenMessages: () => void;
  onOpenBugReport: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: profile } = useCurrentProfile();
  const { density, setDensity } = useDensity();
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored choice after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await createClient().auth.signOut();
      // Drop cached rows so the next account never sees this one's data.
      queryClient.clear();
      router.push(RouteNames.AUTH.LOGIN);
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoadingUser || !user) {
    return (
      <div className="flex h-11 items-center gap-2 px-1.5" aria-hidden>
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-3.5 w-28 max-lg:hidden" />
      </div>
    );
  }

  const name: string =
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "Utilisateur";
  const unreadLabel =
    unreadMessages > 0
      ? `, ${unreadMessages} message${unreadMessages > 1 ? "s" : ""} non lu${unreadMessages > 1 ? "s" : ""}`
      : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 gap-2 rounded-md pr-2 pl-1.5"
          aria-label={`Compte de ${name}${unreadLabel}`}
        >
          <span className="relative">
            <Avatar className="size-9">
              <AvatarImage
                src={
                  profile?.profile_picture_url ||
                  user.user_metadata?.avatar_url ||
                  undefined
                }
                alt=""
              />
              <AvatarFallback className="text-[13px] tracking-wide">
                {initials(name, user.email)}
              </AvatarFallback>
            </Avatar>
            <CountBadge
              count={unreadMessages}
              size="sm"
              className="absolute -top-1 -right-1"
              aria-hidden
            />
          </span>
          <span className="text-foreground max-w-[16ch] truncate text-[15px] font-medium max-lg:hidden">
            {name}
          </span>
          <ChevronDown
            className="text-muted-foreground size-4 max-lg:hidden"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 pt-2 pb-3">
          <p className="text-foreground truncate font-medium">{name}</p>
          <p className="text-detail text-muted-foreground truncate">
            {profile?.role ? `${getRoleLabel(profile.role)} · ` : ""}
            {user.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        {/* Deferred so the menu has closed before the dialog takes the
            focus and the pointer-events lock (Radix layers on mobile). */}
        <DropdownMenuItem onSelect={() => setTimeout(onOpenMessages, 0)}>
          <Mail aria-hidden />
          <span className="flex-1">Messages</span>
          <CountBadge count={unreadMessages} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTimeout(onOpenBugReport, 0)}>
          <LifeBuoy aria-hidden />
          Signaler un problème
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Thème</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? "system") : "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="system">
            Comme l’appareil
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Clair</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Sombre</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Densité des listes</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={density}
          onValueChange={(value) => setDensity(parseDensity(value))}
        >
          <DropdownMenuRadioItem value="comfortable">
            Aérées
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">
            Compactes
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
          <LogOut aria-hidden />
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initials(name: string, email?: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return letters || email?.charAt(0).toUpperCase() || "?";
}
