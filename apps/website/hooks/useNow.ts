"use client";

import { useSyncExternalStore } from "react";

/** How often subscribed components see a new timestamp. */
const TICK_MS = 10_000;

const listeners = new Set<() => void>();
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (now === 0) now = Date.now();
  return now;
}

const getServerSnapshot = () => 0;

/**
 * The current time in milliseconds, refreshed every {@link TICK_MS}, for
 * labels such as "arrives in 5 minutes" that must count down between
 * renders. Rendering `Date.now()` directly is impure (the same props would
 * give different output), so the clock lives in this external store instead.
 * On the server it is `0`: never render it before the client takes over.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
