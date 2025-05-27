import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BiDownArrow, BiUpArrow } from "react-icons/bi";
import { HiVolumeOff, HiVolumeUp } from "react-icons/hi"; // Import volume icons

export interface Video {
  url: string;
  caption?: string;
}

interface VideoCarouselProps {
  videos: Video[];
  onComplete: () => void;
}

export const VideoCarousel = ({ videos, onComplete }: VideoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Add muted state
  const videoRef = useRef<HTMLVideoElement>(null);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [currentIndex]);

  return (
    <div className="flex items-center gap-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative w-[320px] h-[560px]"
      >
        <video
          ref={videoRef}
          src={videos[currentIndex]?.url}
          className="w-full h-full object-cover rounded-2xl shadow-lg"
          autoPlay
          loop
          playsInline
          muted={isMuted}
        />

        {videos[currentIndex]?.caption && (
          <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black/40 backdrop-blur-sm p-3 rounded-xl">
            {videos[currentIndex].caption}
          </div>
        )}
      </motion.div>

      <div className="flex flex-col gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BiUpArrow className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
          {currentIndex > 0 && (
            <div className="absolute right-full mr-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Vidéo précédente
            </div>
          )}
        </button>

        <div className="mx-auto text-sm font-medium text-gray-600">
          {currentIndex + 1}/{videos.length}
        </div>

        <button
          onClick={goToNext}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1a878d] to-[#126266] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <BiDownArrow className="w-6 h-6 text-white" />
          <div className="absolute right-full mr-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {currentIndex === videos.length - 1 ? "Terminer" : "Vidéo suivante"}
          </div>
        </button>

        {/* Add mute/unmute button */}
        <button
          onClick={toggleMute}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isMuted ? (
            <HiVolumeOff className="w-6 h-6 text-gray-700" />
          ) : (
            <HiVolumeUp className="w-6 h-6 text-gray-700" />
          )}
          <div className="absolute right-full mr-3 px-2 py-1 bg-black/75 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isMuted ? "Unmute" : "Mute"}
          </div>
        </button>
      </div>
    </div>
  );
};
