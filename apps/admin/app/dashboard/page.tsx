"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardWelcomeHeader } from "@/components/DashboardWelcomeUser";
import { CampaignSection } from "@/components/home/CampaignSection";
import { JobsSection } from "@/components/home/JobsSection";
import { NextConcertSection } from "@/components/home/NextConcertSection";
import { TodoSection } from "@/components/home/TodoSection";
import { UpcomingSection } from "@/components/home/UpcomingSection";
import { PageShell } from "@/components/layouts/PageShell";

/**
 * Accueil, direction B's hub (#473): the greeting and the next concert, then
 * what to do, what is coming, where the campaign stands, one door per job,
 * and the activity log. Each section owns its queries and its loading, empty
 * and error states, so one failing source never blanks the page. Nothing
 * here writes, and nothing calls an external service: the roster and Drive
 * syncs stay one click away.
 *
 * The DOM is the phone's reading order (next concert, to do, coming up,
 * campaign, jobs, activity), so keyboard and screen-reader order equal the
 * visual order at every width; the next concert spans the width, then from
 * `xl` the grid places each section in its column.
 */
export default function DashboardPage() {
  return (
    <PageShell className="py-4 sm:py-6">
      <DashboardWelcomeHeader />
      <NextConcertSection className="mt-6" />
      <div className="mt-6 flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start">
        <TodoSection className="xl:col-start-1 xl:row-start-1" />
        <UpcomingSection className="xl:col-start-2 xl:row-start-2 xl:row-end-4" />
        <CampaignSection className="xl:col-start-2 xl:row-start-1" />
        <JobsSection className="xl:col-start-1 xl:row-start-2" />
        <ActivityFeed className="xl:col-start-1 xl:row-start-3" />
      </div>
    </PageShell>
  );
}
