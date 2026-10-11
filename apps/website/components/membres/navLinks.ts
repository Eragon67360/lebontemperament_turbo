import type { ElementType } from "react";
import {
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoTicketOutline,
} from "react-icons/io5";

export interface MembersNavLink {
  href: string;
  label: string;
  icon: ElementType;
  /** One line shown in the phone menu. */
  description: string;
}

/** The members area's six sections, in the order of the header. */
export const MEMBERS_NAV_LINKS: readonly MembersNavLink[] = [
  {
    href: "/membres",
    label: "Accueil",
    icon: IoHomeOutline,
    description: "Ta prochaine répétition et tout ce que tu peux faire.",
  },
  {
    href: "/membres/travail",
    label: "Partitions",
    icon: IoMusicalNotesOutline,
    description: "Les partitions et les enregistrements pour travailler.",
  },
  {
    href: "/membres/calendrier",
    label: "Répétitions",
    icon: IoCalendarOutline,
    description: "Les dates, les horaires et les adresses.",
  },
  {
    href: "/membres/concerts",
    label: "Concerts",
    icon: IoTicketOutline,
    description: "Les prochains concerts et événements.",
  },
  {
    href: "/membres/membres",
    label: "Membres",
    icon: IoPeopleOutline,
    description: "Retrouver un choriste ou un musicien.",
  },
  {
    href: "/membres/administration",
    label: "Documents",
    icon: IoDocumentTextOutline,
    description: "Comptes-rendus du CA, règlement, gazettes.",
  },
];

/** Whether the current path belongs to this section (Accueil: exact match). */
export function isActiveLink(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/membres") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
