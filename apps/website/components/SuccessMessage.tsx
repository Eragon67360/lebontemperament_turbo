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
          className="text-center"
          onAnimationComplete={() => setTimeout(() => setStage("videos"), 2000)}
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#1a878d] to-purple-600 text-transparent bg-clip-text">
            🎉 Félicitations, initié(e) ! 🎉
          </h2>
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text"
          >
            Préparez-vous à découvrir la vérité sur le BT...
          </motion.p>
        </motion.div>
      )}

      {stage === "videos" && (
        <VideoCarousel videos={videos} onComplete={handleVideoComplete} />
      )}

      {stage === "conclusion" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6"
        >
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-600 text-transparent bg-clip-text">
            Conclusion : le BT est effectivement une secte. Merci d&apos;avoir
            regardé
          </h3>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Sortez-moi de là 😱
            </button>
            <button
              onClick={handleRewatch}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Re-visionner 🔄
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
