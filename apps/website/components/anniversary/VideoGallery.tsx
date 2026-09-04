"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import type { Video } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useRef, useState } from "react";
import { FaPlay, FaYoutube } from "react-icons/fa";
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
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
    >
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/5 absolute top-1/4 left-0 h-125 w-125 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Galerie Vidéo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Revivez nos concerts, témoignages et moments mémorables en vidéo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mb-12 flex w-fit flex-wrap justify-center gap-2 rounded-full bg-slate-200/50 p-1 dark:bg-slate-800/50"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                selectedCategory === category
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {selectedCategory === category && (
                <motion.div
                  layoutId="video-category-pill"
                  className="bg-primary absolute inset-0 -z-10 rounded-full"
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
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/30"
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
                  <p className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
                    {video.category}
                  </p>
                  <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">
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
          <motion.button
            variants={{
              initial: { color: "var(--color-primary)" },
              hover: { color: "#ffffff" },
            }}
            initial="initial"
            whileHover="hover"
            transition={{ duration: 0.3 }}
            className="group border-primary/40 text-primary hover:border-primary/80 dark:border-primary/50 dark:text-primary relative overflow-hidden rounded-md border bg-transparent px-8 py-3 font-medium transition-colors duration-300"
            // onClick={() => console.log("Button clicked!")}
          >
            <motion.div
              className="bg-primary absolute inset-0 -z-10"
              variants={{
                initial: { y: "100%" },
                hover: { y: "0%" },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
            <motion.span className="flex items-center gap-2">
              Voir Plus sur <FaYoutube />
            </motion.span>
          </motion.button>
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
