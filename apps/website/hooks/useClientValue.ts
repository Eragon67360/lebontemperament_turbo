"use client";

import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

/**
 * Reads a browser-only value without a hydration mismatch.
 *
 * The server and the hydrating render see `serverValue`; React then
 * re-renders with `getClientValue()`, exactly as the old
 * "set it in a mount effect" pattern did, minus the extra effect pass.
 *
 * `getClientValue` must return a primitive (or a stable reference): React
 * compares snapshots with `Object.is` on every render.
 */
export function useClientValue<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    subscribeToNothing,
    getClientValue,
    () => serverValue,
  );
}

const getTrue = () => true;

/** `false` on the server and while hydrating, `true` once the client runs. */
export function useHydrated(): boolean {
  return useClientValue(getTrue, false);
}
