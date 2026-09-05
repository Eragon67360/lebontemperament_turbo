"use client";
import { setColumns } from "@/utils/setColumns";
import { PhotoData } from "@/utils/types";
import { Accordion } from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function PhotoGallery() {
  const [imagesConcerts, setImagesConcerts] = useState<PhotoData[]>([]);
  const [imagesVieBT, setImagesVieBT] = useState<PhotoData[]>([]);
  const [photoIndexConcerts, setPhotoIndexConcerts] = useState(-1);
  const [photoIndexVieBT, setPhotoIndexVieBT] = useState(-1);
  const [isLoadingConcerts, setIsLoadingConcerts] = useState(true);
  const [isLoadingVieBT, setIsLoadingVieBT] = useState(true);

  const [columns, setColumnsState] = useState<number>(2);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      setColumnsState(setColumns(width));
    };

    // Set initial columns based on the current window width
    updateColumns();

    // Add event listener to handle window resize
    window.addEventListener("resize", updateColumns);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateColumns);
    };
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoadingConcerts(true);
        const folderName = "concerts";
        const response = await fetch(`/api/images?folder=${folderName}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setImagesConcerts(data.images);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setIsLoadingConcerts(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoadingVieBT(true);
        const folderName = "vie_bt";
        const response = await fetch(`/api/images?folder=${folderName}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setImagesVieBT(data.images);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setIsLoadingVieBT(false);
      }
    };
    fetchImages();
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface-tertiary h-64 w-full rounded" />
        ))}
      </div>
    </div>
  );

  // Custom render function for the interactive button wrapper to add motion
  const renderAnimatedButton = ({ ref, children, ...restProps }: any) => (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      {...restProps}
    >
      {children}
    </motion.button>
  );

  return (
    <>
      <Accordion>
        <Accordion.Item id="1">
          <Accordion.Heading>
            <Accordion.Trigger className="text-xl font-bold md:text-2xl lg:text-4xl">
              <p className="text-xl md:text-2xl lg:text-4xl">Nos concerts</p>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <AnimatePresence mode="wait">
                {isLoadingConcerts ? (
                  <motion.div
                    key="loading-concerts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content-concerts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MasonryPhotoAlbum
                      columns={columns}
                      photos={imagesConcerts}
                      onClick={({ index: current }) =>
                        setPhotoIndexConcerts(current)
                      }
                      render={{ button: renderAnimatedButton }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="2">
          <Accordion.Heading>
            <Accordion.Trigger className="text-xl font-bold md:text-2xl lg:text-4xl">
              <p className="text-xl md:text-2xl lg:text-4xl">La vie au BT</p>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <AnimatePresence mode="wait">
                {isLoadingVieBT ? (
                  <motion.div
                    key="loading-viebt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content-viebt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MasonryPhotoAlbum
                      columns={columns}
                      photos={imagesVieBT}
                      onClick={({ index: current }) =>
                        setPhotoIndexVieBT(current)
                      }
                      render={{ button: renderAnimatedButton }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Lightbox
        index={photoIndexConcerts}
        slides={imagesConcerts}
        open={photoIndexConcerts >= 0}
        close={() => setPhotoIndexConcerts(-1)}
      />

      <Lightbox
        index={photoIndexVieBT}
        slides={imagesVieBT}
        open={photoIndexVieBT >= 0}
        close={() => setPhotoIndexVieBT(-1)}
      />
    </>
  );
}
