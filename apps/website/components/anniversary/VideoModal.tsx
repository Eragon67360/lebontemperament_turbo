"use client";

import VideoFacade from "@/components/VideoFacade";
import { youTubeEmbedUrl } from "@/components/YouTubeVideo";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Video } from "@/types/anniversary";
import { motion, useTime, useTransform } from "motion/react";
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface VideoModalProps {
  video: Video;
  onClose: () => void;
}

type Embed = { url: string; provider: string };

/** Player URLs that set no cookie before the visitor plays. */
const getEmbed = (url: string): Embed => {
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    return { url: youTubeEmbedUrl(videoId), provider: "YouTube" };
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    return { url: youTubeEmbedUrl(videoId), provider: "YouTube" };
  }
  if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
    return {
      url: `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`,
      provider: "Vimeo",
    };
  }
  return { url, provider: "le lecteur externe" };
};

export function VideoModal({ video, onClose }: VideoModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const embed = getEmbed(video.video_url || "");
  const time = useTime();
  const rotate = useTransform(time, [0, 4000], [0, 360], { clamp: false });

  const rotatingBg = useTransform(rotate, (r) => {
    const angle = shouldReduceMotion ? 0 : r;
    return `conic-gradient(from ${angle}deg, var(--color-primary), transparent, color-mix(in oklab, var(--color-primary) 55%, white), transparent, var(--color-primary))`;
  });

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        layout
        initial={{
          scale: shouldReduceMotion ? 1 : 0.9,
          opacity: 0,
          y: shouldReduceMotion ? 0 : 20,
        }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{
          scale: shouldReduceMotion ? 1 : 0.9,
          opacity: 0,
          y: shouldReduceMotion ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-lg p-1">
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ background: rotatingBg, zIndex: 0 }}
          />
          <VideoFacade
            embedUrl={embed.url}
            provider={embed.provider}
            title={video.title}
            poster={video.thumbnail_url || undefined}
            className="z-[1] aspect-video rounded-md"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
            {video.category}
            {video.year && ` • ${video.year}`}
          </p>
          <h3 className="text-xl font-medium text-white">{video.title}</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-light text-white/75">
            {video.description}
          </p>
        </div>
      </motion.div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-black/20 p-2 text-white/60 transition-colors hover:text-white"
        aria-label="Fermer la vidéo"
      >
        <FaTimes />
      </button>
    </motion.div>
  );
}
