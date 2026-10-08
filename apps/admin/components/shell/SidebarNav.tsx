"use client";

import { AttentionDot, CountBadge } from "@/components/shell/NavBadge";
import {
  activeNavHref,
  isSectionCurrent,
  navSectionForHref,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The sidebar's menu, « tout à plat » (Thomas's pick, 2026-10-07): every page
 * is always visible, under its section's title, so nothing folds and nothing
 * moves under the pointer. Accueil comes first; projects (Campagne 40 ans)
 * come last under « Projets », one entry each, their pages inside the project.
 * Section descriptions live on the home page, not here.
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

  const pages = sections.filter((section) => section.href);
  const titled = sections.filter(
    (section) => !section.href && section.kind !== "project",
  );
  const projects = sections.filter((section) => section.kind === "project");

  return (
    <nav aria-label={label} className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {pages.map((section) => (
          <li key={section.id}>
            <NavEntry
              item={{
                href: section.href!,
                label: section.label,
                icon: section.icon,
              }}
              isCurrent={isSectionCurrent(section, activeHref)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>

      <NavRule />

      <div className="flex flex-col gap-3">
        {titled.map((section) => (
          <NavBlock key={section.id} id={section.id} title={section.label}>
            {section.groups
              .flatMap((group) => group.items)
              .map((item) => (
                <li key={item.href}>
                  <NavEntry
                    item={item}
                    isCurrent={item.href === activeHref}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
          </NavBlock>
        ))}
      </div>

      {projects.length > 0 && (
        <>
          <NavRule />
          <NavBlock id="projects" title="Projets">
            {projects.map((section) => {
              const first = section.groups[0]?.items[0];
              if (!first) return null;
              return (
                <li key={section.id}>
                  <NavEntry
                    item={{
                      href: first.href,
                      label: section.label,
                      icon: section.icon,
                    }}
                    isCurrent={activeSectionId === section.id}
                    onNavigate={onNavigate}
                  />
                </li>
              );
            })}
          </NavBlock>
        </>
      )}
    </nav>
  );
}

/** The thin line between Accueil, the sections and the projects. */
function NavRule() {
  return <div aria-hidden className="bg-border mx-3 my-3 h-px" />;
}

/** A section: its title in small grey type, then its pages. */
function NavBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const headingId = `nav-title-${id}`;
  return (
    <div>
      <p
        id={headingId}
        className="text-note text-muted-foreground px-3 pb-1 font-medium"
      >
        {title}
      </p>
      <ul aria-labelledby={headingId} className="flex flex-col gap-0.5">
        {children}
      </ul>
    </div>
  );
}

/** One page: icon, label, and its badge when something waits there. */
function NavEntry({
  item,
  isCurrent,
  onNavigate,
}: {
  item: NavItem;
  isCurrent: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "flex min-h-9 items-center gap-3 rounded-md px-3 py-1.5 text-[15px] leading-[22px] pointer-coarse:min-h-11",
        "transition-colors motion-reduce:transition-none",
        isCurrent
          ? "bg-primary-soft text-primary-text font-semibold"
          : "text-foreground hover:bg-surface-sunken font-medium",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "size-5 shrink-0",
            isCurrent ? "text-primary-text" : "text-muted-foreground",
          )}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge === "dot" ? (
        <AttentionDot />
      ) : item.badge ? (
        <CountBadge count={item.badge} />
      ) : null}
    </Link>
  );
}
