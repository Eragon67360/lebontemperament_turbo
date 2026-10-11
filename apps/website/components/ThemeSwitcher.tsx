"use client";

import { useHydrated } from "@/hooks/useClientValue";
import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";

/**
 * ThemeSwitcher Component
 * Implementation according to HeroUI documentation
 * Reference: https://www.heroui.com/docs/customization/dark-mode
 *
 * Features:
 * - Three theme options: light, dark, system
 * - Visual indication of current selection
 * - Smooth transitions
 * - Accessible keyboard navigation
 * - Prevents hydration mismatch
 */
export function ThemeSwitcher({
  isLight = false,
  large = false,
}: {
  isLight?: boolean;
  /** 48 px buttons with bigger icons (the members area's footer). */
  large?: boolean;
}) {
  // Prevent hydration mismatch - the theme is only known in the browser
  const mounted = useHydrated();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5 rounded-md bg-transparent p-0.5">
        {/* Skeleton placeholder */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`bg-surface-secondary animate-pulse rounded-sm ${large ? "h-12 w-12" : "h-7 w-7"}`}
          />
        ))}
      </div>
    );
  }

  // Dynamic classes based on isLight prop
  const sizeClasses = large ? "min-w-12 h-12 w-12" : "min-w-7 h-7 w-7";
  const buttonBaseClasses = isLight
    ? `${sizeClasses} p-0 data-[hovered=true]:bg-white/20`
    : `${sizeClasses} p-0 data-[hovered=true]:bg-surface-secondary`;
  const iconSize = large ? "h-5 w-5" : "h-3.5 w-3.5";

  // v2 parity: selected theme button was variant="flat" color="primary"
  // (teal-600 tint bg in both modes, primary-600 icon)
  const selectedClasses =
    "bg-[#1e848a]/20 text-primary-600 data-[hovered=true]:bg-[#1e848a]/30";

  const iconClasses = isLight ? "text-white" : "";

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-transparent p-0.5">
      {/* Light Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className={`${buttonBaseClasses} ${theme === "light" ? selectedClasses : ""}`}
        onPress={() => setTheme("light")}
        aria-label="Passer au thème clair"
      >
        <FiSun className={`${iconSize} ${iconClasses}`} />
      </Button>

      {/* Dark Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className={`${buttonBaseClasses} ${theme === "dark" ? selectedClasses : ""}`}
        onPress={() => setTheme("dark")}
        aria-label="Passer au thème sombre"
      >
        <FiMoon className={`${iconSize} ${iconClasses}`} />
      </Button>

      {/* System Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className={`${buttonBaseClasses} ${theme === "system" ? selectedClasses : ""}`}
        onPress={() => setTheme("system")}
        aria-label="Utiliser le thème du système"
      >
        <FiMonitor className={`${iconSize} ${iconClasses}`} />
      </Button>
    </div>
  );
}

/**
 * ThemeSwitcherCompact Component
 * Minimal version with single button cycle for space-constrained areas
 */
export function ThemeSwitcherCompact() {
  const mounted = useHydrated();
  const { theme, setTheme, systemTheme } = useTheme();

  if (!mounted) {
    return (
      <Button
        isIconOnly
        variant="ghost"
        className="h-9 w-9"
        aria-label="Changer de thème"
      >
        <div className="bg-surface-tertiary h-5 w-5 animate-pulse rounded-full" />
      </Button>
    );
  }

  // Cycle through themes: light → dark → system
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Get the appropriate icon for current theme
  const getIcon = () => {
    if (theme === "system") {
      return <FiMonitor className="h-5 w-5" />;
    }
    // For system theme, show icon based on actual system preference
    const activeTheme = theme === "system" ? systemTheme : theme;
    return activeTheme === "dark" ? (
      <FiMoon className="h-5 w-5" />
    ) : (
      <FiSun className="h-5 w-5" />
    );
  };

  const getLabel = () => {
    if (theme === "system") {
      return `Thème système (${systemTheme === "dark" ? "sombre" : "clair"})`;
    }
    return theme === "dark" ? "Thème sombre" : "Thème clair";
  };

  return (
    <Button
      isIconOnly
      variant="ghost"
      className="h-9 w-9 transition-transform hover:scale-110"
      onPress={cycleTheme}
      aria-label={`Changer de thème. Actuellement: ${getLabel()}`}
    >
      {getIcon()}
    </Button>
  );
}
