"use client";

import { Button } from "@/components/ui/button";
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
import { useActivities } from "@/hooks/useActivities";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  Calendar,
  type LucideIcon,
  Music,
  UserPlus,
  Users2,
} from "lucide-react";
import { useState } from "react";

const ACTIVITIES_FETCHED = 20;
const ACTIVITIES_SHOWN = 6;

function activityIcon(type: string): LucideIcon {
  switch (type) {
    case "user_created":
      return UserPlus;
    case "concert_created":
    case "concert_updated":
      return Music;
    case "group_updated":
      return Users2;
    default:
      return Calendar;
  }
}

/**
 * « Activité récente »: the activity log, compact and last on the home. The
 * first rows are shown; the rest unfolds on demand.
 */
export function ActivityFeed({ className }: { className?: string }) {
  const {
    data: activities = [],
    isLoading,
    isError,
    refetch,
  } = useActivities(ACTIVITIES_FETCHED);
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? activities : activities.slice(0, ACTIVITIES_SHOWN);
  const hidden = activities.length - shown.length;

  return (
    <section aria-labelledby="activity-h" className={className}>
      <Card>
        <CardHeader>
          <h2 id="activity-h" className="text-[17px] leading-6 font-semibold">
            Activité récente
          </h2>
          <CardDescription>
            Les dernières actions dans l’administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={activities.length === 0}
            onRetry={() => refetch()}
            errorDescription="Le fil d'activité n'a pas pu être chargé."
            skeleton={
              <ListSkeleton rows={4} label="Chargement de l'activité…" />
            }
            empty={
              <EmptyState
                icon={Bell}
                title="Aucune activité récente"
                description="Les comptes créés et les concerts ajoutés ou modifiés s'inscrivent ici."
                className="py-8"
              />
            }
          >
            <ul className="divide-border border-border -mx-4 divide-y border-t sm:-mx-6">
              {shown.map((activity) => {
                const Icon = activityIcon(activity.type);
                return (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 px-4 py-3 sm:px-6"
                  >
                    <span
                      aria-hidden
                      className="bg-primary-soft text-primary-text mt-0.5 grid size-8 shrink-0 place-items-center rounded-md"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-5 font-medium">
                        {activity.title}
                      </p>
                      <p className="text-detail text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-note text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                        {activity.profiles && (
                          <>
                            {" · "}
                            {activity.profiles.display_name ||
                              activity.profiles.email}
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {hidden > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-text mt-3 -ml-3"
                onClick={() => setExpanded(true)}
              >
                Afficher les {hidden} suivantes
              </Button>
            )}
          </DataState>
        </CardContent>
      </Card>
    </section>
  );
}
