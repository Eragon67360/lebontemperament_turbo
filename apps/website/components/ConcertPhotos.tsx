"use client"
import { useEffect, useState } from 'react';
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
  const BASE_IMAGE_URL_CONCERTS = "https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/Site/home/concerts/";


  useEffect(() => {
    const photos = [
      "voyage_operas",
      "influences_tziganes",
      "camino_latino",
      "king_arthur",
    ];
    const loadImages = async () => {
      const imagePromises = photos.map((image) =>
        new Promise<PhotoData>((resolve) => {
          const img = new window.Image();
          img.src = `${BASE_IMAGE_URL_CONCERTS}${image}`;
          img.onload = () =>
            resolve({
              src: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              alt: `Image de concert`
            });
        })
      );

      const loadedImages = await Promise.all(imagePromises);
      setPhotoData(loadedImages);
    };

    loadImages();
  }, []);

  return <RowsPhotoAlbum photos={photoData} />;
};

export default ConcertPhotos;
