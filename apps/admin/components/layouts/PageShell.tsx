import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  fullHeight?: boolean;
}

export function PageShell({
  children,
  className,
  contentClassName,
  title,
  description,
  headerAction,
  fullHeight = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col",
        fullHeight ? "h-full max-h-screen grow overflow-hidden" : "gap-6",
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
          <div className="space-y-1">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
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
