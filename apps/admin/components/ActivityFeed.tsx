"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/useActivities";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Calendar, Music, UserPlus, Users2 } from "lucide-react";

function getActivityIcon(type: string) {
  const iconClasses = "h-4 w-4 text-primary";
  switch (type) {
    case "user_created":
      return <UserPlus className={iconClasses} />;
    case "concert_created":
    case "concert_updated":
      return <Music className={iconClasses} />;
    case "group_updated":
      return <Users2 className={iconClasses} />;
    default:
      return <Calendar className={iconClasses} />;
  }
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-start space-x-4 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[200px] rounded-full" />
        <Skeleton className="h-3 w-[300px] rounded-full" />
        <Skeleton className="h-3 w-[100px] rounded-full" />
      </div>
    </div>
  );
}
export function ActivityFeed() {
  const { data: activities = [], isLoading } = useActivities(50);

  return (
    <Card className="flex h-full flex-col rounded-2xl bg-white">
      <CardHeader className="flex-none pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base font-semibold text-gray-900">
              Activités récentes
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({activities.length})
                </span>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <div className="custom-scrollbar h-full max-h-[500px] space-y-1 overflow-y-auto pr-2 lg:max-h-none">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <ActivityRowSkeleton key={index} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                Aucune activité récente à afficher
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-md p-3 hover:bg-gray-50"
              >
                <div className="bg-primary/10 mt-0.5 rounded-full p-1.5">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    {activity.profiles && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>
                          {activity.profiles.display_name ||
                            activity.profiles.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
