"use client";

import type { NavigationCard } from "@/types/anniversary";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
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
import AnniversaryCTA from "./AnniversaryCTA";

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

// Sub-component for each interactive navigation item
const NavigationItem = ({
  card,
  isActive,
  shouldReduceMotion,
  scrollToSection,
}: {
  card: NavigationCard;
  isActive: boolean;
  shouldReduceMotion: boolean;
  scrollToSection: (id: string) => void;
}) => {
  const IconComponent = iconMap[card.icon_name] || FaMusic;

  return (
    <motion.div
      animate={{
        opacity: isActive ? 1 : 0.5,
        scale: shouldReduceMotion || isActive ? 1 : 0.95,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-6 md:flex-row md:gap-12"
    >
      {/* Left side: Text Content */}
      <div className="flex-1 text-center md:text-left">
        <h3
          className={`mb-2 text-2xl font-medium transition-colors duration-500 sm:text-3xl ${
            isActive
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {card.title}
        </h3>
        <p
          className={`font-light transition-colors duration-500 ${
            isActive
              ? "text-slate-500 dark:text-slate-400"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {card.description}
        </p>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isActive ? 1 : 0,
            height: isActive ? "auto" : 0,
            marginTop: isActive ? "2rem" : "0rem",
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-fit md:mx-0"
        >
          <AnniversaryCTA
            onClick={() => scrollToSection(card.target_section_id)}
          >
            Découvrir
          </AnniversaryCTA>
        </motion.div>
      </div>

      {/* Right side: Visual Icon Card */}
      <motion.div className="flex shrink-0 items-center justify-center p-4 md:w-1/3">
        <div className="relative rounded-xl border border-slate-200/80 bg-white/30 p-8 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/30">
          <IconComponent className="text-primary text-5xl" />
        </div>
      </motion.div>
    </motion.div>
  );
};

interface AnniversaryNavigationProps {
  cards: NavigationCard[];
}

const AnniversaryNavigation = ({ cards }: AnniversaryNavigationProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const { scrollY: parallaxScrollY } = useScroll();
  const yRaw = useTransform(parallaxScrollY, [0, 1000], [50, -50]);
  const y = shouldReduceMotion ? 0 : yRaw;

  // Scroll progress within the listRef to determine the active card
  const { scrollYProgress } = useScroll({
    target: listRef,
    // *** THIS IS THE FIX ***
    // Triggers the animation based on the element's center crossing the viewport's center
    offset: ["start center", "end center"],
  });

  // Calculate the active index based on scroll position
  const activeCardIndexValue = useTransform(scrollYProgress, (pos) => {
    const clampedPos = Math.max(0, Math.min(1, pos));
    return Math.floor(clampedPos * cards.length);
  });

  const [activeCard, setActiveCard] = useState(0);
  useMotionValueEvent(activeCardIndexValue, "change", (latest) => {
    const validIndex = Math.min(latest, cards.length - 1);
    setActiveCard(validIndex);
  });

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
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Explorez Notre Célébration
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Faites défiler pour découvrir 40 ans d'histoire à travers différents
            médias et témoignages.
          </p>
        </motion.div>

        <div
          ref={listRef}
          className="mx-auto max-w-4xl space-y-24 md:space-y-32"
        >
          {cards.map((card, index) => (
            <NavigationItem
              key={card.id}
              card={card}
              isActive={index === activeCard}
              shouldReduceMotion={shouldReduceMotion ?? false}
              scrollToSection={scrollToSection}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnniversaryNavigation;
