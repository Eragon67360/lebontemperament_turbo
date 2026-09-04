"use client";

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

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [30, -30]);

  return (
    <section
      id="audio"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
    >
      <motion.div
        style={{ y }}
        className="bg-primary/5 absolute right-1/4 bottom-1/4 h-125 w-125 rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaHeadphones className="text-3xl sm:text-4xl" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Mémoires Audio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Écoutez les voix et les sons qui ont marqué 40 ans d'histoire du Bon
            Tempérament.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {audioMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 p-4 backdrop-blur-md sm:p-6 dark:border-slate-800/50 dark:bg-slate-900/30"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-medium text-slate-900 sm:text-xl dark:text-white">
                    {memory.title}
                  </h3>
                  <p className="text-sm font-light text-slate-500 dark:text-slate-400">
                    {memory.speaker_name && `Par ${memory.speaker_name}`}
                    {memory.year && ` • ${memory.year}`}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <span className="border-primary/20 bg-primary/5 text-primary dark:border-primary/30 dark:bg-primary/10 inline-flex rounded-full border px-3 py-1 text-xs font-medium">
                    {memory.duration}
                  </span>
                </div>
              </div>

              <p className="mb-6 grow text-sm leading-relaxed font-light text-slate-500 dark:text-slate-400">
                {memory.description}
              </p>

              <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
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
