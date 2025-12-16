"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { FaCalendarAlt, FaMusic, FaTrophy, FaUsers } from "react-icons/fa";

interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  icon: typeof FaMusic;
}

// Timeline data with specific details and anecdotes
const timelineEvents: TimelineEvent[] = [
  {
    year: 1984,
    title: "La Création",
    description:
      "Un dimanche de novembre 1984, Simone Duclos réunit une poignée de passionnés dans la salle paroissiale de Saverne. Le premier concert, donné dans l'église Saint-Georges, rassemble 80 personnes. Personne n'imaginait alors que cette aventure durerait 40 ans.",
    icon: FaMusic,
  },
  {
    year: 1990,
    title: "Premier Enregistrement",
    description:
      "Sortie du premier CD « Vivaldi : Les Quatre Saisons » enregistré dans l'église de Marmoutier. L'ingénieur du son se souvient encore de la difficulté à capturer l'acoustique particulière du lieu. Ce disque marque notre entrée dans l'ère de la diffusion musicale.",
    icon: FaTrophy,
  },
  {
    year: 1995,
    title: "Première Tournée",
    description:
      "Notre première tournée en Allemagne, à Fribourg-en-Brisgau. Le trajet en minibus, les répétitions dans des salles inconnues, l'accueil chaleureux du public allemand... Une expérience qui a forgé notre identité d'ensemble itinérant.",
    icon: FaUsers,
  },
  {
    year: 2000,
    title: "Le Nouveau Millénaire",
    description:
      "Concert du millénaire à la cathédrale de Strasbourg. Plus de 500 personnes, un répertoire allant de Monteverdi à Bach. Ce soir-là, nous avons compris que notre mission dépassait le simple plaisir de jouer ensemble.",
    icon: FaCalendarAlt,
  },
  {
    year: 2010,
    title: "Les 25 Ans",
    description:
      "Célébration des 25 ans avec un concert réunissant tous les anciens membres. Certains n'avaient pas joué depuis 15 ans, mais la complicité était intacte. Un moment d'émotion pure, avec des larmes dans les yeux et des rires dans les coulisses.",
    icon: FaTrophy,
  },
  {
    year: 2020,
    title: "L'Adaptation",
    description:
      "Le confinement nous pousse à innover : répétitions en visio, concerts diffusés en ligne depuis l'église vide. Une période difficile mais qui a renforcé notre détermination. Le premier concert post-confinement, en juin 2021, restera gravé dans nos mémoires.",
    icon: FaMusic,
  },
  {
    year: 2024,
    title: "40 Ans de Passion",
    description:
      "Aujourd'hui, nous célébrons 40 ans d'une aventure humaine exceptionnelle. Des milliers d'heures de répétition, des centaines de concerts, des amitiés indéfectibles. Le Bon Tempérament, c'est bien plus qu'un ensemble : c'est une famille musicale qui continue de grandir.",
    icon: FaTrophy,
  },
];

const AnniversaryTimeline = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const { scrollY } = useScroll();
  const lineHeight = useTransform(scrollY, [0, 2000], ["0%", "100%"]);
  const y = useTransform(scrollY, [0, 2000], [30, -30]);

  return (
    <section
      id="timeline"
      ref={sectionRef}
      className="bg-background relative overflow-hidden py-16"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y }}
        className="bg-primary/5 absolute top-1/4 left-0 h-[500px] w-[500px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
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
              Notre Parcours : 40 Ans
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Découvrez les moments clés qui ont marqué notre histoire
          </p>
        </motion.div>

        <div ref={timelineRef} className="relative">
          {/* Vertical line with glass effect */}
          <div className="bg-primary/10 absolute top-0 left-8 h-full w-1 rounded-full backdrop-blur-sm md:left-1/2 md:-translate-x-1/2">
            <motion.div
              style={{ height: lineHeight }}
              className="from-primary to-primary/50 relative w-full overflow-hidden rounded-full bg-gradient-to-b"
            >
              {/* Animated shimmer on the line */}
              <motion.div
                animate={{
                  y: ["0%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                  height: "50%",
                }}
              />
            </motion.div>
          </div>

          {/* Timeline events */}
          <div className="space-y-12 md:space-y-16">
            {timelineEvents.map((event, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={event.year}
                  initial={{
                    opacity: 0,
                    x: isEven ? -30 : 30,
                  }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6,
                  }}
                  className={`relative flex items-center gap-6 md:gap-12 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Year badge with glass morphism */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      {/* Glow effect */}
                      <div className="from-primary/40 to-primary/20 absolute inset-0 scale-110 rounded-full bg-gradient-to-br blur-2xl" />

                      {/* Main badge */}
                      <div className="from-primary to-primary/80 shadow-primary/20 relative rounded-full bg-gradient-to-br p-6 shadow-xl">
                        <event.icon className="relative z-10 text-3xl text-white" />
                      </div>

                      {/* Year label with glass effect */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        <div className="relative">
                          <div className="bg-primary/10 absolute inset-0 -z-10 rounded-full backdrop-blur-sm" />
                          <div className="from-foreground to-foreground/90 text-background rounded-full bg-gradient-to-r px-4 py-1 text-sm font-semibold shadow-lg">
                            {event.year}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Content card with glass morphism */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`group border-primary/10 bg-background/50 hover:shadow-primary/10 relative flex-1 overflow-hidden rounded-xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                      isEven
                        ? "md:mr-auto md:max-w-md"
                        : "md:ml-auto md:max-w-md"
                    }`}
                  >
                    {/* Animated gradient on hover */}
                    <motion.div
                      className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(26, 135, 141, 0.08) 0%, transparent 70%)",
                      }}
                    />

                    <h3 className="text-foreground mb-3 text-2xl font-semibold">
                      {event.title}
                    </h3>
                    <p className="text-foreground/70 leading-relaxed font-light">
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
