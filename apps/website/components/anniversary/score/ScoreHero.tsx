"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SCORE_FINALE_YEAR, SCORE_FIRST_YEAR } from "@/lib/anniversaryScore";
import type { AnniversaryHero, HeroStat } from "@/types/anniversary";
import { motion } from "motion/react";
import Fermata from "./Fermata";
import { SCORE_FONT } from "./ScoreHeading";

// One note per decade, climbing the staff: on a line, in a space, on a
// line... `top` is in staff spaces (--s), measured to the note head's top.
const NOTES = [0, 1, 2, 3, 4].map((i) => ({
  year: SCORE_FIRST_YEAR + i * 10,
  left: [30, 44, 58, 72, 87][i]!,
  top: 2.575 - i * 0.5,
  finale: i === 4,
}));

const EASE_DRAW = [0.2, 0.7, 0.1, 1] as const;

interface ScoreHeroProps {
  hero: AnniversaryHero;
  stats: HeroStat[];
}

/**
 * The opening of the score: five staff lines draw themselves, a 4/0 time
 * signature settles, one note per decade drops in and the anniversary year
 * gets its fermata. Static when the CMS turns the intro off or the visitor
 * prefers reduced motion.
 */
export default function ScoreHero({ hero, stats }: ScoreHeroProps) {
  const reduceMotion = useReducedMotion();
  const animate = hero.enable_intro_animation && !reduceMotion;
  const digits =
    hero.hero_number.trim().length === 2
      ? hero.hero_number.trim().split("")
      : ["4", "0"];

  return (
    <header
      id="anniversary-hero"
      className="bg-background text-foreground overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-primary-text text-sm font-bold tracking-[0.14em] uppercase">
          Saverne · {SCORE_FIRST_YEAR} — {SCORE_FINALE_YEAR}
        </p>

        {/* The staff: decorative, the heading below carries the meaning. */}
        <div
          aria-hidden="true"
          className="relative mt-[calc(var(--s)*3.8)] h-[calc(var(--s)*4)] [--s:30px] sm:[--s:46px] lg:[--s:64px]"
        >
          <span className="bg-foreground absolute top-0 left-0 h-[calc(var(--s)*4)] w-[3px]" />
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="bg-foreground absolute inset-x-0 h-[1.5px] origin-left"
              style={{ top: `calc(var(--s) * ${i})` }}
              initial={animate ? { scaleX: 0 } : false}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.4, delay: i * 0.09, ease: EASE_DRAW }}
            />
          ))}

          {digits.map((digit, i) => (
            <motion.span
              key={i}
              className={`${SCORE_FONT} absolute left-[4%] flex h-[calc(var(--s)*2)] w-[calc(var(--s)*2)] items-center justify-center text-[calc(var(--s)*2.55)] leading-none font-extrabold`}
              style={{ top: `calc(var(--s) * ${i * 2})` }}
              initial={animate ? { opacity: 0, y: 24 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 + i * 0.15 }}
            >
              {digit}
            </motion.span>
          ))}

          {NOTES.map((note, i) => (
            <motion.span
              key={note.year}
              className={`absolute h-[calc(var(--s)*0.85)] w-[calc(var(--s)*1.2)] ${
                note.finale ? "text-primary" : "text-foreground"
              }`}
              style={{
                left: `${note.left}%`,
                top: `calc(var(--s) * ${note.top})`,
              }}
              initial={animate ? { opacity: 0, y: -60 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 14,
                delay: 1.25 + i * 0.18,
              }}
            >
              <span className="absolute inset-0 -rotate-[22deg] rounded-full bg-current" />
              <span className="absolute right-0.5 bottom-1/2 h-[calc(var(--s)*3.1)] w-[3px] bg-current" />
            </motion.span>
          ))}

          <motion.span
            className="text-primary absolute top-[calc(var(--s)*-3.6)] left-[calc(87%-var(--s)*0.25)] w-[calc(var(--s)*1.7)]"
            initial={animate ? { opacity: 0, scale: 0.4 } : false}
            animate={
              animate
                ? { opacity: 1, scale: [0.4, 1, 1.08, 1] }
                : { opacity: 1, scale: 1 }
            }
            transition={
              animate
                ? {
                    delay: 2.3,
                    duration: 3.2,
                    times: [0, 0.2, 0.6, 1],
                    repeat: Infinity,
                    repeatDelay: 0.4,
                  }
                : undefined
            }
          >
            <Fermata className="block h-auto w-full" />
          </motion.span>

          {NOTES.map((note, i) => (
            <motion.span
              key={note.year}
              className={`${SCORE_FONT} absolute top-[calc(var(--s)*4.5)] -translate-x-[10%] text-[15px] italic sm:text-xl ${
                note.finale ? "text-primary-text font-semibold" : "text-muted"
              }`}
              style={{ left: `${note.left}%` }}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 + i * 0.18 }}
            >
              {note.year}
            </motion.span>
          ))}
        </div>

        <div className="mt-28 grid items-end gap-10 lg:mt-32 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <h1
            className={`${SCORE_FONT} text-[clamp(2.75rem,6.4vw,5.75rem)] leading-[0.98] font-normal tracking-tight`}
          >
            {hero.hero_subtitle}
          </h1>
          <div className="flex flex-col gap-6">
            {hero.description && (
              <p className="text-foreground/85 text-lg leading-relaxed sm:text-xl">
                {hero.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href={`#${hero.cta_target_section}`}
                className="bg-primary-solid hover:bg-primary-solid-hover inline-flex min-h-12 items-center rounded-full px-6 font-medium text-white transition-colors"
              >
                {hero.cta_text}
              </a>
              <a
                href="#memories"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background inline-flex min-h-12 items-center rounded-full border px-6 font-medium transition-colors"
              >
                Partager un souvenir
              </a>
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <ul className="border-foreground mt-14 flex flex-wrap gap-x-10 gap-y-3 border-t pt-6">
            {stats.map((stat, i) => (
              <li key={stat.id} className={`${SCORE_FONT} text-2xl`}>
                {i === 0 && <em className="font-light">♩ = </em>}
                <strong className="font-bold">{stat.number}</strong>{" "}
                <span className="text-muted text-lg lowercase">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
