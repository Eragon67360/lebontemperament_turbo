"use client";

import { Badge } from "@/components/ui/badge";
import { DateBlock } from "@/components/ui/date-block";
import {
  formatDayFr,
  UPCOMING_KIND_LABEL,
  type UpcomingItem,
} from "@/utils/home/upcoming";
import Link from "next/link";

/**
 * The rows of « À venir »: the programme-style date block (teal rule for
 * concerts), the title, when and where, the kind as a chip. Each row is a
 * link to the page that manages that kind of item.
 */
export function UpcomingRows({
  items,
  now = new Date(),
}: {
  items: UpcomingItem[];
  now?: Date;
}) {
  return (
    <ul className="divide-border border-border -mx-4 divide-y border-t sm:-mx-6">
      {items.map((item) => {
        const when = [formatDayFr(item.startsAt, now), item.time]
          .filter(Boolean)
          .join(", ");
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              className="hover:bg-accent flex min-h-(--row-h) items-center gap-3 px-4 py-3 transition-colors motion-reduce:transition-none sm:px-6"
            >
              <DateBlock
                date={item.startsAt}
                tone={item.kind === "concert" ? "primary" : "neutral"}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-5 font-medium">
                  {item.title}
                </span>
                <span className="text-detail text-muted-foreground block">
                  {when}
                  {item.place ? ` · ${item.place}` : ""}
                </span>
              </span>
              <Badge
                variant={item.kind === "concert" ? "accent" : "secondary"}
                className="shrink-0 max-sm:hidden"
              >
                {UPCOMING_KIND_LABEL[item.kind]}
              </Badge>
              <span className="sr-only sm:hidden">
                {" "}
                ({UPCOMING_KIND_LABEL[item.kind]})
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
