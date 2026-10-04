"use client";

import { SidebarNav } from "@/components/shell/SidebarNav";
import type { NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import RouteNames from "@/utils/routes";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.lebontemperament.com";

function websiteHost() {
  try {
    return new URL(WEBSITE_URL).host.replace(/^www\./, "");
  } catch {
    return WEBSITE_URL;
  }
}

/**
 * Direction B's 280 px sidebar: brand, the navigation tree, and the way to
 * the public site. Rendered in the desktop column and inside the mobile
 * drawer (`inDrawer` leaves room for the drawer's close button).
 */
export function AppSidebar({
  sections,
  onNavigate,
  inDrawer = false,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  inDrawer?: boolean;
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
          <span className="bg-primary-soft flex size-9 shrink-0 items-center justify-center rounded-full">
            <Image
              src="/picto.svg"
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
          </span>
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

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav sections={sections} onNavigate={onNavigate} />
      </div>

      <div className="border-border shrink-0 border-t p-3">
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground hover:bg-surface-sunken flex min-h-11 items-start gap-3 rounded-md px-3 py-2 transition-colors motion-reduce:transition-none"
        >
          <ExternalLink className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="text-body block leading-6 font-medium">
              Voir le site public
            </span>
            <span className="text-note text-muted-foreground block">
              {websiteHost()}, dans un nouvel onglet
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}
