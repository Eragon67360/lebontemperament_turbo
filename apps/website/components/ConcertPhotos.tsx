"use client";
import { useEffect, useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
interface PhotoData {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const ConcertPhotos = () => {
  const [photoData, setPhotoData] = useState<PhotoData[]>([]);
  const BASE_IMAGE_URL_CONCERTS =
    "https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/Site/home/concerts/";

  useEffect(() => {
    const CONCERT_TITLES: Record<string, string> = {
      voyage_operas: "Voyage en Opéras",
      influences_tziganes: "Influences Tziganes",
      camino_latino: "Camino Latino",
      king_arthur: "King Arthur",
    };
    const loadImages = async () => {
      const imagePromises = Object.entries(CONCERT_TITLES).map(
        ([slug, title]) =>
          new Promise<PhotoData>((resolve) => {
            const img = new window.Image();
            img.src = `${BASE_IMAGE_URL_CONCERTS}${slug}`;
            img.onload = () =>
              resolve({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                alt: `Photographie du concert ${title}`,
              });
          }),
      );

      const loadedImages = await Promise.all(imagePromises);
      setPhotoData(loadedImages);
    };

    loadImages();
  }, []);

  return <RowsPhotoAlbum photos={photoData} />;
};

export default ConcertPhotos;
