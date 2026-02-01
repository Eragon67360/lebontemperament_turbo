"use client";

import { Modal, ModalContent } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Code, Github, Heart, PawPrint, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- HOOK (No changes) ---
const useCatsEasterEgg = (callback: () => void) => {
  useEffect(() => {
    let typedSequence = "";
    const targetSequence = "cats";
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      clearTimeout(timeoutId);
      typedSequence = (typedSequence + e.key.toLowerCase()).slice(-4);
      if (typedSequence === targetSequence) {
        callback();
        typedSequence = "";
      }
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

// --- TechIcon Component (No changes) ---
const TechIcon = ({ icon, name }: { icon: React.ReactNode; name: string }) => (
  <div className="flex flex-col items-center gap-2 text-center">
    <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
      {icon}
    </div>
    <p className="text-foreground/70 text-xs">{name}</p>
  </div>
);

// --- THE MAIN COMPONENT ---
export const DeveloperFootprint = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("meow");
  const meowAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const catArt = `\n |\\_/|    \n (. .) \n  =w= (\\ \n / ^ \\// \n(|| ||) \n, ""_""_ .\n`;
    console.log(
      `%c${catArt}`,
      "font-size: 16px; color: #ff6b6b; font-family: monospace; line-height: 1.2;",
    );
    console.log(
      "%c💡 Psst... try typing 'CATS' anywhere on the site!",
      "font-size: 14px; color: #888; font-style: italic;",
    );
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setActiveTab("meow");
  }, []);

  useCatsEasterEgg(openModal);

  const handlePlayMeow = () => {
    meowAudioRef.current
      ?.play()
      .catch((e) => console.error("Error playing audio:", e));
  };

  const tabs = [
    { id: "meow", icon: <PawPrint size={20} />, label: "Meow" },
    { id: "dev", icon: <Code size={20} />, label: "Dev" },
    { id: "project", icon: <Heart size={20} />, label: "Project" },
  ];

  return (
    <>
      <audio ref={meowAudioRef} src="/meow.mp3" preload="auto" />

      <AnimatePresence>
        {isOpen && (
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            size="md"
            backdrop="blur"
            classNames={{
              backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10",
            }}
          >
            <ModalContent className="border-primary/20 border-2 p-0">
              {() => (
                <motion.div
                  className="flex h-[500px] flex-col"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <div className="grow p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-full flex-col" // Ensure div takes full height
                      >
                        {activeTab === "meow" && (
                          <div className="flex flex-1 flex-col items-center justify-center text-center">
                            {/* --- MODIFIED: Interactive Cat --- */}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9, rotate: 15 }}
                              onClick={handlePlayMeow}
                              // --- NEW: Breathing animation ---
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{
                                scale: {
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                },
                              }}
                              className="cursor-pointer text-9xl" // --- MODIFIED: Size increased ---
                            >
                              🐈
                            </motion.div>
                            <h2 className="from-primary mt-4 bg-gradient-to-r to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                              You found the secret!
                            </h2>
                            <p className="text-foreground/70 mt-2">
                              The cat distribution system has chosen you.
                            </p>
                            {/* --- NEW: Added a clear hint --- */}
                            <p className="text-foreground/60 mt-6 text-sm italic">
                              (psst... try clicking the cat)
                            </p>
                          </div>
                        )}

                        {activeTab === "dev" && (
                          <div className="space-y-4">
                            <h3 className="text-foreground text-xl font-bold">
                              About the Developer
                            </h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-3">
                                <User className="text-primary h-5 w-5" />
                                <div>
                                  <p className="text-foreground font-semibold">
                                    Thomas Moser
                                  </p>
                                  <p className="text-foreground/60">
                                    Full-Stack Developer
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Github className="text-primary h-5 w-5" />
                                <a
                                  href="https://github.com/Eragon67360"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-foreground/80 hover:text-primary transition-colors"
                                >
                                  @Eragon67360
                                </a>
                              </div>
                              <div className="flex items-center gap-3">
                                <PawPrint className="text-primary h-5 w-5" />
                                <p className="text-foreground/80">
                                  Powered by Coffee & Cats
                                </p>
                              </div>
                            </div>
                            <p className="font-signature text-foreground/60 border-foreground/10 border-t pt-4 italic">
                              Made with passion
                            </p>
                          </div>
                        )}

                        {activeTab === "project" && (
                          <div className="space-y-6">
                            <h3 className="text-foreground text-xl font-bold">
                              About This Project
                            </h3>
                            <p className="text-foreground/80 text-sm">
                              This app was crafted with{" "}
                              <span className="font-bold text-red-500">
                                much love
                              </span>{" "}
                              for this beautiful music project. Every line of
                              code, every pixel, every interaction was carefully
                              designed.
                            </p>
                            <div>
                              <h4 className="text-foreground/90 mb-3 font-semibold">
                                Built With
                              </h4>
                              <div className="grid grid-cols-4 gap-4">
                                <TechIcon
                                  icon={<p className="text-xl font-bold">N</p>}
                                  name="Next.js"
                                />
                                <TechIcon
                                  icon={<p className="text-xl font-bold">R</p>}
                                  name="React"
                                />
                                <TechIcon
                                  icon={<p className="text-xl font-bold">S</p>}
                                  name="Supabase"
                                />
                                <TechIcon
                                  icon={<p className="text-xl font-bold">T</p>}
                                  name="Tailwind"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-primary/10 bg-primary/5 mt-auto flex border-t p-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${activeTab === tab.id ? "" : "hover:bg-primary/5"} text-primary relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors`}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        {activeTab === tab.id && (
                          <motion.span
                            layoutId="bubble"
                            className="bg-primary/10 absolute inset-0 z-10"
                            style={{ borderRadius: 6 }}
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                        <span className="relative z-20 flex items-center justify-center gap-2">
                          {tab.icon}
                          {tab.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};
