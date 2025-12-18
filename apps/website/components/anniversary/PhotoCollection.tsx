"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import type { Photo } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { FaImages, FaTimes } from "react-icons/fa";

interface PhotoCollectionProps {
  photos: Photo[];
}

const PhotoCollection = ({ photos }: PhotoCollectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const categories = [
    "Tous",
    ...Array.from(new Set(photos.map((item) => item.category))),
  ];

  const filteredPhotos =
    selectedCategory === "Tous"
      ? photos
      : photos.filter((item) => item.category === selectedCategory);

  return (
    <section
      id="photos"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    >
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/5 absolute top-1/4 right-0 h-112.5 w-112.5 rounded-full blur-[100px]" />
        <div className="bg-primary/5 absolute bottom-1/4 left-0 size-75 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaImages className="text-4xl" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            Galerie Photo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Explorez 40 ans de souvenirs visuels et de moments capturés du Bon
            Tempérament.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mb-12 flex w-fit flex-wrap justify-center gap-2 rounded-full bg-slate-200/50 p-1 dark:bg-slate-800/50"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                selectedCategory === category
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {selectedCategory === category && (
                <motion.div
                  layoutId="photo-category-pill"
                  className="bg-primary absolute inset-0 -z-10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {category}
            </button>
          ))}
        </motion.div>

        <div className="columns-1 gap-6 md:columns-2 md:gap-8 lg:columns-3">
          {filteredPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="group relative mb-6 cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/30"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative">
                <CloudinaryImage
                  src={photo.image_url}
                  alt={photo.title}
                  width={800}
                  height={600}
                  rounded={RoundedSize.NONE}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <h3 className="text-lg font-medium">{photo.title}</h3>
                  <p className="text-sm font-light text-white/80">
                    {photo.year}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <motion.button
            variants={{
              initial: { color: "var(--color-primary)" },
              hover: { color: "#ffffff" },
            }}
            initial="initial"
            whileHover="hover"
            transition={{ duration: 0.3 }}
            className="group border-primary/40 text-primary hover:border-primary/80 dark:border-primary/50 dark:text-primary relative overflow-hidden rounded-md border bg-transparent px-8! py-3 font-medium transition-colors duration-300"

            // onClick={() => console.log("Button clicked!")}
          >
            {/* The filling div animates based on the parent's state */}
            <motion.div
              className="bg-primary absolute inset-0 -z-10"
              variants={{
                initial: { y: "100%" },
                hover: { y: "0%" },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />

            <motion.span>
              Voir Plus de Photos
              {/* <FaImages /> */}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              layoutId={selectedPhoto.id}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CloudinaryImage
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                width={1600}
                height={1200}
                rounded={RoundedSize.NONE}
                className="block h-full w-full object-contain"
                quality={90}
                priority
              />
              <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-black/70 to-transparent p-6 text-white">
                <h3 className="text-xl font-medium">{selectedPhoto.title}</h3>
                <p className="mt-1 text-sm font-light text-white/80">
                  {selectedPhoto.description}
                </p>
              </div>
            </motion.div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 rounded-full bg-black/20 p-2 text-white/60 transition-colors hover:text-white"
              aria-label="Fermer la photo"
            >
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PhotoCollection;
