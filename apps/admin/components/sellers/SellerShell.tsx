"use client";

import { BrandMark } from "@/components/shell/BrandMark";
import { Button } from "@/components/ui/button";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

/**
 * « Mes ventes »'s frame: a slim header (the brand, « Mes ventes », the
 * seller's name and « Se déconnecter »), then the page in one scrolling
 * column. No sidebar: a seller has nothing else in the admin. An admin who
 * also sells gets a way back to the dashboard.
 */
export function SellerShell({
  name,
  isAdmin,
  children,
}: {
  name: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);

  const signOut = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await createClient().auth.signOut();
      // Drop cached rows so the next account never sees this one's buyers.
      queryClient.clear();
      router.push(RouteNames.AUTH.LOGIN);
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      setLeaving(false);
    }
  };

  return (
    <div className="bg-background flex h-dvh flex-col">
      <header className="border-border bg-card flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Link
          href={RouteNames.SELLER.ROOT}
          className="focus-visible:outline-ring flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <BrandMark />
          <span className="min-w-0">
            <span className="block truncate text-[15px] leading-5 font-semibold">
              Mes ventes
            </span>
            <span className="text-note text-muted-foreground block truncate">
              Le Bon Tempérament
            </span>
          </span>
        </Link>
        <span className="flex-1" />
        <span className="text-detail text-muted-foreground hidden truncate sm:block">
          {name}
        </span>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={RouteNames.DASHBOARD.ROOT}>
              <LayoutDashboard aria-hidden />
              <span className="max-sm:sr-only">Administration</span>
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          disabled={leaving}
          aria-busy={leaving || undefined}
        >
          {leaving ? (
            <Loader2
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <LogOut aria-hidden />
          )}
          <span className="max-sm:sr-only">Se déconnecter</span>
        </Button>
      </header>
      <main
        id="main"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8"
      >
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
