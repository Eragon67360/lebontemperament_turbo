"use client";

import {
  DEFAULT_DENSITY,
  DENSITY_STORAGE_KEY,
  densityAttribute,
  parseDensity,
  type Density,
} from "@/lib/density";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type DensityContextValue = {
  density: Density;
  setDensity: (density: Density) => void;
};

const DensityContext = createContext<DensityContextValue>({
  density: DEFAULT_DENSITY,
  setDensity: () => {},
});

// A tiny external store over localStorage, so React reads it through
// useSyncExternalStore (server snapshot: the default; no setState in effects).
const listeners = new Set<() => void>();

function readStoredDensity(): Density {
  try {
    return parseDensity(window.localStorage.getItem(DENSITY_STORAGE_KEY));
  } catch {
    return DEFAULT_DENSITY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing the preference updates this one too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeStoredDensity(density: Density) {
  try {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
  } catch {
    // Private mode or blocked storage: the choice is lost on reload, nothing else.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Mirrors the stored list density on `<html data-density>` so the CSS
 * variables (`--row-h`, `--control-h`) do the work. Server render and first
 * paint are always comfortable; a stored "compact" applies after hydration,
 * like a theme.
 */
export function DensityProvider({ children }: { children: ReactNode }) {
  const density = useSyncExternalStore(
    subscribe,
    readStoredDensity,
    () => DEFAULT_DENSITY,
  );

  useEffect(() => {
    const value = densityAttribute(density);
    if (value) document.documentElement.setAttribute("data-density", value);
    else document.documentElement.removeAttribute("data-density");
  }, [density]);

  const setDensity = useCallback((next: Density) => {
    writeStoredDensity(next);
  }, []);

  const value = useMemo(() => ({ density, setDensity }), [density, setDensity]);

  return (
    <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
  );
}

export function useDensity() {
  return useContext(DensityContext);
}
