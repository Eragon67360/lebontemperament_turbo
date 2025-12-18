"use client";

import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import { Button } from "@heroui/react";
import {
  AnimatePresence,
  motion,
  useMotionValue, // IMPROVEMENT: Import for mouse interactivity
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

// ... (iconMap and component props are unchanged) ...
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
  // ... (All intro state and useEffect logic is unchanged) ...
  const sectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [phase, setPhase] = useState(0);

  useLayoutEffect(() => {
    if (showIntro && hero.enable_intro_animation) {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showIntro, hero.enable_intro_animation]);

  useEffect(() => {
    if (!hero.enable_intro_animation) {
      setShowIntro(false);
      setShowContent(true);
      onIntroStateChange?.(false);
      return;
    }

    // Notify parent that intro is starting
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
      // Notify parent that intro is finished
      onIntroStateChange?.(false);
    };

    runAnimation();
  }, [hero.enable_intro_animation, onIntroStateChange]);

  const handleSkip = () => {
    setShowIntro(false);
    setShowContent(true);
    onIntroStateChange?.(false);
  };

  const numBatons = 80;
  const angle = 360 / numBatons;

  // --- IMPROVEMENT: Logic for interactive mouse-tilt effect ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-500, 500], [10, -10], {
    clamp: false,
  });
  const rotateY = useTransform(mouseX, [-500, 500], [-10, 10], {
    clamp: false,
  });

  const handleMouseMove = (event: React.MouseEvent) => {
    if (heroRef.current) {
      const { left, top, width, height } =
        heroRef.current.getBoundingClientRect();
      mouseX.set(event.clientX - left - width / 2);
      mouseY.set(event.clientY - top - height / 2);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // --- IMPROVEMENT: Animation variants for staggered reveal ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // This will animate children 0.2s after one another
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <>
      {/* --- Intro Animation (Unchanged) --- */}
      <AnimatePresence>
        {showIntro && (
          // ... The entire intro animation JSX is unchanged ...
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-50 overflow-hidden bg-black"
          >
            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleSkip}
              className="absolute top-8 right-8 z-50 px-6 py-2 text-sm font-medium text-white/60 backdrop-blur-sm transition-all hover:text-white"
            >
              {hero.skip_button_text}
            </motion.button>
            {/* Phase 1: Drawing the Timeline */}
            {phase >= 1 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: phase >= 3 ? 0 : 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                {" "}
                <motion.svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1920 1080"
                  className="absolute inset-0"
                >
                  {" "}
                  <motion.path
                    d="M 0 540 Q 480 540 960 540 T 1920 540"
                    stroke="url(#timelineGradient)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />{" "}
                  <defs>
                    {" "}
                    <linearGradient
                      id="timelineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      {" "}
                      <stop
                        offset="0%"
                        stopColor="#ffffff"
                        stopOpacity="0"
                      />{" "}
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />{" "}
                      <stop
                        offset="100%"
                        stopColor="#ffffff"
                        stopOpacity="0"
                      />{" "}
                    </linearGradient>{" "}
                  </defs>{" "}
                  {[1987, 1997, 2007, 2017, 2027].map((year, index) => (
                    <motion.g key={year}>
                      {" "}
                      <motion.circle
                        cx={384 + index * 288}
                        cy="540"
                        r="4"
                        fill="#ffffff"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                      />{" "}
                      <motion.text
                        x={384 + index * 288}
                        y="520"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.5, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                      >
                        {" "}
                        {year}{" "}
                      </motion.text>{" "}
                    </motion.g>
                  ))}{" "}
                </motion.svg>{" "}
              </motion.div>
            )}
            {/* Phase 2: Number Revelation */}
            {phase >= 2 && (
              <motion.div className="absolute inset-0 flex items-center justify-center">
                {" "}
                <div className="relative">
                  {" "}
                  <motion.div
                    className="absolute inset-0 -z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0, 0.3, 0.1] }}
                    transition={{ duration: 2, times: [0, 0.5, 1] }}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                      filter: "blur(100px)",
                      width: "600px",
                      height: "600px",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />{" "}
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
                    {" "}
                    <div style={{ perspective: "1000px" }}>
                      {" "}
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
                        {" "}
                        <span
                          className="block text-[20rem] leading-none font-thin text-transparent select-none"
                          aria-hidden="true"
                        >
                          {" "}
                          40{" "}
                        </span>{" "}
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0"
                            style={{ transform: `translateZ(${-30 * i}px)` }}
                          >
                            {" "}
                            <span
                              className="block text-[20rem] leading-none font-thin select-none"
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
                              {" "}
                              40{" "}
                            </span>{" "}
                          </motion.div>
                        ))}{" "}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            transform: "translateZ(-150px) rotateY(180deg)",
                            opacity: 0.1,
                          }}
                        >
                          {" "}
                          <span className="block text-[20rem] leading-none font-thin text-white/20">
                            {" "}
                            40{" "}
                          </span>{" "}
                        </motion.div>{" "}
                      </motion.div>{" "}
                    </div>{" "}
                  </motion.div>{" "}
                </div>{" "}
              </motion.div>
            )}
            {/* Phase 3: Text Revelation */}
            {phase >= 3 && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 4 ? 0 : 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                {" "}
                <div className="absolute inset-0 flex items-center justify-center">
                  {" "}
                  <motion.div
                    className="relative text-center"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {" "}
                    <motion.div className="mb-8">
                      {" "}
                      <div className="overflow-hidden">
                        {" "}
                        {["40", "ANS", "DU", "BON", "TEMPÉRAMENT"].map(
                          (word, wordIndex) => (
                            <motion.span
                              key={wordIndex}
                              className="mx-2 inline-block"
                              initial={{ y: "100%", opacity: 0 }}
                              animate={{ y: "0%", opacity: 1 }}
                              transition={{
                                duration: 0.8,
                                delay: wordIndex * 0.1,
                                ease: [0.215, 0.61, 0.355, 1],
                              }}
                            >
                              {" "}
                              {word.split("").map((letter, letterIndex) => (
                                <motion.span
                                  key={letterIndex}
                                  className="inline-block text-5xl font-thin tracking-wide md:text-7xl"
                                  style={{
                                    background:
                                      "linear-gradient(180deg, #ffffff 0%, #888888 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                  }}
                                >
                                  {" "}
                                  {letter}{" "}
                                </motion.span>
                              ))}{" "}
                            </motion.span>
                          ),
                        )}{" "}
                      </div>{" "}
                    </motion.div>{" "}
                    <motion.p
                      className="text-xl font-light text-white/60 md:text-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.8 }}
                    >
                      {" "}
                      Une célébration de la musique et de la passion{" "}
                    </motion.p>{" "}
                  </motion.div>{" "}
                </div>{" "}
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
                />{" "}
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
                />{" "}
              </motion.div>
            )}
            {/* Phase 4: Spiral Firework */}
            {/* Phase 4: Spiral Firework */}
            {phase >= 4 && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="relative h-1 w-1">
                  {[...Array(numBatons)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0"
                      style={{ transform: `rotate(${i * angle}deg)` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* --- THIS IS THE PART THAT CHANGES --- */}
                      <motion.div
                        className="w-px origin-bottom bg-gradient-to-t from-transparent via-white/80 to-transparent"
                        // Start with no height but full opacity
                        initial={{ height: 0, opacity: 0 }}
                        // Animate to a massive height and fade in completely
                        animate={{
                          height: "150vh", // Grow far beyond the screen edges
                          opacity: 1,
                        }}
                        transition={{
                          duration: 3,
                          delay: i * 0.015, // Slightly increased delay for a more pronounced spiral
                          // A strong "easeOut" makes it feel more like a burst/explosion
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 5: Elegant outro */}
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
          onMouseMove={handleMouseMove} // IMPROVEMENT: Added mouse move handler
          onMouseLeave={handleMouseLeave} // IMPROVEMENT: Added mouse leave handler
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-screen overflow-hidden pt-20"
          style={{ perspective: "1000px" }} // IMPROVEMENT: Add perspective for 3D tilt effect
        >
          {/* Parallax background with glass orbs */}
          <motion.div
            style={{ y: y1, opacity }}
            className="bg-primary/20 absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[100px]"
          />
          <motion.div
            style={{ y: y2, opacity }}
            className="bg-primary/10 absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px]"
          />

          {/* Floating music notes background (unchanged) */}
          <div className="absolute inset-0 overflow-hidden">
            {/* ... music notes map ... */}
          </div>

          {/* --- IMPROVEMENT: Main content wrapper now uses variants for staggered animation --- */}
          <motion.div
            ref={sectionRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-8"
          >
            <motion.div variants={itemVariants} className="text-center">
              {/* --- IMPROVEMENT: Title card now has interactive tilt --- */}
              <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="relative mx-auto mb-8 inline-block"
              >
                <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br backdrop-blur-xl" />
                <div
                  className="absolute inset-0 -z-10 rounded-3xl opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(26, 135, 141, 0.2) 0%, rgba(13, 107, 112, 0.1) 100%)",
                    filter: "blur(20px)",
                  }}
                />
                <h1 className="text-title text-primary/50 dark:text-primary px-12 py-8 leading-none font-light">
                  {hero.hero_number} ANS
                </h1>
              </motion.div>
              <motion.p className="text-foreground mb-4 text-2xl font-semibold md:text-4xl">
                {hero.hero_subtitle}
              </motion.p>
              {hero.description && (
                <motion.p className="text-foreground mx-auto max-w-3xl text-lg leading-relaxed font-light md:text-xl">
                  {hero.description}
                </motion.p>
              )}
            </motion.div>

            {/* --- IMPROVEMENT: Stats cards grid is now an item in the stagger sequence --- */}
            <motion.div
              variants={itemVariants}
              className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
            >
              {stats.map((stat) => {
                const IconComponent = iconMap[stat.icon_name] || FaMusic;
                return (
                  <motion.div
                    key={stat.id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    // IMPROVEMENT: Enhanced hover effect with a glowing border
                    className="group border-primary/10 bg-background/50 hover:shadow-primary/10 hover:border-primary/30 relative overflow-hidden rounded-xl border p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(circle at center, rgba(26, 135, 141, 0.1) 0%, transparent 70%)",
                        }}
                      />
                    </div>
                    <motion.div
                      className="mb-4 flex justify-center"
                      whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="from-primary to-primary/70 rounded-full bg-gradient-to-br p-3">
                        <IconComponent className="text-3xl text-white" />
                      </div>
                    </motion.div>
                    <div className="text-foreground text-4xl font-semibold">
                      {stat.number}
                    </div>
                    <div className="text-foreground/70 mt-2 text-sm font-light">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* --- IMPROVEMENT: CTA button is now an item in the stagger sequence --- */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex justify-center"
            >
              <Button
                color="primary"
                size="lg"
                radius="sm"
                // --- FIX: Added semi-transparent bg and border for glass effect ---
                className="group bg-primary/80 hover:bg-primary/50 relative overflow-hidden border border-white/20 backdrop-blur-sm transition-colors duration-300"
                onClick={() => {
                  document
                    .getElementById(hero.cta_target_section)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="relative z-10">{hero.cta_text}</span>
                <motion.div
                  className="absolute inset-0 -z-0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  }}
                />
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>
      )}
    </>
  );
};

export default AnniversaryLanding;
