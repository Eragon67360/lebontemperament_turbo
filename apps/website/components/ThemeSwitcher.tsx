"use client";

import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
export function ThemeSwitcher({ isLight = false }: { isLight?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch - only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5 rounded-md bg-transparent p-0.5">
        {/* Skeleton placeholder */}
        <div className="bg-surface-secondary h-7 w-7 animate-pulse rounded-sm" />
        <div className="bg-surface-secondary h-7 w-7 animate-pulse rounded-sm" />
        <div className="bg-surface-secondary h-7 w-7 animate-pulse rounded-sm" />
      </div>
    );
  }

  // Dynamic classes based on isLight prop
  const buttonBaseClasses = isLight
    ? "min-w-7 h-7 w-7 p-0 data-[hovered=true]:bg-white/20"
    : "min-w-7 h-7 w-7 p-0 data-[hovered=true]:bg-surface-secondary";

  const iconClasses = isLight ? "text-white" : "";

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-transparent p-0.5">
      {/* Light Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "light" ? "secondary" : "ghost"}
        className={buttonBaseClasses}
        onPress={() => setTheme("light")}
        aria-label="Passer au thème clair"
      >
        <FiSun className={`h-3.5 w-3.5 ${iconClasses}`} />
      </Button>

      {/* Dark Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "dark" ? "secondary" : "ghost"}
        className={buttonBaseClasses}
        onPress={() => setTheme("dark")}
        aria-label="Passer au thème sombre"
      >
        <FiMoon className={`h-3.5 w-3.5 ${iconClasses}`} />
      </Button>

      {/* System Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "system" ? "secondary" : "ghost"}
        className={buttonBaseClasses}
        onPress={() => setTheme("system")}
        aria-label="Utiliser le thème du système"
      >
        <FiMonitor className={`h-3.5 w-3.5 ${iconClasses}`} />
      </Button>
    </div>
  );
}

/**
 * ThemeSwitcherCompact Component
 * Minimal version with single button cycle for space-constrained areas
 */
export function ThemeSwitcherCompact() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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
