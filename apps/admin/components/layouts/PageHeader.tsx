import { cn } from "@/lib/utils";
import { ChevronRight, CircleHelp } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export type PageHeaderTrailItem = {
  label: string;
  /** Omit on the last item: it is the page you are on. */
  href?: string;
};

export interface PageHeaderProps {
  /** « Vous êtes ici » trail: parent › … › current page. Rendered only when given. */
  trail?: PageHeaderTrailItem[];
  title?: ReactNode;
  /** One sentence: what this page is for. */
  intro?: ReactNode;
  /** The page's actions; one of them is the single filled primary button. */
  actions?: ReactNode;
  /** Collapsed « Comment ça marche ? » disclosure, for help that would otherwise be an inline manual. */
  help?: ReactNode;
  /** Label of the help disclosure. */
  helpLabel?: string;
  /** Rendered as the heading element (default h1). */
  as?: "h1" | "h2";
  className?: string;
  /** Classes of the title element (PageShell callers pass theirs through). */
  titleClassName?: string;
}

/**
 * Where am I, what is this, what next: trail, title, one-sentence intro and
 * the page's actions. Direction B puts this at the top of every screen. The
 * shell's header already shows « Vous êtes ici » for every route
 * (`components/shell/AppHeader.tsx`, from the nav labels), so pages leave
 * `trail` empty unless they need a deeper, page-specific one.
 */
export function PageHeader({
  trail,
  title,
  intro,
  actions,
  help,
  helpLabel = "Comment ça marche ?",
  as: Heading = "h1",
  className,
  titleClassName,
}: PageHeaderProps) {
  if (!trail?.length && !title && !intro && !actions && !help) return null;

  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {trail && trail.length > 0 && <PageTrail items={trail} />}
      {(title || intro || actions) && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="max-w-[64ch] min-w-0 space-y-1">
            {title && (
              <Heading
                className={cn(
                  "text-foreground lg:text-title text-2xl leading-8 font-semibold tracking-[-0.01em]",
                  titleClassName,
                )}
              >
                {title}
              </Heading>
            )}
            {intro && (
              <p className="text-muted-foreground text-base leading-6">
                {intro}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {help && (
        <details className="group border-border bg-card w-fit max-w-full rounded-md border open:w-full">
          <summary className="text-primary-text hover:bg-accent flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-md px-3.5 py-1.5 text-[15px] font-medium transition-colors motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
            <CircleHelp className="size-5 shrink-0" aria-hidden />
            {helpLabel}
          </summary>
          <div className="border-border text-foreground border-t px-4 py-3.5 text-[15px] leading-6 [&_ol]:grid [&_ol]:list-decimal [&_ol]:gap-1 [&_ol]:pl-5 [&_p+p]:mt-2">
            {help}
          </div>
        </details>
      )}
    </header>
  );
}

/** « Vous êtes ici : parent › page » */
export function PageTrail({
  items,
  className,
}: {
  items: PageHeaderTrailItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Vous êtes ici"
      className={cn(
        "text-detail text-muted-foreground flex min-w-0 items-center gap-2",
        className,
      )}
    >
      <span className="shrink-0 max-sm:hidden">Vous êtes ici :</span>
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                // A phone fits the parent and the page; earlier crumbs go.
                index < items.length - 2 && "max-sm:hidden",
              )}
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground truncate rounded-sm underline-offset-[3px] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast && "text-foreground font-medium",
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="text-foreground-faint size-4 shrink-0"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
