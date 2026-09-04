const YouTubeVideo = ({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) => {
  const src = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div>
      <iframe
        src={src}
        className="h-[45dvw] w-[80dvw] lg:h-[281px] lg:w-[500px]"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
      ></iframe>
    </div>
  );
};

export default YouTubeVideo;
