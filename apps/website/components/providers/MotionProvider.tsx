"use client";

import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion's animation features, provided once for the `m.*` components the
 * site uses (`motion.*` bundles every feature, drag and layout included, into
 * each page). `domAnimation` covers what the public pages animate: variants,
 * whileInView, whileHover/Tap, AnimatePresence exits, scroll-driven values.
 * Components that need layout or drag animations (easter eggs, the anniversary
 * pages) keep `motion.*` and load those features with their own chunk.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
