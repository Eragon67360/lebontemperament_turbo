import type { ReactNode } from "react";

let current: string | undefined;

/**
 * Sets the theme `useTheme()` reports. The real package knows the theme only
 * in the browser (it is `undefined` on the server), so a server render could
 * not otherwise show which theme button is on.
 */
export function setTestTheme(theme: string | undefined) {
  current = theme;
}

export function useTheme() {
  return {
    theme: current,
    setTheme: () => {},
    themes: ["light", "dark"],
    systemTheme: "light",
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}
