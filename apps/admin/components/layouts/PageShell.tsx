import { PageHeader } from "@/components/layouts/PageHeader";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/** @deprecated Section hues are gone (one accent); the prop is ignored. */
type Theme = "admin" | "members" | "public" | "anniversary" | "default";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  /**
   * Fill the content area and let the page scroll its own regions, instead of
   * growing and letting the dashboard's scroll container handle it.
   */
  fullHeight?: boolean;
  /** @deprecated Ignored since the redesign: every section shares the one teal accent. */
  theme?: Theme;
}

/**
 * Page frame: title, one-sentence description and the page's actions through
 * `PageHeader`, then the content. The breadcrumb is still rendered by the
 * dashboard shell above the page (Phase 3 moves it into the header).
 */
export function PageShell({
  children,
  className,
  contentClassName,
  title,
  description,
  headerAction,
  fullHeight = false,
  // Accepted and ignored so pages compile untouched.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  theme,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col",
        // The dashboard shell already caps the height; a page only has to fill it.
        fullHeight ? "h-full min-h-0 grow overflow-hidden" : "gap-6",
        className,
      )}
    >
      <PageHeader
        title={title}
        intro={description}
        actions={headerAction}
        className={cn(fullHeight && "mb-4 shrink-0")}
      />
      <div
        className={cn(
          fullHeight
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "flex-1",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
