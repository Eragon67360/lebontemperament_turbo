"use client";

import { extractYouTubeId } from "@/utils/youtube";
import { Video } from "@repo/domain/types/videos";
import { useEffect, useState } from "react";
import YouTubeVideo from "./YouTubeVideo";

export const YoutubeVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchYoutubeVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();
      setVideos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYoutubeVideos();
  }, []);
  return (
    <>
      {loading ? (
        <div className="mb-32 flex w-full max-w-[1440px] flex-col px-8">
          <div className="animate-pulse">
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-8 lg:flex-row">
                  <div className="bg-default-200 h-[45dvw] w-[80dvw] rounded lg:h-[281px] lg:w-[500px]"></div>
                  <div className="w-full space-y-4 lg:w-1/2">
                    <div className="bg-default-200 h-12 w-3/4 rounded"></div>
                    <div className="bg-default-200 h-6 w-1/2 rounded"></div>
                    <div className="bg-default-200 h-6 w-1/2 rounded"></div>
                    <div className="bg-default-200 h-6 w-1/2 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {videos.map((video) => (
            <div
              key={video.id}
              className="my-8 flex flex-col gap-0 lg:flex-row lg:gap-8"
            >
              <YouTubeVideo
                videoId={extractYouTubeId(video.youtube_url)}
                title={video.title}
              />
              <div className="flex flex-col pt-8">
                <h2 className="text-default-500 text-xl font-light md:text-2xl lg:text-4xl">
                  {video.title}
                </h2>
                <h2 className="text-foreground mt-8 text-sm font-bold md:text-base lg:text-lg">
                  Auteur/Compositeur :{" "}
                  <span className="font-normal">{video.composer}</span>
                </h2>
                <h2 className="text-foreground text-sm font-bold md:text-base lg:text-lg">
                  Date :{" "}
                  <span className="font-normal">
                    {new Date(video.performance_date).toLocaleDateString(
                      "fr-FR",
                    )}
                  </span>
                </h2>
                <h2 className="text-foreground text-sm font-bold md:text-base lg:text-lg">
                  Lieu : <span className="font-normal">{video.venue}</span>
                </h2>
                {video.soloists && video.soloists.length > 0 && (
                  <h2 className="text-foreground text-sm font-bold md:text-base lg:text-lg">
                    Solistes :{" "}
                    <span className="font-normal">
                      {video.soloists.join(", ")}
                    </span>
                  </h2>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
};
