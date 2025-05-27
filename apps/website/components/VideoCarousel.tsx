import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[320px] h-[560px] overflow-hidden">
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
            className="absolute w-full h-full"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[page] = el;
              }}
              src={videos[page]?.url}
              className="w-full h-full object-cover rounded-2xl shadow-lg"
              autoPlay
              loop
              playsInline
              muted={isMuted}
            />

            {videos[page]?.caption && (
              <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black/40 backdrop-blur-sm p-3 rounded-xl">
                {videos[page].caption}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => paginate(-1)}
          disabled={page === 0}
          className="cursor-pointer group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BiUpArrow className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
          {page > 0 && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Vidéo précédente
            </div>
          )}
        </button>

        <div className="mx-auto text-sm font-medium text-gray-600">
          {page + 1}/{videos.length}
        </div>

        <button
          onClick={() => paginate(1)}
          className="cursor-pointer group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1a878d] to-[#126266] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <BiDownArrow className="w-6 h-6 text-white" />
          <div className="absolute left-full ml-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {page === videos.length - 1 ? "Terminer" : "Vidéo suivante"}
          </div>
        </button>

        <button
          onClick={toggleMute}
          className="cursor-pointer group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isMuted ? (
            <HiVolumeOff className="w-6 h-6 text-gray-700" />
          ) : (
            <HiVolumeUp className="w-6 h-6 text-gray-700" />
          )}
          <div className="absolute left-full ml-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isMuted ? "Activer le son" : "Couper le son"}
          </div>
        </button>
      </div>
    </div>
  );
};
