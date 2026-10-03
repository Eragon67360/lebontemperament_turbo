"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AudioMemory } from "@/types/anniversary";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { FaHeadphones } from "react-icons/fa";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

interface AudioMemoriesProps {
  audioMemories: AudioMemory[];
}

const AudioMemories = ({ audioMemories }: AudioMemoriesProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const { scrollY } = useScroll();
  const yRaw = useTransform(scrollY, [0, 1000], [30, -30]);
  const y = shouldReduceMotion ? 0 : yRaw;

  return (
    <section
      id="audio"
      ref={sectionRef}
      className="bg-background text-foreground relative overflow-hidden py-16 sm:py-24"
    >
      <motion.div
        style={{ y }}
        className="bg-primary/5 absolute right-1/4 bottom-1/4 h-125 w-125 rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaHeadphones className="text-3xl sm:text-4xl" />
          </div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Mémoires Audio
          </h2>
          <p className="text-muted mx-auto mt-4 max-w-2xl text-lg font-light">
            Écoutez les voix et les sons qui ont marqué 40 ans d'histoire du Bon
            Tempérament.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {audioMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group border-separator bg-surface-secondary/30 flex flex-col overflow-hidden rounded-xl border p-4 backdrop-blur-md sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground mb-1 text-lg font-medium sm:text-xl">
                    {memory.title}
                  </h3>
                  <p className="text-muted text-sm font-light">
                    {memory.speaker_name && `Par ${memory.speaker_name}`}
                    {memory.year && ` • ${memory.year}`}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <span className="border-primary/20 bg-primary/5 text-primary-600 dark:border-primary/30 dark:bg-primary/10 dark:text-primary-500 inline-flex rounded-full border px-3 py-1 text-xs font-medium">
                    {memory.duration}
                  </span>
                </div>
              </div>

              <p className="text-muted mb-6 grow text-sm leading-relaxed font-light">
                {memory.description}
              </p>

              <div className="bg-surface-secondary/60 rounded-lg p-3">
                <CustomAudioPlayer
                  src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${memory.audio_url}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudioMemories;
