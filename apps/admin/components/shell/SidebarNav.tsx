"use client";

import { AttentionDot, CountBadge } from "@/components/shell/NavBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  activeNavHref,
  isSectionCurrent,
  navSectionForHref,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** A section row: icon, label, and the open section's description (B's `.nav-item`). */
const sectionRowClassName = cn(
  "flex min-h-11 w-full items-start gap-3 rounded-md px-3 py-2 text-left text-foreground",
  "transition-colors hover:bg-surface-sunken motion-reduce:transition-none",
);

/** The teal left edge of the current entry. */
const currentClassName =
  "bg-primary-soft text-primary-text shadow-[inset_3px_0_0_var(--color-primary)] hover:bg-primary-soft";

/**
 * The sidebar's tree: six sections, one open at a time (the one that owns
 * the current page opens by itself). The open section shows its one-line
 * description under the label; the others carry it as a tooltip, so a
 * monthly visitor can still tell what is behind a label before clicking.
 */
export function SidebarNav({
  sections,
  onNavigate,
  label = "Navigation principale",
}: {
  sections: NavSection[];
  /** Called after a link is chosen, so the mobile drawer can close. */
  onNavigate?: () => void;
  /** Landmark name; only the real shell is the « Navigation principale ». */
  label?: string;
}) {
  const pathname = usePathname();
  const activeHref = activeNavHref(sections, pathname);
  const activeSectionId = navSectionForHref(sections, activeHref)?.id;

  const [openSectionId, setOpenSectionId] = useState(activeSectionId);
  // Arriving on another section's page opens that section.
  useResetOnChange([activeSectionId], () => setOpenSectionId(activeSectionId));

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {sections.map((section) => {
          const isOpen = openSectionId === section.id;
          const isCurrent = isSectionCurrent(section, activeHref);
          const rowContent = (
            <SectionRowContent
              section={section}
              showDescription={isOpen}
              isCurrent={isCurrent}
            />
          );
          // A section whose description is hidden keeps it as a tooltip and
          // accessible description; the open one shows it in the row.
          const rowTitle = isOpen ? undefined : section.description;

          if (section.href) {
            return (
              <li key={section.id}>
                <Link
                  href={section.href}
                  onClick={onNavigate}
                  aria-current={isCurrent ? "page" : undefined}
                  title={rowTitle}
                  className={cn(
                    sectionRowClassName,
                    isCurrent && currentClassName,
                  )}
                >
                  {rowContent}
                </Link>
              </li>
            );
          }

          return (
            <li key={section.id}>
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenSectionId(open ? section.id : undefined)
                }
              >
                <CollapsibleTrigger
                  title={rowTitle}
                  className={cn(sectionRowClassName, "group")}
                >
                  {rowContent}
                  <ChevronDown
                    className={cn(
                      "text-foreground-faint mt-1 size-4 shrink-0 transition-transform motion-reduce:transition-none",
                      "group-data-[state=open]:rotate-180",
                    )}
                    aria-hidden
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-0.5 mb-1.5 pl-8">
                  {section.groups.map((group) => {
                    const headingId = group.label
                      ? `nav-group-${group.id}`
                      : undefined;
                    return (
                      <div key={group.id}>
                        {group.label && (
                          <p
                            id={headingId}
                            className="text-note text-muted-foreground px-3 pt-2.5 pb-1 font-medium"
                          >
                            {group.label}
                          </p>
                        )}
                        <ul
                          aria-labelledby={headingId}
                          className="flex flex-col gap-0.5"
                        >
                          {group.items.map((item) => (
                            <li key={item.href}>
                              <NavEntry
                                item={item}
                                isCurrent={item.href === activeHref}
                                onNavigate={onNavigate}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Icon, label and, for the open section only, its description in full: one
 * description at a time instead of six truncated ones (« Préparer et publier
 * l… »). Teal only when the section is itself the current page (Accueil).
 */
export function SectionRowContent({
  section,
  showDescription,
  isCurrent,
}: {
  section: NavSection;
  showDescription: boolean;
  isCurrent: boolean;
}) {
  const Icon = section.icon;
  return (
    <>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="text-body block truncate leading-6 font-medium">
          {section.label}
        </span>
        {showDescription && (
          <span
            // Not cn(): tailwind-merge reads `text-note` as a colour and
            // would drop it next to the text colour, leaving the row's 16 px.
            className={`text-note block ${
              isCurrent ? "text-primary-text" : "text-muted-foreground"
            }`}
          >
            {section.description}
          </span>
        )}
      </span>
    </>
  );
}

/** A page link inside a section (B's `.nav-sub`). */
function NavEntry({
  item,
  isCurrent,
  onNavigate,
}: {
  item: NavItem;
  isCurrent: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-2 rounded-sm px-3 py-1.5 text-[15px] leading-[22px] pointer-coarse:min-h-11",
        "transition-colors motion-reduce:transition-none",
        isCurrent
          ? cn(currentClassName, "font-medium")
          : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge === "dot" ? (
        <AttentionDot />
      ) : item.badge ? (
        <CountBadge count={item.badge} />
      ) : null}
    </Link>
  );
}
