"use client";
import { motion } from "motion/react";

interface SkeletonImageProps {
  width: number;
  height: number;
  className?: string;
  dataTestId?: string;
}

const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width,
  height,
  className = "",
  dataTestId = "skeleton-image",
}) => {
  return (
    <motion.div
      className={`animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 ${className}`}
      style={{ width, height }}
      data-testid={dataTestId}
      role="img"
      aria-label="Image en cours de chargement"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default SkeletonImage;
