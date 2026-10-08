import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The four states every data-driven page has: loading, empty, error, loaded.
 * Pages compose these instead of hand-rolling their own, so a list looks the
 * same whether it is users, concerts or archives.
 */

/**
 * Picks the right state for a query-backed region, so pages stop growing
 * three-deep ternaries around every list.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  errorDescription,
  skeleton,
  empty,
  children,
}: {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  errorDescription?: string;
  skeleton: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}) {
  if (isError)
    return (
      <ErrorState
        description={errorDescription}
        onRetry={onRetry}
        className="py-8"
      />
    );
  if (isLoading) return <>{skeleton}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}

/**
 * Wraps a skeleton so assistive tech hears "loading" instead of nothing.
 * Exported for a skeleton shaped like one specific card (the home's
 * « Prochain concert »); lists and grids use the skeletons below.
 */
export function LoadingRegion({
  label = "Chargement…",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

/** Rows of avatar + two lines: members, groups, documents, feed entries. */
export function ListSkeleton({
  rows = 5,
  className,
  label,
}: {
  rows?: number;
  className?: string;
  label?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-md p-2">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Card grid placeholder matching the 1 / 2 / 3 column grids pages use. */
export function CardGridSkeleton({
  cards = 6,
  className,
  label,
}: {
  cards?: number;
  className?: string;
  label?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Whole-page placeholder for route transitions (app/dashboard/loading.tsx). */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
      <LoadingRegion label="Chargement de la page…">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </LoadingRegion>
    </div>
  );
}

/** Nothing here yet: says why, and offers the action that fixes it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-md bg-primary-soft text-primary-text">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h2 className="text-base leading-6 font-semibold text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-sm text-detail text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Something failed: says so, and lets the user try again in place. */
export function ErrorState({
  title = "Le chargement a échoué",
  description = "Vérifiez votre connexion, puis réessayez.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-md bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h2 className="text-base leading-6 font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-sm text-detail text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Réessayer
        </Button>
      )}
    </div>
  );
}
