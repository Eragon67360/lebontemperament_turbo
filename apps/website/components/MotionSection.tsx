"use client";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  dataTestId?: string;
  delay?: number;
}

const MotionSection: React.FC<MotionSectionProps> = ({
  children,
  className = "",
  dataTestId,
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.6,
        ease: "easeOut" as const,
        delay: prefersReducedMotion ? 0 : delay,
      },
    },
  };

  return (
    <motion.section
      className={className}
      data-testid={dataTestId}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {children}
    </motion.section>
  );
};

export default MotionSection;
