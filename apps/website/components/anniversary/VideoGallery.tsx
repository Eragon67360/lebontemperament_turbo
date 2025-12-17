"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import type { Video } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import { Button } from "@heroui/react";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
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
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [50, -50]);

  const categories = [
    "Tous",
    ...Array.from(new Set(videos.map((item) => item.category))),
  ];

  const filteredVideos =
    selectedCategory === "Tous"
      ? videos
      : videos.filter((item) => item.category === selectedCategory);

  const handleVideoClick = (video: Video) => {
    if (video.video_url) {
      setSelectedVideo(video);
    }
  };

  return (
    <section
      id="videos"
      ref={sectionRef}
      className="bg-default-50 relative overflow-hidden py-16"
    >
      {/* Parallax background orb */}
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
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
              Galerie Vidéo
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Revivez nos concerts, témoignages et moments mémorables en vidéo
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex flex-wrap justify-center gap-3"
        >
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "solid" : "bordered"}
              color={selectedCategory === category ? "primary" : "default"}
              radius="sm"
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Video grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {filteredVideos.map((video, index) => {
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <CloudinaryImage
                    src={video.thumbnail_url}
                    alt={video.title}
                    width={800}
                    height={450}
                    rounded={RoundedSize.NONE}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play button overlay with glass morphism */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVideoClick(video)}
                      className="group/play relative"
                    >
                      {/* Glow effect */}
                      <div className="bg-primary/40 absolute inset-0 scale-110 rounded-full blur-2xl" />

                      {/* Glass button */}
                      <div className="from-primary to-primary/80 shadow-primary/30 group-hover/play:shadow-primary/50 relative rounded-full bg-gradient-to-br p-5 shadow-2xl backdrop-blur-sm transition-all duration-300">
                        <FaPlay className="ml-1 text-3xl text-white" />
                      </div>
                    </motion.button>
                  </div>

                  {/* Year badge */}
                  {video.year && (
                    <div className="bg-primary absolute top-4 right-4 rounded-full px-3 py-1 text-sm font-semibold text-white">
                      {video.year}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
                    {video.category}
                  </div>
                  <h3 className="text-foreground mb-2 text-xl leading-tight font-semibold">
                    {video.title}
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed font-light">
                    {video.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load more placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            color="primary"
            radius="sm"
            endContent={<FaYoutube />}
          >
            Voir Plus de Vidéos
          </Button>
        </motion.div>
      </div>

      {/* Video Modal */}
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
