"use client";

import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiMoon, FiSun, FiMonitor } from "react-icons/fi";

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
export function ThemeSwitcher() {
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
        <div className="bg-default-100 h-7 w-7 animate-pulse rounded-sm" />
        <div className="bg-default-100 h-7 w-7 animate-pulse rounded-sm" />
        <div className="bg-default-100 h-7 w-7 animate-pulse rounded-sm" />
      </div>
    );
  }

  const buttonBaseClasses =
    "min-w-7 h-7 w-7 p-0 data-[hover=true]:bg-default-100";

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-transparent p-0.5">
      {/* Light Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "light" ? "flat" : "light"}
        color={theme === "light" ? "primary" : "default"}
        className={buttonBaseClasses}
        onPress={() => setTheme("light")}
        aria-label="Passer au thème clair"
        aria-pressed={theme === "light"}
        title="Thème clair"
      >
        <FiSun className="h-3.5 w-3.5" />
      </Button>

      {/* Dark Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "dark" ? "flat" : "light"}
        color={theme === "dark" ? "primary" : "default"}
        className={buttonBaseClasses}
        onPress={() => setTheme("dark")}
        aria-label="Passer au thème sombre"
        aria-pressed={theme === "dark"}
        title="Thème sombre"
      >
        <FiMoon className="h-3.5 w-3.5" />
      </Button>

      {/* System Theme Button */}
      <Button
        isIconOnly
        size="sm"
        variant={theme === "system" ? "flat" : "light"}
        color={theme === "system" ? "primary" : "default"}
        className={buttonBaseClasses}
        onPress={() => setTheme("system")}
        aria-label="Utiliser le thème du système"
        aria-pressed={theme === "system"}
        title="Thème système"
      >
        <FiMonitor className="h-3.5 w-3.5" />
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
        variant="light"
        className="h-9 w-9"
        aria-label="Changer de thème"
      >
        <div className="bg-default-200 h-5 w-5 animate-pulse rounded-full" />
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
      variant="light"
      className="h-9 w-9 transition-transform hover:scale-110"
      onPress={cycleTheme}
      aria-label={`Changer de thème. Actuellement: ${getLabel()}`}
      title={getLabel()}
    >
      {getIcon()}
    </Button>
  );
}
