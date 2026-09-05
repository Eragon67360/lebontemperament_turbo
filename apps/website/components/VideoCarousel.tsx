import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BiDownArrow, BiUpArrow } from "react-icons/bi";
import { HiVolumeOff, HiVolumeUp } from "react-icons/hi";

export interface Video {
  url: string;
  caption?: string;
}

interface VideoCarouselProps {
  videos: Video[];
  onComplete: () => void;
}

export const VideoCarousel = ({ videos, onComplete }: VideoCarouselProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [[page, direction], setPage] = useState([0, 0]);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    if (page + newDirection < 0 || page + newDirection >= videos.length) {
      if (page + newDirection >= videos.length) {
        onComplete();
      }
      return;
    }
    setPage([page + newDirection, newDirection]);
  };

  const toggleMute = () => {
    const currentVideo = videoRefs.current[page];
    if (currentVideo) {
      currentVideo.muted = !currentVideo.muted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const currentVideo = videoRefs.current[page];
    if (currentVideo) {
      currentVideo.play();
      currentVideo.muted = isMuted;
    }
  }, [page, isMuted]);

  const Controls = () => (
    <div
      className={`flex ${isPortrait ? "mt-4 flex-row justify-center gap-4" : "flex-col gap-4"}`}
    >
      <button
        onClick={() => paginate(-1)}
        disabled={page === 0}
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:w-12"
      >
        <BiUpArrow className="h-5 w-5 text-gray-700 transition-colors group-hover:text-gray-900 md:h-6 md:w-6" />
        {page > 0 && (
          <div className="absolute left-full ml-3 hidden rounded-md bg-black/75 px-2 py-1 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
            Vidéo précédente
          </div>
        )}
      </button>

      <div className="flex items-center text-sm font-medium text-gray-600">
        {page + 1}/{videos.length}
      </div>

      <button
        onClick={() => paginate(1)}
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#1a878d] to-[#126266] shadow-lg transition-all duration-300 hover:shadow-xl md:h-12 md:w-12"
      >
        <BiDownArrow className="h-5 w-5 text-white md:h-6 md:w-6" />
        <div className="absolute left-full ml-3 hidden rounded-md bg-black/75 px-2 py-1 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
          {page === videos.length - 1 ? "Terminer" : "Vidéo suivante"}
        </div>
      </button>

      <button
        onClick={toggleMute}
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl md:h-12 md:w-12"
      >
        {isMuted ? (
          <HiVolumeOff className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
        ) : (
          <HiVolumeUp className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
        )}
      </button>
    </div>
  );
  return (
    <div
      className={`flex ${isPortrait ? "flex-col" : "flex-row items-center"} gap-4`}
    >
      <div className="relative aspect-[9/16] w-full max-w-[90vw] overflow-hidden md:max-w-[320px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.y, velocity.y);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute h-full w-full"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[page] = el;
              }}
              src={videos[page]?.url}
              className="h-full w-full rounded-xl object-cover shadow-lg md:rounded-2xl"
              autoPlay
              loop
              playsInline
              muted={isMuted}
            />

            {videos[page]?.caption && (
              <div className="absolute right-4 bottom-4 left-4 rounded-lg bg-black/40 p-2 text-center text-sm text-white backdrop-blur-sm md:rounded-xl md:p-3 md:text-base">
                {videos[page].caption}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Controls />
    </div>
  );
};
