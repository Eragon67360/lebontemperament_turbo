import { PageSkeleton } from "@/components/ui/data-state";

/**
 * Shown while a dashboard route loads, so clicking a nav entry gives immediate
 * feedback instead of leaving the previous page frozen. Covers every nested
 * dashboard route that has no closer loading.tsx of its own.
 */
export default function DashboardLoading() {
  return <PageSkeleton />;
}
