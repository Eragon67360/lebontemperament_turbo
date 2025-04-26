'use client'
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
  const BASE_IMAGE_URL_CDS = "https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/Site/cds/";

  useEffect(() => {
    const pochettes = [
      "camino_latino",
      "king_arthur",
      "vent_d_est"
    ];

    const loadImages = async () => {
      const imagePromises = pochettes.map(image => new Promise<PhotoData>((resolve) => {
        const img = new window.Image();
        img.src = `${BASE_IMAGE_URL_CDS}${image}`;
        img.onload = () => resolve({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          alt: `Pochette de CD`
        });
      }));

      const loadedImages = await Promise.all(imagePromises);
      setPochetteData(loadedImages);
    };

    loadImages();
  }, []);

  return <RowsPhotoAlbum photos={pochetteData} />;
};

export default CDPochettePhotos;
