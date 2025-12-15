"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { FaCalendarAlt, FaMusic, FaTrophy, FaUsers } from "react-icons/fa";

interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  icon: typeof FaMusic;
  color: string;
}

// Placeholder timeline data - to be replaced with real content
const timelineEvents: TimelineEvent[] = [
  {
    year: 1984,
    title: "La Création",
    description:
      "Le Bon Tempérament voit le jour sous la direction de Simone Duclos. Premier concert inaugural qui marque le début d'une aventure musicale exceptionnelle.",
    icon: FaMusic,
    color: "from-[#1A878D] to-[#0084A4]",
  },
  {
    year: 1990,
    title: "Premier Enregistrement",
    description:
      "Sortie du premier CD, marquant un tournant dans l'histoire de l'ensemble. Les critiques saluent la qualité artistique et la passion du groupe.",
    icon: FaTrophy,
    color: "from-blue-500 to-cyan-500",
  },
  {
    year: 1995,
    title: "Expansion",
    description:
      "L'ensemble s'agrandit et diversifie son répertoire. Premiers concerts à l'étranger et reconnaissance internationale.",
    icon: FaUsers,
    color: "from-green-500 to-emerald-500",
  },
  {
    year: 2000,
    title: "Nouveau Millénaire",
    description:
      "Entrée dans le nouveau siècle avec de nouveaux projets ambitieux. Collaboration avec des artistes renommés et exploration de nouveaux répertoires.",
    icon: FaCalendarAlt,
    color: "from-purple-500 to-indigo-500",
  },
  {
    year: 2010,
    title: "Anniversaire des 25 Ans",
    description:
      "Célébration des 25 ans avec une série de concerts exceptionnels. Rétrospective des plus beaux moments et hommage aux membres fondateurs.",
    icon: FaTrophy,
    color: "from-rose-500 to-red-500",
  },
  {
    year: 2020,
    title: "Adaptation et Résilience",
    description:
      "Face aux défis, l'ensemble continue de partager la musique. Concerts en ligne, nouvelles formes de partage et maintien de la passion musicale.",
    icon: FaMusic,
    color: "from-yellow-500 to-amber-500",
  },
  {
    year: 2024,
    title: "40 Ans de Passion",
    description:
      "Aujourd'hui, nous célébrons les 40 ans du Bon Tempérament ! Un voyage musical riche en émotions, en rencontres et en moments inoubliables.",
    icon: FaTrophy,
    color: "from-[#1A878D] via-[#3D7CB2] to-[#9D609B]",
  },
];

const AnniversaryTimeline = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="timeline" ref={sectionRef} className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Notre Parcours : 40 Ans
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Découvrez les moments clés qui ont marqué notre histoire
          </p>
        </motion.div>

        <div ref={timelineRef} className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 left-8 h-full w-1 bg-gradient-to-b from-[#1A878D] via-[#3D7CB2] to-[#9D609B] md:left-1/2 md:-translate-x-1/2">
            <motion.div
              style={{ height: lineHeight }}
              className="absolute top-0 w-full bg-gradient-to-b from-[#1A878D] to-[#0084A4]"
            />
          </div>

          {/* Timeline events */}
          <div className="space-y-12">
            {timelineEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className={`relative flex items-center gap-8 md:gap-12 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Year badge */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`relative rounded-full bg-gradient-to-br ${event.color} p-6 shadow-lg`}
                    >
                      <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
                      <event.icon className="relative z-10 text-3xl text-white" />
                    </motion.div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-1 text-sm font-bold whitespace-nowrap text-white dark:bg-white dark:text-gray-900">
                      {event.year}
                    </div>
                  </div>

                  {/* Content card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex-1 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 ${
                      isEven
                        ? "md:mr-auto md:max-w-md"
                        : "md:ml-auto md:max-w-md"
                    }`}
                  >
                    <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {event.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnniversaryTimeline;
