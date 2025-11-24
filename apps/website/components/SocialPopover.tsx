"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { FaFacebook, FaTiktok, FaInstagram, FaYoutube } from "react-icons/fa";
import { IoShareSocial } from "react-icons/io5";
import { Button } from "@heroui/react";

const socials = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=100063069588507",
    icon: <FaFacebook size={24} />,
    bgClass: "bg-[#1877F2]",
  },
  {
    name: "Tiktok",
    url: "https://www.tiktok.com/@lebontemperament",
    icon: <FaTiktok size={24} />,
    bgClass: "bg-gradient-to-br from-[#00F2EA] via-[#000000] to-[#FE2C55]",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/lebontemperament_/",
    icon: <FaInstagram size={24} />,
    bgClass:
      "bg-gradient-to-tr from-[#FCAF45] via-[#F77737] via-[#DD2A7B] via-[#8134AF] to-[#5B51D8]",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@lebontemperament",
    icon: <FaYoutube size={24} />,
    bgClass: "bg-[#FF0000]",
  },
];

export const SocialPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % socials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

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

  const currentSocial = socials[currentIconIndex];

  return (
    <div
      ref={popoverRef}
      className="pointer-events-auto relative flex flex-col items-start md:items-end"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-4 flex flex-col gap-2 md:right-0 md:left-auto"
          >
            {socials.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/80 p-2 pr-4 shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm ${social.bgClass}`}
                >
                  {social.icon}
                </div>
                <span className="text-foreground font-medium dark:text-white">
                  {social.name}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId="social-bubble"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex size-10 items-center justify-center rounded-full shadow-lg transition-all duration-500 md:size-14 ${
          isOpen
            ? "text-foreground bg-white dark:bg-zinc-900 dark:text-white"
            : `${currentSocial?.bgClass || "bg-primary"} text-white`
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <IoShareSocial className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentSocial && currentSocial.icon}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 hidden rounded-lg bg-black/80 px-3 py-1.5 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
            Nos réseaux
          </div>
        )}
      </motion.button>
    </div>
  );
};
