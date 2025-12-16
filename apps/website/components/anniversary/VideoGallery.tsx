"use client";

import { Button } from "@heroui/react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
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
    thumbnail: "https://placehold.co/800x450/1A878D/FFFFFF?text=Concert+2024",
    year: 2024,
    category: "Concert",
  },
  {
    id: "2",
    title: "Témoignages : Les Voix de 40 Ans",
    description:
      "Marie, Jean, Sophie et d'autres membres partagent leurs souvenirs. De la première répétition en 1984 aux concerts récents, leurs témoignages croisés racontent l'histoire humaine du Bon Tempérament.",
    thumbnail: "https://placehold.co/800x450/0D6B70/FFFFFF?text=Temoignages",
    year: 2023,
    category: "Témoignage",
  },
  {
    id: "3",
    title: "Rétrospective 1984-2024",
    description:
      "Un documentaire de 45 minutes retraçant 40 ans d'histoire. Images d'archives, extraits de concerts, interviews des fondateurs. Un voyage dans le temps qui montre l'évolution de l'ensemble et de sa passion.",
    thumbnail: "https://placehold.co/800x450/1A878D/FFFFFF?text=Retrospective",
    year: 2024,
    category: "Documentaire",
  },
  {
    id: "4",
    title: "Concert Baroque à Marmoutier",
    description:
      "Concert donné en septembre 2019 dans l'abbaye de Marmoutier. Programme Vivaldi et Corelli, avec cette acoustique exceptionnelle qui transforme chaque note. Un moment de grâce capturé par nos caméras.",
    thumbnail:
      "https://placehold.co/800x450/0D6B70/FFFFFF?text=Concert+Baroque",
    year: 2019,
    category: "Concert",
  },
  {
    id: "5",
    title: "Atelier Jeunes 2022",
    description:
      "Un samedi après-midi avec 15 jeunes musiciens de 12 à 18 ans. Découverte des instruments baroques, initiation au répertoire, et surtout ce moment magique où ils ont joué avec nous. La relève est assurée !",
    thumbnail: "https://placehold.co/800x450/1A878D/FFFFFF?text=Atelier",
    year: 2022,
    category: "Éducation",
  },
  {
    id: "6",
    title: "Tournée Allemagne 2018",
    description:
      "Notre tournée de 5 concerts en Forêt-Noire et dans le Bade-Wurtemberg. Les péripéties du voyage, les rencontres avec le public allemand, les moments de détente entre concerts. Une aventure humaine autant que musicale.",
    thumbnail: "https://placehold.co/800x450/0D6B70/FFFFFF?text=Tournee",
    year: 2018,
    category: "Tournée",
  },
];

const VideoGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [50, -50]);

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
      className="bg-default-50 relative overflow-hidden py-16"
    >
      {/* Parallax background orb */}
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* Glass morphism title */}
          <div className="relative mx-auto mb-6 inline-block">
            <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br backdrop-blur-xl" />
            <div
              className="absolute inset-0 -z-10 rounded-2xl opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26, 135, 141, 0.15) 0%, rgba(13, 107, 112, 0.05) 100%)",
                filter: "blur(15px)",
              }}
            />
            <h2 className="text-title text-primary/50 dark:text-primary px-8 py-4 leading-none font-light">
              Galerie Vidéo
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Revivez nos concerts, témoignages et moments mémorables en vidéo
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex flex-wrap justify-center gap-3"
        >
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "solid" : "bordered"}
              color={selectedCategory === category ? "primary" : "default"}
              radius="sm"
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Video grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {filteredVideos.map((video, index) => {
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play button overlay with glass morphism */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVideoClick(video)}
                      className="group/play relative"
                    >
                      {/* Glow effect */}
                      <div className="bg-primary/40 absolute inset-0 scale-110 rounded-full blur-2xl" />

                      {/* Glass button */}
                      <div className="from-primary to-primary/80 shadow-primary/30 group-hover/play:shadow-primary/50 relative rounded-full bg-gradient-to-br p-5 shadow-2xl backdrop-blur-sm transition-all duration-300">
                        <FaPlay className="ml-1 text-3xl text-white" />
                      </div>
                    </motion.button>
                  </div>

                  {/* Year badge */}
                  {video.year && (
                    <div className="bg-primary absolute top-4 right-4 rounded-full px-3 py-1 text-sm font-semibold text-white">
                      {video.year}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
                    {video.category}
                  </div>
                  <h3 className="text-foreground mb-2 text-xl leading-tight font-semibold">
                    {video.title}
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed font-light">
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
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            color="primary"
            radius="sm"
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
