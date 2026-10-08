"use client";

import { LinkButton } from "@/components/LinkButton";
import { useHydrated } from "@/hooks/useClientValue";
import type { Announcement } from "@/lib/announcements";
import {
  isAnnouncementLive,
  isExternalLink,
} from "@repo/domain/utils/announcements";
import { m } from "motion/react";
import { IoIosArrowRoundForward } from "react-icons/io";

/**
 * The buttons under the home page's title (admin › Site public › Annonces),
 * each between its start and end days. Decided in the browser only, like
 * the temporary calls to action they replace: the cached server HTML never
 * shows them, so it can't show one a day late.
 */
export default function HomeAnnouncements({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const live = announcements.filter((a) =>
    isAnnouncementLive({ starts_on: a.startsOn, ends_on: a.endsOn }),
  );

  return live.map((announcement, index) => {
    const external = isExternalLink(announcement.linkUrl);
    return (
      <m.div
        key={announcement.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.6 + index * 0.1,
          type: "spring",
          stiffness: 200,
        }}
        className="mt-6 flex w-fit"
      >
        <LinkButton
          size="lg"
          variant="outline"
          className="border-white/50 text-white hover:bg-white/10"
          aria-label={announcement.body ?? announcement.title}
          href={announcement.linkUrl}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {announcement.title}
          <IoIosArrowRoundForward
            className="-mr-1 ml-2 h-3 w-3 lg:h-5 lg:w-5"
            aria-hidden="true"
          />
        </LinkButton>
      </m.div>
    );
  });
}
