import type { IconName } from "@/types/anniversary";
import { DEFAULT_ICON, isIconName } from "@/utils/anniversary/icons";
import {
  FaCalendarAlt,
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaMusic,
  FaTrophy,
  FaUsers,
  FaVideo,
} from "react-icons/fa";

/** The one map from a stored icon name to its glyph (the public page uses the same set). */
const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  FaMusic,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaHistory,
  FaVideo,
  FaHeadphones,
  FaImages,
  FaHeart,
};

export function AnniversaryIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = ICONS[isIconName(name) ? name : DEFAULT_ICON];
  return <Icon className={className} aria-hidden />;
}
