export function YoutubeIframe({
  videoId,
  title = "YouTube Video",
}: {
  videoId: string;
  title?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        className="absolute top-0 left-0 h-full w-full"
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
