// components/BreadcrumbNav.tsx
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const [programNames, setProgramNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProgramNames = async () => {
      const supabase = createClient();
      const segments = pathname.split("/");

      // Find program IDs in the path
      const programIdIndex =
        segments.findIndex((segment) => segment === "travail") + 1;

      if (programIdIndex > 0 && segments[programIdIndex]) {
        const programId = segments[programIdIndex];

        // Only fetch if we haven't already
        if (!programNames[programId]) {
          const { data } = await supabase
            .from("programs")
            .select("name")
            .eq("id", programId)
            .single();

          if (data) {
            setProgramNames((prev) => ({
              ...prev,
              [programId]: data.name,
            }));
          }
        }
      }
    };

    fetchProgramNames();
  }, [pathname, programNames]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname
      .split("/")
      .filter((segment) => segment !== "" && segment !== "dashboard");

    const items: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/dashboard" },
    ];

    segments.forEach((segment, index) => {
      const href = `/dashboard/${segments.slice(0, index + 1).join("/")}`;

      // Check if this segment is a program ID
      const isProgramId = segments[index - 1] === "travail";
      const label = isProgramId
        ? programNames[segment] || "Programme..." // Use stored program name
        : segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

      items.push({
        label,
        href,
        isCurrentPage: index === segments.length - 1,
      });
    });

    return items;
  }, [pathname, programNames]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem key={breadcrumb.href}>
            {breadcrumb.isCurrentPage ? (
              <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={breadcrumb.href}>
                {breadcrumb.label}
              </BreadcrumbLink>
            )}
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
