"use client";

import { SidebarNav } from "@/components/navigation/SidebarNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyBugReports } from "@/hooks/useMyBugReports";
import { useUnreadBugReports } from "@/hooks/useUnreadBugReports";
import { buildNavSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Sidebar({
  mobile,
  onNavigate,
  setMessagesDialogOpen,
  setBugReportDialogOpen,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
  setMessagesDialogOpen?: (open: boolean) => void;
  setBugReportDialogOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: profile } = useCurrentProfile();
  const { data: unreadBugReports = 0 } = useUnreadBugReports();
  const { data: myBugReports = [] } = useMyBugReports();

  const unreadMessages = myBugReports.reduce(
    (total, report) => total + (report.unread_count || 0),
    0,
  );

  const sections = buildNavSections({
    unreadMessages,
    unreadBugReports,
    isSuperAdmin: profile?.role === "superadmin",
  });

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

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-white",
        mobile ? "w-full" : "w-64 rounded-2xl border border-gray-100",
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link
          href={RouteNames.DASHBOARD.ROOT}
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Image
              src="/picto.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </div>
          <span className="text-sm font-bold text-gray-900">
            Le Bon Temperament
          </span>
        </Link>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav
          sections={sections}
          variant={mobile ? "mobile" : "desktop"}
          onNavigate={onNavigate}
          onMessagesClick={() => setMessagesDialogOpen?.(true)}
        />
      </div>

      <div className="shrink-0 p-4">
        {isLoadingUser || !user ? (
          <div className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-6 hover:bg-gray-50"
              >
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage
                    src={
                      profile?.profile_picture_url ||
                      user.user_metadata?.avatar_url ||
                      "/default-avatar.png"
                    }
                    alt=""
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {user.user_metadata?.display_name ||
                      user.user_metadata?.name ||
                      "Utilisateur"}
                  </span>
                  <span className="w-full truncate text-left text-xs text-gray-500">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg"
                onClick={() => {
                  setBugReportDialogOpen?.(true);
                  // Let the dialog mount before the mobile sheet closes around it.
                  setTimeout(() => onNavigate?.(), 0);
                }}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>Signaler un problème</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={() => {
                  handleLogout();
                  onNavigate?.();
                }}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>
                  {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
