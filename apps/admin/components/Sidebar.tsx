"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Building2,
  Calendar,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Music,
  Users,
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
  }[];
};

export default function Sidebar({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const routes: Route[] = [
    {
      label: "Administration",
      subroutes: [
        {
          href: "/dashboard/admin/users",
          label: "Utilisateurs",
          icon: <Users className="w-4 h-4" />,
          visible: true,
        },
        {
          href: "/dashboard/admin/ca",
          label: "Conseil d'administration",
          icon: <Building2 className="w-4 h-4" />,
          visible: false,
        },
      ],
    },
    {
      label: "Site Public",
      subroutes: [
        {
          href: "/dashboard/public/projets",
          label: "Projets",
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: false,
        },
        {
          href: "/dashboard/public/gallery",
          label: "Médias",
          icon: <ImageIcon className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Organisation",
      subroutes: [
        {
          href: "/dashboard/public/concerts/prochains-concerts",
          label: "Concerts",
          icon: <Music className="w-4 h-4" />,
        },
        {
          href: "/dashboard/members/repetitions",
          label: "Répétitions",
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          href: "/dashboard/members/evenements",
          label: "Événements",
          icon: <Calendar className="w-4 h-4" />,
        },
      ],
    },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
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
        "flex flex-col h-screen bg-primary/5",
        mobile ? "w-full" : "w-64",
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center p-3 hover:bg-primary/10"
        onClick={onNavigate}
      >
        <div className="relative size-8 sm:size-12 mr-3">
          <Image fill alt="Logo" src="/picto.svg" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">
          BT - Admin
        </h1>
      </Link>

      <div className="px-2 py-2 space-y-1 overflow-y-auto">
        {routes.map((route) => (
          <div key={route.label} className="space-y-0">
            <div className="flex items-center p-2 text-sm font-medium text-muted-foreground">
              <span className="ml-2 font-bold">{route.label}</span>
            </div>
            <div className="ml-4 space-y-1">
              {route.subroutes?.map(
                (subroute) =>
                  subroute.visible !== false && (
                    <Link
                      key={subroute.href}
                      href={subroute.href}
                      onClick={onNavigate}
                      className={cn(
                        "text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 rounded-lg transition text-muted-foreground hover:text-primary",
                        pathname === subroute.href &&
                          "bg-primary/10 text-primary",
                      )}
                    >
                      <div className="flex items-center flex-1">
                        {subroute.icon}
                        <span className="ml-3 text-sm">{subroute.label}</span>
                      </div>
                    </Link>
                  ),
              )}
            </div>
          </div>
        ))}
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-fit gap-2 mt-auto py-2 mx-2 hover:bg-primary/10 hover:text-primary"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.user_metadata?.avatar_url || "/default-avatar.png"}
                  alt="User Avatar"
                />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-start">
                <span className="font-medium text-sm">
                  {user.user_metadata.display_name || user.user_metadata.name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-sm">Compte</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                handleLogout();
                onNavigate?.();
              }}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
