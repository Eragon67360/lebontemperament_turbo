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

// Audio memories with specific details
const audioMemories: AudioMemory[] = [
  {
    id: "1",
    title: "Simone se souvient : Novembre 1984",
    description:
      "Simone Duclos raconte avec émotion cette première répétition dans la salle paroissiale. « On était 8, avec des instruments de toutes sortes. On ne savait pas si ça allait marcher, mais on avait cette envie folle de faire de la musique ensemble. »",
    speaker: "Simone Duclos, Fondatrice",
    year: 2024,
    duration: "5:32",
    audioUrl: "/placeholder-audio-1.mp3", // Placeholder
  },
  {
    id: "2",
    title: "Mon Premier Concert : Le Trac et la Grâce",
    description:
      "Jean-Pierre, violoniste depuis 1985, se souvient de son premier concert. « J'avais tellement peur que mes mains tremblent. Et puis, dès la première note, tout s'est apaisé. C'était comme si la musique prenait le dessus. »",
    speaker: "Jean-Pierre M., Violoniste",
    year: 2023,
    duration: "4:15",
    audioUrl: "/placeholder-audio-2.mp3", // Placeholder
  },
  {
    id: "3",
    title: "L'Évolution : De Vivaldi à Bach",
    description:
      "Marc, notre directeur musical depuis 2005, explique comment le répertoire a évolué. « On a commencé par les classiques, puis on a osé explorer des compositeurs moins connus. Chaque découverte est une aventure. »",
    speaker: "Marc L., Directeur Musical",
    year: 2024,
    duration: "6:20",
    audioUrl: "/placeholder-audio-3.mp3", // Placeholder
  },
  {
    id: "4",
    title: "Ce Concert à Fribourg",
    description:
      "Claire se souvient de ce concert en Allemagne en 1998. « Le public était debout, on a dû faire 3 rappels. En sortant, une dame nous a dit en français : 'Vous avez touché mon âme.' On en parle encore aujourd'hui. »",
    speaker: "Claire B., Alto",
    year: 2023,
    duration: "3:45",
    audioUrl: "/placeholder-audio-4.mp3", // Placeholder
  },
  {
    id: "5",
    title: "Extrait : Concert de 1995",
    description:
      "Enregistrement restauré d'un concert donné à l'abbaye de Marmoutier en 1995. On entend les Quatre Saisons de Vivaldi, avec cette fraîcheur et cette énergie de nos premières années. La qualité sonore a été améliorée, mais l'émotion reste intacte.",
    speaker: "Ensemble Le Bon Tempérament",
    year: 1995,
    duration: "8:10",
    audioUrl: "/placeholder-audio-5.mp3", // Placeholder
  },
  {
    id: "6",
    title: "Messages pour les 40 Ans",
    description:
      "Une compilation de messages enregistrés par d'anciens membres, des amis de l'ensemble, et des musiciens qui nous ont accompagnés. Des voix chargées d'émotion qui racontent 40 ans d'amitié et de musique partagées.",
    speaker: "Communauté du Bon Tempérament",
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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {audioMemories.map((memory, index) => {
            const randomOffset = ((index * 11) % 20) - 10;
            const randomDelay = index * 0.13 + (index % 2) * 0.04;

            return (
              <motion.div
                key={memory.id}
                initial={{
                  opacity: 0,
                  x: index % 2 === 0 ? -60 : 60,
                  y: randomOffset,
                }}
                animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                transition={{
                  delay: randomDelay,
                  duration: 0.65 + (index % 3) * 0.08,
                  type: "spring",
                  stiffness: 90 + index * 8,
                }}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  rotate: index % 2 === 0 ? 0.5 : -0.5,
                }}
                className="group overflow-hidden rounded-2xl bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-2xl md:p-6 dark:bg-gray-800"
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
                <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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
            );
          })}
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
