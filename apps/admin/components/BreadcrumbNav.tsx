"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buildNavSections, navLabelForHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

const DASHBOARD_ROOT = RouteNames.DASHBOARD.ROOT;

type Crumb = { label: string; href?: string };

/**
 * Where am I: a trail built from the nav tree, so labels match the sidebar
 * wording. Only known nav destinations become links; routing-only segments
 * (`/admin`) are skipped because they have no page to land on.
 */
export function BreadcrumbNav({ className }: { className?: string }) {
  const pathname = usePathname();
  // Labels only, so include role-gated entries: the crumb for a page you are
  // already on should read the same as its nav entry.
  const sections = useMemo(() => buildNavSections({ isSuperAdmin: true }), []);

  const segments = pathname.split("/").filter(Boolean).slice(1);
  // /dashboard/members/travail/<programId>/<groupSlug>
  const programId =
    segments[0] === "members" && segments[1] === "travail"
      ? segments[2]
      : undefined;
  const { data: programName } = useProgramName(programId);

  const crumbs = useMemo<Crumb[]>(() => {
    const trail: Crumb[] = [];
    let href = DASHBOARD_ROOT;

    segments.forEach((segment, index) => {
      href = `${href}/${segment}`;
      const navLabel = navLabelForHref(sections, href);
      const isLast = index === segments.length - 1;

      if (!navLabel && !isLast && segment !== programId) return;

      trail.push({
        label:
          navLabel ??
          (segment === programId
            ? (programName ?? "Programme…")
            : humanize(segment)),
        href: isLast || !navLabel ? undefined : href,
      });
    });

    return trail;
  }, [segments, sections, programId, programName]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap text-xs sm:text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink href={DASHBOARD_ROOT}>Tableau de bord</BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              {crumb.href ? (
                <BreadcrumbLink href={crumb.href} className="truncate">
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">
                  {crumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function useProgramName(programId?: string) {
  return useQuery({
    queryKey: ["program-name", programId],
    queryFn: async () => {
      const { data } = await createClient()
        .from("programs")
        .select("name")
        .eq("id", programId!)
        .single();

      return data?.name ?? null;
    },
    enabled: !!programId,
    staleTime: Infinity,
  });
}

function humanize(segment: string) {
  const words = decodeURIComponent(segment).replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
