"use client";
import React, { FC } from "react";
import { CldImage } from "next-cloudinary";
import { RoundedSize } from "@/utils/types";

type CloudinaryImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  rounded: RoundedSize;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

const CloudinaryImage: FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  rounded,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
}) => {
  const combinedClassName = `${rounded} ${className ? className : ""}`.trim();

  return (
    <CldImage
      format="auto"
      alt={alt}
      src={src}
      width={width}
      height={height}
      className={combinedClassName}
      loading={priority ? "eager" : "lazy"}
      quality={quality}
      sizes={sizes}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={(e) => {
        console.error(`Failed to load image: ${src}`);
        // Fallback to a placeholder or error state
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
      }}
    />
  );
};

export default CloudinaryImage;
