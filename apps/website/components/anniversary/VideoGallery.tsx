"use client";

import { Button } from "@heroui/react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { FaPlay, FaYoutube } from "react-icons/fa";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string; // Placeholder image URL
  videoUrl?: string; // YouTube or video URL
  year?: number;
  category: string;
}

// Video data with specific details
const videoItems: VideoItem[] = [
  {
    id: "1",
    title: "Concert d'Anniversaire 2024",
    description:
      "Le grand concert du 15 juin 2024 à l'église Saint-Georges de Saverne. Plus de 200 personnes, un programme allant de Purcell à Bach, et cette émotion particulière de célébrer ensemble 40 ans de passion musicale.",
    thumbnail: "https://placehold.co/800x450/FF6B6B/FFFFFF?text=Concert+2024",
    year: 2024,
    category: "Concert",
  },
  {
    id: "2",
    title: "Témoignages : Les Voix de 40 Ans",
    description:
      "Marie, Jean, Sophie et d'autres membres partagent leurs souvenirs. De la première répétition en 1984 aux concerts récents, leurs témoignages croisés racontent l'histoire humaine du Bon Tempérament.",
    thumbnail: "https://placehold.co/800x450/4ECDC4/FFFFFF?text=Temoignages",
    year: 2023,
    category: "Témoignage",
  },
  {
    id: "3",
    title: "Rétrospective 1984-2024",
    description:
      "Un documentaire de 45 minutes retraçant 40 ans d'histoire. Images d'archives, extraits de concerts, interviews des fondateurs. Un voyage dans le temps qui montre l'évolution de l'ensemble et de sa passion.",
    thumbnail: "https://placehold.co/800x450/45B7D1/FFFFFF?text=Retrospective",
    year: 2024,
    category: "Documentaire",
  },
  {
    id: "4",
    title: "Concert Baroque à Marmoutier",
    description:
      "Concert donné en septembre 2019 dans l'abbaye de Marmoutier. Programme Vivaldi et Corelli, avec cette acoustique exceptionnelle qui transforme chaque note. Un moment de grâce capturé par nos caméras.",
    thumbnail:
      "https://placehold.co/800x450/FFA07A/FFFFFF?text=Concert+Baroque",
    year: 2019,
    category: "Concert",
  },
  {
    id: "5",
    title: "Atelier Jeunes 2022",
    description:
      "Un samedi après-midi avec 15 jeunes musiciens de 12 à 18 ans. Découverte des instruments baroques, initiation au répertoire, et surtout ce moment magique où ils ont joué avec nous. La relève est assurée !",
    thumbnail: "https://placehold.co/800x450/98D8C8/FFFFFF?text=Atelier",
    year: 2022,
    category: "Éducation",
  },
  {
    id: "6",
    title: "Tournée Allemagne 2018",
    description:
      "Notre tournée de 5 concerts en Forêt-Noire et dans le Bade-Wurtemberg. Les péripéties du voyage, les rencontres avec le public allemand, les moments de détente entre concerts. Une aventure humaine autant que musicale.",
    thumbnail: "https://placehold.co/800x450/F7DC6F/FFFFFF?text=Tournee",
    year: 2018,
    category: "Tournée",
  },
];

const VideoGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  const categories = [
    "Tous",
    ...Array.from(new Set(videoItems.map((item) => item.category))),
  ];

  const filteredVideos =
    selectedCategory === "Tous"
      ? videoItems
      : videoItems.filter((item) => item.category === selectedCategory);

  const handleVideoClick = (video: VideoItem) => {
    // Placeholder: In real implementation, this would open a modal or navigate to video
    console.log("Opening video:", video);
    // Example: window.open(video.videoUrl, '_blank');
  };

  return (
    <section
      id="videos"
      ref={sectionRef}
      className="relative bg-gradient-to-b from-white to-amber-50 py-20 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Galerie Vidéo
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Revivez nos concerts, témoignages et moments mémorables en vidéo
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-wrap justify-center gap-3"
        >
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "solid" : "bordered"}
              className={
                selectedCategory === category
                  ? "bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] text-white"
                  : ""
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Video grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {filteredVideos.map((video, index) => {
            const randomRotation = (index % 3) * 0.5 - 0.5; // -0.5, 0, 0.5
            const randomDelay = index * 0.12 + (index % 2) * 0.05;
            const isWide = index % 3 === 1;

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 50, rotate: randomRotation }}
                animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : {}}
                transition={{
                  delay: randomDelay,
                  duration: 0.6 + (index % 3) * 0.1,
                  type: "spring",
                  stiffness: 100 + index * 10,
                }}
                whileHover={{
                  y: -12,
                  scale: 1.03,
                  rotate: randomRotation * 0.3,
                }}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800 ${
                  isWide ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleVideoClick(video)}
                      className="rounded-full bg-white/90 p-4 text-amber-500 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white"
                    >
                      <FaPlay className="ml-1 text-2xl" />
                    </motion.button>
                  </div>

                  {/* Year badge */}
                  {video.year && (
                    <div className="bg-primary absolute top-4 right-4 rounded-full px-3 py-1 text-sm font-bold text-white">
                      {video.year}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  <div className="mb-2 text-xs font-semibold tracking-wide text-amber-600 uppercase">
                    {video.category}
                  </div>
                  <h3 className="mb-2 text-lg leading-tight font-bold text-gray-900 md:text-xl dark:text-white">
                    {video.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {video.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load more placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#1A878D] via-[#3D7CB2] to-[#9D609B] text-white"
            endContent={<FaYoutube />}
          >
            Voir Plus de Vidéos
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoGallery;
