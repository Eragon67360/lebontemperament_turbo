"use client";

import type { PublicVideo } from "@/lib/publicVideos";
import { Button } from "@heroui/react";
import { extractYouTubeId } from "@repo/domain/utils/youtube";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { IoClose, IoPlay } from "react-icons/io5";
import VideoFacade from "./VideoFacade";
import { youTubeEmbedUrl } from "./YouTubeVideo";

const FeaturedVideosBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  // The bubble and the panel replace each other, so the focus would fall to
  // the body on each swap: the panel takes it when it appears, and the bubble
  // takes it back when the panel was closed on purpose (Escape, « Fermer »),
  // not when a click elsewhere closed it.
  const restoreFocus = useRef(false);

  const panelRef = useCallback((element: HTMLDivElement | null) => {
    popoverRef.current = element;
    element?.focus({ preventScroll: true });
  }, []);

  const bubbleRef = useCallback((element: HTMLButtonElement | null) => {
    if (element && restoreFocus.current) {
      restoreFocus.current = false;
      element.focus({ preventScroll: true });
    }
  }, []);

  const close = () => {
    restoreFocus.current = true;
    setIsOpen(false);
  };

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      restoreFocus.current = true;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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
          <m.div
            ref={panelRef}
            key="content"
            role="dialog"
            aria-labelledby={headingId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-4 bottom-20 left-4 z-[100] mx-auto w-auto max-w-[360px] overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-md md:relative md:right-auto md:bottom-auto md:left-auto md:w-[90vw] dark:bg-black/80"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3
                id={headingId}
                className="text-foreground text-lg font-semibold"
              >
                À la une
              </h3>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Fermer"
                onPress={close}
                className="text-foreground/50 hover:text-foreground"
              >
                <IoClose size={20} />
              </Button>
            </div>

            {/* Video Player */}
            <VideoFacade
              key={videoId}
              embedUrl={youTubeEmbedUrl(videoId)}
              provider="YouTube"
              title={currentVideo.title}
              className="aspect-video w-full rounded-xl shadow-inner"
            />

            {/* Video Info */}
            <div className="mt-4">
              <h4 className="text-foreground line-clamp-1 text-base font-medium">
                {currentVideo.title}
              </h4>
              <p className="text-muted text-xs">{currentVideo.composer}</p>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted text-xs font-medium">
                {currentIndex + 1} / {videos.length}
              </div>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Vidéo précédente"
                  className="bg-default/40"
                  onPress={prevVideo}
                  isDisabled={videos.length <= 1}
                >
                  <IoIosArrowBack />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Vidéo suivante"
                  className="bg-default/40"
                  onPress={nextVideo}
                  isDisabled={videos.length <= 1}
                >
                  <IoIosArrowForward />
                </Button>
              </div>
            </div>
          </m.div>
        ) : (
          <m.button
            ref={bubbleRef}
            key="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Vidéos à la une"
            className="group bg-primary-solid hover:bg-primary-solid-hover relative flex size-10 items-center justify-center rounded-full text-white shadow-lg transition-colors md:size-14"
          >
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-4 w-4"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
            </span>
            <IoPlay className="ml-1 h-6 w-6" />

            {/* Tooltip */}
            <div
              aria-hidden="true"
              className="absolute right-full mr-4 hidden rounded-lg bg-black/80 px-3 py-1.5 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100"
            >
              Vidéos à la une
            </div>
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeaturedVideosBubble;
