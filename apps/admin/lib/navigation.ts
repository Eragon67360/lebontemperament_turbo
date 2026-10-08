import RouteNames from "@/utils/routes";
import {
  BookOpen,
  Cake,
  CalendarDays,
  FileText,
  Files,
  Film,
  FolderOpen,
  House,
  Landmark,
  LifeBuoy,
  type LucideIcon,
  Mail,
  Megaphone,
  Music,
  Music2,
  Ticket,
  Users,
  Vote,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Shown before the label in the sidebar (every page of a titled section has one). */
  icon?: LucideIcon;
  /** A number renders a count pill (hidden at 0); "dot" renders an attention dot. */
  badge?: number | "dot";
};

/** Items of a section, optionally under a small heading (« Contenu », « Témoignages »). */
export type NavGroup = {
  id: string;
  label?: string;
  items: NavItem[];
};

export type NavSection = {
  id: string;
  label: string;
  /** One line under the label: what the section is for. Must stay true as features change. */
  description: string;
  icon: LucideIcon;
  /** A section that is itself a page (Accueil) links here and has no children. */
  href?: string;
  /**
   * A project (Campagne 40 ans) is one sidebar entry under « Projets »,
   * leading to its first page; its own pages get an in-page navigation.
   */
  kind?: "project";
  groups: NavGroup[];
};

type NavContext = {
  unreadBugReports?: number;
  isSuperAdmin?: boolean;
};

/**
 * Single source of truth for the dashboard navigation (direction B, IA of
 * docs/redesign/00-inventory.md § d.1): the sidebar renders it, the header's
 * « Vous êtes ici » trail reads its labels. Routes keep their URLs; only the
 * grouping and the wording are the IA's. Only routes that exist belong here.
 *
 * Messages lives in the account menu (not here) and keeps its own badge.
 */
export function buildNavSections({
  unreadBugReports = 0,
  isSuperAdmin = false,
}: NavContext = {}): NavSection[] {
  const sections: NavSection[] = [
    {
      id: "home",
      label: "Accueil",
      description: "Ce qui vous attend et l’activité récente",
      icon: House,
      href: RouteNames.DASHBOARD.ROOT,
      groups: [],
    },
    {
      // Primary until the page is published (early 2027), then it moves to
      // an archive section: a later decision.
      id: "campaign",
      label: "Campagne 40 ans",
      description: "Préparer et publier la page des 40 ans",
      icon: Cake,
      kind: "project",
      groups: [
        {
          id: "campaign-overview",
          items: [
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.ROOT,
              label: "Vue d’ensemble et publication",
            },
          ],
        },
        {
          id: "campaign-content",
          label: "Contenu",
          items: [
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.HERO,
              label: "En-tête de la page",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.HERO_STATS,
              label: "Chiffres clés",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.NAVIGATION,
              label: "Cartes de navigation",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.TIMELINE,
              label: "Chronologie",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.VIDEOS,
              label: "Vidéos",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.AUDIO,
              label: "Souvenirs audio",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.PHOTOS,
              label: "Photos",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.ARCHIVES,
              label: "Archives",
            },
          ],
        },
        {
          id: "campaign-memories",
          label: "Témoignages",
          items: [
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.FORM,
              label: "Formulaire",
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.MEMORIES,
              label: "Modération",
            },
          ],
        },
      ],
    },
    {
      id: "public",
      label: "Concerts et site public",
      description: "Ce que le public voit sur le site",
      icon: Music2,
      groups: [
        {
          id: "public-pages",
          items: [
            {
              href: RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS,
              label: "Concerts et tournées",
              icon: Ticket,
            },
            {
              href: RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT,
              label: "Histoires de concerts",
              icon: BookOpen,
            },
            {
              href: RouteNames.DASHBOARD.PUBLIC.GALLERY.VIDEOS,
              label: "Vidéos",
              icon: Film,
            },
            {
              href: RouteNames.DASHBOARD.PUBLIC.ANNONCES,
              label: "Annonces",
              icon: Megaphone,
            },
          ],
        },
      ],
    },
    {
      id: "season",
      label: "Saison des membres",
      description: "Partitions, répétitions et événements",
      icon: CalendarDays,
      groups: [
        {
          id: "season-pages",
          items: [
            {
              href: RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT,
              label: "Partitions et documents",
              icon: FolderOpen,
            },
            {
              href: RouteNames.DASHBOARD.MEMBERS.REPETITIONS,
              label: "Répétitions",
              icon: Music,
            },
            {
              href: RouteNames.DASHBOARD.MEMBERS.EVENEMENTS,
              label: "Événements",
              icon: CalendarDays,
            },
          ],
        },
      ],
    },
    {
      id: "members",
      label: "Membres et accès",
      description: "Qui fait partie de l’association",
      icon: Users,
      groups: [
        {
          id: "members-pages",
          items: [
            {
              href: RouteNames.DASHBOARD.ADMIN.USERS,
              label: "Membres",
              icon: Users,
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.GOOGLE_GROUPS,
              label: "Liste de diffusion",
              icon: Mail,
            },
          ],
        },
      ],
    },
    {
      id: "association",
      label: "Association",
      description: isSuperAdmin
        ? "Documents, AG, comptes rendus du CA et signalements"
        : "Documents, AG et comptes rendus du CA",
      icon: Landmark,
      groups: [
        {
          id: "association-pages",
          items: [
            {
              href: RouteNames.DASHBOARD.ADMIN.DOCUMENTS,
              label: "Documents de l’association",
              icon: Files,
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.ASSEMBLIES,
              label: "Assemblée générale",
              icon: Vote,
            },
            {
              href: RouteNames.DASHBOARD.ADMIN.CA,
              label: "Comptes rendus du CA",
              icon: FileText,
            },
          ],
        },
      ],
    },
  ];

  if (isSuperAdmin) {
    sections
      .find((section) => section.id === "association")
      ?.groups[0]?.items.push({
        href: RouteNames.DASHBOARD.ADMIN.BUG_REPORTS,
        label: "Signalements",
        icon: LifeBuoy,
        badge: unreadBugReports > 0 ? "dot" : undefined,
      });
  }

  return sections;
}

/** Every link of the tree, section-level pages (Accueil) included, in reading order. */
export function flattenNavItems(sections: NavSection[]): NavItem[] {
  return sections.flatMap((section) => [
    ...(section.href ? [{ href: section.href, label: section.label }] : []),
    ...section.groups.flatMap((group) => group.items),
  ]);
}

/**
 * The nav entry a pathname belongs to: the longest href that is the path itself
 * or one of its ancestors, so nested routes light up their closest nav entry
 * instead of nothing at all.
 */
export function activeNavHref(
  sections: NavSection[],
  pathname: string,
): string | undefined {
  return flattenNavItems(sections)
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** The section that owns a nav href (a section-level page owns itself). */
export function navSectionForHref(
  sections: NavSection[],
  href: string | undefined,
): NavSection | undefined {
  if (!href) return undefined;
  return sections.find(
    (section) =>
      section.href === href ||
      section.groups.some((group) =>
        group.items.some((item) => item.href === href),
      ),
  );
}

/**
 * Whether a section is itself the current page (Accueil on /dashboard). Only
 * a section with a page can be: on a route outside the menu `activeHref` is
 * undefined, like the `href` of every collapsible section, and comparing the
 * two would mark them all as current.
 */
export function isSectionCurrent(
  section: Pick<NavSection, "href">,
  activeHref: string | undefined,
): boolean {
  return section.href !== undefined && section.href === activeHref;
}

/** Label of the nav entry for an exact href, used by the « Vous êtes ici » trail. */
export function navLabelForHref(
  sections: NavSection[],
  href: string,
): string | undefined {
  return flattenNavItems(sections).find((item) => item.href === href)?.label;
}
