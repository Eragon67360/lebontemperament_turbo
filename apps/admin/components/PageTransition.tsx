"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Softens the first paint of the dashboard. Deliberately short and opacity-led:
 * navigation happens many times per session, so movement here reads as lag.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
