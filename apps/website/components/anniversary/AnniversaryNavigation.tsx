"use client";

import type { NavigationCard } from "@/types/anniversary";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  FaCalendarAlt,
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaMusic,
  FaTrophy,
  FaUsers,
  FaVideo,
} from "react-icons/fa";

// Icon mapping (unchanged)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaMusic,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaHistory,
  FaVideo,
  FaHeadphones,
  FaImages,
  FaHeart,
};

interface AnniversaryNavigationProps {
  cards: NavigationCard[];
}

const AnniversaryNavigation = ({ cards }: AnniversaryNavigationProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Parallax scroll effect (unchanged)
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [50, -50]);

  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="anniversary-navigation"
      ref={sectionRef}
      // REFINED: Consistent light background with the parent section
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    >
      {/* Parallax background orb (unchanged) */}
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/2 right-0 h-100 w-100 rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* REFINED: Title now uses simple text, inheriting the clean style */}
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            Explorez Notre Célébration
          </h2>
          {/* REFINED: Lighter font weight for the description */}
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Découvrez 40 ans d&apos;histoire du Bon Tempérament à travers
            différents médias et témoignages.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {cards.map((card, index) => {
            const IconComponent = iconMap[card.icon_name] || FaMusic;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                // REFINED: Subtle hover, same as the hero's stat cards
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 p-8 backdrop-blur-md transition-all duration-300 hover:border-slate-300/80 dark:border-slate-800/50 dark:bg-slate-900/30 dark:hover:border-slate-700/80"
              >
                {/* Subtle inner glow on hover */}
                <div
                  className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(173, 216, 230, 0.1) 0%, transparent 80%)",
                  }}
                />

                {/* REFINED: Icon is much lighter, no heavy background */}
                <div className="mb-6">
                  <div className="bg-primary/5 text-primary dark:bg-primary/10 inline-flex rounded-lg p-4">
                    <IconComponent className="text-3xl" />
                  </div>
                </div>

                {/* Content */}
                {/* REFINED: Font weights are lighter, title is medium, description is light */}
                <h3 className="mb-2 text-2xl font-medium text-slate-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="grow font-light text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>

                {/* REFINED: Button matches the elegant "ghost button" style from the hero */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="mt-12 text-center"
                >
                  <motion.button
                    variants={{
                      initial: { color: "var(--color-primary)" },
                      hover: { color: "#ffffff" },
                    }}
                    initial="initial"
                    whileHover="hover"
                    transition={{ duration: 0.3 }}
                    className="group border-primary/40 text-primary hover:border-primary/80 dark:border-primary/50 dark:text-primary relative w-full overflow-hidden rounded-md border bg-transparent px-8! py-3 font-medium transition-colors duration-300"
                    onClick={() => scrollToSection(card.target_section_id)}
                  >
                    <motion.div
                      className="bg-primary absolute inset-0 -z-10"
                      variants={{
                        initial: { y: "100%" },
                        hover: { y: "0%" },
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />

                    <motion.span>Découvrir</motion.span>
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnniversaryNavigation;
