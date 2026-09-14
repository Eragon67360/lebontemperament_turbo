"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  activeNavHref,
  MESSAGES_ACTION,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Variant = "desktop" | "mobile";

export function SidebarNav({
  sections,
  variant = "desktop",
  onNavigate,
  onMessagesClick,
}: {
  sections: NavSection[];
  variant?: Variant;
  onNavigate?: () => void;
  onMessagesClick?: () => void;
}) {
  const pathname = usePathname();
  const activeHref = activeNavHref(sections, pathname);
  const activeSectionId = sections.find((section) =>
    section.items.some((item) => item.href === activeHref),
  )?.id;

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(variant === "mobile" ? "space-y-1" : "space-y-6")}
    >
      {sections.map((section) => {
        // Mobile shows one section at a time so the whole tree fits a phone screen;
        // desktop keeps everyday sections open and tucks secondary ones away.
        const isCollapsible = variant === "mobile" || section.secondary;
        const defaultOpen =
          variant === "mobile"
            ? section.id === activeSectionId
            : !section.secondary;

        const items = (
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavEntry
                key={item.href}
                item={item}
                variant={variant}
                isActive={item.href === activeHref}
                onNavigate={onNavigate}
                onMessagesClick={onMessagesClick}
              />
            ))}
          </div>
        );

        if (!isCollapsible) {
          return (
            <div key={section.id}>
              <h3 className="mb-2 px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                {section.label}
              </h3>
              {items}
            </div>
          );
        }

        return (
          <Collapsible key={section.id} defaultOpen={defaultOpen}>
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase",
                "transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-gray-600",
                variant === "mobile" ? "min-h-11 py-2" : "mb-2 py-1.5",
              )}
            >
              <span>{section.label}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                  "group-data-[state=closed]:-rotate-90 motion-reduce:transition-none",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1">{items}</CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}

function NavEntry({
  item,
  variant,
  isActive,
  onNavigate,
  onMessagesClick,
}: {
  item: NavItem;
  variant: Variant;
  isActive: boolean;
  onNavigate?: () => void;
  onMessagesClick?: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "group flex w-full items-center rounded-xl px-4 text-sm font-medium",
    "transition-[color,background-color,transform] duration-150 ease-out",
    "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
    variant === "mobile" ? "min-h-11 py-2.5" : "py-2.5",
    isActive
      ? "bg-primary/10 text-primary font-semibold"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  );

  const content = (
    <>
      <Icon
        className={cn(
          "mr-3 h-4 w-4 shrink-0",
          isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500",
        )}
      />
      <span className="truncate">{item.label}</span>
      <NavBadge badge={item.badge} />
    </>
  );

  // The messages entry opens a dialog rather than navigating to a route.
  if (item.href === MESSAGES_ACTION) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onMessagesClick?.();
          // Let the dialog mount before the mobile sheet closes around it.
          setTimeout(() => onNavigate?.(), 0);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

function NavBadge({ badge }: { badge: NavItem["badge"] }) {
  if (badge === "dot") {
    return (
      <span className="relative ml-auto flex h-2 w-2 shrink-0">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none"
          aria-hidden
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        <span className="sr-only">Éléments non lus</span>
      </span>
    );
  }

  if (!badge) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">
      {badge > 99 ? "99+" : badge}
      <span className="sr-only"> non lus</span>
    </span>
  );
}
