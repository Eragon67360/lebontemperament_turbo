"use client";

import { SourceNote, sourceStates } from "@/components/home/SourceNote";
import { TaskRows } from "@/components/home/TaskRows";
import { CountBadge } from "@/components/shell/NavBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { useAnniversaryReadiness } from "@/hooks/useAnniversaryReadiness";
import { useDriveSyncRuns } from "@/hooks/useDriveSync";
import { useMyBugReports } from "@/hooks/useMyBugReports";
import {
  buildHomeTasks,
  driveSyncAttention,
  summarizeReadiness,
} from "@/utils/home/tasks";
import { CircleCheck } from "lucide-react";
import { useMemo } from "react";

/**
 * « À faire »: what waits for the admin, most pressing first. Three read-only
 * sources; the unread count is the same query the account menu polls, so
 * nothing is fetched twice. A source that fails leaves its rows out and is
 * named under the list.
 */
export function TodoSection({ className }: { className?: string }) {
  const readiness = useAnniversaryReadiness();
  const reports = useMyBugReports();
  const runs = useDriveSyncRuns();

  const tasks = useMemo(() => {
    const summary = readiness.data
      ? summarizeReadiness(readiness.data)
      : undefined;
    return buildHomeTasks({
      memoriesPending: summary?.pendingMemories,
      sectionsToComplete: summary?.sectionsToComplete,
      unreadMessages: reports.data
        ? reports.data.reduce(
            (total, report) => total + (report.unread_count || 0),
            0,
          )
        : undefined,
      driveSync: runs.data ? driveSyncAttention(runs.data) : undefined,
    });
  }, [readiness.data, reports.data, runs.data]);

  const sources = sourceStates([
    { label: "l'état de la campagne", ...readiness },
    { label: "vos messages", ...reports },
    { label: "la synchronisation Drive", ...runs },
  ]);

  return (
    <section aria-labelledby="todo-h" className={className}>
      <Card>
        <CardHeader>
          <h2
            id="todo-h"
            className="flex items-center gap-2 text-[17px] leading-6 font-semibold"
          >
            À faire
            {!sources.isLoading && tasks.length > 0 && (
              <CountBadge
                count={tasks.length}
                srLabel={tasks.length > 1 ? "tâches" : "tâche"}
              />
            )}
          </h2>
          <CardDescription>
            Ce qui attend une décision de votre part, du plus pressant au moins
            pressant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={sources.isLoading}
            isError={sources.isError}
            onRetry={sources.retryAll}
            errorDescription="Ce qui vous attend n'a pas pu être chargé."
            skeleton={
              <ListSkeleton rows={3} label="Recherche de ce qui vous attend…" />
            }
          >
            {tasks.length > 0 ? (
              <TaskRows tasks={tasks} />
            ) : (
              <EmptyState
                icon={CircleCheck}
                title="Rien à faire pour l'instant"
                description="Quand un témoignage, un message ou une synchronisation Drive attend votre avis, il apparaît ici."
                className="py-8"
              />
            )}
            <SourceNote failed={sources.failed} className="mt-4" />
          </DataState>
        </CardContent>
      </Card>
    </section>
  );
}
