import { cn } from "@/lib/utils";
import { ReactNode } from "react";

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
  theme?: Theme;
}

const THEME_CLASSES: Record<Theme, string> = {
  admin: "theme-admin",
  members: "theme-members",
  public: "theme-public",
  anniversary: "",
  default: "",
};

const TITLE_CLASSES: Record<Theme, string> = {
  admin:
    "bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent",
  members:
    "bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent",
  public:
    "bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent",
  anniversary:
    "bg-gradient-to-r from-teal-600 to-pink-500 bg-clip-text text-transparent",
  default: "text-gray-900",
};

export function PageShell({
  children,
  className,
  contentClassName,
  title,
  description,
  headerAction,
  fullHeight = false,
  theme = "default",
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col",
        // The dashboard shell already caps the height; a page only has to fill it.
        fullHeight ? "h-full min-h-0 grow overflow-hidden" : "gap-6",
        THEME_CLASSES[theme],
        className,
      )}
    >
      {(title || description || headerAction) && (
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            fullHeight && "mb-4 shrink-0",
          )}
        >
          <div className="space-y-1.5">
            {title && (
              <h1
                className={cn(
                  "text-xl font-bold tracking-tight sm:text-2xl",
                  TITLE_CLASSES[theme],
                )}
              >
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
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
