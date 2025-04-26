import React from "react";

const YouTubeVideo = ({ videoId }: { videoId: string }) => {
  const src = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div>
      <iframe
        src={src}
        className="w-[80dvw] lg:w-[500px] h-[45dvw] lg:h-[281px]"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Embedded YouTube Video"
      ></iframe>
    </div>
  );
};

export default YouTubeVideo;
