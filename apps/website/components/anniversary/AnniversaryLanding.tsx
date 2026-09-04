"use client";

import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import { gsap } from "gsap";
import {
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

const INTRO_SEEN_KEY = "anniversary-intro-seen";
const INTRO_YEARS = [1987, 1997, 2007, 2017, 2027];
const INTRO_WORDS = ["40", "ANS", "DU", "BON", "TEMPÉRAMENT"];
const NUM_BATONS = 48;

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
  const introRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Decide before paint whether the intro plays: CMS flag off, reduced
  // motion, or already seen this session all skip straight to the hero.
  useLayoutEffect(() => {
    const seen =
      typeof window !== "undefined" &&
      sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
    const playIntro =
      hero.enable_intro_animation && !shouldReduceMotion && !seen;

    if (!playIntro) {
      setShowIntro(false);
      setShowContent(true);
      onIntroStateChange?.(false);
      return;
    }

    onIntroStateChange?.(true);
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [hero.enable_intro_animation, shouldReduceMotion, onIntroStateChange]);

  // The intro is one GSAP timeline: a single source of truth that can be
  // skipped (tl.progress(1)) instead of the old chained setTimeouts.
  useEffect(() => {
    if (!showIntro) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          sessionStorage.setItem(INTRO_SEEN_KEY, "true");
          setShowIntro(false);
          setShowContent(true);
          onIntroStateChange?.(false);
        },
      });
      timelineRef.current = tl;

      tl
        // Scene 1 — the timeline line draws itself, decade markers pop in
        .fromTo(
          ".intro-line",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" },
          0,
        )
        .fromTo(
          ".intro-year-dot",
          { attr: { r: 0 }, opacity: 0 },
          { attr: { r: 6 }, opacity: 1, duration: 0.4, stagger: 0.08 },
          0.3,
        )
        .fromTo(
          ".intro-year-label",
          { opacity: 0, y: 10 },
          { opacity: 0.5, y: 0, duration: 0.4, stagger: 0.08 },
          0.4,
        )
        .to(
          ".intro-timeline-scene",
          { opacity: 0, duration: 0.5, ease: "power1.in" },
          1.5,
        )
        // Scene 2 — the "40" appears and makes a single slow turn
        .fromTo(
          ".intro-forty",
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" },
          1.6,
        )
        .fromTo(
          ".intro-glow",
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 1.2 },
          1.6,
        )
        .fromTo(
          ".intro-forty-inner",
          { rotateY: 0 },
          { rotateY: 360, duration: 2.2, ease: "power2.inOut" },
          1.8,
        )
        .to(
          ".intro-forty-scene",
          {
            yPercent: -30,
            opacity: 0,
            scale: 0.9,
            duration: 0.6,
            ease: "power2.in",
          },
          3.4,
        )
        // Scene 3 — the words rise, subtitle follows
        .fromTo(
          ".intro-word",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, stagger: 0.09, ease: "expo.out" },
          3.6,
        )
        .fromTo(
          ".intro-subtitle",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          4.3,
        )
        .fromTo(
          ".intro-edge",
          { scaleY: 0 },
          { scaleY: 1, duration: 0.6, stagger: 0.05 },
          4.4,
        )
        .to(".intro-words-scene", { opacity: 0, duration: 0.5 }, 5.6)
        // Scene 4 — light batons burst from the center, then fade to content
        .fromTo(
          ".intro-baton",
          { height: 0, opacity: 1 },
          { height: "150vh", opacity: 0, duration: 1, stagger: 0.012 },
          5.8,
        )
        .to(
          introRef.current,
          { opacity: 0, duration: 0.7, ease: "power1.inOut" },
          6.7,
        );
    }, introRef);

    return () => ctx.revert();
  }, [showIntro, onIntroStateChange]);

  const skipIntro = () => timelineRef.current?.progress(1);

  useEffect(() => {
    if (!showIntro) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skipIntro();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showIntro]);

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
        staggerChildren: 0.12,
      },
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] },
    },
  };

  return (
    <>
      {/* Runs before paint: hides the SSR'd intro overlay for returning
          visitors / reduced-motion users so it never flashes on screen. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")==="true"||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-skip")}catch(e){}`,
        }}
      />
      {showIntro && (
        <div
          ref={introRef}
          className="intro-root fixed inset-0 z-999 overflow-hidden bg-black"
        >
          <button
            onClick={skipIntro}
            className="focus-visible:outline-primary absolute top-4 right-4 z-50 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white/60 backdrop-blur-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:top-8 sm:right-8 sm:px-6"
          >
            {hero.skip_button_text}
          </button>

          {/* Scene 1: timeline */}
          <div className="intro-timeline-scene absolute inset-0 flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1920 1080"
              className="absolute inset-0"
              aria-hidden="true"
            >
              <path
                className="intro-line"
                d="M 0 540 Q 480 540 960 540 T 1920 540"
                stroke="url(#timelineGradient)"
                strokeWidth="2"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
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
              {INTRO_YEARS.map((year, index) => (
                <g key={year}>
                  <circle
                    className="intro-year-dot"
                    cx={384 + index * 288}
                    cy="540"
                    r="0"
                    fill="#ffffff"
                    opacity="0"
                  />
                  <text
                    className="intro-year-label"
                    x={384 + index * 288}
                    y="515"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="48"
                    fontWeight="300"
                    opacity="0"
                  >
                    {year}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Scene 2: the "40" */}
          <div className="intro-forty-scene absolute inset-0 flex items-center justify-center">
            <div
              className="intro-glow absolute rounded-full"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                filter: "blur(100px)",
                width: "clamp(300px, 80vw, 600px)",
                height: "clamp(300px, 80vw, 600px)",
                opacity: 0,
              }}
            />
            <div style={{ perspective: "1000px" }}>
              <div
                className="intro-forty"
                style={{ opacity: 0, transform: "scale(0.85)" }}
              >
                <div
                  className="intro-forty-inner"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <span
                    className="block text-[12rem] leading-none font-thin select-none sm:text-[16rem] lg:text-[20rem]"
                    aria-hidden="true"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 55%, #999999 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 120px rgba(255,255,255,0.4)",
                    }}
                  >
                    40
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scene 3: the words */}
          <div
            className="intro-words-scene absolute inset-0"
            style={{ opacity: 1 }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative text-center">
                <div className="mb-8">
                  {INTRO_WORDS.map((word) => (
                    <span
                      key={word}
                      className="mx-1 inline-block overflow-hidden align-bottom sm:mx-2"
                    >
                      <span
                        className="intro-word inline-block text-4xl font-thin tracking-wide sm:text-5xl md:text-7xl"
                        style={{
                          transform: "translateY(110%)",
                          background:
                            "linear-gradient(180deg, #ffffff 0%, #888888 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </div>
                <p
                  className="intro-subtitle text-lg font-light text-white/60 sm:text-xl md:text-2xl"
                  style={{ opacity: 0 }}
                >
                  Une célébration de la musique et de la passion
                </p>
              </div>
            </div>
            <div
              className="intro-edge absolute inset-x-0 top-0 h-24"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(180deg, #000000 0%, transparent 100%)",
                transform: "scaleY(0)",
                transformOrigin: "top",
              }}
            />
            <div
              className="intro-edge absolute inset-x-0 bottom-0 h-24"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(0deg, #000000 0%, transparent 100%)",
                transform: "scaleY(0)",
                transformOrigin: "bottom",
              }}
            />
          </div>

          {/* Scene 4: light batons */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <div className="relative h-1 w-1">
              {[...Array(NUM_BATONS)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${i * (360 / NUM_BATONS)}deg)`,
                  }}
                >
                  <div
                    className="intro-baton w-px origin-bottom bg-linear-to-t from-transparent via-white/80 to-transparent"
                    style={{ height: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showContent && (
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
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
                    whileHover={shouldReduceMotion ? {} : { y: -5 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
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
