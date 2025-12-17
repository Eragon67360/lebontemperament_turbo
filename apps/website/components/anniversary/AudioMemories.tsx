"use client";

import type { AudioMemory } from "@/types/anniversary";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { FaHeadphones, FaMusic } from "react-icons/fa";

interface AudioMemoriesProps {
  audioMemories: AudioMemory[];
}

const AudioMemories = ({ audioMemories }: AudioMemoriesProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [30, -30]);

  const handlePlay = (id: string) => {
    setPlayingId(id);
  };

  const handlePause = () => {
    setPlayingId(null);
  };

  return (
    <section
      id="audio"
      ref={sectionRef}
      className="bg-background relative overflow-hidden py-16"
    >
      {/* Parallax background orb */}
      <motion.div
        style={{ y }}
        className="bg-primary/5 absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mb-6 flex justify-center"
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="bg-primary/30 absolute inset-0 scale-110 rounded-full blur-2xl" />

              {/* Glass icon */}
              <div className="from-primary to-primary/80 shadow-primary/20 relative rounded-full bg-gradient-to-br p-5 shadow-xl">
                <FaHeadphones className="text-5xl text-white" />
              </div>
            </div>
          </motion.div>

          {/* Glass morphism title */}
          <div className="relative mx-auto mb-6 inline-block">
            <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br backdrop-blur-xl" />
            <div
              className="absolute inset-0 -z-10 rounded-2xl opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26, 135, 141, 0.15) 0%, rgba(13, 107, 112, 0.05) 100%)",
                filter: "blur(15px)",
              }}
            />
            <h2 className="text-title text-primary/50 dark:text-primary px-8 py-4 leading-none font-light">
              Mémoires Audio
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Écoutez les voix et les sons qui ont marqué 40 ans d&apos;histoire
            du Bon Tempérament
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {audioMemories.map((memory, index) => {
            return (
              <motion.div
                key={memory.id}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Animated gradient on hover */}
                <motion.div
                  className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(26, 135, 141, 0.05) 0%, transparent 70%)",
                  }}
                />

                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    {memory.year && (
                      <div className="text-primary mb-2 text-xs font-semibold uppercase">
                        {memory.year}
                      </div>
                    )}
                    <h3 className="text-foreground mb-2 text-xl font-semibold">
                      {memory.title}
                    </h3>
                    {memory.speaker_name && (
                      <p className="text-foreground/70 text-sm font-light">
                        Par {memory.speaker_name}
                      </p>
                    )}
                  </div>
                  <div className="bg-primary/10 ml-4 rounded-full p-3">
                    <FaMusic className="text-primary" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-foreground/70 mb-4 text-sm leading-relaxed font-light">
                  {memory.description}
                </p>

                {/* Audio Player */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <AudioPlayer
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${memory.audio_url}`}
                    onPlay={() => handlePlay(memory.id)}
                    onPause={handlePause}
                    onEnded={handlePause}
                    showJumpControls={false}
                    className="custom-audio-player"
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                    }}
                  />
                </div>

                {/* Duration badge */}
                <div className="mt-3 text-right">
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                    {memory.duration}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AudioMemories;
