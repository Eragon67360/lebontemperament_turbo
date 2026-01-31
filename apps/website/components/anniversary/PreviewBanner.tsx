"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaEye, FaTimes } from "react-icons/fa";

interface PreviewBannerProps {
  isPreview: boolean;
  hideDuringIntro?: boolean;
}

const PreviewBanner = ({
  isPreview,
  hideDuringIntro = false,
}: PreviewBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(
        "anniversary-preview-banner-dismissed",
      );
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, []);

  if (!isPreview || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("anniversary-preview-banner-dismissed", "true");
    }
  };

  const handleGoToAdmin = () => {
    const adminUrl =
      process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
    window.open(`${adminUrl}/dashboard/admin/anniversary`, "_blank");
  };

  return (
    <AnimatePresence>
      {!hideDuringIntro && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 right-0 left-0 z-100 bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 shadow-lg"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                className="hidden sm:block"
              >
                <FaEye className="text-xl text-white md:text-2xl" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-white md:text-lg">
                  Mode prévisualisation
                </p>
                <p className="hidden text-sm text-white/90 md:block">
                  Cette page n'est pas visible par le public. Activez le flag
                  depuis le panneau d'administration pour la rendre publique.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToAdmin}
                className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/30"
                aria-label="Aller au panneau d'administration"
              >
                <span className="hidden sm:inline">Admin</span>
                <FaExternalLinkAlt className="text-xs" />
              </button>
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-2 text-white transition-colors duration-300 hover:bg-white/20"
                aria-label="Fermer la bannière"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewBanner;
