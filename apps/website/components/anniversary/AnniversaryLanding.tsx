"use client";

import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { IoMusicalNote, IoMusicalNotes } from "react-icons/io5";
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

interface AnniversaryLandingProps {
  hero: AnniversaryHero;
  stats: HeroStat[];
  onIntroStateChange?: (isIntroActive: boolean) => void;
}

const AnniversaryLanding = ({
  hero,
  stats,
  onIntroStateChange,
}: AnniversaryLandingProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [phase, setPhase] = useState(0);

  useLayoutEffect(() => {
    if (showIntro && hero.enable_intro_animation && !shouldReduceMotion) {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showIntro, hero.enable_intro_animation, shouldReduceMotion]);

  useEffect(() => {
    if (!hero.enable_intro_animation || shouldReduceMotion) {
      setShowIntro(false);
      setShowContent(true);
      onIntroStateChange?.(false);
      return;
    }

    onIntroStateChange?.(true);
    const runAnimation = async () => {
      setPhase(1);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPhase(2);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPhase(3);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setPhase(4);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPhase(5);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowIntro(false);
      setShowContent(true);
      onIntroStateChange?.(false);
    };
    runAnimation();
  }, [hero.enable_intro_animation, shouldReduceMotion, onIntroStateChange]);

  const handleSkip = () => {
    setShowIntro(false);
    setShowContent(true);
    onIntroStateChange?.(false);
  };

  const numBatons = 80;
  const introAngle = 360 / numBatons;

  const { scrollY } = useScroll();
  const y1Raw = useTransform(scrollY, [0, 500], [0, 150]);
  const y2Raw = useTransform(scrollY, [0, 500], [0, -100]);
  const scrollOpacityRaw = useTransform(scrollY, [0, 300], [1, 0]);
  const y1 = shouldReduceMotion ? 0 : y1Raw;
  const y2 = shouldReduceMotion ? 0 : y2Raw;
  const scrollOpacity = shouldReduceMotion ? 1 : scrollOpacityRaw;

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-999 overflow-hidden bg-black"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleSkip}
              className="absolute top-4 right-4 z-50 px-4 py-2 text-sm font-medium text-white/60 backdrop-blur-sm transition-all hover:text-white sm:top-8 sm:right-8 sm:px-6"
            >
              {hero.skip_button_text}
            </motion.button>

            {phase >= 1 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: phase >= 3 ? 0 : 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <motion.svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1920 1080"
                  className="absolute inset-0"
                >
                  <motion.path
                    d="M 0 540 Q 480 540 960 540 T 1920 540"
                    stroke="url(#timelineGradient)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="timelineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[1987, 1997, 2007, 2017, 2027].map((year, index) => (
                    <motion.g key={year}>
                      <motion.circle
                        cx={384 + index * 288}
                        cy="540"
                        r="6"
                        fill="#ffffff"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                      />
                      <motion.text
                        x={384 + index * 288}
                        y="515"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="48"
                        fontWeight="300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.5, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                      >
                        {year}
                      </motion.text>
                    </motion.g>
                  ))}
                </motion.svg>
              </motion.div>
            )}

            {phase >= 2 && (
              <motion.div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 -z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0, 0.3, 0.1] }}
                    transition={{ duration: 2, times: [0, 0.5, 1] }}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                      filter: "blur(100px)",
                      width: "clamp(300px, 80vw, 600px)",
                      height: "clamp(300px, 80vw, 600px)",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0, y: 0 }}
                    animate={{
                      scale: phase >= 3 ? 0.7 : 1,
                      opacity: phase >= 3 ? 0 : 1,
                      y: phase >= 3 ? "-100%" : 0,
                    }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div style={{ perspective: "1000px" }}>
                      <motion.div
                        className="relative inline-block"
                        animate={{ rotateY: [0, 360] }}
                        transition={{
                          duration: 4,
                          ease: "easeInOut",
                          delay: 0.5,
                          repeat: Infinity,
                          repeatType: "loop",
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <span
                          className="block text-[12rem] leading-none font-thin text-transparent select-none sm:text-[16rem] lg:text-[20rem]"
                          aria-hidden="true"
                        >
                          40
                        </span>
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0"
                            style={{ transform: `translateZ(${-30 * i}px)` }}
                          >
                            <span
                              className="block text-[12rem] leading-none font-thin select-none sm:text-[16rem] lg:text-[20rem]"
                              style={{
                                background: `linear-gradient(135deg, #ffffff ${100 - i * 15}%, #999999 100%)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                textShadow:
                                  i === 0
                                    ? "0 0 120px rgba(255,255,255,0.5)"
                                    : "none",
                                filter: i > 0 ? "blur(1px)" : "none",
                              }}
                            >
                              40
                            </span>
                          </motion.div>
                        ))}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            transform: "translateZ(-150px) rotateY(180deg)",
                            opacity: 0.1,
                          }}
                        >
                          <span className="block text-[12rem] leading-none font-thin text-white/20 sm:text-[16rem] lg:text-[20rem]">
                            40
                          </span>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {phase >= 3 && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 4 ? 0 : 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <motion.div
                    className="relative text-center"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-8">
                      <div className="overflow-hidden">
                        {["40", "ANS", "DU", "BON", "TEMPÉRAMENT"].map(
                          (word, wordIndex) => (
                            <motion.span
                              key={wordIndex}
                              className="mx-1 inline-block sm:mx-2"
                              initial={{ y: "100%", opacity: 0 }}
                              animate={{ y: "0%", opacity: 1 }}
                              transition={{
                                duration: 0.8,
                                delay: wordIndex * 0.1,
                                ease: [0.215, 0.61, 0.355, 1],
                              }}
                            >
                              {word.split("").map((letter, letterIndex) => (
                                <motion.span
                                  key={letterIndex}
                                  className="inline-block text-4xl font-thin tracking-wide sm:text-5xl md:text-7xl"
                                  style={{
                                    background:
                                      "linear-gradient(180deg, #ffffff 0%, #888888 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                  }}
                                >
                                  {letter}
                                </motion.span>
                              ))}
                            </motion.span>
                          ),
                        )}
                      </div>
                    </div>
                    <motion.p
                      className="text-lg font-light text-white/60 sm:text-xl md:text-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.8 }}
                    >
                      Une célébration de la musique et de la passion
                    </motion.p>
                  </motion.div>
                </div>
                <motion.div
                  className="absolute inset-x-0 top-0 h-24"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  style={{
                    background:
                      "linear-gradient(180deg, #000000 0%, transparent 100%)",
                    transformOrigin: "top",
                  }}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-24"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  style={{
                    background:
                      "linear-gradient(0deg, #000000 0%, transparent 100%)",
                    transformOrigin: "bottom",
                  }}
                />
              </motion.div>
            )}

            {phase >= 4 && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="relative h-1 w-1">
                  {[...Array(numBatons)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0"
                      style={{ transform: `rotate(${i * introAngle}deg)` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                    >
                      <motion.div
                        className="w-px origin-bottom bg-linear-to-t from-transparent via-white/80 to-transparent"
                        initial={{ height: 0, opacity: 1 }}
                        animate={{ height: "150vh", opacity: 0 }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.015,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {phase >= 5 && (
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showContent && (
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative min-h-screen overflow-hidden bg-slate-50 pt-20 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: y1, opacity: scrollOpacity }}
              className="bg-primary/10 absolute -top-40 -left-40 h-120 w-120 rounded-full blur-3xl md:h-160 md:w-160"
            />
            <motion.div
              style={{ y: y2, opacity: scrollOpacity }}
              className="absolute -right-40 -bottom-40 h-120 w-120 rounded-full bg-sky-400/10 blur-3xl md:h-160 md:w-160"
            />

            {!shouldReduceMotion && (
              <div className="absolute inset-0">
                {[...Array(15)].map((_, i) => {
                  const startX = ((i * 37 + 17) % 95) + (i % 2) * 3;
                  const startY = ((i * 53 + 29) % 90) + (i % 3) * 5;
                  const endY = ((i * 71 + 41) % 85) + 5;
                  const endX1 = ((i * 89 + 13) % 88) + 6;
                  const endX2 = ((i * 97 + 31) % 83) + 8;
                  return (
                    <motion.div
                      key={i}
                      className="text-primary/35 absolute text-2xl"
                      style={{
                        left: `${startX}%`,
                        top: `${startY}%`,
                      }}
                      animate={{
                        y: ["0%", "-10%", `${endY - startY}%`],
                        x: ["0%", `${endX1 - startX}%`, `${endX2 - startX}%`],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 15 + ((i * 7) % 20),
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "linear",
                      }}
                    >
                      {i % 3 === 0 ? <IoMusicalNote /> : <IoMusicalNotes />}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8"
          >
            <motion.div variants={fadeInUp}>
              <div className="relative mx-auto mb-8 inline-block">
                <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br backdrop-blur-lg dark:from-slate-800 dark:to-slate-900" />
                <div
                  className="absolute inset-0 -z-10 rounded-3xl opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  }}
                />
                <h1 className="text-primary px-8 py-6 text-6xl font-thin tracking-tight sm:px-12 sm:py-8 sm:text-7xl lg:text-8xl dark:text-white">
                  {hero.hero_number} ANS
                </h1>
              </div>

              <p className="mx-auto mt-6 max-w-3xl text-xl font-light text-slate-500 md:text-2xl dark:text-slate-400">
                {hero.hero_subtitle}
              </p>
              {hero.description && (
                <p className="mx-auto mt-4 max-w-2xl text-base font-light text-slate-400 dark:text-slate-500">
                  {hero.description}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-16 grid grid-cols-2 gap-4 text-left md:grid-cols-4 md:gap-8"
            >
              {stats.map((stat) => {
                const IconComponent = iconMap[stat.icon_name] || FaMusic;
                return (
                  <motion.div
                    key={stat.id}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 p-4 backdrop-blur-md transition-all duration-300 hover:border-slate-300/80 sm:p-5 dark:border-slate-800/50 dark:bg-slate-900/30 dark:hover:border-slate-700/80"
                  >
                    <div
                      className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(173, 216, 230, 0.1) 0%, transparent 80%)",
                      }}
                    />
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/5 text-primary dark:bg-primary/10 shrink-0 rounded-lg p-3">
                        <IconComponent className="text-xl" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-slate-800 dark:text-white">
                          {stat.number}
                        </p>
                        <p className="text-sm font-light text-slate-500 dark:text-slate-400">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-16">
              <AnniversaryCTA
                onClick={() => {
                  document
                    .getElementById(hero.cta_target_section)
                    ?.scrollIntoView({
                      behavior: shouldReduceMotion ? "auto" : "smooth",
                    });
                }}
              >
                {hero.cta_text}
              </AnniversaryCTA>
            </motion.div>
          </motion.div>
        </motion.section>
      )}
    </>
  );
};

export default AnniversaryLanding;
