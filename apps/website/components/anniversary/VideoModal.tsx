"use client";

import type { Video } from "@/types/anniversary";
import { motion, useSpring, useTime, useTransform } from "motion/react";
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface VideoModalProps {
  video: Video;
  onClose: () => void;
}

// Helper function to convert video URLs to embed URLs
const getEmbedUrl = (url: string): string => {
  // YouTube patterns
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Vimeo patterns
  if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // If already an embed URL or unknown, return as is
  return url;
};

export function VideoModal({ video, onClose }: VideoModalProps) {
  const time = useTime();

  // Rotating gradient animation with subtle, cohesive colors
  const rotate = useTransform(time, [0, 3000], [0, 360], {
    clamp: false,
  });
  // 60% opacity (99 in hex)
  const rotatingBg = useTransform(rotate, (r) => {
    // Two black sections opposite each other for symmetrical rotation
    return `conic-gradient(from ${r}deg, #1A878D99, #00000099, #4DB8BD99, #00000099, #1A878D99)`;
  });

  // Pulsing blur animation (subtle effect)
  const pulse = useSpring(0, { damping: 0, mass: 5, stiffness: 10 });
  const pulsingBg = useTransform(pulse, (r) => {
    return `blur(${r}px)`;
  });

  useEffect(() => {
    // Save original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    // Cleanup: restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  useEffect(() => {
    pulse.set(5); // Subtle pulsing effect
  }, [pulse]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
      onClick={onClose}
    >
      {/* Wrapper for the video content and button - ADD WIDTH CLASSES */}
      <div className="relative w-full max-w-5xl">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-10 -mt-4 -mr-4 flex translate-x-full -translate-y-full items-center gap-2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
          aria-label="Fermer"
        >
          <FaTimes className="text-xl" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video container with animated gradient border */}
          <div className="relative rounded-2xl p-2">
            {/* Rotating gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: rotatingBg,
                zIndex: 0,
              }}
            />
            {/* Pulsing blur overlay */}
            <motion.div
              className="absolute inset-[2px] rounded-2xl opacity-40"
              style={{
                background:
                  "conic-gradient(#1A878D, #4DB8BD, #FFFFFF, #B0D4D6, #1A878D)",
                filter: pulsingBg,
                zIndex: 1,
              }}
            />
            {/* Video content */}
            <div
              className="relative aspect-video overflow-hidden rounded-xl bg-black"
              style={{ position: "relative", zIndex: 2 }}
            >
              <iframe
                src={video.video_url ? getEmbedUrl(video.video_url) : ""}
                title={video.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Video info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <div className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
              {video.category}
              {video.year && ` • ${video.year}`}
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-white">
              {video.title}
            </h3>
            <p
              className="mx-auto max-w-2xl text-white"
              style={{ opacity: 0.9 }}
            >
              {video.description}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
