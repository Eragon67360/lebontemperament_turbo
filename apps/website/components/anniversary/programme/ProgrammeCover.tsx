"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  PROGRAMME_ANNIVERSARY_YEAR,
  PROGRAMME_FIRST_YEAR,
  toRoman,
} from "@/lib/anniversaryProgramme";
import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import { motion } from "motion/react";
import { getImageProps } from "next/image";
import { sectionId } from "./sections";
import { BUTTON_IVORY, BUTTON_LINE, CAPS, DISPLAY } from "./theme";

// The « 40 » is cut out of a concert photo: the optimised image (about
// 1920 px wide) instead of the 1.5 MB original, as a CSS background.
const {
  props: { src: COVER_PHOTO },
} = getImageProps({
  src: "/img/entre_terre_et_ciel.jpg",
  alt: "",
  width: 960,
  height: 640,
  quality: 75,
});

const EASE = [0.2, 0.7, 0.1, 1] as const;

interface ProgrammeCoverProps {
  hero: AnniversaryHero;
  stats: HeroStat[];
}

/**
 * The cover of the programme: on deep teal inside a hairline frame, a giant
 * Bodoni « 40 » filled with a concert photo that pans slowly, the CMS title
 * in italic, 1987 — 2027 in roman numerals and the two ways in. Static when
 * the CMS turns the intro off or the visitor prefers reduced motion.
 */
export default function ProgrammeCover({ hero, stats }: ProgrammeCoverProps) {
  const reduceMotion = useReducedMotion();
  const animate = hero.enable_intro_animation && !reduceMotion;
  const number = hero.hero_number.trim() || "40";

  const rise = (delay: number) =>
    animate
      ? {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: EASE },
        }
      : {};

  return (
    <header
      id="anniversary-hero"
      className="relative overflow-hidden bg-(--p-deep) pt-14 pb-16 text-[#F4EFE4] sm:pt-20 sm:pb-20"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-[#F4EFE4]/30 sm:inset-[18px]"
      />
      <div className="relative mx-auto max-w-7xl px-6 text-center sm:px-8">
        <motion.p className={`${CAPS} opacity-85`} {...rise(0.3)}>
          Saison anniversaire · Saverne
        </motion.p>

        <h1 className="mt-6">
          <motion.span
            aria-hidden="true"
            className={`${DISPLAY} block bg-clip-text text-center text-[min(46vw,620px)] leading-[0.78] font-black tracking-[-0.04em] text-transparent [font-variation-settings:'opsz'_30]`}
            style={{
              backgroundImage: `url("${COVER_PHOTO}")`,
              backgroundSize: "150% auto",
              backgroundPosition: "30% 60%",
            }}
            initial={
              animate ? { opacity: 0, letterSpacing: "0.1em" } : undefined
            }
            animate={
              animate
                ? {
                    opacity: 1,
                    letterSpacing: "-0.04em",
                    backgroundPosition: ["20% 70%", "80% 45%"],
                  }
                : undefined
            }
            transition={
              animate
                ? {
                    opacity: { duration: 1.4, ease: EASE },
                    letterSpacing: { duration: 1.4, ease: EASE },
                    backgroundPosition: {
                      duration: 24,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "reverse",
                    },
                  }
                : undefined
            }
          >
            {number}
          </motion.span>
          <motion.span
            className={`${DISPLAY} mt-2 block text-[clamp(1.75rem,3.6vw,2.75rem)] leading-tight font-normal italic`}
            {...rise(0.6)}
          >
            {hero.hero_subtitle}
          </motion.span>
        </h1>

        <motion.p
          className={`${DISPLAY} mt-6 text-[13px] tracking-[0.3em] whitespace-nowrap opacity-90 sm:text-[17px] sm:tracking-[0.5em]`}
          {...rise(0.8)}
        >
          <span aria-hidden="true">
            {toRoman(PROGRAMME_FIRST_YEAR)} —{" "}
            {toRoman(PROGRAMME_ANNIVERSARY_YEAR)}
          </span>
          <span className="sr-only">
            {PROGRAMME_FIRST_YEAR} à {PROGRAMME_ANNIVERSARY_YEAR}
          </span>
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-3"
          {...rise(1)}
        >
          <a
            href={`#${sectionId(hero.cta_target_section)}`}
            className={BUTTON_IVORY}
          >
            {hero.cta_text}
          </a>
          <a href="#billet" className={BUTTON_LINE}>
            Concert des 40 ans
          </a>
        </motion.div>

        {stats.length > 0 && (
          <motion.ul
            className="mx-auto mt-14 flex max-w-3xl flex-wrap justify-center gap-x-10 gap-y-4 border-t border-[#F4EFE4]/25 pt-6"
            {...rise(1.2)}
          >
            {stats.map((stat) => (
              <li key={stat.id} className="flex items-baseline gap-2">
                <strong className={`${DISPLAY} text-3xl font-medium`}>
                  {stat.number}
                </strong>
                <span className={`${CAPS} opacity-80`}>{stat.label}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </header>
  );
}
