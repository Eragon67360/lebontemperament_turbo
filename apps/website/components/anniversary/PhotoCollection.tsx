"use client";

import { Button } from "@heroui/react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { FaExpand, FaImages } from "react-icons/fa";

interface PhotoItem {
  id: string;
  title: string;
  year?: number;
  category: string;
  imageUrl: string; // Placeholder image URL
  description?: string;
}

// Placeholder photo data - to be replaced with real content
const photoCollections: PhotoItem[] = [
  {
    id: "1",
    title: "Concert Inaugural 1984",
    year: 1984,
    category: "Concert",
    imageUrl: "https://placehold.co/600x400/FF6B6B/FFFFFF?text=Concert+1984",
    description: "Le tout premier concert du Bon Tempérament",
  },
  {
    id: "2",
    title: "Enregistrement Studio",
    year: 1990,
    category: "Studio",
    imageUrl: "https://placehold.co/600x400/4ECDC4/FFFFFF?text=Studio+1990",
    description: "Séance d'enregistrement du premier CD",
  },
  {
    id: "3",
    title: "Tournée Européenne",
    year: 1995,
    category: "Tournée",
    imageUrl: "https://placehold.co/600x400/45B7D1/FFFFFF?text=Tournee+1995",
    description: "Moments partagés lors de la tournée",
  },
  {
    id: "4",
    title: "Répétition Générale",
    year: 2000,
    category: "Répétition",
    imageUrl: "https://placehold.co/600x400/FFA07A/FFFFFF?text=Repetition+2000",
    description: "Préparation avant le grand concert",
  },
  {
    id: "5",
    title: "Anniversaire 25 Ans",
    year: 2010,
    category: "Événement",
    imageUrl: "https://placehold.co/600x400/98D8C8/FFFFFF?text=25+Ans",
    description: "Célébration des 25 ans d'existence",
  },
  {
    id: "6",
    title: "Concert en Plein Air",
    year: 2015,
    category: "Concert",
    imageUrl:
      "https://placehold.co/600x400/F7DC6F/FFFFFF?text=Concert+Exterieur",
    description: "Performance mémorable en extérieur",
  },
  {
    id: "7",
    title: "Atelier Jeunes",
    year: 2020,
    category: "Éducation",
    imageUrl: "https://placehold.co/600x400/BB8FCE/FFFFFF?text=Atelier",
    description: "Transmission aux nouvelles générations",
  },
  {
    id: "8",
    title: "40 Ans - Célébration",
    year: 2024,
    category: "Événement",
    imageUrl: "https://placehold.co/600x400/85C1E2/FFFFFF?text=40+Ans",
    description: "Le grand anniversaire des 40 ans du Bon Tempérament",
  },
  {
    id: "9",
    title: "Portraits des Membres",
    year: 2024,
    category: "Portrait",
    imageUrl: "https://placehold.co/600x400/FFB6C1/FFFFFF?text=Portraits",
    description: "Galerie de portraits des membres",
  },
];

const PhotoCollection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const categories = [
    "Tous",
    ...Array.from(new Set(photoCollections.map((item) => item.category))),
  ];

  const filteredPhotos =
    selectedCategory === "Tous"
      ? photoCollections
      : photoCollections.filter((item) => item.category === selectedCategory);

  return (
    <section
      id="photos"
      ref={sectionRef}
      className="relative bg-gradient-to-b from-green-50 to-emerald-50 py-20 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-4">
              <FaImages className="text-4xl text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Galerie Photo
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Explorez 40 ans de souvenirs visuels et de moments capturés du Bon
            Tempérament
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
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : ""
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Photo grid - Masonry style with variations */}
        <div className="columns-1 gap-3 md:columns-2 md:gap-4 lg:columns-3">
          {filteredPhotos.map((photo, index) => {
            const randomRotation = (index % 5) * 0.4 - 0.8; // -0.8 à 0.8
            const randomDelay = index * 0.07 + (index % 4) * 0.02;
            const columnSpan =
              index % 7 === 2 ? "md:col-span-2 lg:col-span-1" : "";

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 50, rotate: randomRotation }}
                animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : {}}
                transition={{
                  delay: randomDelay,
                  duration: 0.55 + (index % 4) * 0.05,
                  type: "spring",
                  stiffness: 120 + index * 8,
                }}
                whileHover={{ scale: 1.04, rotate: randomRotation * 0.4 }}
                className={`group relative mb-3 overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl md:mb-4 dark:bg-gray-800 ${columnSpan}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Overlay content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h3 className="mb-1 text-lg font-bold text-white">
                      {photo.title}
                    </h3>
                    {photo.year && (
                      <p className="text-sm text-white/90">{photo.year}</p>
                    )}
                    {photo.description && (
                      <p className="mt-2 text-xs text-white/80">
                        {photo.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-white">
                      <FaExpand className="text-sm" />
                      <span className="text-xs">Cliquer pour agrandir</span>
                    </div>
                  </div>

                  {/* Year badge */}
                  {photo.year && (
                    <div className="absolute top-4 right-4 rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                      {photo.year}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load more */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            endContent={<FaImages />}
          >
            Voir Plus de Photos
          </Button>
        </motion.div>
      </div>

      {/* Photo modal - placeholder for lightbox */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="h-auto w-full rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/30"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default PhotoCollection;
