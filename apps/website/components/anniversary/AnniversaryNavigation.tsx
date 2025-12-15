"use client";

import { Button } from "@heroui/react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaRocket,
  FaVideo,
} from "react-icons/fa";

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: typeof FaVideo;
  color: string;
  gradient: string;
}

const navigationCards: NavigationCard[] = [
  {
    id: "timeline",
    title: "Notre Histoire",
    description: "Parcourez 40 ans de moments marquants du Bon Tempérament",
    icon: FaHistory,
    color: "from-primary to-cyan-500",
    gradient: "bg-gradient-to-br from-primary to-cyan-500",
  },
  {
    id: "videos",
    title: "Vidéos",
    description: "Revivez nos concerts et témoignages",
    icon: FaVideo,
    color: "from-red-500 to-pink-500",
    gradient: "bg-gradient-to-br from-red-500 to-pink-500",
  },
  {
    id: "audio",
    title: "Mémoires Audio",
    description: "Écoutez nos souvenirs sonores",
    icon: FaHeadphones,
    color: "from-purple-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-purple-500 to-indigo-500",
  },
  {
    id: "photos",
    title: "Galerie Photo",
    description: "Explorez nos archives visuelles",
    icon: FaImages,
    color: "from-green-500 to-emerald-500",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
  {
    id: "memories",
    title: "Témoignages",
    description: "Partagez vos souvenirs avec nous",
    icon: FaHeart,
    color: "from-rose-500 to-red-500",
    gradient: "bg-gradient-to-br from-rose-500 to-red-500",
  },
];

const AnniversaryNavigation = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

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
      className="relative py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Explorez Notre Célébration
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Découvrez 40 ans d&apos;histoire du Bon Tempérament à travers
            différents médias et témoignages
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigationCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={
                isInView
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 50, scale: 0.9 }
              }
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
              />

              {/* Icon */}
              <motion.div
                className={`mb-6 inline-flex rounded-2xl ${card.gradient} p-4 text-white shadow-lg`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <card.icon className="text-3xl" />
              </motion.div>

              {/* Content */}
              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {card.title}
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {card.description}
              </p>

              {/* Button */}
              <Button
                onClick={() => scrollToSection(card.id)}
                className={`w-full ${card.gradient} text-white`}
                endContent={<FaRocket />}
              >
                Découvrir
              </Button>

              {/* Decorative corner */}
              <div
                className={`absolute -top-8 -right-8 h-24 w-24 rounded-full ${card.gradient} opacity-20 blur-2xl`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnniversaryNavigation;
