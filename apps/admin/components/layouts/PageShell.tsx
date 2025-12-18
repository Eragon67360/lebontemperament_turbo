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
  fullHeight?: boolean;
  theme?: Theme;
}

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
  const getThemeClasses = () => {
    switch (theme) {
      case "admin":
        return "theme-admin";
      case "members":
        return "theme-members";
      case "public":
        return "theme-public";
      default:
        return "";
    }
  };

  const getTitleColorClass = () => {
    switch (theme) {
      case "admin":
        return "bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent";
      case "members":
        return "bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent";
      case "public":
        return "bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent";
      case "anniversary":
        return "bg-gradient-to-r from-teal-600 to-pink-500 bg-clip-text text-transparent";
      default:
        return "text-gray-900";
    }
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col",
        fullHeight ? "h-full max-h-screen grow overflow-hidden" : "gap-6",
        getThemeClasses(),
        className,
      )}
    >
      {(title || description || headerAction) && (
        <div
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            fullHeight && "mb-4 flex-shrink-0",
          )}
        >
          <div className="space-y-1.5">
            {title && (
              <h1
                className={cn(
                  "transition-smooth text-2xl font-bold tracking-tight",
                  getTitleColorClass(),
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
          {headerAction && <div>{headerAction}</div>}
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
