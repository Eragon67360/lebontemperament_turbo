"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { FaHeadphones, FaMusic } from "react-icons/fa";

interface AudioMemory {
  id: string;
  title: string;
  description: string;
  speaker?: string;
  year?: number;
  duration: string;
  audioUrl: string; // Placeholder - will be replaced with real audio files
}

// Placeholder audio data - to be replaced with real content
const audioMemories: AudioMemory[] = [
  {
    id: "1",
    title: "Souvenirs de la Création",
    description:
      "Simone Duclos raconte les premiers moments du Bon Tempérament en 1984.",
    speaker: "Simone Duclos",
    year: 2024,
    duration: "5:32",
    audioUrl: "/placeholder-audio-1.mp3", // Placeholder
  },
  {
    id: "2",
    title: "Mon Premier Concert",
    description:
      "Témoignage d'un membre fondateur sur son premier concert avec l'ensemble.",
    speaker: "Membre Anonyme",
    year: 2023,
    duration: "4:15",
    audioUrl: "/placeholder-audio-2.mp3", // Placeholder
  },
  {
    id: "3",
    title: "L'Évolution du Répertoire",
    description:
      "Discussion sur l'évolution musicale et l'exploration de nouveaux répertoires.",
    speaker: "Directeur Musical",
    year: 2024,
    duration: "6:20",
    audioUrl: "/placeholder-audio-3.mp3", // Placeholder
  },
  {
    id: "4",
    title: "Moment Mémorable",
    description:
      "Un membre partage son moment le plus mémorable avec Le Bon Tempérament.",
    speaker: "Membre",
    year: 2023,
    duration: "3:45",
    audioUrl: "/placeholder-audio-4.mp3", // Placeholder
  },
  {
    id: "5",
    title: "Extrait Musical Historique",
    description:
      "Enregistrement rare d'un concert des années 90, restauré et numérisé.",
    speaker: "Ensemble",
    year: 1995,
    duration: "8:10",
    audioUrl: "/placeholder-audio-5.mp3", // Placeholder
  },
  {
    id: "6",
    title: "Message pour les 40 Ans",
    description:
      "Messages de félicitations et souvenirs de membres et amis du Bon Tempérament.",
    speaker: "Communauté",
    year: 2024,
    duration: "7:00",
    audioUrl: "/placeholder-audio-6.mp3", // Placeholder
  },
];

const AudioMemories = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = (id: string) => {
    setPlayingId(id);
  };

  const handlePause = () => {
    setPlayingId(null);
  };

  return (
    <section
      id="audio"
      ref={sectionRef}
      className="relative bg-gradient-to-b from-purple-50 to-indigo-50 py-20 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-4">
              <FaHeadphones className="text-4xl text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Mémoires Audio
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Écoutez les voix et les sons qui ont marqué 40 ans d&apos;histoire
            du Bon Tempérament
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {audioMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  {memory.year && (
                    <div className="mb-2 text-xs font-semibold text-purple-500 uppercase">
                      {memory.year}
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    {memory.title}
                  </h3>
                  {memory.speaker && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Par {memory.speaker}
                    </p>
                  )}
                </div>
                <div className="ml-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-3 dark:from-purple-900/30 dark:to-indigo-900/30">
                  <FaMusic className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              {/* Description */}
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                {memory.description}
              </p>

              {/* Audio Player */}
              <div className="rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 p-4 dark:from-gray-700 dark:to-gray-800">
                <AudioPlayer
                  src={memory.audioUrl}
                  onPlay={() => handlePlay(memory.id)}
                  onPause={handlePause}
                  onEnded={handlePause}
                  showJumpControls={false}
                  className="custom-audio-player"
                  style={{
                    backgroundColor: "transparent",
                    boxShadow: "none",
                  }}
                />
              </div>

              {/* Duration badge */}
              <div className="mt-3 text-right">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  {memory.duration}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note about placeholders */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 rounded-2xl bg-purple-100/50 p-6 text-center dark:bg-purple-900/20"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> Les fichiers audio sont actuellement des
            placeholders. Les enregistrements réels seront intégrés
            prochainement.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AudioMemories;
