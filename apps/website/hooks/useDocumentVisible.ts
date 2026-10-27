"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const getSnapshot = () => document.visibilityState === "visible";
const getServerSnapshot = () => true;

/**
 * Whether the page is on screen (`document.visibilityState`), `true` on the
 * server. Work that only matters while someone looks at the page, such as
 * asking a third party for a map route, can wait while it is `false`.
 */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
