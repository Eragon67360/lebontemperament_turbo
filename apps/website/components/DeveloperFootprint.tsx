"use client";

import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Hook to detect "CATS" typed sequence
const useCatsEasterEgg = (callback: () => void) => {
  useEffect(() => {
    let typedSequence = "";
    const targetSequence = "cats";
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Clear timeout on new keypress
      clearTimeout(timeoutId);

      // Add key to sequence
      typedSequence += e.key.toLowerCase();

      // Keep only last 4 characters
      if (typedSequence.length > 4) {
        typedSequence = typedSequence.slice(-4);
      }

      // Check if sequence matches
      if (typedSequence === targetSequence) {
        callback();
        typedSequence = ""; // Reset
      }

      // Reset sequence after 2 seconds of inactivity
      timeoutId = setTimeout(() => {
        typedSequence = "";
      }, 2000);
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [callback]);
};

// Cat animation component
const FloatingCat = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ y: -20, opacity: 0 }}
    animate={{
      y: [0, -10, 0],
      opacity: 1,
    }}
    transition={{
      y: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
        delay,
      },
      opacity: {
        duration: 0.5,
      },
    }}
    className="text-4xl"
  >
    🐱
  </motion.div>
);

export const DeveloperFootprint = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  // Console messages on component mount
  useEffect(() => {
    // ASCII art cat
    const catArt = `
 |\_/|    
 (. .)
  =w= (\  
 / ^ \//  
(|| ||)
,""_""_ .`;

    console.log(
      "%c" + catArt,
      "font-size: 16px; color: #ff6b6b; font-family: monospace; line-height: 1.2;",
    );
    console.log(
      "%c💡 Psst... try typing 'CATS' anywhere on the site!",
      "font-size: 14px; color: #888; font-style: italic;",
    );
  }, []);

  // Handle CATS Easter egg
  useCatsEasterEgg(() => {
    setIsOpen(true);
    if (!hasSeenBefore) {
      setHasSeenBefore(true);
      console.log(
        "%c🎉 You found the secret! MEOW! 🐱",
        "font-size: 20px; color: #ff6b6b; font-weight: bold;",
      );
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      size="2xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10",
      }}
    >
      <ModalContent className="border-primary/20 border-2">
        {() => (
          <>
            <ModalHeader className="border-primary/10 flex flex-col gap-1 border-b">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <span className="text-2xl">👨‍💻</span>
                <h2 className="bg-gradient-to-r from-[#1a878d] to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
                  You found the secret!
                </h2>
              </motion.div>
            </ModalHeader>
            <ModalBody className="py-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Floating cats */}
                <div className="flex justify-center gap-8">
                  <FloatingCat delay={0} />
                  <FloatingCat delay={0.3} />
                  <FloatingCat delay={0.6} />
                </div>

                {/* Developer info */}
                <div className="from-primary/5 rounded-lg bg-gradient-to-br to-blue-500/5 p-6">
                  <h3 className="text-foreground mb-3 text-xl font-bold">
                    About the Developer
                  </h3>
                  <div className="text-foreground/80 space-y-2">
                    <p>
                      <span className="text-primary font-semibold">Name:</span>{" "}
                      Thomas Moser
                    </p>
                    <p>
                      <span className="text-primary font-semibold">
                        GitHub:
                      </span>{" "}
                      <a
                        href="https://github.com/Eragon67360"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-600 underline transition-colors"
                      >
                        @Eragon67360
                      </a>
                    </p>
                    <p>
                      <span className="text-primary font-semibold">
                        Status:
                      </span>{" "}
                      Cat Enthusiast 🐱 & Code Wizard ✨
                    </p>
                  </div>
                </div>

                {/* Love message */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-lg border-2 border-red-500/20 bg-gradient-to-r from-red-500/5 to-pink-500/5 p-6 text-center"
                >
                  <p className="mb-3 text-3xl">❤️</p>
                  <p className="text-foreground text-lg font-medium">
                    This website was crafted with{" "}
                    <span className="font-bold text-red-500">much love</span>,
                    especially for this beautiful music project.
                  </p>
                  <p className="text-foreground/60 mt-2 text-sm">
                    Every line of code, every pixel, every interaction was
                    carefully designed.
                  </p>
                </motion.div>

                {/* Tech stack */}
                <div>
                  <h4 className="text-foreground mb-2 font-semibold">
                    Built with:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Next.js 16",
                      "React",
                      "TypeScript",
                      "Supabase",
                      "TailwindCSS",
                      "Framer Motion",
                      "❤️",
                      "🐱",
                    ].map((tech) => (
                      <span
                        key={tech}
                        className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cat fact */}
                <motion.div
                  initial={{ rotate: -2 }}
                  animate={{ rotate: 2 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1,
                  }}
                  className="mt-4 rounded-lg bg-orange-500/10 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-orange-600">
                    🐈 I LOVE CATS!!! 🐈
                  </p>
                  <p className="text-foreground/70 mt-2 text-sm">
                    (Yes, it needed to be said again)
                  </p>
                </motion.div>

                {/* Fun stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="from-primary/5 to-primary/10 rounded-lg bg-gradient-to-br p-3">
                    <p className="text-primary text-2xl font-bold">∞</p>
                    <p className="text-foreground/60 text-xs">Lines of Code</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-red-500/5 to-red-500/10 p-3">
                    <p className="text-2xl font-bold text-red-500">❤️</p>
                    <p className="text-foreground/60 text-xs">
                      Love & Dedication
                    </p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10 p-3">
                    <p className="text-2xl font-bold text-orange-600">🐱</p>
                    <p className="text-foreground/60 text-xs">Cat Thoughts</p>
                  </div>
                </div>

                {/* Signature */}
                <div className="border-foreground/10 text-foreground/60 border-t pt-4 text-center text-sm">
                  <p className="font-signature italic">
                    Made with passion by Thomas
                  </p>
                  <p className="mt-1 text-xs">
                    💻 Happy coding! 🐱 Pet a cat today!
                  </p>
                </div>
              </motion.div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
