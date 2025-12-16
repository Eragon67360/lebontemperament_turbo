"use client";
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
import { useMyBugReports } from "@/hooks/useMyBugReports";
import { useUnreadBugReports } from "@/hooks/useUnreadBugReports";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Bug,
  Building2,
  Calendar,
  ChevronDown,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Music,
  PartyPopper,
  Users,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { JSX, useEffect, useState } from "react";

type Route = {
  label: string;
  subroutes: {
    href: string;
    label: string;
    icon: JSX.Element;
    visible?: boolean;
    badge?: React.ReactNode;
  }[];
  visible?: boolean;
};

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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { data: unreadCount = 0 } = useUnreadBugReports();
  const { data: myBugReports = [] } = useMyBugReports();
  const supabase = createClient();
  const router = useRouter();

  // Calculate unread messages count
  const unreadMessagesCount = myBugReports.reduce(
    (total, report) => total + (report.unread_count || 0),
    0,
  );
  const routes: Route[] = [
    {
      label: "Général",
      subroutes: [
        {
          href: "/dashboard",
          label: "Tableau de bord",
          icon: <LayoutDashboard className="h-4 w-4" />,
          visible: true,
        },
      ],
    },
    {
      label: "Communication",
      subroutes: [
        {
          href: "#messages",
          label: "Messages",
          icon: <MessageCircle className="h-4 w-4" />,
          visible: true,
          badge:
            unreadMessagesCount > 0 ? (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">
                {unreadMessagesCount}
              </span>
            ) : null,
        },
      ],
    },
    {
      label: "Contenu public",
      subroutes: [
        {
          href: "/dashboard/public/gallery",
          label: "Médias",
          icon: <ImageIcon className="h-4 w-4" />,
          visible: false,
        },
        {
          href: "/dashboard/public/gallery/videos",
          label: "Vidéos",
          icon: <Video className="h-4 w-4" />,
          visible: true,
        },
      ],
      visible: true,
    },
    {
      label: "Concerts & Événements",
      subroutes: [
        {
          href: "/dashboard/public/concerts",
          label: "Concerts",
          icon: <Music className="h-4 w-4" />,
        },
        {
          href: "/dashboard/members/repetitions",
          label: "Répétitions",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          href: "/dashboard/members/evenements",
          label: "Événements",
          icon: <Calendar className="h-4 w-4" />,
        },
      ],
    },
    {
      label: "Anniversaire 40 ans",
      subroutes: [
        {
          href: "/dashboard/admin/anniversary",
          label: "Gestion de la page",
          icon: <PartyPopper className="h-4 w-4" />,
          visible: isSuperAdmin,
        },
      ],
      visible: isSuperAdmin,
    },
    {
      label: "Administration",
      subroutes: [
        {
          href: "/dashboard/admin/users",
          label: "Utilisateurs",
          icon: <Users className="h-4 w-4" />,
          visible: true,
        },
        {
          href: "/dashboard/admin/google-groups",
          label: "Groupes Google",
          icon: <Users className="h-4 w-4" />,
          visible: true,
        },
        {
          href: "/dashboard/admin/ca",
          label: "Conseil d'administration",
          icon: <Building2 className="h-4 w-4" />,
          visible: true,
        },
        {
          href: "/dashboard/admin/bug-reports",
          label: "Rapports de bugs",
          icon: <Bug className="h-4 w-4" />,
          visible: isSuperAdmin,
          badge:
            unreadCount > 0 ? (
              <span className="relative ml-auto flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
            ) : null,
        },
      ],
    },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);

        // Get profile data including profile picture
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, profile_picture_url")
          .eq("id", data.user.id)
          .single();

        setIsSuperAdmin(profile?.role === "superadmin");
        // Set profile picture URL if it exists
        setProfilePictureUrl(profile?.profile_picture_url || null);
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/auth/login");
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
        "flex h-full flex-col bg-white",
        mobile ? "w-full" : "w-64 rounded-2xl border border-gray-100",
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Image
              src="/picto.svg"
              alt="Logo"
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

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {routes.map(
            (route) =>
              route.visible !== false && (
                <div key={route.label}>
                  <h3 className="mb-2 px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    {route.label}
                  </h3>
                  <div className="space-y-1">
                    {route.subroutes?.map(
                      (subroute) =>
                        subroute.visible !== false &&
                        (subroute.href === "#messages" ? (
                          <button
                            key={subroute.href}
                            onClick={() => {
                              setMessagesDialogOpen?.(true);
                              // Delay closing sidebar to let dialog open first
                              setTimeout(() => onNavigate?.(), 0);
                            }}
                            className={cn(
                              "group flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900",
                            )}
                          >
                            <span className="mr-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-500">
                              {subroute.icon}
                            </span>
                            {subroute.label}
                            {subroute.badge}
                          </button>
                        ) : (
                          <Link
                            key={subroute.href}
                            href={subroute.href}
                            onClick={onNavigate}
                            className={cn(
                              "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                              pathname === subroute.href
                                ? "bg-primary/10 text-primary font-semibold shadow-none"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            )}
                          >
                            <span
                              className={cn(
                                "mr-3 h-5 w-5 transition-colors",
                                pathname === subroute.href
                                  ? "text-primary"
                                  : "text-gray-400 group-hover:text-gray-500",
                              )}
                            >
                              {subroute.icon}
                            </span>
                            {subroute.label}
                            {subroute.badge}
                          </Link>
                        )),
                    )}
                  </div>
                </div>
              ),
          )}
        </div>
      </div>

      {user && (
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start gap-3 rounded-xl px-3 py-6 hover:bg-gray-50"
              >
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage
                    src={
                      profilePictureUrl ||
                      user.user_metadata?.avatar_url ||
                      "/default-avatar.png"
                    }
                    alt="User Avatar"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {user.user_metadata.display_name ||
                      user.user_metadata.name ||
                      "Utilisateur"}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg"
                onClick={() => {
                  setBugReportDialogOpen?.(true);
                  // Delay closing sidebar to let dialog open first
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
        </div>
      )}
    </div>
  );
}
