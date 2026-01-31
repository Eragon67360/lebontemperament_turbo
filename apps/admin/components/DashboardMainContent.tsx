"use client";

import { cn } from "@/lib/utils";
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
        "flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl",
        path === "/dashboard" ? "bg-white/50" : "bg-white",
      )}
    >
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 md:overflow-y-hidden md:px-6">
        <PageTransition>{children}</PageTransition>
      </div>
    </main>
  );
}
