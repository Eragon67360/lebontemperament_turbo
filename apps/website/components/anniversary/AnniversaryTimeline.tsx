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

// Timeline data with specific details and anecdotes
const timelineEvents: TimelineEvent[] = [
  {
    year: 1984,
    title: "La Création",
    description:
      "Un dimanche de novembre 1984, Simone Duclos réunit une poignée de passionnés dans la salle paroissiale de Saverne. Le premier concert, donné dans l'église Saint-Georges, rassemble 80 personnes. Personne n'imaginait alors que cette aventure durerait 40 ans.",
    icon: FaMusic,
    color: "from-[#1A878D] to-[#0084A4]",
  },
  {
    year: 1990,
    title: "Premier Enregistrement",
    description:
      "Sortie du premier CD « Vivaldi : Les Quatre Saisons » enregistré dans l'église de Marmoutier. L'ingénieur du son se souvient encore de la difficulté à capturer l'acoustique particulière du lieu. Ce disque marque notre entrée dans l'ère de la diffusion musicale.",
    icon: FaTrophy,
    color: "from-blue-500 to-cyan-500",
  },
  {
    year: 1995,
    title: "Première Tournée",
    description:
      "Notre première tournée en Allemagne, à Fribourg-en-Brisgau. Le trajet en minibus, les répétitions dans des salles inconnues, l'accueil chaleureux du public allemand... Une expérience qui a forgé notre identité d'ensemble itinérant.",
    icon: FaUsers,
    color: "from-green-500 to-emerald-500",
  },
  {
    year: 2000,
    title: "Le Nouveau Millénaire",
    description:
      "Concert du millénaire à la cathédrale de Strasbourg. Plus de 500 personnes, un répertoire allant de Monteverdi à Bach. Ce soir-là, nous avons compris que notre mission dépassait le simple plaisir de jouer ensemble.",
    icon: FaCalendarAlt,
    color: "from-purple-500 to-indigo-500",
  },
  {
    year: 2010,
    title: "Les 25 Ans",
    description:
      "Célébration des 25 ans avec un concert réunissant tous les anciens membres. Certains n'avaient pas joué depuis 15 ans, mais la complicité était intacte. Un moment d'émotion pure, avec des larmes dans les yeux et des rires dans les coulisses.",
    icon: FaTrophy,
    color: "from-rose-500 to-red-500",
  },
  {
    year: 2020,
    title: "L'Adaptation",
    description:
      "Le confinement nous pousse à innover : répétitions en visio, concerts diffusés en ligne depuis l'église vide. Une période difficile mais qui a renforcé notre détermination. Le premier concert post-confinement, en juin 2021, restera gravé dans nos mémoires.",
    icon: FaMusic,
    color: "from-yellow-500 to-amber-500",
  },
  {
    year: 2024,
    title: "40 Ans de Passion",
    description:
      "Aujourd'hui, nous célébrons 40 ans d'une aventure humaine exceptionnelle. Des milliers d'heures de répétition, des centaines de concerts, des amitiés indéfectibles. Le Bon Tempérament, c'est bien plus qu'un ensemble : c'est une famille musicale qui continue de grandir.",
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
          <div className="space-y-12 md:space-y-16">
            {timelineEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              const randomOffset = ((index * 7) % 15) - 7; // Variation subtile entre -7 et 7
              const randomDelay = index * 0.08 + (index % 3) * 0.05; // Délais variés

              return (
                <motion.div
                  key={event.year}
                  initial={{
                    opacity: 0,
                    x: isEven ? -60 : 60,
                    y: randomOffset,
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    delay: randomDelay,
                    duration: 0.7 + (index % 3) * 0.1,
                    type: "spring",
                    stiffness: 80 + index * 5,
                    damping: 12,
                  }}
                  className={`relative flex items-center gap-6 md:gap-12 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Year badge */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      whileHover={{
                        scale: 1.15,
                        rotate: index % 2 === 0 ? 8 : -8,
                      }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className={`relative rounded-full bg-gradient-to-br ${event.color} p-5 shadow-xl md:p-6`}
                      style={{
                        transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
                      <event.icon className="relative z-10 text-2xl text-white md:text-3xl" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: randomDelay + 0.2 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold whitespace-nowrap text-white shadow-lg md:px-4 md:text-sm dark:bg-white dark:text-gray-900"
                    >
                      {event.year}
                    </motion.div>
                  </div>

                  {/* Content card */}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`flex-1 rounded-2xl bg-white p-5 shadow-lg md:p-6 dark:bg-gray-800 ${
                      isEven
                        ? "md:mr-auto md:max-w-md"
                        : "md:ml-auto md:max-w-md"
                    }`}
                    style={{
                      transform: `rotate(${index % 2 === 0 ? 0.5 : -0.5}deg)`,
                    }}
                  >
                    <h3 className="mb-3 text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                      {event.title}
                    </h3>
                    <p className="leading-relaxed text-gray-700 md:text-base dark:text-gray-300">
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
