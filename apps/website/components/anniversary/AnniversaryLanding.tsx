"use client";

import { Button } from "@heroui/react";
import { gsap } from "gsap";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaMusic, FaTrophy, FaUsers } from "react-icons/fa";

const AnniversaryLanding = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [showContent, setShowContent] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) {
      setShowContent(true);
      return;
    }

    const ctx = gsap.context(() => {
      // Create particle system
      const particles = particlesRef.current;
      if (particles) {
        for (let i = 0; i < 50; i++) {
          const particle = document.createElement("div");
          particle.className = "absolute w-2 h-2 rounded-full";
          particle.style.background = `hsl(${Math.random() * 60 + 15}, 70%, 60%)`;
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
          particles.appendChild(particle);

          gsap.to(particle, {
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
            scale: Math.random() * 2 + 0.5,
            duration: Math.random() * 3 + 2,
            repeat: -1,
            ease: "none",
          });
        }
      }

      // Animate the number 40
      if (numberRef.current) {
        gsap.fromTo(
          numberRef.current,
          {
            scale: 0,
            rotation: 720,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 1.5,
            ease: "back.out(1.7)",
            onComplete: () => {
              // Pulse animation
              gsap.to(numberRef.current, {
                scale: 1.1,
                duration: 0.5,
                yoyo: true,
                repeat: 3,
                ease: "power2.inOut",
                onComplete: () => {
                  setTimeout(() => setShowContent(true), 500);
                },
              });
            },
          },
        );
      }

      // Animate background elements
      gsap.fromTo(
        ".landing-bg-element",
        {
          scale: 0,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 0.1,
          duration: 2,
          stagger: 0.1,
          ease: "power2.out",
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [skipped]);

  const handleSkip = () => {
    setSkipped(true);
    setShowContent(true);
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          if (containerRef.current) {
            containerRef.current.style.display = "none";
          }
        },
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {!showContent && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1A878D] via-[#3D7CB2] to-[#9D609B]"
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-50 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/30"
            >
              Passer l'animation
            </button>

            {/* Particles */}
            <div
              ref={particlesRef}
              className="absolute inset-0 overflow-hidden"
            />

            {/* Background decorative elements */}
            <div className="landing-bg-element bg-primary/40 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
            <div className="landing-bg-element absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-orange-300 blur-3xl" />
            <div className="landing-bg-element absolute bottom-1/4 left-1/3 h-36 w-36 rounded-full bg-rose-300 blur-3xl" />

            {/* Main number display */}
            <div className="relative z-10 text-center">
              <div
                ref={numberRef}
                className="text-[20rem] leading-none font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] md:text-[30rem]"
              >
                40
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="mt-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl"
              >
                ANS DU BON TEMPÉRAMENT
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content after animation */}
      <AnimatePresence>
        {showContent && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative min-h-screen overflow-hidden pt-20"
          >
            {/* Animated background */}
            <div className="absolute inset-0">
              <div className="bg-primary/20 absolute top-0 left-0 h-96 w-96 animate-pulse rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-0 h-96 w-96 animate-pulse rounded-full bg-[#3D7CB2]/20 blur-3xl delay-1000" />
              <div className="absolute bottom-0 left-1/2 h-96 w-96 animate-pulse rounded-full bg-[#9D609B]/20 blur-3xl delay-2000" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-8">
              {/* Hero content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-center"
              >
                <motion.h1
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                  className="mb-6 text-6xl font-black text-gray-900 md:text-8xl dark:text-white"
                >
                  <span className="bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] bg-clip-text text-transparent">
                    40 ANS
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-4 text-2xl font-bold text-gray-800 md:text-4xl dark:text-gray-200"
                >
                  De Passion Musicale
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mx-auto max-w-3xl text-lg text-gray-700 md:text-xl dark:text-gray-300"
                >
                  Depuis 1984, Le Bon Tempérament continue de partager sa
                  passion pour la musique classique. Découvrez 40 ans
                  d&apos;histoire, de concerts, de souvenirs et de moments
                  inoubliables.
                </motion.p>
              </motion.div>

              {/* Stats cards */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4"
              >
                {[
                  { icon: FaCalendarAlt, number: "40", label: "Années" },
                  { icon: FaMusic, number: "200+", label: "Concerts" },
                  { icon: FaUsers, number: "500+", label: "Membres" },
                  { icon: FaTrophy, number: "15+", label: "CDs" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, type: "spring" }}
                    className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800/80"
                  >
                    <div className="mb-4 flex justify-center">
                      <stat.icon className="text-primary text-4xl" />
                    </div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white">
                      {stat.number}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                    <div className="from-primary/30 absolute inset-0 -z-10 bg-gradient-to-br to-rose-200/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="mt-12 flex justify-center"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  onClick={() => {
                    document
                      .getElementById("anniversary-navigation")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explorer 40 Ans d&apos;Histoire
                </Button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

export default AnniversaryLanding;
