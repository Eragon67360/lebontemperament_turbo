"use client";
import { setColumns } from "@/utils/setColumns";
import { PhotoData } from "@/utils/types";
import { Accordion } from "@heroui/react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import Lightbox, { type Labels } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// The lightbox ships English strings; the site is French.
const lightboxLabels: Labels = {
  Previous: "Photo précédente",
  Next: "Photo suivante",
  Close: "Fermer",
  Slide: "Photo",
  Carousel: "Diaporama",
  Lightbox: "Visionneuse de photos",
};

type PhotoGalleryProps = {
  /** Listed on the server (cached); when missing, the folder is fetched here. */
  initialConcerts?: PhotoData[];
  initialVieBT?: PhotoData[];
};

export default function PhotoGallery({
  initialConcerts,
  initialVieBT,
}: PhotoGalleryProps) {
  const [imagesConcerts, setImagesConcerts] = useState<PhotoData[]>(
    initialConcerts ?? [],
  );
  const [imagesVieBT, setImagesVieBT] = useState<PhotoData[]>(
    initialVieBT ?? [],
  );
  const [photoIndexConcerts, setPhotoIndexConcerts] = useState(-1);
  const [photoIndexVieBT, setPhotoIndexVieBT] = useState(-1);
  const [isLoadingConcerts, setIsLoadingConcerts] = useState(!initialConcerts);
  const [isLoadingVieBT, setIsLoadingVieBT] = useState(!initialVieBT);

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
    if (initialConcerts) return;
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
  }, [initialConcerts]);

  useEffect(() => {
    if (initialVieBT) return;
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
  }, [initialVieBT]);

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
    <m.button
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
    </m.button>
  );

  return (
    <>
      <Accordion>
        <Accordion.Item id="1">
          <Accordion.Heading level={2}>
            <Accordion.Trigger className="text-xl font-bold md:text-2xl lg:text-4xl">
              <p className="text-xl md:text-2xl lg:text-4xl">Nos concerts</p>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <AnimatePresence mode="wait">
                {isLoadingConcerts ? (
                  <m.div
                    key="loading-concerts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingSkeleton />
                  </m.div>
                ) : (
                  <m.div
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
                  </m.div>
                )}
              </AnimatePresence>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="2">
          <Accordion.Heading level={2}>
            <Accordion.Trigger className="text-xl font-bold md:text-2xl lg:text-4xl">
              <p className="text-xl md:text-2xl lg:text-4xl">La vie au BT</p>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <AnimatePresence mode="wait">
                {isLoadingVieBT ? (
                  <m.div
                    key="loading-viebt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingSkeleton />
                  </m.div>
                ) : (
                  <m.div
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
                  </m.div>
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
        labels={lightboxLabels}
      />

      <Lightbox
        index={photoIndexVieBT}
        slides={imagesVieBT}
        open={photoIndexVieBT >= 0}
        close={() => setPhotoIndexVieBT(-1)}
        labels={lightboxLabels}
      />
    </>
  );
}
