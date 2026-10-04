"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardWelcomeHeader } from "@/components/DashboardWelcomeUser";
import { CampaignSection } from "@/components/home/CampaignSection";
import { JobsSection } from "@/components/home/JobsSection";
import { TodoSection } from "@/components/home/TodoSection";
import { UpcomingSection } from "@/components/home/UpcomingSection";
import { PageShell } from "@/components/layouts/PageShell";

/**
 * Accueil, direction B's hub (#473): what to do, what is coming, where the
 * campaign stands, one door per job, then the activity log. Each section
 * owns its queries and its loading, empty and error states, so one failing
 * source never blanks the page. Nothing here writes, and nothing calls an
 * external service: the roster and Drive syncs stay one click away.
 *
 * From `xl` the sections sit in two columns; below, the column wrappers
 * dissolve (`contents`) and `order` gives the phone's reading order: to do,
 * coming up, campaign, jobs, activity.
 */
export default function DashboardPage() {
  return (
    <PageShell className="py-4 sm:py-6">
      <DashboardWelcomeHeader />
      <div className="mt-6 flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-6 max-xl:contents">
          <TodoSection className="max-xl:order-1" />
          <JobsSection className="max-xl:order-4" />
          <ActivityFeed className="max-xl:order-5" />
        </div>
        <div className="flex min-w-0 flex-col gap-6 max-xl:contents">
          <CampaignSection className="max-xl:order-3" />
          <UpcomingSection className="max-xl:order-2" />
        </div>
      </div>
    </PageShell>
  );
}
