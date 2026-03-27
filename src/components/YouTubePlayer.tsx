interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer = ({ videoId }: YouTubePlayerProps) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl shadow-primary/10">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default YouTubePlayer;
