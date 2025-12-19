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
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
    >
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/2 right-0 h-100 w-100 rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Explorez Notre Célébration
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Découvrez 40 ans d'histoire du Bon Tempérament à travers différents
            médias et témoignages.
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
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-300/80 sm:p-8 dark:border-slate-800/50 dark:bg-slate-900/30 dark:hover:border-slate-700/80"
              >
                <div
                  className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(173, 216, 230, 0.1) 0%, transparent 80%)",
                  }}
                />

                <div className="mb-6">
                  <div className="bg-primary/5 text-primary dark:bg-primary/10 inline-flex rounded-lg p-4">
                    <IconComponent className="text-3xl" />
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-medium text-slate-900 sm:text-2xl dark:text-white">
                  {card.title}
                </h3>
                <p className="grow font-light text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>

                <div className="mt-8 text-center sm:mt-12">
                  <motion.button
                    variants={{
                      initial: { color: "var(--color-primary)" },
                      hover: { color: "#ffffff" },
                    }}
                    initial="initial"
                    whileHover="hover"
                    transition={{ duration: 0.3 }}
                    className="group border-primary/40 text-primary hover:border-primary/80 dark:border-primary/50 dark:text-primary relative w-full overflow-hidden rounded-md border bg-transparent py-3 font-medium transition-colors duration-300"
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
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnniversaryNavigation;
