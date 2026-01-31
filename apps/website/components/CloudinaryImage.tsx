"use client";
import { RoundedSize } from "@/utils/types";
import { CldImage } from "next-cloudinary";
import { FC } from "react";

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
  sizes,
  quality = 75,
}) => {
  const combinedClassName = `${rounded} ${className ? className : ""}`.trim();

  // Smart default sizes based on width
  // For full-width images (>= 1000px), use full viewport
  // For medium images (500-999px), use responsive sizing
  // For small images (< 500px), use fixed width
  const defaultSizes =
    sizes ||
    (width >= 1000
      ? "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
      : width >= 500
        ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        : "(max-width: 768px) 100vw, 500px");

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
      sizes={defaultSizes}
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
