import RouteNames from "@/utils/routes";
import {
  Archive,
  BarChart3,
  Briefcase,
  Bug,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  type LucideIcon,
  Map,
  MessageCircle,
  MessageSquare,
  PartyPopper,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

/** Sentinel href: opens the messages dialog instead of navigating. */
export const MESSAGES_ACTION = "#messages";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** A number renders a count pill (hidden at 0); "dot" renders an attention dot. */
  badge?: number | "dot";
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
  /** Secondary sections collapse by default and read as lower priority. */
  secondary?: boolean;
};

type NavContext = {
  unreadMessages?: number;
  unreadBugReports?: number;
  isSuperAdmin?: boolean;
};

/**
 * Single source of truth for the dashboard navigation: the sidebar renders it and
 * the breadcrumbs read their labels from it. Only routes that actually exist and
 * work belong here.
 */
export function buildNavSections({
  unreadMessages = 0,
  unreadBugReports = 0,
  isSuperAdmin = false,
}: NavContext = {}): NavSection[] {
  const sections: NavSection[] = [
    {
      id: "general",
      label: "Général",
      items: [
        {
          href: RouteNames.DASHBOARD.ROOT,
          label: "Tableau de bord",
          icon: LayoutDashboard,
        },
        {
          href: MESSAGES_ACTION,
          label: "Messages",
          icon: MessageCircle,
          badge: unreadMessages,
        },
      ],
    },
    {
      id: "public",
      label: "Site public",
      items: [
        {
          href: RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS,
          label: "Prochains concerts",
          icon: Calendar,
        },
        {
          href: RouteNames.DASHBOARD.PUBLIC.PROJETS.ROOT,
          label: "Projets",
          icon: Sparkles,
        },
        {
          href: RouteNames.DASHBOARD.PUBLIC.GALLERY.VIDEOS,
          label: "Galerie vidéos",
          icon: Video,
        },
      ],
    },
    {
      id: "members",
      label: "Espace membres",
      items: [
        {
          href: RouteNames.DASHBOARD.MEMBERS.REPETITIONS,
          label: "Répétitions",
          icon: CalendarDays,
        },
        {
          href: RouteNames.DASHBOARD.MEMBERS.EVENEMENTS,
          label: "Événements",
          icon: Calendar,
        },
        {
          href: RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT,
          label: "Espace de travail",
          icon: Briefcase,
        },
      ],
    },
    {
      id: "administration",
      label: "Administration",
      items: [
        {
          href: RouteNames.DASHBOARD.ADMIN.USERS,
          label: "Utilisateurs",
          icon: Users,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.GOOGLE_GROUPS,
          label: "Groupes Google",
          icon: Users,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.CA,
          label: "Conseil d'administration",
          icon: Building2,
        },
      ],
    },
    {
      id: "anniversary",
      label: "Campagne 40 ans",
      secondary: true,
      items: [
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.ROOT,
          label: "Gestion de la page",
          icon: PartyPopper,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.HERO,
          label: "Section Hero",
          icon: Sparkles,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.HERO_STATS,
          label: "Statistiques Hero",
          icon: BarChart3,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.NAVIGATION,
          label: "Cartes de navigation",
          icon: Map,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.TIMELINE,
          label: "Chronologie",
          icon: Clock,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.VIDEOS,
          label: "Galerie vidéo",
          icon: Video,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.AUDIO,
          label: "Mémoires audio",
          icon: Headphones,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.PHOTOS,
          label: "Collection photos",
          icon: ImageIcon,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.ARCHIVES,
          label: "Archives publiques",
          icon: Archive,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.FORM,
          label: "Configuration formulaire",
          icon: FileText,
        },
        {
          href: RouteNames.DASHBOARD.ADMIN.ANNIVERSARY.MEMORIES,
          label: "Modération témoignages",
          icon: MessageSquare,
        },
      ],
    },
  ];

  if (isSuperAdmin) {
    sections
      .find((section) => section.id === "administration")
      ?.items.push({
        href: RouteNames.DASHBOARD.ADMIN.BUG_REPORTS,
        label: "Rapports de bugs",
        icon: Bug,
        badge: unreadBugReports > 0 ? "dot" : undefined,
      });
  }

  return sections;
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
  return sections
    .flatMap((section) => section.items.map((item) => item.href))
    .filter(
      (href) =>
        href !== MESSAGES_ACTION &&
        (pathname === href || pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.length - a.length)[0];
}

/** Label of the nav entry for an exact href, used by the breadcrumb trail. */
export function navLabelForHref(
  sections: NavSection[],
  href: string,
): string | undefined {
  return sections
    .flatMap((section) => section.items)
    .find((item) => item.href === href)?.label;
}
