"use client";

import { useAdminStatus, useAnniversaryFeature } from "@/hooks/useFeatureFlag";
import { gsap } from "gsap";
import { motion, useMotionValue, useSpring } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaBirthdayCake, FaStar } from "react-icons/fa";

const FloatingAnniversaryButton = () => {
  const { isEnabled: isAnniversaryEnabled } = useAnniversaryFeature();
  const { isAdmin } = useAdminStatus();
  const router = useRouter();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Smooth spring animation for mouse following
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center
        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;

        mouseX.set(deltaX);
        mouseY.set(deltaY);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Create confetti particles
  const createConfetti = () => {
    if (confettiActive) return;
    setConfettiActive(true);

    const colors = [
      "#1A878D",
      "#0D6B70",
      "#1A878D",
      "#0D6B70",
      "#1A878D",
      "#0D6B70",
      "#1A878D",
      "#0D6B70",
      "#1A878D",
      "#0D6B70",
    ];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.className = "fixed pointer-events-none z-[9999]";
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)] || "#FF6B6B";
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
      confetti.style.left = `${mousePosition.x}px`;
      confetti.style.top = `${mousePosition.y}px`;
      document.body.appendChild(confetti);

      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        rotation: Math.random() * 720,
        opacity: 0,
        duration: Math.random() * 1 + 0.5,
        ease: "power2.out",
        onComplete: () => confetti.remove(),
      });
    }

    setTimeout(() => setConfettiActive(false), 1000);
  };

  const handleClick = () => {
    createConfetti();
    setTimeout(() => {
      void router.push("/40-ans");
    }, 300);
  };

  // Show button if feature is enabled OR user is admin
  // Hide button on anniversary, membres, or track pages
  const shouldShow =
    (isAnniversaryEnabled || isAdmin) &&
    !pathname.startsWith("/40-ans") &&
    !pathname.startsWith("/membres") &&
    !pathname.startsWith("/track");

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-primary group hover:shadow-primary/50 fixed bottom-8 left-8 z-50 hidden h-24 w-24 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 lg:flex"
      style={{ x, y }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Célébrer 40 ans du Bon Tempérament"
    >
      {/* Pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-white/30"
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isHovered ? [0.5, 0, 0.5] : 0.5,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Sparkles */}
      {isHovered && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-white"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 60,
                y: Math.sin((i / 8) * Math.PI * 2) * 60,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black text-white drop-shadow-lg"
          animate={{
            rotate: isHovered ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          40
        </motion.span>
        <motion.div
          className="absolute -bottom-1"
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <FaBirthdayCake className="text-sm text-white" />
        </motion.div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : 20,
        }}
        className="pointer-events-none absolute left-full ml-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-xl"
      >
        <div className="flex items-center gap-2">
          <FaStar className="text-amber-400" />
          <span>40 ans du Bon Tempérament !</span>
        </div>
        <div className="absolute top-1/2 left-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900" />
      </motion.div>
    </motion.button>
  );
};

export default FloatingAnniversaryButton;
