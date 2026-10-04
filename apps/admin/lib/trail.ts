import {
  activeNavHref,
  navLabelForHref,
  navSectionForHref,
  type NavSection,
} from "@/lib/navigation";
import RouteNames from "@/utils/routes";

export type TrailItem = { label: string; href?: string };

const DASHBOARD_ROOT = RouteNames.DASHBOARD.ROOT;

type TrailInput = {
  pathname: string;
  sections: NavSection[];
  /** The `[programId]` segment of /dashboard/members/travail/<programId>/…, when present. */
  programId?: string;
  /**
   * Its name once loaded; `undefined` while it loads (a placeholder is shown),
   * `null` once the source has answered and does not know it (« Programme
   * introuvable », like the page).
   */
  programName?: string | null;
  /**
   * The group segment when it is a Drive folder ID (Drive programmes), to be
   * swapped for the folder's name, with the same undefined / null convention.
   * Old Storage groups are slugs: leave this unset and the slug is humanised.
   */
  groupId?: string;
  groupName?: string | null;
};

/** The `[programId]` segment of a travail route, used to swap the id for the programme name. */
export function programIdFromPathname(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "dashboard" &&
    segments[1] === "members" &&
    segments[2] === "travail"
    ? segments[3]
    : undefined;
}

/** The `[groupSlug]` segment of /dashboard/members/travail/<programId>/<groupSlug>, when present. */
export function groupSegmentFromPathname(pathname: string): string | undefined {
  return programIdFromPathname(pathname)
    ? pathname.split("/").filter(Boolean)[4]
    : undefined;
}

/**
 * « Vous êtes ici » for a dashboard pathname, worded like the sidebar
 * (inventory § d.2). A page that is a nav entry reads as its place in the
 * tree: section › group › page (section and group are plain words, they have
 * no page of their own). A deeper route keeps its nav ancestors as links and
 * ends with its dynamic tail (programme name, group slug, story slug);
 * routing-only segments (`/admin`, `/preview`) are skipped: nothing to land on.
 */
export function buildTrail({
  pathname,
  sections,
  programId,
  programName,
  groupId,
  groupName,
}: TrailInput): TrailItem[] {
  const activeHref = activeNavHref(sections, pathname);
  const section = navSectionForHref(sections, activeHref);
  // Accueil is a page: its own crumb says it all. Other sections name the job.
  const head: TrailItem[] =
    section && !section.href ? [{ label: section.label }] : [];

  if (section && activeHref === pathname) {
    if (section.href === pathname) return [{ label: section.label }];
    const group = section.groups.find((candidate) =>
      candidate.items.some((item) => item.href === pathname),
    );
    return [
      ...head,
      ...(group?.label ? [{ label: group.label }] : []),
      { label: navLabelForHref(sections, pathname) ?? humanize(pathname) },
    ];
  }

  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: TrailItem[] = [];
  let href = DASHBOARD_ROOT;

  segments.forEach((segment, index) => {
    href = `${href}/${segment}`;
    const navLabel = navLabelForHref(sections, href);
    const isLast = index === segments.length - 1;

    if (!navLabel && !isLast && segment !== programId) return;

    const label =
      navLabel ??
      (segment === programId
        ? dynamicLabel(programName, "Programme")
        : groupId && segment === groupId
          ? dynamicLabel(groupName, "Groupe")
          : humanize(segment));
    // Every surviving intermediate crumb has a page behind it, including the
    // programme id, so only the page you are on is a non-link.
    crumbs.push(isLast ? { label } : { label, href });
  });

  return [...head, ...crumbs];
}

/** « Programme… » while the name loads, « Programme introuvable » once it is known to be missing. */
function dynamicLabel(name: string | null | undefined, what: string) {
  if (name === undefined) return `${what}…`;
  return name ?? `${what} introuvable`;
}

function humanize(segment: string) {
  const words = decodeURIComponent(segment.split("/").pop() ?? segment).replace(
    /-/g,
    " ",
  );
  return words.charAt(0).toUpperCase() + words.slice(1);
}
