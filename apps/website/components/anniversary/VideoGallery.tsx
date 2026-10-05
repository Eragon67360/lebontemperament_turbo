"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Video } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { FaPlay, FaYoutube } from "react-icons/fa";
import AnniversaryCTA from "./AnniversaryCTA";
import ProgrammeHeading from "./programme/ProgrammeHeading";
import { PROGRAMME_PARTS } from "./programme/sections";
import { VideoModal } from "./VideoModal";

interface VideoGalleryProps {
  videos: Video[];
}

const VideoGallery = ({ videos }: VideoGalleryProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const categories = [
    "Tous",
    ...Array.from(new Set(videos.map((item) => item.category))),
  ];

  const filteredVideos =
    selectedCategory === "Tous"
      ? videos
      : videos.filter((item) => item.category === selectedCategory);

  return (
    <section
      id="videos"
      ref={sectionRef}
      className="relative scroll-mt-20 overflow-hidden py-16 sm:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <ProgrammeHeading
          part={PROGRAMME_PARTS.videos!.part}
          title="Galerie vidéo"
          intro="Revivez nos concerts, témoignages et moments mémorables en vidéo."
          className="mb-12"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-surface-secondary/60 mx-auto mb-12 flex w-fit flex-wrap justify-center gap-2 rounded-full p-1"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                selectedCategory === category
                  ? "text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {selectedCategory === category && (
                <motion.div
                  layoutId="video-category-pill"
                  className="bg-primary-600 dark:bg-primary-700 absolute inset-0 -z-10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {category}
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <AnimatePresence>
            {filteredVideos.map((video) => (
              <motion.div
                layout
                key={video.id}
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : 30,
                  scale: shouldReduceMotion ? 1 : 0.95,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : -30,
                  scale: shouldReduceMotion ? 1 : 0.95,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                onClick={() => setSelectedVideo(video)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedVideo(video);
                  }
                }}
                aria-label={`Lire la vidéo ${video.title}`}
                className="group focus-visible:outline-primary border-separator bg-surface-secondary/30 relative cursor-pointer overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <CloudinaryImage
                    src={video.thumbnail_url}
                    alt={video.title}
                    width={800}
                    height={450}
                    rounded={RoundedSize.NONE}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="translate-y-4 rounded-full border border-white/20 bg-white/10 p-4 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <FaPlay className="ml-0.5 text-xl text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="text-primary-text mb-2 text-xs font-semibold tracking-wider uppercase">
                    {video.category}
                  </p>
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <AnniversaryCTA
            href="https://www.youtube.com/@lebontemperament"
            external
          >
            Voir Plus sur <FaYoutube />
          </AnniversaryCTA>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default VideoGallery;
