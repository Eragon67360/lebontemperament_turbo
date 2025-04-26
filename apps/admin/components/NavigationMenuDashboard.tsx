"use client";
import { BugReportDialog } from "@/components/BugReportDialog";
import { BugReportStatus } from "@/components/BugReportsStatus";
import { NotificationsPopover } from "@/components/NotificationsPopover";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { WorkNavigation } from "@/types/work";
import { fetchWorkNavigation } from "@/utils/navigation";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import * as Icons from "lucide-react";
import {
  ChevronRight,
  Globe,
  LogOut,
  LucideIcon,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  title: string;
  description?: string;
  url: string;
  icon?: LucideIcon;
  items?: Omit<NavItem, "icon">[];
};

export function NavigationMenuDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [workNavigation, setWorkNavigation] = useState<WorkNavigation | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadNavigation = async () => {
      const nav = await fetchWorkNavigation();
      setWorkNavigation(nav);
    };
    loadNavigation();
  }, []);

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

  const navItems: NavItem[] = [
    {
      title: "Site Public",
      description:
        "Gérez et personnalisez le contenu visible par le grand public",
      icon: Globe,
      url: RouteNames.DASHBOARD.PUBLIC.ROOT,
      items: [
        {
          title: "Page d'accueil",
          description:
            "Configurez et personnalisez les éléments de la page d'accueil",
          url: RouteNames.DASHBOARD.PUBLIC.HOME.ROOT,
          items: [
            {
              title: "Projets",
              description:
                "Gérez et présentez vos projets artistiques et musicaux",
              url: RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT,
            },
            {
              title: "Nous Découvrir",
              description:
                "Créez et modifiez la section de présentation de votre groupe",
              url: RouteNames.DASHBOARD.PUBLIC.HOME.ABOUT,
            },
            {
              title: "Nos CDs",
              description:
                "Administrez votre catalogue de productions musicales",
              url: RouteNames.DASHBOARD.PUBLIC.HOME.CDS,
            },
          ],
        },
        {
          title: "Concerts",
          description:
            "Gérez la programmation et les informations à propos des concerts",
          url: RouteNames.DASHBOARD.PUBLIC.CONCERTS,
          items: [
            {
              title: "Prochains Concerts",
              description:
                "Planifiez et publiez vos futurs concerts et représentations",
              url: RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS,
            },
          ],
        },
        {
          title: "Contact",
          description: "Configurez les informations et formulaires de contact",
          url: "/dashboard/public/contact",
        },
        {
          title: "Médiathèque",
          description: "Gérez et organisez vos ressources multimédia",
          url: RouteNames.DASHBOARD.PUBLIC.GALLERY.ROOT,
          items: [
            {
              title: "Images",
              description: "Nos photos",
              url: RouteNames.DASHBOARD.PUBLIC.GALLERY.IMAGES,
            },
            {
              title: "Videos",
              description:
                "L'ensemble des vidéos mises à disposition depuis Youtube",
              url: RouteNames.DASHBOARD.PUBLIC.GALLERY.VIDEOS,
            },
          ],
        },
      ],
    },
    {
      title: "Espace Membres",
      description: "Espace collaboratif et de gestion interne",
      icon: Users,
      url: "/dashboard/members/",
      items: [
        {
          title: "Évènements",
          description: "Planifiez et suivez les événements du BT",
          url: RouteNames.DASHBOARD.MEMBERS.EVENEMENTS,
        },
        {
          title: "Travail",
          description:
            "Espace de collaboration et de suivi des partitions, etc...",
          url: "/dashboard/members/travail",
          items:
            workNavigation?.groups.map((group) => ({
              title: group.name,
              description: `Espace de travail spécifique pour le groupe ${group.name}`,
              url: `/dashboard/members/travail/${workNavigation.activeProgram?.id}/${group.slug}`,
              icon: Icons[group.icon as keyof typeof Icons],
            })) || [],
        },
      ],
    },
    {
      title: "Administration",
      description: "Outils de gestion et configuration système",
      icon: Settings,
      url: "/dashboard/admin/",
      items: [
        {
          title: "Utilisateurs",
          description: "Gérez les comptes utilisateurs et les autorisations",
          url: "/dashboard/admin/users",
        },
      ],
    },
  ];

  return (
    <>
      <div
        className={cn(
          "transition-all duration-300",
          isNavOpen
            ? "fixed inset-0 bg-black/70 z-40"
            : "bg-transparent pointer-events-none",
        )}
        onClick={() => setIsNavOpen(false)}
      />

      <div className="sticky top-0 lg:top-4 z-50 bg-white lg:bg-transparent border-b lg:border-none pb-2 lg:pb-0 px-4">
        <div
          className={cn(
            "flex items-center justify-between p-0 lg:p-2 mx-auto mt-2 lg:mt-0 rounded-full border border-transparent lg:border-border bg-white/95 container",
            isNavOpen && "bg-background",
          )}
        >
          <div className="flex items-center gap-4">
            <Link
              href={RouteNames.DASHBOARD.ROOT}
              className="hover:opacity-80 transition-all duration-300 hidden lg:block"
            >
              <Image
                src="/picto.svg"
                alt="Logo"
                width={40}
                height={40}
                className=""
              />
            </Link>

            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader className="h-0">
                    <SheetTitle></SheetTitle>
                    <SheetDescription></SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 h-full overflow-y-auto">
                    {navItems.map((section) => (
                      <div key={section.title} className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                          {section.title}
                        </h3>
                        <div className="space-y-2">
                          {section.items?.map((item) => (
                            <Link
                              key={item.title}
                              href={item.url}
                              className="block py-2 px-3 hover:bg-accent rounded"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <NavigationMenu
              delayDuration={100}
              skipDelayDuration={300}
              onValueChange={(value) => setIsNavOpen(!!value)}
              className="hidden lg:block"
            >
              <NavigationMenuList className="flex space-x-1">
                {navItems.map((section) => (
                  <NavigationMenuItem key={section.title}>
                    <NavigationMenuTrigger className="bg-transparent">
                      {section.icon && (
                        <section.icon className="mr-2 h-4 w-4" />
                      )}
                      {section.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {section.items?.map((item) => (
                          <HoverCard
                            key={item.title}
                            openDelay={100}
                            closeDelay={100}
                          >
                            <HoverCardTrigger asChild>
                              <Link
                                href={item.url}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none",
                                  "transition-colors hover:bg-accent hover:text-accent-foreground",
                                  "flex justify-between items-center group",
                                )}
                              >
                                <div>
                                  <div className="text-sm font-medium leading-none">
                                    {item.title}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm leading-snug text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                {item.items && (
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 text-muted-foreground",
                                      "transition-all duration-300 ease-in-out",
                                      "group-hover:translate-x-1 group-hover:opacity-100",
                                      item.items ? "opacity-50" : "opacity-0",
                                    )}
                                  />
                                )}
                              </Link>
                            </HoverCardTrigger>
                            {item.items && (
                              <HoverCardContent
                                side="right"
                                align="start"
                                className="w-[300px] p-4 ml-4 shadow-xl"
                              >
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">
                                    {item.title}
                                  </h4>
                                  <div className="space-y-2">
                                    {item.items.map((subItem) => (
                                      <Link
                                        key={subItem.title}
                                        href={subItem.url}
                                        className="block p-2 rounded hover:bg-accent"
                                      >
                                        <div className="text-sm font-medium">
                                          {subItem.title}
                                        </div>
                                        {subItem.description && (
                                          <p className="text-xs text-muted-foreground">
                                            {subItem.description}
                                          </p>
                                        )}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              </HoverCardContent>
                            )}
                          </HoverCard>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden lg:flex items-center space-x-2">
              <NotificationsPopover />
              <BugReportStatus />
              <BugReportDialog />
            </div>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage
                      src={
                        user.user_metadata?.avatar_url || "/default-avatar.png"
                      }
                      alt="User Avatar"
                    />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.email?.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
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
      </div>
    </>
  );
}
