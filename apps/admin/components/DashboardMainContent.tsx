"use client";

import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { cn } from "@/lib/utils";
import RouteNames from "@/utils/routes";
import { usePathname } from "next/navigation";
import { PageTransition } from "./PageTransition";

export function DashboardMainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();

  return (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl",
        path === RouteNames.DASHBOARD.ROOT ? "bg-white/50" : "bg-white",
      )}
    >
      <BreadcrumbNav className="shrink-0 px-4 pt-3 md:px-6" />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 md:px-6">
        <PageTransition>{children}</PageTransition>
      </div>
    </main>
  );
}
