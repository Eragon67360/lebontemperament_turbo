"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobId, JobLink, StatusLine } from "@/utils/home/jobs";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

/**
 * One card of « Que voulez-vous faire ? »: the job's name and one-line
 * description (the sidebar's), what waits there, one or two entry points.
 */
export function JobCard({
  id,
  label,
  description,
  icon: Icon,
  lines,
  links,
  className,
}: {
  id: JobId;
  label: string;
  description: string;
  icon: LucideIcon;
  lines: StatusLine[];
  links: JobLink[];
  className?: string;
}) {
  const headingId = `job-${id}-h`;
  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "bg-card border-border flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-primary-soft text-primary-text grid size-10 shrink-0 place-items-center rounded-md"
        >
          <Icon className="size-5" />
        </span>
        <h3 id={headingId} className="text-[17px] leading-6 font-semibold">
          {label}
        </h3>
      </div>
      <p className="text-detail text-muted-foreground">{description}.</p>
      {lines.length > 0 && (
        <ul className="text-detail space-y-1.5">
          {lines.map((line) => (
            <li key={line.text} className="flex items-start gap-2">
              {line.tone === "warning" ? (
                <CircleAlert
                  className="text-warning mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              ) : line.tone === "success" ? (
                <CircleCheck
                  className="text-success mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              ) : (
                <span
                  aria-hidden
                  className="bg-foreground-faint mt-2 size-1.5 shrink-0 rounded-full"
                />
              )}
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}
      <ul className="mt-auto flex flex-wrap gap-x-1 gap-y-1 pt-1">
        {links.map((link) => (
          <li key={link.href}>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-text -ml-3"
            >
              <Link href={link.href}>
                {link.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </article>
  );
}
