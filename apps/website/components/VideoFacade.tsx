"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import { RoundedSize } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import { IoPlay } from "react-icons/io5";

type VideoFacadeProps = {
  /** Full embed URL of the player, loaded only after the click. */
  embedUrl: string;
  /** Who receives the visitor's data once the player loads. */
  provider: string;
  title: string;
  /** Cloudinary public id of a poster image, when the project has one. */
  poster?: string;
  className?: string;
};

/**
 * Click-to-load placeholder for a third-party video player. Before the click
 * the page makes no request to the provider: the poster, when there is one,
 * comes from the project's own Cloudinary library, otherwise a neutral tile
 * shows the title. The player then loads with the visitor's explicit go.
 */
const VideoFacade = ({
  embedUrl,
  provider,
  title,
  poster,
  className = "",
}: VideoFacadeProps) => {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The button disappears on click: keep the keyboard focus on the player.
  useEffect(() => {
    if (loaded) iframeRef.current?.focus();
  }, [loaded]);

  return (
    <div className={`bg-primary-900 relative overflow-hidden ${className}`}>
      {loaded ? (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          aria-label={`Lire la vidéo « ${title} » (lecteur ${provider})`}
          className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:gap-3 sm:p-4"
        >
          {poster ? (
            <CloudinaryImage
              src={poster}
              alt=""
              width={800}
              height={450}
              rounded={RoundedSize.NONE}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="from-primary-700 to-primary-900 absolute inset-0 bg-linear-to-br"
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45"
          />
          <span
            aria-hidden="true"
            className="bg-primary-600 group-hover:bg-primary-500 relative flex size-10 items-center justify-center rounded-full shadow-lg transition-colors sm:size-14"
          >
            <IoPlay className="ml-0.5 size-5 sm:ml-1 sm:size-7" />
          </span>
          <span className="relative line-clamp-1 max-w-md text-sm font-medium drop-shadow-md sm:line-clamp-2 sm:text-base">
            {title}
          </span>
          <span className="relative max-w-sm text-[11px] leading-snug text-white/85 drop-shadow-md sm:text-xs">
            Lecture via {provider} : en lançant la vidéo, vous acceptez que{" "}
            {provider} reçoive des données de navigation.
          </span>
        </button>
      )}
    </div>
  );
};

export default VideoFacade;
