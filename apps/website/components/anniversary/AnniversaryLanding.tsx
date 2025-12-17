"use client";

import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import { Button } from "@heroui/react";
import { gsap } from "gsap";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
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

// Icon mapping for hero stats
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
}

const AnniversaryLanding = ({ hero, stats }: AnniversaryLandingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  // Parallax effects - using viewport scroll to avoid SSR hydration issues
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Prevent scrolling during intro animation - apply immediately on mount
  useLayoutEffect(() => {
    // Apply scroll prevention immediately if intro should be shown
    if (showIntro && hero.enable_intro_animation) {
      // Scroll to top immediately to prevent any initial scroll
      window.scrollTo(0, 0);

      // Store current scroll position (should be 0, but just in case)
      const scrollY = 0;

      // Prevent scrolling on both body and html
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.position = "fixed";
      document.documentElement.style.top = "0px";
      document.documentElement.style.width = "100%";
      document.documentElement.style.height = "100%";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "0px";
      document.body.style.width = "100%";
      document.body.style.height = "100%";

      // Prevent touch scrolling
      const preventTouchMove = (e: TouchEvent) => {
        e.preventDefault();
      };

      // Prevent wheel scrolling
      const preventWheel = (e: WheelEvent) => {
        e.preventDefault();
      };

      // Prevent keyboard scrolling
      const preventKeyboard = (e: KeyboardEvent) => {
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            " ",
          ].includes(e.key)
        ) {
          e.preventDefault();
        }
      };

      // Prevent scroll event
      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      // Add event listeners with capture phase for immediate prevention
      document.addEventListener("touchmove", preventTouchMove, {
        passive: false,
        capture: true,
      });
      document.addEventListener("wheel", preventWheel, {
        passive: false,
        capture: true,
      });
      document.addEventListener("keydown", preventKeyboard, { capture: true });
      document.addEventListener("scroll", preventScroll, {
        passive: false,
        capture: true,
      });
      window.addEventListener("scroll", preventScroll, {
        passive: false,
        capture: true,
      });

      return () => {
        // Restore scrolling
        document.documentElement.style.overflow = "";
        document.documentElement.style.position = "";
        document.documentElement.style.top = "";
        document.documentElement.style.width = "";
        document.documentElement.style.height = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.height = "";

        // Ensure we're at the top when intro ends
        window.scrollTo(0, 0);

        // Remove event listeners
        document.removeEventListener("touchmove", preventTouchMove, {
          capture: true,
        });
        document.removeEventListener("wheel", preventWheel, { capture: true });
        document.removeEventListener("keydown", preventKeyboard, {
          capture: true,
        });
        document.removeEventListener("scroll", preventScroll, {
          capture: true,
        });
        window.removeEventListener("scroll", preventScroll, { capture: true });
      };
    } else {
      // Clean up when intro is hidden
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.top = "";
      document.documentElement.style.width = "";
      document.documentElement.style.height = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
  }, [showIntro, hero.enable_intro_animation]);

  useEffect(() => {
    // Skip intro animation if disabled in config
    if (!hero.enable_intro_animation) {
      setShowIntro(false);
      setShowContent(true);
      return;
    }

    if (skipped) {
      setShowIntro(false);
      setShowContent(true);
      return;
    }

    const ctx = gsap.context(() => {
      // Animate the main 40 text
      gsap.fromTo(
        ".intro-number",
        {
          scale: 0,
          opacity: 0,
          rotateY: 180,
        },
        {
          scale: 1,
          opacity: 1,
          rotateY: 0,
          duration: 1.2,
          ease: "back.out(1.7)",
          onComplete: () => {
            // Pulse effect
            gsap.to(".intro-number", {
              scale: 1.05,
              duration: 0.8,
              yoyo: true,
              repeat: 2,
              ease: "power2.inOut",
              onComplete: () => {
                setTimeout(() => {
                  setShowIntro(false);
                  setShowContent(true);
                }, 500);
              },
            });
          },
        },
      );

      // Create floating musical notes
      const createFloatingNotes = () => {
        const container = document.querySelector(".floating-notes-container");
        if (!container) return;

        for (let i = 0; i < 30; i++) {
          const note = document.createElement("div");
          note.className = "floating-note";
          note.innerHTML = i % 2 === 0 ? "♪" : "♫";
          note.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            color: rgba(26, 135, 141, ${Math.random() * 0.4 + 0.2});
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            pointer-events: none;
          `;
          container.appendChild(note);

          gsap.to(note, {
            y: (Math.random() - 0.5) * 300,
            x: (Math.random() - 0.5) * 300,
            rotation: Math.random() * 360,
            opacity: 0,
            duration: Math.random() * 3 + 2,
            repeat: -1,
            ease: "none",
          });
        }
      };

      createFloatingNotes();
    }, containerRef);

    return () => ctx.revert();
  }, [skipped]);

  const handleSkip = () => {
    setSkipped(true);
    setShowIntro(false);
    setShowContent(true);
  };

  return (
    <>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
            }}
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-50 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              {hero.skip_button_text}
            </button>

            {/* Floating musical notes container */}
            <div className="floating-notes-container absolute inset-0" />

            {/* Glass morphism effect */}
            <div className="absolute inset-0 backdrop-blur-[100px]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 50%, rgba(26, 135, 141, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(26, 135, 141, 0.2) 0%, transparent 50%)",
                }}
              />
            </div>

            {/* Main content with glass effect */}
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-8"
              >
                <div className="intro-number relative inline-block">
                  {/* Glass morphism card behind the number */}
                  <div className="absolute inset-0 -z-10 scale-110 rounded-3xl bg-white/5 backdrop-blur-xl" />
                  <div
                    className="absolute inset-0 -z-10 scale-110 rounded-3xl opacity-50"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(26, 135, 141, 0.3) 0%, rgba(13, 107, 112, 0.3) 100%)",
                      filter: "blur(40px)",
                    }}
                  />

                  <div className="relative px-16 py-12">
                    <span
                      className="bg-gradient-to-br from-[#1A878D] via-[#1A878D] to-[#0D6B70] bg-clip-text text-[12rem] leading-none font-light text-transparent md:text-[16rem]"
                      style={{
                        textShadow: "0 0 80px rgba(26, 135, 141, 0.5)",
                      }}
                    >
                      {hero.hero_number}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="space-y-2"
              >
                <div className="relative inline-block rounded-2xl bg-white/5 px-8 py-4 backdrop-blur-xl">
                  <h1 className="text-4xl font-light text-white md:text-6xl">
                    ANS DU BON TEMPÉRAMENT
                  </h1>
                </div>
              </motion.div>
            </div>

            {/* Animated gradient orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="bg-primary/30 absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="bg-primary/20 absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-[120px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {showContent && (
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-screen overflow-hidden pt-20"
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

          {/* Floating music notes in background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => {
              // More random distribution using different prime numbers and offsets
              const startX = ((i * 37 + 17) % 95) + (i % 2) * 3;
              const startY = ((i * 53 + 29) % 90) + (i % 3) * 5;
              const endY = ((i * 71 + 41) % 85) + 5;
              const endX1 = ((i * 89 + 13) % 88) + 6;
              const endX2 = ((i * 97 + 31) % 83) + 8;

              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    left: `${startX}%`,
                    top: `${startY}%`,
                    color: "rgba(26, 135, 141, 0.35)",
                  }}
                  initial={{
                    opacity: 1,
                  }}
                  animate={{
                    y: ["0%", "-10%", `${endY - startY}%`],
                    x: ["0%", `${endX1 - startX}%`, `${endX2 - startX}%`],
                    opacity: [1, 0.7, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: Math.random() * 10 + 10,
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

          {/* Hero content with glass morphism */}
          <div
            ref={sectionRef}
            className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Glass morphism title card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
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

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-foreground mb-4 text-2xl font-semibold md:text-4xl"
              >
                {hero.hero_subtitle}
              </motion.p>
              {hero.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-foreground mx-auto max-w-3xl text-lg leading-relaxed font-light md:text-xl"
                >
                  {hero.description}
                </motion.p>
              )}
            </motion.div>

            {/* Stats cards with glass morphism */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
            >
              {stats.map((stat, index) => {
                const IconComponent = iconMap[stat.icon_name] || FaMusic;
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.8 + index * 0.1,
                      duration: 0.6,
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                  >
                    {/* Animated gradient on hover */}
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

            {/* CTA Button with glass effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-12 flex justify-center"
            >
              <Button
                color="primary"
                size="lg"
                radius="sm"
                className="group relative overflow-hidden backdrop-blur-sm"
                onClick={() => {
                  document
                    .getElementById(hero.cta_target_section)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="relative z-10">{hero.cta_text}</span>
                {/* Shimmer effect */}
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
          </div>
        </motion.section>
      )}
    </>
  );
};

export default AnniversaryLanding;
