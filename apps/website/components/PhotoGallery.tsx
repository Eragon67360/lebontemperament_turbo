"use client";
import React from "react";
import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import { Accordion, AccordionItem } from "@heroui/react";
import { setColumns } from "@/utils/setColumns";
import { PhotoData } from "@/utils/types";

export default function PhotoGallery() {
  const [imagesConcerts, setImagesConcerts] = useState<PhotoData[]>([]);
  const [imagesVieBT, setImagesVieBT] = useState<PhotoData[]>([]);
  const [photoIndexConcerts, setPhotoIndexConcerts] = useState(-1);
  const [photoIndexVieBT, setPhotoIndexVieBT] = useState(-1);

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
        const folderName = "concerts";
        const response = await fetch(`/api/images?folder=${folderName}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setImagesConcerts(data.images);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const folderName = "vie_bt";
        const response = await fetch(`/api/images?folder=${folderName}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setImagesVieBT(data.images);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };
    fetchImages();
  }, []);

  return (
    <>
      <Accordion>
        <AccordionItem
          key="1"
          aria-label="Nos concerts"
          title={
            <p className="text-xl md:text-2xl lg:text-4xl">Nos concerts</p>
          }
          className="font-bold text-xl md:text-2xl lg:text-4xl"
        >
          <MasonryPhotoAlbum
            columns={columns}
            photos={imagesConcerts}
            onClick={({ index: current }) => setPhotoIndexConcerts(current)}
          />
        </AccordionItem>
        <AccordionItem
          key="2"
          aria-label="La vie au BT"
          title={
            <p className="text-xl md:text-2xl lg:text-4xl">La vie au BT</p>
          }
          className="font-bold text-xl md:text-2xl lg:text-4xl"
        >
          <MasonryPhotoAlbum
            columns={columns}
            photos={imagesVieBT}
            onClick={({ index: current }) => setPhotoIndexVieBT(current)}
          />
        </AccordionItem>
      </Accordion>

      <Lightbox
        index={photoIndexConcerts}
        slides={imagesConcerts.map((photo) => ({
          src: photo.src,
          width: photo.width,
          height: photo.height,
        }))}
        open={photoIndexConcerts >= 0}
        close={() => setPhotoIndexConcerts(-1)}
      />

      <Lightbox
        index={photoIndexVieBT}
        slides={imagesVieBT.map((photo) => ({
          src: photo.src,
          width: photo.width,
          height: photo.height,
        }))}
        open={photoIndexVieBT >= 0}
        close={() => setPhotoIndexVieBT(-1)}
      />
    </>
  );
}
