"use client";

import { PageTrail } from "@/components/layouts/PageHeader";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { useShellTrail } from "@/components/shell/useShellTrail";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { NavSection } from "@/lib/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * The sticky header: on phones the menu button that opens the sidebar as a
 * drawer, then « Vous êtes ici » (parent › page on phones), then the account
 * menu below `lg` (above it, the account is in the sidebar). The page
 * scrolls underneath it.
 */
export function AppHeader({
  sections,
  unreadMessages,
  onOpenMessages,
  onOpenBugReport,
}: {
  sections: NavSection[];
  unreadMessages: number;
  onOpenMessages: () => void;
  onOpenBugReport: () => void;
}) {
  const trail = useShellTrail();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A route change means the destination was reached: get the drawer out of the way.
  useResetOnChange([pathname], () => setDrawerOpen(false));

  return (
    <header className="border-border bg-background/85 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur lg:gap-4 lg:px-8">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 size-11 shrink-0 lg:hidden"
          >
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Ouvrir la navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="bg-sidebar w-[280px] max-w-[85vw] gap-0 p-0 sm:max-w-[280px]"
        >
          <VisuallyHidden>
            <SheetTitle>Navigation principale</SheetTitle>
            <SheetDescription>
              Les sections de l’espace d’administration
            </SheetDescription>
          </VisuallyHidden>
          <AppSidebar
            sections={sections}
            inDrawer
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <PageTrail items={trail} className="min-w-0 flex-1" />

      {/* From lg the account sits at the foot of the sidebar. */}
      <div className="ml-auto flex shrink-0 items-center lg:hidden">
        <AccountMenu
          unreadMessages={unreadMessages}
          onOpenMessages={onOpenMessages}
          onOpenBugReport={onOpenBugReport}
        />
      </div>
    </header>
  );
}
