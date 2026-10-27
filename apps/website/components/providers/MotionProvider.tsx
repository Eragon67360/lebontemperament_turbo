"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion's animation features, provided once for the `m.*` components the
 * site uses (`motion.*` bundles every feature, drag and layout included, into
 * each page). `domAnimation` covers what the public pages animate: variants,
 * whileInView, whileHover/Tap, AnimatePresence exits, scroll-driven values.
 * Components that need layout or drag animations (easter eggs, the anniversary
 * pages) keep `motion.*` and load those features with their own chunk.
 *
 * `reducedMotion="user"` is the site-wide policy for visitors who ask for less
 * motion (`prefers-reduced-motion: reduce`): every Motion component, `m.*` or
 * `motion.*`, then skips its transform and layout animations (scale, slide,
 * spring, height) and keeps the opacity fades. Scroll-linked values, GSAP and
 * CSS keep their own guards (`hooks/useReducedMotion.ts`, `motion-reduce`).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}
