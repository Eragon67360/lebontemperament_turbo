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

const CDPochettePhotos = () => {
  const [pochetteData, setPochetteData] = useState<PhotoData[]>([]);
  const BASE_IMAGE_URL_CDS =
    "https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/Site/cds/";

  useEffect(() => {
    const CD_TITLES: Record<string, string> = {
      camino_latino: "Camino Latino",
      king_arthur: "Roi Arthur",
      vent_d_est: "Vent d'Est",
    };
    const loadImages = async () => {
      const imagePromises = Object.entries(CD_TITLES).map(
        ([slug, title]) =>
          new Promise<PhotoData>((resolve) => {
            const img = new window.Image();
            img.src = `${BASE_IMAGE_URL_CDS}${slug}`;
            img.onload = () =>
              resolve({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                alt: `Pochette du CD ${title}`,
              });
          }),
      );

      const loadedImages = await Promise.all(imagePromises);
      setPochetteData(loadedImages);
    };

    loadImages();
  }, []);

  return <RowsPhotoAlbum photos={pochetteData} />;
};

export default CDPochettePhotos;
