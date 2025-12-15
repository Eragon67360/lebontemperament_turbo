"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowRight, FaBirthdayCake, FaTimes } from "react-icons/fa";

const AnniversaryBanner = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("anniversary-banner-dismissed");
    if (!dismissed) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("anniversary-banner-dismissed", "true");
  };

  const handleClick = () => {
    router.push("/40-ans");
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 right-0 left-0 z-50 bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] px-4 py-3 shadow-lg md:px-8"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <motion.button
              onClick={handleClick}
              className="group flex flex-1 items-center gap-3 text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <FaBirthdayCake className="text-2xl text-white md:text-3xl" />
              </motion.div>
              <div className="flex-1">
                <div className="font-bold text-white md:text-lg">
                  🎉 Célébrons les 40 ans du Bon Tempérament ! 🎉
                </div>
                <div className="text-sm text-white/90 md:text-base">
                  Découvrez notre histoire, nos souvenirs et témoignages
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="hidden text-white md:block"
              >
                <FaArrowRight className="text-xl" />
              </motion.div>
            </motion.button>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-full p-2 text-white transition-colors duration-300 hover:bg-white/20"
              aria-label="Fermer la bannière"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnniversaryBanner;
