"use client";

import { cn } from "@/lib/utils";
import { ICON_OPTIONS, IconName } from "@/types/anniversary";
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

const iconMap = {
  FaMusic: FaMusic,
  FaTrophy: FaTrophy,
  FaUsers: FaUsers,
  FaCalendarAlt: FaCalendarAlt,
  FaHistory: FaHistory,
  FaVideo: FaVideo,
  FaHeadphones: FaHeadphones,
  FaImages: FaImages,
  FaHeart: FaHeart,
};

interface IconPickerProps {
  value: IconName;
  onChange: (icon: IconName) => void;
  label?: string;
  error?: string;
}

export function IconPicker({
  value,
  onChange,
  label = "Icône",
  error,
}: IconPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {ICON_OPTIONS.map((iconName) => {
          const IconComponent = iconMap[iconName];
          const isSelected = value === iconName;

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={cn(
                "hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background",
              )}
            >
              <IconComponent className="h-6 w-6" />
              <span className="text-[10px] font-medium">
                {iconName.replace("Fa", "")}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
