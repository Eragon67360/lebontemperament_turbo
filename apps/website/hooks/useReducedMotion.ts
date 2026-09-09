"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe replacement for motion's `useReducedMotion`.
 *
 * Motion's version reads matchMedia during the first client render, so any
 * value baked into `initial`/`style` differs from the server HTML and breaks
 * hydration. This one matches the server (false) on first paint and flips
 * after mount, which only skips the entrance animation a frame later.
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return prefersReducedMotion;
}
