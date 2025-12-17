"use client";

import type { NavigationCard } from "@/types/anniversary";
import { Button } from "@heroui/react";
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

// Icon mapping
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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="anniversary-navigation"
      ref={sectionRef}
      className="bg-default-50 relative overflow-hidden py-16"
    >
      {/* Parallax background orb */}
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* Glass morphism title */}
          <div className="relative mx-auto mb-6 inline-block">
            <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br backdrop-blur-xl" />
            <div
              className="absolute inset-0 -z-10 rounded-2xl opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26, 135, 141, 0.15) 0%, rgba(13, 107, 112, 0.05) 100%)",
                filter: "blur(15px)",
              }}
            />
            <h2 className="text-title text-primary/50 dark:text-primary px-8 py-4 leading-none font-light">
              Explorez Notre Célébration
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Découvrez 40 ans d&apos;histoire du Bon Tempérament à travers
            différents médias et témoignages
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {cards.map((card, index) => {
            const IconComponent = iconMap[card.icon_name] || FaMusic;

            return (
              <motion.div
                key={card.id}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Animated gradient on hover */}
                <motion.div
                  className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(26, 135, 141, 0.1) 0%, transparent 70%)",
                  }}
                />

                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 -z-10"
                  initial={{ x: "-100%", opacity: 0 }}
                  whileHover={{ x: "100%", opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(26, 135, 141, 0.1), transparent)",
                  }}
                />

                {/* Icon with glass effect */}
                <motion.div
                  className="relative mb-6 inline-flex"
                  whileHover={{ rotate: [0, -5, 5, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="from-primary/20 to-primary/10 absolute inset-0 -z-10 scale-110 rounded-xl bg-gradient-to-br blur-xl" />
                  <div className="from-primary to-primary/80 shadow-primary/20 rounded-xl bg-gradient-to-br p-4 shadow-lg">
                    <IconComponent className="text-3xl text-white" />
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-foreground mb-2 text-2xl font-semibold">
                  {card.title}
                </h3>
                <p className="text-foreground/70 mb-6 font-light">
                  {card.description}
                </p>

                {/* Button */}
                <Button
                  onClick={() => scrollToSection(card.target_section_id)}
                  color="primary"
                  variant="bordered"
                  radius="sm"
                  className="group/btn relative w-full overflow-hidden"
                >
                  <span className="relative z-10">Découvrir</span>
                  <motion.div className="bg-primary absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-10" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnniversaryNavigation;
