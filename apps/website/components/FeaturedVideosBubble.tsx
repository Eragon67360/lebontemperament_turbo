"use client";

import { extractYouTubeId } from "@/utils/youtube";
import { Button } from "@heroui/react";
import { Video } from "@repo/domain/types/videos";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { IoClose, IoPlay } from "react-icons/io5";

const FeaturedVideosBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/videos");
        const data = await response.json();
        // Take only top 5 videos
        setVideos(data.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch videos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  if (loading || videos.length === 0) return null;

  const currentVideo = videos[currentIndex];
  if (!currentVideo) return null;

  const videoId = extractYouTubeId(currentVideo.youtube_url);

  return (
    <div className="pointer-events-auto relative flex flex-col items-end">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            ref={popoverRef}
            key="content"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-4 bottom-20 left-4 z-[100] mx-auto w-auto max-w-[360px] overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-md md:relative md:right-auto md:bottom-auto md:left-auto md:w-[90vw] dark:bg-black/80"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-foreground text-lg font-semibold">
                À la une
              </h3>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsOpen(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                <IoClose size={20} />
              </Button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentVideo.title}
              />
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h4 className="text-foreground line-clamp-1 text-base font-medium">
                {currentVideo.title}
              </h4>
              <p className="text-foreground/60 text-xs">
                {currentVideo.composer}
              </p>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-foreground/40 text-xs font-medium">
                {currentIndex + 1} / {videos.length}
              </div>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={prevVideo}
                  isDisabled={videos.length <= 1}
                >
                  <IoIosArrowBack />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={nextVideo}
                  isDisabled={videos.length <= 1}
                >
                  <IoIosArrowForward />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            layoutId="bubble"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="group bg-primary hover:bg-primary/90 relative flex size-10 items-center justify-center rounded-full text-white shadow-lg transition-colors md:size-14"
          >
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
            </span>
            <IoPlay className="ml-1 h-6 w-6" />

            {/* Tooltip */}
            <div className="absolute right-full mr-4 hidden rounded-lg bg-black/80 px-3 py-1.5 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
              Vidéos à la une
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeaturedVideosBubble;
