export function YoutubeIframe({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full pt-[56.25%]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}