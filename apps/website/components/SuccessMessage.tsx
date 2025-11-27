// components/SuccessMessage.tsx
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
          className="mx-auto max-w-2xl px-4 text-center md:px-8"
          onAnimationComplete={() => setTimeout(() => setStage("videos"), 2000)}
        >
          <motion.div
            className="relative mb-8 inline-block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-[#1a878d] to-purple-600 opacity-20"></span>
            <h2 className="bg-gradient-to-r from-[#1a878d] to-purple-600 bg-clip-text p-2 text-2xl font-bold text-transparent md:text-4xl">
              🎉 Félicitations, initié(e) ! 🎉
            </h2>
          </motion.div>

          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-lg leading-relaxed font-semibold text-transparent md:text-2xl"
          >
            Préparez-vous à découvrir la vérité sur le BT...
          </motion.p>
        </motion.div>
      )}

      {stage === "videos" && (
        <div className="mx-auto w-full max-w-4xl px-2 md:px-4">
          <VideoCarousel videos={videos} onComplete={handleVideoComplete} />
        </div>
      )}

      {stage === "conclusion" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl space-y-8 px-4 text-center md:px-8"
        >
          <motion.h3
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-xl leading-relaxed font-bold text-transparent md:text-2xl"
          >
            Conclusion : le BT est effectivement une secte. Merci d&apos;avoir
            regardé
          </motion.h3>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 md:flex-row"
          >
            <button
              onClick={onClose}
              className="w-full transform rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-red-600 hover:to-red-700 hover:shadow-xl md:w-auto md:text-base"
            >
              Sortez-moi de là 😱
            </button>
            <button
              onClick={handleRewatch}
              className="w-full transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl md:w-auto md:text-base"
            >
              Re-visionner 🔄
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
