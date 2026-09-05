// components/MembersNavigation.tsx
"use client";
import { createClient } from "@/utils/supabase/client";
import { Button, Description, Dropdown, Label } from "@heroui/react";
import { User } from "@supabase/supabase-js";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  IoCalendarOutline,
  IoChevronDownOutline,
  IoDocumentTextOutline,
  IoGlobeOutline,
  IoHomeOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoTicketOutline,
} from "react-icons/io5";

interface NavLinkType {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

export const MembersNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, [supabase]);

  const getFirstName = (fullName: string) => {
    if (!fullName) return "";
    const matches = fullName.match(/^([\p{L}]+(?:-[\p{L}]+)*)/u);
    if (matches) {
      return matches[0];
    }
    const parts = fullName.split(/(?=[A-Z]{2,})/);
    return parts[0]?.trim();
  };

  const links: NavLinkType[] = useMemo(
    () => [
      {
        href: "/membres",
        label: "Accueil",
        icon: IoHomeOutline,
        description: "Page d'accueil membres",
      },
      {
        href: "/membres/travail",
        label: "Partitions",
        icon: IoMusicalNotesOutline,
        description: "Documents de travail",
      },
      {
        href: "/membres/calendrier",
        label: "Calendrier",
        icon: IoCalendarOutline,
        description: "Répétitions",
      },
      {
        href: "/membres/concerts",
        label: "Concerts",
        icon: IoTicketOutline,
        description: "Concerts & évènements",
      },
      {
        href: "/membres/membres",
        label: "Membres",
        icon: IoPeopleOutline,
        description: "Liste des membres",
      },
      {
        href: "/membres/administration",
        label: "Administration",
        icon: IoDocumentTextOutline,
        description: "Documents & archives",
      },
    ],
    [],
  );

  const NavLink = ({ link }: { link: NavLinkType }) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;

    return (
      <NextLink
        href={link.href}
        className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-foreground/70 hover:bg-surface-secondary hover:text-foreground"
        }`}
      >
        <Icon
          className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-foreground/50 group-hover:text-foreground"}`}
        />
        <span className="whitespace-nowrap">{link.label}</span>
        {isActive && (
          <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
        )}
      </NextLink>
    );
  };

  const currentLink = useMemo(
    () => links.find((link) => link.href === pathname),
    [links, pathname],
  );

  // Hide navigation on landing page - AFTER all hooks
  if (pathname === "/membres") {
    return null;
  }

  return (
    <nav className="border-separator bg-background/95 sticky top-0 z-40 w-full border-b shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden flex-wrap items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
          {user && (
            <div className="text-foreground/70 border-separator ml-2 flex items-center gap-2 rounded-lg border-l pl-4 text-sm font-medium">
              <span className="truncate">
                Bonjour,{" "}
                <span className="text-primary font-semibold">
                  {getFirstName(
                    user.user_metadata.display_name || user.user_metadata.name,
                  )}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Tablet Navigation - Scrollable */}
        <div className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex lg:hidden">
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink key={link.href} link={link} />
            ))}
            {user && (
              <div className="text-foreground/70 border-separator ml-2 flex items-center gap-2 rounded-lg border-l pl-4 text-sm font-medium">
                <span className="truncate">
                  Bonjour,{" "}
                  <span className="text-primary font-semibold">
                    {getFirstName(
                      user.user_metadata.display_name ||
                        user.user_metadata.name,
                    )}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Dropdown */}
        <div className="flex w-full items-center md:hidden">
          <Dropdown>
            <Button
              variant="ghost"
              className="bg-default/40 w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {currentLink && <currentLink.icon className="h-4 w-4" />}
                <span>{currentLink?.label || "Navigation"}</span>
              </div>
              <IoChevronDownOutline className="h-4 w-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Navigation membres"
                className="w-[280px]"
                onAction={(key) => router.push(key as string)}
              >
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Dropdown.Item
                      key={link.href}
                      id={link.href}
                      textValue={link.label}
                      className={`gap-3 py-3 ${isActive ? "bg-primary/5" : ""}`}
                    >
                      <div
                        className={`rounded-lg p-1.5 ${isActive ? "bg-primary/10" : "bg-surface-secondary"}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : "text-foreground/70"}`}
                        />
                      </div>
                      <Label
                        className={
                          isActive
                            ? "text-primary font-semibold"
                            : "font-medium"
                        }
                      >
                        {link.label}
                      </Label>
                      {link.description && (
                        <Description>{link.description}</Description>
                      )}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <NextLink
            href="/"
            className="text-foreground/70 hover:text-foreground border-separator hover:border-primary/20 hover:bg-surface-secondary ml-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
          >
            <IoGlobeOutline className="h-5 w-5" />
          </NextLink>
        </div>

        {/* Public Site Link - Desktop & Tablet only */}
        <div className="hidden md:block">
          <NextLink
            href="/"
            className="text-foreground/70 hover:text-foreground border-separator hover:border-primary/20 hover:bg-surface-secondary flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
          >
            <IoGlobeOutline className="h-4 w-4" />
            <span className="hidden lg:inline">Site public</span>
          </NextLink>
        </div>
      </div>
    </nav>
  );
};
