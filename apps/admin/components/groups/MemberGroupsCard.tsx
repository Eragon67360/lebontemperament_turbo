"use client";

import { GroupTile } from "@/components/groups/GroupIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotInstalledError } from "@/hooks/useDocuments";
import { useGroups } from "@/hooks/useGroups";
import { sortGroups } from "@/utils/groups/view";
import RouteNames from "@/utils/routes";
import { GROUP_KIND_LABELS } from "@repo/domain/utils/memberGroups";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

/**
 * « Groupes » of a member's page: the groups the person is in, each a link
 * to its page (where they are added or removed). Hidden before the groups
 * migration; quiet while loading or on an error (the page has its own).
 */
export function MemberGroupsCard({
  userId,
  firstName,
}: {
  userId: string;
  firstName: string;
}) {
  const { data, error } = useGroups();
  const groups = useMemo(
    () =>
      sortGroups(
        (data?.groups ?? []).filter(
          (g) => g.archived_at === null && g.member_ids.includes(userId),
        ),
      ),
    [data, userId],
  );
  if (error instanceof NotInstalledError || !data) return null;

  return (
    <Card className="p-4 sm:p-6">
      <section aria-labelledby="member-groups-heading">
        <h2
          id="member-groups-heading"
          className="text-[17px] leading-6 font-semibold"
        >
          Groupes
        </h2>
        <p className="text-detail text-muted-foreground mt-1 mb-4">
          {groups.length === 0
            ? `${firstName} ne fait partie d’aucun groupe.`
            : `${firstName} voit les événements réservés à ces groupes.`}
        </p>
        {groups.length > 0 && (
          <ul className="border-border divide-border mb-3 divide-y rounded-md border">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={RouteNames.DASHBOARD.ADMIN.GROUP(group.id)}
                  className="hover:bg-muted/60 focus-visible:outline-ring flex min-h-12 items-center gap-3 px-3 py-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                  <GroupTile
                    icon={group.icon}
                    color={group.color}
                    className="size-8 rounded-md [&>svg]:size-4"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {group.name}
                    </span>
                    <span className="text-note text-muted-foreground block">
                      {GROUP_KIND_LABELS[group.kind]}
                    </span>
                  </span>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="link" className="h-auto px-0">
          <Link href={RouteNames.DASHBOARD.ADMIN.GROUPS}>Tous les groupes</Link>
        </Button>
      </section>
    </Card>
  );
}
