"use client";

import { Video } from "@/types/videos";
import React, { useEffect, useState } from "react";
import YouTubeVideo from "./YouTubeVideo";
import { extractYouTubeId } from "@/utils/youtube";

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
        <div className="px-8 max-w-[1440px] w-full flex flex-col mb-32">
          <div className="animate-pulse">
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col lg:flex-row gap-8">
                  <div className="w-[80dvw] lg:w-[500px] h-[45dvw] lg:h-[281px] bg-gray-200 rounded"></div>
                  <div className="w-full lg:w-1/2 space-y-4">
                    <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
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
              className="my-8 flex flex-col lg:flex-row gap-0 lg:gap-8"
            >
              <YouTubeVideo videoId={extractYouTubeId(video.youtube_url)} />
              <div className="flex flex-col pt-8">
                <h2 className="text-xl md:text-2xl lg:text-4xl text-[#BDBDBD] font-light">
                  {video.title}
                </h2>
                <h2 className="text-sm md:text-base lg:text-lg font-bold mt-8">
                  Auteur/Compositeur :{" "}
                  <span className="font-normal">{video.composer}</span>
                </h2>
                <h2 className="text-sm md:text-base lg:text-lg font-bold">
                  Date :{" "}
                  <span className="font-normal">
                    {new Date(video.performance_date).toLocaleDateString(
                      "fr-FR",
                    )}
                  </span>
                </h2>
                <h2 className="text-sm md:text-base lg:text-lg font-bold">
                  Lieu : <span className="font-normal">{video.venue}</span>
                </h2>
                {video.soloists && video.soloists.length > 0 && (
                  <h2 className="text-sm md:text-base lg:text-lg font-bold">
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
