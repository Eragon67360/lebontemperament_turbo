"use client";

import React from "react";
import { motion } from "motion/react";
export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      className="fixed top-0 left-0 z-50 h-screen w-screen bg-foreground flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}
