// components/SuccessMessage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCarousel, type Video } from "./VideoCarousel";

interface SuccessMessageProps {
  onClose: () => void;
}

export const SuccessMessage = ({ onClose }: SuccessMessageProps) => {
  const [stage, setStage] = useState<"initial" | "videos" | "conclusion">(
    "initial",
  );

  const videos: Video[] = [
    { url: "/videos/video1.mp4", caption: "Bon, y a des gens motivés..." },
    { url: "/videos/video2.mp4", caption: "Des pailles ???" },
    { url: "/videos/video3.mp4", caption: "Des gens étranges..." },
    { url: "/videos/video4.mp4", caption: "Des rituels bizarres..." },
    {
      url: "/videos/video5.mp4",
      caption: "Des gens qui ne dorment pas...ou peu",
    },
    {
      url: "/videos/video6.mp4",
      caption: "SCH ???",
    },
    {
      url: "/videos/video7.mp4",
      caption: "C'est trop...j'abandonne",
    },
  ];

  const handleVideoComplete = () => {
    setStage("conclusion");
  };

  const handleRewatch = () => {
    setStage("videos");
  };

  return (
    <AnimatePresence mode="wait">
      {stage === "initial" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center px-4 md:px-8 max-w-2xl mx-auto"
          onAnimationComplete={() => setTimeout(() => setStage("videos"), 2000)}
        >
          <motion.div
            className="relative inline-block mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <span className="absolute inset-0 animate-ping bg-gradient-to-r from-[#1a878d] to-purple-600 rounded-full opacity-20"></span>
            <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#1a878d] to-purple-600 text-transparent bg-clip-text p-2">
              🎉 Félicitations, initié(e) ! 🎉
            </h2>
          </motion.div>

          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-lg md:text-2xl font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text leading-relaxed"
          >
            Préparez-vous à découvrir la vérité sur le BT...
          </motion.p>
        </motion.div>
      )}

      {stage === "videos" && (
        <div className="w-full max-w-4xl mx-auto px-2 md:px-4">
          <VideoCarousel videos={videos} onComplete={handleVideoComplete} />
        </div>
      )}

      {stage === "conclusion" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 px-4 md:px-8 max-w-2xl mx-auto"
        >
          <motion.h3
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-600 text-transparent bg-clip-text leading-relaxed"
          >
            Conclusion : le BT est effectivement une secte. Merci d&apos;avoir
            regardé
          </motion.h3>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={onClose}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm md:text-base font-medium"
            >
              Sortez-moi de là 😱
            </button>
            <button
              onClick={handleRewatch}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm md:text-base font-medium"
            >
              Re-visionner 🔄
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
