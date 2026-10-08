"use client";

import { activeNavHref, buildNavSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The campaign's own menu, above each of its pages: the sidebar shows the
 * campaign as one entry (« Projets »), so its eleven pages are reached from
 * here, one row per group of the navigation (« Contenu », « Témoignages »).
 * Rows wrap from `sm` and scroll sideways on phones.
 */
export function CampaignPagesNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const sections = buildNavSections();
  const campaign = sections.find((section) => section.id === "campaign");
  const activeHref = activeNavHref(sections, pathname);
  if (!campaign) return null;

  return (
    <nav
      aria-label="Pages de la campagne"
      className={cn("border-border border-b pb-3", className)}
    >
      <div className="flex flex-col gap-1">
        {campaign.groups.map((group) => {
          const headingId = group.label
            ? `campaign-nav-${group.id}`
            : undefined;
          return (
            <div key={group.id} className="flex min-w-0 items-start gap-2">
              {/* A fixed column, so every row's pages line up. */}
              <span
                id={headingId}
                className="text-note text-muted-foreground flex min-h-9 w-24 shrink-0 items-center font-medium pointer-coarse:min-h-11"
              >
                {group.label}
              </span>
              <ul
                aria-labelledby={headingId}
                className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 sm:flex-wrap sm:overflow-visible"
              >
                {group.items.map((item) => {
                  const isCurrent = item.href === activeHref;
                  return (
                    <li key={item.href} className="shrink-0">
                      <Link
                        href={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        // `text-detail` outside cn(): tailwind-merge reads it
                        // as a colour and would drop it next to the text colour.
                        className={`text-detail ${cn(
                          "inline-flex min-h-9 items-center rounded-full px-3 font-medium whitespace-nowrap pointer-coarse:min-h-11",
                          "transition-colors motion-reduce:transition-none",
                          isCurrent
                            ? "bg-primary-soft text-primary-text"
                            : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
                        )}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
