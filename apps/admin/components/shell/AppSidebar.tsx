"use client";

import { BrandMark } from "@/components/shell/BrandMark";
import { SidebarNav } from "@/components/shell/SidebarNav";
import type { NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { WEBSITE_URL } from "@/lib/website";
import RouteNames from "@/utils/routes";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Direction B's 280 px sidebar: brand, the menu, the way to the public site
 * and, on desktop, the account (`account`). Rendered in the desktop column
 * and inside the mobile drawer (`inDrawer` leaves room for the drawer's
 * close button; the header keeps the account there).
 */
export function AppSidebar({
  sections,
  onNavigate,
  inDrawer = false,
  account,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  inDrawer?: boolean;
  account?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "border-border flex h-16 shrink-0 items-center border-b px-4",
          inDrawer && "pr-14",
        )}
      >
        <Link
          href={RouteNames.DASHBOARD.ROOT}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-sm"
        >
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="text-foreground block truncate text-[15px] font-semibold">
              Le Bon Tempérament
            </span>
            <span className="text-note text-muted-foreground block">
              Administration
            </span>
          </span>
        </Link>
      </div>

      {/* The public-site link sits at the foot when there is room and scrolls
          with the menu on short screens, so it never hides « Projets ». */}
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <SidebarNav sections={sections} onNavigate={onNavigate} />

        <div className="mt-auto pt-4">
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:bg-surface-sunken hover:text-foreground flex min-h-9 items-center gap-3 rounded-md px-3 py-1.5 text-[15px] leading-[22px] font-medium transition-colors motion-reduce:transition-none pointer-coarse:min-h-11"
          >
            <ExternalLink className="size-5 shrink-0" aria-hidden />
            Voir le site public
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </div>
      </div>

      {account && (
        <div className="border-border shrink-0 border-t px-3 py-2">
          {account}
        </div>
      )}
    </div>
  );
}
