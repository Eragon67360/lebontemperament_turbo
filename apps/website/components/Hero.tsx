"use client";
import { RoundedSize } from "@/utils/types";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useState } from "react";
import CloudinaryImage from "./CloudinaryImage";

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  bannerSrc?: string;
  fallbackColor?: string;
  dataTestId?: string;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  description,
  bannerSrc,
  fallbackColor = "oklch(0.57 0.0911 200.74)",
  dataTestId = "hero",
}) => {
  const prefersReducedMotion = useReducedMotion();
  // Must render identically on server and client: measure in the effect below.
  const [maxScrollPx, setMaxScrollPx] = useState<number>(600);

  useEffect(() => {
    const onResize = () =>
      setMaxScrollPx(Math.max(window.innerHeight * 0.6, 200));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollY } = useScroll();
  const animatedScale = useTransform(scrollY, [0, maxScrollPx], [1, 0.82]);
  const animatedOpacity = useTransform(scrollY, [0, maxScrollPx], [1, 0.2]);
  const scale = prefersReducedMotion ? 1 : animatedScale;
  const opacity = prefersReducedMotion ? 1 : animatedOpacity;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.8,
        ease: "easeOut" as const,
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const imageVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.05,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 1.2,
        ease: "easeOut" as const,
      },
    },
  };

  // Function to handle smooth scrolling
  const handleScroll = () => {
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <motion.section
      className="fixed top-0 left-0 z-0 flex h-screen w-full items-center justify-center overflow-hidden"
      data-testid={dataTestId}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="banner"
      aria-labelledby="hero-title"
    >
      {bannerSrc ? (
        <motion.div
          className="absolute inset-0 z-0"
          variants={imageVariants}
          style={{
            background: `linear-gradient(135deg, ${fallbackColor}20 0%, ${fallbackColor}40 100%)`,
          }}
        >
          <CloudinaryImage
            src={bannerSrc}
            alt=""
            width={2000}
            height={800}
            rounded={RoundedSize.NONE}
            className="h-full w-full object-cover"
            priority={true}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/75" aria-hidden="true" />
        </motion.div>
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${fallbackColor}20 0%, ${fallbackColor}40 100%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-0 container mx-auto px-4 text-center">
        <motion.div
          className="mx-auto max-w-4xl"
          style={{
            scale,
            opacity,
            transformOrigin: "center",
            willChange: "transform, opacity",
          }}
          variants={textVariants}
        >
          <h1
            id="hero-title"
            className="text-title mb-4 leading-none font-light text-white drop-shadow-lg"
          >
            {title}
          </h1>
          {subtitle && (
            <motion.h2
              className="text-title mb-6 leading-none font-bold text-white drop-shadow-lg"
              variants={textVariants}
            >
              {subtitle}
            </motion.h2>
          )}
          {description && (
            <motion.p
              className="mx-auto max-w-2xl text-lg leading-relaxed text-white/90 drop-shadow-md md:text-xl"
              variants={textVariants}
              dangerouslySetInnerHTML={{ __html: description as string }}
            ></motion.p>
          )}
        </motion.div>
      </div>

      {/* Decorative elements for visual interest */}
      <motion.div
        className="absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-black/20 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 1, delay: 0.5 }}
        aria-hidden="true"
      />

      {/* Pulsing Arrow */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform cursor-pointer"
        onClick={handleScroll}
        aria-label="Scroll down"
      >
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            className="h-6 w-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;
