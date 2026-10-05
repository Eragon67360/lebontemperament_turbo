import VideoFacade from "./VideoFacade";

/** Privacy-enhanced YouTube player: no cookie before the visitor plays. */
export const youTubeEmbedUrl = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

const YouTubeVideo = ({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) => {
  return (
    <div>
      <VideoFacade
        embedUrl={youTubeEmbedUrl(videoId)}
        provider="YouTube"
        title={title}
        className="h-[45dvw] w-[80dvw] lg:h-[281px] lg:w-[500px]"
      />
    </div>
  );
};

export default YouTubeVideo;
