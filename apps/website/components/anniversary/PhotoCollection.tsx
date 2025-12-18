"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import type { Photo } from "@/types/anniversary";
import { RoundedSize } from "@/utils/types";
import { Button } from "@heroui/react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { FaExpand, FaImages } from "react-icons/fa";

interface PhotoCollectionProps {
  photos: Photo[];
}

const PhotoCollection = ({ photos }: PhotoCollectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [40, -40]);
  const y2 = useTransform(scrollY, [0, 1000], [-20, 20]);

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
      className="bg-default-50 relative overflow-hidden py-16"
    >
      {/* Parallax background orbs */}
      <motion.div
        style={{ y }}
        className="bg-primary/10 absolute top-1/4 right-0 h-[450px] w-[450px] rounded-full blur-[100px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="bg-primary/5 absolute bottom-1/4 left-0 h-[300px] w-[300px] rounded-full blur-[80px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mb-6 flex justify-center"
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="bg-primary/30 absolute inset-0 scale-110 rounded-full blur-2xl" />

              {/* Glass icon */}
              <div className="from-primary to-primary/80 shadow-primary/20 relative rounded-full bg-gradient-to-br p-5 shadow-xl">
                <FaImages className="text-5xl text-white" />
              </div>
            </div>
          </motion.div>

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
              Galerie Photo
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Explorez 40 ans de souvenirs visuels et de moments capturés du Bon
            Tempérament
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

        {/* Photo grid - Masonry style with variations */}
        <div className="columns-1 gap-6 md:columns-2 md:gap-8 lg:columns-3">
          {filteredPhotos.map((photo, index) => {
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group border-primary/10 bg-background/50 hover:shadow-primary/10 relative mb-6 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl md:mb-8"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <CloudinaryImage
                    src={photo.image_url}
                    alt={photo.title}
                    width={800}
                    height={600}
                    rounded={RoundedSize.NONE}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Overlay content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      {photo.title}
                    </h3>
                    {photo.year && (
                      <p className="text-sm text-white/90">{photo.year}</p>
                    )}
                    {photo.description && (
                      <p className="mt-2 text-xs font-light text-white/80">
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
                    <div className="bg-primary absolute top-4 right-4 rounded-full px-3 py-1 text-sm font-semibold text-white">
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
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Button
            size="lg"
            color="primary"
            radius="sm"
            endContent={<FaImages />}
          >
            Voir Plus de Photos
          </Button>
        </motion.div>
      </div>

      {/* Photo modal - lightbox */}
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
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <CloudinaryImage
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title}
              width={1600}
              height={1200}
              rounded={RoundedSize.LG}
              className="max-h-[85vh] w-auto object-contain"
              quality={90}
              priority
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
