"use client";

import { Button } from "@heroui/react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { IoMusicalNotesOutline } from "react-icons/io5";

const AudioPlayer = () => {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const fileName = searchParams.get("fileName");

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="w-full max-w-2xl"
      >
        <div className="group relative overflow-hidden rounded-2xl">
          <div className="from-primary/30 absolute inset-0 z-0 bg-gradient-to-br to-purple-500/30 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="bg-default-100/90 relative z-10 p-6 backdrop-blur-xl md:p-8 lg:p-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 flex items-center justify-center gap-4"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="bg-primary/10 rounded-xl p-3"
              >
                <IoMusicalNotesOutline className="text-primary h-8 w-8" />
              </motion.div>
              <h1 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-center text-xl font-extrabold text-transparent md:text-2xl lg:text-3xl">
                {fileName ? `${fileName}` : "Lecteur Audio"}
              </h1>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center"
            >
              {fileUrl ? (
                <div className="w-full space-y-6">
                  <div className="bg-default-50/50 overflow-hidden rounded-xl p-4 backdrop-blur-sm">
                    <audio
                      controls
                      src={fileUrl}
                      className="w-full"
                      aria-label={`Lecture audio de ${fileName}`}
                      style={{
                        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                      }}
                    >
                      Votre navigateur ne supporte pas l&apos;élément audio.
                    </audio>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex justify-center"
                  >
                    <Button
                      as="a"
                      href={fileUrl + "&export=download"}
                      download={fileName || "audio"}
                      aria-label={`Télécharger ${fileName || "le fichier audio"}`}
                      className="from-primary bg-gradient-to-r to-purple-500 px-8 py-6 text-base font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
                    >
                      Télécharger le fichier
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="relative h-20 w-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="border-primary absolute inset-0 rounded-full border-4 border-t-transparent"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-2 rounded-full border-4 border-purple-500 border-b-transparent"
                    />
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-foreground/70 mt-6 text-base font-medium"
                  >
                    Chargement en cours...
                  </motion.p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AudioPlayer;
