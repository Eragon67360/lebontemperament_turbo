import { cn } from "@/lib/utils";
import { GROUP_COLOR_CLASSES } from "@/utils/groups/view";
import type { GroupColor, GroupIcon } from "@repo/domain/types/memberGroups";
import {
  BookOpen,
  Briefcase,
  Cake,
  CalendarDays,
  Camera,
  ClipboardList,
  HeartHandshake,
  Landmark,
  type LucideIcon,
  Megaphone,
  Music,
  PiggyBank,
  Users,
} from "lucide-react";

/** The Lucide icon of each stored name (the app maps the same names later). */
export const GROUP_ICON_COMPONENTS: Record<GroupIcon, LucideIcon> = {
  landmark: Landmark,
  users: Users,
  music: Music,
  megaphone: Megaphone,
  "calendar-days": CalendarDays,
  "clipboard-list": ClipboardList,
  briefcase: Briefcase,
  "heart-handshake": HeartHandshake,
  "piggy-bank": PiggyBank,
  camera: Camera,
  "book-open": BookOpen,
  cake: Cake,
};

/** The group's icon on its soft tint: decorative, the name is always beside it. */
export function GroupTile({
  icon,
  color,
  className,
}: {
  icon: string;
  color: GroupColor;
  className?: string;
}) {
  // An icon name the admin doesn't know (written elsewhere) reads as « users ».
  const Icon = GROUP_ICON_COMPONENTS[icon as GroupIcon] ?? Users;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-content-center rounded-lg [&>svg]:size-5",
        GROUP_COLOR_CLASSES[color] ?? GROUP_COLOR_CLASSES.teal,
        className,
      )}
    >
      <Icon />
    </span>
  );
}
