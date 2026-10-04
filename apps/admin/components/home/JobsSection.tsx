"use client";

import { ANNIVERSARY_FLAG } from "@/components/home/CampaignSection";
import { JobCard } from "@/components/home/JobCard";
import { useAnniversaryReadiness } from "@/hooks/useAnniversaryReadiness";
import { useConcerts } from "@/hooks/useConcerts";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useDriveSyncRuns } from "@/hooks/useDriveSync";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { useRehearsals } from "@/hooks/useRehearsals";
import { useUnreadBugReports } from "@/hooks/useUnreadBugReports";
import { useUsers } from "@/hooks/useUsers";
import { buildNavSections } from "@/lib/navigation";
import { formatRunDate } from "@/utils/driveSync";
import {
  JOB_IDS,
  jobLinks,
  jobStatusLines,
  type JobId,
} from "@/utils/home/jobs";
import { driveSyncAttention, summarizeReadiness } from "@/utils/home/tasks";
import { nextConcert, nextRehearsal } from "@/utils/home/upcoming";
import { useMemo } from "react";

/**
 * « Que voulez-vous faire ? »: one card per job of the IA, with the sidebar's
 * wording, its key links and a status line from what the home has already
 * loaded (every query here is shared with another section or the shell, so
 * nothing is fetched twice; `/api/users` is the admin's own list, never the
 * roster download).
 */
export function JobsSection({ className }: { className?: string }) {
  const profile = useCurrentProfile();
  const isSuperAdmin = profile.data?.role === "superadmin";

  const readiness = useAnniversaryReadiness();
  const flag = useFeatureFlag(ANNIVERSARY_FLAG);
  const concerts = useConcerts();
  const rehearsals = useRehearsals();
  const runs = useDriveSyncRuns();
  const users = useUsers();
  const unreadReports = useUnreadBugReports();

  const sections = useMemo(
    () =>
      buildNavSections({ isSuperAdmin }).filter((section) =>
        (JOB_IDS as string[]).includes(section.id),
      ),
    [isSuperAdmin],
  );

  const lines = useMemo(() => {
    const lastSuccess = runs.data?.find((run) => run.status === "success");
    return jobStatusLines({
      readiness: readiness.data
        ? summarizeReadiness(readiness.data)
        : undefined,
      campaignPublished: flag.data ? flag.data.is_enabled === true : undefined,
      nextConcert: concerts.data ? nextConcert(concerts.data) : undefined,
      driveSync: runs.data ? driveSyncAttention(runs.data) : undefined,
      lastDriveSync: runs.data
        ? lastSuccess
          ? {
              when: formatRunDate(
                lastSuccess.finished_at || lastSuccess.started_at,
              ),
              counts: lastSuccess.counts,
            }
          : null
        : undefined,
      nextRehearsal: rehearsals.data
        ? nextRehearsal(rehearsals.data)
        : undefined,
      members: users.data
        ? {
            total: users.data.length,
            pendingInvitations: users.data.filter(
              (user) => user.invite_status === "en attente",
            ).length,
          }
        : undefined,
      isSuperAdmin,
      unreadReports: unreadReports.data,
    });
  }, [
    readiness.data,
    flag.data,
    concerts.data,
    rehearsals.data,
    runs.data,
    users.data,
    isSuperAdmin,
    unreadReports.data,
  ]);

  return (
    <section aria-labelledby="jobs-h" className={className}>
      <div className="mb-3">
        <h2 id="jobs-h" className="text-section">
          Que voulez-vous faire ?
        </h2>
        <p className="text-detail text-muted-foreground mt-1">
          Un espace par tâche, les mêmes que dans le menu, avec ce qui vous y
          attend.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const id = section.id as JobId;
          return (
            <JobCard
              key={id}
              id={id}
              label={section.label}
              description={section.description}
              icon={section.icon}
              lines={lines[id]}
              links={jobLinks(id, isSuperAdmin)}
              className={id === "association" ? "sm:col-span-2" : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}
