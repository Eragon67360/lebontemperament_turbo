// components/ConcertPoster.tsx
import Image from "next/image";

interface ConcertPosterProps {
  src: string;
  alt: string;
  className: string;
}

export function ConcertPoster({ src, alt, className }: ConcertPosterProps) {
  return (
    <div
      className={
        "relative h-auto w-52 max-w-[200px] overflow-hidden rounded-lg md:max-w-[250px] " +
        className
      }
    >
      <Image
        src={src}
        alt={alt}
        width={200}
        height={356}
        className="rounded-lg object-contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
      />
    </div>
  );
}
